'use client';

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUp, Pencil } from 'lucide-react';
import { SELECTION_ACTIONS, type SelectionActionId } from '../../lib/changeModel';

const BAR_MAX_WIDTH = 320;

type SelectionActionBarProps = {
  rect: DOMRect;
  onRun: (action: SelectionActionId | 'free', freeText?: string) => void;
  onClose: () => void;
};

export default function SelectionActionBar({ rect, onRun, onClose }: SelectionActionBarProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [custom, setCustom] = useState(false);
  const [free, setFree] = useState('');
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
  }, [rect, custom]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const submitFree = () => {
    const text = free.trim();
    if (!text) return;
    onRun('free', text);
  };

  return (
    <motion.div
      ref={ref}
      data-selection-bar
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.14, ease: 'easeOut' }}
      style={{ position: 'fixed', top: pos.top, left: pos.left, maxWidth: BAR_MAX_WIDTH, zIndex: 120 }}
      className="flex items-center gap-1 rounded-xl bg-neutral-900 border border-neutral-800 shadow-[0_10px_30px_rgba(0,0,0,0.5)] p-1"
      // keep the text selection alive when interacting with the bar
      onMouseDown={(e) => e.preventDefault()}
    >
      {custom ? (
        <div className="flex items-center gap-1.5 pl-2 pr-1 py-0.5 w-[280px]">
          <input
            autoFocus
            value={free}
            onChange={(e) => setFree(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                submitFree();
              }
            }}
            placeholder="告诉 AI 怎么改这一段…"
            className="flex-1 bg-transparent text-xs text-neutral-200 placeholder:text-neutral-600 outline-none py-1"
          />
          <button
            type="button"
            onClick={submitFree}
            disabled={!free.trim()}
            aria-label="发送指令"
            className="w-6 h-6 shrink-0 rounded-lg bg-sky-500/90 hover:bg-sky-400 disabled:bg-neutral-700 disabled:text-neutral-500 text-white flex items-center justify-center transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            <ArrowUp size={13} strokeWidth={2.5} />
          </button>
        </div>
      ) : (
        <>
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
          <button
            type="button"
            onClick={() => setCustom(true)}
            className="text-xs text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded-lg px-2 py-1.5 transition-colors cursor-pointer inline-flex items-center gap-1"
          >
            <Pencil size={11} />
            自定义
          </button>
        </>
      )}
    </motion.div>
  );
}
