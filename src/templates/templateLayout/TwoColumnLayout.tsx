import React from 'react';
import { MagicTemplateDSL, ComponentPosition } from '../types/magic-dsl';

interface Props {
  children: React.ReactNode;
  layout: MagicTemplateDSL['layout'];
  designTokens: MagicTemplateDSL['designTokens'];
}

interface ChildProps {
  position?: ComponentPosition;
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
      const childProps = child.props as ChildProps;
      const position = childProps?.position;
      if (position?.area === 'sidebar') {
        sidebarComponents.push(child);
      } else {
        mainComponents.push(child);
      }
    }
  });

  const { typography } = designTokens;

  // 计算A4纸张的最小高度：794px宽度对应的A4高度 (794 * 297/210 ≈ 1123px)
  const a4MinHeight = Math.round(parseInt(layout.containerWidth) * 297 / 210);

  const containerStyle: React.CSSProperties = {
    width: layout.containerWidth,
    maxWidth: layout.containerWidth,
    minHeight: `${a4MinHeight}px`, // 设置A4标准最小高度
    backgroundColor: designTokens.colors.background,
    fontFamily: designTokens.typography.fontFamily.primary,
    lineHeight: typography.lineHeight?.toString() || '1.5',
    letterSpacing: typography.letterSpacing || '0px',
    borderRadius: '6px',
  };

  const sidebarStyle: React.CSSProperties = {
    width: twoColumn.leftWidth,
    minHeight: `${a4MinHeight}px`,
    backgroundColor: designTokens.colors.sidebar || designTokens.colors.primary,
    padding: layout.padding,
    gap: layout.gap,
    lineHeight: typography.lineHeight?.toString() || '1.5',
    letterSpacing: typography.letterSpacing || '0px',
    borderTopLeftRadius: '6px', 
    borderBottomLeftRadius: '6px', 
  };

  const mainStyle: React.CSSProperties = {
    width: twoColumn.rightWidth,
    color: designTokens.colors.text,
    padding: layout.padding,
    gap: layout.gap,
    lineHeight: typography.lineHeight?.toString() || '1.5',
    letterSpacing: typography.letterSpacing || '0px',
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