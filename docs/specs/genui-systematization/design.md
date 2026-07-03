---
title: GenUI Systematization
type: spec
status: Draft
owner: kaihuang
created: 2026-07-03
updated: 2026-07-04
summary: Frontend widget contract for rendering typed interactive assistant output.
scope: [apps/web]
repos: [Magic-Resume]
related: [reference/agent-tool-approval-contract, specs/ai-lab-living-canvas, specs/frontend-v2-backend-integration]
---

# GenUI Systematization

> 本文只描述前端如何把结构化 assistant 输出渲染成交互组件。生成、推送和后端执行机制不在前端公开仓记录。

## 目标

- LLM 不只输出文本，也能触发类型安全的 UI widget。
- 每个 widget 都有明确 schema、渲染组件、提交/取消事件。
- 一个坏 widget 不能破坏整条对话。
- UI 组件只处理显示和用户交互，业务决策走 shell/service 层。

## Widget Contract

```ts
type AiWidgetPayload = {
  type: string;
  id: string;
  props: Record<string, unknown>;
};
```

前端要求：

- `type` 必须命中注册表。
- `props` 通过本地 schema 校验后才渲染。
- 不认识的 widget 渲染为安全 fallback。
- widget 事件向上抛出语义化 action，不直接请求后端。

## Registry

```text
widgets/
  types.ts
  registry.ts
  FormCard.tsx
```

注册项包含：

- widget type
- props schema
- React component
- fallback title

## HITL Integration

授权卡也是一种会话内交互组件，但它承载的是用户许可，不展示内部工具名或后端实现。详见 [Agent 工具授权前端速览](../../reference/agent-tool-approval-contract.md)。

## 验收标准

- [ ] widget props 有集中校验。
- [ ] 未知 widget 不会导致会话崩溃。
- [ ] widget 组件不直接拼接 API URL。
- [ ] 注释不引用后端内部实现或私有 ADR。
