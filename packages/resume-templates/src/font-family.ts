export const PDF_CJK_SANS_FAMILY = 'Source Han Sans SC';
export const PDF_CJK_SERIF_FAMILY = 'Source Han Serif SC';
// 楷体:霞鹜文楷 LXGW WenKai(SIL OFL)。源为 TrueType(glyf),须先 CFF 化再子集
// 才能被 react-pdf(fontkit@2.0.4)正确嵌入 —— glyf 子集路径对复杂字有 bug,
// CFF 走另一条正常的 CFFSubset。详见 docs/specs/kaiti-pdf-fontkit/。
export const PDF_CJK_KAI_FAMILY = 'LXGW WenKai';

// Full (non-subset) families, registered on demand when a resume contains CJK
// ideographs outside the subset (rare names). Distinct family names because
// @react-pdf/font resolves a family to its first-registered source and offers no
// way to replace one — so the full font must live under its own name and the
// document must reference it. See pdf/browser.tsx.
export const PDF_CJK_SANS_FULL_FAMILY = 'Source Han Sans SC Full';
export const PDF_CJK_SERIF_FULL_FAMILY = 'Source Han Serif SC Full';
export const PDF_CJK_KAI_FULL_FAMILY = 'LXGW WenKai Full';

export type ResumeFontCategory = 'sans-serif' | 'serif' | 'kaiti';

interface CjkFamilyConfig {
  subset: string;
  full: string;
  // Latin fallback baked into the react-pdf font stack (a standard PDF font).
  latinFallback: string;
  // CSS generic family used when composing the on-screen web font stack.
  genericFamily: 'sans-serif' | 'serif';
}

const CJK_FAMILY: Record<ResumeFontCategory, CjkFamilyConfig> = {
  'sans-serif': {
    subset: PDF_CJK_SANS_FAMILY,
    full: PDF_CJK_SANS_FULL_FAMILY,
    latinFallback: 'Helvetica',
    genericFamily: 'sans-serif',
  },
  serif: {
    subset: PDF_CJK_SERIF_FAMILY,
    full: PDF_CJK_SERIF_FULL_FAMILY,
    latinFallback: 'Times-Roman',
    genericFamily: 'serif',
  },
  kaiti: {
    subset: PDF_CJK_KAI_FAMILY,
    full: PDF_CJK_KAI_FULL_FAMILY,
    latinFallback: 'Times-Roman',
    genericFamily: 'serif',
  },
};

export const getResumeFontCategory = (fontStack: string): ResumeFontCategory => {
  const normalized = fontStack.toLowerCase().replaceAll('sans-serif', '');
  // 楷体优先:楷体栈(如 "Kaiti SC","KaiTi",serif)也含 serif,必须先于 serif 判定,
  // 否则会被当成宋体渲染。
  if (/\bkaiti\b|楷/.test(normalized)) return 'kaiti';
  return /\b(serif|times|georgia|garamond|baskerville)\b/.test(normalized) ? 'serif' : 'sans-serif';
};

export const getPdfCjkFamily = (fontStack: string, preferFull = false): string => {
  const config = CJK_FAMILY[getResumeFontCategory(fontStack)];
  return preferFull ? config.full : config.subset;
};

export const getPdfFontStack = (fontStack: string, preferFull = false): string[] => {
  const config = CJK_FAMILY[getResumeFontCategory(fontStack)];
  return [preferFull ? config.full : config.subset, config.latinFallback];
};

export const getPdfRichTextFontFamily = (fontStack: string, preferFull = false): string =>
  getPdfCjkFamily(fontStack, preferFull);

export const getWebFontStack = (fontStack: string): string => {
  const { subset: fallbackFamily, genericFamily } = CJK_FAMILY[getResumeFontCategory(fontStack)];
  if (fontStack.includes(fallbackFamily)) return fontStack;

  const genericPattern = new RegExp(`(?:^|,\\s*)${genericFamily}\\s*$`, 'i');
  const withoutGeneric = fontStack.replace(genericPattern, '').replace(/,\s*$/, '').trim();
  return [withoutGeneric, `"${fallbackFamily}"`, genericFamily].filter(Boolean).join(', ');
};
