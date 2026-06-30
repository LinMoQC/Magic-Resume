"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';
import PolarisMark from '../ai/PolarisMark';

interface AiThinkingOverlayProps {
  isVisible: boolean;
  themeColor?: string;
}

const AiThinkingOverlay: React.FC<AiThinkingOverlayProps> = ({ 
  isVisible, 
  themeColor = '#38bdf8' 
}) => {
  const { t } = useTranslation();

  if (!isVisible) return null;

  // 从主题色提取RGB值用于动效
  const hexToRgb = (hex: string) => {
    const cleaned = hex.replace('#', '').trim();
    const normalized = cleaned.length === 3
      ? cleaned.split('').map((char) => char + char).join('')
      : cleaned;
    const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(normalized);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 56, g: 189, b: 248 }; // 默认sky-400
  };

  const themeRgb = hexToRgb(themeColor);
  const primaryColor = `${themeRgb.r}, ${themeRgb.g}, ${themeRgb.b}`;
  const overlayStyle = {
    '--ai-color': primaryColor,
  } as React.CSSProperties;

  return (
    <div
      className="ai-thinking-overlay absolute inset-0 z-50 flex flex-col items-center justify-center"
      style={overlayStyle}
      aria-live="polite"
    >
      <div className="ai-thinking-overlay__core">
        <span className="ai-thinking-overlay__halo" aria-hidden />
        <span className="ai-thinking-overlay__ripple ai-thinking-overlay__ripple--one" aria-hidden />
        <span className="ai-thinking-overlay__ripple ai-thinking-overlay__ripple--two" aria-hidden />
        <div className="ai-thinking-overlay__orb">
          <span className="ai-thinking-overlay__sheen" aria-hidden />
          <PolarisMark size={34} className="ai-thinking-overlay__mark" />
        </div>
      </div>

      <div className="relative mt-7 text-center">
        <p className="text-sm font-medium tracking-wide text-white/90">
          {t('editPage.ai.generatingSuggestion')}
        </p>
        <div className="ai-thinking-overlay__meter" aria-hidden>
          <span />
        </div>
      </div>
    </div>
  );
};

export default AiThinkingOverlay;
