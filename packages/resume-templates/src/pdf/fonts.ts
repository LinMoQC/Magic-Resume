import { Font } from '@react-pdf/renderer';

type FontStyle = 'normal' | 'italic';

export type MagicResumeFontSource = {
  src: string;
  fontWeight: number;
  fontStyle?: FontStyle;
};

const CJK_RE = /[\u2E80-\u9FFF\u3000-\u303F\uFF00-\uFFEF]/;
const registeredKeys = new Set<string>();
let hyphenationRegistered = false;

const normalizeBaseUrl = (baseUrl: string): string => baseUrl.replace(/\/$/, '');

export const resolveMagicResumeFontSources = (baseUrl: string): MagicResumeFontSource[] => {
  const normalized = normalizeBaseUrl(baseUrl);
  const regular = `${normalized}/SourceHanSansSC-Regular.otf`;
  const bold = `${normalized}/SourceHanSansSC-Bold.otf`;

  return [
    { src: regular, fontWeight: 400 },
    { src: bold, fontWeight: 700 },
    { src: regular, fontWeight: 400, fontStyle: 'italic' },
    { src: bold, fontWeight: 700, fontStyle: 'italic' },
  ];
};

const containsCJK = (value: unknown): boolean => {
  if (typeof value === 'string') return CJK_RE.test(value);
  if (!value || typeof value !== 'object') return false;
  if (Array.isArray(value)) return value.some(containsCJK);
  return Object.values(value as Record<string, unknown>).some(containsCJK);
};

export const resumeContentContainsCJK = (data: unknown): boolean => containsCJK(data);

export const createMagicResumeHyphenationCallback = (enableCJKLineBreaks: boolean) => (word: string): string[] => {
  if (enableCJKLineBreaks && CJK_RE.test(word)) {
    return Array.from(word).flatMap((letter) => [letter, '']);
  }

  return [word];
};

export const registerMagicResumePdfFonts = ({
  baseUrl,
  data,
}: {
  baseUrl: string;
  data?: unknown;
}): void => {
  const sources = resolveMagicResumeFontSources(baseUrl);

  for (const source of sources) {
    const fontStyle = source.fontStyle ?? 'normal';
    const key = `Source Han Sans SC:${source.fontWeight}:${fontStyle}:${source.src}`;
    if (registeredKeys.has(key)) continue;

    Font.register({
      family: 'Source Han Sans SC',
      src: source.src,
      fontWeight: source.fontWeight,
      fontStyle,
    });
    registeredKeys.add(key);
  }

  if (!hyphenationRegistered) {
    Font.registerHyphenationCallback(createMagicResumeHyphenationCallback(resumeContentContainsCJK(data)));
    hyphenationRegistered = true;
  }
};

