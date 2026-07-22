"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";

// animate-pulse 的周期(Tailwind 默认 2s)。负 animation-delay 把每个实例的呼吸相位钉到
// 挂钟时间:无论骨架在哪个瞬间挂载(面板首帧的 fallback / chunk 就绪后的真身),明暗都处于
// 同一相位 —— 实例替换在肉眼里"没有发生过"。useState 惰性初始化保证 re-render 不重算,
// 否则 delay 每次变化会让 CSS 动画反复重启、骨架条抖动。
const PULSE_PERIOD_MS = 2000;

export function PaperSkeletonBars() {
  const [animationDelay] = useState(() => `-${Date.now() % PULSE_PERIOD_MS}ms`);

  return (
    <div className="animate-pulse space-y-6" style={{ animationDelay }}>
      <div className="space-y-3">
        <div className="h-7 w-52 rounded bg-neutral-200" />
        <div className="h-3.5 w-72 rounded bg-neutral-100" />
      </div>
      {[0, 1, 2].map((section) => (
        <div key={section} className="space-y-2.5 pt-6">
          <div className="h-4 w-36 rounded bg-neutral-200" />
          <div className="h-3 w-full rounded bg-neutral-100" />
          <div className="h-3 w-11/12 rounded bg-neutral-100" />
          <div className="h-3 w-4/5 rounded bg-neutral-100" />
        </div>
      ))}
    </div>
  );
}

// 占位"纸"外壳:与真实 canvas 页同宽同底色同投影。min-h 单页兜底,调用方可用 self-stretch
// 让它铺满多页画布高度(见 PdfCanvasPreview 的首帧 loader)。
export function PaperSheet({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        "relative min-h-[1123px] w-[794px] overflow-hidden rounded-lg bg-white shadow-2xl shadow-black/50",
        className,
      )}
    >
      {children}
    </div>
  );
}

// PdfCanvasPreview(内含 pdf.js,较重)chunk 加载期间的 dynamic fallback。与组件内部的
// 首帧 loader 渲染同一张纸,又同处 TransformComponent 的同一变换上下文 → 位置 / 尺寸 /
// 呼吸相位全连续,chunk 就绪的瞬间画面零变化。它还让 TransformWrapper onInit 的 centerView
// 在首帧就有真实内容尺寸可算,修掉"初始化时画布为空 → 居中按空内容算"的隐患。
export function PaperSkeleton() {
  return (
    <PaperSheet>
      <div className="p-14">
        <PaperSkeletonBars />
      </div>
    </PaperSheet>
  );
}
