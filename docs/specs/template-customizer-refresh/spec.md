---
title: 自定义面板重构 —— 清理死控件 + 精简配色 + 新增能力
type: spec
status: Draft
owner: kaihuang
created: 2026-07-16
updated: 2026-07-16
summary: 右侧「自定义」面板存在多个编辑后毫无渲染效果的死控件(圆角/副色/副字体/PDF 里的字距),配色选择器过多,且有一批已在渲染中使用却未暴露的字段。本方案:对症清理死控件、配色精简到 3 核心色 + 高级折叠、新增边框/背景色 + 两栏比例 + 页面规格 + 头像页眉四类能力。
scope: [apps/web, packages/resume-templates]
repos: [Magic-Resume]
related: [specs/editor-preview-ux/spec.md, specs/editor-relayout]
---

# 自定义面板重构

> 目标读者:实现者。本文定方案与验收;可执行任务见同目录 `tasks.md`。

## 1. 背景:三个用户反馈

1. **很多自定义控件编辑后对简历毫无效果**(死控件)。
2. **配色选择器太多**,主色/副色/正文/辅助文字/侧栏并列,分不清。
3. **希望新增更有价值的自定义能力**(用户原话「发挥想象」)。

面板入口:`apps/web/src/app/dashboard/edit/_components/templates/TemplatePanel.tsx`。它编辑 `working = mergeTemplateConfig(baseTemplate, customTemplate)`(完整 DSL),再经 `extractCustomConfig(baseTemplate, working)` 把差异回写 `resume.customTemplate`。有**两个渲染器**,一个字段要两端都消费该控件才算真正生效:

- HTML 渲染器:`packages/resume-templates/src/renderer/MagicResumeRenderer.tsx` + `templateLayout/*.tsx`(分享页 / AI 画布 / 版本历史)。
- PDF 渲染器:`packages/resume-templates/src/pdf/MagicResumePdfDocument.tsx`(**编辑器主画布预览** + PDF 导出)。

## 2. 审计矩阵(控件 → 渲染消费)

| 控件 | 面板暴露 | HTML | PDF | 结论 |
|---|---|---|---|---|
| 密度 spacing sm/md/lg | ✓ | ✓ `MagicResumeRenderer.tsx:117-121` | ✓ `MagicResumePdfDocument.tsx:756` | 生效 |
| containerWidth | ✓ | ✓ `Layout.tsx:17-18` | ✓ `:755` | 生效 |
| padding | ✓ | ✓ `Layout.tsx:30` | ✓ `:778` | 生效 |
| gap | ✓ | ✓ `Layout.tsx:31` | ✓ `:756` | 生效 |
| **borderRadius md/lg** | ✓ | ✗ 硬编码 `0.375rem`(`Layout.tsx:25`) | ✗ 硬编码(`:366,440,694`) | **死(两端)** |
| showTitleDivider | ✓ | ✓ `:134` | ✓ `:761` | 生效 |
| showTitleIcon | ✓ | ✓ `:135` | ✓ `:762` | 生效 |
| fontFamily.primary | ✓ | ✓ `:105` | ✓ `:774` | 生效 |
| **fontFamily.secondary** | ✓(条件) | ✗ CSS 变量设了但无引用 | ✗ 从不读 | **死(两端)** |
| fontSize.lg(标题) | ✓ | ✓ `:112` | ✓ `:253,417` | 生效 |
| fontSize.sm(正文) | ✓ | ✓ `:113` | ✓ `:548,598` | 生效 |
| lineHeight | ✓ | ✓ `:126` | ✓ `:770` | 生效 |
| **letterSpacing** | ✓ | ✓ `:127` → `Layout.tsx:24` | ✗ **PDF 从不读** | **死(PDF)** ← 主画布无效 |
| colors.primary | ✓ | ✓ `:99` | ✓ `:750` | 生效 |
| **colors.secondary** | ✓ | ✗ 无引用 | ✗ 从不读 | **死(两端)** |
| colors.text | ✓ | ✓ `:101` | ✓ `:750` | 生效 |
| colors.textSecondary | ✓ | ✓ `:102` | ✓ `:750` | 生效 |
| colors.sidebar | ✓(条件) | ✓ `:138-140` | ✓ `:800` | 生效 |
| **colors.border** | ✗ | ✓ `ProfileCard.tsx:28` `Timeline.tsx:26` `Header.tsx:57,187` | ✓ `:695` | **已用未暴露** |
| **colors.background** | ✗ | ✓ `Layout.tsx:20` | ✓ baseStyle `:767` | **已用未暴露** |
| **colors.accent** | ✗(仅主题预设写) | ✗ 无消费者 | ✗ | 死(可忽略) |
| **layout.twoColumn.\*** | ✗ | ✓ `TwoColumnLayout.tsx:50-70` | ✓ `:790-807` | **已用未暴露** |
| **header 组件 props** | ✗ | ✓ `Header.tsx:28-38` | ✓ `HeaderBlock:338-341` | **已用未暴露(需管线)** |

> 注:`fontSize.xs/md/xl/xxl` HTML 侧定义了 CSS 变量但组件未引用(PDF 的 ProfileBlock 用到 xl/xxl);面板本就只编辑 lg/sm,不在本次处理范围。

## 3. 已决策(2026-07-16 与用户确认)

- 死控件:**对症处理**——删纯装饰(圆角/副色/副字体),把 `letterSpacing` 接进 PDF 让它真生效。
- 配色:精简到 **3 核心色**(主色/正文/辅助文字),删副色,侧栏保持条件显示。
- 新增能力(四项全要):**边框/背景色**、**版式与两栏比例**、**头像与页眉**、**页面规格**。

## 4. 方案

### 4.1 Phase 0 — 死控件对症处理

1. 删 borderRadius `SliderField`(`TemplatePanel.tsx` ~329-337)与 `updateBorderRadius`(~160-172)。
2. 删 secondary 副色 `ColorField`(~467-472)。
3. 删 secondary 副字体 `FontField`(~374-385)。
4. **letterSpacing 接 PDF**:`MagicResumePdfDocument.tsx` 的 `baseStyle`(~766)加 `letterSpacing: cssSizeToPoints(typography.letterSpacing, 0)`。模板值为 px 字符串(如 `"0px"`),`cssSizeToPoints` 转 pt;react-pdf `Style.letterSpacing` 接受数字(pt)。

> 旧简历若带 `customTemplate` 里的这些死值,删控件只是停止编辑,`mergeTemplateConfig` 继续无害套用——无需数据迁移。

### 4.2 Phase 1 — 配色精简 + 高级折叠

Colors 分区(`TemplatePanel.tsx` ~436-494):

- **核心(默认可见)**:主色 `primary`、正文 `text`、辅助文字 `textSecondary`。
- **高级(折叠,默认收起)**:新增 `border`、`background` 两个 `ColorField`(复用现有 `ColorField` + `PANEL_PRESET_COLORS`)。
- `sidebar` 维持条件渲染(~485-492)。

合并侧零改动:`mergeTemplateConfig` 对 `colors` 整体展开(`templateUtils.ts:26-29`),`border`/`background` 自动 round-trip。i18n:`colors.background` 键已存在,新增 `colors.border`。

### 4.3 Phase 2 — 版式:两栏比例 + 页面规格

**2a. 两栏比例(条件显示)**:Layout 分区新增左栏宽 `twoColumn.leftWidth`、右栏宽 `twoColumn.rightWidth`、栏间距 `twoColumn.gap` 三滑杆,仅当 `working.layout.type === 'two-column' && working.layout.twoColumn` 时渲染。渲染与合并已就绪(`templateUtils.ts:87-97`;`TwoColumnLayout.tsx`;PDF `:790-807`),纯 UI。6 个两栏模板(azurill/chikorita/gengar/orange-modern/teal-professional/golden-elegant)均带 sidebar 组件,安全。

> **明确不做**:单栏↔两栏自由 `layout.type` 切换。单栏模板无 sidebar-area 组件,切成两栏会得空侧栏;需「章节→栏位分配」UI,是独立大功能,范围外。

**2b. 页面规格 A4 / Letter + 页边距预设**:

- DSL:`magic-dsl.ts` 的 `layout` 加 `pageSize?: 'A4' | 'Letter'`;`resume.ts` 的 `CustomTemplateConfig.layout` 同步;`mergeTemplateConfig` layout 段加透传(照 `containerWidth` 模式)。
- PDF:`pdf/page-size.ts` 的 `getFreeFormPageMinHeight(width)` → `(width, pageSize)`,按纸张比例算高(A4 = 841.89/595.28 ≈ 1.4142,Letter = 792/612 ≈ 1.2941);`MagicResumePdfDocument.tsx` 传入 `layout.pageSize`。页宽仍取 `containerWidth`(保留宽度滑杆);`pageSize` 段按钮附带把 `containerWidth` 设标准值(A4 794px / Letter 816px)作便捷预设。
- HTML:`Layout.tsx:14` 的 `a4MinHeight` 硬编码 `297/210` 改为按 `pageSize` 选比例。
- 面板:Layout 顶部加 `SegmentedField`(A4 / Letter,复用密度组件)。页边距预设 = 3 快捷按钮(紧凑16 / 标准24 / 宽松36)写 `layout.padding`(可选,低成本)。
- i18n:新增 `layout.pageSize` 等键。

### 4.4 Phase 3 — 头像 / 页眉(唯一需新增 round-trip 管线)

头像/联系方式样式在 **header 组件的 `component.props`** 上,而 `extractCustomConfig`/`mergeTemplateConfig` **目前只处理 designTokens + layout,不碰 components**——直接编辑 header props 会在下次任意改动时被 round-trip 丢弃。

方案(纳入同一差异管线,不改 store):

1. `CustomTemplateConfig`(`resume.ts`)加可选 `header?: { avatarPosition?; avatarWidth?; avatarHeight?; avatarRounded?; contactStyle? }`。
2. `mergeTemplateConfig`:套用后若 `customConfig.header` 存在,找到 header 组件(`type === 'Header' | 'ProfileCard'` 或 `dataBinding === 'info'`),并进其 `props`。
3. `extractCustomConfig`:把 header 组件 props 与 base 对比,差异写入 `customConfig.header`(与 designTokens/layout 对称,`applyTemplate` 无需改)。
4. 面板加控件:头像形状(圆/方 → `avatarRounded`)、头像大小(→ `avatarWidth`+`avatarHeight` 同值)、头像位置(左/右 → `avatarPosition`)、联系方式样式(图标/标签 → `contactStyle`),均条件显示(仅当模板 header 支持)。

渲染两端已消费(`Header.tsx:28-38`、PDF `HeaderBlock:338-341`),不改渲染。

## 5. 验收

1. `pnpm --filter @magic-resume/resume-templates build` + `apps/web` 下 `npx tsc --noEmit`(Node 22:`nvm use 22`)。
2. `pnpm --filter @magic-resume/web i18n:check`(zh/en 键对齐)。
3. 手测(**编辑器主画布是 PDF 渲染,务必看 PDF 预览而非仅 DOM**):
   - letterSpacing:拖字距 → PDF 预览字距变(Phase 0 修复点)。
   - 配色:主色/正文/辅助文字即时生效;展开高级改 border → 分隔线/时间线变色;改 background → 纸面底色变。
   - 两栏比例:切某两栏模板(如 azurill)→ 出现左右栏滑杆并生效;单栏模板不显示该组。
   - 页面规格:切 Letter → PDF 页面纵横比变矮宽;A4 复原。
   - 头像页眉:改圆/方、左/右、图标/标签 → 预览随动;刷新后仍在;再改别的控件后 header 设置不被清空(验证 Phase 3 管线)。
   - 回归:删掉的圆角/副色/副字体控件消失且不报错;旧简历打开正常。
4. Playwright MCP 走一遍编辑页做视觉确认(dev server 已在 :3000)。

## 6. 分期建议

Phase 0-2 覆盖「清理 + 精简 + 大部分新增」,风险低。Phase 3 工作量最大(唯一动 extract/merge 管线),可拆为独立后续。
