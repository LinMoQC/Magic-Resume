import type { Resume } from '@/types/frontend/resume';
import { getDefaultMagicTemplate, getMagicTemplateById } from '@magic-resume/resume-templates/config/magic-templates';
import type { MagicTemplateDSL } from '@magic-resume/resume-templates/types/magic-dsl';
import { mergeTemplateConfig } from '@/lib/utils/templateUtils';

type PdfBrowserModule = {
  createMagicResumePdfBlob: (options: {
    data: Resume;
    template: MagicTemplateDSL;
    locale?: string;
  }) => Promise<Blob>;
  warmupMagicResumePdfExport?: (template?: MagicTemplateDSL) => Promise<void>;
};

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

let pdfBrowserModulePromise: Promise<PdfBrowserModule> | null = null;
const templatePromiseCache = new Map<string, Promise<MagicTemplateDSL>>();
const pdfBlobPromiseCache = new WeakMap<Resume, Map<string, Promise<Blob>>>();
const PDF_RENDERER_VERSION = 'pdf-canvas-woff-fonts-v13';

const loadPdfBrowserModule = () => {
  pdfBrowserModulePromise ??= import('@magic-resume/resume-templates/pdf/browser') as Promise<PdfBrowserModule>;
  return pdfBrowserModulePromise;
};

const loadResumeTemplate = async (resume: Resume): Promise<MagicTemplateDSL> => {
  const templateId = resume.template || 'default';
  let baseTemplatePromise = templatePromiseCache.get(templateId);

  if (!baseTemplatePromise) {
    baseTemplatePromise = (async () => {
      try {
        return await getMagicTemplateById(resume.template);
      } catch {
        return getDefaultMagicTemplate();
      }
    })();
    templatePromiseCache.set(templateId, baseTemplatePromise);
  }

  const baseTemplate = await baseTemplatePromise;
  return mergeTemplateConfig(baseTemplate, resume.customTemplate);
};

export const preloadResumePdfExport = async (resume: Resume): Promise<void> => {
  const [template, pdfModule] = await Promise.all([
    loadResumeTemplate(resume),
    loadPdfBrowserModule(),
  ]);

  await pdfModule.warmupMagicResumePdfExport?.(template);
};

const getPdfCacheKey = (resume: Resume, locale?: string) => {
  return [
    PDF_RENDERER_VERSION,
    locale ?? '',
    resume.updatedAt,
    resume.template,
    resume.themeColor,
    resume.typography,
  ].join(':');
};

const getCachedPdfBlobPromise = (resume: Resume, locale?: string): Promise<Blob> | undefined => {
  return pdfBlobPromiseCache.get(resume)?.get(getPdfCacheKey(resume, locale));
};

const setCachedPdfBlobPromise = (resume: Resume, locale: string | undefined, promise: Promise<Blob>) => {
  let localeCache = pdfBlobPromiseCache.get(resume);
  if (!localeCache) {
    localeCache = new Map<string, Promise<Blob>>();
    pdfBlobPromiseCache.set(resume, localeCache);
  }

  localeCache.set(getPdfCacheKey(resume, locale), promise);
};

export const prepareResumePdfExport = async (resume: Resume, locale?: string): Promise<Blob> => {
  const cached = getCachedPdfBlobPromise(resume, locale);
  if (cached) return cached;

  const template = await loadResumeTemplate(resume);
  const { createMagicResumePdfBlob } = await loadPdfBrowserModule();
  const blobPromise = createMagicResumePdfBlob({ data: resume, template, locale });
  setCachedPdfBlobPromise(resume, locale, blobPromise);

  try {
    return await blobPromise;
  } catch (error) {
    pdfBlobPromiseCache.get(resume)?.delete(getPdfCacheKey(resume, locale));
    throw error;
  }
};

export const exportResumeToPdf = async (resume: Resume, locale?: string): Promise<void> => {
  const blob = await prepareResumePdfExport(resume, locale);
  downloadBlob(blob, `${sanitizeFilename(resume.name || resume.info.fullName)}.pdf`);
};
