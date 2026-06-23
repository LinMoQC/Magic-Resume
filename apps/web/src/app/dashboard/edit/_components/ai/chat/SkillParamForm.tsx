'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import type { AiSkill } from './types';

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

        {selects.map((p) => (
          <div key={p.id}>
            <label className="block text-[11px] text-neutral-400 mb-1.5">{p.label}</label>
            <select
              value={values[p.id] ?? ''}
              onChange={(e) => set(p.id, e.target.value)}
              className={cn(FIELD, 'h-10 px-3.5')}
            >
              {p.kind === 'select' &&
                p.options.map((o) => (
                  <option key={o.value} value={o.value} className="bg-neutral-900">
                    {o.label}
                  </option>
                ))}
            </select>
          </div>
        ))}
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
