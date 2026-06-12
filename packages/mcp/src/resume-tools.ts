import fastJsonPatch, { type Operation } from 'fast-json-patch';
import {
  defaultResume,
  resumeJsonSchema,
  resumeSchema,
  sampleResume,
  templateIds,
} from '@magic-resume/resume-schema';
import type { MagicResumeApiClient } from './client.js';

const { applyPatch } = fastJsonPatch;

type ApiResume = {
  id: string;
  title?: string;
  userId?: string;
  content?: unknown;
  isPublic?: boolean;
  shareId?: string;
  shareRole?: string;
  createdAt?: string;
  updatedAt?: string;
  _count?: {
    versions?: number;
  };
};

type ResumeListApiPayload = {
  code?: number;
  message?: string;
  data?: {
    data?: ApiResume[];
    total?: number;
    page?: number;
    limit?: number;
  };
};

export type JsonPatchOperation = Operation;
type ResumePatchApi = Pick<MagicResumeApiClient, 'getResume' | 'updateResume'>;

export function buildResumeList(payload: unknown) {
  const apiPayload = payload as ResumeListApiPayload;
  const listData = apiPayload.data;
  const resumes = Array.isArray(listData?.data) ? listData.data : [];

  return {
    code: apiPayload.code,
    message: apiPayload.message,
    total: listData?.total ?? resumes.length,
    page: listData?.page,
    limit: listData?.limit,
    resumes: resumes.map((resume) => ({
      id: resume.id,
      title: resume.title ?? resume.id,
      updatedAt: resume.updatedAt,
      isPublic: Boolean(resume.isPublic),
      shareRole: resume.shareRole,
      versionCount: resume._count?.versions ?? 0,
    })),
  };
}

export function buildResumeDetail(apiResume: unknown) {
  const resume = unwrapApiData(apiResume) as ApiResume;
  const content = parseResumeContent(resume);

  return {
    resumeId: resume.id,
    title: resume.title ?? content.name ?? resume.id,
    updatedAt: resume.updatedAt,
    isPublic: Boolean(resume.isPublic),
    shareId: resume.shareId,
    shareRole: resume.shareRole,
    content,
    editablePaths: buildEditablePaths(content),
  };
}

export function parseResumeContent(apiResume: ApiResume) {
  const rawContent = apiResume.content;

  if (typeof rawContent === 'string') {
    try {
      return JSON.parse(rawContent);
    } catch (error) {
      throw new Error(`Failed to parse resume content JSON for resume ${apiResume.id}: ${getErrorMessage(error)}`);
    }
  }

  if (rawContent && typeof rawContent === 'object') {
    return rawContent as Record<string, unknown>;
  }

  throw new Error(`Resume ${apiResume.id} has no readable content.`);
}

export function serializeResumeContent(content: unknown): string {
  return JSON.stringify(content);
}

export function applyResumePatch(content: unknown, patch: JsonPatchOperation[]) {
  const clonedContent = cloneJson(content);
  const { newDocument } = applyPatch(clonedContent, patch, true, true);
  const validation = resumeSchema.safeParse(newDocument);

  if (!validation.success) {
    throw new Error(`Resume patch produced invalid content: ${validation.error.message}`);
  }

  return {
    content: validation.data,
    editablePaths: buildEditablePaths(validation.data),
  };
}

export async function previewResumePatch(api: ResumePatchApi, resumeId: string, patch: JsonPatchOperation[]) {
  const detail = buildResumeDetail(await api.getResume(resumeId));
  const preview = applyResumePatch(detail.content, patch);

  return {
    resumeId,
    title: detail.title,
    writesToCore: false,
    patch,
    content: preview.content,
    editablePaths: preview.editablePaths,
  };
}

export async function updateResumeContent(
  api: ResumePatchApi,
  resumeId: string,
  patch: JsonPatchOperation[],
  changelog?: string,
) {
  const detail = buildResumeDetail(await api.getResume(resumeId));
  const next = applyResumePatch(detail.content, patch);
  const updated = await api.updateResume(resumeId, {
    title: detail.title,
    content: serializeResumeContent(next.content),
  });

  return {
    resumeId,
    title: detail.title,
    changelog,
    patch,
    persisted: buildResumeDetail(updated),
  };
}

export function resolveResumeId(inputResumeId?: string, defaultResumeId?: string): string {
  const resumeId = inputResumeId || defaultResumeId;
  if (!resumeId) {
    throw new Error('Missing resumeId. Pass resumeId or configure --default-resume-id.');
  }

  return resumeId;
}

export function buildResumeSchemaGuide() {
  return {
    schemaName: 'Magic Resume structured resume content',
    rootFields: {
      id: 'optional string, cloud resume id',
      name: 'resume display name',
      info: 'contact and headline object',
      sections: 'record of section arrays, keyed by section type',
      sectionOrder: 'ordered array controlling rendered section order',
      template: 'template id from templateIds',
      themeColor: 'hex color string',
      typography: 'font/theme id',
    },
    templateIds,
    defaultTemplate: 'classic',
    defaultResume,
    sampleResume,
    jsonSchema: resumeJsonSchema,
    infoFields: ['fullName', 'headline', 'email', 'phoneNumber', 'address', 'website', 'avatar', 'customFields'],
    sectionItemFields: {
      required: ['id', 'visible'],
      common: ['company', 'position', 'date', 'location', 'website', 'summary', 'name', 'role', 'link', 'school', 'degree', 'major', 'level', 'language', 'issuer', 'platform', 'url', 'description'],
    },
    commonPaths: [
      '/info/fullName',
      '/info/headline',
      '/info/email',
      '/sections/experience/0/company',
      '/sections/experience/0/position',
      '/sections/experience/0/summary',
      '/sections/projects/0/name',
      '/sections/projects/0/summary',
      '/sections/skills/0/name',
      '/sectionOrder/0/key',
    ],
    editingRules: [
      'Always call list_resumes and get_resume before editing unless the user already supplied a resumeId and current content.',
      'Use preview_resume_patch before update_resume_content for non-trivial edits.',
      'summary fields are HTML strings. Preserve HTML markup such as <p>, <ul>, <li>, and <strong>; do not convert summary into arrays or plain bullet objects.',
      `When changing templates, use only one of these template ids: ${templateIds.join(', ')}.`,
      'Do not remove id, visible, sectionOrder, or unknown fields unless the user explicitly asks.',
      'Prefer small RFC6902 JSON Patch operations over replacing the entire content object.',
    ],
  };
}

export function buildResumeEditingGuide() {
  return {
    workflow: [
      'Call list_resumes to find the target resume.',
      'Call get_resume to inspect the latest structured content and editablePaths.',
      'Create a small RFC6902 patch that touches only fields requested by the user.',
      'Call preview_resume_patch to validate and inspect the patched content locally.',
      'Call update_resume_content with the same patch and a concise changelog.',
      'Call get_resume again only if you need to verify the persisted result.',
    ],
    patchExamples: [
      {
        task: 'Update headline',
        patch: [{ op: 'replace', path: '/info/headline', value: 'Frontend Platform Engineer' }],
      },
      {
        task: 'Polish first experience summary',
        patch: [{ op: 'replace', path: '/sections/experience/0/summary', value: '<p><strong>Platform engineering</strong></p><ul><li><p>Built reliable frontend tooling for resume workflows.</p></li></ul>' }],
      },
    ],
    forbidden: [
      'Do not call update_resume_content before reading the latest resume.',
      'Do not replace the full content object for a small text edit.',
      `Do not set template to an unknown value. Valid template ids: ${templateIds.join(', ')}.`,
      'Do not delete unknown fields, customTemplate, sectionOrder, or item ids.',
      'Do not change unrelated sections or fabricate dates, employers, schools, or metrics.',
      'Do not convert HTML summary strings into markdown or arrays.',
    ],
  };
}

export function buildEditablePaths(content: Record<string, unknown>): string[] {
  const paths = new Set<string>();

  const info = content.info;
  if (info && typeof info === 'object') {
    for (const key of Object.keys(info)) {
      paths.add(`/info/${escapeJsonPointer(key)}`);
    }
  }

  const sections = content.sections;
  if (sections && typeof sections === 'object') {
    for (const [sectionKey, value] of Object.entries(sections)) {
      if (!Array.isArray(value)) continue;

      value.forEach((item, index) => {
        if (!item || typeof item !== 'object') return;
        for (const key of Object.keys(item)) {
          paths.add(`/sections/${escapeJsonPointer(sectionKey)}/${index}/${escapeJsonPointer(key)}`);
        }
      });
    }
  }

  const sectionOrder = content.sectionOrder;
  if (Array.isArray(sectionOrder)) {
    sectionOrder.forEach((item, index) => {
      if (!item || typeof item !== 'object') return;
      for (const key of Object.keys(item)) {
        paths.add(`/sectionOrder/${index}/${escapeJsonPointer(key)}`);
      }
    });
  }

  return [...paths].sort();
}

function unwrapApiData(payload: unknown): unknown {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    const data = (payload as { data?: unknown }).data;
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      return data;
    }
  }

  return payload;
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function escapeJsonPointer(value: string): string {
  return value.replace(/~/g, '~0').replace(/\//g, '~1');
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
