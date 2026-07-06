---
title: PDF 导入 · 流式解析与实时进度
type: spec
status: Draft
owner: kaihuang
created: 2026-07-06
updated: 2026-07-06
summary: 把 PDF 导入简历的 AI 解析从「阻塞请求 + 转圈」升级为端到端 SSE 流式，实时展示解析进度并逐步点亮已识别的简历板块。
scope: [apps/web, apps/agent-service]
repos: [Magic-Resume, Magic-Resume-Core]
related: [specs/ai-lab-living-canvas, specs/ai-lab-guided-create]
---

# PDF 导入 · 流式解析与实时进度

> 本稿定义前端 UX / 状态 / 文案，以及为支撑「实时进度」所需的**端到端事件契约**。具体 agent 运行、LLM 网关与预算实现细节以 agent-service 现有实现为准，不在此展开。

## 背景与问题

上传 PDF 导入简历时，AI 需数十秒把 PDF 文本解析成结构化 JSON。当前交互只有一个转圈加两句静态文案（`Extracting text...` / `AI is analyzing...`），用户全程无法感知进度，等待焦虑、疑似卡死。

关键事实：**后端其实已在内部流式**——`PdfService.runModel` 消费 `TaskWorkflowService.streamPrompt()`（逐 token 产出 `message_chunk`），却把所有 token 累积成字符串，再在每一跳（agent-service → Next.js route → 前端）缓冲成一次性 JSON 返回。流式能力已具备，只是被「攒成一坨」。

本方案把这条链路打通为端到端 SSE，并在模型逐段吐出 JSON 时**逐个点亮已识别的简历板块**，全程复用 chat 已在用的 SSE 基建。

## 设计目标

- 上传后立即给出真实、连续的进度反馈，消除「疑似卡死」。
- 模型解析过程中，随内容到达**逐步点亮**个人信息 / 工作 / 教育 / 项目 / 技能等板块。
- 复用现有 SSE 基建（`runSse` / SSE 透传 route / `streamAgent`），不新增规范化事件类型、不改动网关。
- 进度是「装饰」，绝不影响导入正确性：最终仍走既有校验，失败可降级。

## 非目标

- 不改 JSON 导入路径（本地读取，无 AI，不涉及）。
- 不引入 OCR / 扫描件识别；图片型 PDF 仍按现状报错。
- 不把 agent-service 内部端口、服务名、预算实现写入前端文档。
- 不做「断点续传」或多文件批量导入。

## 交互模型

```
用户选 PDF → 拖入/选择
   │
   ├─ 前端 POST /api/pdf/parse (multipart, 流式)
   │
   ├─ ① 阶段:提取文本      → 勾选「提取文本 ✓」
   ├─ ② 阶段:AI 解析中…    → elapsed 计时器走动
   │     ↑ 模型逐段吐 JSON,命中锚点即点亮对应板块
   │        个人信息 ✓ → 工作经历 ✓ → 教育经历 ✓ → …
   │
   └─ ③ 完成 → 校验 → importResume → toast → 关闭弹窗
         或  失败 → 错误提示 + 复位 dropzone
```

关闭弹窗即中断:`AbortController` → route 透传 `req.signal` → `runSse` 监听 `response 'close'` 停止上游 BYOK 调用,不留孤儿请求。

## 事件契约

链路统一走规范化 `AgentSseEvent`(`data: {json}\n\n` 帧)。**复用现有事件类型**,不扩充 union:

| 时机 | type | 载荷 | 前端动作 |
|---|---|---|---|
| 文本提取开始 | `tool_result` | `payload: { kind:'pdf_progress', stage:'extracting' }` | 阶段=提取文本 |
| 进入 AI 解析 | `tool_result` | `payload: { kind:'pdf_progress', stage:'analyzing' }` | 阶段=解析中,起计时器 |
| 命中新板块 | `tool_result` | `payload: { kind:'pdf_progress', stage:'analyzing', field:'experience' }` | 点亮该板块(每字段仅一次) |
| 生成活体信号 | `tool_result` | `payload: { kind:'pdf_progress', charCount:N }` | 更新「已解析 N 字」(节流) |
| 最终产物 | `resume_update` | `data: <normalized resume_json>` | 校验 → 导入 |
| 结束 | `done` | — | `runSse` 自动写,收尾 |
| 失败 | `error` / `run_failed` | `error: <msg>` | 错误提示 + 复位 |

> 选择复用 `tool_result` + `payload.kind` 与已存在的 `resume_update`,避免前后端两份 `AgentSseEvent` union 漂移。前端仅按 `ev.payload?.kind === 'pdf_progress'` 分支。

### 字段锚点

模型输出 JSON 的键**按序稳定出现**(见 `document/prompts/pdf.prompts.ts`)。服务端对累积文本做「首次出现即命中」检测(只增不减、鲁棒容错):

| 锚点子串 | field key | 展示标签 |
|---|---|---|
| `"fullName"` | `info` | 个人信息 |
| `"experience"` | `experience` | 工作经历 |
| `"education"` | `education` | 教育经历 |
| `"projects"` | `projects` | 项目经历 |
| `"skills"` | `skills` | 技能 |
| `"languages"` | `languages` | 语言 |
| `"certificates"` | `certificates` | 证书 |

## 关键状态

| 状态 | 用户所见 | 说明 |
|---|---|---|
| 空闲 | 类型选择 + dropzone | 现状不变 |
| 提取文本 | 「提取文本 ✓」板块清单全灰 | 极快,一闪而过也无妨 |
| 解析中 | 计时器 + 板块随事件逐个点亮 + 「已解析 N 字」 | 核心体验;即便无 field 事件,计时器与字数也在动 |
| 完成 | 全部勾选态一闪 → 关闭 + toast | 与现有成功行为一致 |
| 失败 | 错误横幅,dropzone 复位可重试 | 扫描件 / 空骨架 / 401 / 预算超限 |
| 中断 | 关闭弹窗即停 | 上游取消,无残留 |

## 组件与服务落点

### 前端 `Magic-Resume/apps/web`

- `src/app/api/pdf/parse/route.ts` — 由「await JSON」改为 **SSE 透传**,镜像 `app/api/chat-agent/route.ts`(逐行转发 + `req.signal`)。FormData 经 `serverFetchBackend` 原样透传;保留流开始前的 JSON 错误路径(401/429/预算)。
- `.../ai/lib/services/agentClient.ts` — 抽出共享帧解析 `consumeSseFrames(res)`;新增 `streamPdfParse(formData, signal)`(FormData body,不设 `Content-Type`)。
- `src/app/dashboard/_components/ImportResumeDialog.tsx` — 重写 `handlePdfFile`:消费事件、驱动进度面板、`AbortController` 取消。`resume_update.data` 仍走既有 `validateAndNormalizeImportedResume` → `importResume`。
- 进度面板(新 UI):阶段行 + 计时器 + 板块勾选清单。视觉遵循 `.impeccable.md`——深色工作台、单一 sky 点缀、克制、仅 transform/opacity、不弹跳。
- i18n `src/locales/zh|en/translation.json` — 新增 `importDialog.progress.*`(阶段文案、板块标签、`parsedChars`、`elapsed`)。

### 后端 `Magic-Resume-Core/apps/agent-service`

- `document/pdf.controller.ts` — `@Post('parse')` 改流式:加 `@Req()/@Res()`,沿用现有文件校验,委托 `AgentStreamService.runSse({ response, userId, execute })`。
- `document/pdf.service.ts` — 新增 `parseStreaming(file, config, emit)`:`emit` 阶段 → `extractText` → `streamPrompt` 循环中累积并 `emit` 板块命中 / 字数 → `extractLastObject`/`parseJsonObject`/`normalizeResumeJson`/`hasExtractedResumeData` 校验(与现 `parse` 一致);`execute` 收尾 `emit({ type:'resume_update', data: resume_json })`。
- `document/lib/pdf-field-progress.ts`(新)— 导出 `PDF_FIELD_ANCHORS` 与纯函数 `detectNewFields(content, seen)`,便于单测。
- `document/document.module.ts` — `imports` 增加导出 `AgentStreamService` 的 orchestration module。
- 复用点:`runSse` 已设 `text/event-stream` + `X-Accel-Buffering: no` + 预算/追踪 + 错误帧;chat 已验证 SSE 经网关通路可用,PDF 同路复用,无需网关改动。

## 降级与风险

- **进度不影响正确性**:字段点亮仅基于文本命中;解析异常仍由既有校验兜底,不会「看起来成功实则空简历」。
- **弱模型 / 乱序输出**:锚点按到达点亮,不强依赖顺序;检测去重、只增不减。
- **SSE 被中间层缓冲**:沿用 chat 已解决的 `X-Accel-Buffering: no` 与线上反代 `proxy_buffering off`(见运维记录),PDF 同路受益。
- **取消竞态**:统一以 `req.signal` / `response 'close'` 传播,避免孤儿 BYOK 调用。

## 验收标准

1. 用**内容较多**的真实 PDF 导入:进度面板板块随模型吐字**逐个点亮**、计时器走动;Network 中 `/api/pdf/parse` 为 `text/event-stream` 且**分帧到达**(非一次性)。
2. 扫描件 / 图片 PDF → `UnprocessableEntity`,前端错误提示 + dropzone 复位。
3. 解析中途关闭弹窗 → 上游请求取消,后端无继续生成。
4. 未配置 LLM / 预算超限 / 401 → JSON 错误路径,提示正确。
5. JSON 导入路径不受影响。
6. `detectNewFields` 单测:顺序命中、去重、乱序容错。
7. 最终导入结果与改造前一致(同一 PDF 产出等价 `resume_json`)。
