"use client";

import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { PolarisGlyph } from "../ai/PolarisMark";

type AiFabProps = {
  onClick: () => void;
  isRunning?: boolean;
};

// 球内散布的小碎星(位置%/像素大小/闪烁相位与周期,周期各不同避免同步呼吸)
const SPARKS = [
  { left: "79.7%", top: "28.7%", size: 6.5, delay: "0s", dur: "3.4s" }, // top-right hero
  { left: "23.2%", top: "29.5%", size: 5, delay: "1.1s", dur: "4.2s" }, // upper-left
  { left: "15.3%", top: "41.2%", size: 4, delay: "2s", dur: "3.8s" }, // left
  { left: "84.2%", top: "40.2%", size: 3.5, delay: "0.7s", dur: "4.6s" }, // right
  { left: "77.9%", top: "54.3%", size: 4, delay: "1.6s", dur: "3.2s" }, // right-lower
  { left: "21.3%", top: "68.4%", size: 5, delay: "0.4s", dur: "4.4s" }, // lower-left
  { left: "64.2%", top: "67.3%", size: 3.5, delay: "2.3s", dur: "3.6s" }, // lower-center
  { left: "35.8%", top: "80.6%", size: 4, delay: "1.3s", dur: "4s" }, // bottom
];

/**
 * 画布右下角的 AI 入口(Polaris)。一颗 Siri 风格的玻璃光球:玻璃壳下彩色液滴各自沿
 * 不同路径漂移 + 呼吸缩放(交叠不断变化 = 液态流动),底层 conic 色环慢转提供角向环流,
 * 两道彗尾缘光沿球缘环行,球内碎星错相闪烁,球外光晕呼吸。生成中(isRunning)整体提速。
 * hover 用 framer-motion 弹簧上浮(近临界阻尼,不弹跳) + brightness 点亮。
 * `absolute bottom-6 right-6` 自动避开右侧模板栏;可见性门控由父层(isCloudMode)决定。
 */
export function AiFab({ onClick, isRunning = false }: AiFabProps) {
  const { t } = useTranslation();
  const label = t("tools.polaris");

  return (
    // 入场包在外层(比 dock 再晚半拍,轻微缩放淡入,像光球"呼吸"登场);按钮本体只保留
    // hover/tap 弹簧,二者互不串扰(同元素上 initial/animate 的 transition 会拖慢 hover 回落)。
    // 定位类挪到 wrapper;按钮改 relative,光晕(inset 定位)与 tooltip 锚点不变。
    <motion.div
      className="absolute bottom-6 right-6 z-20"
      initial={{ opacity: 0, scale: 0.92, y: 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: 0.42 }}
    >
      <motion.button
        type="button"
        onClick={onClick}
        aria-label={label}
        title={label}
        aria-busy={isRunning || undefined}
        data-running={isRunning ? "true" : "false"}
        whileHover={{ y: -6 }}
        whileTap={{ y: -2, scale: 0.96 }}
        transition={{ type: "spring", stiffness: 320, damping: 28, mass: 0.7 }}
        className={cn(
          "polaris-fab group relative block rounded-full",
          "transition-shadow duration-200 ease-out",
          "hover:shadow-[0_18px_44px_-22px_rgba(120,150,255,0.7)]",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50",
        )}
      >
        <span aria-hidden className="polaris-fab__halo" />
        <span
          aria-hidden
          className="polaris-orb block transition-[filter] duration-200 group-hover:brightness-110"
        >
          <span className="polaris-orb__light">
            <span className="polaris-orb__flow" />
            <span className="polaris-orb__blob polaris-orb__blob--magenta" />
            <span className="polaris-orb__blob polaris-orb__blob--blue" />
            <span className="polaris-orb__blob polaris-orb__blob--cyan" />
            <span className="polaris-orb__blob polaris-orb__blob--violet" />
            <span className="polaris-orb__blob polaris-orb__blob--teal" />
            <span className="polaris-orb__core" />
          </span>
          <span className="polaris-orb__rim" />
          <span className="polaris-orb__glass" />
          <span className="polaris-orb__stars">
            {SPARKS.map((s, i) => (
              <span
                key={i}
                className="polaris-orb__spark"
                style={{
                  left: s.left,
                  top: s.top,
                  width: s.size,
                  height: s.size,
                  animationDelay: s.delay,
                  animationDuration: s.dur,
                }}
              >
                <PolarisGlyph />
              </span>
            ))}
          </span>
        </span>
        <span className="pointer-events-none absolute right-full top-1/2 mr-3 -translate-y-1/2 whitespace-nowrap rounded-md border border-neutral-800 bg-neutral-900/90 px-2 py-1 text-xs text-sky-200 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
          {label}
        </span>
      </motion.button>
    </motion.div>
  );
}
