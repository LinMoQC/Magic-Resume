import React from 'react';
import { getFieldValue } from './utils';

interface Item {
  [key: string]: unknown;
}

interface Props {
  title: string;
  items: Item[];
  fieldMap?: Record<string, string | string[]>;
  style?: React.CSSProperties;
  position?: {
    area?: 'main' | 'sidebar' | 'header' | 'footer';
  };
  titleIcon?: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
}

export const CompactList = React.memo(function CompactList({ title, items, fieldMap = {}, style, position, titleIcon: TitleIcon }: Props) {
  if (!items || items.length === 0) return null;

  const isInSidebar = position?.area === 'sidebar';
  
  const textColor = style?.color || (isInSidebar ? 'var(--color-background)' : 'var(--color-text)');
  const secondaryColor = style?.color ? `${style.color}cc` : 'var(--color-text-secondary)';

  return (
    <div 
      style={{
        ...style,
        lineHeight: 'var(--line-height)',
        letterSpacing: 'var(--letter-spacing)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--paragraph-spacing)',
      }}
    >
      <h3 
        className="font-bold uppercase tracking-wide" 
        style={{ 
          color: textColor,
          fontSize: 'var(--font-size-title)',
          paddingBottom: 'var(--section-title-spacing)',
          borderBottomWidth: 'var(--title-divider-width)',
          borderBottomStyle: 'solid',
          borderBottomColor: textColor,
          marginBottom: 'var(--section-title-spacing)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4em',
        }}
      >
        {TitleIcon && <TitleIcon style={{ display: 'var(--title-icon-display)', flexShrink: 0, width: '1em', height: '1em' }} />}
        {title}
      </h3>
      
      <ul 
        className="list-none"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--paragraph-spacing)',
        }}
      >
        {items.map((item, idx) => {
          const name = getFieldValue(item, fieldMap.title || ['name', 'skill', 'language', 'certificate']);
          const level = getFieldValue(item, fieldMap.level || 'level');
          
          return (
            <li key={idx} style={{ color: textColor }}>
              <div className="font-medium" style={{ fontSize: 'var(--font-size-body)' }}>
                {name}
              </div>
              {level && (
                <div className="mt-1" style={{ color: secondaryColor, fontSize: 'var(--font-size-body)' }}>
                  {level}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
});
