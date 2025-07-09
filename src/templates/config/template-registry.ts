import { MagicTemplateDSL } from '../types/magic-dsl';
import { classicTemplate } from './classic-template';
import { azurillTemplate } from './azurill-template';
import { bronzorTemplate } from './bronzor-template';
import { chikoritaTemplate } from './chikorita-template';
import { dittoTemplate } from './ditto-template';
import { gengarTemplate } from './gengar-template';

// 模板分类定义
export const TEMPLATE_CATEGORIES = {
  PROFESSIONAL: 'professional',
  CREATIVE: 'creative',
  MINIMAL: 'minimal',
  MODERN: 'modern',
  CLASSIC: 'classic',
  TECH: 'tech'
} as const;

// 模板标签定义
export const TEMPLATE_TAGS = {
  ATS_FRIENDLY: 'ats-friendly',
  SERIF: 'serif',
  SANS_SERIF: 'sans-serif',
  TWO_COLUMN: 'two-column',
  SINGLE_COLUMN: 'single-column',
  SIDEBAR: 'sidebar',
  COLORFUL: 'colorful',
  MONOCHROME: 'monochrome'
} as const;

export type TemplateTag = typeof TEMPLATE_TAGS[keyof typeof TEMPLATE_TAGS];

// 模板注册表
export const TEMPLATE_REGISTRY: Record<string, MagicTemplateDSL> = {
  classic: classicTemplate,
  azurill: azurillTemplate,
  bronzor: bronzorTemplate,
  chikorita: chikoritaTemplate,
  ditto: dittoTemplate,
  gengar: gengarTemplate,
};

// 模板元数据
export const TEMPLATE_METADATA = {
  classic: {
    category: TEMPLATE_CATEGORIES.CLASSIC,
    tags: [TEMPLATE_TAGS.ATS_FRIENDLY, TEMPLATE_TAGS.SERIF, TEMPLATE_TAGS.SINGLE_COLUMN] as TemplateTag[],
    popularity: 0.95,
    lastUpdated: '2025-01-20',
    previewUrl: '/thumbnails/classic.png',
    features: ['Professional', 'ATS-friendly', 'Clean layout']
  },
  azurill: {
    category: TEMPLATE_CATEGORIES.MODERN,
    tags: [TEMPLATE_TAGS.SANS_SERIF, TEMPLATE_TAGS.TWO_COLUMN, TEMPLATE_TAGS.COLORFUL] as TemplateTag[],
    popularity: 0.88,
    lastUpdated: '2025-01-20',
    previewUrl: '/thumbnails/azurill.png',
    features: ['Modern design', 'Two-column layout', 'Colorful accents']
  },
  // ... 其他模板元数据
};

// 获取所有模板
export function getAllTemplates(): MagicTemplateDSL[] {
  return Object.values(TEMPLATE_REGISTRY);
}

// 根据分类获取模板
export function getTemplatesByCategory(category: string): MagicTemplateDSL[] {
  return getAllTemplates().filter(template => 
    TEMPLATE_METADATA[template.id as keyof typeof TEMPLATE_METADATA]?.category === category
  );
}

// 根据标签获取模板
export function getTemplatesByTag(tag: TemplateTag): MagicTemplateDSL[] {
  return getAllTemplates().filter(template => {
    const metadata = TEMPLATE_METADATA[template.id as keyof typeof TEMPLATE_METADATA];
    return metadata?.tags.includes(tag);
  });
}

// 获取热门模板
export function getPopularTemplates(limit: number = 6): MagicTemplateDSL[] {
  return getAllTemplates()
    .sort((a, b) => {
      const aPopularity = TEMPLATE_METADATA[a.id as keyof typeof TEMPLATE_METADATA]?.popularity || 0;
      const bPopularity = TEMPLATE_METADATA[b.id as keyof typeof TEMPLATE_METADATA]?.popularity || 0;
      return bPopularity - aPopularity;
    })
    .slice(0, limit);
}

// 模板版本管理
export function getTemplateVersion(templateId: string): string {
  return TEMPLATE_REGISTRY[templateId]?.version || '1.0.0';
}

// 检查模板更新
export function checkTemplateUpdates(templateId: string, currentVersion: string): boolean {
  const latestVersion = getTemplateVersion(templateId);
  return latestVersion !== currentVersion;
}