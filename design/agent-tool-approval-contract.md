# Agent 工具授权契约(human-in-the-loop)— ADR 草案 v1

> **⚠️ 权威版已落 Magic-Core**:`Magic-Core/docs/agent-tool-approval-hitl.md`(已据 agent-service 源码定稿)。该稿证明 **§4.4 取案 A 的轻量变体**——敏感工具在流式生成器内 `await` 授权 promise 让 run 自然暂停,配 `dispatchCustomEvent('tool_approval_request')` + 进程内 `ApprovalCoordinator` + `POST /api/chat/approve`,**无需 LangGraph checkpointer / 线程持久化**。
> **本稿留作前端侧速览**(事件 / 端点 / 时序 / 边界),细节与后端实现以 Magic-Core 那份为准。
> **实现的决议**:`ai-lab-guided-create.md` §6.5 ——「AI 读取用户简历必须先经用户授权,工具授权弹层(Claude Code 式 human-in-the-loop)」。

---

## 1. 背景与问题

- AI 在对话中会自主调用工具(当前如 `read_resume`)。**读用户简历属于敏感动作,需用户明确授权**——这是 `ai-lab-guided-create.md` §6.5 的产品决议,也是北极星「AI 是合作者:改动先提案、可拒绝、有理由」向「读」的延伸。
- 现状:`POST /api/chat`(`mode:'create'`)是单向 SSE,agent 在服务端 ReAct 循环里**直接执行** `read_resume` 并发 `tool_started`。前端无从插手 → 截图里"正在读取你的简历…"就是未授权偷读。
- 难点:**SSE 是单向 server→client**。要做 human-in-the-loop,得让 agent run 在调敏感工具前**暂停、请示、等回传、再续跑 / 跳过**。

---

## 2. 决议

采「**工具授权弹层**」模型(产品侧已定,见 §6.5):

1. agent 自主决定要不要用工具;要用**敏感工具**时,不直接执行,先发 `tool_approval_request` 并**暂停 run**。
2. 前端渲染轻量授权卡 → 用户 [允许 / 拒绝]。
3. 决定经一个**反向端点**回传后端;后端据此**续跑(执行工具)或跳过(把"用户拒绝"作为工具结果喂回 agent,让它继续而非中断)**。

**通用性**:本契约面向"敏感工具"这一类,不写死 `read_resume`、不只服务 create。任何技能、任何敏感工具(未来如 `write_resume`、`read_contact`)复用同一闸门。

---

## 3. 适用范围

- **敏感工具清单**(后端维护,建议配置化):MVP 仅 `read_resume`。
- **触发面**:所有走 agent run 的端点(`/api/chat` 全 mode、活的画布单字段指令等)。analyze/translate 等不读敏感数据的工作流不触发。
- **不在范围**:用户自己显式发起、对自己数据的整篇操作(optimize/translate/analyze)——那是用户主动行为,不算"AI 背着我读"。仅 **agent 自主、临场**的敏感工具调用需弹层。

---

## 4. 契约

### 4.1 新增 SSE 事件 `tool_approval_request`

复用既有 `AgentSseEvent` 信封,新增一个 `type`:

```jsonc
{
  "type": "tool_approval_request",
  "runId": "run_abc",                  // 已有字段,用于关联回传
  "sequence": 12,
  "payload": {
    "requestId": "appr_xyz",           // 本次授权请求唯一 id(同一 run 可多次)
    "toolName": "read_resume",
    "reason": "看你现有的简历,好针对目标岗位给建议",   // 给用户看的一句话,模型生成,走 i18n 兜底
    "scope": "resume",                 // 敏感资源类别(便于"本会话记住"按类别记)
    "args": { "resumeId": "res_123" }  // 可选,工具入参摘要(不含敏感内容本身)
  }
}
```

- 发完此事件,**run 进入 `awaiting_approval` 暂停态**,SSE 流保持打开但不再产新事件(可发心跳,见 §5)。
- 新增对应 `AgentEventType` 成员;前端镜像 `ai/lib/services/types.ts` 同步加 `tool_approval_request`。

### 4.2 授权回传端点

新增反向端点(与 chat 同源、同鉴权):

```
POST /api/chat/approve            (agent-service)
  body: { runId, requestId, approved: boolean, remember?: "once" | "session" }
  → 200 { ok: true }
```

- 前端经 **Next 代理**(`/api/chat-agent/approve`)+ `serverFetchBackend()` 转发 Clerk token(与 `/chat` 一致,否则 401)。
- `remember:"session"` = "本会话内同类资源不再问"(§6),后端在 run / 会话上记授权位。
- 鉴权:必须校验该 `runId` 属于当前用户,防越权恢复他人 run。

### 4.3 时序

```
浏览器            Next代理(/chat-agent)        agent-service              LLM/工具
  │ POST /api/chat(create) ─────────────────────▶ run 启动                  │
  │◀─────────── SSE: run_started / message_chunk… ─────────────────────────│
  │                                              │ agent 想 read_resume     │
  │◀──────────── SSE: tool_approval_request ─────│ run→awaiting_approval(暂停)
  │ 渲染授权卡                                    │ (流保持打开 + 心跳)       │
  │ 用户点[允许]                                  │                          │
  │ POST /chat-agent/approve ──▶ /chat/approve ──▶ 唤醒该 runId              │
  │◀───── 200 ok ───────────────────────────────│                          │
  │                                              │ 执行 read_resume ───────▶│
  │◀──────────── SSE: tool_started/…/message_chunk(续) ────────────────────│
  │◀──────────── SSE: resume_update / done ──────────────────────────────  │
```

拒绝:`approved:false` → agent 收到"用户拒绝读取"作为工具结果,**继续对话**(从零问、不读),不报错、不中断。

### 4.4 暂停 / 续跑机制 —— 两案(后端取舍)

**🟢 推荐 · 案 A:同流暂停 + 旁路唤醒。**
run 在敏感工具前 `await` 一个以 `(runId, requestId)` 为键的 future;`/chat/approve` 解析该 future 后 run 续跑,**继续在原 SSE 流上发事件**。
- 优点:前端 UX 无缝(一条流),最贴"临场请示"。
- 代价:暂停期需持有 SSE 连接;授权态需跨请求关联——**单实例**用进程内 Map 即可,**多实例**需 Redis pub/sub(approve 请求可能落到别的实例)。LangGraph 场景天然契合:`interrupt()` + checkpointer,`/approve` 用 `Command(resume=…)` 续跑。

**案 B:预授权 flag(更轻、但不够自主)。**
前端开场前问一次,授权才在 `/api/chat` 请求体带 `allowResumeRead:true`;后端据此决定 `read_resume` 工具对 agent **是否可见 / 可用**。
- 优点:无暂停 / 续跑 / 跨请求关联,实现最省。
- 代价:是"开场前一次性预批",不是"AI 临场自主请示",失去 agentic 质感;且粒度粗(整会话一刀切)。

> 倾向 A(与 §6.5 选定的"工具授权弹层"质感一致);若 Magic-Core 评估 A 的暂停 / 多实例成本过高,B 作为可接受降级。**此处是本 ADR 唯一需后端拍板的核心点。**

---

## 5. 边界与异常

| 情况 | 约定 |
|---|---|
| 用户久不决定 | run 在 `awaiting_approval` 设超时(建议 ~120s):超时按**拒绝**处理,发 `message_chunk` 说明并继续;SSE 期间发心跳注释帧(`: ping\n\n`)防代理掐连接 |
| 用户拒绝 | 不是错误:把"拒绝"作为工具结果回喂 agent,正常续聊 |
| 同一 run 多次请求 | 用 `requestId` 区分;`approve` 必须带对应 `requestId`,过期 / 不匹配返 409 |
| 浏览器断连 | run 标记放弃 / 回收;不得悬挂占资源 |
| 越权 approve | 校验 `runId` 属当前用户,否则 403 |
| 多实例 | 案 A 需 Redis pub/sub 把 approve 路由到持有 run 的实例 |

---

## 6. 授权粒度与记忆

- **单次(`once`)**:仅放行本次工具调用。
- **本会话(`session`)**:同类 `scope`(如 `resume`)本会话不再问——**建议默认提供此项**,避免反复打断;但**首次必问**。
- 不做跨会话持久授权(每次进实验室重新建立信任,符合隐私预期)。

---

## 7. 前端镜像改动(Magic-Resume,契约定稿后做)

1. `ai/lib/services/types.ts`:`AgentEventType` 加 `tool_approval_request`。
2. `agentClient.ts`:加 `approveTool({ runId, requestId, approved, remember })` → `POST /api/chat-agent/approve`;新增 Next 代理路由 `app/api/chat-agent/approve/route.ts`(`serverFetchBackend` 转发)。
3. `AiChatShell.runChat`:消费 `tool_approval_request` → 在线程插一张**授权卡**消息(新 `role:'approval'` 或复用 exec 卡变体),[允许/拒绝] 调 `approveTool`;期间维持"思考中"等待态。
4. **返工 §8.1**:开场种子去掉本地简历摘要;开场不读,改由 agent 经本授权流请示后读(见 `ai-lab-guided-create.md` §8.1 / §8.6)。

---

## 8. 待 Magic-Core 定夺

- 案 A vs 案 B(§4.4)——核心。
- 暂停超时时长、心跳帧格式。
- 敏感工具清单的配置位置 / 是否含未来 `write_*`。
- `mode:'create'` 是否已是 LangGraph(决定能否直接用 `interrupt()`),还是裸 ReAct 循环(需自建 future 等待)。
- 与 §8.2「create 增量吐 `resume_update`」一并排期(都改 chat run 这条链路)。
