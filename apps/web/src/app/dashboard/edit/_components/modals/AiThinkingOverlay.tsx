"use client";

import React from 'react';
import { useTranslation } from 'react-i18next';
import { hexToRgb } from '@/lib/utils/color';
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

  const themeRgb = hexToRgb(themeColor) ?? { r: 56, g: 189, b: 248 };
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
