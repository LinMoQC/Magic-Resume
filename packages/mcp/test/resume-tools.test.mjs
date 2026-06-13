import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  applyResumePatch,
  buildEditablePaths,
  buildResumeDetail,
  buildResumeList,
  buildResumeSchemaGuide,
  previewResumePatch,
  resolveResumeId,
  serializeResumeContent,
  updateResumeContent,
} from '../dist/resume-tools.js';

const resumeContent = {
  id: 'resume_1',
  name: 'Frontend Resume',
  info: {
    fullName: 'Kairo Huang',
    headline: '',
    email: 'kairo@example.com',
    phoneNumber: '',
    address: '',
    website: '',
    avatar: '',
  },
  sections: {
    experience: [
      {
        id: 'exp_1',
        visible: true,
        company: 'Magic Resume',
        position: 'Frontend Engineer',
        date: '2026',
        location: 'Remote',
        website: '',
        summary: '<p>Built resume tools.</p>',
      },
    ],
    projects: [],
    education: [],
    skills: [],
    languages: [],
    certificates: [],
  },
  sectionOrder: [
    { key: 'basics', label: 'Basics' },
    { key: 'experience', label: 'sections.experience' },
  ],
  template: 'classic',
  themeColor: '#f97316',
  typography: 'inter',
};

const apiResume = {
  id: 'cloud_1',
  title: 'Frontend Resume',
  userId: 'user_1',
  content: JSON.stringify(resumeContent),
  isPublic: false,
  shareRole: 'VIEWER',
  createdAt: '2026-06-01T00:00:00.000Z',
  updatedAt: '2026-06-05T00:00:00.000Z',
  _count: { versions: 3 },
};

test('buildResumeList returns summaries without content', () => {
  const result = buildResumeList({
    code: 200,
    data: {
      data: [apiResume],
      total: 1,
      page: 1,
      limit: 10,
    },
  });

  assert.deepEqual(result.resumes, [
    {
      id: 'cloud_1',
      title: 'Frontend Resume',
      updatedAt: '2026-06-05T00:00:00.000Z',
      isPublic: false,
      shareRole: 'VIEWER',
      versionCount: 3,
    },
  ]);
  assert.equal('content' in result.resumes[0], false);
});

test('buildResumeDetail parses content and exposes editable paths', () => {
  const result = buildResumeDetail(apiResume);

  assert.equal(result.resumeId, 'cloud_1');
  assert.equal(result.title, 'Frontend Resume');
  assert.equal(result.content.info.fullName, 'Kairo Huang');
  assert.ok(result.editablePaths.includes('/info/headline'));
  assert.ok(result.editablePaths.includes('/sections/experience/0/summary'));
});

test('applyResumePatch updates parsed content without mutating the original object', () => {
  const result = applyResumePatch(resumeContent, [
    { op: 'replace', path: '/info/headline', value: 'Frontend Platform Engineer' },
  ]);

  assert.equal(result.content.info.headline, 'Frontend Platform Engineer');
  assert.equal(resumeContent.info.headline, '');
});

test('applyResumePatch rejects invalid patches that break the resume schema', () => {
  assert.throws(
    () => applyResumePatch(resumeContent, [
      { op: 'remove', path: '/info/fullName' },
    ]),
    /Resume patch produced invalid content/,
  );
});

test('serializeResumeContent returns the string payload Core expects', () => {
  const serialized = serializeResumeContent(resumeContent);
  assert.equal(typeof serialized, 'string');
  assert.deepEqual(JSON.parse(serialized).info, resumeContent.info);
});

test('resolveResumeId uses explicit id before configured default', () => {
  assert.equal(resolveResumeId('explicit', 'default'), 'explicit');
  assert.equal(resolveResumeId(undefined, 'default'), 'default');
  assert.throws(() => resolveResumeId(undefined, undefined), /Missing resumeId/);
});

test('buildResumeSchemaGuide documents HTML summary and patch flow', () => {
  const guide = buildResumeSchemaGuide();

  assert.ok(guide.templateIds.includes('classic'));
  assert.ok(guide.templateIds.includes('product-ops-focus'));
  assert.equal(guide.defaultResume.template, 'classic');
  assert.equal(guide.sampleResume.info.fullName, 'Alex Chen');
  assert.deepEqual(guide.jsonSchema.properties.template.enum, guide.templateIds);
  assert.ok(guide.editingRules.some((rule) => rule.includes('summary')));
  assert.ok(guide.commonPaths.includes('/sections/experience/0/summary'));
});

test('buildEditablePaths includes paths for section item fields', () => {
  const paths = buildEditablePaths(resumeContent);

  assert.ok(paths.includes('/sections/experience/0/company'));
  assert.ok(paths.includes('/sections/experience/0/summary'));
});

test('previewResumePatch reads latest content and does not write to Core', async () => {
  let writes = 0;
  const fakeApi = {
    getResume: async () => ({ code: 200, data: apiResume }),
    updateResume: async () => {
      writes += 1;
      throw new Error('preview must not write');
    },
  };

  const result = await previewResumePatch(fakeApi, 'cloud_1', [
    { op: 'replace', path: '/info/headline', value: 'Preview headline' },
  ]);

  assert.equal(writes, 0);
  assert.equal(result.writesToCore, false);
  assert.equal(result.content.info.headline, 'Preview headline');
});

test('updateResumeContent reads latest content, patches it, and writes serialized content to Core', async () => {
  const calls = [];
  const fakeApi = {
    getResume: async () => ({ code: 200, data: apiResume }),
    updateResume: async (resumeId, input) => {
      calls.push({ resumeId, input });
      return {
        code: 200,
        data: {
          ...apiResume,
          content: input.content,
          updatedAt: '2026-06-05T01:00:00.000Z',
        },
      };
    },
  };

  const result = await updateResumeContent(fakeApi, 'cloud_1', [
    { op: 'replace', path: '/info/headline', value: 'Persisted headline' },
  ], 'Polish headline');

  assert.equal(calls.length, 1);
  assert.equal(calls[0].resumeId, 'cloud_1');
  assert.equal(calls[0].input.title, 'Frontend Resume');
  assert.equal(typeof calls[0].input.content, 'string');
  assert.equal(JSON.parse(calls[0].input.content).info.headline, 'Persisted headline');
  assert.equal(result.changelog, 'Polish headline');
  assert.equal(result.persisted.content.info.headline, 'Persisted headline');
});
