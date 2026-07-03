import { z, type ZodError } from 'zod';

const importedResumeInfoSchema = z.object({
  fullName: z.string().default(''),
  headline: z.string().default(''),
  email: z.string().default(''),
  phoneNumber: z.string().default(''),
  address: z.string().default(''),
  website: z.string().default(''),
  avatar: z.string().default(''),
});

const importedResumeSectionItemSchema = z
  .object({
    id: z.string(),
    visible: z.boolean().default(true),
    company: z.string().nullable().default(null),
    position: z.string().nullable().default(null),
    date: z.string().nullable().default(null),
    location: z.string().nullable().default(null),
    website: z.string().nullable().default(null),
    summary: z.string().nullable().default(null),
    name: z.string().nullable().default(null),
    role: z.string().nullable().default(null),
    link: z.string().nullable().default(null),
    school: z.string().nullable().default(null),
    degree: z.string().nullable().default(null),
    major: z.string().nullable().default(null),
    level: z.string().nullable().default(null),
    language: z.string().nullable().default(null),
    issuer: z.string().nullable().default(null),
    platform: z.string().nullable().default(null),
    url: z.string().nullable().default(null),
    description: z.string().nullable().default(null),
  })
  .passthrough();

const importedResumeSectionOrderItemSchema = z.object({
  key: z.string(),
  label: z.string(),
});

const importedResumeSectionsSchema = z
  .object({
    experience: z.array(importedResumeSectionItemSchema).default([]),
    education: z.array(importedResumeSectionItemSchema).default([]),
    projects: z.array(importedResumeSectionItemSchema).default([]),
    skills: z.array(importedResumeSectionItemSchema).default([]),
    languages: z.array(importedResumeSectionItemSchema).default([]),
    certificates: z.array(importedResumeSectionItemSchema).default([]),
  })
  .passthrough();

export const importedResumeSchema = z.object({
  info: importedResumeInfoSchema,
  sections: importedResumeSectionsSchema,
  sectionOrder: z.array(importedResumeSectionOrderItemSchema).min(1),
});

export type ImportedResume = z.infer<typeof importedResumeSchema> & Record<string, unknown>;

export function validateAndNormalizeImportedResume(data: unknown): ImportedResume {
  const parsed = importedResumeSchema.parse(data);
  const raw = { ...(data as Record<string, unknown>) };

  delete raw.isPublic;
  delete raw.shareId;
  delete raw.shareRole;

  return {
    ...raw,
    info: parsed.info,
    sections: parsed.sections,
    sectionOrder: parsed.sectionOrder,
  };
}

export function formatResumeImportValidationError(error: ZodError): string {
  const issues = error.issues.map((issue) => `${issue.path.join('.')}: ${issue.message}`).join('; ');
  return `Invalid resume format: ${issues}`;
}

export function formatResumeImportError(error: unknown, fallbackMessage: string): string {
  if (error instanceof z.ZodError) {
    return formatResumeImportValidationError(error);
  }

  return error instanceof Error ? error.message : fallbackMessage;
}
