"use client";

import React, { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { hexToRgb } from '@/lib/utils/color';
import PolarisMark from '../ai/PolarisMark';

interface AiThinkingOverlayProps {
  isVisible: boolean;
  themeColor?: string;
  /** 事件驱动的叙述文字；缺省时按兜底时间线轮换（见下） */
  statusText?: string;
}

/**
 * 兜底叙述时间线（秒→i18n key）。这里没有 SSE 事件可听，
 * 但换词本身就是「还活着、在推进」的信号——比永动循环诚实。
 */
const FALLBACK_TIMELINE: { at: number; key: string }[] = [
  { at: 0, key: 'editPage.ai.narrate.reading' },
  { at: 3, key: 'editPage.ai.narrate.thinking' },
  { at: 8, key: 'editPage.ai.narrate.writing' },
  { at: 16, key: 'editPage.ai.narrate.polishing' },
  { at: 26, key: 'editPage.ai.narrate.still' },
];

/**
 * 「纸面入定」——AI 工作中的画布遮罩（docs/specs/ai-working-motion）。
 * 纸面轻压暗、边缘一圈细流光缓慢巡行、小 Polaris 球随全局心跳呼吸、
 * 下方一行会换词的叙述。没有涟漪、没有假进度条。
 */
const AiThinkingOverlay: React.FC<AiThinkingOverlayProps> = ({
  isVisible,
  themeColor = '#38bdf8',
  statusText,
}) => {
  const { t } = useTranslation();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isVisible) return;
    setElapsed(0);
    const timer = window.setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => window.clearInterval(timer);
  }, [isVisible]);

  if (!isVisible) return null;

  const themeRgb = hexToRgb(themeColor) ?? { r: 56, g: 189, b: 248 };
  const overlayStyle = {
    '--ai-color': `${themeRgb.r}, ${themeRgb.g}, ${themeRgb.b}`,
  } as React.CSSProperties;

  const phase = FALLBACK_TIMELINE.reduce((acc, p) => (elapsed >= p.at ? p : acc));
  const text = statusText ?? t(phase.key);

  return (
    <div
      className="ai-thinking-overlay absolute inset-0 z-50 flex flex-col items-center justify-center"
      style={overlayStyle}
      aria-live="polite"
    >
      {/* 边缘细流光：纸自己在思考，不是弹了个 loading 层 */}
      <span className="ai-thinking-overlay__edge" aria-hidden>
        <span className="ai-thinking-overlay__beam ai-thinking-overlay__beam--top" />
        <span className="ai-thinking-overlay__beam ai-thinking-overlay__beam--right" />
        <span className="ai-thinking-overlay__beam ai-thinking-overlay__beam--bottom" />
        <span className="ai-thinking-overlay__beam ai-thinking-overlay__beam--left" />
      </span>

      <div className="ai-thinking-overlay__orb ai-breath">
        <PolarisMark size={20} className="ai-thinking-overlay__mark" />
      </div>

      <div className="relative mt-4 h-5 text-center">
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={text}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="ai-narrate text-[13px] font-medium tracking-wide"
          >
            {text}
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AiThinkingOverlay;
