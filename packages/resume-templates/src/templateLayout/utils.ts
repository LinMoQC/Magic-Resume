import get from 'lodash.get';
import React from 'react';
import {
  Briefcase, GraduationCap, FolderOpen, Wrench,
  Languages, Award, User, Globe,
} from 'lucide-react';

interface Item {
  [key: string]: unknown;
}

export const getFieldValue = (item: Item, field: string | string[] | undefined) => {
  if (!field) return null;
  const fields = Array.isArray(field) ? field : [field];
  for (const f of fields) {
    const value = get(item, f);
    if (value) return String(value);
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
