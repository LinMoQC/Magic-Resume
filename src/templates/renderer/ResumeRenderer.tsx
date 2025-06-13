import React from 'react';
import * as templates from '../templateLayout';
import { TemplateDSL, ResumeData, ComponentBlock } from '../types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const componentRegistry: Record<string, React.ComponentType<any>> = templates;

interface Props {
  template: TemplateDSL;
  data: ResumeData;
}

const findBlockByBinding = (layout: ComponentBlock[], binding: string) => {
  return layout.find(b => b.dataBinding === binding);
};

export function ResumeRenderer({ template, data }: Props) {
  const { info, sections, sectionOrder } = data;
  const { Layout } = componentRegistry;

  const headerBlock = findBlockByBinding(template.layout, 'info');

  return (
    <Layout style={template.globalStyles}>
      {headerBlock && React.createElement(componentRegistry[headerBlock.component], {
        ...headerBlock.props,
        data: info,
        fieldMap: headerBlock.fieldMap,
      })}

      {sectionOrder.map(key => {
        const sectionData = sections[key as keyof typeof sections];
        if (!sectionData || !Array.isArray(sectionData) || sectionData.length === 0) {
          return null;
        }

        const block = findBlockByBinding(template.layout, `sections.${key}`);
        if (!block) {
          console.warn(`No block found for dataBinding: sections.${key}`);
          return null;
        }

        const Component = componentRegistry[block.component];
        if (!Component) {
          console.warn(`Component "${block.component}" not found in registry.`);
          return null;
        }

        const props = {
          key: key,
          ...block.props,
          items: sectionData,
          fieldMap: block.fieldMap,
          className: block.className,
          style: block.style,
        };

        return React.createElement(Component, props);
      })}
    </Layout>
  );
} 