export function parseCssPixelValue(value: string): number {
  return Number.parseInt(value, 10) || 0;
}
