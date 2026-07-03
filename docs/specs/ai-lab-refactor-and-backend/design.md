---
title: AI Lab Frontend Refactor
type: spec
status: Draft
owner: kaihuang
created: 2026-07-03
updated: 2026-07-04
summary: Frontend-only design for the AI Lab feature root, service layer, canvas integration, and migration away from mock-only flows.
scope: [apps/web]
repos: [Magic-Resume]
related: [specs/frontend-v2-backend-integration, specs/ai-lab-canvas-real-actions]
---

# AI 实验室前端重构

> 本文只描述 Magic-Resume 前端结构和 UI 接线。后端运行时、服务拓扑、鉴权、工具实现、数据读取策略由后端私有文档维护。

## 背景

AI Lab 原先把对话、技能、画布、mock 逻辑混在同一层，导致两类问题：

- UI 组件同时承担交互、状态编排和服务适配。
- mock 生成器与真实服务接线边界不清，后续替换成本高。

## 目标

- `ai/` 成为 AI Lab 的特性根目录。
- UI、状态模型、服务客户端、mock、画布逻辑分层。
- 组件只表达 UI，业务规则落到 model/service/helper。
- 所有真实请求从 service 层出去，UI 不知道后端内部实现。

## 建议结构

```text
ai/
  canvas/
  conversation/
  interview/
  lib/
    services/
    mock/
    changeModel.ts
    diffResume.ts
    editableCanvas.tsx
  widgets/
  AiChatShell.tsx
```

## 分层边界

| 层 | 职责 |
|---|---|
| `conversation/` | 消息列表、输入框、授权卡、等待态。 |
| `canvas/` | 简历预览、可评审改动、局部动作入口。 |
| `lib/changeModel.ts` | 待评审改动模型，和服务来源无关。 |
| `lib/services/` | 前端 service facade，负责请求、流解析和响应归一化。 |
| `lib/mock/` | 本地演示与降级数据，不进入组件主逻辑。 |
| `widgets/` | GenUI 渲染契约和具体 widget。 |

## 迁移原则

- 先抽模型和服务边界，再替换具体数据来源。
- 保留 UI 的等待态、错误态、取消态。
- service 层只暴露“分析、聊天、编辑、授权”这类产品语义。
- 文档和注释只描述前端可见行为，不记录后端实现细节。

## 验收标准

- [ ] AI Lab 组件不直接拼接 API URL。
- [ ] mock 逻辑与真实 service 可替换。
- [ ] `PendingChange`、diff、patch 等逻辑可单测。
- [ ] 关闭会话或新建会话时，前端会中止仍在进行的请求。
