# Magic-Resume 前端接入 v2 后端 — 设计方案 v1

> 状态：v1 设计稿，待评审
> 范围：**前端 `Magic-Resume`（apps/web）** 适配 `Magic-Core` v2 三服务后端；不改后端业务逻辑（仅只读参照）。
> 决策（已确认）：① 工作流 SSE **重建为 v2 原生事件**；② 范围 **完整对齐 v2**；③ 拓扑 **本地 proxy 网关镜像生产 nginx，线上走 nginx**。

---

## 0. 背景与目标

### 0.1 背景

后端 `Magic-Core` 已从单体 NestJS（端口 3111）拆为 v2 三服务，经 nginx 按路径前缀对外暴露为**单一 origin**：

| 服务 | 端口 | 职责 |
|---|---|---|
| platform-api | 3111 | CRUD：resumes / users / notifications / stats / analytics / webhooks / auth |
| agent-service | 3112 | chat / graph 工作流 / interview（含 realtime WebSocket）/ pdf / translate |
| render-service | 3113 | 内部 HTML→PDF，**前端不直接访问** |

前端仍按旧契约接入，存在 4 类会导致功能**直接报错/失效**的不匹配：

1. **agent 类请求打错服务**：`BACKEND_URL` 默认 `http://localhost:8000`（已废弃 Python 后端），dev 实配 `3111`（platform-api 无 agent 路由）→ chat/graph/pdf/translate/interview 全 404。
2. **agent-service 现强制鉴权**（全局 `ClerkAuthGuard` + `@Roles('user','admin')`），但前端 Next.js 服务端代理路由调后端时**未带 Authorization** → 401/403。
3. **工作流 SSE 格式变了**：前端 hook 按旧版 LangGraph `{nodeId: state}` 解析（`Object.keys(chunk)[0]`），v2 改为 typed `AgentSseEvent`（`{type, payload}`）+ 开场 `agent_plan` 声明步骤；旧节点仅以 `payload.legacyChunk` 部分保留，且 v2 rewrite 是精简 3 步（vs 前端 ~15 个 V7 节点的揭示 UI）。
4. **JSON 响应信封**：agent-service 非流式 JSON 经 `TransformInterceptor` 包成 `{code,data,message,timestamp}`，前端 interview/translate-text/multi-persona 按裸 JSON 读取 → 拿到信封而非业务数据。

### 0.2 目标

- 前端在 **dev 与 prod 都只面对单一 origin**，靠路径前缀做服务拆分（dev=本地 proxy 网关，prod=nginx）。
- 所有 agent-service 调用**正确携带 Clerk 凭证**。
- 工作流 / chat 的流式 UI **重建为 v2 原生事件契约**，可动态渲染步骤。
- 非流式 JSON **统一信封解包**；补齐缺失的 polish-text；清理冗余 rewrite。

### 0.3 非目标

- 不改后端工作流步骤数 / 事件设计（v2 rewrite 就是 3 步，UI 随之变少属预期）。
- 不引入 docker/nginx 作为 dev 强依赖（dev 用纯 Node proxy）。
- polish 若 `/api/chat` 聚合效果不佳需后端补端点 —— 单列为后续，不在本次前端范围内强求。

---

## 1. v2 真实契约（改造依据，已对照源码核实）

### 1.1 生产 nginx 路由（`Magic-Core/deploy/nginx.conf`）

```nginx
location ~ ^/api/(chat|graph|agent|pdf|translate|interview)  →  agent-service:3112   # 含 WS upgrade
location /api/                                                →  platform-api:3111
```
> dev proxy 网关必须**逐字镜像**此正则与 WS 升级行为。

### 1.2 工作流 SSE 事件序列（`POST /api/graph/{rewrite,analyze,research}`）

来源：`workflow-runner.service.ts`、`rewrite.workflow.ts`、`shared/types.ts`。每条 SSE 为 `data: {AgentSseEvent}\n\n`。

1. `agent_plan` — `payload:{ workflowId, steps:[{id,name}] }`（开场声明全部步骤）
2. 每个 step 顺序：
   - `step_started` — `payload:{ workflowId, stepId, stepName, taskType }`
   - 多个 `message_chunk` — `content`（该步流式文本；带 `payload.workflowStepId`）
   - 可选 `llm_started|llm_usage|tool_started|tool_result|error`（带 `payload.workflowId,workflowStepId`）
   - `step_completed` — `payload:{ workflowId, stepId, stepName, parsed }`
3. rewrite 额外：strategy 步后发 `suggestion`；结尾发 `resume_patch` — `payload:{ patch, legacyChunk:{ combine_sections:{ optimizedResume, optimizedSections } } }`
4. 结尾 `done`（`AgentStreamService.runSse` 自动）；异常 `error`

`AgentEventType` 全集（`shared/types.ts`）：`run_started, agent_plan, plan_update, skill_loaded, subagent_started, subagent_completed, step_started, llm_started, llm_usage, tool_started, tool_result, tool_completed, message_chunk, resume_patch, resume_update, resume_analysis, translation_result, pdf_result, interview_question, critique, suggestion, step_completed, run_completed, run_failed, done, error`。

### 1.3 chat SSE（`POST /api/chat`）

`message_chunk` + v2 harness 新增 `plan_update / skill_loaded / subagent_started / subagent_completed / resume_patch / resume_update / tool_started / tool_result / llm_usage`，结尾 `done`，异常 `error`。

### 1.4 信封边界

- **不过信封**（`@Res()` 手写流/二进制）：`/api/chat`、`/api/graph/*`、`/api/translate/stream`、`/api/pdf/generate`、`/api/pdf/parse` → 流/二进制原样。
- **过信封**（普通 return JSON → `{code,data,message,timestamp}`，需 `.data.data`）：`/api/interview/start|chat`、`/api/translate/text`、`/api/graph/analyze-resume-multi`。

### 1.5 已兼容、无需改

- `/api/translate/stream`：`streamLegacyTranslation` 仍发 `translation_chunk / translation_done(translated_text) / json_start / json_done(resume_json)`，与前端解析一致。
- `/api/translate/text` 字段名 `translated_text / resume_json` 与前端一致（仅多一层信封，见 3.6）。
- realtime WS 升级用 Redis 能力 token 校验（`/api/interview/realtime/:sessionId`），协议不变。
- `httpClient.api` 既有调用方已手动 `response.data.data` 解包，platform-api 信封不变 → CRUD 不受影响。

---

## 2. 目标架构：dev proxy 网关 + 单一 origin

```
                         浏览器                         Next.js 服务端 (SSR/route)
                            │                                   │
      httpClient.api/agent  │  (单一 origin)                    │  serverFetchBackend()
      + realtime ws://      ▼                                   ▼
                  ┌──────────────────────┐
        dev:      │  dev-gateway (Node)  │   ← 镜像 nginx 正则, ws:true
        prod:     │  nginx               │
                  └──────────┬───────────┘
                   /api/(chat|graph|agent|pdf|translate|interview)
                   ┌──────────┴───────────┐
                   ▼                       ▼
            agent-service:3112      platform-api:3111
```

- 浏览器与 SSR 都只配 **一个后端 origin**（dev=网关，prod=nginx）。
- `httpClient.api` 与 `httpClient.agent` 共用同一 baseURL，仅靠路径前缀让网关拆分（保留两实例仅为语义清晰）。

---

## 3. 改动点详解（含 before/after 草图）

> 代码为**示意草图**，落地以实际类型为准。

### 3.1 dev 网关 + base URL 配置

**新增 `Magic-Resume/scripts/dev-gateway.mjs`**（`http-proxy`，`ws:true`，镜像 nginx）：
```js
import http from 'node:http';
import httpProxy from 'http-proxy';
const AGENT = 'http://127.0.0.1:3112', API = 'http://127.0.0.1:3111';
const AGENT_RE = /^\/api\/(chat|graph|agent|pdf|translate|interview)(\/|$)/;
const proxy = httpProxy.createProxyServer({ changeOrigin: true });
const pick = (url) => (AGENT_RE.test(url) ? AGENT : API);
const server = http.createServer((req, res) =>
  proxy.web(req, res, { target: pick(req.url) }, (e) => { res.writeHead(502); res.end(String(e)); }));
server.on('upgrade', (req, socket, head) =>           // realtime interview WS
  proxy.ws(req, socket, head, { target: pick(req.url) }));
server.listen(8787, () => console.log('[dev-gateway] :8787 → agent:3112 / api:3111'));
```

**`package.json`（根）/ `apps/web/package.json`**：加脚本并与 `next dev` 并行
```jsonc
"dev:gateway": "node scripts/dev-gateway.mjs",
"dev": "concurrently -n web,gw \"next dev\" \"pnpm dev:gateway\""
```

**`apps/web/.env.local`（dev）/ `.env.example`**：三个变量统一指向同一 origin
```dotenv
# dev → 本地网关；prod → nginx origin
NEXT_PUBLIC_CLOUD_API_URL=http://localhost:8787
NEXT_PUBLIC_BACKEND_URL=http://localhost:8787
BACKEND_URL=http://localhost:8787
```

**`apps/web/src/lib/api/httpClient.ts`**：修死兜底
```diff
- agent: createClient(process.env.BACKEND_URL || 'http://localhost:8000'),
+ agent: createClient(process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || 'http://localhost:8787'),
```

### 3.2 Next.js 服务端代理路由：转发 Clerk token（修 401）

受影响（均 `getServerUserId()` 鉴权但未带 token）：`app/api/{chat-agent,analyze-resume,analyze_multi,generate-pdf}/route.ts`、`app/api/optimizer-agent/{rewrite,analyze,research}/route.ts`、`app/api/pdf/parse/route.ts`。

**抽公共帮助 `apps/web/src/lib/auth/serverFetchBackend.ts`**：
```ts
import { auth } from '@clerk/nextjs/server';
export async function serverFetchBackend(path: string, init: RequestInit = {}) {
  const { getToken } = await auth();
  const token = await getToken();
  return fetch(`${process.env.BACKEND_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init.headers || {}),
               ...(token ? { Authorization: `Bearer ${token}` } : {}) },
  });
}
```
各 route 由 `fetch(\`${BACKEND_URL}/api/...\`)` 改为 `serverFetchBackend('/api/...', {...})`（multipart 的 pdf/parse 不写死 Content-Type）。

### 3.3 工作流 hook：重建为 v2 原生事件（核心工作量）

受影响：`apps/web/src/hooks/useResumeOptimizer.ts`(rewrite)、`useResumeAnalyzer.ts`(analyze-resume)、research 消费方。

**删除**旧节点解析：
```ts
// ❌ 旧：把整条 SSE 当 { nodeId: state }
const nodeState = Object.values(chunk)[0];      // 删
const nodeId = Object.keys(chunk)[0];           // 删
```
**改为** `AgentSseEvent` 状态机（草图）：
```ts
const onEvent = (e: AgentSseEvent) => {
  switch (e.type) {
    case 'agent_plan':                            // 动态初始化步骤列表
      setSteps(e.payload.steps.map(s => ({ id: s.id, title: s.name, status: 'pending' })));
      break;
    case 'step_started':
      setStepStatus(e.payload.stepId, 'in_progress'); break;
    case 'message_chunk':
      appendStepLog(e.payload?.workflowStepId, e.content); break;
    case 'step_completed':
      setStepStatus(e.payload.stepId, 'done'); break;
    case 'resume_patch':                          // 取最终简历
      applyResume(e.payload?.patch ?? e.payload?.legacyChunk?.combine_sections?.optimizedResume);
      break;
    case 'error': setError(e.error); break;
    case 'done':  finish(); break;
    default: break;   // tool_*/llm_usage/suggestion 等：可选展示，未知忽略
  }
};
```
- 步骤标题：优先用后端 `agent_plan` 的 `name`；本地写死的 `nodeTitles`/`v7ResearchNodes` 改为**仅作 i18n 兜底映射**，不再驱动步骤存在性。
- `legacyChunk` 仅作 `resume_patch` 结果兜底来源，**不**回退「整条 SSE 当节点状态」。

### 3.4 multi-persona（JSON，信封解包）

`apps/web/src/app/api/analyze_multi/route.ts` 或 `hooks/useMultiPersonaAnalyzer.ts`：`/api/graph/analyze-resume-multi` 现走信封 → 取 `body.data`（解包后再交给 hook）。

### 3.5 chat hook：消费 v2 事件类型

chat SSE 消费方（`/api/chat-agent` 解析处）识别并处理：`message_chunk`(正文)、`resume_patch`/`resume_update`(应用到简历)、`plan_update`(待办)、`skill_loaded`(技能徽章)、`subagent_started/completed`、`tool_started/result`、`llm_usage`、`done`、`error`；未知 type 安全忽略（保证前向兼容）。

### 3.6 JSON 信封解包（interview / translate-text）

**`apps/web/src/lib/api/interview.ts`**：
```diff
- start: async (params) => { const r = await httpClient.agent.post(AGENT_ROUTES.interview.start, params); return r.data; },
+ start: async (params) => { const r = await httpClient.agent.post(AGENT_ROUTES.interview.start, params); return r.data.data; },
- chat:  async (params) => { const r = await httpClient.agent.post(AGENT_ROUTES.interview.chat,  params); return r.data; },
+ chat:  async (params) => { const r = await httpClient.agent.post(AGENT_ROUTES.interview.chat,  params); return r.data.data; },
```
**`apps/web/src/lib/api/translate.ts`**：`/translate/text` 非流式结果 `.data.data` 解包（字段名已匹配，无需改）；`/translate/stream` 裸 SSE 不变。

### 3.7 realtime interview WebSocket

`apps/web/src/hooks/useRealtimeInterview.ts`：
- ws origin 由 `NEXT_PUBLIC_BACKEND_URL` 推导 → 指向网关/nginx（dev 网关已支持 ws upgrade，见 3.1）。
- 去掉 query 的 `api_key` / `base_url`（v2 服务端持 `OPENAI_API_KEY`，不再接受前端 BYOK）；保留 `model`，可加 `role`。
- 前置 `POST /api/interview/start` 现需 Clerk 鉴权（httpClient.agent 拦截器已带 token）+ 信封解包（3.6）才能拿到 `session_id`。

### 3.8 polish-text 缺口

**新增 `apps/web/src/app/api/polish-text/route.ts`**：服务端用 `serverFetchBackend` 代理到 agent-service `POST /api/chat`（`mode:'optimize'` 或 `general`，收集流式 `message_chunk` 聚合），返回 `{ polishedText }`。`TiptapEditor.tsx` 调用方不变。
> 风险：`/api/chat` 是对话流，需在 route 内收敛为纯文本；若不稳，单列后端补轻量 polish 端点。

### 3.9 next.config 清理

`apps/web/next.config.ts`：移除/调整 `/api/interview/*` → `BACKEND_URL` 的 rewrite（与统一网关重复，且 Next rewrite 对 WS 升级不可靠）；确认 `BACKEND_URL`/`NEXT_PUBLIC_*` env 透传正确。

---

## 4. 文件清单

**前端 · 改**
- `apps/web/src/lib/api/httpClient.ts`、`interview.ts`、`translate.ts`
- `apps/web/src/hooks/useResumeOptimizer.ts`、`useResumeAnalyzer.ts`、`useMultiPersonaAnalyzer.ts`、`useRealtimeInterview.ts`
- `apps/web/src/app/api/{chat-agent,analyze-resume,analyze_multi,generate-pdf}/route.ts`、`optimizer-agent/{rewrite,analyze,research}/route.ts`、`pdf/parse/route.ts`
- `apps/web/next.config.ts`、`apps/web/.env.local`、`apps/web/.env.example`、`package.json`、`apps/web/package.json`

**前端 · 新增**
- `scripts/dev-gateway.mjs`、`apps/web/src/lib/auth/serverFetchBackend.ts`、`apps/web/src/app/api/polish-text/route.ts`
- `design/frontend-v2-backend-integration.md`（本设计文档）

**后端 · 只读参照（不改）**
- `Magic-Core/deploy/nginx.conf`
- `apps/agent-service/src/modules/{runtime/event-stream.ts, shared/types.ts, workflows/*.workflow.ts, workflow-runner.service.ts, runtime/stream.service.ts}`

---

## 5. 实施顺序（里程碑）

1. **M1 通路**：dev-gateway + env + httpClient 兜底（3.1）→ 验证 CRUD/chat 路由命中正确服务。
2. **M2 鉴权**：serverFetchBackend + 各代理路由（3.2）→ 验证不再 401。
3. **M3 信封**：interview/translate-text/multi-persona 解包（3.4/3.6）。
4. **M4 流式重建**：工作流 hook（3.3）+ chat 事件（3.5）—— 主要工作量。
5. **M5 realtime + polish + 清理**：WS（3.7）、polish-text（3.8）、next.config（3.9）。

---

## 6. 验证（端到端）

1. 起服务：`Magic-Core` nvm Node 20 `pnpm dev`（3111+3112）；`Magic-Resume` `pnpm dev`（next + gateway）。
2. CRUD：`/api/resumes/mine` 经网关→platform-api 正常（带 token）。
3. chat：发消息，`/api/chat-agent`→网关→agent-service 不再 401，`message_chunk` 渲染，新事件不报错。
4. 优化/分析：跑 rewrite/analyze，步骤列表由 `agent_plan` 动态生成、`step_started/completed` 点亮、`resume_patch` 可应用（重点回归）。
5. translate：stream 逐字、text 解包字段正确。
6. interview：start 解包拿 `session_id`；realtime WS 经网关升级成功，音/文双向。
7. pdf：generate（二进制）/parse（multipart）经网关→agent-service 正常。
8. polish-text：编辑器润色返回 `{polishedText}`。
9. Network 核对：agent 流量命中 3112、CRUD 命中 3111；无 401/404/解析异常。

---

## 7. 风险与回滚

- **流式重建（M4）是主要风险**：步骤揭示 UI 从写死 V7 节点改为动态消费 `agent_plan`，i18n 文案映射需同步；建议先在 rewrite 跑通再推广到 analyze/research。
- v2 rewrite 仅 3 步，旧细粒度节点（resume_web_search/company_analysis/adversarial_critique 等）不再有 → UI 步骤明显变少，属预期。
- 回滚：各项按里程碑独立提交；env 切回直连端口（agent→3112、api→3111）即可绕过网关验证单点。
- polish-text 若聚合不佳 → 后端补端点（超出本次前端范围，单列）。
