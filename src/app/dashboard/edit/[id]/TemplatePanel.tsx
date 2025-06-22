import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Settings } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { FaRegClone } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

// 使用API获取模板
import { getMagicTemplateList } from '@/templates/config/magic-templates';
import { MagicTemplateDSL } from '@/templates/types/magic-dsl';
import { motion } from 'framer-motion';
import TemplatePreviewCard from './TemplatePreviewCard';
import TemplateCustomizer from '../../../../templates/TemplateCustomizer';
import { useResumeStore } from '@/store/useResumeStore';
import { extractCustomConfig, mergeTemplateConfig } from '@/lib/templateUtils';

type TemplatePanelProps = {
  rightCollapsed: boolean;
  setRightCollapsed: (collapsed: boolean) => void;
  onSelectTemplate: (templateId: string) => void;
  currentTemplateId: string;
  onTemplateUpdate?: (template: MagicTemplateDSL) => void;
};

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export default function TemplatePanel({ rightCollapsed, setRightCollapsed, onSelectTemplate, currentTemplateId, onTemplateUpdate }: TemplatePanelProps) {
  const { t } = useTranslation();
  const { updateCustomTemplate, activeResume } = useResumeStore();
  const [templates, setTemplates] = useState<MagicTemplateDSL[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCustomizing, setIsCustomizing] = useState(false);
  const [customizingTemplate, setCustomizingTemplate] = useState<MagicTemplateDSL | null>(null);

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        setLoading(true);
        setError(null);
        const templateList = await getMagicTemplateList();
        setTemplates(templateList);
      } catch (err) {
        console.error('Failed to load templates:', err);
        setError('Failed to load templates');
      } finally {
        setLoading(false);
      }
    };

    loadTemplates();
  }, []);

  // 处理模板自定义
  const handleCustomizeTemplate = (template: MagicTemplateDSL) => {
    // 如果当前简历有自定义配置，合并到基础模板中显示当前状态
    let templateToCustomize = template;
    
    if (activeResume?.customTemplate) {
      templateToCustomize = mergeTemplateConfig(template, activeResume.customTemplate);
    }
    
    setCustomizingTemplate(templateToCustomize);
    setIsCustomizing(true);
  };

  // 处理模板更新
  const handleTemplateChange = (updatedTemplate: MagicTemplateDSL) => {
    setCustomizingTemplate(updatedTemplate);
    
    // 从基础模板中提取自定义配置差异
    const baseTemplate = templates.find(t => t.id === currentTemplateId);
    if (baseTemplate) {
      const customConfig = extractCustomConfig(baseTemplate, updatedTemplate);
      // 实时更新到简历配置中，这样预览会立即显示效果
      updateCustomTemplate(customConfig || {});
    }
    
    if (onTemplateUpdate) {
      onTemplateUpdate(updatedTemplate);
    }
  };



  // 返回模板列表
  const handleBackToTemplates = () => {
    setIsCustomizing(false);
    setCustomizingTemplate(null);
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="grid grid-cols-2 gap-4">
          {/* 简化的骨架屏模板卡片 */}
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="relative bg-neutral-800/80 border-2 border-neutral-600 aspect-[3/4] rounded-xl overflow-hidden">
              {/* 简化的骨架内容 */}
              <div className="h-full p-3 flex flex-col">
                {/* 预览区域骨架 */}
                <div className="flex-1 mb-3 bg-neutral-700/50 rounded animate-pulse" />
                
                {/* 模板名称骨架 */}
                <div className="h-4 bg-neutral-600 rounded w-1/2 mx-auto animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-64 text-red-400">
          <p className="text-sm mb-2">Error loading templates</p>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => window.location.reload()}
            className="text-xs"
          >
            Retry
          </Button>
        </div>
      );
    }

    if (templates.length === 0) {
      return (
        <div className="flex items-center justify-center h-64 text-neutral-400">
          <p className="text-sm">No templates available</p>
        </div>
      );
    }

    return (
      <motion.div
        className="grid grid-cols-2 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {templates.map((template: MagicTemplateDSL) => (
          <TemplatePreviewCard
            key={template.id}
            template={template}
            isSelected={currentTemplateId === template.id}
            onSelect={() => onSelectTemplate(template.id)}
            onCustomize={() => handleCustomizeTemplate(template)}
          />
        ))}
      </motion.div>
    );
  };

  return (
    <aside className={`fixed top-0 right-0 h-screen bg-neutral-900 border-l border-neutral-800 transition-all duration-300 flex justify-center items-start p-2 z-40 ${rightCollapsed ? 'w-[56px]' : 'w-[280px]'} overflow-auto scrollbar-hide`}>
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-1/2 -translate-y-1/2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-full h-8 w-8 z-50 shadow-lg border border-neutral-600 transition-all duration-300"
        style={{ 
          right: rightCollapsed ? '40px' : '264px'
        }}
        onClick={() => setRightCollapsed(!rightCollapsed)}
      >
        {rightCollapsed ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
      </Button>

      {!rightCollapsed && (
        <div className="w-full h-full flex flex-col">
          {isCustomizing && customizingTemplate ? (
            // 自定义面板
            <div className="h-full flex flex-col">
              <div className="p-4 border-b border-neutral-800">
                <h2 className="text-xl font-semibold text-left">
                  <Settings className="inline-block mr-3 text-[16px]" />
                  {t('templateCustomizer.title')}
                </h2>
              </div>
              <div className="flex-1">
                                  <TemplateCustomizer
                    key={`customizer-${customizingTemplate.id}`}
                    template={customizingTemplate}
                    onTemplateChange={handleTemplateChange}
                    onBack={handleBackToTemplates}
                  />
              </div>
            </div>
          ) : (
            // 模板列表
            <div className="p-4">
              <h2 className="text-xl font-semibold mb-6 text-left">
                <FaRegClone className="inline-block mr-3 text-[16px]" />
                {t('templatePanel.title')}
              </h2>
              {renderContent()}
            </div>
          )}
        </div>
      )}
    </aside>
  );
} 