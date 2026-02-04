import React from 'react';
import { MagicTemplateDSL, ComponentDefinition } from '../types/magic-dsl';
import { Resume } from '@/types/frontend/resume';
import get from 'lodash.get';

// 导入所有组件
import { Header } from '../templateLayout/Header';
import { DefaultSection } from '../templateLayout/DefaultSection';
import { ListSection } from '../templateLayout/ListSection';
import { ProfileCard } from '../templateLayout/ProfileCard';
import { ContactInfo } from '../templateLayout/ContactInfo';
import { CompactList } from '../templateLayout/CompactList';
import { Timeline } from '../templateLayout/Timeline';
import { Layout } from '../templateLayout/Layout';
import { TwoColumnLayout } from '../templateLayout/TwoColumnLayout';

// 组件注册表
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
}

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
    // Filter out items that are not visible
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
    '--spacing-xs': designTokens.spacing.xs,
    '--spacing-sm': designTokens.spacing.sm,
    '--spacing-md': designTokens.spacing.md,
    '--spacing-lg': designTokens.spacing.lg,
    '--spacing-xl': designTokens.spacing.xl,
    '--line-height': (designTokens.typography as { lineHeight?: number }).lineHeight?.toString() || '1.5',
    '--letter-spacing': (designTokens.typography as { letterSpacing?: string }).letterSpacing || '0px',
    '--container-width': layout.containerWidth,
    '--container-padding': layout.padding,
    '--container-gap': layout.gap,
    '--paragraph-spacing': designTokens.spacing.md,
    '--section-spacing': designTokens.spacing.lg,
  };

  // 只有在有值时才设置可选的CSS变量
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

function ComponentWrapper({ 
  children
}: { 
  children: React.ReactNode;
  position?: ComponentDefinition['position'];
  style?: ComponentDefinition['style'];
}) {
  return (
    <div className="component-wrapper">
      {children}
    </div>
  );
}

export const MagicResumeRenderer = React.memo(({ template, data }: Props) => {
  const { layout, designTokens, components } = template;
  
  // 生成CSS变量
  const cssVariables = generateCSSVariables(designTokens, layout);
  
  // 获取布局组件
  const LayoutContainer = getLayoutComponent(layout.type);
  
  // 根据 sectionOrder 动态排序组件
  const sortedComponents = (() => {
    // 按area分组组件
    const sidebarComponents = components.filter(comp => comp.position?.area === 'sidebar');
    const mainComponents = components.filter(comp => comp.position?.area !== 'sidebar');
    
    // 对于主区域组件，进行动态排序
    const headerComponents = mainComponents.filter(comp => comp.dataBinding === 'info');
    const sectionComponents = mainComponents.filter(comp => comp.dataBinding.startsWith('sections.'));
    
    const sortedMainSections: ComponentDefinition[] = [];
    
    // 根据 sectionOrder 排序主区域的section组件
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
    
    // 添加任何在sectionOrder中没有的主区域section组件
    const remainingMainSections = sectionComponents.filter(comp => 
      !sortedMainSections.includes(comp)
    );
    
    // 侧边栏组件保持原有顺序（或者也可以按sectionOrder排序）
    const sortedSidebarComponents = sidebarComponents.sort(
      (a, b) => (a.position?.order || 0) - (b.position?.order || 0)
    );
    
    // 合并所有组件
    return [...sortedSidebarComponents, ...headerComponents, ...sortedMainSections, ...remainingMainSections];
  })();

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
          
          // 如果数据不存在，跳过渲染
          if (!sectionData) {
            return null;
          }

          // 对于需要数组数据的组件，确保数据是数组且非空
          const needsArrayData = ['DefaultSection', 'ListSection', 'Timeline', 'CompactList'];
          if (needsArrayData.includes(component.type)) {
            if (!Array.isArray(sectionData) || sectionData.length === 0) {
              return null;
            }
          }

          const props = {
            data: sectionData,
            items: Array.isArray(sectionData) ? sectionData : [],
            fieldMap: component.fieldMap,
            style: component.style,
            position: component.position,
            title: component.props?.title || 'Section',
            ...component.props,
          };

          return (
            <ComponentWrapper 
              key={component.id}
              position={component.position}
              style={component.style}
            >
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              <Component key={component.id} {...(props as any)} />
            </ComponentWrapper>
          );
        })}
      </LayoutContainer>
    </div>
  );
});

MagicResumeRenderer.displayName = 'MagicResumeRenderer';