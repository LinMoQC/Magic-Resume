# AI 实验室 · 目录重构 + 接入 Magic-Core 后端 — 工程方案 v1

> 状态：已评审通过（v1）。承接 `ai-lab-living-canvas.md`（UX 地基层）的工程化落地。
> 范围：**第一部分（目录重构）落地实现；第二部分（后端接入）为方案，分期落地。**
> 后端：**Magic-Core**（`Magic-Resume-Core`，NestJS monorepo）的 `agent-service`（端口 3112）。

---

## 0. 背景与目标

AI 实验室在 `refactor/ai-lab-skill-chat` 分支被重建为「技能驱动的对话工作台」（commit `403a594`），
入口仅在云端开放（`layout/Tools.tsx` 用 `isCloudMode` 网关 `onShowAI`），且当前 **全是 mock**：

- `AiChatShell` 用 `setTimeout(1500ms)` 假装跑完技能；
- `livingCanvas/pendingChange.ts`（595 行）是确定性的文案生成器；
- `ResumeCanvas` 的 Diff / 评分 / JSON 也是写死的样例。

与此同时：**每个技能其实早就有真实后端集成散落在 app 各处**，而后端已被整体重写——
Python agent 已删除，新后端是 **Magic-Core**，AI 全部收敛在 `agent-service`（端口 **3112**、前缀 `/api`）。

两个目标：
1. **理顺目录**——按关注点分组，把「会被后端替换的 mock」和「要保留的数据模型/落地逻辑」物理分开，
   让后续 mock→后端的切换变成局部改动。
2. **出后端接入方案**——把 5 个技能 + 活的画布接到 Magic-Core，给出契约、服务层设计、传输/鉴权决策与分期。

---

## 1. 现状盘点：mock 在哪、真实集成在哪

新壳子是全 mock，但**老的真实集成都还在**，且**全部指向 agent 后端**（旧 `BACKEND_URL`）：

| 技能 | 已有 hook / api | 端点（旧） | 形态 |
|---|---|---|---|
| optimize 智能优化 | `hooks/useResumeOptimizer` | `/api/optimizer-agent/rewrite` → `BACKEND_URL/api/graph/rewrite` | SSE，BYOK config |
| analyze 简历分析 | `hooks/useMultiPersonaAnalyzer` / `useResumeAnalyzer` | `/api/analyze_multi`、`/api/analyze-resume` → `…/api/graph/*` | JSON / SSE |
| translate 一键翻译 | `lib/api/translate.ts` | `httpClient.agent` → `…/api/translate/stream` | SSE 直连 |
| interview 模拟面试 | `lib/api/interview.ts` | `httpClient.agent` → `…/api/interview/*` | REST 直连 |
| create 引导创建 | `hooks/useResumeCreator` + `useResumeDraftStore` | `/api/chat-agent` → `BACKEND_URL/api/chat` | SSE |

> 结论：接后端的本质是「**把壳子的 mock runner 换成这些已存在的能力**」，外加把它们重指到新后端、
> 并适配新的事件协议。真正全新的后端需求只有一个：**活的画布上的「元素级改写」**（见 §3.10）。

---

# 第一部分 · 目录重构（落地实现）

## 2.1 现状问题

```
_components/ai/chat/        ← 唯一子目录就叫 chat，但里面什么都有
  AiChatShell.tsx (429)     编排器
  ChatThread / Composer / SkillParamForm / WelcomeSuggestions   对话 UI
  ResumeCanvas.tsx (312)    产物画布（预览/Diff/JSON/评分）——命名误导，且是 mock
  InterviewOverlay.tsx      沉浸式面试——mock
  registry.ts / types.ts    技能元数据 / 类型
  livingCanvas/             活的画布（6 个组件 + pendingChange.ts 595 行）
```

三个痛点：
1. **关注点全平铺**：对话、两套画布、面试、技能元数据、改动引擎挤在一层。
2. **`pendingChange.ts` 把"该保留"和"该替换"混在一起**：数据模型 `PendingChange` + 落地函数
   （`applyChangeToSections` 等）是真的、要留；而 `generate / createBatchChanges / createCoachChanges`
   等生成器是 mock、后端接入时会被换掉。混在一个文件里，切换时容易误伤。
3. **命名**：`chat/` 既装画布又装面试；`ResumeCanvas` 实为"产物画布"。

## 2.2 目标结构（按关注点分组，`chat/` 子目录解散，`ai/` 升为特性根）

```
_components/ai/
  AiChatShell.tsx                 # 编排器                    (← chat/AiChatShell.tsx)
  types.ts                        # 壳子类型                  (← chat/types.ts)
  skills/
    registry.ts                   # 技能元数据                (← chat/registry.ts)
  conversation/
    ChatThread.tsx
    Composer.tsx
    SkillParamForm.tsx
    WelcomeSuggestions.tsx
  canvas/
    ArtifactCanvas.tsx            # 重命名自 chat/ResumeCanvas.tsx（预览/Diff/JSON/评分）
    living/
      LivingCanvas.tsx
      ActionPopover.tsx
      SectionActionPopover.tsx
      SelectionActionBar.tsx
      ReviewBar.tsx
      ChangesPanel.tsx
  interview/
    InterviewOverlay.tsx
  lib/
    changeModel.ts                # 保留：PendingChange 模型 + 落地函数（从 pendingChange.ts 拆出）
    mock/
      changeMock.ts               # 可替换：mock 生成器（从 pendingChange.ts 拆出）
    services/                     # 新增空目录——第二部分后端客户端的家
```

## 2.3 文件迁移清单

| 现路径 | 新路径 | 动作 |
|---|---|---|
| `chat/AiChatShell.tsx` | `ai/AiChatShell.tsx` | 移动 |
| `chat/types.ts` | `ai/types.ts` | 移动 |
| `chat/registry.ts` | `ai/skills/registry.ts` | 移动 |
| `chat/ChatThread.tsx` 等 4 个 | `ai/conversation/*` | 移动 |
| `chat/ResumeCanvas.tsx` | `ai/canvas/ArtifactCanvas.tsx` | 移动 + **重命名** |
| `chat/livingCanvas/*.tsx`（6 个组件） | `ai/canvas/living/*` | 移动 |
| `chat/InterviewOverlay.tsx` | `ai/interview/InterviewOverlay.tsx` | 移动 |
| `chat/livingCanvas/pendingChange.ts` | `ai/lib/changeModel.ts` + `ai/lib/mock/changeMock.ts` | **拆分**（见 §2.4） |

## 2.4 `pendingChange.ts` 拆分（第二部分的关键铺垫）

- **`lib/changeModel.ts`（接后端后依然不动）**：
  - 类型：`PendingChange`、`QuickActionId`、`SelectionActionId`、`ActionKind`、`QuickAction`/`SelectionAction`；
  - 动作清单与路由：`BULLET_ACTIONS`、`SUMMARY_ACTIONS`、`SELECTION_ACTIONS`、`actionsForTarget`、`routeFreeText`/`FREE_ROUTES`；
  - 路径与标题工具：`parsePath`、`sectionTitle`/`SECTION_TITLES`；
  - **真实落地函数**：`applyChangeToSections`、`applyInfoChange`、`reorderSection`、`finalizeAfter`、`wrapLike`、`stripHtml`。
- **`lib/mock/changeMock.ts`（第二部分用 `lib/services/` 替换）**：
  - 生成器：`generate` + `VARIANTS`、`createPendingChange`、`regeneratePendingChange`、
    `createSelectionChange`、`createInsertChange`、`createBatchChanges`、`createCoachChanges`；
  - 选区/翻译 mock：`applySelection`、`transformSelection`、`translateMock`、`EN_POOL`/`NEW_ITEM_POOL`、`RATIONALE_DETAIL`。

> `LivingCanvas.tsx` 原本从一个模块同时引这两类；拆分后改成
> `import … from '../../lib/changeModel'` 与 `import … from '../../lib/mock/changeMock'` 两行。
> 这一步让「P2 接后端」= 新建 `lib/services/*` 产出真实 `{before, after, rationale}`，
> **而评审/落地闭环（`changeModel`）零改动**。

## 2.5 引用更新（很集中，外部只有 1 处）

- **唯一外部引用**：`_components/modals/AIModal.tsx`：`../ai/chat/AiChatShell` → `../ai/AiChatShell`。
- 特性内相对路径随迁移调整，如 `AiChatShell.tsx`：`./registry`→`./skills/registry`、
  `./ChatThread`→`./conversation/ChatThread`、`./ResumeCanvas`→`./canvas/ArtifactCanvas`、
  `./livingCanvas/LivingCanvas`→`./canvas/living/LivingCanvas`。
- **渲染器契约不动**：`canvas/living/*` 仍从包里引
  `@magic-resume/resume-templates/renderer/EditableCanvas`（该文件在 `packages/resume-templates`，
  与 templateLayout 共用，**不要搬**）。
- `ResumePreview` 在 `LivingCanvas`/`ArtifactCanvas` 中的相对深度不变，迁移后核对 `../` 数量即可。

## 2.6 第一部分验收

- `pnpm --filter @magic-resume/web lint` + typecheck/build：确认迁移后无断引。
- 云端打开 AI 实验室：技能、活的画布、面试浮层行为与重构前**完全一致**（仍是 mock）——纯结构调整。

---

# 第二部分 · 接入 Magic-Core（方案，分期落地）

## 3.1 后端形态：`agent-service`

- **基址**：`http://<host>:3112/api`（platform-api 是 3111）。NestJS，全局 `ClerkAuthGuard`
  （Clerk 会话 **或** PAT）+ `@Roles('user','admin')` + 限流（20/min）。CORS 已放行 web 源且 `credentials:true`。
  非 SSE 响应被 `TransformInterceptor` 包成 `{data,code,message}`（与 `httpClient` 的 `ApiResponse<T>` 对齐）。
- **统一流式运行时**：所有任务都过 `AgentStreamService.runSse()`，发**归一化事件 `AgentSseEvent`**，
  并把 run/step/event 落库（Prisma，可经 `GET /agent/runs/:id/events` 回放）。

## 3.2 统一事件协议 `AgentSseEvent`

```ts
// agent-service/modules/shared/types.ts
interface AgentSseEvent {
  type: AgentEventType;          // 见下
  runId?: string; stepId?: string; sequence?: number;
  content?: string;              // message_chunk 的文本增量
  payload?: Record<string, unknown>;
  data?: unknown;                // 结构化产物（如 resume、analysis）
  error?: string;
}
type AgentEventType =
  | 'run_started' | 'agent_plan' | 'plan_update' | 'step_started' | 'step_completed'
  | 'llm_started' | 'llm_usage' | 'tool_started' | 'tool_result' | 'tool_completed'
  | 'message_chunk'                 // 助手文本流
  | 'resume_patch' | 'resume_update'// 简历改动（patch / 整份）
  | 'resume_analysis'               // 分析结果
  | 'translation_result'            // 翻译结果
  | 'interview_question' | 'critique' | 'suggestion'
  | 'run_completed' | 'run_failed' | 'done' | 'error';
```

SSE 帧格式：`data: {json}\n\n`（`encodeSseEvent`）。

## 3.3 端点清单

- **通用入口（推荐主用）**：`POST /agent/runs`，体 `AgentTaskInput { taskType, payload, config }`，
  `taskType ∈ chat|research|analyze|rewrite|translate|interview|pdf_parse|pdf_generate` → 归一化 SSE。
- **旧版兼容 URL（仍可用）**：`POST /chat`、`/graph/{research,analyze,rewrite,analyze-resume}`（SSE）、
  `/graph/analyze-resume-multi`（JSON）、`/translate/{text,stream}`、`/interview/{start,chat}` +
  `DELETE /interview/session/:id`、`/pdf/{generate,parse}`。
- **新增**：`WS /interview/realtime/:sessionId`（实时语音面试）、`GET /rate-limit-status`、
  `GET /agent/runs/:id`、`/agent/runs/:id/events`（trace 回放）。

## 3.4 ⚠️ 关键风险：URL 兼容，但事件 schema 是新的

迁移文档 `agent-v2-migration.md` 说端点「legacy-compatible」，指的是 **URL 不变**；
但 `/graph/*`、`/chat` 现在都过 `runSse()`，发的是**新的 `AgentSseEvent`**，
**不再是旧 Python 的 LangGraph `{nodeId:{…}}`**。所以：

- `useResumeOptimizer.processStream`（按 `{nodeId:{…}}` 解析）与 create 的 chat 解析**必须重写**；
- translate/interview 的 DTO 与事件契约**与旧版一致**（`lib/api/translate.ts`、`interview.ts` 里已有可用客户端），
  接入成本主要是 **base URL 重指向**；联调时核对 `/translate/stream` 是否仍发 `translation_chunk/done`。

> 一句话：**真正的工作量是「写一个懂 `AgentSseEvent` 的 SSE 客户端」，不是改 URL。**

## 3.5 技能 → 端点映射

| AI 实验室技能 | Magic-Core 端点 | 形态 | 关键事件 / 返回 |
|---|---|---|---|
| create 引导创建 | `POST /chat`（`mode:'create'`） | SSE | `message_chunk`（助手）+ `resume_update`/`resume_patch`（草稿） |
| optimize 智能优化 | `POST /graph/rewrite` | SSE | `agent_plan`/`step_*`（过程）、`resume_patch`/`resume_update`、`critique`、`suggestion` |
| analyze 简历分析 | `POST /graph/analyze-resume-multi` | JSON | `MultiPersonaResumeAnalysis`（被 `{data}` 包裹）→ `ArtifactCanvas` 评分视图 |
| translate 一键翻译 | `POST /translate/stream` | SSE | `translation_chunk/done`（沿用旧客户端） |
| interview 模拟面试 | `POST /interview/start`+`/chat`（文字）→ `WS /interview/realtime/:id`（语音） | REST+WS | `interview_question`、音频帧 |
| 活的画布·元素/选区 | `POST /chat`（单字段指令）/ `/translate/text`（选区翻译） | SSE/JSON | `message_chunk` → 新字段文本（见 §3.10） |

> 请求体沿用既有形状（如 rewrite 的 `{ state:{jd,resume,companyName,jobTitle}, config }`、
> analyze-multi 的 `{ resumeData, config, language }`），具体字段以对应 Workflow/Service 为准。

## 3.6 前端服务层设计（`ai/lib/services/`）

- **一个 `agentClient`**：向 agent 基址 POST、带 Clerk token、把 `AgentSseEvent` 流解析为**强类型事件**，
  对外暴露 `runRewrite / runAnalyze / runTranslate / runChat / startInterview`。
  SSE 读取直接**复用 `lib/api/translate.ts:translateTextStream` 的模板**（已有 reader/decoder/`\n\n` 分帧 + 超时）。
- **一层薄适配器** 把后端产物落到「壳子已有的表面」（见 §3.7），不动 UI 组件。
- **接入点**：`AiChatShell.runSkill` 里把 `setTimeout` 块换成按 `skillId` 分发的 `agentClient` 调用；
  `LivingCanvas` 把 `lib/mock/changeMock` 换成 `lib/services`。

## 3.7 后端产物如何回流到现有 UI 表面（复用为主，避免重做）

- **optimize / translate（整篇）** → 产出 `PendingChange[]`（与 `createBatchChanges` 同形），
  喂给活的画布——**评审/接受闭环与 `changeModel.ts` 落地路径零改动**，只是 `{before,after,rationale}` 改由模型给。
- **analyze** → `MultiPersonaResumeAnalysis` 灌入 `ArtifactCanvas` 的 `ScoreView`（三面试官评分本就按多角色设计）。
- **create** → 助手消息进 `ChatThread`；`resume_update` 进 `useResumeDraftStore` 草稿。
- **interview** → 文字回合先用 `interviewApi`；语音切 `WS /interview/realtime/:id`，替换当前纯 mock 的 `InterviewOverlay`。

## 3.8 传输与鉴权决策（Next 代理 vs 浏览器直连）

- **推荐：保留 Next.js route handlers 作网关**。理由：它们已做 `getServerUserId` 鉴权、隐藏后端 URL，
  且现状 5 个技能里有 3 个（optimize/analyze/create）就走它们。做法：把 `apps/web/.env` 的
  `BACKEND_URL` 重指到 `http://localhost:3112`，前端只新增一个懂 `AgentSseEvent` 的 SSE 客户端。
- **备选：浏览器经 `httpClient.agent` 直连** + 新增 `NEXT_PUBLIC_AGENT_API_URL`。CORS+Clerk 允许，
  但会暴露后端 URL、鉴权点分裂、与现有 3 个代理流不一致——**不推荐**。
- 顺手把当前散落的硬编码路径（`/api/optimizer-agent/rewrite`、`/chat-agent`、`/api/analyze_multi`）
  收进 `lib/api/routes.ts` 的 `AGENT_ROUTES`，与 `interview`/`translate` 并列。

## 3.9 配置与环境变量改动

- `apps/web/.env(.local)`：`BACKEND_URL=http://localhost:3112`（指向 agent-service）。
- `apps/web/.env.example`：注释从「Python agent server」改为「Magic-Core agent-service（TS，端口 3112）」。
- Magic-Core 侧（联调用）：`DATABASE_URL`、`REDIS_*`、`OPENAI_API_KEY/BASE_URL/MODEL`（或沿用请求级 `config`）。

## 3.10 活的画布 · 元素级改写（唯一的"新"后端需求）

活的画布的「就地快捷动作」（量化/精简/换动词/补证据、选区的优化/缩短/翻译）目前没有专属端点：

- **改写类**（针对单个字段 + 一句指令）：用 `POST /chat`，`mode:'optimize'`、`currentResume` 带上下文、
  `messages` 末条是「把这条改成…（量化/精简/…）」，从 `message_chunk` 收敛出新文本，
  包成一个 `PendingChange`。**指令路由**（大白话→具体动作）短期沿用 `routeFreeText` 正则，长期交后端 function-calling。
- **选区翻译**：直接用 `/translate/text`（已有 `translateApi.translateText`）。
- 若后端愿意，可加一个轻量 `taskType:'rewrite-field'` 走 `/agent/runs`，但非必需——先复用 `/chat`。

## 3.11 BYOK 安全注记

现状各流仍从 `useSettingStore` 把 `config:{apiKey,baseUrl,model}` 传给后端。
Magic-Core 的 `production-readiness-review.md` 计划**移除 WS/LLM 接受客户端 key**（SSRF + 凭据泄漏风险）。
→ 需决策：继续传 `config`，还是切到服务端托管 key。建议跟随后端，逐步去掉客户端 key。

---

## 4. 落地分期（第二部分实现时）

1. **P0**：`BACKEND_URL`→3112；写 `AgentSseEvent` 客户端；用 **analyze**（JSON，最简）验证打通。
2. **P1**：**optimize + translate** → 活的画布的 `PendingChange[]` 批量改动。
3. **P2**：**create** 对话 + 草稿 `resume_update`。
4. **P3**：**interview**：先文字 REST，再实时 WS 语音（替换 mock 浮层）。
5. **P4**：活的画布**元素/选区快捷动作** → `/chat` + `/translate/text`。

## 5. 待决问题

- 网关：Next 代理（推荐）vs 浏览器直连。
- BYOK：继续传 `config` vs 服务端托管 key。
- optimize 过程 UX：是否把 `agent_plan`/`step_*` 还原成旧版优化器的「节点日志树」，还是保留极简执行卡。
- analyze：单角色（`/graph/analyze-resume`）vs 多角色（`/analyze-resume-multi`）——评分视图按三角色设计，用多角色。

## 6. 验证方式

**第一部分（现在）**：见 §2.6（lint/build + 云端回归，行为不变）。

**第二部分（实现时）**：
- 起 Magic-Core：`pnpm dev`（platform-api:3111 + agent-service:3112）；按 `agent-v2-migration.md`
  跑 `prisma migrate deploy` + `generate`。
- 冒烟：`curl -N -X POST localhost:3112/api/chat`（带「针对这个 JD 优化我的简历」），确认 `AgentSseEvent` 帧。
- web 端（`BACKEND_URL`→3112）逐技能跑通，确认待评审改动 / 评分 / 草稿来自真实模型输出。
