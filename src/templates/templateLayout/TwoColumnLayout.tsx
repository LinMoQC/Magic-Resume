import React from 'react';

interface Props {
  children: React.ReactNode;
  layout: {
    containerWidth: string;
    padding: string;
    twoColumn?: {
      leftWidth: string;
      rightWidth: string;
      gap: string;
    };
  };
  designTokens?: {
    colors?: {
      background?: string;
      sidebar?: string;
      text?: string;
    };
  };
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

  return (
    <div
      id="resume-to-export"
      className="mx-auto bg-white text-black shadow-2xl relative"
      style={{
        width: layout.containerWidth,
        maxWidth: layout.containerWidth,
        backgroundColor: designTokens?.colors?.background || '#ffffff'
      }}
    >
      <div 
        className="flex min-h-[1100px]"
        style={{ gap: twoColumn.gap }}
      >
        {/* 左侧边栏 */}
        <div
          className="flex-shrink-0 p-6 space-y-6"
          style={{
            width: twoColumn.leftWidth,
            backgroundColor: designTokens?.colors?.sidebar || '#1e40af'
          }}
        >
          {sidebarComponents}
        </div>
        
        {/* 右侧主要内容 */}
        <div
          className="flex-1 p-6 space-y-6"
          style={{
            width: twoColumn.rightWidth,
            color: designTokens?.colors?.text || '#000000'
          }}
        >
          {mainComponents}
        </div>
      </div>
    </div>
  );
} 