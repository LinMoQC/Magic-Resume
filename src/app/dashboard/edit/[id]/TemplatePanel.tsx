import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { FaRegClone } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

// 使用API获取模板
import { getMagicTemplateList } from '@/templates/config/magic-templates';
import { MagicTemplateDSL } from '@/templates/types/magic-dsl';
import { motion } from 'framer-motion';
import TemplatePreviewCard from './TemplatePreviewCard';

type TemplatePanelProps = {
  rightCollapsed: boolean;
  setRightCollapsed: (collapsed: boolean) => void;
  onSelectTemplate: (templateId: string) => void;
  currentTemplateId: string;
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

export default function TemplatePanel({ rightCollapsed, setRightCollapsed, onSelectTemplate, currentTemplateId }: TemplatePanelProps) {
  const { t } = useTranslation();
  const [templates, setTemplates] = useState<MagicTemplateDSL[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
          />
        ))}
      </motion.div>
    );
  };

  return (
    <aside className={`relative bg-neutral-900 border-l border-neutral-800 transition-all duration-300 flex justify-center items-start p-2 ${rightCollapsed ? 'w-[56px]' : 'w-[280px]'} overflow-auto`}>
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-1/2 -translate-y-1/2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-full h-8 w-8 z-50 shadow-lg border border-neutral-600 transition-all duration-300"
        style={{ 
          left: rightCollapsed ? 'calc(100vw - 56px - 16px)' : 'calc(100vw - 280px - 16px)'
        }}
        onClick={() => setRightCollapsed(!rightCollapsed)}
      >
        {rightCollapsed ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
      </Button>

      {!rightCollapsed && (
        <div className="w-full p-4">
          <h2 className="text-xl font-semibold mb-6 text-left">
            <FaRegClone className="inline-block mr-3 text-[16px]" />
            {t('templatePanel.title')}
          </h2>
          {renderContent()}
        </div>
      )}
    </aside>
  );
} 