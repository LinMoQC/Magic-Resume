# Magic Resume 浅色适配 — 设计简报（Design Brief）

> 产物类型：`/impeccable shape` 设计简报（只做设计规划，不写代码）。交付后可交给 `/impeccable craft` / `/impeccable` 或任意实现流程落地。
> 上游语境：`.impeccable.md`（深色工作台身份定稿）、`docs/specs/ai-lab-living-canvas/design.md`。
> 发现访谈四项决策：**① 可切换、深色仍默认 ② 覆盖全应用 ③ AI 光效重设计浅色原生版 ④ 气质贴近简历成品 / 纸感。**

---

## 1. Feature Summary

给当前「深色优先工作台」新增一套**浅色原生主题**，作为可切换选项，深色保持默认与既有身份不变。浅色不是把深色反相，而是以「简历成品的纸」为灵魂重新立骨：温暖纸白的桌面 + 冷静 sky 的墨。面向白天 / 明亮环境、以及希望所见即所得（工作区贴近白底简历成品）的求职者。覆盖全应用——Dashboard、编辑器画布与面板、设置、AI 面板与浮层、Coming Soon 门禁页、营销页。

## 2. Primary User Action

用户在明亮环境下打磨简历时，能**一键切到浅色**并且立刻觉得「工作区和我正在写的这张简历是同一种纸」——降低深浅割裂与强光刺眼，同时不丢掉 Magic 那个「有主见的 AI 搭档」的锐利感。

## 3. Design Direction

**概念：日光下的实验台 · 纸上的墨（Warm desk, cool ink）。**

深色版是「夜里发光的工作台」；浅色版是同一张台面被日光照亮。核心张力刻意保留但换了物理：

- **暖纸桌面（neutral，warm）**：桌面与面板是带微暖的纸白，不是纯白、不是冷灰。它呼应产品真正的主角——那张白底简历。
- **冷 sky 墨水（accent，cool）**：sky 仍是 AI 的签名色，但在浅色里降为「墨」而非「辉光」——用更深的 sky 承担文字 / 交互（浅 sky 在白底上对比不足），亮 sky 只留给装饰。
- **明暗关系反转**：深色靠「发光 + 阴影」造层次；浅色靠**清晰的发丝边界 + 极克制的暖阴影**造层次。纸感 = 干净、有边界、可读。这也意味着：深色版「少 border」的原则在浅色里要**适度回填 hairline 分隔**，否则白上白会糊成一片。

> 刻意偏离通用规则说明：impeccable 默认「neutrals 向品牌色（冷 sky）微染」。此处**反其道**——neutrals 向暖纸染、accent 保持冷 sky。理由：浅色版的产品之魂是那张暖纸简历，sky 是 AI 落在纸上的墨；暖底 × 冷墨的反差本身就是身份，而非需要抹平的不协调。

**保持不变的身份锚点**：sky（点缀角色不变）、简历修订的白底红删 `#dc2626` / 绿增 `#15803d`（本就是为白底设计，直接沿用）、动效语言（轻快贴元素、仅 transform/opacity、不弹跳）、五条设计原则（画布是舞台 / 能力按需浮现 / AI 是合作者 / 就地不另开 / 脚手架不是栅栏）。

**Anti-references**：反相出来的死灰蓝（深色直接 invert 的通病）、纯白 `#fff` 刺眼卡片堆、白底上一坨模糊 sky 光晕（在白上像咖啡渍 / 脏印）、gray-on-color 洗白文字、AI 味的 cyan/紫渐变。

## 4. Layout Strategy（含 token 骨架）

空间与构图**不变**（这是换肤不是重排），变的是「表面 / 边界 / 高度」的表达。

**先建语义 token 层，再谈颜色。** 当前无 token 体系：`globals.css` 里大量写死 hex/rgba，组件里约 **564 处**深色系工具类散落于 **~73 个文件**。浅色适配的**使能前提**是把这些迁移到语义 token（见 §8 开放问题）。建议 token（浅色值示意，OKLCH，向极值降 chroma）：

| Token | 角色 | 浅色示意 | 深色（现有，参照） |
|---|---|---|---|
| `--surface-desk` | 桌面 / app 底 | 暖纸白 `oklch(0.975 0.004 85)` | `#0a0a0a` |
| `--surface-raised` | 面板 / 卡片 | 更亮纸白 `oklch(0.992 0.002 85)` | `#171717` 一带 |
| `--surface-paper` | 简历画布 | 保持近纯白 `oklch(0.995 0 0)`（成品感） | 本就白 |
| `--border-hairline` | 分隔 / 描边 | 暖灰 `oklch(0.90 0.004 85)` | `white/8%` |
| `--text-primary` | 正文 | 暖炭黑 `oklch(0.27 0.01 85)`（非纯黑） | `#ededed` |
| `--text-muted` | 次要 | `oklch(0.53 0.01 85)` | neutral-400 |
| `--ink-sky` | 交互 / 强调文字 | 深 sky `oklch(0.60 0.13 233)`≈`#0284c7`（AA 达标） | `#38bdf8` |
| `--glow-sky` | 装饰 / 光效 | 亮 sky `#38bdf8`（仅装饰，低透明） | `#38bdf8` |
| `--rev-add` / `--rev-del` | 简历修订 | `#15803d` / `#dc2626`（沿用） | 同 |

**视觉权重 60-30-10**：60% 暖纸表面 / 30% 炭黑文字 + 发丝边界 / 10% sky 墨。sky 因稀少而有力，别铺满。

**高度 / 层次**：抛弃深色的 glow 与重投影；浅色用「hairline 边界 + 一层极浅暖投影（`oklch` 暖黑、低透明、贴地）」。画布（近纯白）比桌面（暖纸）更亮 → 简历自然「浮」在桌上。滚动条、range 滑块、代码块等 `globals.css` 里的写死深色件需随 token 走。

## 5. Key States（全应用逐面）

对每个面，浅色需要「看到什么 / 感到什么」：

- **Dashboard / 简历列表**：暖纸桌 + 近白简历缩略卡，hairline 分隔；空态教用户「从这里起一份」，正向、动词开头。
- **编辑器画布区**：核心。画布近纯白（= 成品纸），周边面板暖纸；工具条 / 分栏用 hairline 而非重色块分区。所见即所得达成。
- **编辑面板 / 表单 / 设置**：输入框在暖纸上要有清晰边界与聚焦态（sky ring，用 `--ink-sky`），不做冷冰填表感；渐进披露保留。
- **AI 面板（polish / optimize / analyzer / draft）**：从深色玻璃卡改为**浅色磨砂纸**（暖白 frost + 极淡 sky 染），信息层级靠留白与边界，不靠发光。
- **AI「活画布」时刻（见 §6）**：Polaris 光球、edge-flow 描边、thinking 遮罩、aura ——全部浅色原生重设计。
- **Coming Soon 门禁页**：`cs-*` 一整套深色舞台（aura 光晕 + 透视网格 + 组装中简历 + 扫描光）需重编：暖纸舞台、网格转极淡暖线、sky 光晕大幅降透明或改为纸面微染，「正在被写出的简历」骨架条改为纸上浅墨。
- **营销 / 落地页（`app/page.tsx`）**：随主题走，保证首屏浅色也精致。
- **贯穿态**：loading / 空 / 错误 / 首次使用 / 长文溢出 / i18n（中英）在浅色下都要复核对比度与边界。

## 6. Interaction Model — AI 活画布元素的浅色原生重设计

原则：深色靠「暗底上发光」，浅色靠「纸上的光与影是有方向、有边界、落地的」。glow → **grounded light**。涉及文件：`AiFab.tsx`、`AiThinkingOverlay.tsx`、`ResumePreviewPanel.tsx`（edge-flow）、`ComingSoon.tsx`，样式集中在 `globals.css` 的 `.polaris-*` / `.ai-canvas-edge-flow*` / `.ai-thinking-overlay*` / `.cs-*`。

- **Polaris 光球 FAB**：光球是「物体」不是「表面」，其内部深色玻璃 + 流光可**基本保留**（像放在纸上的一颗玻璃弹珠 / 宝石）。改的是它与纸的关系：**外层 halo 光晕大幅收敛**（白上的大 blur = 脏印），换成**清晰细缘环 + 一层贴地暖阴影**让它落在纸上；hover / running 的「变亮」改为「阴影收紧 + 缘环提亮」。
- **edge-flow 画布描边流光**：现为 sky 光束在画布边缘扫。白底上模糊 bloom 失效 → 改为**画布四缘一道清晰的 sky 细描边 / 进度感光线沿边行走**（「墨沿纸边写过」），降 blur、提清晰度、用 `--ink-sky`。
- **thinking 遮罩**：深色磨砂 → **浅色纸磨砂**（暖白 frost + 极淡 sky 染），降 blur 强度；中央 orb 作为物体保留，光晕收敛为柔环。
- **aura / 背景光晕（coming-soon、各处大 blur sky 团）**：白上是重灾区。**大幅降透明**或改为「极细暖网格 + 纸面微 sky 染」，宁可少、宁可淡。

交互反馈时序、缓动（`cubic-bezier(0.16,1,0.3,1)` 一类 ease-out）、`prefers-reduced-motion` 分支**全部沿用**，只换颜色与「发光→落地阴影」的表达。

## 7. Content Requirements

- **主题切换入口**：需要一处切换控件（建议设置内 + 可选顶栏快捷）。文案简短动词开头：`浅色 / 深色 / 跟随系统`。默认深色。
- **首次切到浅色**：不需要弹窗教学（就地、不打断原则）。若有 toast，一句即可：「已切换到浅色」。
- **无新增业务文案**；沿用现有 i18n key 结构，新增仅主题标签（中英）。
- **动态内容范围**：简历内容长度不定（长文溢出）、中英混排 —— 浅色下需复核文字在暖纸上的对比与换行（正文 max-width 65–75ch 原则不变）。

## 8. Recommended References（实现期取用）

- `reference/color-and-contrast.md` — 暖纸中性 + 冷 sky 墨的构建、OKLCH 极值降 chroma、AA 对比校验（尤其 sky 文字必须从 400 深到 ~600）。
- `reference/spatial-design.md` — 浅色靠边界 / 层次而非发光造深度；hairline 与暖阴影的分寸。
- `reference/motion-design.md` — 「glow → grounded light」的动效改写、reduced-motion 保真。
- `impeccable audit` — 换肤后跑一遍：对比度、主题一致性、写死颜色残留、反模式（白上 border-left 条、渐变文字、玻璃拟态滥用）。

## 9. Open Questions（实现期需拍板）

1. **主题机制**：`class`（`.dark` / `.light` on `<html>`）还是 `[data-theme]`？是否引入 `next-themes`（当前未装）？需支持「跟随系统」+ 记忆选择 + 避免闪烁（SSR 首屏防 FOUC）。
2. **Token 迁移策略**：564 处深色工具类 + `globals.css` 写死值一次迁完，还是分面推进（Dashboard→编辑器→AI→门禁→营销）？建议先落 token 层与切换机制，再按面收敛，全程可对照验证。
3. **简历画布是否随主题变**：主张**不变**（成品纸恒定近白，才是所见即所得）——需确认。模板 `designTokens`（`packages/resume-templates`）不应被 app 主题影响。
4. **深色专属视觉资产**：Polaris 光球内部、模板缩略图（`public/templates/jpg`）等在浅色下是否需要替换 / 加浅色态缩略。
5. **护栏确认**：不动 Clerk / cloud sync；不新增部署模式开关；主题属纯前端表现层。

---

### 一句话交接

同一张台面、日光打开：**暖纸桌 + 冷 sky 墨、边界替代发光、光球落在纸上而非在暗里发亮**——深色身份原样保留，浅色作为可切换的、贴近简历成品的原生主题，覆盖全应用。
