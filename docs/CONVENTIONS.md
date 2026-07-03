---
title: Magic-Resume docs conventions
type: reference
status: Living
owner: kaihuang
created: 2026-07-03
updated: 2026-07-03
summary: Documentation structure, front-matter, naming, status lifecycle, and cross-repo authority rules for Magic-Resume.
scope: [docs]
repos: [Magic-Resume]
related: [README.md]
---

# Magic-Resume docs conventions

> 本规范对齐 `Magic-Resume-Core/docs/CONVENTIONS.md`，但权威归属改为前端仓：UX、交互、文案、apps/web 与 packages/* 的前端实现说明放在这里；后端契约、Agent runtime、平台 API 仍以 Magic-Core 为准。

## 目录结构

```text
docs/
├── README.md
├── CONVENTIONS.md
├── adr/
├── specs/<feature-slug>/{spec.md,design.md,tasks.md}
├── architecture/
├── reference/
├── reviews/
├── archive/
├── templates/
└── _meta/
```

## 放置规则

| 问题 | 目录 |
|---|---|
| 一次具体评审的结论快照 | `reviews/` |
| 用法、清单、资料汇总，不约束实现 | `reference/` |
| 描述当前真实结构，会随代码更新 | `architecture/` |
| 硬性的架构或技术决策 | `adr/` |
| 一个功能的需求、UX、技术设计、任务拆解 | `specs/<feature-slug>/` |

## Front-matter

每篇文档都以 YAML front-matter 开头：

```yaml
---
title:
type: spec
status: Draft
owner: kaihuang
created: YYYY-MM-DD
updated: YYYY-MM-DD
summary:
scope: [apps/web]
repos: [Magic-Resume]
related: []
---
```

`type` 可选：`adr`、`spec`、`architecture`、`reference`、`review`。

`status` 可选：`Draft`、`Proposed`、`Accepted`、`Implemented`、`Living`、`Superseded`、`Deprecated`。

## 命名

- ADR：`adr/NNNN-kebab-title.md`。
- Spec：`specs/<feature-slug>/{spec,design,tasks}.md`。
- 其它：英文 kebab，如 `reference/tracking-plan.md`。
- 不在文件名里写版本、状态或中文。

## 跨仓权威

一个跨切面主题只保留一个权威文档：

- 前端 UX、交互、文案、apps/web 适配方案：`Magic-Resume/docs`。
- 后端契约、Agent 运行时、Graph/API 语义：`Magic-Resume-Core/docs`。
- 另一侧只写速览或 `related:` 链接，不复制一份可漂移的正文。

## 完成检查

- [ ] 文件放在正确目录。
- [ ] front-matter 字段齐全。
- [ ] `README.md` 索引已更新。
- [ ] 旧路径引用已更新。
- [ ] 被取代文档已移入 `archive/` 并标记 `Superseded` 或 `Deprecated`。
