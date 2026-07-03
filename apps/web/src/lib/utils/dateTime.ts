type Translate = (key: string) => string;

export interface CountdownTimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

const SHORT_DATE_TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
};

const COMPACT_DATE_TIME_OPTIONS: Intl.DateTimeFormatOptions = {
  month: 'numeric',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
};

export function formatShortDateTime(value: string | number | Date, locale?: string, timeZone?: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return new Intl.DateTimeFormat(locale, {
    ...SHORT_DATE_TIME_OPTIONS,
    ...(timeZone ? { timeZone } : {}),
  }).format(date);
}

export function formatCompactDateTime(
  timestamp?: number,
  locale = 'zh-CN',
  timeZone?: string,
): string {
  if (!timestamp) return '';

  return new Intl.DateTimeFormat(locale, {
    ...COMPACT_DATE_TIME_OPTIONS,
    ...(timeZone ? { timeZone } : {}),
  }).format(new Date(timestamp));
}

export function formatCommentDate(dateStr: string, t: Translate): string {
  if (!dateStr || dateStr === 'Just now') return t('sharedPage.comments.justNow');
  return formatShortDateTime(dateStr);
}

export function getCountdownTimeLeft(target: number, now = Date.now()): CountdownTimeLeft {
  const diff = Math.max(0, target - now);
  const totalSeconds = Math.floor(diff / 1000);

  return {
    days: Math.floor(totalSeconds / 86400),
    hours: Math.floor((totalSeconds % 86400) / 3600),
    minutes: Math.floor((totalSeconds % 3600) / 60),
    seconds: totalSeconds % 60,
  };
}
