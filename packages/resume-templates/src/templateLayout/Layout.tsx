import React from 'react';
import { MagicTemplateDSL } from '../types/magic-dsl';

type Props = {
  children: React.ReactNode;
  layout: MagicTemplateDSL['layout'];
  designTokens: MagicTemplateDSL['designTokens'];
  style?: React.CSSProperties;
};

export function Layout({ children, layout, designTokens, style }: Props) {
  const { typography } = designTokens;

  const pageAspect = layout.pageSize === 'Letter' ? 279.4 / 215.9 : 297 / 210;
  const pageMinHeight = Math.round(parseInt(layout.containerWidth) * pageAspect);

  const containerStyle: React.CSSProperties = {
    width: layout.containerWidth,
    maxWidth: layout.containerWidth,
    minHeight: `${pageMinHeight}px`,
    backgroundColor: designTokens.colors.background,
    color: designTokens.colors.text,
    fontFamily: designTokens.typography.fontFamily.primary,
    lineHeight: typography.lineHeight?.toString() || '1.5',
    letterSpacing: typography.letterSpacing || '0px',
    borderRadius: '0.375rem',
    ...style,
  };

  const innerStyle: React.CSSProperties = {
    padding: layout.padding,
    gap: layout.gap,
    lineHeight: 'var(--line-height)',
    letterSpacing: 'var(--letter-spacing)',
  };

  return (
    <div
      id="resume-to-export"
      className="mx-auto shadow-2xl relative"
      style={containerStyle}
    >
      <div className="flex flex-col" style={innerStyle}>
        {children}
      </div>
    </div>
  );
} 