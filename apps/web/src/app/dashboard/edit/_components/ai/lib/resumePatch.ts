import fastJsonPatch, { type Operation } from 'fast-json-patch';
import type { Resume, Section, SectionItem } from '@/types/frontend/resume';
import { pathOf } from './editableCanvas';
import type { BatchKind, TargetedSelectionDiff } from './diffResume';
import { parsePath } from './changeModel';

const { applyPatch } = fastJsonPatch;

type ResolvedResumePatch = {
  resume: Resume;
  targetedSelection?: TargetedSelectionDiff;
};

export type ResumePatchBatchContext = {
  kind?: BatchKind;
  lang?: string;
  targetedSelection?: TargetedSelectionDiff;
} | null;

export type ResolvedResumePatchBatch = {
  kind: BatchKind;
  lang?: string;
  proposedSections: Section;
  targetedSelection?: TargetedSelectionDiff;
};

type TextPatchTarget = {
  sectionKey: string;
  itemId: string;
  fieldKey: string;
};

const COMMON_EDITABLE_FIELDS = ['summary', 'description', 'name', 'language', 'headline'] as const;

export function resolveResumePatchEvent(
  current: Resume,
  rawPayload: unknown,
  targetedSelection?: TargetedSelectionDiff,
): ResolvedResumePatch | null {
  const payload = asRecord(rawPayload);
  if (!payload) return null;

  const jsonPatch = getJsonPatch(payload);
  if (jsonPatch) return resolveJsonPatch(current, jsonPatch);

  const oldString = getString(payload, 'oldString') ?? getString(payload, 'old_string');
  const newString = getString(payload, 'newString') ?? getString(payload, 'new_string');
  if (oldString == null || newString == null) return null;

  return resolveTextPatch(current, oldString, newString, targetedSelection);
}

export function resolveResumePatchBatch(
  current: Resume,
  rawPayload: unknown,
  context?: ResumePatchBatchContext,
): ResolvedResumePatchBatch | null {
  const resolved = resolveResumePatchEvent(current, rawPayload, context?.targetedSelection);
  if (!resolved?.resume.sections) return null;

  return {
    kind: context?.kind ?? 'optimize',
    lang: context?.lang,
    proposedSections: resolved.resume.sections,
    targetedSelection: resolved.targetedSelection ?? context?.targetedSelection,
  };
}

function resolveJsonPatch(current: Resume, patch: Operation[]): ResolvedResumePatch | null {
  try {
    const cloned = cloneResume(current);
    const { newDocument } = applyPatch(cloned, patch, true, true);
    return { resume: newDocument as Resume, targetedSelection: targetedSelectionFromJsonPatch(current, patch) };
  } catch (error) {
    console.warn('[ai] failed to apply resume_patch JSON Patch', error);
    return null;
  }
}

function resolveTextPatch(
  current: Resume,
  oldString: string,
  newString: string,
  targetedSelection?: TargetedSelectionDiff,
): ResolvedResumePatch | null {
  if (!oldString) return null;

  if (targetedSelection) {
    const explicitTarget = targetFromSelectionPath(targetedSelection.path);
    if (explicitTarget) {
      const resolved = replaceTextAtTarget(current, explicitTarget, oldString, newString, targetedSelection.selectionText);
      if (resolved) {
        return {
          resume: resolved.resume,
          targetedSelection: {
            path: targetedSelection.path,
            selectionText: resolved.selectionText,
          },
        };
      }
    }
  }

  const fallbackTarget = findTextTarget(current.sections, oldString);
  if (!fallbackTarget) return null;

  const resolved = replaceTextAtTarget(current, fallbackTarget, oldString, newString);
  if (!resolved) return null;

  return {
    resume: resolved.resume,
    targetedSelection: {
      path: pathOf(fallbackTarget),
      selectionText: resolved.selectionText,
    },
  };
}

function replaceTextAtTarget(
  current: Resume,
  target: TextPatchTarget,
  oldString: string,
  newString: string,
  fallbackSelection?: string,
): { resume: Resume; selectionText: string } | null {
  const items = current.sections[target.sectionKey];
  if (!Array.isArray(items)) return null;
  const index = items.findIndex((item) => String(item.id) === target.itemId);
  if (index < 0) return null;

  const value = items[index]?.[target.fieldKey];
  if (typeof value !== 'string') return null;

  const needles = uniqueStrings([oldString, fallbackSelection]);
  const needle = needles.find((candidate) => value.includes(candidate));
  if (!needle) return null;

  const resume = cloneResume(current);
  // Replace the first occurrence by index rather than value.replace(needle, …): a
  // plain-string needle only replaces the first match anyway, but String.replace also
  // interprets '$' sequences in newString (e.g. a salary like "$1,000" or "$&") as
  // replacement patterns and mangles the output. Slicing keeps newString literal.
  const matchIndex = value.indexOf(needle);
  resume.sections[target.sectionKey][index][target.fieldKey] =
    value.slice(0, matchIndex) + newString + value.slice(matchIndex + needle.length);
  return { resume, selectionText: needle };
}

function targetFromSelectionPath(path: string): TextPatchTarget | null {
  const parsed = parsePath(path);
  if (!parsed || parsed.sectionKey === 'info') return null;
  return {
    sectionKey: parsed.sectionKey,
    itemId: parsed.itemId,
    fieldKey: parsed.fieldKey,
  };
}

function findTextTarget(sections: Section, needle: string): TextPatchTarget | null {
  for (const [sectionKey, items] of Object.entries(sections)) {
    if (!Array.isArray(items)) continue;
    for (const item of items) {
      if (!item?.id) continue;
      const fieldKey = findStringField(item, needle);
      if (!fieldKey) continue;
      return { sectionKey, itemId: String(item.id), fieldKey };
    }
  }
  return null;
}

function findStringField(item: SectionItem, needle: string): string | null {
  for (const key of COMMON_EDITABLE_FIELDS) {
    if (typeof item[key] === 'string' && (item[key] as string).includes(needle)) return key;
  }
  for (const [key, value] of Object.entries(item)) {
    if (typeof value === 'string' && value.includes(needle)) return key;
  }
  return null;
}

function targetedSelectionFromJsonPatch(current: Resume, patch: Operation[]): TargetedSelectionDiff | undefined {
  if (patch.length !== 1) return undefined;
  const [op] = patch;
  if (op.op !== 'replace' || typeof op.value !== 'string') return undefined;

  const target = targetFromJsonPointer(current, op.path);
  if (!target) return undefined;

  const items = current.sections[target.sectionKey];
  const item = items.find((entry) => String(entry.id) === target.itemId);
  const before = item?.[target.fieldKey];
  if (typeof before !== 'string' || !before.trim()) return undefined;

  return {
    path: pathOf(target),
    selectionText: before,
  };
}

function targetFromJsonPointer(current: Resume, pointer: string): TextPatchTarget | null {
  const segments = pointer
    .split('/')
    .slice(1)
    .map((segment) => segment.replace(/~1/g, '/').replace(/~0/g, '~'));

  if (segments.length !== 4 || segments[0] !== 'sections') return null;
  const [, sectionKey, indexToken, fieldKey] = segments;
  const index = Number(indexToken);
  if (!Number.isInteger(index)) return null;

  const item = current.sections[sectionKey]?.[index];
  if (!item?.id) return null;

  return { sectionKey, itemId: String(item.id), fieldKey };
}

function getJsonPatch(payload: Record<string, unknown>): Operation[] | null {
  const candidate = payload.patch ?? payload.operations ?? payload.jsonPatch;
  if (!Array.isArray(candidate)) return null;
  if (!candidate.every(isJsonPatchOperation)) return null;
  return candidate as Operation[];
}

function isJsonPatchOperation(value: unknown): value is Operation {
  const record = asRecord(value);
  return Boolean(record && typeof record.op === 'string' && typeof record.path === 'string');
}

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function getString(payload: Record<string, unknown>, key: string): string | undefined {
  const value = payload[key];
  return typeof value === 'string' ? value : undefined;
}

function uniqueStrings(values: Array<string | undefined>): string[] {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

function cloneResume(resume: Resume): Resume {
  return JSON.parse(JSON.stringify(resume)) as Resume;
}
