import React from 'react';
import { MagicTemplateDSL } from '../types/magic-dsl';

interface Props {
  children: React.ReactNode;
  layout: MagicTemplateDSL['layout'];
  designTokens: MagicTemplateDSL['designTokens'];
}

export function TwoColumnLayout({ children, layout, designTokens }: Props) {
  const { twoColumn } = layout;
  
  if (!twoColumn) {
    return <div>{children}</div>;
  }

  // 分离侧边栏和主要内容的组件
  const sidebarComponents: React.ReactNode[] = [];
  const mainComponents: React.ReactNode[] = [];

  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const position = (child.props as any)?.position;
      if (position?.area === 'sidebar') {
        sidebarComponents.push(child);
      } else {
        mainComponents.push(child);
      }
    }
  });

  const containerStyle: React.CSSProperties = {
    width: layout.containerWidth,
    maxWidth: layout.containerWidth,
    backgroundColor: designTokens.colors.background,
    fontFamily: designTokens.typography.fontFamily.primary,
    lineHeight: (designTokens.typography as any).lineHeight || '1.5',
    letterSpacing: (designTokens.typography as any).letterSpacing || '0px',
  };

  const sidebarStyle: React.CSSProperties = {
    width: twoColumn.leftWidth,
    backgroundColor: designTokens.colors.sidebar || designTokens.colors.primary,
    padding: layout.padding,
    gap: layout.gap,
    lineHeight: (designTokens.typography as any).lineHeight || '1.5',
    letterSpacing: (designTokens.typography as any).letterSpacing || '0px',
  };

  const mainStyle: React.CSSProperties = {
    width: twoColumn.rightWidth,
    color: designTokens.colors.text,
    padding: layout.padding,
    gap: layout.gap,
    lineHeight: (designTokens.typography as any).lineHeight || '1.5',
    letterSpacing: (designTokens.typography as any).letterSpacing || '0px',
  };

  return (
    <div
      id="resume-to-export"
      className="mx-auto bg-white text-black shadow-2xl relative"
      style={containerStyle}
    >
      <div 
        className="flex min-h-[1100px]"
        style={{ gap: twoColumn.gap }}
      >
        {/* 左侧边栏 */}
        <div
          className="flex-shrink-0 flex flex-col"
          style={sidebarStyle}
        >
          {sidebarComponents}
        </div>
        
        {/* 右侧主要内容 */}
        <div
          className="flex-1 flex flex-col"
          style={mainStyle}
        >
          {mainComponents}
        </div>
      </div>
    </div>
  );
} 