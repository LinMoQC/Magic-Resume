import React from 'react';
import { MagicTemplateDSL } from '@/templates/types/magic-dsl';

interface ResumeMiniPreviewProps {
  template: MagicTemplateDSL;
  className?: string;
}

export default function ResumeMiniPreview({ template, className = "" }: ResumeMiniPreviewProps) {
  const { layout, designTokens } = template;
  const isTwo = layout.type === 'two-column';
  
  return (
    <div className={`w-full h-full bg-white/90 rounded-md p-2 shadow-sm ${className}`}>
      {isTwo ? (
        // 双栏布局预览
        <div className="flex gap-1 h-full">
          {/* 侧边栏 */}
          <div 
            className="w-1/3 rounded-sm p-1"
            style={{ backgroundColor: designTokens.colors.sidebar || designTokens.colors.primary }}
          >
            <div className="space-y-1">
              <div className="h-2 bg-white/30 rounded-sm"></div>
              <div className="h-1 bg-white/20 rounded-sm w-3/4"></div>
              <div className="h-1 bg-white/20 rounded-sm w-1/2"></div>
            </div>
          </div>
          {/* 主内容区 */}
          <div className="flex-1 p-1">
            <div className="space-y-1">
              <div className="h-1.5 bg-gray-300 rounded-sm"></div>
              <div className="h-1 bg-gray-200 rounded-sm w-4/5"></div>
              <div className="h-1 bg-gray-200 rounded-sm w-3/5"></div>
              <div className="mt-2 space-y-0.5">
                <div className="h-1 bg-gray-300 rounded-sm w-2/3"></div>
                <div className="h-0.5 bg-gray-200 rounded-sm w-4/5"></div>
                <div className="h-0.5 bg-gray-200 rounded-sm w-3/4"></div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // 单栏布局预览
        <div className="space-y-1 h-full">
          <div className="h-2 bg-gray-300 rounded-sm"></div>
          <div className="h-1 bg-gray-200 rounded-sm w-3/4"></div>
          <div className="h-1 bg-gray-200 rounded-sm w-1/2"></div>
          <div className="mt-2 space-y-1">
            <div 
              className="h-1 rounded-sm w-1/3" 
              style={{ backgroundColor: designTokens.colors.primary }}
            ></div>
            <div className="h-0.5 bg-gray-200 rounded-sm w-full"></div>
            <div className="h-0.5 bg-gray-200 rounded-sm w-4/5"></div>
            <div className="h-0.5 bg-gray-200 rounded-sm w-3/5"></div>
          </div>
          <div className="mt-2 space-y-1">
            <div 
              className="h-1 rounded-sm w-1/4" 
              style={{ backgroundColor: designTokens.colors.primary }}
            ></div>
            <div className="h-0.5 bg-gray-200 rounded-sm w-full"></div>
            <div className="h-0.5 bg-gray-200 rounded-sm w-2/3"></div>
          </div>
        </div>
      )}
    </div>
  );
}
