import React from 'react';
import { Font, pdf } from '@react-pdf/renderer';
import type { MagicTemplateDSL } from '../types/magic-dsl';
import type { Resume } from '../types/resume';
import { PDF_CJK_SANS_FAMILY, PDF_CJK_SERIF_FAMILY, getResumeFontCategory } from '../font-family';
import { magicPdfHyphenationCallback } from './hyphenation';
import { MagicResumePdfDocument } from './MagicResumePdfDocument';

export interface CreateMagicResumePdfBlobOptions {
  data: Resume;
  template: MagicTemplateDSL;
  locale?: string;
}

type PdfFontCategory = ReturnType<typeof getResumeFontCategory>;
type PdfFontStyle = 'normal' | 'italic';

type PdfFontVariant = {
  filename: string;
  fontStyle?: PdfFontStyle;
  fontWeight: number;
};

const pdfFontManifest = {
  'sans-serif': {
    family: PDF_CJK_SANS_FAMILY,
    variants: [
      { filename: 'SourceHanSansSC-Regular.woff', fontWeight: 400 },
      { filename: 'SourceHanSansSC-Bold.woff', fontWeight: 700 },
      { filename: 'SourceHanSansSC-RegularOblique.woff', fontWeight: 400, fontStyle: 'italic' },
      { filename: 'SourceHanSansSC-BoldOblique.woff', fontWeight: 700, fontStyle: 'italic' },
    ],
  },
  serif: {
    family: PDF_CJK_SERIF_FAMILY,
    variants: [
      { filename: 'SourceHanSerifSC-Regular.woff', fontWeight: 400 },
      { filename: 'SourceHanSerifSC-Bold.woff', fontWeight: 700 },
      { filename: 'SourceHanSerifSC-RegularOblique.woff', fontWeight: 400, fontStyle: 'italic' },
      { filename: 'SourceHanSerifSC-BoldOblique.woff', fontWeight: 700, fontStyle: 'italic' },
    ],
  },
} satisfies Record<PdfFontCategory, { family: string; variants: PdfFontVariant[] }>;

let hyphenationRegistered = false;
const registeredFontVariants = new Set<string>();
const warmupPromises = new Map<string, Promise<void>>();

const ensureHyphenationRegistered = () => {
  if (typeof window === 'undefined') throw new Error('PDF export is only available in the browser.');
  if (hyphenationRegistered) return;
  Font.registerHyphenationCallback(magicPdfHyphenationCallback);
  hyphenationRegistered = true;
};

const getTemplateFontCategory = (template?: MagicTemplateDSL): PdfFontCategory => {
  const fontFamily = template?.designTokens.typography.fontFamily.primary ?? '';
  return getResumeFontCategory(fontFamily);
};

const fontVariantUrl = (variant: PdfFontVariant) => `${window.location.origin}/fonts/${variant.filename}`;

const hasItalicText = (value: unknown): boolean => {
  if (typeof value === 'string') {
    return /<(?:em|i)\b|font-style\s*:\s*italic/i.test(value);
  }

  if (!value || typeof value !== 'object') return false;
  if (Array.isArray(value)) return value.some(hasItalicText);
  return Object.values(value as Record<string, unknown>).some(hasItalicText);
};

const getFontVariantsForTemplate = (
  template: MagicTemplateDSL | undefined,
  options: { includeBold?: boolean; includeItalic?: boolean } = {},
): Array<PdfFontVariant & { family: string }> => {
  const fontConfig = pdfFontManifest[getTemplateFontCategory(template)];
  const requiredStyles = new Set<PdfFontStyle>(['normal']);
  if (options.includeItalic) requiredStyles.add('italic');

  return fontConfig.variants
    .filter((variant) => requiredStyles.has(variant.fontStyle ?? 'normal'))
    .filter((variant) => options.includeBold !== false || variant.fontWeight <= 400)
    .map((variant) => ({ ...variant, family: fontConfig.family }));
};

const registerFonts = (template?: MagicTemplateDSL, data?: Resume) => {
  ensureHyphenationRegistered();

  for (const variant of getFontVariantsForTemplate(template, { includeItalic: hasItalicText(data) })) {
    const fontStyle = variant.fontStyle ?? 'normal';
    const key = `${variant.family}:${variant.fontWeight}:${fontStyle}`;
    if (registeredFontVariants.has(key)) continue;

    Font.register({
      family: variant.family,
      src: fontVariantUrl(variant),
      fontWeight: variant.fontWeight,
      fontStyle,
    });
    registeredFontVariants.add(key);
  }
};

const prefetchFont = async (url: string) => {
  try {
    await fetch(url, { cache: 'force-cache' });
  } catch {
    // Font prefetching is only a latency optimization; export can still load
    // the font normally if this background request is interrupted.
  }
};

export const warmupMagicResumePdfExport = async (template?: MagicTemplateDSL): Promise<void> => {
  ensureHyphenationRegistered();

  const fontCategory = getTemplateFontCategory(template);
  const cacheKey = `${window.location.origin}:${fontCategory}`;
  const urls = getFontVariantsForTemplate(template, { includeBold: false }).map(fontVariantUrl);

  if (!warmupPromises.has(cacheKey)) {
    warmupPromises.set(cacheKey, Promise
      .all(urls.map(prefetchFont))
      .then(() => undefined));
  }

  return warmupPromises.get(cacheKey) ?? Promise
    .all(urls.map(prefetchFont))
      .then(() => undefined);
};

const blobToDataUrl = (blob: Blob): Promise<string> => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.onerror = () => reject(reader.error ?? new Error('Failed to read image data.'));
  reader.onload = () => resolve(String(reader.result));
  reader.readAsDataURL(blob);
});

const prepareResumeImages = async (data: Resume): Promise<Resume> => {
  const avatar = data.info.avatar;
  if (!avatar || avatar.startsWith('data:')) return data;

  try {
    const response = await fetch(avatar);
    if (!response.ok) throw new Error(`Avatar request failed with ${response.status}.`);
    const dataUrl = await blobToDataUrl(await response.blob());
    return { ...data, info: { ...data.info, avatar: dataUrl } };
  } catch {
    // A remote avatar should not prevent the rest of the resume from exporting.
    return { ...data, info: { ...data.info, avatar: '' } };
  }
};

export const createMagicResumePdfBlob = async ({
  data,
  template,
  locale,
}: CreateMagicResumePdfBlobOptions): Promise<Blob> => {
  registerFonts(template, data);
  const preparedData = await prepareResumeImages(data);
  const document = (
    <MagicResumePdfDocument data={preparedData} template={template} locale={locale} />
  );

  return pdf(document).toBlob();
};
