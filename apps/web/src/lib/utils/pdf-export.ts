import type { Resume } from '@/types/frontend/resume';
import { getDefaultMagicTemplate, getMagicTemplateById } from '@magic-resume/resume-templates/config/magic-templates';
import { mergeTemplateConfig } from '@/lib/utils/templateUtils';

const sanitizeFilename = (value: string): string => {
  const sanitized = value.trim().replace(/[\\/:*?"<>|\u0000-\u001f]/g, '-');
  return sanitized || 'resume';
};

// 1px(96dpi)= 0.75pt(72pt)。测量预览简历的自然高度,换算成 PDF 页高,
// 用于「一整页连续」导出(页高=内容高,不切 A4)。
const PX_TO_PT = 0.75;

const measureResumePageHeight = (): number | undefined => {
  if (typeof document === 'undefined') return undefined;
  // 预览中的简历元素(被缩放变换包裹,但 offsetHeight 是自然布局高度,不受 transform 影响)。
  const element = document.getElementById('resume-to-export');
  if (!element) return undefined;
  const heightPx = Math.max(element.offsetHeight, element.scrollHeight);
  if (!heightPx) return undefined;
  // 底部留一点安全余量,避免 react-pdf 与 HTML 排版的细微差异导致末尾被裁切。
  return Math.round(heightPx * PX_TO_PT) + 24;
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
  const pageHeight = measureResumePageHeight();
  const { createMagicResumePdfBlob } = await import('@magic-resume/resume-templates/pdf/browser');
  const blob = await createMagicResumePdfBlob({ data: resume, template, locale, pageHeight });
  downloadBlob(blob, `${sanitizeFilename(resume.name || resume.info.fullName)}.pdf`);
};
