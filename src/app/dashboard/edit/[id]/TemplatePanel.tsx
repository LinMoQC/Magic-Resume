import React, { useState, useEffect } from 'react';
import { ArrowLeft, ArrowRight, Settings } from 'lucide-react';
import { Button } from '@/app/components/ui/button';
import { FaRegClone } from 'react-icons/fa';
import { useTranslation } from 'react-i18next';

// 使用API获取模板
import { getMagicTemplateList } from '@/templates/config/magic-templates';
import { MagicTemplateDSL } from '@/templates/types/magic-dsl';
import { motion, AnimatePresence } from 'framer-motion';
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

// 面板展开/收起动画配置
const panelVariants = {
  expanded: {
    width: 280,
    transition: {
      type: "spring",
      damping: 20,
      stiffness: 300,
      duration: 0.6
    }
  },
  collapsed: {
    width: 56,
    transition: {
      type: "spring",
      damping: 20,
      stiffness: 300,
      duration: 0.6
    }
  }
};

// 按钮位置动画配置
const buttonVariants = {
  expanded: {
    right: 264,
    transition: {
      type: "spring",
      damping: 25,
      stiffness: 400,
      duration: 0.5
    }
  },
  collapsed: {
    right: 40,
    transition: {
      type: "spring",
      damping: 25,
      stiffness: 400,
      duration: 0.5
    }
  }
};

// 内容动画配置
const contentVariants = {
  hidden: { 
    opacity: 0,
    x: 20,
    scale: 0.95
  },
  show: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      type: "spring",
      damping: 25,
      stiffness: 400,
      duration: 0.4,
      delay: 0.1
    }
  },
  exit: {
    opacity: 0,
    x: 20,
    scale: 0.95,
    transition: {
      duration: 0.2
    }
  }
};

// 模板网格动画配置
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      type: "spring",
      damping: 30,
      stiffness: 400,
      staggerChildren: 0.08,
      delayChildren: 0.1
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
        <motion.div 
          className="grid grid-cols-2 gap-4"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {/* 简化的骨架屏模板卡片 */}
          {Array.from({ length: 4 }).map((_, index) => (
            <motion.div 
              key={index} 
              className="relative bg-neutral-800/80 border-2 border-neutral-600 aspect-[3/4] rounded-xl overflow-hidden"
              variants={{
                hidden: { 
                  opacity: 0, 
                  y: 20,
                  scale: 0.9
                },
                show: { 
                  opacity: 1, 
                  y: 0,
                  scale: 1,
                  transition: {
                    type: "spring",
                    damping: 25,
                    stiffness: 500,
                    delay: index * 0.1
                  }
                }
              }}
            >
              {/* 简化的骨架内容 */}
              <div className="h-full p-3 flex flex-col">
                {/* 预览区域骨架 */}
                <motion.div 
                  className="flex-1 mb-3 bg-neutral-700/50 rounded"
                  animate={{ 
                    opacity: [0.5, 0.8, 0.5] 
                  }}
                  transition={{ 
                    duration: 1.5, 
                    repeat: Infinity, 
                    ease: "easeInOut" 
                  }}
                />
                
                {/* 模板名称骨架 */}
                <motion.div 
                  className="h-4 bg-neutral-600 rounded w-1/2 mx-auto"
                  animate={{ 
                    opacity: [0.5, 0.8, 0.5] 
                  }}
                  transition={{ 
                    duration: 1.5, 
                    repeat: Infinity, 
                    ease: "easeInOut",
                    delay: 0.2
                  }}
                />
              </div>
            </motion.div>
          ))}
        </motion.div>
      );
    }

    if (error) {
      return (
        <motion.div 
          className="flex flex-col items-center justify-center h-64 text-red-400"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ 
            type: "spring", 
            damping: 25, 
            stiffness: 400,
            duration: 0.4
          }}
        >
          <motion.p 
            className="text-sm mb-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            Error loading templates
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => window.location.reload()}
              className="text-xs"
            >
              Retry
            </Button>
          </motion.div>
        </motion.div>
      );
    }

    if (templates.length === 0) {
      return (
        <motion.div 
          className="flex items-center justify-center h-64 text-neutral-400"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ 
            type: "spring", 
            damping: 25, 
            stiffness: 400,
            duration: 0.4
          }}
        >
          <motion.p 
            className="text-sm"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            No templates available
          </motion.p>
        </motion.div>
      );
    }

    return (
      <motion.div
        className="grid grid-cols-2 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {templates.map((template: MagicTemplateDSL, index) => (
          <motion.div
            key={template.id}
            variants={{
              hidden: { 
                opacity: 0, 
                y: 20,
                scale: 0.9
              },
              show: { 
                opacity: 1, 
                y: 0,
                scale: 1,
                transition: {
                  type: "spring",
                  damping: 25,
                  stiffness: 500,
                  duration: 0.4
                }
              }
            }}
            whileHover={{ 
              scale: 1.02,
              transition: { 
                type: "spring", 
                damping: 20, 
                stiffness: 400 
              }
            }}
            whileTap={{ scale: 0.98 }}
          >
            <TemplatePreviewCard
              template={template}
              isSelected={currentTemplateId === template.id}
              onSelect={() => onSelectTemplate(template.id)}
              onCustomize={() => handleCustomizeTemplate(template)}
            />
          </motion.div>
        ))}
      </motion.div>
    );
  };

  return (
    <>
      <motion.aside 
        className="fixed top-0 right-0 h-screen bg-neutral-900 border-l border-neutral-800 flex justify-center items-start p-2 z-40 overflow-auto scrollbar-hide"
        variants={panelVariants}
        animate={rightCollapsed ? 'collapsed' : 'expanded'}
        initial={rightCollapsed ? 'collapsed' : 'expanded'}
      >
        <AnimatePresence mode="wait">
          {!rightCollapsed && (
            <motion.div 
              className="w-full h-full flex flex-col"
              variants={contentVariants}
              initial="hidden"
              animate="show"
              exit="exit"
              key="panel-content"
            >
              {isCustomizing && customizingTemplate ? (
                // 自定义面板
                <motion.div 
                  className="h-full flex flex-col"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ 
                    type: "spring", 
                    damping: 25, 
                    stiffness: 400,
                    duration: 0.4
                  }}
                >
                  <div className="p-4 border-b border-neutral-800">
                    <motion.h2 
                      className="text-xl font-semibold text-left"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ 
                        delay: 0.1,
                        type: "spring", 
                        damping: 20, 
                        stiffness: 400
                      }}
                    >
                      <motion.div
                        className="inline-block mr-3"
                        animate={{ rotate: [0, 360] }}
                        transition={{ 
                          duration: 0.6, 
                          ease: "easeOut",
                          delay: 0.2
                        }}
                      >
                        <Settings className="text-[16px]" />
                      </motion.div>
                      {t('templateCustomizer.title')}
                    </motion.h2>
                  </div>
                  <motion.div 
                    className="flex-1"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ 
                      delay: 0.2,
                      type: "spring", 
                      damping: 25, 
                      stiffness: 400
                    }}
                  >
                    <TemplateCustomizer
                      key={`customizer-${customizingTemplate.id}`}
                      template={customizingTemplate}
                      onTemplateChange={handleTemplateChange}
                      onBack={handleBackToTemplates}
                    />
                  </motion.div>
                </motion.div>
              ) : (
                // 模板列表
                <motion.div 
                  className="p-4"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ 
                    type: "spring", 
                    damping: 25, 
                    stiffness: 400,
                    duration: 0.4
                  }}
                >
                  <motion.h2 
                    className="text-xl font-semibold mb-6 text-left"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ 
                      delay: 0.1,
                      type: "spring", 
                      damping: 20, 
                      stiffness: 400
                    }}
                  >
                    <motion.div
                      className="inline-block mr-3"
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ 
                        duration: 0.4, 
                        ease: "easeOut",
                        delay: 0.2
                      }}
                    >
                      <FaRegClone className="text-[16px]" />
                    </motion.div>
                    {t('templatePanel.title')}
                  </motion.h2>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ 
                      delay: 0.2,
                      type: "spring", 
                      damping: 25, 
                      stiffness: 400
                    }}
                  >
                    {renderContent()}
                  </motion.div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.aside>

      <motion.div
        className="fixed top-1/2 -translate-y-1/2 z-50"
        variants={buttonVariants}
        animate={rightCollapsed ? 'collapsed' : 'expanded'}
        initial={rightCollapsed ? 'collapsed' : 'expanded'}
      >
        <Button
          variant="ghost"
          size="icon"
          className="bg-neutral-800 hover:bg-neutral-700 text-white rounded-full h-8 w-8 shadow-lg border border-neutral-600 hover:scale-110 transition-transform duration-200"
          onClick={() => {
            setRightCollapsed(!rightCollapsed);
          }}
          title={`Panel is ${rightCollapsed ? 'collapsed' : 'expanded'}. Click to ${rightCollapsed ? 'expand' : 'collapse'}.`}
        >
          <motion.div
            animate={{ rotate: rightCollapsed ? 0 : 180 }}
            transition={{ type: "spring", damping: 20, stiffness: 400 }}
          >
            <ArrowLeft size={16} />
          </motion.div>
        </Button>
      </motion.div>
    </>
  );
} 