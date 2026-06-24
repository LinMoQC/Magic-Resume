'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { ChevronUp, ChevronDown, Check, X } from 'lucide-react';

type ReviewBarProps = {
  count: number;
  onPrev: () => void;
  onNext: () => void;
  onAcceptAll: () => void;
  onDiscardAll: () => void;
};

export default function ReviewBar({ count, onPrev, onNext, onAcceptAll, onDiscardAll }: ReviewBarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ type: 'spring', stiffness: 360, damping: 30 }}
      className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 rounded-2xl bg-neutral-900/95 backdrop-blur border border-neutral-800 shadow-[0_12px_40px_rgba(0,0,0,0.5)] px-2.5 py-2"
    >
      <span className="inline-flex items-center gap-1.5 text-xs text-neutral-300 pl-1.5 pr-1 whitespace-nowrap">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        {count} 处改动待评审
      </span>

      <div className="w-px h-5 bg-neutral-800" />

      <div className="inline-flex items-center">
        <button
          type="button"
          onClick={onPrev}
          aria-label="上一处"
          title="上一处"
          className="w-7 h-7 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 flex items-center justify-center transition-colors cursor-pointer"
        >
          <ChevronUp size={15} />
        </button>
        <button
          type="button"
          onClick={onNext}
          aria-label="下一处"
          title="下一处"
          className="w-7 h-7 rounded-lg text-neutral-400 hover:text-white hover:bg-neutral-800 flex items-center justify-center transition-colors cursor-pointer"
        >
          <ChevronDown size={15} />
        </button>
      </div>

      <div className="w-px h-5 bg-neutral-800" />

      <button
        type="button"
        onClick={onDiscardAll}
        className="text-xs px-3 py-1.5 rounded-lg text-neutral-400 hover:bg-neutral-800 transition-colors cursor-pointer inline-flex items-center gap-1.5"
      >
        <X size={13} />
        全部放弃
      </button>
      <button
        type="button"
        onClick={onAcceptAll}
        className="text-xs px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-300 hover:bg-emerald-500/25 transition-colors cursor-pointer inline-flex items-center gap-1.5"
      >
        <Check size={13} />
        全部接受
      </button>
    </motion.div>
  );
}
