import { MagicTemplateDSL } from '../types/magic-dsl';

export const DEFAULT_DESIGN_TOKENS: MagicTemplateDSL['designTokens'] = {
  colors: {
    primary: '#3b82f6',
    secondary: '#1e40af',
    text: '#1f2937',
    textSecondary: '#6b7280',
    background: '#ffffff',
    border: '#d1d5db',
  },
  typography: {
    fontFamily: {
      primary: 'Inter, -apple-system, BlinkMacSystemFont, sans-serif',
    },
    fontSize: {
      xs: '10px',
      sm: '12px',
      md: '14px',
      lg: '16px',
      xl: '20px',
      xxl: '24px',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      bold: 700,
    },
    lineHeight: 1.5,
    letterSpacing: '0px',
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
  },
  borderRadius: {
    none: '0',
    sm: '0.125rem',
    md: '0.375rem',
    lg: '0.5rem',
  },
};

export const DEFAULT_FIELD_MAPS = {
  defaultSection: {
    mainTitle: ['company', 'project', 'school', 'name', 'title', 'platform'],
    mainSubtitle: ['location', 'major'],
    secondarySubtitle: [] as string[],
    sideTitle: ['date'],
    sideSubtitle: ['position', 'degree'],
    secondarySideSubtitle: [] as string[],
    description: ['summary', 'description'],
  },
  listSection: {
    itemName: ['skill', 'award', 'language', 'certificate', 'name', 'title'],
    itemDetail: ['level'],
    date: ['date'],
    summary: ['summary'],
  },
  timeline: {
    experience: {
      title: ['company'],
      subtitle: ['position'],
      date: ['date'],
      description: ['summary'],
    },
    education: {
      title: ['school'],
      subtitle: ['degree', 'major'],
      date: ['date'],
      description: ['summary'],
    },
    certificates: {
      title: ['certificate', 'name'],
      subtitle: ['level'],
      date: ['date'],
      description: ['summary'],
    },
    projects: {
      title: ['name'],
      subtitle: ['role'],
      date: ['date'],
      description: ['summary'],
    },
    profiles: {
      title: ['name', 'platform'],
      subtitle: ['username'],
      date: ['date'],
      description: ['summary'],
    },
  },
  compactList: {
    skills: { title: ['name', 'skill'] },
    languages: { title: ['language', 'name'], level: ['level'] },
    certificates: { title: ['certificate', 'name'] },
  },
} as const;

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export function mergeDesignTokens(
  overrides: DeepPartial<MagicTemplateDSL['designTokens']>
): MagicTemplateDSL['designTokens'] {
  return {
    colors: { ...DEFAULT_DESIGN_TOKENS.colors, ...overrides.colors },
    typography: {
      ...DEFAULT_DESIGN_TOKENS.typography,
      ...overrides.typography,
      fontFamily: {
        ...DEFAULT_DESIGN_TOKENS.typography.fontFamily,
        ...overrides.typography?.fontFamily,
      },
      fontSize: {
        ...DEFAULT_DESIGN_TOKENS.typography.fontSize,
        ...overrides.typography?.fontSize,
      },
      fontWeight: {
        ...DEFAULT_DESIGN_TOKENS.typography.fontWeight,
        ...overrides.typography?.fontWeight,
      },
    },
    spacing: { ...DEFAULT_DESIGN_TOKENS.spacing, ...overrides.spacing },
    borderRadius: { ...DEFAULT_DESIGN_TOKENS.borderRadius, ...overrides.borderRadius },
  };
}
