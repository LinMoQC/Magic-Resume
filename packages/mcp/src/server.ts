import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { getTemplateManifestList } from '@magic-resume/resume-templates/registry';
import { z } from 'zod';
import { createApiClient } from './client.js';
import { loadConfig } from './config.js';
import {
  applyResumePatch,
  buildResumeDetail,
  buildResumeEditingGuide,
  buildResumeList,
  buildResumeSchemaGuide,
  type JsonPatchOperation,
  previewResumePatch,
  resolveResumeId,
  updateResumeContent,
} from './resume-tools.js';

const jsonPatchOperationSchema = z.object({
  op: z.enum(['add', 'remove', 'replace', 'move', 'copy', 'test']),
  path: z.string(),
  value: z.unknown().optional(),
  from: z.string().optional(),
});

export async function startMcpServer(): Promise<void> {
  const config = await loadConfig();

  if (!config.token) {
    throw new Error('Magic Resume MCP is not configured. Run: magic-resume config set --api-url <url> --pat <token>');
  }

  const api = createApiClient({
    apiUrl: config.apiUrl,
    token: config.token,
  });

  const server = new McpServer({
    name: 'magic-resume',
    version: '0.1.0',
  });

  server.registerResource(
    'magic-resume-schema',
    'resume://schema',
    {
      title: 'Magic Resume Schema',
      description: 'Structured resume schema, valid template ids, default resume, and sample resume.',
      mimeType: 'application/json',
    },
    async () => resourceResult('resume://schema', buildResumeSchemaGuide()),
  );

  server.registerResource(
    'magic-resume-templates',
    'resume://templates',
    {
      title: 'Magic Resume Templates',
      description: 'Available Magic Resume templates with ids, names, tags, status, and thumbnails.',
      mimeType: 'application/json',
    },
    async () => resourceResult('resume://templates', {
      templates: getTemplateManifestList().map(({ template: _template, ...manifest }) => manifest),
    }),
  );

  server.registerResource(
    'magic-resume-editing-guide',
    'resume://editing-guide',
    {
      title: 'Magic Resume Editing Guide',
      description: 'Recommended safe workflow for AI agents editing Magic Resume content.',
      mimeType: 'application/json',
    },
    async () => resourceResult('resume://editing-guide', buildResumeEditingGuide()),
  );

  server.registerPrompt(
    'build_resume',
    {
      title: 'Build a Magic Resume',
      description: 'Guide an AI agent to create or substantially draft Magic Resume content from user-provided background.',
      argsSchema: {
        targetRole: z.string().optional().describe('Target role or job family for the resume.'),
        background: z.string().optional().describe('User-provided experience, education, projects, and skills.'),
      },
    },
    async ({ targetRole, background }) => promptResult(
      `Build a Magic Resume draft for ${targetRole || 'the target role'}.

Use resume://schema before writing content. Preserve the Magic Resume JSON shape, keep summary-like fields as HTML strings, and prefer concise ATS-friendly language.

User background:
${background || '(Ask the user for background before drafting.)'}`,
    ),
  );

  server.registerPrompt(
    'review_resume',
    {
      title: 'Review a Magic Resume',
      description: 'Review a resume for clarity, impact, structure, and schema-safe edit opportunities.',
      argsSchema: {
        resumeId: z.string().optional().describe('Resume id to review.'),
        focus: z.string().optional().describe('Optional review focus, such as ATS, frontend roles, leadership, or concision.'),
      },
    },
    async ({ resumeId, focus }) => promptResult(
      `Review the Magic Resume${resumeId ? ` with id ${resumeId}` : ''}.

Workflow:
1. Read resume://editing-guide.
2. Call list_resumes if no resumeId is provided.
3. Call get_resume to inspect the current content.
4. Provide findings first, then suggest small JSON Patch edits.
5. Use preview_resume_patch before any update.

Review focus: ${focus || 'overall clarity, relevance, and impact.'}`,
    ),
  );

  server.registerPrompt(
    'tailor_resume',
    {
      title: 'Tailor a Magic Resume',
      description: 'Tailor an existing resume to a job description using schema-safe JSON Patch edits.',
      argsSchema: {
        resumeId: z.string().optional().describe('Resume id to tailor.'),
        jobDescription: z.string().describe('Target job description.'),
      },
    },
    async ({ resumeId, jobDescription }) => promptResult(
      `Tailor the Magic Resume${resumeId ? ` with id ${resumeId}` : ''} to this job description.

Use this exact workflow: list_resumes if needed, get_resume, identify only relevant edits, preview_resume_patch, then update_resume_content with a concise changelog. Do not fabricate employers, dates, schools, or metrics. Keep summary fields as HTML strings.

Job description:
${jobDescription}`,
    ),
  );

  server.registerPrompt(
    'improve_resume',
    {
      title: 'Improve a Magic Resume',
      description: 'Improve an existing resume according to a user request while preserving unknown fields.',
      argsSchema: {
        resumeId: z.string().optional().describe('Resume id to improve.'),
        request: z.string().describe('User request describing what to improve.'),
      },
    },
    async ({ resumeId, request }) => promptResult(
      `Improve the Magic Resume${resumeId ? ` with id ${resumeId}` : ''}.

Follow resume://editing-guide. Make small, targeted RFC6902 patches. Preserve id, visible, sectionOrder, customTemplate, and unknown fields. Use only valid template ids from resume://schema.

User request:
${request}`,
    ),
  );

  server.registerTool(
    'list_resumes',
    {
      title: 'List Magic Resume resumes',
      description: 'List resume summaries owned by the authenticated Magic Resume user. Use this first to find the target resumeId. This intentionally omits full content to keep AI context small.',
      inputSchema: {},
    },
    async () => textResult(buildResumeList(await api.listResumes())),
  );

  server.registerTool(
    'get_resume',
    {
      title: 'Get Magic Resume resume',
      description: 'Get the latest structured resume content by ID. If resumeId is omitted, the configured default resume is used. Read this before editing so patches are based on current content.',
      inputSchema: {
        resumeId: z.string().optional(),
      },
    },
    async ({ resumeId }) => {
      const targetResumeId = resolveResumeId(resumeId, config.defaultResumeId);
      return textResult(buildResumeDetail(await api.getResume(targetResumeId)));
    },
  );

  server.registerTool(
    'get_resume_schema',
    {
      title: 'Get Magic Resume schema guide',
      description: 'Return the Magic Resume content schema, common editable paths, and field rules. Use this when deciding how to construct JSON Patch operations.',
      inputSchema: {},
    },
    async () => textResult(buildResumeSchemaGuide()),
  );

  server.registerTool(
    'get_resume_editing_guide',
    {
      title: 'Get Magic Resume editing guide',
      description: 'Return the recommended AI workflow for editing resumes safely through MCP. Use this before modifying a resume when the user asks for resume changes.',
      inputSchema: {},
    },
    async () => textResult(buildResumeEditingGuide()),
  );

  server.registerTool(
    'preview_resume_patch',
    {
      title: 'Preview Magic Resume JSON Patch',
      description: 'Apply an RFC6902 JSON Patch to the latest resume content locally and return the patched content without writing to Core. Use this before update_resume_content for non-trivial edits.',
      inputSchema: {
        resumeId: z.string().optional(),
        patch: z.array(jsonPatchOperationSchema),
      },
    },
    async ({ resumeId, patch }) => {
      const targetResumeId = resolveResumeId(resumeId, config.defaultResumeId);
      const jsonPatch = patch as JsonPatchOperation[];
      return textResult(await previewResumePatch(api, targetResumeId, jsonPatch));
    },
  );

  server.registerTool(
    'update_resume_content',
    {
      title: 'Update Magic Resume content with JSON Patch',
      description: 'Safely update a resume by reading the latest content, applying a small RFC6902 JSON Patch locally, validating the full resume schema, then writing the serialized content to Core. Do not use this before get_resume/preview_resume_patch unless the user explicitly asks for a direct edit.',
      inputSchema: {
        resumeId: z.string().optional(),
        patch: z.array(jsonPatchOperationSchema),
        changelog: z.string().optional(),
      },
    },
    async ({ resumeId, patch, changelog }) => {
      const targetResumeId = resolveResumeId(resumeId, config.defaultResumeId);
      const jsonPatch = patch as JsonPatchOperation[];
      return textResult(await updateResumeContent(api, targetResumeId, jsonPatch, changelog));
    },
  );

  await server.connect(new StdioServerTransport());
}

function textResult(value: unknown) {
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(value, null, 2),
      },
    ],
  };
}

function resourceResult(uri: string, value: unknown) {
  return {
    contents: [
      {
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(value, null, 2),
      },
    ],
  };
}

function promptResult(text: string) {
  return {
    messages: [
      {
        role: 'user' as const,
        content: {
          type: 'text' as const,
          text,
        },
      },
    ],
  };
}
