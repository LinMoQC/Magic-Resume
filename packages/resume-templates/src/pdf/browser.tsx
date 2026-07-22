import React from 'react';
import { Font, pdf } from '@react-pdf/renderer';
import type { MagicTemplateDSL } from '../types/magic-dsl';
import type { Resume } from '../types/resume';
import {
  PDF_CJK_KAI_FAMILY,
  PDF_CJK_KAI_FULL_FAMILY,
  PDF_CJK_SANS_FAMILY,
  PDF_CJK_SANS_FULL_FAMILY,
  PDF_CJK_SERIF_FAMILY,
  PDF_CJK_SERIF_FULL_FAMILY,
  getResumeFontCategory,
} from '../font-family';
import { cjkSubsetCharset } from './cjk-subset-charset';
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
      { filename: 'SourceHanSansSC-Regular.woff2', fontWeight: 400 },
      { filename: 'SourceHanSansSC-Bold.woff2', fontWeight: 700 },
      { filename: 'SourceHanSansSC-RegularOblique.woff2', fontWeight: 400, fontStyle: 'italic' },
      { filename: 'SourceHanSansSC-BoldOblique.woff2', fontWeight: 700, fontStyle: 'italic' },
    ],
  },
  serif: {
    family: PDF_CJK_SERIF_FAMILY,
    variants: [
      { filename: 'SourceHanSerifSC-Regular.woff2', fontWeight: 400 },
      { filename: 'SourceHanSerifSC-Bold.woff2', fontWeight: 700 },
      { filename: 'SourceHanSerifSC-RegularOblique.woff2', fontWeight: 400, fontStyle: 'italic' },
      { filename: 'SourceHanSerifSC-BoldOblique.woff2', fontWeight: 700, fontStyle: 'italic' },
    ],
  },
  // 楷体只有 Regular(400)/Medium(当 700 用),无独立斜体;斜体复用同一文件,
  // 避免 resume 含斜体文本时 @react-pdf 的 FontFamily.resolve 找不到字重而 throw。
  kaiti: {
    family: PDF_CJK_KAI_FAMILY,
    variants: [
      { filename: 'LXGWWenKai-Regular.woff2', fontWeight: 400 },
      { filename: 'LXGWWenKai-Medium.woff2', fontWeight: 700 },
      { filename: 'LXGWWenKai-Regular.woff2', fontWeight: 400, fontStyle: 'italic' },
      { filename: 'LXGWWenKai-Medium.woff2', fontWeight: 700, fontStyle: 'italic' },
    ],
  },
} satisfies Record<PdfFontCategory, { family: string; variants: PdfFontVariant[] }>;

const toFullFontVariant = (variant: PdfFontVariant): PdfFontVariant => ({
  ...variant,
  filename: variant.filename.replace(/\.woff2$/, '.woff'),
});

// Parallel manifest of the full (non-subset) fonts in public/fonts/full/, keyed
// by the same category. Registered on demand for rare-glyph fallback only.
const pdfFullFontManifest = {
  'sans-serif': {
    family: PDF_CJK_SANS_FULL_FAMILY,
    variants: pdfFontManifest['sans-serif'].variants.map(toFullFontVariant),
  },
  serif: {
    family: PDF_CJK_SERIF_FULL_FAMILY,
    variants: pdfFontManifest.serif.variants.map(toFullFontVariant),
  },
  kaiti: {
    family: PDF_CJK_KAI_FULL_FAMILY,
    variants: pdfFontManifest.kaiti.variants.map(toFullFontVariant),
  },
} satisfies Record<PdfFontCategory, { family: string; variants: PdfFontVariant[] }>;

const isCjkIdeographCodePoint = (codePoint: number) =>
  (codePoint >= 0x3400 && codePoint <= 0x4dbf) || // CJK Ext A
  (codePoint >= 0x4e00 && codePoint <= 0x9fff) || // CJK Unified Ideographs
  (codePoint >= 0xf900 && codePoint <= 0xfaff) || // CJK Compatibility Ideographs
  (codePoint >= 0x20000 && codePoint <= 0x2fa1f); // CJK Ext B–F + Compatibility Supplement

// True if the string holds a CJK ideograph outside the subset fonts. ASCII, Latin
// and CJK punctuation all sit below U+3400 (or are covered by the subset), so the
// fast path keeps this cheap on ordinary resumes.
const stringHasUnsubsettedCjk = (value: string): boolean => {
  for (const char of value) {
    const codePoint = char.codePointAt(0);
    if (codePoint === undefined || codePoint < 0x3400) continue;
    if (isCjkIdeographCodePoint(codePoint) && !cjkSubsetCharset.has(char)) return true;
  }
  return false;
};

// Walk the resume for any rendered rare ideograph. Skips avatar data URLs (large
// base64, never CJK) so the per-keystroke preview scan stays fast.
const resumeNeedsFullCjkFonts = (value: unknown, key?: string): boolean => {
  if (typeof value === 'string') {
    if (key === 'avatar') return false;
    return stringHasUnsubsettedCjk(value);
  }
  if (!value || typeof value !== 'object') return false;
  if (Array.isArray(value)) return value.some((item) => resumeNeedsFullCjkFonts(item));
  return Object.entries(value as Record<string, unknown>).some(([entryKey, entryValue]) =>
    resumeNeedsFullCjkFonts(entryValue, entryKey),
  );
};

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
  const fontFamily = template?.designTokens?.typography?.fontFamily?.primary ?? '';
  return getResumeFontCategory(fontFamily);
};

const fontVariantUrl = (variant: PdfFontVariant) => `${window.location.origin}/fonts/${variant.filename}`;
const fullFontVariantUrl = (variant: PdfFontVariant) => `${window.location.origin}/fonts/full/${variant.filename}`;

const hasItalicText = (value: unknown): boolean => {
  if (typeof value === 'string') {
    return /<(?:em|i)\b|font-style\s*:\s*italic/i.test(value);
  }

  if (!value || typeof value !== 'object') return false;
  if (Array.isArray(value)) return value.some(hasItalicText);
  return Object.values(value as Record<string, unknown>).some(hasItalicText);
};

type PdfFontConfig = { family: string; variants: PdfFontVariant[] };

const selectFontVariants = (
  config: PdfFontConfig,
  options: { includeBold?: boolean; includeItalic?: boolean } = {},
): Array<PdfFontVariant & { family: string }> => {
  const requiredStyles = new Set<PdfFontStyle>(['normal']);
  if (options.includeItalic) requiredStyles.add('italic');

  return config.variants
    .filter((variant) => requiredStyles.has(variant.fontStyle ?? 'normal'))
    .filter((variant) => options.includeBold !== false || variant.fontWeight <= 400)
    .map((variant) => ({ ...variant, family: config.family }));
};

const getFontVariantsForTemplate = (
  template: MagicTemplateDSL | undefined,
  options: { includeBold?: boolean; includeItalic?: boolean } = {},
): Array<PdfFontVariant & { family: string }> =>
  selectFontVariants(pdfFontManifest[getTemplateFontCategory(template)], options);

const registerFontConfig = (
  config: PdfFontConfig,
  urlOf: (variant: PdfFontVariant) => string,
  includeItalic: boolean,
) => {
  for (const variant of selectFontVariants(config, { includeItalic })) {
    const fontStyle = variant.fontStyle ?? 'normal';
    const key = `${variant.family}:${variant.fontWeight}:${fontStyle}`;
    if (registeredFontVariants.has(key)) continue;

    Font.register({
      family: variant.family,
      src: urlOf(variant),
      fontWeight: variant.fontWeight,
      fontStyle,
    });
    registeredFontVariants.add(key);
  }
};

const registerFonts = (template?: MagicTemplateDSL, data?: Resume) => {
  ensureHyphenationRegistered();
  registerFontConfig(
    pdfFontManifest[getTemplateFontCategory(template)],
    fontVariantUrl,
    hasItalicText(data),
  );
};

// Register the full CJK fonts (public/fonts/full/) under their own family so a
// resume with rare ideographs renders them instead of tofu. Called only when
// resumeNeedsFullCjkFonts() found such a glyph — otherwise the 13–16MB files are
// never fetched, preserving the subset first-paint win.
const registerFullCjkFonts = (template?: MagicTemplateDSL, data?: Resume) => {
  ensureHyphenationRegistered();
  registerFontConfig(
    pdfFullFontManifest[getTemplateFontCategory(template)],
    fullFontVariantUrl,
    hasItalicText(data),
  );
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

// Cache the remote-avatar → data-URL conversion by URL. The live preview
// re-runs this pipeline on every (debounced) edit, so without memoization each
// keystroke burst would re-fetch and re-encode the same remote image.
const avatarDataUrlCache = new Map<string, Promise<string>>();

const fetchAvatarDataUrl = (avatar: string): Promise<string> => {
  let promise = avatarDataUrlCache.get(avatar);
  if (!promise) {
    promise = (async () => {
      const response = await fetch(avatar, { cache: 'force-cache' });
      if (!response.ok) throw new Error(`Avatar request failed with ${response.status}.`);
      return blobToDataUrl(await response.blob());
    })();
    // Never cache a rejection — allow the next render to retry a failed fetch.
    void promise.catch(() => avatarDataUrlCache.delete(avatar));
    avatarDataUrlCache.set(avatar, promise);
  }
  return promise;
};

const prepareResumeImages = async (data: Resume): Promise<Resume> => {
  const avatar = data.info.avatar;
  if (!avatar || avatar.startsWith('data:')) return data;

  try {
    const dataUrl = await fetchAvatarDataUrl(avatar);
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
  const cjkFallback = resumeNeedsFullCjkFonts(data);
  if (cjkFallback) registerFullCjkFonts(template, data);
  const preparedData = await prepareResumeImages(data);
  const document = (
    <MagicResumePdfDocument
      data={preparedData}
      template={template}
      locale={locale}
      cjkFallback={cjkFallback}
    />
  );

  return pdf(document).toBlob();
};
