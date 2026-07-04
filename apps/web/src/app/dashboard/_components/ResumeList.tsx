"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import Link from 'next/link';
import {
  Sparkles,
  Upload,
  ArrowRight,
  ArrowUpRight,
  MoreVertical,
  Pencil,
  Copy,
  Trash2,
  FlaskConical,
  Cloud,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DropMenu } from '@/components/ui/drop-menu';
import { Resume } from '@/types/frontend/resume';
import { useSettingStore } from '@/store/useSettingStore';
import { useAccountUiStore } from '@/store/useAccountUiStore';
import { isCloudMode } from '@/lib/config/app';
import { formatTime, cn } from '@/lib/utils';
import { getMagicTemplateList } from '@magic-resume/resume-templates/config/magic-templates';
import { MagicTemplateDSL } from '@magic-resume/resume-templates/types/magic-dsl';
import ConfirmDialog from '@/components/shared/ConfirmDialog';
import ResumeMiniPreview from './ResumeMiniPreview';

type ResumeListProps = {
  resumes: Resume[];
  onAdd: () => void;
  onImport: () => void;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onRename: (resume: Resume) => void;
  isLoading?: boolean;
};

const EASE_OUT = [0.22, 1, 0.36, 1] as const;

const gridVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.03, delayChildren: 0.02 } },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.28, ease: EASE_OUT } },
};

/* ── Storage state (replaces the old cloud-sync banner with a quiet, always-on pill) ── */
function StoragePill() {
  const { t } = useTranslation();
  const cloudSync = useSettingStore((s) => s.cloudSync);
  const openSettings = useAccountUiStore((s) => s.openSettings);

  if (!isCloudMode) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.02] px-2.5 py-1 text-[11px] text-neutral-500">
        <span className="h-1.5 w-1.5 rounded-full bg-neutral-600" />
        {t('dashboard.library.storageLocal')}
      </span>
    );
  }

  // Cloud-sync-first: an active sync is the expected default, so stay quiet —
  // no badge when synced. A badge only appears when data is local-only (below).
  if (cloudSync) {
    return null;
  }

  return (
    <button
      type="button"
      onClick={() => openSettings('cloudSync')}
      className="group inline-flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.02] px-2.5 py-1 text-[11px] text-neutral-400 transition-colors hover:border-sky-400/25 hover:text-sky-200"
    >
      <Cloud size={12} className="text-neutral-500 transition-colors group-hover:text-sky-300" />
      <span>{t('dashboard.library.storageLocal')}</span>
      <span className="text-neutral-700 group-hover:text-sky-300/50">·</span>
      <span className="text-sky-300/80">{t('dashboard.library.enableSync')}</span>
    </button>
  );
}

/* ── Decorative specimen stack — the create panel's memory-point ── */
function SpecimenStack() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute right-2 top-1/2 hidden -translate-y-1/2 transition-transform duration-300 ease-out group-hover:-translate-x-2 sm:block"
    >
      <div className="relative h-32 w-44">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="absolute right-0 top-1/2 h-28 w-20 rounded-md border border-white/10 bg-white/[0.04] shadow-lg shadow-black/40"
            style={{
              transform: `translateY(-50%) translateX(${i * -20}px) rotate(${(i - 1) * -7}deg)`,
              opacity: 0.3 + i * 0.22,
            }}
          >
            <div className="space-y-1.5 p-2.5">
              <div className="h-1 w-8 rounded-full bg-sky-400/50" />
              <div className="h-1 w-full rounded-full bg-white/15" />
              <div className="h-1 w-4/5 rounded-full bg-white/12" />
              <div className="h-1 w-full rounded-full bg-white/10" />
              <div className="h-1 w-3/5 rounded-full bg-white/10" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Entry zone — asymmetric primary (create) + secondary (import) ── */
function CreatePanel({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation();
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="group relative flex h-40 items-center overflow-hidden rounded-2xl border border-sky-400/15 bg-sky-400/[0.06] px-6 text-left transition-colors duration-200 hover:border-sky-400/30 hover:bg-sky-400/[0.09] focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/40"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-sky-400/50 to-transparent" />

      <div className="relative z-10 flex flex-col gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-400/15 text-sky-300">
          <Sparkles size={18} />
        </span>
        <div>
          <div className="text-lg font-semibold tracking-tight text-neutral-50">
            {t('dashboard.create.title')}
          </div>
          <div className="mt-0.5 text-[13px] text-neutral-400">
            {t('dashboard.create.description')}
          </div>
        </div>
        <span className="inline-flex items-center gap-1 text-[13px] font-medium text-sky-300">
          {t('dashboard.create.cta')}
          <ArrowRight size={14} className="transition-transform duration-200 group-hover:translate-x-1" />
        </span>
      </div>

      <SpecimenStack />
    </motion.button>
  );
}

function ImportPanel({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation();
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className="group flex h-40 flex-col justify-center gap-2.5 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-6 text-left transition-colors duration-200 hover:border-white/15 hover:bg-white/[0.035] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
    >
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/[0.05] text-neutral-300 transition-colors group-hover:text-neutral-100">
        <Upload size={18} />
      </span>
      <div>
        <div className="text-base font-semibold tracking-tight text-neutral-100">
          {t('dashboard.import.title')}
        </div>
        <div className="mt-0.5 text-[13px] text-neutral-500">
          {t('dashboard.import.description')}
        </div>
      </div>
    </motion.button>
  );
}

/* ── Resume specimen card ── */
const ResumeCard = React.memo(
  ({
    resume,
    onDelete,
    onDuplicate,
    onRename,
    templates,
  }: {
    resume: Resume;
    onDelete: (id: string) => void;
    onDuplicate: (id: string) => void;
    onRename: (resume: Resume) => void;
    templates: MagicTemplateDSL[];
  }) => {
    const { t } = useTranslation();
    const template = templates.find((tpl) => tpl.id === resume.template);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const headline = resume.info?.headline?.trim();

    const menuItems = [
      {
        label: t('dashboard.resumeCard.rename'),
        icon: <Pencil className="h-4 w-4" />,
        onClick: () => onRename(resume),
      },
      {
        label: t('dashboard.resumeCard.duplicate'),
        icon: <Copy className="h-4 w-4" />,
        onClick: () => onDuplicate(resume.id),
      },
      {
        label: t('dashboard.resumeCard.delete'),
        icon: <Trash2 className="h-4 w-4" />,
        onClick: () => onDelete(resume.id),
        variant: 'danger' as const,
        separator: true,
      },
    ];

    return (
      <motion.div
        variants={cardVariants}
        exit={{ opacity: 0, y: 8, transition: { duration: 0.15 } }}
        layout
      >
        <div
          className={cn(
            // content-visibility:auto — skip layout/paint of off-screen cards, so a
            // reflow during the sidebar animation only costs the visible ones. The
            // intrinsic-size reserves each card's box so scroll height stays stable.
            'group relative overflow-hidden rounded-2xl border bg-white/[0.02] transition-colors duration-200 [content-visibility:auto] [contain-intrinsic-size:auto_15rem]',
            isMenuOpen ? 'border-sky-400/25' : 'border-white/[0.06] hover:border-sky-400/20',
          )}
        >
          <Link href={`/dashboard/edit/${resume.id}`} className="block">
            {/* specimen mat — the paper sits on a dark bench */}
            <div className="flex h-44 items-center justify-center overflow-hidden bg-black/40 p-3">
              {template ? (
                <div className="aspect-[1/1.33] h-full transition-transform duration-300 ease-out group-hover:scale-[1.02]">
                  <ResumeMiniPreview
                    template={template}
                    resumeName={resume.info?.fullName || resume.name}
                  />
                </div>
              ) : (
                <div className="flex h-full items-center justify-center text-neutral-700">
                  <FlaskConical size={28} />
                </div>
              )}
            </div>

            {/* info bar — the open cue is an arrow that slides in beside the title */}
            <div className="border-t border-white/[0.06] px-3.5 py-3">
              <div className="flex items-center gap-2">
                <span className="min-w-0 flex-1 truncate text-sm font-medium text-neutral-100 transition-colors group-hover:text-sky-300">
                  {resume.name}
                </span>
                <ArrowUpRight
                  size={15}
                  aria-hidden
                  className="shrink-0 -translate-x-1 text-sky-300 opacity-0 transition-[opacity,transform] duration-200 ease-out group-hover:translate-x-0 group-hover:opacity-100"
                />
              </div>
              <div className="mt-1 flex items-center gap-1.5 text-[11px] text-neutral-500">
                <span className="shrink-0">
                  {t('dashboard.resumeCard.lastUpdated', { time: formatTime(resume.updatedAt) })}
                </span>
                {headline && (
                  <>
                    <span className="text-neutral-700">·</span>
                    <span className="truncate text-neutral-400">{headline}</span>
                  </>
                )}
              </div>
            </div>
          </Link>

          {/* hover-revealed actions */}
          <div
            className={cn(
              'absolute right-2 top-2 transition-opacity duration-150',
              isMenuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
            )}
          >
            <DropMenu
              width="w-36"
              side="bottom"
              align="end"
              items={menuItems}
              onOpenChange={setIsMenuOpen}
              trigger={
                <button
                  type="button"
                  onClick={(e) => e.stopPropagation()}
                  aria-label={t('dashboard.resumeCard.more')}
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-lg border backdrop-blur-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/40',
                    isMenuOpen
                      ? 'border-white/10 bg-neutral-900/90 text-neutral-100'
                      : 'border-white/[0.06] bg-neutral-900/70 text-neutral-400 hover:text-neutral-100',
                  )}
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
              }
            />
          </div>
        </div>
      </motion.div>
    );
  },
);
ResumeCard.displayName = 'ResumeCard';

function ResumeCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02]">
      <div className="flex h-44 items-center justify-center bg-black/40 p-3">
        <div className="aspect-[1/1.33] h-full animate-pulse rounded bg-white/[0.04]" />
      </div>
      <div className="border-t border-white/[0.06] px-3.5 py-3">
        <div className="h-4 w-3/4 animate-pulse rounded bg-white/[0.06]" />
        <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-white/[0.04]" />
      </div>
    </div>
  );
}

/* ── 全页骨架:挂载 / 首屏加载时替代空白黑屏,结构与真实布局同构
      (标题 + 创建/导入入口 + 简历栅格),不用 i18n 以避免水合闪烁 ── */
function DashboardSkeleton() {
  return (
    <div className="flex-1 overflow-y-auto bg-[#0A0A0A] [contain:layout_paint]">
      <div className="mx-auto w-full max-w-[1400px] px-6 py-10 md:px-12">
        {/* 标题 */}
        <header className="mb-8 flex items-end justify-between gap-4">
          <div className="h-7 w-32 animate-pulse rounded-lg bg-white/[0.06]" />
          <div className="h-6 w-24 animate-pulse rounded-full bg-white/[0.03]" />
        </header>

        {/* 入口区:主(创建)+ 次(导入) */}
        <section className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-[1.6fr_1fr]">
          <div className="h-40 rounded-2xl border border-sky-400/15 bg-sky-400/[0.05] px-6 py-6">
            <div className="h-9 w-9 animate-pulse rounded-xl bg-sky-400/15" />
            <div className="mt-4 h-5 w-32 animate-pulse rounded bg-white/[0.06]" />
            <div className="mt-2 h-3.5 w-40 animate-pulse rounded bg-white/[0.04]" />
          </div>
          <div className="h-40 rounded-2xl border border-white/[0.06] bg-white/[0.02] px-6 py-6">
            <div className="h-9 w-9 animate-pulse rounded-xl bg-white/[0.05]" />
            <div className="mt-4 h-5 w-28 animate-pulse rounded bg-white/[0.06]" />
            <div className="mt-2 h-3.5 w-32 animate-pulse rounded bg-white/[0.04]" />
          </div>
        </section>

        {/* 简历栅格 */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <ResumeCardSkeleton key={`skeleton-${i}`} />
          ))}
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  const { t } = useTranslation();
  return (
    <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.01] px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-400/10 text-sky-300">
        <FlaskConical size={22} />
      </div>
      <h3 className="mt-4 text-base font-semibold text-neutral-200">{t('dashboard.empty.title')}</h3>
      <p className="mt-1 max-w-sm text-[13px] leading-relaxed text-neutral-500">
        {t('dashboard.empty.description')}
      </p>
    </div>
  );
}

const ResumeList = React.memo(
  ({ resumes, onAdd, onImport, onDelete, onDuplicate, onRename, isLoading = false }: ResumeListProps) => {
    const { t } = useTranslation();
    const [isMounted, setIsMounted] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [templates, setTemplates] = useState<MagicTemplateDSL[]>([]);

    useEffect(() => {
      setIsMounted(true);
      getMagicTemplateList()
        .then(setTemplates)
        .catch((e) => console.error('Failed to load templates for dashboard', e));
    }, []);

    // Prevent SSR/CSR flicker for this client-only list. Render a full-page
    // skeleton (not a blank screen) until the client mounts and data is ready.
    if (!isMounted || isLoading) return <DashboardSkeleton />;

    return (
      // contain: layout paint — isolate this large subtree so the sidebar's width
      // animation (which reflows/re-centers this block every frame) can't invalidate
      // layout/paint outside it, keeping the collapse transition smooth.
      <div className="flex-1 overflow-y-auto bg-[#0A0A0A] [contain:layout_paint]">
        <div className="mx-auto w-full max-w-[1400px] px-6 py-10 md:px-12">
          {/* header */}
          <header className="mb-8 flex items-end justify-between gap-4">
            <div className="flex items-baseline gap-2.5">
              <h1 className="text-2xl font-semibold tracking-tight text-neutral-50">
                {t('dashboard.library.title')}
              </h1>
              {resumes.length > 0 && (
                <span className="text-sm text-neutral-500">
                  {t('dashboard.library.count', { count: resumes.length })}
                </span>
              )}
            </div>
            <StoragePill />
          </header>

          {/* entry zone */}
          <section className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-[1.6fr_1fr]">
            <CreatePanel onClick={onAdd} />
            <ImportPanel onClick={onImport} />
          </section>

          {/* library — column count keys off the viewport (media queries), NOT the
              container width. The sidebar collapse changes this block's width but not
              the viewport, so columns stay fixed and cards resize smoothly instead of
              teleporting between rows (auto-fill would re-flow rows mid-animation). */}
          <motion.div
            className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            variants={gridVariants}
            initial="hidden"
            animate="show"
          >
            {resumes.length === 0 ? (
              <EmptyState />
            ) : (
              <AnimatePresence>
                {resumes.map((resume) => (
                  <ResumeCard
                    key={resume.id}
                    resume={resume}
                    onDelete={(id) => setDeleteId(id)}
                    onDuplicate={onDuplicate}
                    onRename={onRename}
                    templates={templates}
                  />
                ))}
              </AnimatePresence>
            )}
          </motion.div>
        </div>

        <ConfirmDialog
          isOpen={!!deleteId}
          onClose={() => setDeleteId(null)}
          onConfirm={() => {
            if (deleteId) onDelete(deleteId);
          }}
          title={t('common.confirmDeleteResume')}
          description={
            useSettingStore.getState().cloudSync
              ? t('common.deleteDescriptionCloud')
              : t('common.deleteDescriptionLocal')
          }
        />
      </div>
    );
  },
);

ResumeList.displayName = 'ResumeList';

export default ResumeList;
