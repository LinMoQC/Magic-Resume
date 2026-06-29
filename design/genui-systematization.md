# GenUI 体系化 — 把 LLM 文字输出变成可交互组件 — ADR 草案 v1

> **状态**:方向已确认(2026-06-29),首期切片落地中。
> **范围**:① 混合驱动(工具驱动为主 + `emit_widget` 逃生口);② 首期垂直切片端到端跑通**通用表单卡 `FormCard`**(`request_form` 工具 → `interruptOn` 暂停 → 卡片 → `respond` 回灌),覆盖 **智能优化**(JD/公司/岗位)与 **一键翻译**(目标语言)——**删掉这两个技能的参数弹窗**,改为「AI 在对话里按需弹卡、用户填写提交后再续跑」;③ 现有授权卡 / 计划卡**暂不迁移**。
> **关联变更**:optimize/translate 由「前端表单门控的一次性 batch」改为**会话化**(走 session thread),反转 adr-0010 CC1 中 optimize 的 threadless(更贴合 adr-0007「单一 chat + AI 路由技能」)。
> **关联**:`agent-tool-approval-contract.md`(HITL 授权契约,本稿复用其回传通道)、`ai-lab-living-canvas.md`(画布是舞台、对话是旁白)、`frontend-v2-backend-integration.md`(SSE 事件契约)。
> **跨仓库**:本稿是 **Magic-Resume 前端侧 + 契约** 的权威稿;`ask_choice` 工具与 `ui_widget` 事件的后端实现细节,落地时按既有惯例在 `Magic-Core/docs/` 留权威副本。

---

## 1. 背景与问题

当前 AI 对话里,大模型基本只**吐文字**。仅有的两张交互卡——授权卡(`role:'approval'`)、计划/Todo 卡(`role:'plan'`)——都是**一次性硬编码**:每加一张新交互卡,要在**两个仓库 ~7 处**手改:

> 后端事件枚举 → `event.mapper` 硬编码分支 → 前端事件枚举 → `consumeStream` switch → `types.ts` 新字段 + 新 `role` → `ChatThread` switch → 新组件 + 回传回调。

这是「手搓 GenUI」,没有体系。北极星「**AI 是合作者:改动先提案、可拒绝、有理由**」要落地,需要的远不止两张卡——任务卡、决策卡、提案卡、表单卡……若每张都重走 7 处,演进会被自身重量拖死。

**目标**:把「**LLM 输出 → 交互组件**」体系化——一个通用契约 + 前端**组件注册表** + 统一**交互回传通道**。此后新增交互卡 = **注册一个组件**(+ 可选一个工具),而非改 7 处 switch。

---

## 2. 业界方案调研(2026)与取舍

| 方案 | 形态 | 对我们的结论 |
|---|---|---|
| **AG-UI Protocol**(CopilotKit×LangGraph 共建)+ **A2UI** | 事件驱动,SSE/WS,~16 个标准事件:`TextMessage*` / `ToolCall*` / `StateSnapshot`/`StateDelta`(JSON Patch)/ `Custom` / `Activity*`;HITL 用 interrupt(`RunFinished{outcome:interrupt}` → client 带 `resume[]` 续跑)。A2UI 是其上的「agent 投递 UI widget」规范。 | **我们已是它的雏形**:`AgentSseEvent{type,payload}` ≈ AG-UI 事件;`tool_approval_request` ≈ interrupt;`plan_update`/`resume_update` ≈ State 事件。**采纳其语义与分类**,把自研契约做成「AG-UI/A2UI 的务实子集」,留 interop/迁移路径;**暂不引入 AG-UI SDK**(否则要重写传输层)。 |
| **LangGraph 原生 Generative UI** `push_ui_message(name, props, {message, id, merge})` / TS `ui.push(...)` | 同 `id`+`merge` 原地更新;client 用 `useStream` 的 `onCustomEvent`+`uiMessageReducer` 收,`LoadExternalComponent` 在 **shadow DOM** 里渲染**从 LangGraph Platform 拉取的远程 JS/CSS bundle**。 | **正中技术栈(deepagents=LangGraph)**,但渲染依赖 LangGraph Platform 托管组件、且我们用自研 NestJS 网关 + 自研 SSE client(非 LangGraph SDK)。远程 bundle + shadow DOM 对我们是**过度工程 + 远程代码加载面**。结论:**借鉴其 API 形状与 update-by-id 语义**(`dispatchWidget({kind,props,widgetId,merge})`),**组件用仓库内本地注册表**渲染。更简单、更安全、日后可平滑切到原生。 |
| **Vercel AI SDK `streamUI`** | 把真实 React Server Component 经 RSC 协议流到前端。 | 强耦合 Next RSC / 单后端,与我们 SSE + Zustand + 自研 client 不符。**不采纳**。 |
| **CopilotKit `useCopilotAction({ render })`** | 「工具/action → client 端 `render()` 函数」绑定,`status: inProgress\|complete`、args 流式。 | **正是工具驱动 widget 范式**。我们的 `WIDGETS` 注册表 = 它 render 绑定的声明式版;`status` 字段照搬。**借鉴**。 |

**定调**:自研一层「**本地组件注册表 + 通用 widget 事件**」,语义对齐 AG-UI/A2UI 与 LangGraph `push_ui_message`,渲染用第一方组件(类 CopilotKit render 绑定),**不引入新传输层、不远程加载组件**。

---

## 3. 已有可复用资产(为什么不另起炉灶)

- **后端 interrupt 已通用**:`engine.service.ts:225–266` 的 `detectApprovalRequest` 把**任何** `interruptOn` 工具的 `name`/`args`/`actions` 原样塞进 `tool_approval_request`。→ 工具驱动 widget 几乎零新增后端管线。
- **声明式范式**:`ai/skills/registry.ts` 的 `SKILLS` 是单一事实源(chips / slash / param 表单都读它)。widget 注册表照搬。
- **逃生口范式**:analyze 用 `dispatchCustomEvent(ANALYZE_PROGRESS_EVENT,…)` → `event.mapper.ts:37–40` → `plan_update`。`emit_widget` 照搬同一条链。
- **HITL 回传通道**:`/chat/approve` → `engine.resumeChat` → `Command({ resume:{ decisions } })`(`engine.service.ts:96`)。决策卡回传复用,不另开接口(见 `agent-tool-approval-contract.md`)。
- **upsert 范式**:计划卡用 `planCardRef` 复用同一 message id 原地更新。widget 用 `widgetId` 同款(= `push_ui_message` 的 id + merge)。

---

## 4. 架构 / 契约

**两条 ingress,汇成前端同一种 `widget` message:**

1. **工具驱动(agent 暂停等人决策)**:model 调 `ask_choice` 工具 → `interruptOn` 拦截暂停 → 后端已有逻辑发 `tool_approval_request{ toolName:'ask_choice', args:{question,options} }` → 前端按 `toolName` 命中注册表 → 渲染决策卡。回传走 `/chat/approve`。
2. **逃生口(非阻塞,工具执行中途主动推 UI)**:工具内 `dispatchWidget({ kind, props, widgetId?, merge? })` → `dispatchCustomEvent(EMIT_WIDGET_EVENT,…)` → `event.mapper` 新增一臂 → `ui_widget` SSE → 前端按 `widgetId` upsert。语义对齐 `push_ui_message`。

```
            ┌─ 工具驱动(暂停) ─ ask_choice → interruptOn → tool_approval_request ┐
 后端 deepagents ┤                                                                ├─→ SSE ─→ consumeStream ─→ widget message ─→ WidgetHost ─→ 注册表[kind] ─→ <DecisionCard/>
            └─ 逃生口(非阻塞)─ dispatchWidget → ui_widget ───────────────────┘                                                                              │
                                                                                                                                            onWidgetAction ─┘
                                                                                          resume:/chat/approve(respond) · message:/api/chat · client:本地
```

**前端注册表(单一事实源)** `WIDGETS: Record<WidgetKind, WidgetDescriptor>`:

```ts
interface WidgetDescriptor {
  component: React.ComponentType<WidgetProps>;   // 第一方组件
  propsSchema: z.ZodType;                          // 渲染前校验,失败降级
  interaction: 'resume' | 'message' | 'client';   // 回传路由
}
```

**约定**:interrupt 路径 `widgetKind === 工具名`(`ask_choice` 工具 ↔ `ask_choice` widget);`emit_widget` 路径 kind 由工具显式传。沿用现有「按工具名字符串绑定」惯例(`read_resume`/`write_todos` 即如此),**无需跨仓库共享包**。

**契约对照(自研 ↔ AG-UI ↔ LangGraph)**:`message_chunk` ↔ `TextMessageContent`;`tool_started/result` ↔ `ToolCall*`;`tool_approval_request` ↔ interrupt;`plan_update`/`resume_update` ↔ `State*`;**新增 `ui_widget` ↔ `Custom` / A2UI widget ↔ `push_ui_message`**。

---

## 5. HITL 回传:用 deepagents 原生 `respond` 决策

deepagents HITL 决策类型 = `approve` / `edit` / `reject`(+ `respond`)。对「**询问类、无副作用**」的 `ask_choice`,**`respond` 正是预期用法**:用户的选择作为工具结果回灌给模型(官方仅警告「勿用 `respond` 否决**有副作用**工具,因模型会把它当成功结果」——`ask_choice` 无副作用,不踩坑)。

- `interruptOn.ask_choice = { allowedDecisions: ['respond','reject'] }`(respond=选定某项,reject=取消/跳过并给模型反馈)。
- `HitlDecision` 扩 `{ type:'respond'; message }`(message=所选项 label/id);`reject` 现成(带 feedback)。
- 复用 `/chat/approve` → `Command({ resume:{ decisions } })`,`engine.resumeChat` 透传即可。
- **注**:deepagents issue #554 提到「**子代理**」的 edit/reject resume 有 bug;`ask_choice` 是**主代理**工具(同 `read_resume`),走主代理 respond/reject 路径,理应不受影响——E2E 时仍验证。

---

## 6. 文件级改动

### 前端 `apps/web/src/app/dashboard/edit/_components/ai/` — 新增
- `widgets/types.ts` — `WidgetKind` / `WidgetDescriptor` / `WidgetInstance`(`{ widgetId, kind, props, status }`) / `WidgetEnvelope`(`ui_widget` payload,字段对齐 `push_ui_message`:`kind,props,widgetId,merge`)。
- `widgets/registry.ts` — `WIDGETS` 注册表(**仿 `skills/registry.ts`**),首期含 `ask_choice` 一项。
- `widgets/DecisionCard.tsx` — 样板组件:`question` + 2–4 个 `options`,点选回调 `onAction`;**视觉复刻 `ChatThread.tsx` 的 `ApprovalCard`**(sky 卡 + 选中态),已选 / 已解析转灰态。
- `conversation/WidgetHost.tsx` — 派发器:registry 查 `kind` → `propsSchema.safeParse(props)` → 渲染;失败 / 未注册时**降级**为一行纯文本兜底。

### 前端 — 编辑
- `types.ts` — `ChatRole` 加 `'widget'`;`ChatMessage` 加 `widget?: WidgetInstance`。
- `conversation/ChatThread.tsx` — dispatch(≈431–456)加一臂 `m.role==='widget' → <WidgetHost message={m} onAction={…}/>`。
- `AiChatShell.tsx` — `consumeStream`(≈195–390):(a) `tool_approval_request` 前置判断 `payload.toolName` 命中 `WIDGETS` → 建 `widget` message,否则**现有 approval 卡逻辑不变**;(b) 新增 `ui_widget` 分支按 `widgetId` upsert(仿 `planCardRef`);新增 `onWidgetAction(widgetId, action)` 按 descriptor `interaction` 路由:`resume`→`approveTool` 带 `{type:'respond',message}`、`message`→发新 user turn、`client`→本地。
- `lib/services/types.ts` — `AgentEventType` 加 `'ui_widget'`。
- `lib/services/agentClient.ts` — `ApproveToolParams.decisions` 扩出 `{type:'respond';message}`。

### 后端 `Magic-Core/apps/agent-service/src/modules/` — 新增
- `engine/tools/ask-choice.tool.ts` — `ask_choice({ question, options:[{id,label,description?}] })`,把所选项作为工具结果返回。

### 后端 — 编辑
- `engine/providers/harness.factory.ts` — `tools` 加 `askChoice`;`interruptOn.ask_choice = { allowedDecisions:['respond','reject'], description }`。
- `engine/types/engine.types.ts` — `HitlDecision` 扩 `{ type:'respond'; message }`。
- `runtime/controllers/dto/approve.dto.ts` — `HitlDecisionDto` 的 `@IsIn` 扩 `'respond'` + `message`(现成)。
- `runtime/controllers/chat.controller.ts` — `approve()` 的 `decisions.map`(153–157)加 `respond` 分支。
- `shared/types.ts` — `AgentEventType` 加 `'ui_widget'`。
- `engine/providers/event.mapper.ts` — 加一臂 `on_custom_event && name===EMIT_WIDGET_EVENT → [{type:'ui_widget', payload:{...widget}}]`(**紧贴 37–40 行 `ANALYZE_PROGRESS_EVENT` 写法**)+ 新增 `EMIT_WIDGET_EVENT` 常量与 `dispatchWidget()` helper。

---

## 7. 落地顺序

1. **(本步)** 本 ADR 评审定方向。
2. **前端契约层**:`widgets/{types,registry,DecisionCard}` + `WidgetHost` + `types.ts` + `ChatThread` 一臂;先用 **mock `ui_widget` 事件**驱动 DecisionCard 跑通渲染(不依赖后端)。
3. **后端**:`ask_choice` 工具 + `interruptOn`(respond/reject)+ `ui_widget` 映射 + `dispatchWidget`。
4. **前端 `onWidgetAction`** resume 接线。
5. **E2E**。

---

## 8. 验证

- **后端单测**:`event.mapper.spec.ts` 加 `ui_widget` 映射用例;手动构造 `ask_choice` interrupt,断言 `tool_approval_request.payload.{toolName:'ask_choice', args.options}`。
- **前端渲染**:注册 `DecisionCard`,mock `ui_widget` 确认渲染 + zod 兜底降级。
- **E2E**:同起 `pnpm --filter @magic-resume/web dev` 与 agent-service,配好 BYOK;给二选一 prompt(如「简历做中文版还是英文版?」),确认:① 决策卡渲染 2 选项;② 点选后 run 续跑(SSE 不断流);③ agent 续写**用上了该选择**(验证 respond 决策回灌)。
- **契约同步**:两仓库 `AgentEventType` 仍**手动保持同步**,`ui_widget` 两边都加(沿用既有惯例)。

---

## 9. 收益与未来

- **体系化收益**:新增「任务卡 / 提案卡 / 表单卡」等 = ① 写一个 React 组件 + `WIDGETS` 注册一行;② 若需 agent 主动触发,写一个工具进 `interruptOn` 或调 `dispatchWidget`。**不再碰** `consumeStream`/`ChatThread` 的 switch,也**不再改**事件枚举(`ui_widget` 一个通用事件承载全部 emit-widget)。
- **未来路径**:若要跨端 interop,可把 `ui_widget`/事件流升级为完整 **AG-UI** 事件;若上 **LangGraph Platform**,可切到原生 `push_ui_message` + `LoadExternalComponent`。本设计的 API 形状已对齐两者,迁移成本低。

---

## 10. 参考

- AG-UI Protocol — <https://docs.ag-ui.com/introduction> ;事件 — <https://docs.ag-ui.com/concepts/events>
- LangGraph Generative UI(`push_ui_message`/`useStream`)— <https://docs.langchain.com/langsmith/generative-ui-react>
- deepagents Human-in-the-loop(`interrupt_on`/`allowed_decisions`)— <https://docs.langchain.com/oss/python/deepagents/human-in-the-loop> ;子代理 resume bug — <https://github.com/langchain-ai/deepagents/issues/554>
- CopilotKit `useCopilotAction` render — <https://docs.copilotkit.ai> ;Vercel AI SDK `streamUI` — <https://ai-sdk.dev/docs>
