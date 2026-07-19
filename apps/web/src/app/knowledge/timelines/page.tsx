'use client';

import { Suspense, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { motion } from 'framer-motion';
import { ExternalLink, RefreshCw } from 'lucide-react';
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

function DeadlineBadge({ deadlineAt }: { deadlineAt?: string }) {
  const { t } = useTranslation();
  const days = daysUntil(deadlineAt);
  if (days === null)
    return (
      <span className="rounded-full border border-white/[0.08] px-2.5 py-0.5 text-xs text-[var(--text-secondary)]">
        {t('knowledge.timelines.deadline.none')}
      </span>
    );
  if (days < 0)
    return (
      <span className="rounded-full border border-white/[0.08] px-2.5 py-0.5 text-xs text-[var(--text-secondary)] line-through">
        {t('knowledge.timelines.deadline.past')}
      </span>
    );
  if (days === 0)
    return (
      <span className="rounded-full bg-sky-400/15 px-2.5 py-0.5 text-xs font-medium text-sky-300">
        {t('knowledge.timelines.deadline.today')}
      </span>
    );
  return (
    <span
      className={
        days <= 3
          ? 'rounded-full bg-sky-400/15 px-2.5 py-0.5 text-xs font-medium text-sky-300'
          : 'rounded-full border border-white/[0.08] px-2.5 py-0.5 text-xs text-[var(--text-secondary)]'
      }
    >
      {t('knowledge.timelines.deadline.days', { count: days })}
    </span>
  );
}

const dateFmt = (iso?: string) => (iso ? iso.slice(0, 10) : '');

function TimelineCard({ item }: { item: PublicTimeline }) {
  const { t } = useTranslation();
  return (
    <motion.article
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-white/[0.08] bg-[var(--surface-raised)] p-4"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-base font-semibold">{item.company}</span>
            <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-xs text-[var(--text-secondary)]">
              {item.stage}
            </span>
          </div>
          <p className="mt-1 truncate text-sm text-[var(--text-secondary)]">
            {item.title}
          </p>
        </div>
        <DeadlineBadge deadlineAt={item.deadlineAt} />
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-xs text-[var(--text-secondary)]">
        <span className="rounded-full border border-white/[0.08] px-2 py-0.5">{item.season}</span>
        {item.industry ? (
          <span className="rounded-full border border-white/[0.08] px-2 py-0.5">{item.industry}</span>
        ) : null}
        {item.region ? (
          <span className="rounded-full border border-white/[0.08] px-2 py-0.5">{item.region}</span>
        ) : null}
        {item.roleTags.map((tag) => (
          <span key={tag} className="rounded-full bg-sky-400/[0.08] px-2 py-0.5 text-sky-300/90">
            {tag}
          </span>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-[var(--text-secondary)]">
        <span>
          {item.openAt ? `${dateFmt(item.openAt)} ` : ''}
          {item.openAt || item.deadlineAt ? '→' : ''}
          {item.deadlineAt ? ` ${dateFmt(item.deadlineAt)}` : ` ${t('knowledge.timelines.ongoing')}`}
        </span>
        {item.sourceUrl ? (
          <a
            href={item.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 transition-colors hover:text-sky-400"
          >
            <ExternalLink size={12} />
            {item.sourceName}
          </a>
        ) : (
          <span>{item.sourceName}</span>
        )}
      </div>
    </motion.article>
  );
}

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
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 rounded-md border border-white/[0.08] bg-[var(--surface-raised)] px-2.5 text-sm text-[var(--text-primary)] outline-none focus:border-sky-400/50"
    >
      <option value="">{allLabel}</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
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
    <div className="flex flex-col gap-5">
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
          className="h-9 w-32 rounded-md border border-white/[0.08] bg-[var(--surface-raised)] px-2.5 text-sm outline-none placeholder:text-[var(--text-secondary)]/60 focus:border-sky-400/50"
        />
        <input
          defaultValue={params.role ?? ''}
          placeholder={t('knowledge.timelines.filters.role')}
          onKeyDown={(e) => {
            if (e.key === 'Enter') setParam('role', e.currentTarget.value.trim());
          }}
          onBlur={(e) => setParam('role', e.currentTarget.value.trim())}
          className="h-9 w-32 rounded-md border border-white/[0.08] bg-[var(--surface-raised)] px-2.5 text-sm outline-none placeholder:text-[var(--text-secondary)]/60 focus:border-sky-400/50"
        />
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-lg" />
          ))}
        </div>
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
          <div className="flex flex-col gap-3">
            {data.items.map((item) => (
              <TimelineCard key={item.id} item={item} />
            ))}
          </div>
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
