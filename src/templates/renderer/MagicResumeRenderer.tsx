import React, { useMemo } from 'react';
import { MagicTemplateDSL } from '../types/magic-dsl';
import { Resume } from '@/types/frontend/resume';
import get from 'lodash.get';

import { Header } from '../templateLayout/Header';
import { DefaultSection } from '../templateLayout/DefaultSection';
import { ListSection } from '../templateLayout/ListSection';
import { ProfileCard } from '../templateLayout/ProfileCard';
import { ContactInfo } from '../templateLayout/ContactInfo';
import { CompactList } from '../templateLayout/CompactList';
import { Timeline } from '../templateLayout/Timeline';
import { Layout } from '../templateLayout/Layout';
import { TwoColumnLayout } from '../templateLayout/TwoColumnLayout';
import { getSectionIcon } from '../templateLayout/utils';

const componentRegistry = {
  Header,
  DefaultSection,
  Section: DefaultSection,
  ListSection,
  ProfileCard,
  ContactInfo,
  CompactList,
  Timeline,
  Layout,
  TwoColumnLayout,
};

interface Props {
  template: MagicTemplateDSL;
  data: Resume;
  locale?: string;
}

const ZH_TITLE_BY_SECTION_KEY: Record<string, string> = {
  experience: '工作经历',
  education: '教育经历',
  projects: '项目经历',
  skills: '专业技能',
  languages: '语言能力',
  certificates: '证书资质',
  profiles: '个人主页',
};

const ZH_TITLE_BY_ENGLISH: Record<string, string> = {
  header: '基本信息',
  summary: '个人总结',
  profile: '个人信息',
  contact: '联系方式',
  experience: '工作经历',
  'work experience': '工作经历',
  'professional experience': '专业经历',
  education: '教育经历',
  projects: '项目经历',
  skills: '专业技能',
  'technical skills': '技术技能',
  languages: '语言能力',
  certificates: '证书资质',
  certifications: '证书资质',
  profiles: '个人主页',
  awards: '奖项',
};

function getSectionData(data: Resume, dataBinding: string) {
  if (dataBinding === 'info') {
    return data.info;
  }
  
  const isVisible = (item: unknown) => {
    if (!item || typeof item !== 'object') return true;
    const obj = item as Record<string, unknown>;
    return obj.visible !== false && obj.visible !== 'false' && obj.visible !== 0;
  };

  if (dataBinding.startsWith('sections.')) {
    const sectionKey = dataBinding.replace('sections.', '');
    const sectionItems = data.sections[sectionKey as keyof typeof data.sections];
    if (Array.isArray(sectionItems)) {
      return sectionItems.filter(isVisible);
    }
    return sectionItems;
  }
  
  const value = get(data, dataBinding);
  if (Array.isArray(value)) {
    return value.filter(isVisible);
  }
  return value;
}

function generateCSSVariables(designTokens: MagicTemplateDSL['designTokens'], layout: MagicTemplateDSL['layout']) {
  const cssVars: Record<string, string> = {
    '--color-primary': designTokens.colors.primary,
    '--color-secondary': designTokens.colors.secondary,
    '--color-text': designTokens.colors.text,
    '--color-text-secondary': designTokens.colors.textSecondary,
    '--color-background': designTokens.colors.background,
    '--color-border': designTokens.colors.border,
    '--font-family-primary': designTokens.typography.fontFamily.primary,
    '--font-size-xs': designTokens.typography.fontSize.xs,
    '--font-size-sm': designTokens.typography.fontSize.sm,
    '--font-size-md': designTokens.typography.fontSize.md,
    '--font-size-lg': designTokens.typography.fontSize.lg,
    '--font-size-xl': designTokens.typography.fontSize.xl,
    '--font-size-xxl': designTokens.typography.fontSize.xxl,
    '--font-size-title': designTokens.typography.fontSize.lg,
    '--font-size-body': designTokens.typography.fontSize.sm,
    '--font-weight-normal': designTokens.typography.fontWeight.normal.toString(),
    '--font-weight-medium': designTokens.typography.fontWeight.medium.toString(),
    '--font-weight-bold': designTokens.typography.fontWeight.bold.toString(),
    '--spacing-xs': designTokens.spacing.xs,
    '--spacing-sm': designTokens.spacing.sm,
    '--spacing-md': designTokens.spacing.md,
    '--spacing-lg': designTokens.spacing.lg,
    '--spacing-xl': designTokens.spacing.xl,
    '--radius-none': designTokens.borderRadius.none,
    '--radius-sm': designTokens.borderRadius.sm,
    '--radius-md': designTokens.borderRadius.md,
    '--radius-lg': designTokens.borderRadius.lg,
    '--line-height': (designTokens.typography as { lineHeight?: number }).lineHeight?.toString() || '1.5',
    '--letter-spacing': (designTokens.typography as { letterSpacing?: string }).letterSpacing || '0px',
    '--container-width': layout.containerWidth,
    '--container-padding': layout.padding,
    '--container-gap': layout.gap,
    '--paragraph-spacing': designTokens.spacing.md,
    '--section-spacing': designTokens.spacing.lg,
    '--section-title-spacing': designTokens.spacing.sm,
    '--title-divider-width': layout.showTitleDivider === false ? '0' : '1px',
    '--title-icon-display': layout.showTitleIcon === false ? 'none' : 'inline-block',
  };

  if (designTokens.colors.sidebar) {
    cssVars['--color-sidebar'] = designTokens.colors.sidebar;
  }
  if (designTokens.colors.accent) {
    cssVars['--color-accent'] = designTokens.colors.accent;
  }
  if (designTokens.typography.fontFamily.secondary) {
    cssVars['--font-family-secondary'] = designTokens.typography.fontFamily.secondary;
  }
  if (designTokens.typography.fontFamily.mono) {
    cssVars['--font-family-mono'] = designTokens.typography.fontFamily.mono;
  }

  return cssVars as React.CSSProperties;
}

function getLayoutComponent(layoutType: string) {
  switch (layoutType) {
    case 'two-column':
      return TwoColumnLayout;
    case 'single-column':
    default:
      return Layout;
  }
}

export const MagicResumeRenderer = React.memo(({ template, data, locale }: Props) => {
  const { layout, designTokens, components } = template;
  const isChineseLocale = (locale || '').toLowerCase().startsWith('zh');
  
  const cssVariables = useMemo(
    () => generateCSSVariables(designTokens, layout),
    [designTokens, layout]
  );
  
  const LayoutContainer = getLayoutComponent(layout.type);
  
  const sortedComponents = useMemo(() => {
    const sidebarComponents = components.filter(comp => comp.position?.area === 'sidebar');
    const mainComponents = components.filter(comp => comp.position?.area !== 'sidebar');
    
    const headerComponents = mainComponents.filter(comp => comp.dataBinding === 'info');
    const sectionComponents = mainComponents.filter(comp => comp.dataBinding.startsWith('sections.'));
    
    const sortedMainSections = [] as typeof components;
    
    if (data.sectionOrder && Array.isArray(data.sectionOrder)) {
      data.sectionOrder.forEach(sectionOrderItem => {
        const matchingComponent = sectionComponents.find(comp => 
          comp.dataBinding === `sections.${sectionOrderItem.key}`
        );
        if (matchingComponent) {
          sortedMainSections.push(matchingComponent);
        }
      });
    }
    
    const remainingMainSections = sectionComponents.filter(comp => 
      !sortedMainSections.includes(comp)
    );
    
    const sortedSidebarComponents = [...sidebarComponents].sort(
      (a, b) => (a.position?.order || 0) - (b.position?.order || 0)
    );
    
    return [...sortedSidebarComponents, ...headerComponents, ...sortedMainSections, ...remainingMainSections];
  }, [components, data.sectionOrder]);

  return (
    <div style={cssVariables}>
      <LayoutContainer layout={layout} designTokens={designTokens}>
        {sortedComponents.map(component => {
          const Component = componentRegistry[component.type as keyof typeof componentRegistry];
          if (!Component) {
            console.warn(`Component "${component.type}" not found in registry.`);
            return null;
          }

          const sectionData = getSectionData(data, component.dataBinding);
          
          if (!sectionData) {
            return null;
          }

          const needsArrayData = ['DefaultSection', 'ListSection', 'Timeline', 'CompactList'];
          if (needsArrayData.includes(component.type)) {
            if (!Array.isArray(sectionData) || sectionData.length === 0) {
              return null;
            }
          }

          const sectionKey = component.dataBinding.startsWith('sections.')
            ? component.dataBinding.replace('sections.', '')
            : undefined;

          const rawTitle = (component.props?.title as string) || 'Section';
          const resolvedTitle = (() => {
            if (!isChineseLocale) return rawTitle;
            if (sectionKey) {
              const mappedByKey = ZH_TITLE_BY_SECTION_KEY[sectionKey];
              if (mappedByKey) return mappedByKey;
            }
            const normalizedTitle = rawTitle.trim().toLowerCase();
            return ZH_TITLE_BY_ENGLISH[normalizedTitle] || rawTitle;
          })();

          const props = {
            data: sectionData,
            items: Array.isArray(sectionData) ? sectionData : [],
            fieldMap: component.fieldMap,
            style: component.style,
            position: component.position,
            ...component.props,
            title: resolvedTitle,
            titleIcon: getSectionIcon(sectionKey, rawTitle),
          };

          return (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            <Component key={component.id} {...(props as any)} />
          );
        })}
      </LayoutContainer>
    </div>
  );
});

MagicResumeRenderer.displayName = 'MagicResumeRenderer';
