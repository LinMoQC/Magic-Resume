'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Slash, ArrowUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SKILL_LIST } from './registry';
import type { SkillId } from './types';

type ComposerProps = {
  onPickSkill: (id: SkillId) => void;
  onSend: (text: string) => void;
  disabled?: boolean;
};

export default function Composer({ onPickSkill, onSend, disabled }: ComposerProps) {
  const [value, setValue] = useState('');
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const slashActive = value.startsWith('/');
  const query = slashActive ? value.slice(1).trim().toLowerCase() : '';
  const matches = slashActive
    ? SKILL_LIST.filter(
        (s) =>
          s.name.toLowerCase().includes(query) ||
          s.tagline.toLowerCase().includes(query) ||
          s.id.includes(query)
      )
    : [];
  const showSlash = slashActive && matches.length > 0;

  useEffect(() => {
    setHighlight(0);
  }, [value]);

  const pickSkill = (id: SkillId) => {
    setValue('');
    onPickSkill(id);
  };

  const submit = () => {
    if (slashActive) {
      const chosen = matches[highlight];
      if (chosen) pickSkill(chosen.id);
      return;
    }
    const text = value.trim();
    if (!text) return;
    onSend(text);
    setValue('');
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (showSlash) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlight((h) => (h + 1) % matches.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlight((h) => (h - 1 + matches.length) % matches.length);
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        setValue('');
        return;
      }
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="px-4 pb-4 pt-2 shrink-0">
      <div className="relative max-w-3xl mx-auto">
        <AnimatePresence>
          {showSlash && (
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              transition={{ duration: 0.14 }}
              className="absolute left-0 right-0 bottom-[calc(100%+8px)] rounded-2xl bg-neutral-800 p-1.5 z-20 shadow-2xl shadow-black/50 origin-bottom"
            >
              {matches.map((s, i) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onMouseEnter={() => setHighlight(i)}
                    onClick={() => pickSkill(s.id)}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg transition-colors cursor-pointer text-left',
                      i === highlight ? 'bg-neutral-700/70' : 'hover:bg-neutral-700/40'
                    )}
                  >
                    <Icon size={15} className={s.accent} />
                    <span className="text-[13px] text-neutral-100">{s.name}</span>
                    <span className="ml-auto text-[11px] text-neutral-500">{s.tagline}</span>
                  </button>
                );
              })}
              <div className="flex items-center gap-3 px-2.5 pt-2 pb-1 text-[10px] text-neutral-600">
                <span>↑↓ 切换</span>
                <span>↵ 选择</span>
                <span>esc 退出</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div
          className={cn(
            'flex items-center gap-2.5 rounded-2xl bg-neutral-800/60 px-3.5 py-2.5 transition-colors focus-within:bg-neutral-800',
            slashActive && 'ring-1 ring-sky-500/40'
          )}
        >
          <button
            type="button"
            aria-label="技能菜单"
            onClick={() => {
              setValue('/');
              inputRef.current?.focus();
            }}
            className={cn(
              'transition-colors cursor-pointer shrink-0',
              slashActive ? 'text-sky-400' : 'text-neutral-500 hover:text-sky-400'
            )}
          >
            <Slash size={17} />
          </button>
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={disabled}
            placeholder="描述需求，或输入 / 调用技能…"
            className="flex-1 bg-transparent text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none disabled:opacity-50"
          />
          <button
            type="button"
            aria-label="发送"
            onClick={submit}
            disabled={disabled || !value.trim()}
            className="w-8 h-8 rounded-full bg-sky-500 hover:bg-sky-600 disabled:opacity-40 disabled:hover:bg-sky-500 text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <ArrowUp size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
