'use client';

import React, { useState } from 'react';
import { Check, X, ClipboardList } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { WidgetProps } from './registry';
import type { WidgetFormField } from './types';

const FIELD =
  'w-full bg-neutral-800 rounded-xl text-sm text-neutral-100 placeholder:text-neutral-600 border-0 focus:outline-none focus-visible:ring-1 focus-visible:ring-sky-500/40';

function initialValues(fields: WidgetFormField[]): Record<string, string> {
  const v: Record<string, string> = {};
  fields.forEach((f) => {
    v[f.id] = f.kind === 'select' ? f.options?.[0]?.value ?? '' : '';
  });
  return v;
}

/**
 * The generic GenUI form card (docs/specs/genui-systematization/design.md, first widget). The
 * agent calls `request_form({ formKind })` when it needs structured input (JD /
 * company / title, target language); the user fills it inline and submits — the
 * values resume the paused run and the agent continues. Tone matches the task card:
 * neutral surface + a single accent icon in the header.
 */
export default function FormCard({ instance, onAction }: WidgetProps) {
  const { t } = useTranslation();
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
    <div className="min-w-[280px] max-w-md flex-1 rounded-2xl bg-neutral-900 px-4 py-3.5">
      <div className="flex items-center gap-2.5">
        <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 bg-sky-500/[0.12]">
          <ClipboardList size={14} className="text-sky-400" />
        </div>
        <span className="text-[13px] font-medium text-white">{props.title || t('aiLab.widgets.form.defaultTitle')}</span>
        {resolved && (
          <span
            className={cn(
              'ml-auto inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full',
              instance.status === 'submitted'
                ? 'text-emerald-400 bg-emerald-500/10'
                : 'text-neutral-500 bg-neutral-800',
            )}
          >
            {instance.status === 'submitted' ? <Check size={12} /> : <X size={12} />}
            {instance.status === 'submitted' ? t('aiLab.widgets.form.submitted') : t('aiLab.widgets.form.cancelled')}
          </span>
        )}
      </div>

      {props.message && (
        <div className="mt-2 text-xs text-neutral-400 leading-relaxed">{props.message}</div>
      )}

      {!resolved && (
        <>
          <div className="mt-3 space-y-3">
            {fields.map((f) => (
              <div key={f.id}>
                <label className="block text-[11px] text-neutral-500 mb-1.5">{f.label}</label>
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
                    className={cn(FIELD, 'h-9 px-3 cursor-pointer')}
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
                    className={cn(FIELD, 'h-9 px-3')}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="mt-3.5 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => onAction({ type: 'cancel' })}
              className="rounded-lg px-3 py-1.5 text-xs text-neutral-500 hover:text-neutral-200 transition-colors cursor-pointer"
            >
              {t('common.cancel')}
            </button>
            <button
              type="button"
              onClick={() => onAction({ type: 'submit', values })}
              className="inline-flex items-center gap-1.5 rounded-lg bg-sky-500 hover:bg-sky-600 px-3.5 py-1.5 text-xs font-medium text-white transition-colors cursor-pointer"
            >
              <Check size={13} />
              {t('aiLab.widgets.form.submit')}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
