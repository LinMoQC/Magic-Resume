import get from 'lodash.get';
import React from 'react';
import {
  Briefcase, GraduationCap, FolderOpen, Wrench,
  Languages, Award, User, Globe,
} from 'lucide-react';

interface Item {
  [key: string]: unknown;
}

/**
 * Return a safe href for a user-supplied link value, or null if it can't be
 * trusted. Only http(s) URLs are allowed; a bare domain-like value is promoted to
 * https://. Anything else (javascript:, data:, vbscript:, …) yields null so the
 * caller renders the value as plain text instead of a clickable link. This is the
 * XSS guard for user-authored links shown on the public share page.
 */
export const safeHref = (value: string | undefined | null): string | null => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^(www\.)?[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+(\/.*)?$/.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return null;
};

export const getFieldValue = (item: Item, field: string | string[] | undefined) => {
  if (!field) return null;
  const fields = Array.isArray(field) ? field : [field];
  for (const f of fields) {
    const value = get(item, f);
    if (value) return String(value);
  }
  return null;
};

/**
 * Like {@link getFieldValue}, but also reports which concrete key produced the
 * value. The living canvas needs the real field key (e.g. `summary`) to anchor a
 * pending change back onto the right property — fieldMap aliases like
 * `description` are not writable paths.
 */
export const getFieldEntry = (
  item: Item,
  field: string | string[] | undefined
): { key: string; value: string } | null => {
  if (!field) return null;
  const fields = Array.isArray(field) ? field : [field];
  for (const f of fields) {
    const value = get(item, f);
    if (value) return { key: f, value: String(value) };
  }
  return null;
};

const SECTION_ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>> = {
  experience: Briefcase,
  education: GraduationCap,
  projects: FolderOpen,
  skills: Wrench,
  languages: Languages,
  certificates: Award,
  profiles: User,
  contact: Globe,
};

const TITLE_ICON_KEYWORDS: Record<string, React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }>> = {
  '工作': Briefcase, 'experience': Briefcase, 'work': Briefcase,
  '教育': GraduationCap, 'education': GraduationCap,
  '项目': FolderOpen, 'project': FolderOpen,
  '技能': Wrench, 'skill': Wrench, 'technical': Wrench,
  '语言': Languages, 'language': Languages,
  '证书': Award, 'certif': Award, 'award': Award,
  '个人': User, 'profile': User, 'summary': User,
  '联系': Globe, 'contact': Globe,
};

export function getSectionIcon(sectionKey?: string, title?: string): React.ComponentType<{ size?: number; className?: string; style?: React.CSSProperties }> | null {
  if (sectionKey) {
    const icon = SECTION_ICON_MAP[sectionKey];
    if (icon) return icon;
  }

  if (title) {
    const lower = title.toLowerCase();
    for (const [keyword, icon] of Object.entries(TITLE_ICON_KEYWORDS)) {
      if (lower.includes(keyword)) return icon;
    }
  }

  return null;
}
