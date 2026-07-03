'use client';

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { EditableTarget } from '../../lib/editableCanvas';
import { actionsForTarget, type QuickActionId } from '../../lib/changeModel';
import { PolarisGlyph } from '../../PolarisMark';

const POPOVER_WIDTH = 288;

type ActionPopoverProps = {
  target: EditableTarget;
  anchorRect: DOMRect;
  onRun: (action: QuickActionId | 'free', freeText?: string) => void;
  onClose: () => void;
};

export default function ActionPopover({ target, anchorRect, onRun, onClose }: ActionPopoverProps) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number }>({
    top: anchorRect.bottom + 8,
    left: anchorRect.left,
  });

  // Clamp into the viewport once measured.
  useLayoutEffect(() => {
    const margin = 12;
    const el = ref.current;
    const height = el?.offsetHeight ?? 180;
    let top = anchorRect.bottom + 8;
    let left = anchorRect.left;
    if (left + POPOVER_WIDTH > window.innerWidth - margin) {
      left = window.innerWidth - margin - POPOVER_WIDTH;
    }
    left = Math.max(margin, left);
    if (top + height > window.innerHeight - margin) {
      top = Math.max(margin, anchorRect.top - height - 8);
    }
    setPos({ top, left });
  }, [anchorRect]);

  // Dismiss on outside click / Escape.
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const actions = actionsForTarget(target);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.14, ease: 'easeOut' }}
      style={{ position: 'fixed', top: pos.top, left: pos.left, width: POPOVER_WIDTH, zIndex: 120 }}
      className="rounded-2xl bg-neutral-900 border border-neutral-800 shadow-[0_12px_40px_rgba(0,0,0,0.5)] p-2.5"
    >
      <div className="px-1.5 pb-2 text-[11px] text-neutral-500 truncate">{target.label}</div>
      <div className="flex flex-wrap gap-1.5">
        {actions.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => onRun(a.id)}
            className="text-xs text-neutral-200 bg-neutral-800 hover:bg-neutral-700 rounded-lg px-2.5 py-1.5 transition-colors cursor-pointer active:scale-95"
          >
            {a.label}
          </button>
        ))}
      </div>
      {/* 询问 Polaris lifts this element into the chat composer for a freeform instruction (Track B). */}
      <button
        type="button"
        onClick={() => onRun('free')}
        className="mt-2.5 w-full inline-flex items-center gap-1.5 rounded-xl bg-neutral-800/70 border border-neutral-800 hover:border-sky-500/40 hover:bg-neutral-800 px-3 py-2 text-xs text-neutral-300 hover:text-neutral-100 transition-colors cursor-pointer"
      >
        <PolarisGlyph size={12} className="text-sky-400 shrink-0" />
        {t('aiLab.living.askPolarisDetail')}
      </button>
    </motion.div>
  );
}
