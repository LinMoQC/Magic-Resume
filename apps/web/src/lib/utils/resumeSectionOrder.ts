import type { SectionOrder } from '@/types/frontend/resume';

const DEFAULT_SECTION_ORDER: SectionOrder[] = [
  { key: 'basics', label: 'Basics' },
  { key: 'projects', label: 'sections.projects' },
  { key: 'education', label: 'sections.education' },
  { key: 'skills', label: 'sections.skills' },
  { key: 'languages', label: 'sections.languages' },
  { key: 'certificates', label: 'sections.certificates' },
  { key: 'experience', label: 'sections.experience' },
];

const DEFAULT_LABELS = new Map(DEFAULT_SECTION_ORDER.map((item) => [item.key, item.label]));

const fallbackLabel = (key: string) =>
  DEFAULT_LABELS.get(key) ?? (key ? key.charAt(0).toUpperCase() + key.slice(1) : key);

/**
 * `sectionOrder` also controls which forms exist in the editor. AI-generated
 * resumes may only order sections they found content for, so repair the order
 * without disturbing the sequence or labels it did provide.
 */
export function normalizeResumeSectionOrder(
  sectionOrder: SectionOrder[] | null | undefined,
  sections: Record<string, unknown> | null | undefined,
): SectionOrder[] {
  const normalized: SectionOrder[] = [];
  const seen = new Set<string>();

  const add = (item: SectionOrder) => {
    const key = typeof item.key === 'string' ? item.key.trim() : '';
    if (!key || seen.has(key) || key === 'basics') return;

    seen.add(key);
    normalized.push({
      key,
      label: typeof item.label === 'string' && item.label.trim()
        ? item.label
        : fallbackLabel(key),
    });
  };

  for (const item of sectionOrder ?? []) add(item);
  for (const item of DEFAULT_SECTION_ORDER) add(item);
  for (const key of Object.keys(sections ?? {})) add({ key, label: fallbackLabel(key) });

  return [{ key: 'basics', label: 'Basics' }, ...normalized];
}
