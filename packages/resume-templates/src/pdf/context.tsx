import React, { createContext, useContext, useMemo } from 'react';
import type { MagicTemplateDSL } from '../types/magic-dsl';
import type { Resume } from '../types/resume';
import { getSectionPdfIcon, type PdfIconName } from './pdfIcons';

export type PdfRenderContextValue = {
  data: Resume;
  template: MagicTemplateDSL;
  locale?: string;
  rtl: boolean;
};

const PdfRenderContext = createContext<PdfRenderContextValue | null>(null);

export const PdfRenderProvider = ({
  data,
  template,
  locale,
  children,
}: Omit<PdfRenderContextValue, 'rtl'> & { children: React.ReactNode }) => {
  const rtl = /^ar|^he|^fa|^ur/i.test(locale ?? '');
  const value = useMemo(() => ({ data, template, locale, rtl }), [data, template, locale, rtl]);

  return <PdfRenderContext.Provider value={value}>{children}</PdfRenderContext.Provider>;
};

export const usePdfRender = (): PdfRenderContextValue => {
  const context = useContext(PdfRenderContext);
  if (!context) throw new Error('usePdfRender must be used inside PdfRenderProvider.');
  return context;
};

const ZH_TITLE_BY_SECTION_KEY: Record<string, string> = {
  summary: '个人总结',
  experience: '工作经历',
  education: '教育经历',
  projects: '项目经历',
  skills: '专业技能',
  languages: '语言能力',
  certificates: '证书资质',
  profiles: '个人主页',
  awards: '奖项',
};

const ZH_TITLE_BY_ENGLISH: Record<string, string> = {
  summary: '个人总结',
  experience: '工作经历',
  'work experience': '工作经历',
  'professional experience': '专业经历',
  education: '教育经历',
  projects: '项目经历',
  skills: '专业技能',
  'technical skills': '技术技能',
  languages: '语言能力',
  certificates: '证书资质',
  certifications: '证书资质',
  profiles: '个人主页',
  links: '个人主页',
  awards: '奖项',
};

export const resolvePdfSectionTitle = ({
  sectionKey,
  fallbackTitle,
  locale,
}: {
  sectionKey?: string;
  fallbackTitle: string;
  locale?: string;
}): string => {
  if (!locale?.toLowerCase().startsWith('zh')) return fallbackTitle;
  if (sectionKey && ZH_TITLE_BY_SECTION_KEY[sectionKey]) return ZH_TITLE_BY_SECTION_KEY[sectionKey];

  return ZH_TITLE_BY_ENGLISH[fallbackTitle.trim().toLowerCase()] ?? fallbackTitle;
};

export const getPdfSectionIconName = (sectionKey?: string): PdfIconName | null => getSectionPdfIcon(sectionKey);
