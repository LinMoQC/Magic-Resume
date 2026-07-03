'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ChevronUp, ChevronDown, Check, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

type ReviewBarProps = {
  count: number;
  onPrev: () => void;
  onNext: () => void;
  onAcceptAll: () => void;
  onDiscardAll: () => void;
};

export default function ReviewBar({ count, onPrev, onNext, onAcceptAll, onDiscardAll }: ReviewBarProps) {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ type: 'spring', stiffness: 360, damping: 30 }}
      className="absolute bottom-4 left-1/2 z-30 flex max-w-[calc(100%-2rem)] -translate-x-1/2 flex-nowrap items-center gap-2 overflow-x-auto rounded-2xl border border-neutral-800 bg-neutral-900/95 px-2.5 py-2 shadow-[0_12px_40px_rgba(0,0,0,0.5)] backdrop-blur"
    >
      <span className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap pl-1.5 pr-1 text-xs text-neutral-300">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        {t('aiLab.living.pendingReviewCount', { count })}
      </span>

      <div className="h-5 w-px shrink-0 bg-neutral-800" />

      <div className="inline-flex shrink-0 items-center">
        <button
          type="button"
          onClick={onPrev}
          aria-label={t('aiLab.living.previous')}
          title={t('aiLab.living.previous')}
          className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
        >
          <ChevronUp size={15} />
        </button>
        <button
          type="button"
          onClick={onNext}
          aria-label={t('aiLab.living.next')}
          title={t('aiLab.living.next')}
          className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-lg text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white"
        >
          <ChevronDown size={15} />
        </button>
      </div>

      <div className="h-5 w-px shrink-0 bg-neutral-800" />

      <button
        type="button"
        onClick={onDiscardAll}
        className="inline-flex h-7 shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg px-3 text-xs text-neutral-400 transition-colors hover:bg-neutral-800"
      >
        <X size={13} />
        {t('aiLab.living.discardAll')}
      </button>
      <button
        type="button"
        onClick={onAcceptAll}
        className="inline-flex h-7 shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg bg-emerald-500/15 px-3 text-xs text-emerald-300 transition-colors hover:bg-emerald-500/25"
      >
        <Check size={13} />
        {t('aiLab.living.acceptAll')}
      </button>
    </motion.div>
  );
}
