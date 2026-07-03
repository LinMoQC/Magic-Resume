export type FileSizeBucket = 'small' | 'medium' | 'large';

const SMALL_FILE_MAX_BYTES = 512 * 1024;
const MEDIUM_FILE_MAX_BYTES = 2 * 1024 * 1024;

export function getFileSizeBucket(bytes: number): FileSizeBucket {
  if (bytes < SMALL_FILE_MAX_BYTES) return 'small';
  if (bytes < MEDIUM_FILE_MAX_BYTES) return 'medium';
  return 'large';
}
