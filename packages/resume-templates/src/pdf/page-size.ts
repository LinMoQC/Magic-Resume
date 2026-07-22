export type PageSizeName = 'A4' | 'Letter';

const A4_PAGE_SIZE = {
  width: 595.28,
  height: 841.89,
} as const;

const LETTER_PAGE_SIZE = {
  width: 612,
  height: 792,
} as const;

export const FREE_FORM_PAGE_SIZE = { width: A4_PAGE_SIZE.width } as const;

// 纸张纵横比(高/宽):A4 ≈ 1.4142,Letter ≈ 1.2941。
export const PAGE_ASPECT_RATIO: Record<PageSizeName, number> = {
  A4: A4_PAGE_SIZE.height / A4_PAGE_SIZE.width,
  Letter: LETTER_PAGE_SIZE.height / LETTER_PAGE_SIZE.width,
};

// 各规格标准页宽(96dpi 下的 CSS px),供面板切换时把 containerWidth 设为标准值。
export const PAGE_WIDTH_PX: Record<PageSizeName, number> = {
  A4: 794,
  Letter: 816,
};

// 自由高度页保持所选纸张纵横比的最小高度;宽度随 layout.containerWidth 变化,
// 与 HTML 渲染器 Layout.tsx 的 pageMinHeight 语义一致。
export const getFreeFormPageMinHeight = (width: number, pageSize: PageSizeName = 'A4'): number =>
  width * PAGE_ASPECT_RATIO[pageSize];
