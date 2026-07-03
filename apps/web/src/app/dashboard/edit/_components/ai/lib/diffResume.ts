import { nanoid } from 'nanoid';
import type { EditableTarget } from './editableCanvas';
import type { Section } from '@/types/frontend/resume';
import {
  buildSelectionPreview,
  parsePath,
  sectionTitle,
  stripHtml,
  type PendingChange,
} from './changeModel';

/** A whole-resume content skill that produces a batch of reviewable changes. */
export type BatchKind = 'optimize' | 'translate';

export type TargetedSelectionDiff = {
  path: string;
  selectionText: string;
};

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
  lang?: string,
  targetedSelection?: TargetedSelectionDiff
): PendingChange[] {
  if (targetedSelection) {
    const targeted = diffTargetedSelection(current, proposed, kind, lang, targetedSelection);
    if (targeted) return [targeted];
  }

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

function diffTargetedSelection(
  current: Section,
  proposed: Section,
  kind: BatchKind,
  lang: string | undefined,
  targetedSelection: TargetedSelectionDiff
): PendingChange | null {
  const parsed = parsePath(targetedSelection.path);
  if (!parsed || parsed.sectionKey === 'info') return null;

  const currentItems = current[parsed.sectionKey];
  const proposedItems = proposed[parsed.sectionKey];
  if (!Array.isArray(currentItems) || !Array.isArray(proposedItems)) return null;

  const currentItem = currentItems.find((it) => String(it.id) === parsed.itemId);
  const proposedItem = proposedItems.find((it) => String(it.id) === parsed.itemId);
  if (!currentItem || !proposedItem) return null;

  const fieldMeta = DIFF_FIELDS.find((f) => f.key === parsed.fieldKey);
  const before = typeof currentItem[parsed.fieldKey] === 'string' ? (currentItem[parsed.fieldKey] as string) : '';
  const after = typeof proposedItem[parsed.fieldKey] === 'string' ? (proposedItem[parsed.fieldKey] as string) : '';
  if (!after.trim() || stripHtml(before) === stripHtml(after)) return null;

  const visibleIndex = proposedItems
    .filter((item) => item.visible !== false)
    .findIndex((item) => String(item.id) === parsed.itemId);

  const target: EditableTarget = {
    ...parsed,
    kind: fieldMeta?.kind ?? 'html',
    label: `${sectionTitle(parsed.sectionKey)} · 第 ${visibleIndex >= 0 ? visibleIndex + 1 : 1} 条`,
  };

  return {
    id: nanoid(),
    target,
    before,
    after,
    ...buildSelectionPreview(before, after, targetedSelection.selectionText),
    rationale: kind === 'translate' ? `翻译为 ${lang || 'English'}` : 'AI 优化选中片段',
    action: kind === 'translate' ? 'translate' : 'rewrite',
    selectionText: targetedSelection.selectionText,
    lang,
    seed: 0,
    status: 'pending',
  };
}
