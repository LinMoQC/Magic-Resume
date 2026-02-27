import React from 'react';
import { MagicTemplateDSL } from '@/templates/types/magic-dsl';
import { Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import ResumeMiniPreview from '../../../_components/ResumeMiniPreview';

interface TemplatePreviewCardProps {
  template: MagicTemplateDSL;
  isSelected: boolean;
  onSelect: () => void;
  onCustomize?: () => void;
}

const TemplatePreviewCard = React.memo(({ template, isSelected, onSelect, onCustomize }: TemplatePreviewCardProps) => {
  const { t } = useTranslation();
  const primaryColor = template.designTokens.colors.primary;
  
  const handleSelect = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('[TemplatePreviewCard] Template selected:', template.id);
    onSelect();
  };

  return (
    <div
      className={`relative group cursor-pointer transition-all duration-200 ${
        isSelected ? 'scale-[1.02]' : 'hover:scale-[1.01]'
      }`}
      onClick={handleSelect}
      onTouchEnd={handleSelect}
    >
      {/* 主卡片 */}
      <div
        className={`relative bg-neutral-800/80 backdrop-blur-sm border-2 aspect-3/4 rounded-xl overflow-hidden transition-all duration-200 ${
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
        
        {/* 简历预览区域 */}
        <div className="relative h-full p-2">
          <ResumeMiniPreview template={template} />
        </div>
        
        {/* 选中指示器 */}
        {isSelected && (
          <>
            <div className="absolute top-2 right-2 w-3 h-3 bg-blue-500 rounded-full shadow-lg"></div>
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
            className="absolute top-2 left-2 w-6 h-6 bg-neutral-700/80 hover:bg-neutral-600 border border-neutral-600 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
            title={t('templatePanel.customize')}
          >
            <Settings size={12} className="text-neutral-300" />
          </button>
        )}
      </div>

      {/* 模板名称 - 放在卡片外面避免被遮挡 */}
      <h3 className="text-white text-xs font-semibold text-center mt-2 truncate px-1">
        {template.name}
      </h3>
    </div>
  );
});

TemplatePreviewCard.displayName = 'TemplatePreviewCard';

export default TemplatePreviewCard;