import { nanoid } from 'nanoid';
import type { EditableTarget } from '@magic-resume/resume-templates/renderer/EditableCanvas';
import type { Section } from '@/types/frontend/resume';
import { sectionTitle, stripHtml, type PendingChange } from './changeModel';

/** A whole-resume content skill that produces a batch of reviewable changes. */
export type BatchKind = 'optimize' | 'translate';

// Item fields surfaced as reviewable in-place changes, with the render kind the
// living canvas uses. `summary`/`description` are rich-text bodies (html) of
// experience/education/projects. `name` is the item TITLE — for skills /
// languages / certificates that's the only visible, translatable text (ListSection
// renders it via `fieldMap.itemName`), and it's plain text, so it diffs as `text`.
// Without `name`, a translation rewrites every skill but the canvas diffs none.
// Non-string / empty fields are skipped by the empty-`after` guard below, so this
// is safe across all sections (experience/education `name` is null → skipped).
const DIFF_FIELDS: ReadonlyArray<{ key: string; kind: EditableTarget['kind'] }> = [
  { key: 'summary', kind: 'html' },
  { key: 'description', kind: 'html' },
  { key: 'name', kind: 'text' },
];

/**
 * Real resume diff → reviewable in-place changes for the living canvas. This is
 * the mock→service swap `changeModel` was designed for: instead of inventing fake
 * before/after text (`createBatchChanges`), compare the agent's proposed resume
 * (carried by a `resume_update` SSE event) against the current one — field by
 * field, matched by item `id` — and emit one `PendingChange` per meaningfully
 * changed rich-text field. The change model + apply path in `./changeModel` are
 * untouched, so the living-canvas review (accept/discard/inline diff) works as-is.
 */
export function diffResumeToChanges(
  current: Section,
  proposed: Section,
  kind: BatchKind,
  lang?: string
): PendingChange[] {
  const out: PendingChange[] = [];
  const rationale = kind === 'translate' ? `翻译为 ${lang || 'English'}` : 'AI 按目标岗位优化';
  for (const sectionKey of Object.keys(proposed)) {
    const proposedItems = proposed[sectionKey];
    const currentItems = current[sectionKey];
    if (!Array.isArray(proposedItems) || !Array.isArray(currentItems)) continue;
    let indexInSection = 0;
    for (const pItem of proposedItems) {
      if (pItem.visible === false) continue;
      indexInSection += 1;
      // Skills preserve item ids, so match by id; only diff items present in both.
      const cItem = currentItems.find((it) => String(it.id) === String(pItem.id));
      if (!cItem) continue;
      for (const { key: fieldKey, kind: fieldKind } of DIFF_FIELDS) {
        const before = typeof cItem[fieldKey] === 'string' ? (cItem[fieldKey] as string) : '';
        const after = typeof pItem[fieldKey] === 'string' ? (pItem[fieldKey] as string) : '';
        // Compare text content (ignore pure HTML-formatting churn); skip empties / no-ops.
        if (!after.trim() || stripHtml(before) === stripHtml(after)) continue;
        const target: EditableTarget = {
          sectionKey,
          itemId: String(pItem.id),
          fieldKey,
          kind: fieldKind,
          label: `${sectionTitle(sectionKey)} · 第 ${indexInSection} 条`,
        };
        out.push({
          id: nanoid(),
          target,
          before,
          after,
          rationale,
          action: kind === 'translate' ? 'translate' : 'rewrite',
          lang,
          seed: 0,
          status: 'pending',
        });
      }
    }
  }
  return out;
}
