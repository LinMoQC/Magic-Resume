import { LEFT_PANEL_WIDTH, LEFT_RAIL_WIDTH } from "./OutlineRail";
import { PANEL_WIDTH, RAIL_WIDTH } from "../templates/TemplatePanel";

/* 骨架条:与新版工作台一致,用极轻的白色叠加而非实心灰块,呼吸感来自 animate-pulse */
function Bar({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-white/[0.05] ${className}`} />;
}

/* 图标轨占位:一列小方块,顶部一个折叠钮 + 分隔线 + 若干分区图标 */
function RailSkeleton({ side }: { side: "left" | "right" }) {
  return (
    <div
      className={`flex h-full shrink-0 flex-col items-center gap-2 bg-[#0A0A0A] py-3 ${
        side === "left" ? "border-r" : "border-l"
      } border-white/[0.06]`}
      style={{ width: side === "left" ? LEFT_RAIL_WIDTH : RAIL_WIDTH }}
    >
      <Bar className="h-8 w-8 rounded-xl" />
      <div className="my-0.5 h-px w-6 bg-white/[0.08]" />
      {Array.from({ length: side === "left" ? 7 : 4 }).map((_, i) => (
        <Bar key={i} className="h-8 w-8 rounded-xl" />
      ))}
      {side === "left" && (
        <div className="mt-auto flex flex-col items-center gap-2.5 pt-2">
          <div className="h-px w-6 bg-white/[0.08]" />
          <Bar className="h-8 w-8 rounded-full" />
        </div>
      )}
    </div>
  );
}

export default function ResumeEditSkeleton() {
  return (
    // 三列 in-flow flex:左右面板 shrink-0、中间画布 flex-1,画布自然居中于两侧面板之间;
    // 移动端面板 hidden,画布占满全宽。无需 fixed / margin,天然对称。
    <main className="flex h-screen min-w-0 flex-1 overflow-hidden bg-black text-white">
      {/* ── 左:图标轨 + 内容表单面板 ── */}
      <div className="hidden h-full shrink-0 lg:flex">
        <RailSkeleton side="left" />
        <div
          className="h-full border-r border-white/[0.06] bg-[#0A0A0A]"
          style={{ width: LEFT_PANEL_WIDTH }}
        >
          <div className="flex items-center border-b border-white/[0.06] px-4 py-4">
            <Bar className="h-5 w-16" />
          </div>

          <div className="space-y-6 px-4 py-5">
            {/* 基本信息:头像 + 名称 */}
            <div className="space-y-4">
              <Bar className="h-4 w-24" />
              <div className="flex items-center gap-3">
                <Bar className="h-14 w-14 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Bar className="h-3.5 w-16" />
                  <Bar className="h-9 w-full rounded-lg" />
                </div>
              </div>
              {/* 字段两列栅格 */}
              <div className="grid grid-cols-2 gap-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Bar className="h-3 w-14" />
                    <Bar className="h-9 w-full rounded-lg" />
                  </div>
                ))}
              </div>
            </div>

            {/* 折叠分区标题占位 */}
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 border-t border-white/[0.06] pt-5">
                <Bar className="h-8 w-8 rounded-lg" />
                <Bar className="h-4 w-28" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── 中:画布(顶栏 scrim + 预览纸 + 底部工具坞) ── */}
      <div className="relative flex min-w-0 flex-1 flex-col items-center justify-center bg-black">
        {/* 顶栏:返回 + 标题 */}
        <div className="pointer-events-none absolute inset-x-0 top-0 flex h-16 items-center gap-2 px-6">
          <Bar className="h-8 w-8 rounded-lg" />
          <Bar className="h-5 w-40" />
        </div>

        {/* 预览纸:A4 比例 */}
        <div className="flex h-full max-h-[calc(100vh-8rem)] items-center px-4 py-16">
          <div className="aspect-[210/297] h-full max-w-full animate-pulse rounded-lg bg-white/[0.04] shadow-2xl" />
        </div>

        {/* 底部工具坞:胶囊 */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
          <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-neutral-900/70 px-2.5 py-2 backdrop-blur-md">
            {Array.from({ length: 6 }).map((_, i) => (
              <Bar key={i} className="h-6 w-6 rounded-lg" />
            ))}
          </div>
        </div>
      </div>

      {/* ── 右:自定义面板 + 图标轨 ── */}
      <div className="hidden h-full shrink-0 lg:flex">
        <div
          className="h-full border-l border-white/[0.06] bg-[#0A0A0A]"
          style={{ width: PANEL_WIDTH }}
        >
          <div className="flex items-center border-b border-white/[0.06] px-4 py-4">
            <Bar className="h-5 w-16" />
          </div>

          <div className="space-y-6 px-4 py-5">
            {/* 模板卡片 */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Bar className="h-8 w-8 rounded-lg" />
                <Bar className="h-4 w-20" />
              </div>
              <div className="flex gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
                <Bar className="h-20 w-[60px] shrink-0 rounded-md" />
                <div className="flex-1 space-y-2 py-1">
                  <Bar className="h-4 w-24" />
                  <Bar className="h-3 w-full" />
                  <Bar className="h-3 w-3/4" />
                </div>
              </div>
              {/* 标签 */}
              <div className="flex flex-wrap gap-1.5">
                {["w-16", "w-12", "w-20", "w-14"].map((w, i) => (
                  <Bar key={i} className={`h-6 rounded-full ${w}`} />
                ))}
              </div>
            </div>

            {/* 折叠分区标题 */}
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 border-t border-white/[0.06] pt-5">
                <Bar className="h-8 w-8 rounded-lg" />
                <Bar className="h-4 w-24" />
              </div>
            ))}

            {/* 配色:快速主题色板 */}
            <div className="space-y-3 border-t border-white/[0.06] pt-5">
              <div className="flex items-center gap-3">
                <Bar className="h-8 w-8 rounded-lg" />
                <Bar className="h-4 w-16" />
              </div>
              <div className="flex gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Bar key={i} className="h-9 w-9 rounded-lg" />
                ))}
              </div>
            </div>
          </div>
        </div>
        <RailSkeleton side="right" />
      </div>
    </main>
  );
}
