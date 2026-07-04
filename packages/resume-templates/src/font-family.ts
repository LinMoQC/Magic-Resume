export const PDF_CJK_SANS_FAMILY = 'Source Han Sans SC';
export const PDF_CJK_SERIF_FAMILY = 'Source Han Serif SC';

export type ResumeFontCategory = 'sans-serif' | 'serif';

export const getResumeFontCategory = (fontStack: string): ResumeFontCategory => {
  const normalized = fontStack.toLowerCase().replaceAll('sans-serif', '');
  return /\b(serif|times|georgia|garamond|baskerville)\b/.test(normalized) ? 'serif' : 'sans-serif';
};

export const getPdfFontStack = (fontStack: string): string[] => (
  getResumeFontCategory(fontStack) === 'serif'
    ? [PDF_CJK_SERIF_FAMILY, 'Times-Roman']
    : [PDF_CJK_SANS_FAMILY, 'Helvetica']
);

export const getPdfRichTextFontFamily = (fontStack: string): string => (
  getResumeFontCategory(fontStack) === 'serif'
    ? PDF_CJK_SERIF_FAMILY
    : PDF_CJK_SANS_FAMILY
);

export const getWebFontStack = (fontStack: string): string => {
  const category = getResumeFontCategory(fontStack);
  const fallbackFamily = category === 'serif' ? PDF_CJK_SERIF_FAMILY : PDF_CJK_SANS_FAMILY;
  if (fontStack.includes(fallbackFamily)) return fontStack;

  const genericFamily = category;
  const genericPattern = new RegExp(`(?:^|,\\s*)${genericFamily}\\s*$`, 'i');
  const withoutGeneric = fontStack.replace(genericPattern, '').replace(/,\s*$/, '').trim();
  return [withoutGeneric, `"${fallbackFamily}"`, genericFamily].filter(Boolean).join(', ');
};
