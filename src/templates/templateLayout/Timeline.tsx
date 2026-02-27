import React from 'react';
import { getFieldValue } from './utils';
import { WysiwygContent } from './WysiwygContent';

interface Item {
  [key: string]: unknown;
}

interface Props {
  title: string;
  items: Item[];
  fieldMap?: Record<string, string | string[]>;
  style?: React.CSSProperties;
  titleIcon?: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
}

export const Timeline = React.memo(function Timeline({ title, items, fieldMap = {}, style, titleIcon: TitleIcon }: Props) {
  if (!items || items.length === 0) return null;

  const textColor = style?.color || 'var(--color-text)';
  const primaryColor = 'var(--color-primary)';
  const secondaryColor = style?.color ? `${style.color}80` : 'var(--color-text-secondary)';
  const timelineLineColor = 'var(--color-border)';

  return (
    <section 
      className="space-y-6"
      style={{
        ...style,
        lineHeight: 'var(--line-height)',
        letterSpacing: 'var(--letter-spacing)',
        marginBottom: 'var(--section-spacing)',
      }}
    >
      <h2 
        className="font-bold" 
        style={{ 
          color: textColor,
          fontSize: 'var(--font-size-title)',
          paddingBottom: 'var(--section-title-spacing)',
          borderBottomWidth: 'var(--title-divider-width)',
          borderBottomStyle: 'solid',
          borderBottomColor: primaryColor,
          marginBottom: 'var(--section-title-spacing)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4em',
        }}
      >
        {TitleIcon && <TitleIcon size={16} style={{ display: 'var(--title-icon-display)', flexShrink: 0 }} />}
        {title}
      </h2>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--paragraph-spacing)' }}>
        {items.map((item, idx) => {
          const company = getFieldValue(item, fieldMap.title || ['company', 'school', 'name']);
          const position = getFieldValue(item, fieldMap.subtitle || ['position', 'degree', 'role']);
          const date = getFieldValue(item, fieldMap.date || 'date');
          const location = getFieldValue(item, ['location']);
          const description = getFieldValue(item, fieldMap.description || ['summary', 'description']);
          
          return (
            <div key={idx} className="relative pl-6">
              <div 
                style={{
                  position: 'absolute',
                  left: '0px',
                  top: '0.5rem',
                  width: '0.75rem',
                  height: '0.75rem',
                  backgroundColor: primaryColor,
                  borderRadius: '9999px',
                  border: '2px solid var(--color-background)',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                }}
              />
              
              {idx < items.length - 1 && (
                <div 
                  style={{
                    position: 'absolute',
                    left: '5px',
                    top: '1.5rem',
                    width: '0.125rem',
                    height: '100%',
                    backgroundColor: timelineLineColor
                  }}
                />
              )}
              
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                  <div>
                    <h3 className="font-bold" style={{ color: textColor, fontSize: 'var(--font-size-body)' }}>
                      {company}
                    </h3>
                    {position && (
                      <p className="font-medium" style={{ color: primaryColor, fontSize: 'var(--font-size-body)' }}>
                        {position}
                      </p>
                    )}
                    {location && (
                      <p style={{ color: secondaryColor, fontSize: 'var(--font-size-body)' }}>
                        {location}
                      </p>
                    )}
                  </div>
                  
                  {date && (
                    <div className="font-medium mt-1 sm:mt-0" style={{ color: secondaryColor, fontSize: 'var(--font-size-body)' }}>
                      {date}
                    </div>
                  )}
                </div>
                
                {description && (
                  <div style={{ color: textColor, fontSize: 'var(--font-size-body)' }}>
                    <WysiwygContent dirtyHtml={description} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
});
