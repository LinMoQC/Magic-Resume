---
title: Magic-Resume Analytics Frontend Boundary
type: spec
status: Draft
owner: kaihuang
created: 2026-07-03
updated: 2026-07-04
summary: Frontend-only analytics event catalog, privacy rules, and SDK integration boundary for Magic-Resume.
scope: [apps/landing, apps/web]
repos: [Magic-Resume]
related: [reference/tracking-plan]
---

# Magic-Resume Analytics Frontend Boundary

> 本文只保留前端埋点边界和隐私规则。采集服务、存储、队列、后台查询、管理端和私有包发布策略不放在前端公开仓。

## 目标

- 前端有统一的事件命名和发送入口。
- OSS / preview / self-hosted 场景默认可安全降级为 noop。
- 事件 payload 不携带简历正文、Prompt、API key、token 或可识别隐私。
- UI 组件只调用语义化 `track(...)`，不关心 transport。

## 前端事件范围

| 区域 | 示例事件 |
|---|---|
| Landing | page view、CTA click、language switch |
| Dashboard | resume create、import open、template choose |
| Editor | section edit、template switch、export click |
| AI Lab | skill start、proposal apply/reject、tool approval decision |
| Settings | provider choose、MCP token create/revoke |
| Error/Perf | client error、web vitals |

完整事件清单见 [tracking-plan](../../reference/tracking-plan.md)。

## 隐私规则

- 不发送简历正文、用户输入的大段文本、Prompt、模型输出全文。
- 不发送 API key、PAT、session token、Authorization header。
- URL 只保留 pathname，不带 query 中的敏感参数。
- 错误事件只保留错误类型、模块和脱敏后的 message。
- 用户标识由 SDK 或宿主注入，组件不自行拼接身份字段。

## 接入方式

- SDK 初始化放在 provider/bootstrap 层。
- 事件定义集中管理，避免各组件散落字符串。
- 当 analytics endpoint 不存在或配置关闭时，调用应静默 noop。
- 失败不影响主流程，不向用户展示埋点错误。

## 验收标准

- [ ] 前端没有散落的裸事件名。
- [ ] payload 经过类型约束和脱敏。
- [ ] 关闭或缺失 analytics 配置时，应用仍可完整运行。
- [ ] 文档不包含采集服务内部实现、存储结构或私有部署信息。
