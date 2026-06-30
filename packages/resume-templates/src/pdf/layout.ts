import type { ComponentDefinition, MagicTemplateDSL } from '../types/magic-dsl';
import type { Resume, SectionItem } from '../types/resume';

export type PdfLayoutPagePlan = {
  fullWidth: boolean;
  main: string[];
  sidebar: string[];
};

export type PdfLayoutPlan = {
  pages: PdfLayoutPagePlan[];
  sidebarWidth?: number;
};

const isVisibleItem = (item: SectionItem): boolean =>
  item.visible !== false && item.visible !== ('false' as unknown) && item.visible !== (0 as unknown);

const sectionKeyOf = (component: ComponentDefinition): string | undefined =>
  component.dataBinding.startsWith('sections.') ? component.dataBinding.slice('sections.'.length) : undefined;

const hasVisibleData = (component: ComponentDefinition, data: Pick<Resume, 'sections'>): boolean => {
  if (component.dataBinding === 'info') return true;
  const sectionKey = sectionKeyOf(component);
  if (!sectionKey) return true;
  return (data.sections[sectionKey] ?? []).some(isVisibleItem);
};

const orderComponents = (template: MagicTemplateDSL, data: Pick<Resume, 'sectionOrder' | 'sections'>): ComponentDefinition[] => {
  const sidebar = template.components
    .filter((component) => component.position?.area === 'sidebar')
    .filter((component) => hasVisibleData(component, data))
    .sort((a, b) => (a.position?.order ?? 0) - (b.position?.order ?? 0));

  const main = template.components
    .filter((component) => component.position?.area !== 'sidebar')
    .filter((component) => hasVisibleData(component, data));
  const headers = main.filter((component) => component.dataBinding === 'info');
  const sections = main.filter((component) => component.dataBinding.startsWith('sections.'));
  const orderedSections: ComponentDefinition[] = [];

  for (const entry of data.sectionOrder ?? []) {
    const component = sections.find((candidate) => candidate.dataBinding === `sections.${entry.key}`);
    if (component) orderedSections.push(component);
  }

  for (const component of sections) {
    if (!orderedSections.includes(component)) orderedSections.push(component);
  }

  return [...sidebar, ...headers, ...orderedSections];
};

const resolveComponent = (components: ComponentDefinition[], entry: string): ComponentDefinition | undefined =>
  components.find((component) => (
    component.id === entry ||
    component.dataBinding === entry ||
    (component.dataBinding.startsWith('sections.') && component.dataBinding.slice('sections.'.length) === entry) ||
    (component.dataBinding.startsWith('sections.') && component.dataBinding === `sections.${entry}`)
  ));

const resolveComponentIds = (
  components: ComponentDefinition[],
  entries: string[] | undefined,
  data: Pick<Resume, 'sections'>,
): string[] => {
  const ids: string[] = [];

  for (const entry of entries ?? []) {
    const component = resolveComponent(components, entry);
    if (!component || !hasVisibleData(component, data) || ids.includes(component.id)) continue;
    ids.push(component.id);
  }

  return ids;
};

export const planPdfLayout = (
  template: MagicTemplateDSL,
  data: Pick<Resume, 'sectionOrder' | 'sections'>,
): PdfLayoutPlan => {
  const ordered = orderComponents(template, data);

  if (template.pdfLayout?.pages?.length) {
    return {
      sidebarWidth: template.pdfLayout.sidebarWidth,
      pages: template.pdfLayout.pages.map((page) => ({
        fullWidth: page.fullWidth === true,
        main: resolveComponentIds(template.components, page.main, data),
        sidebar: resolveComponentIds(template.components, page.sidebar, data),
      })),
    };
  }

  return {
    pages: [{
      fullWidth: false,
      main: ordered.filter((component) => component.position?.area !== 'sidebar').map((component) => component.id),
      sidebar: ordered.filter((component) => component.position?.area === 'sidebar').map((component) => component.id),
    }],
  };
};

export const buildPdfComponentMap = (template: MagicTemplateDSL): Map<string, ComponentDefinition> =>
  new Map(template.components.map((component) => [component.id, component]));

