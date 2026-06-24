'use client';

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUp } from 'lucide-react';
import type { EditableTarget } from '@magic-resume/resume-templates/renderer/EditableCanvas';
import { actionsForTarget, type QuickActionId } from '../../lib/changeModel';

const POPOVER_WIDTH = 288;

type ActionPopoverProps = {
  target: EditableTarget;
  anchorRect: DOMRect;
  onRun: (action: QuickActionId | 'free', freeText?: string) => void;
  onClose: () => void;
};

export default function ActionPopover({ target, anchorRect, onRun, onClose }: ActionPopoverProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [free, setFree] = useState('');
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

  const submitFree = () => {
    const text = free.trim();
    if (!text) return;
    onRun('free', text);
  };

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
      <div className="mt-2.5 flex items-center gap-1.5 rounded-xl bg-neutral-800/70 border border-neutral-800 focus-within:border-sky-500/40 transition-colors pl-3 pr-1.5 py-1">
        <input
          ref={inputRef}
          value={free}
          onChange={(e) => setFree(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              submitFree();
            }
          }}
          placeholder="告诉 AI 怎么改这一条…"
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
    </motion.div>
  );
}
