import type { ComponentType } from 'react';
import FormCard from './FormCard';
import type {
  WidgetActionResult,
  WidgetFormField,
  WidgetInstance,
  WidgetInteraction,
} from './types';

export interface WidgetProps {
  instance: WidgetInstance;
  onAction: (result: WidgetActionResult) => void;
}

export interface WidgetDescriptor {
  component: ComponentType<WidgetProps>;
  /** where the user's action goes: resume (HITL respond) / message / client-only. */
  interaction: WidgetInteraction;
  /** validate + shape raw props before render; return null → host degrades to text. */
  normalize?: (props: Record<string, unknown>) => Record<string, unknown> | null;
}

/**
 * Predefined form layouts the agent requests by `formKind`. The FIELDS live here
 * (front-end single source of truth) — the model only picks which form, so it
 * can't emit a malformed field schema. Mirrors `skills/registry.ts` as the SSOT.
 */
export const FORM_DEFS: Record<string, { title: string; fields: WidgetFormField[] }> = {
  job_info: {
    title: '目标岗位信息',
    fields: [
      { id: 'jd', label: '目标 JD', kind: 'textarea', placeholder: '粘贴目标职位描述，AI 将据此定向优化…' },
      { id: 'company', label: '公司', kind: 'text', placeholder: '例如 字节跳动' },
      { id: 'title', label: '岗位', kind: 'text', placeholder: '例如 高级产品经理' },
    ],
  },
  target_language: {
    title: '目标语言',
    fields: [
      {
        id: 'lang',
        label: '翻译成',
        kind: 'select',
        options: [
          { value: 'English', label: 'English' },
          { value: '日本語', label: '日本語' },
          { value: '한국어', label: '한국어' },
          { value: 'Français', label: 'Français' },
        ],
      },
    ],
  },
};

/** The widget registry. Add a card = one component + one entry here. */
export const WIDGETS: Record<string, WidgetDescriptor> = {
  request_form: {
    component: FormCard,
    interaction: 'resume',
    normalize: (props) => {
      const formKind = typeof props.formKind === 'string' ? props.formKind : '';
      const def = FORM_DEFS[formKind];
      if (!def) return null; // unknown form → host shows a text fallback
      return {
        formKind,
        title: def.title,
        fields: def.fields,
        message: typeof props.message === 'string' ? props.message : '',
      };
    },
  },
};
