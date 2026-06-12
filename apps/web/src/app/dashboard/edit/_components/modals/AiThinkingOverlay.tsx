"use client";

import React from 'react';
import { Wand2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 56, g: 189, b: 248 }; // 默认sky-400
  };

  const themeRgb = hexToRgb(themeColor);
  const primaryColor = `${themeRgb.r}, ${themeRgb.g}, ${themeRgb.b}`;

  return (
    <div 
      className="absolute inset-0 z-50 flex flex-col items-center justify-center"
      style={{
        background: `rgba(${primaryColor}, 0.15)`,
        backdropFilter: 'blur(12px) saturate(150%)',
        WebkitBackdropFilter: 'blur(12px) saturate(150%)',
      }}
    >

      
      {/* 简洁AI思考核心 */}
      <div className="relative">
        {/* 中央AI图标 */}
        <div 
          className="relative w-16 h-16 rounded-full flex items-center justify-center animate-pulse"
          style={{
            backgroundColor: `rgba(${primaryColor}, 0.9)`,
            boxShadow: `0 0 30px rgba(${primaryColor}, 0.5)`
          }}
        >
          <Wand2 size={32} className="text-white" />
          
          {/* 简单旋转环 */}
          <div 
            className="absolute inset-0 rounded-full border-2 border-transparent animate-spin"
            style={{
              borderTopColor: `rgba(255, 255, 255, 0.3)`,
              borderRightColor: `rgba(255, 255, 255, 0.1)`
            }}
          ></div>
        </div>
      </div>
      
      {/* 简洁文字 */}
      <div className="mt-8 text-center">
        <p 
          className="text-lg font-medium text-white animate-pulse"
        >
          {t('editPage.ai.generatingSuggestion')}
        </p>
        
        {/* 简单思考点 */}
        <div className="flex justify-center space-x-1 mt-3">
          <div 
            className="w-2 h-2 rounded-full animate-bounce"
            style={{ backgroundColor: `rgba(${primaryColor}, 0.8)` }}
          ></div>
          <div 
            className="w-2 h-2 rounded-full animate-bounce animation-delay-200"
            style={{ backgroundColor: `rgba(${primaryColor}, 0.8)` }}
          ></div>
          <div 
            className="w-2 h-2 rounded-full animate-bounce animation-delay-400"
            style={{ backgroundColor: `rgba(${primaryColor}, 0.8)` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default AiThinkingOverlay; 