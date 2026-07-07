'use client';

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { SELECTION_ACTIONS, type SelectionActionId } from '../../lib/changeModel';
import { PolarisGlyph } from '../../PolarisMark';

const BAR_MAX_WIDTH = 320;

type SelectionActionBarProps = {
  rect: DOMRect;
  onRun: (action: SelectionActionId | 'free', freeText?: string) => void;
  onClose: () => void;
};

export default function SelectionActionBar({ rect, onRun, onClose }: SelectionActionBarProps) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number }>({
    top: rect.top - 48,
    left: rect.left,
  });

  useLayoutEffect(() => {
    const margin = 12;
    const el = ref.current;
    const height = el?.offsetHeight ?? 44;
    const width = el?.offsetWidth ?? 240;
    let top = rect.top - height - 8;
    if (top < margin) top = rect.bottom + 8;
    let left = rect.left + rect.width / 2 - width / 2;
    left = Math.max(margin, Math.min(left, window.innerWidth - margin - width));
    setPos({ top, left });
  }, [rect]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <motion.div
      ref={ref}
      data-selection-bar
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.14, ease: 'easeOut' }}
      style={{ position: 'fixed', top: pos.top, left: pos.left, maxWidth: BAR_MAX_WIDTH, zIndex: 120 }}
      className="flex items-center gap-1 rounded-xl bg-neutral-900 border border-neutral-800 shadow-[0_8px_24px_rgba(0,0,0,0.14)] p-1"
    >
      {SELECTION_ACTIONS.map((a) => (
        <button
          key={a.id}
          type="button"
          onClick={() => onRun(a.id)}
          className="text-xs text-neutral-200 hover:bg-neutral-800 rounded-lg px-2.5 py-1.5 transition-colors cursor-pointer active:scale-95"
        >
          {a.label}
        </button>
      ))}
      <div className="w-px h-4 bg-neutral-800 mx-0.5" />
      {/* 询问 Polaris lifts the selection into the chat composer for a freeform instruction (Track B). */}
      <button
        type="button"
        onClick={() => onRun('free')}
        className="text-xs text-neutral-300 hover:text-neutral-100 hover:bg-neutral-800 rounded-lg px-2 py-1.5 transition-colors cursor-pointer inline-flex items-center gap-1"
      >
        <PolarisGlyph size={11} className="text-sky-400" />
        {t('aiLab.living.askPolaris')}
      </button>
    </motion.div>
  );
}
