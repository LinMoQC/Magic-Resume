'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Clock, User, Mic } from 'lucide-react';

type InterviewOverlayProps = {
  open: boolean;
  onBack: () => void;
  onEnd: () => void;
};

export default function InterviewOverlay({ open, onBack, onEnd }: InterviewOverlayProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-30 bg-[#0A0A0A] flex flex-col"
        >
          <div className="flex items-center gap-3 px-5 py-3.5 border-b border-neutral-800">
            <button
              type="button"
              onClick={onBack}
              aria-label="返回"
              className="text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              <ChevronLeft size={20} />
            </button>
            <span className="text-sm font-medium text-white">模拟面试 · 前端专家</span>
            <span className="ml-auto inline-flex items-center gap-1.5 text-xs text-neutral-400">
              <Clock size={14} />
              02:14
            </span>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center gap-5">
            <div className="w-24 h-24 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <User size={46} />
            </div>
            <div className="flex items-end gap-1.5 h-9">
              {[0, 0.15, 0.3, 0.45, 0.6].map((delay, i) => (
                <motion.span
                  key={i}
                  className="w-1.5 rounded-full bg-rose-400"
                  animate={{ scaleY: [0.35, 1, 0.35] }}
                  transition={{ duration: 1, repeat: Infinity, delay }}
                  style={{ height: 36, transformOrigin: 'center' }}
                />
              ))}
            </div>
            <p className="text-sm text-neutral-400 max-w-xs text-center">
              “能聊聊你在项目里最有挑战的一次性能优化吗？”
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 py-6">
            <button
              type="button"
              aria-label="麦克风"
              className="w-12 h-12 rounded-full border border-neutral-700 text-neutral-300 flex items-center justify-center hover:bg-neutral-800 transition-colors cursor-pointer"
            >
              <Mic size={20} />
            </button>
            <button
              type="button"
              onClick={onEnd}
              className="px-6 py-2.5 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-300 text-sm hover:bg-rose-500/25 transition-colors cursor-pointer"
            >
              结束面试
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
