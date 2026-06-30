import type { Style } from '@react-pdf/types';

const A4_PAGE_SIZE = {
  width: 595.28,
  height: 841.89,
} as const;

export const FREE_FORM_PAGE_SIZE = { width: A4_PAGE_SIZE.width } as const;

export const FREE_FORM_PAGE_MIN_HEIGHT_STYLE: Style = {
  minHeight: A4_PAGE_SIZE.height,
};
