# AI 实验室 · 目录重构 + 接入 Magic-Core 后端 — 工程方案 v1.1

> 状态：v1.1（已按 **Magic-Core v2 三服务后端**校正）。
> 依赖：跨切面的传输/鉴权/信封/SSE 客户端以 **`frontend-v2-backend-integration.md`** 为准；
> 本文只负责 **AI 实验室特有**的接线（5 个技能 + 活的画布），底层一律引用该文档、不重复推导。
> 范围：**第一部分（目录重构）已落地实现；第二部分（后端接入）为方案，分期落地。**

---

## 变更说明（v1 → v1.1：对齐 v2 三服务后端）

v1 把后端当成「直指 agent-service:3112 的单服务」，与 v2 实际拓扑不符。已核实并修正：

| # | 位置 | v1（错/缺） | v1.1（校正） | 依据 |
|---|---|---|---|---|
| B1 | §3.1/§3.3/§3.9 | 「把 `BACKEND_URL` 指向 :3112」 | **单一 origin** = Magic-Core 边缘网关 `apps/gateway`:3110（按前缀分流，线上 nginx 仅 TLS）；补 `render-service:3113`（内部，不直连） | `apps/gateway` |
| B2 | §3.8 | Next 代理 **vs** 直连「二选一」 | **二者并存、同一 origin**；且 Next 代理路由**必须转发 Clerk token**（`serverFetchBackend()`），否则 401 | agent-service 全局 `ClerkAuthGuard`；`/api/analyze_multi/route.ts` 现仅带 `Content-Type` |
| B3 | §3.11/§5 | BYOK「待决策」 | **定论：BYOK 多租户**——后端无任何 LLM 凭据（env 也没有），每次 AI 会话用客户端 `config`（apiKey/baseUrl/model）初始化 agent；`resolveConfig` 改为「客户端优先、key 与 baseUrl 同源」，并对客户端 baseUrl 做 link-local/metadata SSRF 拦截 | `llm-gateway.service.ts` resolveConfig |
| C4 | §3.4 | 仅「事件 schema 变了」 | 补：`agent_plan` 开场声明步骤 → 每步 `step_started/message_chunk/step_completed`；rewrite **精简约 3 步**（旧 ~15 个 V7 节点揭示 UI + `nodeTitles` 作废，仅留 i18n 兜底）；最终简历经 `resume_patch`，`payload.legacyChunk` 作旧结构兜底 | `rewrite.workflow.ts`、`analyze.workflow.ts`、`workflow-runner.service.ts` |
| C5 | §3.5 | 仅 analyze 提了信封 | 信封 `.data` 解包还涉及 `interview.start/chat`、`translate/text`；裸流：`/chat`、`/graph/*`、`/translate/stream`、`/pdf/*` | `graph.controller.ts`（multi 无 `@Res()`）+ 全局 `TransformInterceptor` |
| C6 | §3.10 | 仅活的画布元素改写 | 并列补 `polish-text` 缺口（TiptapEditor 现有润色路径，同一底层需求） | `TiptapEditor.tsx` |
| D | §3.2 等 | — | **不变（仍正确）**：`AgentSseEvent` 协议、legacy 兼容 URL、`/agent/runs` 通用入口、`WS /interview/realtime/:id` | — |

---

## 0. 背景与目标

AI 实验室（`apps/web/.../_components/ai/`）被重建为「技能驱动的对话工作台」，入口仅云端开放
（`layout/Tools.tsx` 以 `isCloudMode` 网关 `onShowAI`），当前**全是 mock**（`setTimeout` + 确定性生成器）。
与此同时每个技能其实早有真实集成散落在 app 各处，只是都指向**已废弃的旧后端**。

后端已重写为 **Magic-Core v2**：从单体拆为 **三服务**，经 **nginx 暴露为单一 origin**、按路径前缀分流：

| 服务 | 端口 | 职责 |
|---|---|---|
| platform-api | 3111 | CRUD：resumes / users / notifications / stats / analytics / auth |
| agent-service | 3112 | chat / graph 工作流 / interview（含 realtime WS）/ pdf / translate |
| render-service | 3113 | 内部 HTML→PDF，**前端不直连**（agent-service 内部委托） |

两个目标：① 理顺目录（把「会被后端替换的 mock」与「要保留的模型/落地逻辑」物理分开）；
② 把 5 个技能 + 活的画布接到 v2（**底层走 `frontend-v2-backend-integration.md` 的统一网关/鉴权/信封/SSE 客户端**）。

---

# 第一部分 · 目录重构（已落地实现）

> 状态：**已完成并提交**（branch `refactor/ai-lab-skill-chat`，commit「:sparkles: feat: reorganize AI lab and add living-canvas editable renderer」）。tsc + eslint 均绿，行为不变（仍 mock）。

`ai/chat/` 解散，`ai/` 升为特性根，按关注点分组：

```
_components/ai/
  AiChatShell.tsx                 # 编排器
  types.ts
  skills/registry.ts              # 技能元数据
  conversation/                   # ChatThread / Composer / SkillParamForm / WelcomeSuggestions
  canvas/
    ArtifactCanvas.tsx            # 重命名自 ResumeCanvas（预览/Diff/JSON/评分）
    living/                       # LivingCanvas + 5 个 popover/bar
  interview/InterviewOverlay.tsx
  lib/
    changeModel.ts                # 保留：PendingChange 模型 + 落地函数（apply/reorder）
    mock/changeMock.ts            # 可替换：mock 生成器（接后端时换成 services/）
    services/                     # 后端客户端（第二部分；已起：agentClient.ts / types.ts）
```

关键铺垫：`pendingChange.ts` 已拆为 `lib/changeModel.ts`（模型 + 落地，backend-agnostic）与
`lib/mock/changeMock.ts`（生成器，可替换）。`ResumeCanvas` → `ArtifactCanvas`。外部唯一引用
`AIModal.tsx` 已更新。详细迁移清单见 git 提交。

---

# 第二部分 · 接入 Magic-Core v2（方案，分期落地）

## 3.0 与 `frontend-v2-backend-integration.md` 的分工

那份文档是**全 app 的地基**：单一后端 origin（= Magic-Core 网关 `apps/gateway`）、`serverFetchBackend()`（服务端转发 Clerk
token）、JSON 信封解包、`AgentSseEvent` SSE 客户端基建、env 统一。**本文不重复实现这些**，只：
① 复用其网关/鉴权/解包/SSE 客户端；② 定义 AI 实验室的技能→端点映射；③ 把后端产物接到壳子已有的 UI 表面。

> 凡涉及「打哪个 origin / 怎么带 token / 怎么解信封 / 怎么读 SSE」——以地基文档为准。

## 3.1 后端拓扑（单一 origin）

- 前端**只配一个后端 origin** = Magic-Core 边缘网关 `apps/gateway`（dev :3110，随其 `pnpm dev` 起；prod 同一网关，nginx 仅做 TLS）。
- 网关分流（`apps/gateway`，等价于原 `deploy/nginx.conf`，`bodyParser:false` 流式穿透）：
  - `^/api/(chat|graph|agent|pdf|translate|interview)` → **agent-service:3112**（含 `/api/interview/realtime/:id` 的 WS 升级）
  - 其余 `/api/` → **platform-api:3111**
- agent-service：全局 `ClerkAuthGuard`（Clerk 会话 **或** PAT）+ `@Roles('user','admin')` + 限流；
  非流式 JSON 经全局 `TransformInterceptor` 包成 `{code,data,message,timestamp}`。

## 3.2 统一事件协议 `AgentSseEvent`（不变，仍正确）

```ts
// agent-service/modules/shared/types.ts
interface AgentSseEvent {
  type: AgentEventType;                 // 见下
  runId?: string; stepId?: string; sequence?: number;
  content?: string;                     // message_chunk 文本增量
  payload?: Record<string, unknown>;    // 含 workflowId / workflowStepId / legacyChunk / patch 等
  data?: unknown;                       // 结构化产物
  error?: string;
}
// type: run_started/agent_plan/plan_update/skill_loaded/subagent_*/step_started/llm_*/tool_*/
//       message_chunk/resume_patch/resume_update/resume_analysis/translation_result/pdf_result/
//       interview_question/critique/suggestion/step_completed/run_completed/run_failed/done/error
```
SSE 帧：`data: {json}\n\n`。

## 3.3 端点 + 信封边界

- **通用入口**：`POST /api/agent/runs`（`AgentTaskInput{taskType,payload,config}`）→ 归一化 SSE。
- **legacy 兼容 URL**：`/api/chat`、`/api/graph/{research,analyze,rewrite,analyze-resume,analyze-resume-multi}`、
  `/api/translate/{text,stream}`、`/api/interview/{start,chat}` + `DELETE …/session/:id`、`/api/pdf/{generate,parse}`、
  `WS /api/interview/realtime/:id`、`GET /api/rate-limit-status`。
- **信封边界**（决定前端怎么解）：
  - **裸流/二进制**（`@Res()` 手写）：`/chat`、`/graph/*`、`/translate/stream`、`/pdf/*` → 原样读。
  - **过信封**（普通 return → `{code,data,…}`，**需取 `.data`**）：`/graph/analyze-resume-multi`、
    `/interview/start`、`/interview/chat`、`/translate/text`。

## 3.4 工作流 SSE 细化（rewrite / analyze / research）

来源：`rewrite.workflow.ts`、`analyze.workflow.ts`、`workflow-runner.service.ts`。一次 run 的序列：

1. `agent_plan` — `payload:{ workflowId, steps:[{id,name}] }`：**开场声明全部步骤**（前端据此建步骤列表）。
2. 每步顺序：`step_started{stepId,stepName}` → 多条 `message_chunk{content, payload.workflowStepId}` →
   可选 `llm_*/tool_*/error` → `step_completed{stepId, parsed}`。
3. rewrite 额外：策略步后 `suggestion`；结尾 `resume_patch{ payload.patch | payload.legacyChunk… }` 给最终简历。
4. 收尾 `done`（异常 `error`/`run_failed`）。

**对前端的影响**：旧 `useResumeOptimizer.processStream` 按 `{nodeId:state}` + 本地 ~15 个 V7 节点
（`nodeTitles`/`v7ResearchNodes`）驱动揭示 UI——**作废**。改为：步骤列表由 `agent_plan` 动态生成，
`step_started/step_completed` 点亮，`message_chunk` 按 `workflowStepId` 归集；`nodeTitles` 仅留作 i18n 兜底。
v2 rewrite 是**精简约 3 步**，UI 复杂度大幅下降。最终简历取 `resume_patch`（`legacyChunk` 兜底）。

## 3.5 技能 → 端点映射

| 技能 | 端点 | 形态 | 解包 / 关键事件 |
|---|---|---|---|
| create 引导创建 | `POST /api/chat`（`mode:'create'`） | 裸 SSE | `message_chunk` + `resume_update`/`resume_patch` |
| optimize 智能优化 | `POST /api/graph/rewrite` | 裸 SSE | `agent_plan`→`step_*`→`resume_patch`、`critique`、`suggestion` |
| analyze 简历分析 | `POST /api/graph/analyze-resume-multi` | JSON **过信封** | 取 `.data` → `MultiPersonaResumeAnalysis` → ScoreView |
| translate 一键翻译 | `POST /api/translate/stream` | 裸 SSE | `translation_chunk/done`（沿用旧客户端） |
| interview 模拟面试 | `start/chat`（**过信封**，取 `.data`）→ `WS /api/interview/realtime/:id`（语音） | REST+WS | `interview_question`、音频帧 |
| 活的画布·元素/选区 | `POST /api/chat`（单字段指令）/ `/api/translate/text`（**过信封**） | SSE/JSON | `message_chunk` → 新字段文本（§3.10） |

## 3.6 前端服务层（`ai/lib/services/`）

- 复用地基的 **`AgentSseEvent` SSE 客户端** 与 **`serverFetchBackend`/信封解包**；本层只暴露技能语义：
  `runRewrite / runAnalyze / runTranslate / runChat / startInterview`。
- 已起的脚手架（第一部分提交里）：`agentClient.ts`（`analyzeResumeMulti` + 通用 `streamAgent` 生成器）、`types.ts`。
  > ⚠️ 现状需按 §3.8/§3.9 校正后才能跑通（见「当前实现状态」）。
- 薄适配器把产物落到既有表面（§3.7），不动 UI 组件。

## 3.7 产物回流 UI（复用为主）

- optimize / translate（整篇）→ `PendingChange[]`（与 `createBatchChanges` 同形）喂活的画布——
  **评审/落地闭环与 `changeModel.ts` 零改动**，只是 `{before,after,rationale}` 改由模型给。
- analyze → `MultiPersonaResumeAnalysis` 灌入 `ArtifactCanvas` 的 `ScoreView`。
- create → 助手消息进 `ChatThread`；`resume_update` 进 `useResumeDraftStore` 草稿。
- interview → 文字 REST 先行；语音切 `WS /api/interview/realtime/:id`，替换 mock `InterviewOverlay`。

## 3.8 传输与鉴权（校正：并存 + 必须转发 token）

- **同一 origin，两种调用并存**：
  - chat / graph / pdf / analyze → 走 **Next.js 代理路由**（服务端），用 **`serverFetchBackend()`**
    （`auth().getToken()` → `Authorization: Bearer`）转发 Clerk token，否则 agent-service **401**。
  - interview / translate / realtime → 浏览器经 **`httpClient.agent`** 直连（拦截器已带 token）。
- 现存 Next 代理路由（`/api/analyze_multi`、`/api/optimizer-agent/*`、`/chat-agent`、`/api/generate-pdf`、
  `/api/pdf/parse`）**当前都未转发 token**——接 v2 前必须统一改用 `serverFetchBackend`（地基文档负责）。
- 把散落硬编码路径收进 `lib/api/routes.ts`（已起 `WEB_AGENT_ROUTES`）。

## 3.9 配置与环境变量（已落地：单一地址）

- **只有一个后端地址**：`NEXT_PUBLIC_API_URL`（浏览器 + 服务端通用），`API_ORIGIN` 常量在 `lib/api/routes.ts`
  （只认该变量、无旧变量兜底；默认 `http://localhost:3110` = Magic-Core 网关）。
- `httpClient.api` 与 `httpClient.agent` 共用此 origin；网关按路径前缀分流。
- dev 不再自起 proxy：直接指向 Magic-Core 的 `apps/gateway`（:3110，随其 `pnpm dev` 一起起）；
  旧的前端 `scripts/dev-gateway.mjs` + `dev:gateway` 已删除。
- 四个 env 文件 + `.env.example` 统一为单一 `NEXT_PUBLIC_API_URL`；旧 `NEXT_PUBLIC_CLOUD_API_URL`/`BACKEND_URL` 已全部退役。

## 3.10 活的画布元素改写 + polish-text 缺口（唯一的「新」需求）

- 元素/选区快捷动作（量化/精简/换动词/补证据；选区优化/缩短/翻译）无专属端点：
  改写类用 `POST /api/chat`（`mode:'optimize'` + 单字段上下文，从 `message_chunk` 收敛新文本 → `PendingChange`）；
  选区翻译用 `/api/translate/text`（过信封）。指令路由短期沿用 `routeFreeText` 正则，长期交后端 function-calling。
- **`polish-text` 缺口**：`TiptapEditor` 现有润色路径无对应 v2 端点 → 需新增 Next route
  `/api/polish-text`（`serverFetchBackend` 代理 `/api/chat` 聚合为纯文本），或后端补轻量端点。与上同源需求。

## 3.11 BYOK（定论：多租户，后端无凭据，用客户端 config 初始化 agent）

这是一个 **BYOK 多租户产品**：后端**没有任何 LLM 凭据**（env 里也没有）。
「一个用户开始用 AI 功能」= 一个 session，**用客户端的大模型配置（apiKey/baseUrl/model）初始化 agent**。

- **后端 `resolveConfig`（已改）**：客户端优先——读 `config.{apiKey,baseUrl,modelName,maxTokens}`；
  server env（`LLM_*`/`OPENAI_*`）退化为单租户自托管的可选兜底。
  - **安全不变量**：apiKey 与 baseUrl **必须同源**。客户端给了 `baseUrl` 就只用客户端自己的 key——
    绝不把（万一存在的）server key 发到客户端 URL（否则经 `Authorization` 头泄漏）。
  - **SSRF 防护**：客户端 `baseUrl` 经 `assertSafeClientBaseUrl` 拦截 link-local / 云 metadata
    （`169.254.0.0/16`、`metadata.google.internal`、`fe80::`）；loopback/私网放行（自托管 ollama 合法）。
  - 保留 `400 LLM apiKey is required for non-local providers`：非本地 baseUrl 且无 key 时仍拒绝。
- **前端**：`runChat`/`runAnalyze` 发完整 `config:{apiKey,baseUrl,modelName,maxTokens}`（取自 `useSettingStore`）。
- **设置页**：apiKey/baseUrl/model 输入框是 BYOK 的**唯一凭据来源**，必须保留且生效。

## 3.12 读简历：从「客户端推送」改为「Agent ReAct 拉取」（已落地）

> 完整 ADR 见后端仓库 `Magic-Core/docs/agent-read-resume-tool.md`。

对话 agent 不再把整份简历塞进请求体 `currentResume`，而是后端给 agent 一个 **`read_resume`
工具**，它在 ReAct 循环里按需调用，**按 `resumeId` + 用户 Clerk token 去 platform-api DB 拉取**
（`GET /api/resumes/:id`，`findOne(id,userId)` 归属校验+解密）。
- **前端**：`runChat` 改发 `resumeId: resumeData.id`（不再发 `currentResume`）；打开 AI 实验室前
  `openAIModal` 先 `await syncToCloud()`（best-effort）保证 DB 最新；`tool_started(read_resume)`
  渲染成「正在读取你的简历…」活动行（助手气泡改为**懒创建**，让活动行在回复**之上**）。
- **后端**：`read_resume` 闭包绑定 id/token（模型不传 id）；对话路径**不再 seed**
  `/workspace/resume.json`（工作流路径仍 seed）；写路径不变（`write_file` → `resume_update`）。
  五个 `SKILL.md` 的读步骤与编排提示词改为「调 `read_resume`」。
- **凭据分离**：`read_resume` 用 Clerk token（鉴权/归属），与 BYOK 的 LLM `apiKey`（§3.11）解耦。
- **仅读**：本期不做 `save_resume`；新简历未同步 → 工具返回「没有已保存的简历」→ agent 转而问用户。

---

## 4. P0（analyze）改动点 / 文件清单

> 依赖地基就位：Magic-Core 网关（`apps/gateway`:3110）、`serverFetchBackend`、env 单 origin。以下是 AI 实验室侧。

- **`ai/lib/services/agentClient.ts`**（已起）：`analyzeResumeMulti` 改为**取信封 `.data`**；后续 `streamAgent` 复用地基 SSE 客户端。
- **`app/api/analyze_multi/route.ts`**：改用 `serverFetchBackend('/api/graph/analyze-resume-multi', …)` 转发 token；保持向前端透传 `.data` 或原样信封（与客户端解包约定一致，二选一、勿重复解包）。
- **`ai/AiChatShell.tsx`**（已起）：`runAnalyze` 已接 `analyzeResumeMulti`；`config` 发完整 BYOK `{apiKey,baseUrl,modelName,maxTokens}`（§3.11）；保留 error toast / 占位。
- **`ai/canvas/ArtifactCanvas.tsx`**（已起）：`ScoreView` 已读真实 `MultiPersonaResumeAnalysis`（overall/三角色/亮点/待改进），无需再改。
- **env / `.env.example`**：单一 `NEXT_PUBLIC_API_URL` = 网关 `:3110`（已落地）。

## 当前实现状态（已落地，待后端联调验证）

P0 analyze 已接通，单一地址地基已建（tsc + eslint 均绿）：
- ✅ 单一地址 `NEXT_PUBLIC_API_URL`（`API_ORIGIN` in `lib/api/routes.ts`）；`httpClient` 双实例共用。
- ✅ `lib/auth/serverFetchBackend.ts` 转发 Clerk token；`/api/analyze_multi` 已改用之（修 401）。
- ✅ `agentClient.analyzeResumeMulti` 容忍信封（`body?.data ?? body`）。
- ✅ `ArtifactCanvas.ScoreView` 读真实多角色分析；`runAnalyze`/`runChat` 发完整 BYOK `config:{apiKey,baseUrl,modelName,maxTokens}`（§3.11；后端 `resolveConfig` 已改为客户端优先 + SSRF 拦截）。
- ✅ 后端地址指向 Magic-Core 网关 `apps/gateway`:3110（前端不再自起 proxy，已删 `dev-gateway.mjs` + `dev:gateway`）。
- ⏳ 待验证：起 Magic-Core `pnpm dev`（gateway:3110 + platform:3111 + agent:3112）+ `Magic-Resume` `pnpm dev`（`NEXT_PUBLIC_API_URL=http://localhost:3110`），触发「简历分析」端到端。
- ↩ 其余 Next 代理路由（`chat-agent`、`optimizer-agent/*`、`pdf/parse`、`generate-pdf`、`analyze-resume`）仍用旧 `BACKEND_URL`，随各自技能阶段（P1+）迁到 `serverFetchBackend`。

---

## 5. 落地分期

0. **P0 analyze**：地基（gateway+serverFetchBackend+env）就位 → 校正上面 4 个改动点 → 端到端跑通（最简，JSON）。
1. **P1**：optimize + translate → 活的画布 `PendingChange[]`；optimize 按 §3.4 重建步骤 UI。
2. **P2**：create 对话 + 草稿 `resume_update`。
3. **P3**：interview（文字 REST → realtime WS 语音，替换 mock 浮层）。
4. **P4**：活的画布元素/选区快捷动作 + polish-text。

## 6. 待决问题

- optimize 过程 UX：`agent_plan`/`step_*` 是否还原成节点日志树，还是极简执行卡（v2 仅 3 步，倾向极简）。
- analyze：固定多角色（`/analyze-resume-multi`）即可（评分视图按三角色设计）。
- ~~BYOK~~：已定论（§3.11 多租户 BYOK——后端无凭据，用客户端 config 初始化 agent，`resolveConfig` 已改）；~~Next 代理 vs 直连~~：已决（§3.8 并存 + 网关）。

## 7. 验证（端到端）

- 起 Magic-Core `pnpm dev`（gateway:3110 + platform-api:3111 + agent-service:3112 + render:3113）；
  `Magic-Resume` 起 next（`NEXT_PUBLIC_API_URL=http://localhost:3110`，不再需要 dev-gateway）。
- analyze：触发「简历分析」→ `/api/analyze_multi`→网关(:3110)→agent-service **不再 401**，响应解信封后
  `ScoreView` 显示真实 overall / 三角色分 / 亮点 / 待改进。
- Network 核对：**所有后端流量只打 :3110**（网关再转 agent:3112 / platform:3111）；token 已带。
