"use client";

import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { POLARIS_STAR_D } from "../ai/PolarisMark";

type AiFabProps = {
  onClick: () => void;
  isRunning?: boolean;
};

// 球内散布的小碎星(位置%/像素大小/闪烁相位)
const SPARKS = [
  { left: "79.7%", top: "28.7%", size: 6.5, delay: "0s" }, // top-right hero
  { left: "23.2%", top: "29.5%", size: 5, delay: "1.1s" }, // upper-left
  { left: "15.3%", top: "41.2%", size: 4, delay: "2s" }, // left
  { left: "84.2%", top: "40.2%", size: 3.5, delay: "0.7s" }, // right
  { left: "77.9%", top: "54.3%", size: 4, delay: "1.6s" }, // right-lower
  { left: "21.3%", top: "68.4%", size: 5, delay: "0.4s" }, // lower-left
  { left: "64.2%", top: "67.3%", size: 3.5, delay: "2.3s" }, // lower-center
  { left: "35.8%", top: "80.6%", size: 4, delay: "1.3s" }, // bottom
];

/**
 * 画布右下角的 AI 入口(Polaris)。一颗 Siri 风格的玻璃光球:玻璃壳下 magenta/blue/cyan/teal
 * 多片彩色流光各自不同速度公转(交叠不断变化 = 流动),球内散布几颗错相闪烁的小碎星;
 * 生成中(isRunning)流光提速。hover 用 framer-motion 弹簧上浮 + brightness 点亮。
 * `absolute bottom-6 right-6` 自动避开右侧模板栏;可见性门控由父层(isCloudMode)决定。
 */
export function AiFab({ onClick, isRunning = false }: AiFabProps) {
  const { t } = useTranslation();
  const label = t("tools.polaris");

  return (
    <motion.button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-busy={isRunning || undefined}
      data-running={isRunning ? "true" : "false"}
      whileHover={{ y: -6 }}
      whileTap={{ y: -2, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 300, damping: 18, mass: 0.8 }}
      className={cn(
        "polaris-fab group absolute bottom-6 right-6 z-20 rounded-full",
        "transition-shadow duration-200 ease-out",
        "hover:shadow-[0_18px_44px_-22px_rgba(120,150,255,0.7)]",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50",
      )}
    >
      <span
        aria-hidden
        className="polaris-orb block transition-[filter] duration-200 group-hover:brightness-110"
      >
        <span className="polaris-orb__light">
          <span className="polaris-orb__rib polaris-orb__rib--violet" />
          <span className="polaris-orb__rib polaris-orb__rib--magenta" />
          <span className="polaris-orb__rib polaris-orb__rib--blue" />
          <span className="polaris-orb__rib polaris-orb__rib--cyan" />
          <span className="polaris-orb__rib polaris-orb__rib--teal" />
          <span className="polaris-orb__streak polaris-orb__streak--1" />
          <span className="polaris-orb__streak polaris-orb__streak--2" />
          <span className="polaris-orb__core" />
        </span>
        <span className="polaris-orb__glass" />
        <span className="polaris-orb__stars">
          {SPARKS.map((s, i) => (
            <span
              key={i}
              className="polaris-orb__spark"
              style={{ left: s.left, top: s.top, width: s.size, height: s.size, animationDelay: s.delay }}
            >
              <svg viewBox="0 0 24 24" fill="none">
                <path d={POLARIS_STAR_D} fill="currentColor" />
              </svg>
            </span>
          ))}
        </span>
      </span>
      <span className="pointer-events-none absolute right-full top-1/2 mr-3 -translate-y-1/2 whitespace-nowrap rounded-md border border-neutral-800 bg-neutral-900/90 px-2 py-1 text-xs text-sky-200 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
        {label}
      </span>
    </motion.button>
  );
}
