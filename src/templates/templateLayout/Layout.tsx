import React from 'react';
import { MagicTemplateDSL } from '../types/magic-dsl';

interface Props {
  children: React.ReactNode;
  layout: MagicTemplateDSL['layout'];
  designTokens: MagicTemplateDSL['designTokens'];
  style?: React.CSSProperties;
}

// 使用交叉类型定义扩展的 typography 类型
type ExtendedTypography = MagicTemplateDSL['designTokens']['typography'] & {
  lineHeight?: string;
  letterSpacing?: string;
};

export function Layout({ children, layout, designTokens, style }: Props) {
  const extendedTypography = designTokens.typography as ExtendedTypography;

  const containerStyle: React.CSSProperties = {
    width: layout.containerWidth,
    maxWidth: layout.containerWidth,
    backgroundColor: designTokens.colors.background,
    color: designTokens.colors.text,
    fontFamily: designTokens.typography.fontFamily.primary,
    lineHeight: extendedTypography.lineHeight || '1.5',
    letterSpacing: extendedTypography.letterSpacing || '0px',
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
      className="mx-auto bg-white text-black rounded-md shadow-2xl relative min-h-[1100px]"
      style={containerStyle}
    >
      <div className="flex flex-col" style={innerStyle}>
        {children}
      </div>
    </div>
  );
} 