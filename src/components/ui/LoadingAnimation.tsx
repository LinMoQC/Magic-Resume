"use client";

import React from 'react';
import { Bot } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface LoadingAnimationProps {
  themeColor?: string;
  message?: string;
}

export const LoadingAnimation: React.FC<LoadingAnimationProps> = () => {
  const { t } = useTranslation();
  return (
    <div className="flex items-start gap-3 mb-4">
      {/* AI头像 */}
      <div className="shrink-0 w-8 h-8 rounded-full bg-linear-to-br from-blue-500 to-purple-600 flex items-center justify-center">
        <Bot className="w-4 h-4 text-white" />
      </div>

      {/* 消息气泡 */}
      <div className="flex-1 max-w-[13%]">
        <div className="bg-neutral-800 text-neutral-200 p-3 rounded-2xl shadow-sm border-0">
          
          {/* 简单的思考点动画 */}
          <div className="flex items-center gap-2">
            <div className="text-xs text-neutral-500">{t('loading.aiThinking')}</div>
            <div className="flex gap-1">
              <div className="w-1 h-1 bg-neutral-400 rounded-full animate-bounce [animation-delay:0ms]" />
              <div className="w-1 h-1 bg-neutral-400 rounded-full animate-bounce [animation-delay:150ms]" />
              <div className="w-1 h-1 bg-neutral-400 rounded-full animate-bounce [animation-delay:300ms]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 