'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, CornerUpLeft, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { SKILLS, SKILL_LIST } from '../skills/registry';
import type { SkillId } from '../types';

/** A snippet lifted from the canvas ("自定义 / 问 AI"), shown as a quoted chip above the input. */
export type QuotedContext = { label: string; text: string };

type ComposerProps = {
  /** Run a skill picked via `/`, carrying whatever the user typed after the chip. */
  onRunSkill: (id: SkillId, text: string) => void;
  onSend: (text: string) => void;
  /** When set, the input shows a quoted chip and sending routes the instruction here. */
  quotedContext?: QuotedContext | null;
  onSendWithContext?: (text: string) => void;
  onClearQuoted?: () => void;
  disabled?: boolean;
};

export default function Composer({
  onRunSkill,
  onSend,
  quotedContext,
  onSendWithContext,
  onClearQuoted,
  disabled,
}: ComposerProps) {
  const { t } = useTranslation();
  const [value, setValue] = useState('');
  const [highlight, setHighlight] = useState(0);
  // The skill picked from `/`: shown as a highlighted chip in the input. Selecting
  // does NOT launch — the user keeps typing context, then Enter runs it (Claude-style).
  const [activeSkill, setActiveSkill] = useState<SkillId | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // `/` only opens the menu when no skill chip is active (one skill at a time).
  const slashActive = !activeSkill && value.startsWith('/');
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
  const activeMeta = activeSkill ? SKILLS[activeSkill] : null;
  const ActiveIcon = activeMeta?.icon;
  const canSend = !!activeSkill || !!value.trim() || !!quotedContext;

  useEffect(() => {
    setHighlight(0);
  }, [value]);

  // Lift focus into the input the moment a canvas snippet is quoted in.
  useEffect(() => {
    if (quotedContext) requestAnimationFrame(() => inputRef.current?.focus());
  }, [quotedContext]);

  // Pick a skill → drop it into the input as a chip and keep the cursor for more typing.
  const chooseSkill = (id: SkillId) => {
    setActiveSkill(id);
    setValue('');
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const submit = () => {
    if (slashActive) {
      const chosen = matches[highlight];
      if (chosen) chooseSkill(chosen.id);
      return;
    }
    if (activeSkill) {
      onRunSkill(activeSkill, value.trim());
      setActiveSkill(null);
      setValue('');
      return;
    }
    if (quotedContext) {
      onSendWithContext?.(value.trim());
      setValue('');
      return;
    }
    const text = value.trim();
    if (!text) return;
    onSend(text);
    setValue('');
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    // While the IME is composing (e.g. typing Chinese pinyin), Enter confirms a
    // candidate — it must NOT submit or drive the slash menu. Without this, hitting
    // Enter to pick a 候选词 fires off the message mid-typing.
    if (e.nativeEvent.isComposing || e.keyCode === 229) {
      return;
    }
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
    // Backspace on an empty input pops the skill chip / quote (like deleting a token).
    if (e.key === 'Backspace' && value === '') {
      if (activeSkill) {
        e.preventDefault();
        setActiveSkill(null);
        return;
      }
      if (quotedContext) {
        e.preventDefault();
        onClearQuoted?.();
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
              initial={{ opacity: 0, y: 8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
              className="absolute left-0 right-0 bottom-[calc(100%+10px)] rounded-2xl bg-neutral-900/95 backdrop-blur-xl border border-white/[0.06] p-2 z-20 shadow-2xl shadow-black/60 origin-bottom"
            >
              <div className="px-2.5 pb-2 pt-1 text-[10px] font-medium uppercase tracking-[0.14em] text-neutral-600">
                {t('aiLab.composer.skills')}
              </div>
              {matches.map((s, i) => {
                const Icon = s.icon;
                const active = i === highlight;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onMouseEnter={() => setHighlight(i)}
                    onClick={() => chooseSkill(s.id)}
                    className={cn(
                      // Codex-style: compact single-line rows, quiet neutral highlight (no color block).
                      'group w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer text-left',
                      active ? 'bg-white/[0.07]' : 'hover:bg-white/[0.035]'
                    )}
                  >
                    <span className="flex items-center justify-center w-5 h-5 shrink-0">
                      <Icon
                        size={16}
                        className={cn(
                          'transition-colors',
                          active ? 'text-neutral-200' : 'text-neutral-500 group-hover:text-neutral-400'
                        )}
                      />
                    </span>
                    <span className="min-w-0 flex-1 flex items-baseline gap-2">
                      <span
                        className={cn(
                          'shrink-0 text-[13px] font-medium transition-colors',
                          active ? 'text-neutral-50' : 'text-neutral-200'
                        )}
                      >
                        {s.name}
                      </span>
                      <span className="min-w-0 truncate text-[12px] text-neutral-500">{s.tagline}</span>
                    </span>
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {quotedContext && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
              className="mb-2 flex items-start gap-2 rounded-xl border border-neutral-800 bg-neutral-900/60 px-3 py-2"
            >
              <CornerUpLeft size={13} className="mt-0.5 shrink-0 text-sky-400" />
              <div className="min-w-0 flex-1">
                <div className="text-[10px] font-medium uppercase tracking-wide text-neutral-500">
                  {quotedContext.label}
                </div>
                <div className="truncate text-[12px] text-neutral-300">{quotedContext.text}</div>
              </div>
              <button
                type="button"
                onClick={onClearQuoted}
                aria-label="移除引用"
                className="shrink-0 text-neutral-500 hover:text-neutral-200 transition-colors cursor-pointer"
              >
                <X size={13} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-2 rounded-2xl bg-neutral-800/60 px-3.5 py-2.5 transition-colors focus-within:bg-neutral-800">
          {activeMeta && (
            <motion.span
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
              className="inline-flex items-center gap-1.5 rounded-lg bg-neutral-700/60 pl-2 pr-1 py-1 shrink-0"
            >
              {ActiveIcon && <ActiveIcon size={13} className={activeMeta.accent} />}
              <span className={cn('text-[12px] font-medium', activeMeta.accent)}>{activeMeta.name}</span>
              <button
                type="button"
                onClick={() => setActiveSkill(null)}
                aria-label="移除技能"
                className="ml-0.5 text-neutral-500 hover:text-neutral-200 transition-colors cursor-pointer"
              >
                <X size={12} />
              </button>
            </motion.span>
          )}
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={onKeyDown}
            disabled={disabled}
            placeholder={
              quotedContext
                ? t('aiLab.composer.placeholderQuoted')
                : activeMeta
                  ? t('aiLab.composer.placeholderSkill', { skill: activeMeta.name })
                  : t('aiLab.composer.placeholderDefault')
            }
            className="flex-1 bg-transparent text-sm text-neutral-100 placeholder:text-neutral-600 focus:outline-none disabled:opacity-50"
          />
          <button
            type="button"
            aria-label="发送"
            onClick={submit}
            disabled={disabled || !canSend}
            className="w-8 h-8 rounded-full bg-sky-500 hover:bg-sky-600 disabled:opacity-40 disabled:hover:bg-sky-500 text-[#fff] flex items-center justify-center transition-colors cursor-pointer shrink-0"
          >
            <ArrowUp size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
