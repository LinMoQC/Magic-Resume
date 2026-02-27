import React from 'react';
import { MagicTemplateDSL } from '@/templates/types/magic-dsl';

interface ResumeMiniPreviewProps {
  template: MagicTemplateDSL;
  className?: string;
  resumeName?: string;
  sectionCount?: number;
}

const ResumeMiniPreview = React.memo(({ template, className = "", sectionCount }: ResumeMiniPreviewProps) => {
  const { layout, designTokens } = template;
  const isTwo = layout.type === 'two-column';
  const bg = designTokens.colors.background;
  const primary = designTokens.colors.primary;
  const sidebar = designTokens.colors.sidebar || primary;
  const text60 = `${designTokens.colors.text}60`;
  const text40 = `${designTokens.colors.text}40`;
  const text25 = `${designTokens.colors.text}25`;
  const borderRadius = designTokens.borderRadius.md !== '0' ? designTokens.borderRadius.md : '4px';

  const SectionBlock = ({ titleWidth = '30%' }: { titleWidth?: string }) => (
    <div className="space-y-[3px]">
      <div className="h-[3px] rounded-sm" style={{ backgroundColor: primary, width: titleWidth }} />
      <div className="h-[2px] rounded-sm w-full" style={{ backgroundColor: text25 }} />
      <div className="h-[2px] rounded-sm w-[90%]" style={{ backgroundColor: text25 }} />
      <div className="h-[2px] rounded-sm w-[75%]" style={{ backgroundColor: text25 }} />
      <div className="h-[2px] rounded-sm w-[85%]" style={{ backgroundColor: text25 }} />
    </div>
  );

  const SidebarSection = () => (
    <div className="space-y-[2px]">
      <div className="h-[2px] bg-white/40 rounded-sm w-3/5" />
      <div className="h-[2px] bg-white/20 rounded-sm w-full" />
      <div className="h-[2px] bg-white/20 rounded-sm w-4/5" />
      <div className="h-[2px] bg-white/20 rounded-sm w-3/5" />
    </div>
  );

  const sections = sectionCount || 4;

  return (
    <div 
      className={`w-full h-full overflow-hidden shadow-sm ${className}`}
      style={{ backgroundColor: bg, borderRadius }}
    >
      {isTwo ? (
        <div className="flex h-full">
          {/* 侧边栏 */}
          <div className="w-[30%] p-2 space-y-3" style={{ backgroundColor: sidebar }}>
            <div className="space-y-1">
              <div className="h-[6px] bg-white/50 rounded-sm w-3/4" />
              <div className="h-[3px] bg-white/30 rounded-sm w-full" />
            </div>
            <SidebarSection />
            <SidebarSection />
            <SidebarSection />
          </div>
          {/* 主内容 */}
          <div className="flex-1 p-2 space-y-2.5">
            <div className="space-y-1">
              <div className="h-[5px] rounded-sm w-2/3" style={{ backgroundColor: text60 }} />
              <div className="h-[2px] rounded-sm w-full" style={{ backgroundColor: text40 }} />
              <div className="h-[2px] rounded-sm w-4/5" style={{ backgroundColor: text25 }} />
            </div>
            {Array.from({ length: Math.min(sections, 4) }).map((_, i) => (
              <SectionBlock key={i} titleWidth={i % 2 === 0 ? '35%' : '28%'} />
            ))}
          </div>
        </div>
      ) : (
        <div className="p-2.5 space-y-2 h-full">
          {/* 头部 */}
          <div className="space-y-1 pb-1" style={{ borderBottom: `1px solid ${text25}` }}>
            <div className="h-[6px] rounded-sm w-1/3" style={{ backgroundColor: text60 }} />
            <div className="flex gap-2">
              <div className="h-[2px] rounded-sm flex-1" style={{ backgroundColor: text40 }} />
              <div className="h-[2px] rounded-sm flex-1" style={{ backgroundColor: text40 }} />
              <div className="h-[2px] rounded-sm flex-1" style={{ backgroundColor: text40 }} />
            </div>
          </div>
          {/* 各 Section */}
          {Array.from({ length: Math.min(sections, 5) }).map((_, i) => (
            <SectionBlock key={i} titleWidth={i % 2 === 0 ? '30%' : '25%'} />
          ))}
        </div>
      )}
    </div>
  );
});

ResumeMiniPreview.displayName = 'ResumeMiniPreview';

export default ResumeMiniPreview;
