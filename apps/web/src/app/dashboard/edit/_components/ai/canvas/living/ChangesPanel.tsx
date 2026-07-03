'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { X, Check, CornerDownRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export type ChangeRow = {
  path: string;
  label: string;
  rationale: string;
  isInsert?: boolean;
};

type ChangesPanelProps = {
  rows: ChangeRow[];
  onJump: (path: string) => void;
  onAcceptAll: () => void;
  onDiscardAll: () => void;
  onClose: () => void;
};

/** The "all changes" summary entry (design §8.4) — list + jump + bulk actions. */
export default function ChangesPanel({
  rows,
  onJump,
  onAcceptAll,
  onDiscardAll,
  onClose,
}: ChangesPanelProps) {
  const { t } = useTranslation();

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.16, ease: 'easeOut' }}
      className="absolute right-4 top-12 z-40 w-[300px] max-h-[60%] flex flex-col rounded-2xl bg-neutral-900 border border-neutral-800 shadow-[0_16px_50px_rgba(0,0,0,0.55)] overflow-hidden"
    >
      <div className="flex items-center gap-2 px-3.5 py-2.5 shrink-0">
        <span className="text-xs font-medium text-white">{t('aiLab.living.allChanges')}</span>
        <span className="text-[11px] text-neutral-500">{t('aiLab.living.changeCountShort', { count: rows.length })}</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="关闭"
          className="ml-auto text-neutral-500 hover:text-white transition-colors cursor-pointer"
        >
          <X size={15} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar px-1.5">
        {rows.map((r) => (
          <button
            key={r.path}
            type="button"
            onClick={() => onJump(r.path)}
            className="group w-full text-left rounded-xl px-2.5 py-2 hover:bg-neutral-800/70 transition-colors cursor-pointer flex gap-2"
          >
            <CornerDownRight size={13} className="text-neutral-600 group-hover:text-sky-400 mt-0.5 shrink-0 transition-colors" />
            <div className="min-w-0">
              <div className="text-xs text-neutral-200 truncate">
                {r.label}
                {r.isInsert && <span className="ml-1.5 text-[10px] text-emerald-400">{t('aiLab.living.inserted')}</span>}
              </div>
              <div className="text-[11px] text-neutral-500 truncate">{r.rationale}</div>
            </div>
          </button>
        ))}
        {rows.length === 0 && (
          <div className="px-3 py-6 text-center text-[11px] text-neutral-600">{t('aiLab.living.emptyChanges')}</div>
        )}
      </div>

      {rows.length > 0 && (
        <div className="flex items-center gap-2 px-2.5 py-2 shrink-0 border-t border-neutral-800/70">
          <button
            type="button"
            onClick={onDiscardAll}
            className="flex-1 text-xs px-3 py-1.5 rounded-lg text-neutral-400 hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            {t('aiLab.living.discardAll')}
          </button>
          <button
            type="button"
            onClick={onAcceptAll}
            className="flex-1 text-xs px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 transition-colors cursor-pointer inline-flex items-center justify-center gap-1.5"
          >
            <Check size={13} />
            {t('aiLab.living.acceptAll')}
          </button>
        </div>
      )}
    </motion.div>
  );
}
