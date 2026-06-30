import type { Style } from '@react-pdf/types';
import type { ComponentStyle } from '../../types/magic-dsl';

export type PdfStyleInput = Style | Style[] | null | undefined;

export const composePdfStyles = (...styles: PdfStyleInput[]): Style[] =>
  styles.flatMap((style) => {
    if (!style) return [];
    return Array.isArray(style) ? style.filter(Boolean) : [style];
  });

export const cssSizeToPoints = (value: string | number | undefined, fallback = 0): number => {
  if (typeof value === 'number') return value * 0.75;
  if (!value) return fallback;

  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) return fallback;
  if (value.endsWith('rem')) return parsed * 12;
  if (value.endsWith('mm')) return parsed * 2.83465;
  if (value.endsWith('pt')) return parsed;
  return parsed * 0.75;
};

export const toPdfComponentStyle = (style?: ComponentStyle): Style => {
  if (!style) return {};

  return {
    backgroundColor: style.backgroundColor,
    color: style.color,
    padding: cssSizeToPoints(style.padding),
    marginTop: cssSizeToPoints(style.marginTop ?? style.margin),
    marginRight: cssSizeToPoints(style.marginRight ?? style.margin),
    marginBottom: cssSizeToPoints(style.marginBottom ?? style.margin),
    marginLeft: cssSizeToPoints(style.marginLeft ?? style.margin),
    borderRadius: cssSizeToPoints(style.borderRadius),
    fontSize: style.fontSize ? cssSizeToPoints(style.fontSize) : undefined,
    fontWeight: style.fontWeight ? Number(style.fontWeight) : undefined,
    textAlign: style.textAlign,
  };
};

