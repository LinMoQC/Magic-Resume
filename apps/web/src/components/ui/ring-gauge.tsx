"use client";

import React from "react";
import { cn } from "@/lib/utils";

type RingGaugeProps = {
  value: number;
  max?: number;
  size?: number;
  stroke?: number;
  label?: string;
  className?: string;
};

export function RingGauge({
  value,
  max = 100,
  size = 96,
  stroke = 8,
  label = "/ 100",
  className,
}: RingGaugeProps) {
  const safeMax = max > 0 ? max : 100;
  const clampedValue = Math.min(safeMax, Math.max(0, value));
  const degrees = (clampedValue / safeMax) * 360;
  const roundedValue = Math.round(clampedValue);
  const trackColor = "rgb(38 38 38)";
  const ringBackground = degrees <= 0
    ? trackColor
    : `conic-gradient(from -90deg, #38bdf8 0deg, #818cf8 ${degrees}deg, ${trackColor} ${degrees}deg 360deg)`;

  return (
    <div
      role="img"
      aria-label={`Score ${roundedValue} out of ${safeMax}`}
      className={cn("relative shrink-0", className)}
      style={{ width: size, height: size }}
    >
      <div className="absolute inset-0 rounded-full" style={{ background: ringBackground }} />
      <div className="absolute rounded-full bg-neutral-950" style={{ inset: stroke }} />
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-[26px] font-semibold leading-none text-white tabular-nums">{roundedValue}</span>
        <span className="mt-0.5 text-[10px] text-neutral-500">{label}</span>
      </div>
    </div>
  );
}
