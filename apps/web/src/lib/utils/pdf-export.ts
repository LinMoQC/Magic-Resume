import type { Resume } from '@/types/frontend/resume';
import { getDefaultMagicTemplate, getMagicTemplateById } from '@magic-resume/resume-templates/config/magic-templates';
import { mergeTemplateConfig } from '@/lib/utils/templateUtils';

const sanitizeFilename = (value: string): string => {
  const sanitized = value.trim().replace(/[\\/:*?"<>|\u0000-\u001f]/g, '-');
  return sanitized || 'resume';
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};

export const exportResumeToPdf = async (resume: Resume, locale?: string): Promise<void> => {
  let baseTemplate;
  try {
    baseTemplate = await getMagicTemplateById(resume.template);
  } catch {
    baseTemplate = await getDefaultMagicTemplate();
  }

  const template = mergeTemplateConfig(baseTemplate, resume.customTemplate);
  const { createMagicResumePdfBlob } = await import('@magic-resume/resume-templates/pdf/browser');
  const blob = await createMagicResumePdfBlob({ data: resume, template, locale });
  downloadBlob(blob, `${sanitizeFilename(resume.name || resume.info.fullName)}.pdf`);
};
