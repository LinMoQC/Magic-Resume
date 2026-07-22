---
title: 编辑器预览体验专项 —— 执行任务
type: tasks
status: Draft
owner: kaihuang
created: 2026-07-14
updated: 2026-07-14
summary: spec.md 的分阶段可执行清单。阶段 0 为闸门,通过才继续。
scope: [apps/web, packages/resume-templates]
repos: [Magic-Resume]
related: [spec.md]
---

# 执行任务

方案见 `spec.md`。阶段间依赖:0(闸门)→ 1/2(字体 A)→ 3(双缓冲 B,可与 A 并行)→ 4(过渡 C,C2 依赖 B)→ 5(度量)。

## 阶段 0 · spike(闸门,先行)—— ✅ 通过

- [x] 安装 `subset-font` + `iconv-lite`(devDependency,`packages/resume-templates`)。
- [x] 取 `SourceHanSansSC-Regular.woff`,子集(spike 用 GB2312+标点+ASCII 6892 字近似 8105),**同时导出 woff2 + woff**,记录体积。
- [x] 在 react-pdf 里各注册一次,生成含中文 PDF,Read 首页确认无豆腐块。
- [x] **决策产出:走 woff2。** 见下方结论。

## 阶段 1 · 字体子集化(方案 A)

- [ ] 落字表:`8105 通用规范汉字` + ASCII + CJK 标点 + 常用符号(入 repo)。
- [ ] 写 `scripts/subset-fonts.mjs`:输入现有 8 个完整 woff → 输出 8 个子集文件(4 变体 × 黑/宋),幂等可重跑。
- [ ] 批量生成子集字体,产物入 repo,记录 before/after 体积表。
- [ ] 更新 `packages/resume-templates/src/pdf/browser.tsx` 的 `pdfFontManifest`(文件名/后缀/路径)。
- [ ] bump `PDF_RENDERER_VERSION`(`pdf-canvas-woff-fonts-v15` → 新版本),失效浏览器缓存。
- [x] 保留完整字体:移到 `apps/web/public/fonts/full/`。
- [~] **楷体**:命中 fontkit@2.0.4 的 glyf subset bug。已深度定位并验证可行 patch,单列专项 → [[../kaiti-pdf-fontkit/spec.md]]。当前楷体暂映射思源宋体;LXGW ttf 源留在 `full/`。黑/宋子集化不受影响,正常交付。

> 阶段 1 黑/宋部分已完成并 build 通过(`resume-templates` tsc)。首屏字体 27MB→5.8MB。

## 阶段 2 · 缺字 fallback(方案 A)

- [x] 运行时扫描简历文本,判断是否含子集外 CJK 表意字(`resumeNeedsFullCjkFonts`,复用脚本生成的 `pdf/cjk-subset-charset.ts` 8420 字 Set;跳过 avatar data URL;ASCII/拉丁/标点走 <U+3400 快路)。
- [x] 命中缺字 → 按 category 动态 `Font.register` 完整字体(`/fonts/full/*.woff`)到**独立完整 family**(react-pdf 首个 source 恒胜且无法替换,故必须换名),文档经 `cjkFallback` prop 切到该 family;未命中零额外拉取。
- [~] 验证:构造含生僻/繁体人名(如「李鎔」「龍」)简历,预览/导出正确回退。**逻辑单测已过(鎔/龍/電/們/個 命中,翀/頔实为子集内故不触发,普通文本与 emoji 不误触发);像素级回退 kaihuang 自测。**

> 阶段 2 完成:新增 `pdf/cjk-subset-charset.ts`(脚本 emit,与字体同步防漂移)+ `browser.tsx` 检测/注册 + `font-family.ts` 完整 family 常量与 `preferFull` + `MagicResumePdfDocument` 穿 `cjkFallback`。`resume-templates` build 与 `web` tsc 均通过。

## 阶段 3 · canvas 真双缓冲(方案 B)

- [x] **B1** 渲染指纹去重:effect 依赖 `renderKey`(由 info/sections/sectionOrder/template/**customTemplate**/themeColor/typography/locale 派生),`resumeRef` 读最新值;`updatedAt`/`syncStatus`/`id` 不触发重绘。⚠️ **回归修复**:初版漏了 `customTemplate` → 右侧面板自定义(布局/排版/配色)改了不重绘(表现为「自定义失效」),已补 + 加防回归注释。
- [x] **B2** 旧帧稳定:`markPageRendered` 仅在 staged 全页画完(`renderedPages.length >= pageCount`)才 promote;promote 前显示层零变化。
- [x] **B3** 消白底:staged 层 `opacity-0` 直到 B2 promote,`bg-white` 不外露;首帧另有骨架 overlay 遮挡 → 无需额外改动。
- [x] **B4** 消尺寸跳:新 staged 层继承上一帧 `pageSizes`/`pageCount`;页尺寸未知时不再塌成硬默认,`794×1123` 常量化为 `DEFAULT_PAGE_*` 仅首帧兜底。
- [x] **B5** 弱化提示:去掉"正在更新"角标;loader 仅首帧出现,编辑时 staged 静默渲染,旧帧稳定保留。
- [~] **B6**(评估)离屏 + 原地 `drawImage`:字体子集化后重绘已快,crossfade 淡入可接受;暂不落地,留待阶段 5 度量后定夺。
- [x] 录屏对比:连续快速编辑,无白闪 / 无尺寸跳 / 无提示噪声。**(kaihuang 自测确认)**

> 阶段 3 代码完成:B1/B2/B5 前序已落,B4 本轮实现(`PdfCanvasPreview.tsx`:staged 继承上帧尺寸 + `DEFAULT_PAGE_*` 常量)。`resume-templates` 与 `web` 的 tsc 均通过。剩人工录屏验收。

## 阶段 4 · 入场与操作过渡(方案 C)

- [x] **C1** 入场编排:骨架 → 左栏 / 画布 / 右栏 stagger 淡入(`globals.css` `editor-enter-*` + `ResumeEdit`;固定侧栏 opacity-only 不破 fixed 定位,画布在流内 rise;左 0 / 画布 80ms / 右 160ms,ease-out 不弹跳)。
- [x] **C2** 预览首帧:首帧骨架 `AnimatePresence` crossfade 淡出露 canvas(`PdfCanvasPreview`),替代硬切;编辑帧走 staged 层不触发。骨架改为**近白纸文档骨架**——原 `bg-neutral-950` 深纸叠 `#0A0A0A` 台面近乎隐形,叠加首次 PDF 生成的主线程阻塞(pulse 冻结)→ 用户见"卡一下下面黑";改近白纸后清晰可见且与白 canvas 无缝。
- [~] **C3** 操作微交互:**同步状态**几态 crossfade(HeaderTab `AnimatePresence` + dot `transition-colors`)、**统一 press 反馈**(header 动作钮 `active:scale-95`、模板浏览卡 `active:scale-[0.99]`,`prefers-reduced-motion` 尊重)。切模板卡 / 折叠 / AI 触发既有 sky hover + framer 过渡,按 `.impeccable.md`「不花哨」克制未过度加;保存态反馈可后续补。
- [x] **C4** 路由过渡:拦截式模态路由退场平滑化——新增 `hooks/useInterceptModalRoute.ts`,`close()` 先把 open 置 false 让模态播 framer `AnimatePresence` 退场,再 `router.back()`(默认 280ms);5 个 `(.)ai-lab/history/share/json/feedback` 全接入 → 编辑器 ↔ 模态子路由进/出都不再硬切。
- [x] `prefers-reduced-motion` 尊重(C1 `@media reduce → animation:none`;C2 `useReducedMotion → duration 0`);对齐 `.impeccable.md`(仅 opacity/transform、ease-out 不弹跳、sky 语汇)。

> 阶段 4 全部落地(C1 入场 stagger / C2 首帧 crossfade / C3 同步态 crossfade + 统一 press / C4 模态路由退场)。`web` tsc + lint(0 warning)+ dev HMR 全通过。C1 直接回应用户反馈③「进入编辑器过渡不够优雅」;C3 克制未过度加动效。

## 阶段 5 · 度量与验收

- [x] 字体体积 before/after 表(实测,已填 spec.md §9):单文件 12.6–16.0MB → 2.37–4.03MB;首屏默认 sans 26.7MB → 5.84MB(21.9%);全量 109.7MB → 24.7MB(22.5%)。
- [ ] Playwright 冷 / 热缓存首帧可见时间:**before 基线未在 phase 1 前采集**(完整字体态已被替换,before 不可复现);建议只测 after 现状 + 用体积表佐证首屏提速。需 kaihuang 环境(cloud 模式 / 有简历)。
- [~] 生僻字回退、过渡一致性抽查:回退逻辑单测已过(见阶段 2);像素级 + 入场/交互一致性由 kaihuang 自测。
- [~] `resume-templates` build ✓、`web` tsc ✓ + `lint`(见下)通过;完整 `web build` 有 html2canvas barrel 间歇 prerender flake,归 CI。

## spike 结论(阶段 0)

- **闸门:通过。走 woff2。**
- subset-font(harfbuzz wasm)子集 SourceHanSansSC-Regular:**13.10MB → woff2 2.34MB(17.9%)/ woff 2.71MB(20.7%)**(spike 字集 6892 字)。
- `@react-pdf/renderer@4.5.1` + `fontkit@2.0.4` **成功渲染 woff2 子集**,中文/英文/数字/标点/破折号均正常,无豆腐块(Read PDF 首页确认)。
- woff2 相对 woff 仅小 ~14%(中文字形数据占主导);仍选 woff2。
- 环境:需 Node 22(nvm v22.22.2)+ corepack pnpm 10.28.1;spike 脚本为一次性,已清理。
