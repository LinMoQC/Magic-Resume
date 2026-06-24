'use client';

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, ArrowDownUp } from 'lucide-react';

const WIDTH = 200;

type SectionActionPopoverProps = {
  title: string;
  anchorRect: DOMRect;
  onAdd: () => void;
  onReorder: () => void;
  onClose: () => void;
};

export default function SectionActionPopover({
  title,
  anchorRect,
  onAdd,
  onReorder,
  onClose,
}: SectionActionPopoverProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: anchorRect.bottom + 8, left: anchorRect.left });

  useLayoutEffect(() => {
    const margin = 12;
    let left = anchorRect.left;
    if (left + WIDTH > window.innerWidth - margin) left = window.innerWidth - margin - WIDTH;
    setPos({ top: anchorRect.bottom + 8, left: Math.max(margin, left) });
  }, [anchorRect]);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('mousedown', onDown);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onDown);
      window.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.14, ease: 'easeOut' }}
      style={{ position: 'fixed', top: pos.top, left: pos.left, width: WIDTH, zIndex: 120 }}
      className="rounded-2xl bg-neutral-900 border border-neutral-800 shadow-[0_12px_40px_rgba(0,0,0,0.5)] p-1.5"
    >
      <div className="px-2 pt-1 pb-1.5 text-[11px] text-neutral-500 truncate">{title}</div>
      <button
        type="button"
        onClick={onAdd}
        className="w-full flex items-center gap-2 text-xs text-neutral-200 hover:bg-neutral-800 rounded-lg px-2.5 py-2 transition-colors cursor-pointer"
      >
        <Plus size={14} className="text-sky-400" />
        补充这段
      </button>
      <button
        type="button"
        onClick={onReorder}
        className="w-full flex items-center gap-2 text-xs text-neutral-200 hover:bg-neutral-800 rounded-lg px-2.5 py-2 transition-colors cursor-pointer"
      >
        <ArrowDownUp size={14} className="text-violet-400" />
        调整顺序
      </button>
    </motion.div>
  );
}
