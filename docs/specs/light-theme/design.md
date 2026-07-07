# Magic Resume 浅色适配 — 详细设计规范（Design Spec）

> 承接 `design-brief.md`（方向已确认）。本文把方向细化到可实现：主题机制、完整 token 体系、sky 双支重映射、逐面规格、AI 活画布元素的浅色原生重设计、高度/阴影系统、可访问性对照、迁移分期。
> 决策锚点：**① 可切换、深色默认 ② 覆盖全应用 ③ AI 光效重设计浅色原生 ④ 气质=简历成品/纸感。**
> 概念：**日光下的实验台 · 暖纸桌 + 冷 sky 墨、边界替代发光、光球落纸而非发亮。**

代码现状（细化依据）：
- 主题挂载点：`app/layout.tsx` — `<html className="hide-scrollbar">`，内层 `<Theme appearance="dark">`（Radix Themes，硬编码 dark）。
- 深色地基 = Tailwind **`neutral-*`（669 处）** + `gray-*`（15）；`sky-*` 集中在 `bg-sky-400/500`、`text-sky-300/400`、`ring/border-sky-400`。
- 无 token 层、无 `next-themes`、无切换控件；`dark:` 仅 37 处（可忽略/清理）。
- AI 身份样式集中在 `globals.css` 的 `.polaris-*`、`.ai-canvas-edge-flow*`、`.ai-thinking-overlay*`、`.cs-*`；组件在 `AiFab.tsx`、`AiThinkingOverlay.tsx`、`ResumePreviewPanel.tsx`、`ComingSoon.tsx`。
- 切换控件的家：`components/settings/SettingsModal.tsx`。

---

## 1. 主题机制（Theme Mechanism）

> **实现偏离（2026-07-06）**：本地 pnpm store 版本错位（node_modules 链接自 `v11`，锁定的 pnpm 10.28.1 期望 `v10`），装不了 `next-themes` 且不宜为一个小依赖去重装整棵依赖树。故**手写等价的轻量 `ThemeProvider`**（`apps/web/src/components/providers/ThemeProvider.tsx`，零新依赖），完整实现 class 策略 / 三态 / localStorage 持久化 / 系统监听 / 防 FOUC 内联脚本 / Radix appearance 桥接。行为与下述 `next-themes` 方案一致；后续 store 修复后可无损替换为 `next-themes`。

**方案：轻量自研 `ThemeProvider`（等价 `next-themes`）+ class 策略 + 语义 token 变量。** 深色为默认，支持「深 / 浅 / 跟随系统」，SSR 首屏防闪烁（FOUC）。

1. **挂载**：`<html suppressHydrationWarning>`，用 `ThemeProvider`（next-themes）包裹，`attribute="class"`、`defaultTheme="dark"`、`enableSystem`、`storageKey="mr-theme"`。next-themes 注入阻塞脚本，在水合前就给 `<html>` 打上 `.dark` / `.light`，天然防 FOUC。
2. **Radix Themes 联动**：现有硬编码 `<Theme appearance="dark">` 改为客户端读 `resolvedTheme` 动态传入 —— 抽一个 `RadixAppearanceBridge`（`"use client"`，`useTheme()` → `<Theme appearance={resolvedTheme}>`），避免 Radix 组件与 app 主题脱节。
3. **Tailwind v4 dark 变体对齐**：v4 的 `dark:` 默认跟 `prefers-color-scheme`；在 `globals.css` 加
   ```css
   @custom-variant dark (&:where(.dark, .dark *));
   ```
   让残留的 37 处 `dark:` 跟随 class 而非系统。
4. **持久化 + 记忆**：next-themes 走 localStorage；登录用户是否云端记忆主题偏好属加分项，非本期必须（见 §10 开放项）。
5. **护栏**：主题是纯前端表现层，不触碰 Clerk / cloud sync / 部署模式。

## 2. Token 体系（单一事实源）

**策略**：语义 token 定义在 `:root`（深色为基线，保持默认视觉不变）+ `.light` 覆盖；组件从「写死 `neutral-*`」迁到「语义类」。颜色用 **OKLCH**，向明/暗极值**降 chroma**。下列为**起始值**，实现期以对比度校验微调。

### 2.1 中性 / 表面（neutrals：浅色向暖纸微染 hue≈85，深色沿用现状）

| Token | 角色 | 浅色 (`.light`) | 深色 (`:root`，现状对齐) |
|---|---|---|---|
| `--surface-desk` | app 桌面底 | `oklch(0.975 0.004 85)` ≈ `#FAF8F4` 暖纸 | `oklch(0.145 0 0)` ≈ `#0a0a0a` |
| `--surface-sunk` | 凹槽 / 画布外围槽位 | `oklch(0.955 0.005 85)` ≈ `#F1EEE8` | `oklch(0.12 0 0)` |
| `--surface-raised` | 面板 / 卡片 | `oklch(0.992 0.002 85)` ≈ `#FDFCFA` | `oklch(0.205 0 0)` ≈ `#171717` |
| `--surface-overlay` | 浮层 / 弹层 / 磨砂 | `oklch(1 0 0 / 0.86)` 暖白 frost | `oklch(0.18 0 0 / 0.72)` |
| `--surface-paper` | **简历画布（恒定）** | `oklch(0.995 0 0)` 近纯白，**不随主题变** | 同左（本就白） |
| `--border-hairline` | 分隔 / 描边 | `oklch(0.90 0.004 85)` ≈ `#E4E0D9` | `oklch(1 0 0 / 0.08)` |
| `--border-strong` | 输入框 / 强边界 | `oklch(0.83 0.006 85)` ≈ `#CFC9BF` | `oklch(1 0 0 / 0.16)` |
| `--text-primary` | 正文 | `oklch(0.27 0.01 85)` ≈ `#2B2723` 暖炭 | `oklch(0.93 0 0)` ≈ `#ededed` |
| `--text-secondary` | 次要 | `oklch(0.44 0.01 85)` ≈ `#524D46` | `oklch(0.72 0 0)` |
| `--text-muted` | 弱化 / 占位 | `oklch(0.55 0.01 85)` ≈ `#6E695F` | `oklch(0.56 0 0)` |

> **刻意偏离**：impeccable 默认 neutrals 向品牌色（冷 sky）微染；此处 neutrals 向**暖纸**染、accent 保持**冷 sky**。理由见 brief §3——暖底 × 冷墨的反差就是浅色版身份。

### 2.2 强调色 sky —— **拆成两支**（关键）

现状浅 sky 在白底上对比不足，必须分离「墨」与「光」：

| Token | 角色 | 浅色 | 深色 |
|---|---|---|---|
| `--ink-sky` | 文字 / 图标 / 边框上的 sky（承担对比） | `oklch(0.52 0.13 233)` ≈ `#0369a1`（sky-700，AA 达标） | `#38bdf8` |
| `--ink-sky-hover` | 交互 hover | `oklch(0.46 0.13 233)` ≈ `#075985` | `#7dd3fc` |
| `--fill-sky` | 主按钮 / 强调块背景 | `oklch(0.60 0.14 233)` ≈ `#0284c7`（sky-600） | `#0ea5e9` |
| `--on-fill-sky` | 填充上的文字 | `oklch(0.99 0.01 233)` 近白 | `#0a0a0a` |
| `--tint-sky` | 极淡 sky 背景染（选中/悬停底） | `oklch(0.95 0.03 233)` ≈ `#E8F4FB` | `rgba(56,189,248,0.12)` |
| `--glow-sky` | **仅装饰光效**（低透明） | `#38bdf8`（配 opacity ≤ 0.18） | `#38bdf8` |

### 2.3 语义状态色

| Token | 浅色 | 深色 | 备注 |
|---|---|---|---|
| `--rev-add` | `#15803d` | `#22c55e` | 简历修订绿增；白底沿用 |
| `--rev-del` | `#c81e1e`（比 `#dc2626` 略深保 AA） | `#f87171` | 白底红删 |
| `--danger` / `--warning` / `--success` | 分别取 `#c81e1e` / `#b45309` / `#15803d` | 现状 | 表面反馈 |

### 2.4 Tailwind v4 接线

在 `globals.css` `@theme inline` 暴露语义色，供 `bg-surface-raised`、`text-primary`、`border-hairline`、`text-ink-sky` 等工具类：
```css
@theme inline {
  --color-desk: var(--surface-desk);
  --color-raised: var(--surface-raised);
  --color-paper: var(--surface-paper);
  --color-hairline: var(--border-hairline);
  --color-primary: var(--text-primary);
  --color-muted: var(--text-muted);
  --color-ink-sky: var(--ink-sky);
  --color-fill-sky: var(--fill-sky);
  /* … */
}
```

## 3. 高度 / 阴影系统（浅色靠边界+落地暖影，非发光）

深色版靠 glow + 重投影造层次；浅色改「hairline 边界 + 极浅暖阴影」，阴影用暖黑而非纯黑：

| 层级 | 浅色 | 用处 |
|---|---|---|
| `--elev-0` | 无影，仅 `--border-hairline` | 面板贴桌 |
| `--elev-1` | `0 1px 2px oklch(0.2 0.02 85 / 0.06)` | 卡片 |
| `--elev-2` | `0 2px 8px oklch(0.2 0.02 85 / 0.08)` | 悬浮 / 下拉 |
| `--elev-3` | `0 12px 32px oklch(0.2 0.02 85 / 0.12)` | 弹层 / Polaris 落地影 |

画布（`--surface-paper` 近纯白）比桌面（暖纸）更亮 → 简历自然「浮」在桌上，配 `--elev-2`。滚动条（`globals.css` 写死 `#262626/#525252`）、`.range-sky`、代码块等随 token 走。

## 4. 逐面规格（全应用）

- **Dashboard / 列表**：`--surface-desk` 底；简历缩略卡 `--surface-raised` + `--border-hairline` + `--elev-1`，hover 升 `--elev-2`。空态用 `--text-secondary` 文案「从这里起一份」（动词开头、正向），主 CTA `--fill-sky`。
- **编辑器画布区（核心）**：画布 `--surface-paper` 恒定近白；左右面板 `--surface-raised`；分栏/工具条用 `--border-hairline` 分区，不用重色块。选中/焦点段落底 `--tint-sky`。
- **编辑表单 / 输入**：`--surface-raised` 底 + `--border-strong` 边；focus = `--ink-sky` 2px ring（替换现 `ring-sky-400`）。占位 `--text-muted`。渐进披露保留。
- **AI 面板（polish / optimize / analyzer / draft）**：由深色玻璃卡（`.glass-card` 用 `rgba(255,255,255,0.05)`）改 **浅色纸磨砂**：`--surface-overlay` 暖白 frost + `--tint-sky` 极淡染 + `--border-hairline`；层级靠留白与边界，不靠发光。`json-viewer-enhanced` 的荧光配色（`#22d3ee/#34d399/#fbbf24/#f472b6`）在白底需换深一档语义色。
- **设置（SettingsModal）**：新增「外观」段，放主题切换（见 §6）。
- **AI 活画布时刻**：见 §5。
- **Coming Soon 门禁页（`cs-*`）**：暖纸舞台；`.cs-grid` 网格线 `rgba(255,255,255,0.022)` → 暖灰极淡线 `oklch(0.2 0.01 85 / 0.04)`；`.cs-aura` sky 大光晕**大幅降透明**或改纸面微染；`.cs-panel` 玻璃 → 暖纸卡 + hairline；`.cs-bar`「正被写出的简历」骨架条改纸上浅墨（`--tint-sky`→`--ink-sky` 流光）；`.cs-vignette` 暗晕反相为提亮暖晕保证前景可读。
- **营销 / 落地页（`app/page.tsx`）**：随主题走，首屏浅色也要精致（暖纸 + sky 墨点缀）。
- **贯穿态**：loading / 空 / 错误 / 首次 / 长文溢出 / 中英混排，浅色下逐一复核对比与边界。

## 5. AI 活画布元素 — 浅色原生重设计（逐组件）

原则：**glow → grounded light**（纸上的光有方向、有边界、会落地）。深色态样式**全部保留**，新增 `.light` 覆盖分支；动效时序/缓动/`prefers-reduced-motion` 不变，只改颜色与「发光↔落地阴影」的表达。

### 5.1 Polaris 光球 FAB（`AiFab.tsx` + `.polaris-*`）
光球是**物体**不是表面 → 内部深玻璃 + 液态流光 + 缘光 + 碎星**基本保留**（像纸上一颗宝石）。改它与纸的关系：
- `.polaris-fab__halo`（`opacity: 0.38` 蓝紫大晕）：浅色下 `opacity ≤ 0.12` 或替换为 `--elev-3` **落地暖阴影**——球「放在纸上」而非「在暗里发亮」。
- 组件 hover 阴影 `rgba(120,150,255,0.7)` 蓝光 → 浅色改中性暖影收紧（`--elev-2`→`--elev-3`）。
- 玻璃壳 `.polaris-orb__glass` 内的白高光保留；外缘暗角在亮背景上略减，避免脏边。
- `focus-visible:ring-sky-400/50` → `--ink-sky`（浅色对比够）。

### 5.2 画布描边流光 edge-flow（`ResumePreviewPanel.tsx` + `.ai-canvas-edge-flow*`）
现为模糊 sky bloom 绕画布边缘（`blur(20px)`），白底上失效（像脏印）。改：
- 降 blur、提清晰度：改为画布四缘一道 **1–2px 清晰 sky 描边 / 进度光沿边行走**（「墨沿纸边写过」），色用 `--ink-sky`，尾光 `--glow-sky` 低透明。
- `.__beam` 扫光保留（本就是清晰细线），色改 `--ink-sky`，`drop-shadow` glow 降透明。

### 5.3 思考遮罩 thinking overlay（`AiThinkingOverlay.tsx` + `.ai-thinking-overlay*`）
- 底 `rgba(2,8,14,0.34)` 深色 frost → `--surface-overlay` 暖白 frost + `--tint-sky` 极淡染；`backdrop-blur` 略降。
- 中央 orb 作为物体保留（本就是彩色球），周围 `__halo`/`__ripple` 光晕收敛为柔环、降透明。
- 文案 `text-white/90` → `--text-primary`；`__meter` 进度条底 `rgba(255,255,255,0.16)` → `--border-hairline`，填充 `--ink-sky`。
- `--ai-color` 由组件注入（默认 `#38bdf8`）：浅色下装饰仍可用亮 sky，但承载文字/边界处改走 `--ink-sky`。

### 5.4 环境光晕 aura（`.cs-aura`、各处大 blur sky 团、`.ai-loading-effect` 的 glow）
白底重灾区。统一：**大幅降透明**或改「极细暖网格 + 纸面微 sky 染」；`.ai-loading-effect` 的 `box-shadow` sky glow（`rgba(var(--ai-color),0.4)`）在白底降到 ≤0.18 并加一层 `--border-hairline` 描边定形。宁可少、宁可淡。

## 6. 主题切换控件（内容 + 落点）

- **落点**：`SettingsModal.tsx` 新增「外观 / Appearance」段 —— 三态分段控件 `浅色 / 深色 / 跟随系统`（i18n：`settings.appearance.light|dark|system`）。默认深色。
- **可选**：顶栏快捷图标（日/月）作为加分项，非必须。
- **反馈**：切换即时生效（就地、不弹窗）；不需教学浮层。
- 无新增业务文案；仅加外观标签中英 key。

## 7. 可访问性对照（AA 校验，起始值）

| 前景 / 背景 | 对比比（估） | 判定 |
|---|---|---|
| `--text-primary` `#2B2723` / `--surface-desk` `#FAF8F4` | ~12:1 | ✓ AAA |
| `--text-muted` `#6E695F` / 暖纸 | ~4.7:1 | ✓ AA 正文 |
| `--ink-sky` `#0369a1`（文字）/ 暖纸 | ~5.2:1 | ✓ AA 正文 |
| `--fill-sky` `#0284c7`（大字/UI）/ 暖纸 | ~4.0:1 | ✓ AA 大字 / 图标（正文勿用） |
| `--on-fill-sky` 近白 / `--fill-sky` | ~4.6:1 | ✓ 按钮文字 |
| `--rev-del` `#c81e1e` / 暖纸 | ~4.7:1 | ✓（`#dc2626` 仅 ~4.4，故略深） |
| `--rev-add` `#15803d` / 暖纸 | ~4.8:1 | ✓ |

原则：sky **文字**一律走 `--ink-sky`（≥sky-700 档），亮 sky 只做装饰。焦点 ring 用 `--ink-sky` 2px + 2px offset。

## 8. 迁移分期（564 处写死 → 语义 token）

> **实测更优路径(2026-07-06 已落地主干)**：与其手改 669 处 `neutral-*`，改为**在 `.light` 作用域内重映射 Tailwind 的色阶变量本身**——Tailwind v4 工具类编译为 `var(--color-neutral-*)`，在 `.light` 覆盖这些变量即让全部 `bg/text/border-neutral-*` 自动翻面（深底阶→暖纸、浅字阶→暖墨），零组件改动。配套四步收尾：① `--color-white → 暖墨`（承接「深底白色主文字」；彩色按钮上的白字用字面量 `text-[#fff]` 保留）；② **`sky` 浅端 100–400 加深**（这些阶当文字/图标/激活态用，浅 sky 压暖纸对比不足——如侧栏激活项 `text-sky-300/200`；填充阶 500/600/700 保持鲜亮不动，按钮不受影响。一次修好 87 处 `text-sky-300/400`）；③ 深色 hex 字面量（`bg-[#0A0A0A]` ×24、`bg-[#1C1C1E]` 等）与 `bg-black` 表面 → 语义类 `bg-desk/bg-raised/border-hairline`；④ AI 发光元素（§5）单独加 `.light` 分支。**教训：light 要 remap 的不止 `neutral`，还有 `sky` 浅端 + `white`。**
> **white 重映射的反作用(2026-07-07)**：`--color-white → 暖墨` 会误伤「真的白色表面」——solid `bg-white`(简历纸包裹、开关旋钮、白底按钮、popover)会被染成暗墨(表现为简历预览四周的大黑边)。修法:把 10 处 solid `bg-white` 钉成字面量 `bg-[#fff]`(两态恒白);`text-white`/半透明 `bg-white/xx`、`border-white/xx` 仍走 white→ink 正确。**凡"on-accent 白 / 真白表面"都要字面量固定,只有"深底上的白文字"才该随 white→ink。**已验证 Dashboard、Settings 全亮且深色零回归、切换实时。**注意**：改后需清 `.next/cache` 重启 dev，否则 RSC 缓存会残留旧 class。

**原计划（语义类逐个替换）保留作参考：**


先建地基，再按面收敛，全程可对照验证（深色视觉不应发生变化即为「迁移无回归」）：

1. **地基**：装 `next-themes` + `RadixAppearanceBridge` + `@custom-variant dark` + 在 `globals.css` 落 §2 token 层（深色值对齐现状）。此步完成后深色应像素级不变。
2. **切换控件**：`SettingsModal` 外观段 + 默认深色。
3. **机械迁移映射**（可脚本辅助）：
   | 现状类 | → 语义类 |
   |---|---|
   | `bg-neutral-950/900` | `bg-desk` |
   | `bg-neutral-800/850` | `bg-raised` |
   | `text-neutral-100/200` | `text-primary` |
   | `text-neutral-400/500` | `text-muted` |
   | `border-neutral-800` / `border-white/10` | `border-hairline` |
   | `text-sky-300/400`（文字） | `text-ink-sky` |
   | `bg-sky-500/600`（按钮） | `bg-fill-sky` |
   | `ring-sky-400` | `ring-ink-sky` |
4. **逐面收敛**：Dashboard → 编辑器 → AI 面板/设置 → Coming Soon → 营销页，每面收敛后浅深双跑。
5. **AI 活画布重设计**（§5）：`globals.css` 加 `.light` 覆盖分支。
6. **收尾 `impeccable audit`**：对比度、写死颜色残留、反模式（白上 border-left 条 / 渐变文字 / 玻璃拟态滥用）、reduced-motion 保真。

## 9. 验收标准

- 三态切换（浅/深/系统）生效、刷新记忆、无 FOUC。
- 深色视觉相对迁移前**零回归**（token 化不改深色观感）。
- 全应用逐面浅色无「白上白糊成一片」「大 blur 脏印」「洗白 sky 文字」。
- AA：正文/交互文字全部达标（§7）。
- AI 活画布四元素浅色下成立（光球落纸、描边清晰、遮罩纸磨砂、光晕克制）。
- 简历画布浅深两态均恒定近白（所见即所得）。
- `prefers-reduced-motion` 两态都保真。

## 10. 开放项（实现期拍板）

1. **登录用户主题偏好是否云端记忆**（跨设备）——本期可先只本地（localStorage）。
2. **模板缩略图**（`public/templates/jpg`）是否需浅色态版本——主张不需要（缩略本就是白底成品）。
3. **Polaris 光球内部**是否在浅色下也微调（当前主张保留内部、只改外部关系）。
4. **营销/落地页**是否需要更主动的浅色视觉（而非纯 token 换肤）——视品牌需要另议。
5. **`--font-geist-sans/mono`** 在 `@theme` 中被引用但未定义（死变量）——迁移时顺手清理，body 实走 `font-sans` + `--font-brand`(Sora)。

---

### 一句话交接
装 `next-themes`（深色默认）→ 落 §2 暖纸/冷墨 token（深色对齐现状、零回归）→ 加外观切换 → 按 §8 映射把 669 处 `neutral-*` 机械收敛到语义类 → 逐面收敛 → §5 给 AI 活画布加 `.light` 原生分支 → `impeccable audit` 收尾。
