'use client';

import { Suspense, useCallback, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { motion } from 'framer-motion';
import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown, ExternalLink, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  fetchTimelines,
  type PublicTimeline,
  type TimelineListParams,
} from '@/lib/api/knowledge';

const PAGE_SIZE = 20;

/** 季节选项按当前年份生成（去年秋 → 明年秋），不硬编码具体年份。 */
function seasonOptions(now = new Date()): string[] {
  const year = now.getFullYear();
  return [year - 1, year, year + 1].flatMap((y) => [`${y} 春`, `${y} 秋`]);
}

const INDUSTRY_OPTIONS = [
  '互联网',
  '电商',
  '本地生活',
  '金融',
  '硬件',
  '游戏',
] as const;

function daysUntil(iso?: string): number | null {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  return Math.ceil(diff / 86_400_000);
}

// ── 日期格式化（时间线用短格式，随语言切换）────────────────────────────
const isZh = (lang: string) => lang.startsWith('zh');
const EN_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function monthKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}`;
}
function monthLabel(iso: string, lang: string): string {
  const d = new Date(iso);
  const sameYear = d.getFullYear() === new Date().getFullYear();
  if (isZh(lang)) {
    return sameYear ? `${d.getMonth() + 1} 月` : `${d.getFullYear()} 年 ${d.getMonth() + 1} 月`;
  }
  return sameYear ? EN_MONTHS[d.getMonth()] : `${EN_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}
function todayLabel(lang: string): string {
  const d = new Date();
  return isZh(lang)
    ? `${d.getMonth() + 1} 月 ${d.getDate()} 日`
    : `${EN_MONTHS[d.getMonth()]} ${d.getDate()}`;
}
function shortDate(iso: string, lang: string): string {
  const d = new Date(iso);
  return isZh(lang) ? `${d.getMonth() + 1}.${d.getDate()}` : `${d.getMonth() + 1}/${d.getDate()}`;
}

// ── 组织成一条连续时间线：今天线 → 即将截止(按月分刻度) → 长期有效 → 已截止 ──
type EntryTone = 'urgent' | 'future' | 'evergreen' | 'past';
type Row =
  | { kind: 'today'; id: string }
  | { kind: 'month'; id: string; label: string }
  | { kind: 'marker'; id: string; label: string; tone: 'evergreen' | 'past' }
  | { kind: 'entry'; id: string; item: PublicTimeline; tone: EntryTone };

function buildRows(
  items: PublicTimeline[],
  lang: string,
  showToday: boolean,
  labels: { evergreen: string; past: string },
): Row[] {
  const upcoming: PublicTimeline[] = [];
  const evergreen: PublicTimeline[] = [];
  const past: PublicTimeline[] = [];
  for (const item of items) {
    const d = daysUntil(item.deadlineAt);
    if (d === null) evergreen.push(item);
    else if (d < 0) past.push(item);
    else upcoming.push(item);
  }
  upcoming.sort(
    (a, b) => new Date(a.deadlineAt!).getTime() - new Date(b.deadlineAt!).getTime(),
  );
  past.sort(
    (a, b) => new Date(b.deadlineAt!).getTime() - new Date(a.deadlineAt!).getTime(),
  );

  const rows: Row[] = [];
  if (upcoming.length) {
    if (showToday) rows.push({ kind: 'today', id: 'today' });
    // 首个即将截止若在本月，则不重复月份刻度（今天线已代表本月）。
    let prevMonth = showToday ? `${new Date().getFullYear()}-${new Date().getMonth()}` : '';
    for (const item of upcoming) {
      const mk = monthKey(item.deadlineAt!);
      if (mk !== prevMonth) {
        rows.push({ kind: 'month', id: `m-${mk}`, label: monthLabel(item.deadlineAt!, lang) });
        prevMonth = mk;
      }
      const d = daysUntil(item.deadlineAt)!;
      rows.push({ kind: 'entry', id: item.id, item, tone: d <= 3 ? 'urgent' : 'future' });
    }
  }
  if (evergreen.length) {
    rows.push({ kind: 'marker', id: 'evergreen', label: labels.evergreen, tone: 'evergreen' });
    for (const item of evergreen)
      rows.push({ kind: 'entry', id: item.id, item, tone: 'evergreen' });
  }
  if (past.length) {
    rows.push({ kind: 'marker', id: 'past', label: labels.past, tone: 'past' });
    for (const item of past) rows.push({ kind: 'entry', id: item.id, item, tone: 'past' });
  }
  return rows;
}

// Static literal class strings so Tailwind's content scanner picks them up.
// Nodes are opaque (or surface-filled) and sit at z-10 over the faint spine,
// so they punctuate the line without needing a ring gap.
const ENTRY_NODE_CLASS: Record<EntryTone, string> = {
  urgent: 'bg-sky-400 shadow-[0_0_0_4px_rgba(56,189,248,0.12)]',
  future: 'bg-white/45',
  evergreen: 'bg-[var(--surface-desk)] border border-white/25',
  past: 'bg-[var(--surface-desk)] border border-white/15',
};

function DeadlineLabel({ item }: { item: PublicTimeline }) {
  const { t, i18n } = useTranslation();
  const d = daysUntil(item.deadlineAt);
  if (d === null)
    return <span className="text-[var(--text-secondary)]">{t('knowledge.timelines.groups.evergreen')}</span>;
  if (d < 0)
    return (
      <span className="text-[var(--text-secondary)]/70 line-through">
        {t('knowledge.timelines.deadline.past')}
      </span>
    );
  if (d === 0)
    return <span className="font-medium text-sky-300">{t('knowledge.timelines.deadline.today')}</span>;
  if (d <= 7)
    return (
      <span className="font-medium text-sky-300">
        {t('knowledge.timelines.deadline.soon', { count: d })}
      </span>
    );
  return (
    <span className="text-[var(--text-secondary)]">
      {t('knowledge.timelines.deadline.on', { date: shortDate(item.deadlineAt!, i18n.language) })}
    </span>
  );
}

function hashHue(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) h = (h * 31 + s.charCodeAt(i)) % 360;
  return h;
}

/** 公司图标：有采集/运营填的 logo 就用真 logo（白底 object-contain），否则退回
 *  由公司名派生低彩度 OKLCH 字标（CJK 取首字 / 拉丁取双字母）；logo 加载失败也退字标。 */
function CompanyAvatar({
  name,
  logoUrl,
  dim,
}: {
  name: string;
  logoUrl?: string;
  dim?: boolean;
}) {
  const [broken, setBroken] = useState(false);
  const trimmed = name.trim();

  if (logoUrl && !broken) {
    return (
      <span
        className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white"
        style={{ opacity: dim ? 0.6 : undefined }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- 任意外部 logo 域名，next/image 不适用 */}
        <img
          src={logoUrl}
          alt=""
          loading="lazy"
          referrerPolicy="no-referrer"
          className="h-full w-full object-contain p-1"
          onError={() => setBroken(true)}
        />
      </span>
    );
  }

  const isLatin = /^[A-Za-z]/.test(trimmed);
  const initials = isLatin ? trimmed.slice(0, 2).toUpperCase() : trimmed.slice(0, 1);
  const hue = hashHue(trimmed);
  return (
    <span
      aria-hidden
      className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-[13px] font-semibold"
      style={{
        backgroundColor: `oklch(0.33 0.045 ${hue})`,
        color: `oklch(0.86 0.07 ${hue})`,
        opacity: dim ? 0.6 : undefined,
      }}
    >
      {initials}
    </span>
  );
}

function EntryRow({ item, tone, index }: { item: PublicTimeline; tone: EntryTone; index: number }) {
  const { i18n } = useTranslation();
  const meta = [
    item.title,
    item.industry,
    item.region,
    item.season,
  ].filter(Boolean);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: Math.min(index, 8) * 0.03, ease: [0.22, 1, 0.36, 1] }}
      className={`relative pl-9 pb-6 ${tone === 'past' ? 'opacity-55' : ''}`}
    >
      <span
        aria-hidden
        className={`absolute left-[3px] top-[7px] z-10 h-2 w-2 rounded-full ${ENTRY_NODE_CLASS[tone]}`}
      />
      <div className="flex gap-3">
        <CompanyAvatar name={item.company} logoUrl={item.logoUrl} dim={tone === 'past'} />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <div className="flex min-w-0 items-baseline gap-2">
              <span className="truncate text-[15px] font-semibold text-[var(--text-primary)]">
                {item.company}
              </span>
              {item.stage ? (
                <span className="shrink-0 text-xs text-[var(--text-secondary)]">
                  · {item.stage}
                </span>
              ) : null}
            </div>
            <span className="shrink-0 text-xs">
              <DeadlineLabel item={item} />
            </span>
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-[var(--text-secondary)]">
            {meta.map((m, i) => (
              <span key={`${m}-${i}`} className="inline-flex items-center gap-1.5">
                {i > 0 ? <span className="text-[var(--text-secondary)]/40">·</span> : null}
                {m}
              </span>
            ))}
            {item.roleTags.map((tag) => (
              <span key={tag} className="text-sky-300/80">
                #{tag}
              </span>
            ))}
          </div>

          <div className="mt-1.5 flex items-center gap-2 text-[11px] text-[var(--text-secondary)]/70">
            {item.openAt || item.deadlineAt ? (
              <span>
                {item.openAt ? shortDate(item.openAt, i18n.language) : ''}
                {item.openAt && item.deadlineAt ? ' → ' : ''}
                {item.deadlineAt ? shortDate(item.deadlineAt, i18n.language) : ''}
              </span>
            ) : null}
            {item.sourceUrl ? (
              <a
                href={item.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 transition-colors hover:text-sky-400"
              >
                <ExternalLink size={11} />
                {item.sourceName}
              </a>
            ) : item.sourceName ? (
              <span>{item.sourceName}</span>
            ) : null}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function TodayRow() {
  const { t, i18n } = useTranslation();
  return (
    <div className="relative pl-9 pb-6 pt-1">
      <span
        aria-hidden
        className="absolute left-[1px] top-[4px] z-10 h-3 w-3 rounded-full bg-sky-400 shadow-[0_0_0_4px_rgba(56,189,248,0.16)]"
      />
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold tracking-wide text-sky-300">
          {t('knowledge.timelines.today')} · {todayLabel(i18n.language)}
        </span>
        <span className="h-px flex-1 bg-gradient-to-r from-sky-400/40 to-transparent" />
      </div>
    </div>
  );
}

function MarkerRow({ label, tone }: { label: string; tone: 'month' | 'evergreen' | 'past' }) {
  const dim = tone === 'past';
  return (
    <div className={`relative pl-9 pb-4 pt-2 ${dim ? 'opacity-70' : ''}`}>
      <span
        aria-hidden
        className="absolute left-[4px] top-[9px] z-10 h-1.5 w-1.5 rounded-full bg-white/25"
      />
      <div className="flex items-center gap-3">
        <span className="text-[11px] font-medium tracking-wide text-[var(--text-secondary)]/80">
          {label}
        </span>
        <span className="h-px flex-1 bg-white/[0.06]" />
      </div>
    </div>
  );
}

function Timeline({ items }: { items: PublicTimeline[] }) {
  const { t, i18n } = useTranslation();
  const rows = useMemo(
    () =>
      buildRows(items, i18n.language, true, {
        evergreen: t('knowledge.timelines.groups.evergreen'),
        past: t('knowledge.timelines.groups.past'),
      }),
    [items, i18n.language, t],
  );

  let entryIndex = 0;
  return (
    <div className="relative">
      {/* 贯穿主轴 */}
      <span
        aria-hidden
        className="pointer-events-none absolute left-[7px] top-4 bottom-4 w-px bg-white/[0.09]"
      />
      <div className="flex flex-col">
        {rows.map((row) => {
          if (row.kind === 'today') return <TodayRow key={row.id} />;
          if (row.kind === 'month')
            return <MarkerRow key={row.id} label={row.label} tone="month" />;
          if (row.kind === 'marker')
            return <MarkerRow key={row.id} label={row.label} tone={row.tone} />;
          return <EntryRow key={row.id} item={row.item} tone={row.tone} index={entryIndex++} />;
        })}
      </div>
    </div>
  );
}

function TimelineSkeleton() {
  return (
    <div className="relative">
      <span aria-hidden className="absolute left-[7px] top-4 bottom-4 w-px bg-white/[0.06]" />
      <div className="flex flex-col gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="relative pl-9">
            <span className="absolute left-[3px] top-[7px] h-2 w-2 rounded-full bg-white/10" />
            <Skeleton className="h-4 w-40 rounded" />
            <Skeleton className="mt-2 h-3 w-56 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

const SELECT_ITEM_CLASS =
  'relative flex cursor-pointer select-none items-center rounded-md py-1.5 pl-2.5 pr-8 text-sm text-[var(--text-secondary)] outline-none transition-colors data-[highlighted]:bg-sky-400/10 data-[highlighted]:text-[var(--text-primary)] data-[state=checked]:text-sky-300 data-[state=checked]:font-medium';

function SelectOption({ value, label }: { value: string; label: string }) {
  return (
    <SelectPrimitive.Item value={value} className={SELECT_ITEM_CLASS}>
      <SelectPrimitive.ItemText>{label}</SelectPrimitive.ItemText>
      <span className="absolute right-2 flex items-center">
        <SelectPrimitive.ItemIndicator>
          <Check size={14} className="text-sky-400" />
        </SelectPrimitive.ItemIndicator>
      </span>
    </SelectPrimitive.Item>
  );
}

/** 深色台面版下拉：Radix Select，弹层 portal 到 body、贴本页 sky/白透明色板。 */
function FilterSelect({
  value,
  onChange,
  allLabel,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  allLabel: string;
  options: readonly string[];
}) {
  return (
    <SelectPrimitive.Root
      value={value || '__all__'}
      onValueChange={(v) => onChange(v === '__all__' ? '' : v)}
    >
      <SelectPrimitive.Trigger className="group flex h-9 min-w-[6.5rem] items-center justify-between gap-2 rounded-md border border-white/[0.08] bg-[var(--surface-raised)] px-2.5 text-sm text-[var(--text-primary)] outline-none transition-colors hover:border-white/[0.16] focus:border-sky-400/50 data-[state=open]:border-sky-400/50">
        <SelectPrimitive.Value />
        <SelectPrimitive.Icon asChild>
          <ChevronDown
            size={14}
            className="text-[var(--text-secondary)] transition-transform duration-200 group-data-[state=open]:rotate-180"
          />
        </SelectPrimitive.Icon>
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Content
          position="popper"
          sideOffset={6}
          className="z-50 min-w-[var(--radix-select-trigger-width)] overflow-hidden rounded-lg border border-white/[0.08] bg-[var(--surface-raised)] p-1 shadow-xl shadow-black/40 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95"
        >
          <SelectPrimitive.Viewport>
            <SelectOption value="__all__" label={allLabel} />
            {options.map((o) => (
              <SelectOption key={o} value={o} label={o} />
            ))}
          </SelectPrimitive.Viewport>
        </SelectPrimitive.Content>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}

function TimelinesPageInner() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();

  const params: TimelineListParams = {
    current: Math.max(1, Number(searchParams.get('page')) || 1),
    size: PAGE_SIZE,
    season: searchParams.get('season') ?? undefined,
    industry: searchParams.get('industry') ?? undefined,
    region: searchParams.get('region') ?? undefined,
    role: searchParams.get('role') ?? undefined,
  };

  const setParam = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(searchParams.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      if (key !== 'page') next.delete('page');
      router.replace(`/knowledge/timelines?${next.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const { data, error, isLoading, mutate } = useSWR(
    ['knowledge-timelines', searchParams.toString()],
    () => fetchTimelines(params),
    { revalidateOnFocus: false },
  );

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.size)) : 1;

  return (
    <div className="flex flex-col gap-7">
      <div className="flex flex-wrap items-center gap-2">
        <FilterSelect
          value={params.season ?? ''}
          onChange={(v) => setParam('season', v)}
          allLabel={t('knowledge.timelines.filters.season')}
          options={seasonOptions()}
        />
        <FilterSelect
          value={params.industry ?? ''}
          onChange={(v) => setParam('industry', v)}
          allLabel={t('knowledge.timelines.filters.industry')}
          options={INDUSTRY_OPTIONS}
        />
        <input
          defaultValue={params.region ?? ''}
          placeholder={t('knowledge.timelines.filters.region')}
          onKeyDown={(e) => {
            if (e.key === 'Enter') setParam('region', e.currentTarget.value.trim());
          }}
          onBlur={(e) => setParam('region', e.currentTarget.value.trim())}
          className="h-9 w-32 rounded-md border border-white/[0.08] bg-[var(--surface-raised)] px-2.5 text-sm outline-none transition-colors placeholder:text-[var(--text-secondary)]/60 hover:border-white/[0.16] focus:border-sky-400/50"
        />
        <input
          defaultValue={params.role ?? ''}
          placeholder={t('knowledge.timelines.filters.role')}
          onKeyDown={(e) => {
            if (e.key === 'Enter') setParam('role', e.currentTarget.value.trim());
          }}
          onBlur={(e) => setParam('role', e.currentTarget.value.trim())}
          className="h-9 w-32 rounded-md border border-white/[0.08] bg-[var(--surface-raised)] px-2.5 text-sm outline-none transition-colors placeholder:text-[var(--text-secondary)]/60 hover:border-white/[0.16] focus:border-sky-400/50"
        />
      </div>

      {isLoading ? (
        <TimelineSkeleton />
      ) : error ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-white/[0.08] py-16 text-sm text-[var(--text-secondary)]">
          <p>{t('knowledge.common.error')}</p>
          <Button variant="outline" size="sm" onClick={() => void mutate()}>
            <RefreshCw size={14} className="mr-1.5" />
            {t('knowledge.common.retry')}
          </Button>
        </div>
      ) : !data || data.items.length === 0 ? (
        <div className="flex flex-col items-center gap-1 rounded-lg border border-white/[0.08] py-16 text-sm text-[var(--text-secondary)]">
          <p className="text-base">{t('knowledge.timelines.empty.title')}</p>
          <p className="text-xs">{t('knowledge.timelines.empty.hint')}</p>
        </div>
      ) : (
        <>
          <Timeline items={data.items} />
          <div className="flex items-center justify-between text-sm text-[var(--text-secondary)]">
            <span>{t('knowledge.common.total', { count: data.total })}</span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={params.current === 1}
                onClick={() => setParam('page', String((params.current ?? 1) - 1))}
              >
                {t('knowledge.common.prev')}
              </Button>
              <span>
                {params.current} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={(params.current ?? 1) >= totalPages}
                onClick={() => setParam('page', String((params.current ?? 1) + 1))}
              >
                {t('knowledge.common.next')}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function TimelinesPage() {
  return (
    <Suspense fallback={null}>
      <TimelinesPageInner />
    </Suspense>
  );
}
