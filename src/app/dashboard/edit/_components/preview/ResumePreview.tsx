"use client";

import React, { useState, useEffect } from 'react';
import { InfoType, Resume, Section, CustomTemplateConfig } from '@/types/frontend/resume';

// 新的Magic DSL渲染器
import { MagicResumeRenderer } from '@/templates/renderer/MagicResumeRenderer';
import { getMagicTemplateById, getDefaultMagicTemplate } from '@/templates/config/magic-templates';
import { MagicTemplateDSL } from '@/templates/types/magic-dsl';

import { mergeTemplateConfig } from '@/lib/utils/templateUtils';

interface Props {
  info: InfoType;
  sections: Section;
  sectionOrder: string[];
  customStyle?: React.CSSProperties;
  templateId: string;
  customTemplate?: CustomTemplateConfig; // 新增：自定义模板配置差异
}

function ResumePreview({ info, sections, sectionOrder, templateId, customTemplate }: Props) {
  const [template, setTemplate] = useState<MagicTemplateDSL | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTemplate = async () => {
      try {
        setLoading(true);
        
        // 从模板库加载基础模板
        let baseTemplate: MagicTemplateDSL;
        
        if (templateId) {
          try {
            baseTemplate = await getMagicTemplateById(templateId);
          } catch {
            console.warn(`Template ${templateId} not found, using default`);
            baseTemplate = await getDefaultMagicTemplate();
          }
        } else {
          baseTemplate = await getDefaultMagicTemplate();
        }
        
        // 如果有自定义配置，合并到基础模板中
        const finalTemplate = mergeTemplateConfig(baseTemplate, customTemplate);
        setTemplate(finalTemplate);
      } catch (error) {
        console.error('Failed to load template:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTemplate();
  }, [templateId, customTemplate]);

  const resumeData: Resume = {
    id: 'preview',
    name: 'Preview Resume',
    updatedAt: Date.now(),
    info,
    sections,
    sectionOrder: sectionOrder.map(section => ({ 
      key: section, 
      label: section.charAt(0).toUpperCase() + section.slice(1) 
    })),
    template: templateId,
    themeColor: '#3b82f6',
    typography: 'Inter'
  };

  if (loading || !template) {
    return (
      <div className="w-full max-w-4xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
        {/* 简化的头部骨架 */}
        <div className="p-8 border-b border-gray-200">
          <div className="h-6 bg-gray-200 rounded w-48 animate-pulse mb-4" />
          <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
        </div>

        {/* 简化的内容骨架 */}
        <div className="p-8 space-y-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="space-y-3">
              {/* 标题骨架 */}
              <div className="h-5 bg-gray-200 rounded w-24 animate-pulse" />
              
              {/* 内容块骨架 */}
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
  return <MagicResumeRenderer template={template} data={resumeData} />;
}

// 导出 memo 化的预览组件，避开非核心数据导致的重渲染
export default React.memo(ResumePreview, (prevProps, nextProps) => {
  // 深度检查核心内容是否有变化
  return (
    prevProps.templateId === nextProps.templateId &&
    JSON.stringify(prevProps.info) === JSON.stringify(nextProps.info) &&
    JSON.stringify(prevProps.sections) === JSON.stringify(nextProps.sections) &&
    JSON.stringify(prevProps.sectionOrder) === JSON.stringify(nextProps.sectionOrder) &&
    JSON.stringify(prevProps.customTemplate) === JSON.stringify(nextProps.customTemplate)
  );
});
