---
title: Magic-Resume Frontend Backend Integration
type: spec
status: Draft
owner: kaihuang
created: 2026-07-03
updated: 2026-07-04
summary: Frontend-only integration boundary for API routing, auth forwarding, streaming events, and response normalization.
scope: [apps/web]
repos: [Magic-Resume]
related: [specs/ai-lab-refactor-and-backend]
---

# Magic-Resume 前端后端集成边界

> 本文只描述前端需要维护的公共边界，不记录后端内部拓扑、端口、部署、守卫、队列或数据库细节。

## 目标

- 前端只维护一个 API origin 配置。
- 浏览器请求与 Next.js route handler 请求都通过统一的 API helper。
- 服务端代理请求负责携带当前用户凭证，组件层不接触凭证转发细节。
- 流式响应统一进入事件消费器，未知事件安全忽略。
- 普通 JSON 响应通过 service 层归一化，UI 组件只拿业务数据。

## 非目标

- 不在前端仓记录后端服务拆分、内部端口、部署规则或运行时实现。
- 不复制后端事件契约正文。
- 不让 UI 组件直接依赖后端响应包装格式。

## 前端约定

### API origin

- `NEXT_PUBLIC_API_URL` 是前端唯一 API origin。
- route 常量集中在 `apps/web/src/lib/api/routes.ts`。
- 组件只能调用 typed service，不能拼接后端 URL。

### Auth forwarding

- 浏览器端请求走 `httpClient` 拦截器。
- 服务端代理请求走统一 helper。
- token 获取、注入、失败处理都留在 API 层。

### Streaming

- AI Lab 只消费归一化后的事件对象。
- UI 对已知事件做增量渲染，对未知事件保持前向兼容。
- 事件名称和 payload 类型在 `ai/lib/services/types.ts` 维护前端镜像。

### Response normalization

- service 层负责兼容裸业务数据与包装响应。
- hook / component 不读 `.data.data` 这类传输细节。
- 新接口必须先加 service，再接 UI。

## 验收标准

- [ ] `apps/web` 中没有组件直接拼接 API origin。
- [ ] 服务端 route handler 不重复实现 token 注入逻辑。
- [ ] AI 流式事件只在 service / shell 层被解析。
- [ ] 文档和注释不暴露后端内部拓扑、端口或部署细节。
