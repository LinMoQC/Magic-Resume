import React from 'react';
import { MagicTemplateDSL } from '@/templates/types/magic-dsl';
import { Settings } from 'lucide-react';

interface TemplatePreviewCardProps {
  template: MagicTemplateDSL;
  isSelected: boolean;
  onSelect: () => void;
  onCustomize?: () => void;
}

// 简历布局预览组件
const ResumePreview = ({ template }: { template: MagicTemplateDSL }) => {
  const { layout, designTokens } = template;
  const isTwo = layout.type === 'two-column';
  
  return (
    <div className="w-full h-full bg-white/90 rounded-md p-2 shadow-sm">
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
};

export default function TemplatePreviewCard({ template, isSelected, onSelect, onCustomize }: TemplatePreviewCardProps) {
  const primaryColor = template.designTokens.colors.primary;
  
  return (
    <div
      className={`relative group cursor-pointer transition-all duration-200 ${
        isSelected ? 'scale-[1.02]' : 'hover:scale-[1.01]'
      }`}
      onClick={onSelect}
    >
      {/* 主卡片 */}
      <div
        className={`relative bg-neutral-800/80 backdrop-blur-sm border-2 aspect-[3/4] rounded-xl overflow-hidden transition-all duration-200 ${
          isSelected 
            ? 'border-blue-500 shadow-lg shadow-blue-500/20' 
            : 'border-neutral-600 hover:border-neutral-500'
        }`}
      >
        {/* 背景渐变 */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{ 
            background: `linear-gradient(135deg, ${primaryColor}, transparent 70%)` 
          }}
        />
        
        {/* 内容区域 */}
        <div className="relative h-full p-3 flex flex-col">
          {/* 简历预览区域 */}
          <div className="flex-1 mb-3">
            <ResumePreview template={template} />
          </div>
          
          {/* 底部信息 */}
          <div className="space-y-2">
            {/* 模板名称 */}
            <h3 className="text-white text-sm font-semibold text-center">
              {template.name}
            </h3>
            
            {/* 布局标识和颜色指示 */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-400">
                {template.layout.type === 'two-column' ? '双栏' : '单栏'}
              </span>
              
              {/* 颜色指示器 */}
              <div className="flex gap-1">
                <div 
                  className="w-2 h-2 rounded-full border border-white/20" 
                  style={{ backgroundColor: template.designTokens.colors.primary }}
                />
                <div 
                  className="w-2 h-2 rounded-full border border-white/20" 
                  style={{ backgroundColor: template.designTokens.colors.secondary }}
                />
                {template.designTokens.colors.sidebar && (
                  <div 
                    className="w-2 h-2 rounded-full border border-white/20" 
                    style={{ backgroundColor: template.designTokens.colors.sidebar }}
                  />
                )}
              </div>
            </div>
            
            {/* 标签 */}
            <div className="flex justify-center gap-1">
              {template.tags.slice(0, 2).map((tag, index) => (
                <span 
                  key={index}
                  className="text-xs px-2 py-0.5 rounded-full bg-neutral-700/60 text-neutral-300 border border-neutral-600/50"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
        
        {/* 选中指示器和自定义按钮 */}
        {isSelected && (
          <>
            <div className="absolute top-3 right-3 w-3 h-3 bg-blue-500 rounded-full shadow-lg"></div>
            <div className="absolute inset-0 bg-blue-500/5 pointer-events-none"></div>
          </>
        )}
        
        {/* 自定义按钮 */}
        {onCustomize && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCustomize();
            }}
            className="absolute top-2 left-2 w-6 h-6 bg-neutral-700/80 hover:bg-neutral-600 border border-neutral-600 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            title="自定义模板"
          >
            <Settings size={12} className="text-neutral-300" />
          </button>
        )}
      </div>
    </div>
  );
} 