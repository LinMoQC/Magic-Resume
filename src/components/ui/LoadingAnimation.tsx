"use client";

import React from 'react';
import { Bot } from 'lucide-react';

interface LoadingAnimationProps {
  themeColor?: string;
  message?: string;
}

export const LoadingAnimation: React.FC<LoadingAnimationProps> = () => {
  return (
    <div className="flex items-start gap-3 mb-4">
      {/* AI头像 */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
        <Bot className="w-4 h-4 text-white" />
      </div>

      {/* 消息气泡 */}
      <div className="flex-1 max-w-[13%]">
        <div className="bg-neutral-800 text-neutral-200 p-3 rounded-2xl shadow-sm border-0">
          
          {/* 简单的思考点动画 */}
          <div className="flex items-center gap-2">
            <div className="text-xs text-neutral-500">AI思考中</div>
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