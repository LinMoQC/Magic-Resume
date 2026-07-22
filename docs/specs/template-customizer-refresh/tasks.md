---
title: 自定义面板重构 —— 执行任务
type: tasks
status: Draft
owner: kaihuang
created: 2026-07-16
updated: 2026-07-16
summary: spec.md 的分阶段可执行清单。Phase 0-2 风险低,可先落;Phase 3 需动 extract/merge 管线,可独立后续。
scope: [apps/web, packages/resume-templates]
repos: [Magic-Resume]
related: [spec.md]
---

# 执行任务

> 每阶段结束跑验收(见 spec §5)。Node 22:`nvm use 22`。

## Phase 0 · 死控件对症处理

- [ ] `TemplatePanel.tsx`:删 borderRadius `SliderField`(~329-337)+ `updateBorderRadius` 回调(~160-172)。
- [ ] `TemplatePanel.tsx`:删 secondary 副色 `ColorField`(~467-472)。
- [ ] `TemplatePanel.tsx`:删 secondary 副字体 `FontField`(~374-385)。
- [ ] `MagicResumePdfDocument.tsx` `baseStyle`(~766):加 `letterSpacing: cssSizeToPoints(typography.letterSpacing, 0)`。
- [ ] 验收:拖字距滑杆,PDF 预览随动;删掉的三个控件消失且无报错。

## Phase 1 · 配色精简 + 高级折叠

- [ ] Colors 分区核心只留:主色 / 正文 / 辅助文字;sidebar 保持条件显示。
- [ ] 新增「高级」折叠小节,内含 `border`、`background` 两个 `ColorField`(复用 `PANEL_PRESET_COLORS`)。
- [ ] i18n:`zh/en` 新增 `templateCustomizer.colors.border`(`colors.background` 已存在)。
- [ ] 验收:改 border → 分隔线/时间线变色;改 background → 纸面底色变。

## Phase 2 · 版式

### 2a 两栏比例(条件显示)
- [ ] Layout 分区新增 `twoColumn.leftWidth/rightWidth/gap` 三滑杆,仅 `layout.type === 'two-column' && layout.twoColumn` 时渲染。
- [ ] 验收:azurill 等两栏模板出现并生效;单栏模板不显示。

### 2b 页面规格 A4 / Letter
- [ ] `magic-dsl.ts` `layout` 加 `pageSize?: 'A4' | 'Letter'`;`resume.ts` `CustomTemplateConfig.layout` 同步。
- [ ] `templateUtils.ts` `mergeTemplateConfig` layout 段透传 `pageSize`。
- [ ] `pdf/page-size.ts`:`getFreeFormPageMinHeight(width)` → `(width, pageSize)`,按比例算高。
- [ ] `MagicResumePdfDocument.tsx`:传入 `layout.pageSize`。
- [ ] `Layout.tsx:14`:`a4MinHeight` 改为按 `pageSize` 选比例(A4 297/210,Letter 279.4/215.9)。
- [ ] 面板:Layout 顶部 `SegmentedField`(A4/Letter);选项附带设 `containerWidth` 标准值。
- [ ] (可选)页边距预设:3 快捷按钮写 `layout.padding`。
- [ ] i18n:新增 `layout.pageSize` 等键。
- [ ] 验收:切 Letter → PDF 纵横比变矮宽;A4 复原。

## Phase 3 · 头像 / 页眉(独立后续)

- [ ] `resume.ts` `CustomTemplateConfig` 加 `header?: { avatarPosition?; avatarWidth?; avatarHeight?; avatarRounded?; contactStyle? }`。
- [ ] `mergeTemplateConfig`:存在 `customConfig.header` 时并进 header 组件(`type Header|ProfileCard` 或 `dataBinding info`)的 `props`。
- [ ] `extractCustomConfig`:diff header 组件 props → `customConfig.header`。
- [ ] 面板控件:头像形状(圆/方)、大小、位置(左/右)、联系方式样式(图标/标签),条件显示。
- [ ] i18n:新增 header 相关键。
- [ ] 验收:改动即时随动;刷新后仍在;改别的控件后 header 设置不被清空(管线正确的关键)。

## 收尾

- [ ] `pnpm --filter @magic-resume/resume-templates build` + `apps/web` `npx tsc --noEmit` 全绿。
- [ ] `pnpm --filter @magic-resume/web i18n:check` 通过。
- [ ] Playwright MCP 编辑页视觉确认。
