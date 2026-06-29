'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { AiSkill } from '../types';

type SkillParamFormProps = {
  skill: AiSkill;
  onRun: (values: Record<string, string>) => void;
  onCancel: () => void;
};

function initialValues(skill: AiSkill): Record<string, string> {
  const v: Record<string, string> = {};
  skill.params.forEach((p) => {
    v[p.id] = p.defaultValue ?? (p.kind === 'select' ? p.options[0]?.value ?? '' : '');
  });
  return v;
}

const FIELD =
  'w-full bg-neutral-800 rounded-xl text-sm text-neutral-100 placeholder:text-neutral-500 border-0 focus:outline-none focus-visible:ring-1 focus-visible:ring-sky-500/50';

type SelectOption = { value: string; label: string };

function SelectField({
  value,
  options,
  onChange,
}: {
  value: string;
  options: SelectOption[];
  onChange: (val: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value) ?? options[0];

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          FIELD,
          'flex h-10 items-center justify-between px-3.5 cursor-pointer transition-colors hover:bg-neutral-700/70',
          open && 'ring-1 ring-sky-500/50',
        )}
      >
        <span className="truncate">{selected?.label}</span>
        <ChevronDown
          size={15}
          className={cn(
            'shrink-0 text-neutral-400 transition-transform duration-200',
            open && 'rotate-180',
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.ul
            role="listbox"
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.14, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: 'top center' }}
            className="absolute z-20 mt-1.5 w-full overflow-hidden rounded-xl bg-neutral-800 p-1 shadow-2xl shadow-black/50 ring-1 ring-white/5"
          >
            {options.map((o) => {
              const active = o.value === selected?.value;
              return (
                <li key={o.value} role="option" aria-selected={active}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(o.value);
                      setOpen(false);
                    }}
                    className={cn(
                      'flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors cursor-pointer',
                      active
                        ? 'bg-sky-500/15 text-sky-400'
                        : 'text-neutral-200 hover:bg-neutral-700/70',
                    )}
                  >
                    <span className="truncate">{o.label}</span>
                    {active && <Check size={15} className="shrink-0" />}
                  </button>
                </li>
              );
            })}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function SkillParamForm({ skill, onRun, onCancel }: SkillParamFormProps) {
  const [values, setValues] = useState<Record<string, string>>(() => initialValues(skill));
  const Icon = skill.icon;

  const set = (id: string, val: string) => setValues((prev) => ({ ...prev, [id]: val }));

  const textareas = skill.params.filter((p) => p.kind === 'textarea');
  const shorts = skill.params.filter((p) => p.kind === 'text');
  const selects = skill.params.filter((p) => p.kind === 'select');

  return (
    <div className="rounded-2xl bg-neutral-900 p-4 shadow-2xl shadow-black/50">
      <div className="flex items-center gap-2.5 mb-3.5">
        <div className="w-7 h-7 rounded-lg bg-neutral-800 flex items-center justify-center">
          <Icon size={15} className={skill.accent} />
        </div>
        <div className="leading-tight">
          <div className="text-[13px] font-medium text-white">{skill.name}</div>
          <div className="text-[11px] text-neutral-500 mt-0.5">填写参数后开始</div>
        </div>
        <button
          type="button"
          onClick={onCancel}
          aria-label="取消"
          className="ml-auto text-neutral-500 hover:text-white transition-colors cursor-pointer"
        >
          <X size={17} />
        </button>
      </div>

      <div className="space-y-3">
        {textareas.map((p) => (
          <div key={p.id}>
            <label className="block text-[11px] text-neutral-400 mb-1.5">{p.label}</label>
            <Textarea
              value={values[p.id] ?? ''}
              placeholder={'placeholder' in p ? p.placeholder : undefined}
              onChange={(e) => set(p.id, e.target.value)}
              className={cn(FIELD, 'resize-y min-h-[140px] px-3.5 py-2.5 leading-relaxed')}
            />
          </div>
        ))}

        {shorts.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {shorts.map((p) => (
              <div key={p.id}>
                <label className="block text-[11px] text-neutral-400 mb-1.5">{p.label}</label>
                <input
                  type="text"
                  value={values[p.id] ?? ''}
                  placeholder={'placeholder' in p ? p.placeholder : undefined}
                  onChange={(e) => set(p.id, e.target.value)}
                  className={cn(FIELD, 'h-10 px-3.5')}
                />
              </div>
            ))}
          </div>
        )}

        {selects.map((p) =>
          p.kind === 'select' ? (
            <div key={p.id}>
              <label className="block text-[11px] text-neutral-400 mb-1.5">{p.label}</label>
              <SelectField
                value={values[p.id] ?? ''}
                options={p.options}
                onChange={(val) => set(p.id, val)}
              />
            </div>
          ) : null,
        )}
      </div>

      <Button
        onClick={() => onRun(values)}
        className="w-full mt-3.5 h-10 rounded-xl bg-sky-500 hover:bg-sky-600 text-white text-sm font-medium"
      >
        <Icon size={15} className="mr-1.5" />
        {skill.cta ?? '开始'}
      </Button>
    </div>
  );
}
