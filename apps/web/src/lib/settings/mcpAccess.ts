import { API_ORIGIN } from '../api/routes';
import type { AxiosError } from 'axios';
import { formatShortDateTime } from '../utils/dateTime';

export type CloudResumeOption = {
  id: string;
  title: string;
};

export function getMcpApiUrl(apiOrigin = API_ORIGIN): string {
  const normalized = apiOrigin.replace(/\/+$/, '');
  return normalized.endsWith('/api') ? normalized : `${normalized}/api`;
}

export function normalizeCloudResumes(value: unknown): CloudResumeOption[] {
  const maybeData = value as { data?: unknown };
  const list = Array.isArray(value)
    ? value
    : Array.isArray(maybeData?.data)
      ? maybeData.data
      : Array.isArray((maybeData?.data as { data?: unknown })?.data)
        ? (maybeData.data as { data: unknown[] }).data
        : [];

  return list
    .map((item) => {
      const resume = item as { id?: string; title?: string; name?: string };
      if (!resume.id) return null;
      return {
        id: resume.id,
        title: resume.title || resume.name || resume.id,
      };
    })
    .filter((item): item is CloudResumeOption => Boolean(item));
}

export function shellQuote(value: string): string {
  return `'${value.replace(/'/g, "'\\''")}'`;
}

export function formatMcpDate(value: string): string {
  return formatShortDateTime(value);
}

export function getApiErrorMessage(error: unknown): string | null {
  if (!isAxiosError(error)) return null;

  const data = error.response?.data as { message?: unknown } | undefined;
  if (typeof data?.message === 'string') {
    return data.message;
  }

  return null;
}

export function isAxiosError(error: unknown): error is AxiosError {
  return Boolean(error && typeof error === 'object' && 'isAxiosError' in error);
}
