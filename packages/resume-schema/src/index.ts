import { z } from 'zod';

export const templateIds = [
  'classic',
  'azurill',
  'bronzor',
  'chikorita',
  'ditto',
  'gengar',
  'orange-modern',
  'clean-minimal',
  'teal-professional',
  'red-accent',
  'golden-elegant',
  'product-ops-focus',
] as const;

export const templateSchema = z.enum(templateIds);

export const customInfoFieldSchema = z.object({
  id: z.string(),
  name: z.string(),
  value: z.string(),
});

export const infoSchema = z.object({
  fullName: z.string(),
  headline: z.string(),
  email: z.string(),
  phoneNumber: z.string(),
  address: z.string(),
  website: z.string(),
  avatar: z.string(),
  customFields: z.array(customInfoFieldSchema).optional(),
});

export const sectionItemSchema = z
  .object({
    id: z.string(),
    visible: z.boolean(),
  })
  .catchall(z.unknown());

export const sectionOrderItemSchema = z.object({
  key: z.string(),
  label: z.string(),
});

export const resumeSchema = z.object({
  id: z.string().optional(),
  userId: z.string().optional(),
  name: z.string(),
  updatedAt: z.number().optional(),
  info: infoSchema,
  sections: z.record(z.array(sectionItemSchema)),
  sectionOrder: z.array(sectionOrderItemSchema),
  template: templateSchema.catch('classic'),
  customTemplate: z.record(z.unknown()).optional(),
  themeColor: z.string(),
  typography: z.string(),
  isPublic: z.boolean().optional(),
  shareId: z.string().optional(),
  shareRole: z.enum(['VIEWER', 'COMMENTER', 'EDITOR']).optional(),
});

export const resumeUpdateBaseSchema = z.object({
  resumeId: z.string(),
  expectedUpdatedAt: z.number().optional(),
  changelog: z.string().optional(),
});

export const updateInfoInputSchema = resumeUpdateBaseSchema.extend({
  info: infoSchema.partial(),
});

export const updateSectionItemsInputSchema = resumeUpdateBaseSchema.extend({
  sectionKey: z.string(),
  items: z.array(sectionItemSchema),
});

export const reorderSectionsInputSchema = resumeUpdateBaseSchema.extend({
  sectionOrder: z.array(sectionOrderItemSchema),
});

export const updateTemplateInputSchema = resumeUpdateBaseSchema.extend({
  template: templateSchema.optional(),
  themeColor: z.string().optional(),
  typography: z.string().optional(),
  customTemplate: z.record(z.unknown()).optional(),
});

const defaultSectionKeys = [
  'experience',
  'education',
  'projects',
  'skills',
  'languages',
  'certificates',
  'profiles',
] as const;

export const defaultResume = {
  name: 'Untitled Resume',
  info: {
    fullName: '',
    headline: '',
    email: '',
    phoneNumber: '',
    address: '',
    website: '',
    avatar: '',
    customFields: [],
  },
  sections: Object.fromEntries(defaultSectionKeys.map((key) => [key, []])),
  sectionOrder: defaultSectionKeys.map((key) => ({
    key,
    label: key.charAt(0).toUpperCase() + key.slice(1),
  })),
  template: 'classic',
  customTemplate: {},
  themeColor: '#f97316',
  typography: 'inter',
} satisfies Resume;

export const sampleResume = {
  ...defaultResume,
  name: 'Sample Resume',
  info: {
    ...defaultResume.info,
    fullName: 'Alex Chen',
    headline: 'Product-minded Frontend Engineer',
    email: 'alex@example.com',
    phoneNumber: '+1 555 0100',
    address: 'San Francisco, CA',
    website: 'https://example.com',
  },
  sections: {
    ...defaultResume.sections,
    experience: [
      {
        id: 'sample-experience-1',
        visible: true,
        company: 'Magic Labs',
        position: 'Frontend Engineer',
        location: 'Remote',
        date: '2023 - Present',
        summary: '<p>Built polished resume editing workflows with TypeScript, React, and structured AI assistance.</p>',
      },
    ],
    projects: [
      {
        id: 'sample-project-1',
        visible: true,
        name: 'Magic Resume MCP',
        description: '<p>Connected resume data to AI coding tools through schema-aware JSON Patch operations.</p>',
      },
    ],
    skills: [
      {
        id: 'sample-skill-1',
        visible: true,
        name: 'TypeScript',
        level: 'Advanced',
      },
    ],
  },
} satisfies Resume;

export const resumeJsonSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://magic-resume.cn/schema/resume.schema.json',
  title: 'Magic Resume',
  type: 'object',
  additionalProperties: true,
  required: ['name', 'info', 'sections', 'sectionOrder', 'template', 'themeColor', 'typography'],
  properties: {
    id: { type: 'string' },
    userId: { type: 'string' },
    name: { type: 'string' },
    updatedAt: { type: 'number' },
    info: {
      type: 'object',
      required: ['fullName', 'headline', 'email', 'phoneNumber', 'address', 'website', 'avatar'],
      properties: {
        fullName: { type: 'string' },
        headline: { type: 'string' },
        email: { type: 'string' },
        phoneNumber: { type: 'string' },
        address: { type: 'string' },
        website: { type: 'string' },
        avatar: { type: 'string' },
        customFields: {
          type: 'array',
          items: {
            type: 'object',
            required: ['id', 'name', 'value'],
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
              value: { type: 'string' },
            },
          },
        },
      },
    },
    sections: {
      type: 'object',
      additionalProperties: {
        type: 'array',
        items: {
          type: 'object',
          required: ['id', 'visible'],
          additionalProperties: true,
          properties: {
            id: { type: 'string' },
            visible: { type: 'boolean' },
          },
        },
      },
    },
    sectionOrder: {
      type: 'array',
      items: {
        type: 'object',
        required: ['key', 'label'],
        properties: {
          key: { type: 'string' },
          label: { type: 'string' },
        },
      },
    },
    template: { type: 'string', enum: [...templateIds], default: 'classic' },
    customTemplate: { type: 'object', additionalProperties: true },
    themeColor: { type: 'string' },
    typography: { type: 'string' },
    isPublic: { type: 'boolean' },
    shareId: { type: 'string' },
    shareRole: { type: 'string', enum: ['VIEWER', 'COMMENTER', 'EDITOR'] },
  },
} as const;

export type TemplateId = z.infer<typeof templateSchema>;
export type CustomInfoField = z.infer<typeof customInfoFieldSchema>;
export type Info = z.infer<typeof infoSchema>;
export type SectionItem = z.infer<typeof sectionItemSchema>;
export type SectionOrderItem = z.infer<typeof sectionOrderItemSchema>;
export type Resume = z.infer<typeof resumeSchema>;
export type ResumeUpdateBase = z.infer<typeof resumeUpdateBaseSchema>;
export type UpdateInfoInput = z.infer<typeof updateInfoInputSchema>;
export type UpdateSectionItemsInput = z.infer<typeof updateSectionItemsInputSchema>;
export type ReorderSectionsInput = z.infer<typeof reorderSectionsInputSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateInputSchema>;
