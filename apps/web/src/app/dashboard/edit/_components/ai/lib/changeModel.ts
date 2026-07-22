import { nanoid } from 'nanoid';
import type { EditableTarget } from './editableCanvas';
import type { Section } from '@/types/frontend/resume';

/**
 * The living canvas's change model: the reviewable in-place revision shape, the
 * action vocabulary, target locating, and the functions that apply an accepted
 * change onto the resume.
 *
 * This half is backend-agnostic: edit providers can change while the review/apply
 * path here keeps the same shape.
 */

// ----------------------------------------------------------------------------
// Quick actions (element-scoped) — design §B
// ----------------------------------------------------------------------------

export type QuickActionId =
  | 'quantify'
  | 'concise'
  | 'verb'
  | 'evidence'
  | 'rewrite'
  | 'tone'
  | 'shorten';

export interface QuickAction {
  id: QuickActionId;
  label: string;
}

/** Quick actions for an experience / project bullet (design §B). */
export const BULLET_ACTIONS: QuickAction[] = [
  { id: 'quantify', label: '量化' },
  { id: 'concise', label: '精简' },
  { id: 'verb', label: '换个动词' },
  { id: 'evidence', label: '补证据' },
];

/** Quick actions for a summary-style block (design §B). */
export const SUMMARY_ACTIONS: QuickAction[] = [
  { id: 'rewrite', label: '重写' },
  { id: 'tone', label: '调整语气' },
  { id: 'shorten', label: '缩短' },
];

export function actionsForTarget(target: EditableTarget): QuickAction[] {
  // The header summary is a free-text blurb — only the summary-style actions apply.
  if (target.sectionKey === 'info') return SUMMARY_ACTIONS;
  if (target.sectionKey === 'experience' || target.sectionKey === 'projects') {
    return BULLET_ACTIONS;
  }
  return [...BULLET_ACTIONS, ...SUMMARY_ACTIONS];
}

/** Keyword routing for free-text instructions → a concrete action (design §10). */
const FREE_ROUTES: { test: RegExp; action: QuickActionId }[] = [
  { test: /量化|数字|数据|指标|百分|%/, action: 'quantify' },
  { test: /精简|简洁|压缩|删减|啰嗦|冗余/, action: 'concise' },
  { test: /短|缩短|一行|太长/, action: 'shorten' },
  { test: /动词|有力|主动|改成主导|换词/, action: 'verb' },
  { test: /证据|佐证|例子|案例|证明/, action: 'evidence' },
  { test: /语气|口吻|温度|积极|稳重/, action: 'tone' },
  { test: /重写|换个说法|重新写|改写整段/, action: 'rewrite' },
];

export function routeFreeText(text: string): QuickActionId | null {
  for (const r of FREE_ROUTES) if (r.test.test(text)) return r.action;
  return null;
}

// ----------------------------------------------------------------------------
// Selection-driven actions — design §A/§B
// ----------------------------------------------------------------------------

export type SelectionActionId = 'polish' | 'shorten' | 'translate';

export interface SelectionAction {
  id: SelectionActionId;
  label: string;
}

export const SELECTION_ACTIONS: SelectionAction[] = [
  { id: 'polish', label: '优化这段' },
  { id: 'shorten', label: '缩短' },
  { id: 'translate', label: '翻译' },
];

export type ActionKind = QuickActionId | SelectionActionId | 'free';

// ----------------------------------------------------------------------------
// The reviewable change unit — design §8.3
// ----------------------------------------------------------------------------

export interface PendingChange {
  id: string;
  target: EditableTarget;
  /**
   * Full field values used when accepting the change. For rich text fields this can
   * be an entire experience summary containing several bullets.
   */
  before: string;
  after: string;
  /** Optional review-only values for selection edits, so the diff card can stay scoped. */
  previewBefore?: string;
  previewAfter?: string;
  previewKind?: EditableTarget['kind'];
  rationale: string;
  /** longer "why", revealed on demand (design §D) */
  rationaleDetail?: string;
  /** what produced this change — kept so "再来一版" can regenerate the same intent */
  action: ActionKind;
  freeText?: string;
  /** set for selection-scoped changes: the exact substring the action rewrote */
  selectionText?: string;
  /** target language for translate actions */
  lang?: string;
  /** true for "add a new item" proposals (rendered green-only, appended on accept) */
  isInsert?: boolean;
  /** bumped on each regenerate to cycle the mock variants */
  seed: number;
  status: 'pending' | 'accepted';
}

// ----------------------------------------------------------------------------
// Target locating
// ----------------------------------------------------------------------------

/** Resume section key → display title, for change labels. */
const SECTION_TITLES: Record<string, string> = {
  experience: '工作经历',
  education: '教育经历',
  projects: '项目经历',
  skills: '专业技能',
  languages: '语言能力',
  certificates: '证书资质',
  profiles: '个人主页',
  awards: '奖项',
};

export function sectionTitle(sectionKey: string): string {
  return SECTION_TITLES[sectionKey] || sectionKey;
}

/** Inverse of the renderer's `pathOf` — recover a target from a DOM anchor. */
export function parsePath(
  path: string
): { sectionKey: string; itemId: string; fieldKey: string } | null {
  const info = /^info\.(.+)$/.exec(path);
  if (info) return { sectionKey: 'info', itemId: '', fieldKey: info[1] };
  const m = /^sections\.([^.[]+)\[(.+)\]\.([^.]+)$/.exec(path);
  if (!m) return null;
  return { sectionKey: m[1], itemId: m[2], fieldKey: m[3] };
}

// ----------------------------------------------------------------------------
// Shared text helpers (used by apply here + the mock/service generators)
// ----------------------------------------------------------------------------

export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export type SelectionPreview = {
  previewBefore: string;
  previewAfter: string;
  previewKind: 'text';
};

function extractSelectedReplacement(beforeText: string, afterText: string, selectedText: string): string {
  const idx = beforeText.indexOf(selectedText);
  if (idx >= 0) {
    const prefix = beforeText.slice(0, idx);
    const suffix = beforeText.slice(idx + selectedText.length);
    if (afterText.startsWith(prefix) && afterText.endsWith(suffix)) {
      return afterText.slice(prefix.length, afterText.length - suffix.length).trim();
    }
  }

  let start = 0;
  while (
    start < beforeText.length &&
    start < afterText.length &&
    beforeText[start] === afterText[start]
  ) {
    start += 1;
  }

  let endBefore = beforeText.length;
  let endAfter = afterText.length;
  while (
    endBefore > start &&
    endAfter > start &&
    beforeText[endBefore - 1] === afterText[endAfter - 1]
  ) {
    endBefore -= 1;
    endAfter -= 1;
  }

  return afterText.slice(start, endAfter).trim();
}

export function buildSelectionPreview(
  fullBefore: string,
  fullAfter: string,
  selectionText: string
): SelectionPreview | undefined {
  const selected = stripHtml(selectionText);
  if (!selected) return undefined;

  const beforeText = stripHtml(fullBefore);
  const afterText = stripHtml(fullAfter);
  const replacement = extractSelectedReplacement(beforeText, afterText, selected);

  return {
    previewBefore: selected,
    previewAfter: replacement || afterText || selected,
    previewKind: 'text',
  };
}

/** Re-wrap improved text in the same outer structure the field used. */
export function wrapLike(originalHtml: string, text: string): string {
  if (/<li[\s>]/i.test(originalHtml)) return `<ul><li>${text}</li></ul>`;
  return `<p>${text}</p>`;
}

/** Strip the HTML wrapper for plain-text targets (e.g. the header summary). */
export function finalizeAfter(kind: EditableTarget['kind'], after: string): string {
  return kind === 'text' ? stripHtml(after) : after;
}

// ----------------------------------------------------------------------------
// Build a reviewable change from an edit provider result. The provider returns
// `{ after, rationale }`, and these helpers assemble the `PendingChange` shape
// the review/apply path expects.
// ----------------------------------------------------------------------------

/** What the edit service hands back (kept local so this module needs no backend import). */
export interface EditResultLike {
  after: string;
  rationale: string;
  rationaleDetail?: string;
}

/** Element quick action (ActionPopover) → reviewable change. */
export function buildElementChange(
  target: EditableTarget,
  before: string,
  action: QuickActionId | 'free',
  result: EditResultLike,
  freeText?: string
): PendingChange {
  return {
    id: nanoid(),
    target,
    before,
    after: finalizeAfter(target.kind, result.after),
    rationale: result.rationale,
    rationaleDetail: result.rationaleDetail,
    action,
    freeText,
    seed: 0,
    status: 'pending',
  };
}

/** Selection-scoped edit → reviewable change (keeps `selectionText` for regenerate). */
export function buildSelectionChange(
  target: EditableTarget,
  fullHtml: string,
  selectionText: string,
  action: SelectionActionId | 'free',
  result: EditResultLike,
  opts?: { freeText?: string; lang?: string }
): PendingChange {
  const after = finalizeAfter(target.kind, result.after);
  const preview = buildSelectionPreview(fullHtml, after, selectionText);
  return {
    id: nanoid(),
    target,
    before: fullHtml,
    after,
    ...preview,
    rationale: result.rationale,
    rationaleDetail: result.rationaleDetail,
    action,
    freeText: opts?.freeText,
    selectionText,
    lang: opts?.lang,
    seed: 0,
    status: 'pending',
  };
}

/**
 * Sections rendered by the item *name* (fieldMap.itemName) rather than a summary
 * bullet. 'name' is a common fallback in every template's itemName candidate list,
 * so inserting into 'name' is picked up across templates — whereas writing 'summary'
 * here makes the inserted content invisible.
 */
const NAME_FIELD_SECTIONS = new Set(['skills', 'languages', 'certificates', 'awards', 'profiles']);

/** A fresh target for an insert — made by the caller so its path is stable across the async call. */
export function makeInsertTarget(sectionKey: string, title: string): EditableTarget {
  const isNameField = NAME_FIELD_SECTIONS.has(sectionKey);
  return {
    sectionKey,
    itemId: `new-${nanoid(6)}`,
    fieldKey: isNameField ? 'name' : 'summary',
    kind: isNameField ? 'text' : 'html',
    label: `${title} · 新增一条`,
  };
}

/** New-item proposal (green-only insert) → reviewable change. */
export function buildInsertChange(target: EditableTarget, result: EditResultLike): PendingChange {
  return {
    id: nanoid(),
    target,
    before: '',
    after: result.after,
    rationale: result.rationale,
    rationaleDetail: result.rationaleDetail,
    action: 'free',
    isInsert: true,
    seed: 0,
    status: 'pending',
  };
}

// ----------------------------------------------------------------------------
// Apply an accepted change onto the resume (patch-style, by item id)
// ----------------------------------------------------------------------------

/** Apply an accepted change onto the resume sections (clone + write by item id). */
export function applyChangeToSections(sections: Section, change: PendingChange): Section {
  if (change.target.sectionKey === 'info') return sections; // info changes go through applyInfoChange
  const next: Section = JSON.parse(JSON.stringify(sections));
  const items = next[change.target.sectionKey];
  if (!Array.isArray(items)) return sections;
  const item = items.find((it) => String(it.id) === change.target.itemId);
  if (item) {
    item[change.target.fieldKey] = change.after;
    return next;
  }
  if (change.isInsert) {
    items.push({ id: change.target.itemId, visible: true, [change.target.fieldKey]: change.after });
    return next;
  }
  return sections;
}

/** Apply an accepted change onto resume.info (returns a new InfoType-shaped object). */
export function applyInfoChange<T extends Record<string, unknown>>(info: T, change: PendingChange): T {
  if (change.target.sectionKey !== 'info') return info;
  return { ...info, [change.target.fieldKey]: change.after };
}

/** Reorder a section's items so the strongest (quantified / longer) read first. */
export function reorderSection(sections: Section, sectionKey: string): Section {
  const items = sections[sectionKey];
  if (!Array.isArray(items) || items.length < 2) return sections;
  const score = (it: Record<string, unknown>) => {
    const text = ['summary', 'description']
      .map((k) => (typeof it[k] === 'string' ? (it[k] as string) : ''))
      .join(' ');
    const quantified = /\d|%|％/.test(text) ? 1000 : 0;
    return quantified + stripHtml(text).length;
  };
  const next: Section = JSON.parse(JSON.stringify(sections));
  next[sectionKey] = [...next[sectionKey]].sort((a, b) => score(b) - score(a));
  return next;
}
