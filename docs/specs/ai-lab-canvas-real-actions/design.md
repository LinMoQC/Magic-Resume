---
title: AI Lab Canvas Real Actions
type: spec
status: Draft
owner: kaihuang
created: 2026-07-03
updated: 2026-07-04
summary: Frontend UX and service-boundary design for wiring canvas actions to real AI results.
scope: [apps/web]
repos: [Magic-Resume]
related: [specs/ai-lab-living-canvas, specs/ai-lab-refactor-and-backend, reference/agent-tool-approval-contract]
---

# AI Lab Canvas Real Actions

> 本文只描述画布动作的前端行为、状态和 service facade。具体模型调用、工具执行和后端路由由私有后端文档维护。

## 目标

- 画布上的局部动作从 mock 过渡到真实结果。
- 用户始终看到目标元素、处理中状态、提案 diff 和确认入口。
- 组件不关心真实结果来自哪个后端实现。

## 交互模型

| 阶段 | 前端行为 |
|---|---|
| 触发 | 用户在字段、段落或选区上选择动作。 |
| 处理中 | 目标区域 shimmer，不锁住整页。 |
| 返回 | 结果转成 `PendingChange`，显示红删绿增或字段级 diff。 |
| 评审 | 用户可以应用、拒绝、继续修改。 |
| 落地 | 只更新对应字段，并保留撤销/版本能力。 |

## Service Boundary

画布只调用语义化方法：

- `editResumeSnippet(...)`
- `translateSelection(...)`
- `rewriteSelection(...)`
- `buildPendingChange(...)`

这些方法可以接 mock、真实 service 或未来新引擎；UI 不拼接路由，不处理传输细节。

## 验收标准

- [ ] 所有画布动作都有 loading、success、error、cancel 状态。
- [ ] 返回结果必须进入 review flow，不能静默覆盖简历。
- [ ] UI 组件不包含后端路由、服务名或鉴权说明。
- [ ] 失败后保留原文，用户可重试。
