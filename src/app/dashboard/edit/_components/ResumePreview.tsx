"use client";

import React from 'react';
import { InfoType, Section } from '@/store/useResumeStore';
import { ResumeRenderer } from '@/templates/renderer/ResumeRenderer';
import templates from '@/templates/config';

interface Props {
  info: InfoType;
  sections: Section;
  sectionOrder: string[];
  customStyle?: React.CSSProperties;
  templateId: string;
}

export default function ResumePreview({ info, sections, sectionOrder, customStyle, templateId }: Props) {
  
  const selectedTemplate = templates[templateId as keyof typeof templates] || templates.default;
  
  const template = {
    ...selectedTemplate,
    globalStyles: {
      ...selectedTemplate.globalStyles,
      ...customStyle,
    }
  }

  const resumeData = { info, sections, sectionOrder };

  return <ResumeRenderer template={template} data={resumeData} />;
} 
