import React from 'react';
import { MagicTemplateDSL, ComponentPosition } from '../types/magic-dsl';

interface Props {
  children: React.ReactNode;
  layout: MagicTemplateDSL['layout'];
}

interface ChildProps {
  position?: ComponentPosition;
}

export function TwoColumnLayout({ children, layout }: Props) {
  const { twoColumn } = layout;
  
  if (!twoColumn) {
    return <div>{children}</div>;
  }

  // 分离侧边栏和主要内容的组件
  const sidebarComponents: React.ReactNode[] = [];
  const mainComponents: React.ReactNode[] = [];

  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child)) {
      const childProps = child.props as ChildProps;
      const position = childProps?.position;
      if (position?.area === 'sidebar') {
        sidebarComponents.push(child);
      } else {
        mainComponents.push(child);
      }
    }
  });

  const a4MinHeight = Math.round(parseInt(layout.containerWidth) * 297 / 210);

  const containerStyle: React.CSSProperties = {
    width: 'var(--container-width)',
    maxWidth: 'var(--container-width)',
    minHeight: `${a4MinHeight}px`,
    backgroundColor: 'var(--color-background)',
    fontFamily: 'var(--font-family-primary)',
    lineHeight: 'var(--line-height)',
    letterSpacing: 'var(--letter-spacing)',
    borderRadius: '6px',
  };

  const sidebarStyle: React.CSSProperties = {
    width: twoColumn.leftWidth,
    minHeight: `${a4MinHeight}px`,
    backgroundColor: 'var(--color-sidebar, var(--color-primary))',
    padding: 'var(--container-padding)',
    gap: 'var(--container-gap)',
    lineHeight: 'inherit',
    letterSpacing: 'inherit',
    borderTopLeftRadius: '6px', 
    borderBottomLeftRadius: '6px', 
  };

  const mainStyle: React.CSSProperties = {
    width: twoColumn.rightWidth,
    color: 'var(--color-text)',
    padding: 'var(--container-padding)',
    gap: 'var(--container-gap)',
    lineHeight: 'inherit',
    letterSpacing: 'inherit',
    borderTopRightRadius: '6px',
    borderBottomRightRadius: '6px',
  };

  return (
    <div
      id="resume-to-export"
      className="mx-auto bg-white text-black shadow-2xl relative"
      style={containerStyle}
    >
      <div 
        className="flex h-full"
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