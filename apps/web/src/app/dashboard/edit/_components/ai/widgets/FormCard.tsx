'use client';

import React, { useState } from 'react';
import { Check, X, PencilLine } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { WidgetProps } from './registry';
import type { WidgetFormField } from './types';

const FIELD =
  'w-full bg-neutral-800 rounded-xl text-sm text-neutral-100 placeholder:text-neutral-500 border-0 focus:outline-none focus-visible:ring-1 focus-visible:ring-sky-500/50';

function initialValues(fields: WidgetFormField[]): Record<string, string> {
  const v: Record<string, string> = {};
  fields.forEach((f) => {
    v[f.id] = f.kind === 'select' ? f.options?.[0]?.value ?? '' : '';
  });
  return v;
}

/**
 * The generic GenUI form card (design/genui-systematization.md, first widget).
 * The agent calls `request_form({ formKind })` when it needs structured input
 * (JD/company/title, target language); the user fills it inline in the thread and
 * submits — the values resume the paused run (`respond`) and the agent continues.
 */
export default function FormCard({ instance, onAction }: WidgetProps) {
  const props = instance.props as {
    title?: string;
    message?: string;
    fields?: WidgetFormField[];
  };
  const fields = props.fields ?? [];
  const [values, setValues] = useState<Record<string, string>>(() => initialValues(fields));
  const resolved = instance.status !== 'pending';
  const set = (id: string, val: string) => setValues((prev) => ({ ...prev, [id]: val }));

  return (
    <div className="flex gap-3 items-start">
      <div className="w-7 h-7 rounded-full bg-sky-500/10 border border-sky-500/20 shrink-0 flex items-center justify-center text-sky-400">
        <PencilLine size={14} />
      </div>
      <div className="min-w-[280px] max-w-md flex-1 rounded-2xl border border-sky-500/30 bg-sky-500/[0.07] px-4 py-3.5">
        <div className="text-[13px] font-medium text-white">{props.title || '请补充信息'}</div>
        {props.message && (
          <div className="mt-1 text-xs text-neutral-400 leading-relaxed">{props.message}</div>
        )}

        {resolved ? (
          <div className="mt-2.5 inline-flex items-center gap-1.5 text-[11px] text-neutral-500">
            {instance.status === 'submitted' ? (
              <>
                <Check size={11} className="text-emerald-500/80" />
                已提交
              </>
            ) : (
              <>
                <X size={11} />
                已取消
              </>
            )}
          </div>
        ) : (
          <>
            <div className="mt-3 space-y-3">
              {fields.map((f) => (
                <div key={f.id}>
                  <label className="block text-[11px] text-neutral-400 mb-1.5">{f.label}</label>
                  {f.kind === 'textarea' ? (
                    <textarea
                      value={values[f.id] ?? ''}
                      placeholder={f.placeholder}
                      onChange={(e) => set(f.id, e.target.value)}
                      className={cn(FIELD, 'resize-y min-h-[120px] px-3.5 py-2.5 leading-relaxed')}
                    />
                  ) : f.kind === 'select' ? (
                    <select
                      value={values[f.id] ?? ''}
                      onChange={(e) => set(f.id, e.target.value)}
                      className={cn(FIELD, 'h-10 px-3.5 cursor-pointer')}
                    >
                      {(f.options ?? []).map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      value={values[f.id] ?? ''}
                      placeholder={f.placeholder}
                      onChange={(e) => set(f.id, e.target.value)}
                      className={cn(FIELD, 'h-10 px-3.5')}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-3.5 flex items-center gap-2">
              <button
                type="button"
                onClick={() => onAction({ type: 'submit', values })}
                className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500/20 hover:bg-sky-500/30 px-3 py-1.5 text-xs font-medium text-sky-100 transition-colors cursor-pointer"
              >
                <Check size={12} />
                提交
              </button>
              <button
                type="button"
                onClick={() => onAction({ type: 'cancel' })}
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={12} />
                取消
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
