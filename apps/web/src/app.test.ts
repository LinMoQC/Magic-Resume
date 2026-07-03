import assert from 'node:assert/strict';
import { ZodError } from 'zod';
import {
  buildSelectionChange,
  buildSelectionPreview,
  type EditResultLike,
} from '@/app/dashboard/edit/_components/ai/lib/changeModel';
import { diffResumeToChanges } from '@/app/dashboard/edit/_components/ai/lib/diffResume';
import {
  pathOf,
  type EditableTarget,
} from '@/app/dashboard/edit/_components/ai/lib/editableCanvas';
import {
  resolveResumePatchBatch,
  resolveResumePatchEvent,
} from '@/app/dashboard/edit/_components/ai/lib/resumePatch';
import {
  getApiErrorMessage,
  getMcpApiUrl,
  normalizeCloudResumes,
  shellQuote,
} from '@/lib/settings/mcpAccess';
import { shallowEqualArray } from '@/lib/utils/array';
import { hexToRgb, rgbToHex } from '@/lib/utils/color';
import { parseCssPixelValue } from '@/lib/utils/css';
import {
  formatCommentDate,
  formatCompactDateTime,
  formatShortDateTime,
  getCountdownTimeLeft,
} from '@/lib/utils/dateTime';
import { getFileSizeBucket } from '@/lib/utils/fileSize';
import { generateShortHash } from '@/lib/utils/hash';
import { getInitials } from '@/lib/utils/userDisplay';
import {
  formatResumeImportValidationError,
  validateAndNormalizeImportedResume,
} from '@/lib/validation/importResume';
import {
  AI_SESSION_TTL_MS,
  createAiSessionStore,
  getAiSessionStorageKey,
  type AiSessionSnapshot,
} from '@/store/useAiSessionStore';
import type { Resume, Section } from '@/types/frontend/resume';

class MemoryDb {
  items = new Map<string, unknown>();

  async setItem<T>(key: string, value: T): Promise<void> {
    this.items.set(key, structuredClone(value));
  }

  async getItem<T>(key: string): Promise<T | null> {
    return (structuredClone(this.items.get(key)) as T | undefined) ?? null;
  }

  async removeItem(key: string): Promise<void> {
    this.items.delete(key);
  }

  async getAllKeys(): Promise<string[]> {
    return Array.from(this.items.keys());
  }
}

const baseSession = (overrides: Partial<AiSessionSnapshot> = {}): Partial<AiSessionSnapshot> => ({
  started: true,
  sessionId: 'session-a',
  sessionUsed: true,
  messages: [
    { id: 'm1', role: 'user', content: '帮我优化简历' },
    { id: 'm2', role: 'assistant', content: '当然可以。' },
  ],
  ...overrides,
});

const oldSentence =
  'Refactored critical resource-monitoring dashboards using Angular and RxJS, reducing memory leaks by 25% and improving data refresh intervals for massive clusters.';
const optimizedSentence =
  'Refactored resource-monitoring dashboards with Angular and RxJS, cutting memory leaks by 25% and reducing data refresh latency across large-scale clusters.';
const rewrittenSentence =
  'Redesigned critical resource-monitoring dashboards with Angular and RxJS, cutting memory leaks by 25% and accelerating data refresh rates for massive clusters.';

const beforeSummary = [
  '<p>Google Cloud Console UI Optimization</p>',
  '<ul>',
  `<li>${oldSentence}</li>`,
  '<li>Developed a specialized Web Worker layer to handle multi-threaded telemetry data processing, preventing main-thread blocking during peak load.</li>',
  '</ul>',
].join('');

const rewrittenSummary = [
  '<p>Google Cloud Console UI Optimization</p>',
  '<ul>',
  `<li>${rewrittenSentence}</li>`,
  '<li>Developed a specialized Web Worker layer to handle multi-threaded telemetry data processing, preventing main-thread blocking during peak load.</li>',
  '</ul>',
].join('');

const targetSelection = {
  path: 'sections.experience[google].summary',
  selectionText: oldSentence,
};

const resume: Resume = {
  id: 'resume-1',
  name: 'Kairo Resume',
  updatedAt: 1,
  info: {
    fullName: 'Kairo Chen',
    headline: '',
    email: '',
    phoneNumber: '',
    address: '',
    website: '',
    avatar: '',
  },
  sections: {
    experience: [
      { id: 'google', visible: true, company: 'Google', summary: beforeSummary },
      { id: 'bytedance', visible: true, company: 'ByteDance', summary: '<p>Unchanged</p>' },
    ],
  },
  sectionOrder: [{ key: 'experience', label: 'Experience' }],
  template: 'classic',
  themeColor: '#f97316',
  typography: 'inter',
};

async function testAiSessionStore() {
  {
    const now = 1_000;
    const db = new MemoryDb();
    const store = createAiSessionStore({
      db,
      now: () => now,
      idFactory: () => 'fresh-session',
      persistDelayMs: 0,
    });

    await store.getState().patchSession('resume-a', baseSession());
    await store.getState().patchSession('resume-a', {
      analysis: {
        overall_score: 83,
        category_averages: { impact: 80 },
        peer_analysis: {
          persona: 'peer_developer',
          score: 82,
          categories_scores: { impact: 80 },
          strengths: ['技术栈扎实'],
          weaknesses: ['结果量化不足'],
          suggestions: ['补充性能数据'],
        },
        leader_analysis: {
          persona: 'tech_lead',
          score: 84,
          categories_scores: { impact: 84 },
          strengths: ['项目复杂度不错'],
          weaknesses: ['业务影响表达弱'],
          suggestions: ['突出负责范围'],
        },
        hrbp_analysis: {
          persona: 'hrbp',
          score: 83,
          categories_scores: { impact: 82 },
          strengths: ['经历完整'],
          weaknesses: ['关键词覆盖不足'],
          suggestions: ['补充岗位关键词'],
        },
      },
    });
    await store.getState().flushSession('resume-a');

    const reloaded = createAiSessionStore({
      db,
      now: () => now,
      idFactory: () => 'unused',
      persistDelayMs: 0,
    });
    const session = await reloaded.getState().loadSession('resume-a');

    assert.equal(session.sessionId, 'session-a');
    assert.equal(session.sessionUsed, true);
    assert.equal(session.messages.length, 2);
    assert.equal(session.messages[0].content, '帮我优化简历');
    assert.equal(session.analysis?.overall_score, 83);
  }

  {
    const db = new MemoryDb();
    const store = createAiSessionStore({
      db,
      now: () => 2_000,
      idFactory: () => 'new-session',
      persistDelayMs: 0,
    });

    await store.getState().patchSession('resume-a', baseSession({ sessionId: 'session-a' }));
    await store.getState().patchSession('resume-b', baseSession({ sessionId: 'session-b', messages: [] }));
    await store.getState().flushSession('resume-a');
    await store.getState().flushSession('resume-b');

    const a = await store.getState().loadSession('resume-a');
    const b = await store.getState().loadSession('resume-b');

    assert.equal(a.sessionId, 'session-a');
    assert.equal(a.messages.length, 2);
    assert.equal(b.sessionId, 'session-b');
    assert.equal(b.messages.length, 0);
  }

  {
    const now = 10_000 + AI_SESSION_TTL_MS;
    const db = new MemoryDb();
    await db.setItem(getAiSessionStorageKey('resume-a'), {
      ...baseSession(),
      updatedAt: 9_999,
    });
    const store = createAiSessionStore({
      db,
      now: () => now,
      idFactory: () => 'fresh-after-expiry',
      persistDelayMs: 0,
    });

    const session = await store.getState().loadSession('resume-a');

    assert.equal(session.sessionId, 'fresh-after-expiry');
    assert.equal(session.started, false);
    assert.equal(session.messages.length, 0);
    assert.equal(db.items.has(getAiSessionStorageKey('resume-a')), false);
  }

  {
    const db = new MemoryDb();
    const ids = ['first-session', 'second-session'];
    const store = createAiSessionStore({
      db,
      now: () => 3_000,
      idFactory: () => ids.shift() ?? 'fallback-session',
      persistDelayMs: 0,
    });

    await store.getState().patchSession('resume-a', baseSession());
    const reset = store.getState().resetSession('resume-a');
    await store.getState().flushSession('resume-a');

    assert.equal(reset.sessionId, 'second-session');
    assert.equal(reset.sessionUsed, false);
    assert.equal(reset.started, false);
    assert.equal(reset.messages.length, 0);
    assert.equal(reset.analysis, null);
  }
}

function testImportResumeValidation() {
  const normalized = validateAndNormalizeImportedResume({
    name: 'Imported Resume',
    isPublic: true,
    shareId: 'public-share',
    shareRole: 'VIEWER',
    info: {
      fullName: 'Ada Lovelace',
    },
    sections: {
      experience: [
        {
          id: 'exp-1',
          company: 'Analytical Engines',
          extraBackendField: 'kept',
        },
      ],
      customSection: [
        {
          id: 'custom-1',
          title: 'Notes',
        },
      ],
    },
    sectionOrder: [{ key: 'experience', label: 'Experience' }],
  });

  assert.equal(normalized.isPublic, undefined);
  assert.equal(normalized.shareId, undefined);
  assert.equal(normalized.shareRole, undefined);
  assert.equal(normalized.info.fullName, 'Ada Lovelace');
  assert.equal(normalized.info.email, '');
  assert.equal(normalized.sections.experience[0].visible, true);
  assert.equal(normalized.sections.experience[0].extraBackendField, 'kept');
  assert.deepEqual(normalized.sections.education, []);
  assert.deepEqual(normalized.sections.customSection, [{ id: 'custom-1', title: 'Notes' }]);

  assert.throws(
    () =>
      validateAndNormalizeImportedResume({
        info: {},
        sections: {},
        sectionOrder: [],
      }),
    ZodError,
  );

  const message = formatResumeImportValidationError(
    new ZodError([
      {
        code: 'custom',
        path: ['sectionOrder'],
        message: 'Array must contain at least 1 element(s)',
      },
    ]),
  );

  assert.equal(message, 'Invalid resume format: sectionOrder: Array must contain at least 1 element(s)');
}

function testUtilityFunctions() {
  const first = ['summary', 'experience'];
  assert.equal(shallowEqualArray(first, first), true);
  assert.equal(shallowEqualArray(['summary', 'experience'], ['summary', 'experience']), true);
  assert.equal(shallowEqualArray(['summary'], ['summary', 'experience']), false);
  assert.equal(shallowEqualArray(['experience', 'summary'], ['summary', 'experience']), false);

  assert.deepEqual(hexToRgb('#38bdf8'), { r: 56, g: 189, b: 248 });
  assert.deepEqual(hexToRgb('#abc'), { r: 170, g: 187, b: 204 });
  assert.deepEqual(hexToRgb(' #abc '), { r: 170, g: 187, b: 204 });
  assert.deepEqual(hexToRgb(' 38BDF8 '), { r: 56, g: 189, b: 248 });
  assert.equal(hexToRgb('#abcd'), null);
  assert.equal(hexToRgb('not-a-color'), null);
  assert.equal(rgbToHex(56, 189, 248), '#38bdf8');
  assert.equal(rgbToHex(255.4, -4, 300), '#ff00ff');

  assert.equal(parseCssPixelValue('360px'), 360);
  assert.equal(parseCssPixelValue(' 16px '), 16);
  assert.equal(parseCssPixelValue('12.5px'), 12);
  assert.equal(parseCssPixelValue('auto'), 0);
  assert.equal(parseCssPixelValue(''), 0);

  const t = (key: string) => (key === 'sharedPage.comments.justNow' ? 'Just now translated' : key);
  assert.equal(formatCommentDate('', t), 'Just now translated');
  assert.equal(formatCommentDate('Just now', t), 'Just now translated');
  assert.equal(formatCommentDate('not-a-date', t), 'not-a-date');
  assert.equal(formatShortDateTime(new Date('2026-07-03T08:09:00Z'), 'en-US', 'UTC'), 'Jul 3, 08:09 AM');
  assert.equal(formatCompactDateTime(undefined), '');
  assert.equal(formatCompactDateTime(Date.UTC(2026, 6, 3, 8, 9), 'zh-CN', 'UTC'), '7/3 08:09');
  assert.deepEqual(getCountdownTimeLeft((2 * 86400 + 3 * 3600 + 4 * 60 + 5) * 1000, 0), {
    days: 2,
    hours: 3,
    minutes: 4,
    seconds: 5,
  });
  assert.deepEqual(getCountdownTimeLeft(1000, 5000), { days: 0, hours: 0, minutes: 0, seconds: 0 });

  assert.equal(getFileSizeBucket(0), 'small');
  assert.equal(getFileSizeBucket(512 * 1024 - 1), 'small');
  assert.equal(getFileSizeBucket(512 * 1024), 'medium');
  assert.equal(getFileSizeBucket(2 * 1024 * 1024 - 1), 'medium');
  assert.equal(getFileSizeBucket(2 * 1024 * 1024), 'large');

  assert.equal(generateShortHash('version-123'), generateShortHash('version-123'));
  assert.match(generateShortHash('version-123'), /^[0-9a-f]{7}$/);
  assert.notEqual(generateShortHash('version-123'), generateShortHash('completely-different-version'));

  assert.equal(getInitials('Ada Lovelace', null), 'AL');
  assert.equal(getInitials('  Grace   Hopper  ', null), 'GH');
  assert.equal(getInitials('Kai', null), 'KA');
  assert.equal(getInitials(null, 'user@example.com'), 'US');
  assert.equal(getInitials(null, null), '');
}

function testMcpAccessHelpers() {
  assert.equal(getMcpApiUrl('https://example.com'), 'https://example.com/api');
  assert.equal(getMcpApiUrl('https://example.com/api/'), 'https://example.com/api');
  assert.equal(shellQuote("abc'def"), "'abc'\\''def'");
  assert.deepEqual(normalizeCloudResumes([{ id: '1', name: 'Resume A' }]), [
    { id: '1', title: 'Resume A' },
  ]);
  assert.deepEqual(normalizeCloudResumes({ data: { data: [{ id: '2', title: 'Resume B' }] } }), [
    { id: '2', title: 'Resume B' },
  ]);
  assert.deepEqual(normalizeCloudResumes([{ title: 'missing id' }]), []);
  assert.equal(getApiErrorMessage({ isAxiosError: true, response: { data: { message: 'Nope' } } }), 'Nope');
  assert.equal(getApiErrorMessage(new Error('plain')), null);
}

function testAiLib() {
  const preview = buildSelectionPreview(beforeSummary, rewrittenSummary, oldSentence);
  assert.deepEqual(preview, {
    previewBefore: oldSentence,
    previewAfter: rewrittenSentence,
    previewKind: 'text',
  });

  const target: EditableTarget = {
    sectionKey: 'experience',
    itemId: 'google',
    fieldKey: 'summary',
    kind: 'html',
    label: 'Selected segment',
  };

  const result: EditResultLike = {
    after: rewrittenSummary,
    rationale: 'More active wording.',
  };

  const change = buildSelectionChange(target, beforeSummary, oldSentence, 'free', result, {
    freeText: 'Make it stronger',
  });

  assert.equal(change.before, beforeSummary);
  assert.equal(change.after, rewrittenSummary);
  assert.equal(change.previewBefore, oldSentence);
  assert.equal(change.previewAfter, rewrittenSentence);
  assert.equal(change.previewKind, 'text');

  const current: Section = {
    experience: [
      { id: 'google', visible: true, company: 'Google', summary: beforeSummary },
      { id: 'bytedance', visible: true, company: 'ByteDance', summary: '<p>Unchanged</p>' },
    ],
  };

  const proposed: Section = {
    experience: [
      { id: 'google', visible: true, company: 'Google', summary: rewrittenSummary },
      { id: 'bytedance', visible: true, company: 'ByteDance', summary: '<p>Unchanged</p>' },
    ],
  };

  const changes = diffResumeToChanges(current, proposed, 'optimize', undefined, targetSelection);

  assert.equal(changes.length, 1);
  assert.equal(pathOf(changes[0].target), targetSelection.path);
  assert.equal(changes[0].before, beforeSummary);
  assert.equal(changes[0].after, rewrittenSummary);
  assert.equal(changes[0].previewBefore, oldSentence);
  assert.equal(changes[0].previewAfter, rewrittenSentence);
  assert.equal(changes[0].previewKind, 'text');

  const resolved = resolveResumePatchEvent(
    resume,
    { oldString: oldSentence, newString: optimizedSentence },
    targetSelection,
  );

  assert.ok(resolved);
  assert.equal(
    resolved.resume.sections.experience[0].summary,
    beforeSummary.replace(oldSentence, optimizedSentence),
  );
  assert.equal(resolved.resume.sections.experience[1].summary, '<p>Unchanged</p>');
  assert.deepEqual(resolved.targetedSelection, targetSelection);

  const fallback = resolveResumePatchEvent(resume, { oldString: oldSentence, newString: optimizedSentence });
  assert.ok(fallback);
  assert.deepEqual(fallback.targetedSelection, targetSelection);

  const untouched = resolveResumePatchEvent(resume, { oldString: 'missing', newString: 'replacement' });
  assert.equal(untouched, null);

  const chatPatchBatch = resolveResumePatchBatch(resume, {
    oldString: oldSentence,
    newString: optimizedSentence,
  });
  assert.ok(chatPatchBatch);
  assert.equal(chatPatchBatch.kind, 'optimize');
  assert.equal(chatPatchBatch.proposedSections.experience[0].summary, beforeSummary.replace(oldSentence, optimizedSentence));
  assert.deepEqual(chatPatchBatch.targetedSelection, targetSelection);

  const translatePatchBatch = resolveResumePatchBatch(
    resume,
    { oldString: oldSentence, newString: optimizedSentence },
    { kind: 'translate', lang: 'English' },
  );
  assert.ok(translatePatchBatch);
  assert.equal(translatePatchBatch.kind, 'translate');
  assert.equal(translatePatchBatch.lang, 'English');
}

async function main() {
  await testAiSessionStore();
  testImportResumeValidation();
  testUtilityFunctions();
  testMcpAccessHelpers();
  testAiLib();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
