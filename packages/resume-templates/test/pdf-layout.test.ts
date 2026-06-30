import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { MagicTemplateDSL } from '../src/types/magic-dsl';
import { planPdfLayout } from '../src/pdf/layout';

const baseTemplate: MagicTemplateDSL = {
  id: 'test',
  name: 'Test',
  version: '1.0.0',
  description: '',
  thumbnailUrl: '',
  tags: [],
  status: 'PUBLISHED',
  createdAt: '',
  updatedAt: '',
  designTokens: {
    colors: {
      primary: '#111111',
      secondary: '#222222',
      text: '#333333',
      textSecondary: '#555555',
      background: '#ffffff',
      border: '#dddddd',
      sidebar: '#111111',
    },
    typography: {
      fontFamily: { primary: 'Source Han Sans SC' },
      fontSize: { xs: '10px', sm: '12px', md: '14px', lg: '16px', xl: '20px', xxl: '24px' },
      fontWeight: { normal: 400, medium: 500, bold: 700 },
    },
    spacing: { xs: '4px', sm: '8px', md: '12px', lg: '16px', xl: '24px' },
    borderRadius: { none: '0', sm: '2px', md: '4px', lg: '8px' },
  },
  layout: {
    type: 'two-column',
    containerWidth: '794px',
    padding: '32px',
    gap: '24px',
    twoColumn: { leftWidth: '210px', rightWidth: '536px', gap: '24px' },
  },
  components: [
    { id: 'profile', type: 'ProfileCard', dataBinding: 'info', position: { area: 'sidebar', order: 0 } },
    { id: 'header', type: 'Header', dataBinding: 'info', position: { area: 'main', order: 0 } },
    { id: 'skills', type: 'CompactList', dataBinding: 'sections.skills', position: { area: 'sidebar', order: 1 } },
    { id: 'summary', type: 'DefaultSection', dataBinding: 'sections.summary', position: { area: 'main', order: 1 } },
    { id: 'experience', type: 'Timeline', dataBinding: 'sections.experience', position: { area: 'main', order: 2 } },
    { id: 'projects', type: 'DefaultSection', dataBinding: 'sections.projects', position: { area: 'main', order: 3 } },
  ],
};

const resume = {
  sectionOrder: [
    { key: 'summary', label: 'Summary' },
    { key: 'experience', label: 'Experience' },
    { key: 'projects', label: 'Projects' },
  ],
  sections: {
    summary: [{ id: 'summary', visible: true, summary: 'Text' }],
    experience: [{ id: 'exp', visible: true, company: 'Acme' }],
    projects: [{ id: 'project', visible: false, name: 'Hidden' }],
    skills: [{ id: 'skill', visible: true, name: 'TypeScript' }],
  },
};

describe('pdf layout planner', () => {
  it('builds a default page from visible components and resume section order', () => {
    const plan = planPdfLayout(baseTemplate, resume);

    assert.deepEqual(plan.pages, [
      {
        fullWidth: false,
        main: ['header', 'summary', 'experience'],
        sidebar: ['profile', 'skills'],
      },
    ]);
  });

  it('resolves explicit pdfLayout entries by section key, data binding, or component id', () => {
    const plan = planPdfLayout(
      {
        ...baseTemplate,
        pdfLayout: {
          pages: [
            { main: ['header', 'sections.summary'], sidebar: ['skills'] },
            { fullWidth: true, main: ['experience'], sidebar: ['profile'] },
          ],
          sidebarWidth: 28,
        },
      },
      resume,
    );

    assert.deepEqual(plan.pages, [
      { fullWidth: false, main: ['header', 'summary'], sidebar: ['skills'] },
      { fullWidth: true, main: ['experience'], sidebar: ['profile'] },
    ]);
    assert.equal(plan.sidebarWidth, 28);
  });
});
