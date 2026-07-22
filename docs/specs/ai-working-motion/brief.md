# 「呼吸叙述」——AI 工作中动效系统 · 设计简报

> 2026-07-18 · 由 /impeccable shape 产出并经作者确认。
> 替换现有三处各自为政的"生成动画"：AiThinkingOverlay 光球、创建流程 spinner、LivingCanvas 隐形 shimmer。

## 1. 概述

为 Magic Resume 所有「AI 工作中」的时刻建立一套统一动效语言。核心参照 Claude 的
生成态：克制的呼吸节律 + 由真实事件驱动的状态叙述。用户是等待 AI 出稿的求职者——
动效要传达「它真的在替我干活」，而非「它在转圈」。

**用户最需要理解的一件事**：AI 此刻在做什么、有没有卡住。叙述文字是主角，动效只是
让叙述"活着"。

## 2. 现状问题（盘点结论）

| 位置 | 现状 | 问题 |
|---|---|---|
| `AiThinkingOverlay.tsx` + `globals.css` | 大发光球 + 光晕 + 双涟漪 + sheen + 假进度 meter + 全屏毛玻璃 | "AI 光球"套路：元素多但都在自转，与内容无关，永远循环没有进展感 |
| 引导创建（AiChatShell / ArtifactCanvas） | 左侧 `Loader2` spinner + 光标闪烁；右舞台生成期间静止 | guided-create spec 里"对应区域 shimmer"未落实；spinner 无生命感 |
| LivingCanvas（EditableCanvas） | 挂了 `lc-shimmer` / `lc-flash` / `lc-highlight` 类名 | **CSS 全仓库无定义**，处理中实际不可见（bug） |

## 3. 设计方向：一个心跳，贴着内容，说人话

- **一个心跳**：全系统共享一条呼吸曲线（~2.4s ease-in-out，scale 0.985→1.015 +
  opacity 微变）。Polaris 球、状态文字、骨架块全部同频——系统像一个生物，不是一堆
  各转各的零件。
- **贴着内容**：动效发生在被操作的对象上（简历纸面、目标段落），不再全屏盖毛玻璃。
  呼应设计原则「画布是舞台，对话是旁白」。
- **说人话**：状态文字由 SSE 事件驱动、动词开头，180ms 交叉淡入切换（旧的上浮淡出、
  新的下方淡入），当前状态词上一道极轻的文字微光（shimmer text）。
- **删掉**：涟漪、光晕爆炸、假进度 meter、spinner、全屏 blur、bounce/elastic。

## 4. 动效 token

```
--breath-duration: 2.4s            /* 全局呼吸周期 */
--breath-ease: ease-in-out
--narrate-duration: 180ms          /* 叙述文字交叉淡入 */
--narrate-ease: cubic-bezier(0.22, 1, 0.36, 1)
--sheen-duration: 1.8s             /* 贴块扫光一次行程（+0.6s 间歇） */
呼吸幅度：scale 0.985 → 1.015；opacity 0.75 → 1
```

约束：只用 transform / opacity；`prefers-reduced-motion` 退化为静态压暗 + 纯文字状态。

## 5. 三处落地

### 5.1 AiThinkingOverlay →「纸面入定」
- 简历纸面轻微压暗（无 blur，内容隐约可读）。
- 页面边缘一圈极细 sky 流光缓慢巡行（复用 edge-flow，降速、降透明度）。
- 中下位置：小尺寸 Polaris 球呼吸（保留品牌符号，去光晕爆炸）+ 下方一行叙述文字。
- 感觉是「纸自己在思考」，不是「弹了个 loading 层」。

### 5.2 引导创建右舞台 →「逐段成形」（已确认：接流式数据）
- 等待期：同呼吸节律的纸面骨架。
- `resume_patch` / `resume_update` 到达时，对应区块以 opacity + 4px 上移落定
  （staggered，180ms/块）。过程即动画。
- 左侧线程 spinner 全部换为呼吸叙述行。

### 5.3 LivingCanvas → 补上真的 shimmer
- 处理中：目标块文字降至 ~45% 透明度，一道贴块柔和扫光同频掠过（`lc-shimmer`）。
- 接受后：`lc-flash` 绿色微闪落定。
- 定位跳转：`lc-highlight` 轻高亮一次。

## 6. SSE → 叙述文案映射（动词开头，不复述用户所见）

| 事件 | 文案 |
|---|---|
| `run_started` | 正在理解你的目标… |
| `tool_started` (read_resume) | 正在读你的简历… |
| `agent_plan` / `step_started` | 正在写「{区块名}」…（按 step 对应 section） |
| `llm_started`（无更具体信息时） | 正在思考… |
| `message_chunk` 持续到达 | 正在落笔… |
| `resume_patch` / `resume_update` | 正在更新「{区块名}」… |
| 静默 > 8s | 还在琢磨措辞…（兜底轮换，语气舒缓） |
| `run_failed` / `error` | 动效即刻收敛，不残留循环；错误文案按现有规范 |
| `run_completed` | 一次轻收束（呼吸淡出），不放烟花 |

## 7. 关键状态清单

思考中（首 token 前）／工具执行中（按事件换词）／流式输出中／长静默兜底／失败
（收敛）／完成（收束）。三处表面全部覆盖。

## 8. 主题适配

- 深色（默认）：靠低透明 sky 光造层次，但强度显著低于现状。
- 浅色：按 `docs/specs/light-theme/` ——不发光；清晰 hairline、纸面磨砂、
  `--ink-sky` 文字；球落纸、光晕大幅降透明。

## 9. 实现指北（文件索引）

- 动效 token + keyframes + `lc-*` 补全：`apps/web/src/app/globals.css`
- 遮罩组件：`apps/web/.../edit/_components/modals/AiThinkingOverlay.tsx`
- 叙述行 / spinner 替换：`apps/web/.../ai/conversation/ChatThread.tsx`
- 右舞台逐段成形：`apps/web/.../ai/AiChatShell.tsx` + `ai/canvas/ArtifactCanvas.tsx`
- 就地编辑 shimmer 挂载点：`packages/resume-templates/src/renderer/EditableCanvas.tsx`
- SSE 事件词表：`apps/web/.../ai/lib/services/types.ts`

## 10. 遗留开放问题

- step → section 名的映射需要后端 payload 里带 section key（若无，用 plan_update 的
  todo 文本兜底）。
- 逐段成形依赖创建流把流式 resume 数据接到右侧预览；若现有 create 只在结束时给
  整份 resume，先以「区块级 stagger 重放」模拟（数据到齐后按序落定），后续再接真流。
