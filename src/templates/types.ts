import { InfoType, Section } from "@/store/useResumeStore";
import React from "react";

export interface ResumeData {
  info: InfoType;
  sections: Section;
  sectionOrder: string[];
}

export interface ComponentBlock {
  component: string; // 组件名称
  dataBinding?: string; // 数据绑定路径，例如：'info', 'sections.experience'
  props?: Record<string, unknown>; // 组件属性，例如：{ title: 'Work Experience' }
  fieldMap?: Record<string, string | string[]>; // 字段映射，例如：{ mainTitle: 'company' }
  className?: string; // Tailwind 样式类
  style?: React.CSSProperties; // Inline styles for style overrides
}

export interface TemplateDSL {
  id: string;
  name: string;
  version: string;
  description?: string;
  thumbnailUrl?: string;
  tags?: string[];
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  createdAt?: string;
  updatedAt?: string;
  globalStyles: React.CSSProperties;
  layout: ComponentBlock[];
} 