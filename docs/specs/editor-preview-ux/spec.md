---
title: 编辑器预览体验专项 —— 字体子集化 + canvas 双缓冲 + 入场过渡
type: spec
status: Draft
owner: kaihuang
created: 2026-07-14
updated: 2026-07-14
summary: 一次性解决编辑器三大体验问题——首屏慢(110MB 中文字体 + 浏览器端 react-pdf 生成 PDF)、编辑时 canvas 重绘闪烁、入场与操作过渡不够优雅。已决策:保持 canvas 像素级预览,靠字体子集化 + 真双缓冲压闪烁,过渡优雅同轮做。
scope: [apps/web, packages/resume-templates]
repos: [Magic-Resume]
related: [specs/editor-relayout/design.md, specs/light-theme]
---

# 编辑器预览体验专项

> 目标读者:实现者。本文定方案与验收;可执行任务见同目录 `tasks.md`。

## 1. 背景:三个用户反馈

1. **首次打开编辑器很慢。**
2. **每次编辑,简历预览区闪烁刷新**(canvas 重绘),体验不好。
3. **进入编辑器的过渡不够优雅**,期望"所有操作都优雅"。

## 2. 根因(已实锤)

### 2.1 预览是"双引擎",链路天然重

```
简历数据
 → @react-pdf/renderer 在浏览器端现生成完整 PDF     ← 慢(布局 + 字体子集化,主线程)
 → pdfjs-dist(legacy build + worker)解析 PDF       ← 中
 → 逐页 render 到 <canvas>                           ← 快(用户看到的"那步")
```

- 编辑器主预览:`apps/web/.../preview/ResumePreviewPanel.tsx` → `PdfCanvasPreview.tsx`(canvas)。
- 生成引擎:`packages/resume-templates/src/pdf/browser.tsx` 的 `createMagicResumePdfBlob`,底层 `@react-pdf/renderer@4.5.1`(内含 yoga 布局)。
- 触发点:`PdfCanvasPreview` 的 `useEffect([resume, locale])`,首次 `delay=0` 立即跑,之后 `UPDATE_DEBOUNCE_MS=150` 防抖。

### 2.2 首屏慢的第一元凶:中文字体巨大且未子集化

`apps/web/public/fonts` 是思源黑/宋 SC 的**完整 woff**,每个 13–16MB,**整目录 110MB**:

| 文件 | 大小 |
|---|---|
| SourceHanSerifSC-Bold.woff | 16M |
| SourceHanSansSC-Bold.woff | 14M |
| SourceHanSansSC-Regular.woff | 13M |
| …(黑/宋各 4 变体:Regular/Bold/Oblique/BoldOblique) | 13–16M |

- 默认 sans 模板首屏生成 PDF 至少要 **Regular(13M)+ Bold(14M) ≈ 27MB**;简历含斜体再 +26MB。
- **即便命中浏览器缓存**,`@react-pdf/renderer` 每次生成仍要把 13–16MB 的 woff 读入并做字形子集化嵌入 —— 这步在主线程,直接卡首帧。

### 2.3 闪烁的本质:canvas 是位图快照,无法增量

- 改一个字 → `activeResume` 引用变(immer,并 bump `updatedAt`,见 `store/useResumeStore.ts:351-361`)→ 150ms 后**整份 PDF 重生成 + 全页 canvas 重画**。
- 作者已用 `staged / active / exiting` 三层 crossfade(`CROSSFADE_DURATION_MS=180`)做双缓冲雏形,但残留闪烁源仍在:
  1. **首次**无 active 层时,`PdfPreviewLoader` → canvas 是硬切。
  2. **白底**:staged 层 `figure` 是 `bg-white`,新层画完前是白矩形(靠 opacity:0 遮,但边界窗口存在)。
  3. **尺寸跳**:`pageSize` 未知时用默认 `794×1123`,拿到真实尺寸后布局跳动。
  4. **提示噪声**:`state.loading && activeLayer` 时反复闪现"正在更新 PDF 预览…"角标。
  5. **无谓重绘**:effect 依赖整个 `resume` 引用,非渲染字段(`updatedAt`/`syncStatus` 等)变化也触发重生成。
  6. **crossfade 可感**:内容几乎相同也走 opacity 0→1 淡入,人眼可察"闪一下"。
- 对照:`MagicResumeRenderer`(DOM 渲染,已用于分享页 / AI canvas / 版本历史)天然增量、不闪。**但本专项已决策保留 canvas 以换像素级 WYSIWYG**,故走"真双缓冲"而非换渲染器。

### 2.4 入场是四段硬切,缺统一编排

```
ResumeEditSkeleton(骨架) → 编辑器挂载 → 预览区 Loader2 转圈 → PdfPreviewLoader 骨架 → canvas 突现
```

各段自带转圈/骨架、互不衔接;面板折叠有 `transition-all 300ms`,但**无统一入场编排(stagger)、无骨架→canvas 的 crossfade、无路由级过渡**。设计系统底子已有(`.impeccable.md`:深色台面 `#0A0A0A`、sky `#38bdf8`、仅 transform/opacity、不弹跳),尚未系统性铺开。

## 3. 目标 / 非目标

**目标**
- 首屏(冷/热缓存)显著加速:字体下载 ↓80%+;首帧可见时间明显下降。
- 编辑重绘"无感":消白闪、消尺寸跳、消反复提示;非渲染字段变化不触发重绘。
- 入场与操作统一"优雅":骨架→内容 stagger 淡入、骨架→canvas crossfade、操作微交互对齐 `.impeccable.md`。

**非目标(本轮)**
- 不改预览渲染架构(**保持 canvas 像素级 WYSIWYG**,已决策)。
- 不重写模板 DSL / 导出管线。
- 不动 Clerk / cloud sync(仓库 guardrail)。

## 4. 关键决策(已拍板)

| 决策 | 选定 | 理由 |
|---|---|---|
| 渲染架构 | **纯 canvas + 子集化优化** | 保像素级 WYSIWYG;闪烁靠双缓冲减轻(非根治,可接受) |
| 字体工具 | **subset-font**(node / harfbuzz-wasm) | 纯 node,不污染环境,CI 里 pnpm 即可跑 |
| 字体格式 | **woff2 优先,spike 失败退 woff** | 最小体积;`fontkit@2.0.4` 支持 woff2 输入,但 react-pdf 端需 spike 验证 |
| 字符集 | **通用规范汉字表 8105 + 拉丁 + 标点符号**,并做**运行时 fallback** | 覆盖现代中文 99.99%;生僻字(人名)缺字时按需加载完整字体 |
| 过渡优雅 | **与架构一起做** | 渲染/首帧行为一改,入场链路也变,同轮做衔接更顺 |

## 5. 方案 A —— 字体子集化(首屏关键路径)

- **工具**:`subset-font`(npm,harfbuzz wasm),输出 woff2 / woff。
- **字集**:`8105 通用规范汉字` + ASCII + CJK 标点(`U+3000–303F`、全角符号)+ 常用符号;字表文件入 repo(`packages/resume-templates/fonts/charset-8105.txt` 或脚本内联)。
- **脚本**:新增 `scripts/subset-fonts.mjs`,可复现,`pnpm` 一条命令重跑;输入现有 8 个完整 woff(作为源,原文件保留),输出 8 个子集文件。
- **接入**:更新 `pdf/browser.tsx` 的 `pdfFontManifest`(文件名/后缀),bump `PDF_RENDERER_VERSION`(现 `pdf-canvas-woff-fonts-v15`)使浏览器缓存失效。
- **fallback**:完整字体移到 `public/fonts/full/`;运行时扫描简历文本,发现子集外字符 → 动态 `Font.register` 对应完整字体 URL,仅按需拉取。
- **预期(spike 实测佐证)**:单文件 13–16MB → woff2 **~2.3–2.9MB**(spike:Regular 6.9k 字集 13.10MB→**2.34MB, 17.9%**);首屏字体下载 ~27MB → **~5–6MB**;react-pdf 读取的源文件小一个数量级 → 主线程卡顿显著缓解。
- **可选字体全覆盖(用户要求「可选字体里面都要有」)**:UI `PANEL_FONTS` 的中文选项映射到三类可嵌入开源字体 —— 黑体系(苹方/微软雅黑/思源黑)→ 思源黑;宋体 → 思源宋;**楷体 → 霞鹜文楷 LXGW WenKai(SIL OFL,新引入;思源家族无简体楷体;Regular=常规、Medium=加粗)**。此前楷体因 CSS 栈含 `serif` 被 `getResumeFontCategory` 误判为宋体,现增加 `kai` 类修正。苹方/微软雅黑/宋体/楷体等系统字体版权不可嵌入,统一用开源等价。拉丁字体(Inter/Roboto/Georgia 等)保持 react-pdf 内置 Helvetica/Times。

## 6. 方案 B —— canvas 真双缓冲(消闪烁)

在现有 layer 机制上做增量升级,不换渲染器:

- **B1 渲染指纹去重**:`PdfCanvasPreview` 的 effect 依赖从**渲染相关字段**派生的稳定 key(`info`/`sections`/`sectionOrder`/`template`/`themeColor`/`typography`),而非整个 `resume` 引用;`updatedAt`/`syncStatus`/`id` 不参与 → 砍掉大量无谓重绘。
- **B2 旧帧稳定**:staged 层**完全 ready**(所有页 canvas 画完 + 尺寸确定)才 promote;promote 前显示层零变化。
- **B3 消白底**:staged 未画完不暴露 `bg-white`(背景延迟到画完,或继承上一帧快照)。
- **B4 消尺寸跳**:`pageSize` 未知时**沿用上一帧尺寸**,不用 `794×1123` 硬默认。
- **B5 弱化提示**:去掉/改为极轻、稳定的角标,消除"正在更新"反复闪现。
- **B6 离屏/原地替换(评估项)**:尺寸不变时,考虑离屏渲染 → 画完一次性 `drawImage` blit 到同一显示 canvas(真·双缓冲),省去 opacity crossfade 的"淡入可感"。字体子集化(方案 A)让重绘足够快,是 B 达到"无感"的前提。

## 7. 方案 C —— 入场与操作优雅

- **C1 入场编排**:骨架 → 内容 stagger 淡入(左栏 / 画布 / 右栏依次),仅 transform/opacity,不弹跳。
- **C2 预览首帧**:统一多级 loading,骨架 → canvas 用 crossfade,替代"转圈突现"硬切。
- **C3 操作微交互**:切模板、面板折叠、保存、AI 触发、同步状态变化 —— 统一轻交互,sky 点缀。
- **C4 路由过渡(可选)**:编辑器 ↔ ai-lab / history / share 子路由的过渡(View Transitions 或 framer-motion)。
- 全程对齐 `.impeccable.md` 设计系统与"锐利、协作、有主见的搭档"人格。

## 8. 分阶段实施

详见 `tasks.md`。概要:

1. **阶段 0 · spike(闸门)** — 装 `subset-font`,单字体子集出 woff2,react-pdf 注册生成含中文 PDF 验证。通过才继续;失败退 woff。
2. **阶段 1 · 字体子集化(A)** — 脚本 + 批量生成 + 接入 manifest + 缓存版本。
3. **阶段 2 · 缺字 fallback(A)** — 运行时缺字检测 + 动态注册完整字体。
4. **阶段 3 · canvas 双缓冲(B)** — B1→B6。
5. **阶段 4 · 入场与操作过渡(C)** — C1→C4。
6. **阶段 5 · 度量与验收** — before/after + 回归。

依赖:A 与 B 可并行(不同文件),但 A 先落让 B 的"无感"成立;C2 依赖 B 的首帧行为,C1/C3 可较早。

## 9. 验收标准 & 度量

| 维度 | 指标 | 目标 |
|---|---|---|
| 字体体积 | 单文件(8 变体) | **实测** 12.6–16.0MB → woff2 2.37–4.03MB(黑体系 ~19–22%、宋体系 ~23–25%);全量 109.7MB → 24.7MB(22.5%) |
| 首屏字体下载 | 默认 sans(Regular+Bold) | **实测 26.7MB → 5.84MB(21.9%)** |
| 首帧 | 冷/热缓存首帧可见时间 | 实测基线后给目标;明显下降 |
| 闪烁 | 连续编辑 | 无白闪、无尺寸跳、无反复提示(录屏 + 帧检查) |
| 生僻字 | 含子集外字符简历 | 正确渲染(fallback 生效) |
| 过渡 | 入场 / 操作 | 无硬切;微交互一致,符合 `.impeccable.md` |

> 首帧时间需先用 Playwright 实测当前基线(冷/热缓存各一组),再定量化目标,记入 `tasks.md` 阶段 5。

## 10. 风险与回滚

| 风险 | 规避 |
|---|---|
| react-pdf × woff2 不兼容 | 阶段 0 spike 兜底,无损退 woff(子集后仍 ~4–6MB) |
| 生僻字缺字 | 8105 字集 + 运行时 fallback |
| 双缓冲改动引入渲染回归 | bump `PDF_RENDERER_VERSION`;保留旧 layer 路径可回滚;录屏对比 |
| subset-font wasm 在 CI/node 兼容 | 锁版本;脚本可离线单跑,产物入 repo |
| 过渡改动影响可用性 | 仅 transform/opacity;尊重 `prefers-reduced-motion` |

## 11. 三维价值(技术 / 产品 / 商业)

- **技术**:首屏字体流量 ↓80%+;主线程字体子集化开销降一个数量级;重绘去抖 + 双缓冲消除视觉抖动。
- **产品**:首屏"顿"是留存杀手,尤其移动端;编辑"实时无感"是简历工具的核心手感;入场与操作的"优雅"支撑品牌质感,呼应"锐利、协作、有主见的搭档"人格。
- **商业**:移动端流量成本下降(几十 MB → 个位数 MB);体验质感是口碑与付费转化的隐性杠杆。
