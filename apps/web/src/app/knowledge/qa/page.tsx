'use client';

import { Suspense, useCallback, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import { motion } from 'framer-motion';
import { ChevronDown, ExternalLink, RefreshCw, Search } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  fetchQaLibrary,
  type PublicQa,
  type QaListParams,
} from '@/lib/api/knowledge';

const PAGE_SIZE = 20;

const ROLE_OPTIONS = ['前端', '后端', '算法', '产品', '测试', '客户端', '运营'] as const;
const DIFFICULTY_OPTIONS = ['easy', 'medium', 'hard'] as const;

function DifficultyBadge({ level }: { level: PublicQa['difficulty'] }) {
  const { t } = useTranslation();
  const cls =
    level === 'hard'
      ? 'bg-sky-400/15 text-sky-300'
      : level === 'medium'
        ? 'bg-white/[0.08] text-[var(--text-primary)]/80'
        : 'bg-white/[0.04] text-[var(--text-secondary)]';
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs ${cls}`}>
      {t(`knowledge.qa.difficulty.${level}`)}
    </span>
  );
}

function QaCard({
  item,
  onTagClick,
}: {
  item: PublicQa;
  onTagClick: (tag: string) => void;
}) {
  const { t } = useTranslation();
  const [expanded, setExpanded] = useState(false);
  return (
    <motion.article
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-lg border border-white/[0.08] bg-[var(--surface-raised)] p-4"
    >
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="flex w-full items-start justify-between gap-3 text-left"
      >
        <h3 className="text-sm font-medium leading-relaxed">{item.question}</h3>
        <ChevronDown
          size={16}
          className={`mt-0.5 shrink-0 text-[var(--text-secondary)] transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </button>
      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
        <span className="rounded-full border border-white/[0.08] px-2 py-0.5 text-[var(--text-secondary)]">
          {item.role}
        </span>
        {item.company ? (
          <span className="rounded-full border border-white/[0.08] px-2 py-0.5 text-[var(--text-secondary)]">
            {item.company}
          </span>
        ) : null}
        <DifficultyBadge level={item.difficulty} />
        {item.tags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => onTagClick(tag)}
            className="rounded-full bg-sky-400/[0.08] px-2 py-0.5 text-sky-300/90 transition-colors hover:bg-sky-400/[0.16]"
          >
            {tag}
          </button>
        ))}
      </div>
      {expanded ? (
        <div className="mt-3 border-t border-white/[0.08] pt-3">
          {item.answer ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-secondary)]">
              {item.answer}
            </p>
          ) : (
            <p className="text-sm italic text-[var(--text-secondary)]/70">
              {t('knowledge.qa.noAnswer')}
            </p>
          )}
          <div className="mt-3 flex justify-end text-xs text-[var(--text-secondary)]">
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
        </div>
      ) : null}
    </motion.article>
  );
}

function QaPageInner() {
  const { t } = useTranslation();
  const router = useRouter();
  const searchParams = useSearchParams();

  const params: QaListParams = {
    current: Math.max(1, Number(searchParams.get('page')) || 1),
    size: PAGE_SIZE,
    q: searchParams.get('q') ?? undefined,
    role: searchParams.get('role') ?? undefined,
    company: searchParams.get('company') ?? undefined,
    tags: searchParams.get('tags') ?? undefined,
    difficulty: searchParams.get('difficulty') ?? undefined,
  };

  const setParam = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(searchParams.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      if (key !== 'page') next.delete('page');
      router.replace(`/knowledge/qa?${next.toString()}`, { scroll: false });
    },
    [router, searchParams],
  );

  const { data, error, isLoading, mutate } = useSWR(
    ['knowledge-qa', searchParams.toString()],
    () => fetchQaLibrary(params),
    { revalidateOnFocus: false },
  );

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.size)) : 1;

  return (
    <div className="flex flex-col gap-5">
      <form
        className="relative"
        onSubmit={(e) => {
          e.preventDefault();
          const input = e.currentTarget.elements.namedItem('q') as HTMLInputElement;
          setParam('q', input.value.trim());
        }}
      >
        <Search
          size={15}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]"
        />
        <input
          name="q"
          defaultValue={params.q ?? ''}
          placeholder={t('knowledge.qa.searchPlaceholder')}
          className="h-10 w-full rounded-md border border-white/[0.08] bg-[var(--surface-raised)] pl-9 pr-3 text-sm outline-none placeholder:text-[var(--text-secondary)]/60 focus:border-sky-400/50"
        />
      </form>

      <div className="flex flex-wrap items-center gap-2">
        <select
          value={params.role ?? ''}
          onChange={(e) => setParam('role', e.target.value)}
          className="h-9 rounded-md border border-white/[0.08] bg-[var(--surface-raised)] px-2.5 text-sm outline-none focus:border-sky-400/50"
        >
          <option value="">{t('knowledge.qa.filters.role')}</option>
          {ROLE_OPTIONS.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
        <select
          value={params.difficulty ?? ''}
          onChange={(e) => setParam('difficulty', e.target.value)}
          className="h-9 rounded-md border border-white/[0.08] bg-[var(--surface-raised)] px-2.5 text-sm outline-none focus:border-sky-400/50"
        >
          <option value="">{t('knowledge.qa.filters.difficulty')}</option>
          {DIFFICULTY_OPTIONS.map((o) => (
            <option key={o} value={o}>
              {t(`knowledge.qa.difficulty.${o}`)}
            </option>
          ))}
        </select>
        <input
          defaultValue={params.company ?? ''}
          placeholder={t('knowledge.qa.filters.company')}
          onKeyDown={(e) => {
            if (e.key === 'Enter') setParam('company', e.currentTarget.value.trim());
          }}
          onBlur={(e) => setParam('company', e.currentTarget.value.trim())}
          className="h-9 w-36 rounded-md border border-white/[0.08] bg-[var(--surface-raised)] px-2.5 text-sm outline-none placeholder:text-[var(--text-secondary)]/60 focus:border-sky-400/50"
        />
        {params.tags ? (
          <button
            type="button"
            onClick={() => setParam('tags', '')}
            className="flex items-center gap-1 rounded-full bg-sky-400/15 px-2.5 py-1 text-xs text-sky-300 transition-colors hover:bg-sky-400/25"
          >
            #{params.tags} ✕
          </button>
        ) : null}
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
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
          <p className="text-base">{t('knowledge.qa.empty.title')}</p>
          <p className="text-xs">{t('knowledge.qa.empty.hint')}</p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {data.items.map((item) => (
              <QaCard key={item.id} item={item} onTagClick={(tag) => setParam('tags', tag)} />
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

export default function QaLibraryPage() {
  return (
    <Suspense fallback={null}>
      <QaPageInner />
    </Suspense>
  );
}
