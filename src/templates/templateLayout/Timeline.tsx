import React from 'react';
import get from 'lodash.get';
import { WysiwygContent } from './WysiwygContent';

interface Item {
  [key: string]: unknown;
}

interface Props {
  title: string;
  items: Item[];
  fieldMap?: Record<string, string | string[]>;
  style?: React.CSSProperties;
}

const getFieldValue = (item: Item, field: string | string[] | undefined) => {
  if (!field) return null;
  const fields = Array.isArray(field) ? field : [field];
  for (const f of fields) {
    const value = get(item, f);
    if (value) return String(value);
  }
  return null;
};

export function Timeline({ title, items, fieldMap = {}, style }: Props) {
  if (!items || items.length === 0) return null;

  // 从style中提取颜色，如果没有则使用CSS变量
  const textColor = style?.color || 'var(--color-text)';
  const primaryColor = 'var(--color-primary)'; // 使用主色调
  const secondaryColor = style?.color ? `${style.color}80` : 'var(--color-text-secondary)'; // 半透明版本
  const timelineLineColor = '#e5e7eb'; // 统一的灰色线条

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
        className="text-lg font-bold pb-2" 
        style={{ 
          color: textColor, 
          borderBottom: `2px solid ${primaryColor}`,
          marginBottom: 'var(--paragraph-spacing)',
        }}
      >
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
              {/* Timeline dot */}
              <div 
                className="absolute left-0 top-2 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-md timeline-dot"
                style={{
                  position: 'absolute',
                  left: '0px',
                  top: '0.5rem',
                  width: '0.75rem',
                  height: '0.75rem',
                  backgroundColor: primaryColor,
                  borderRadius: '9999px',
                  border: '2px solid #ffffff',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                }}
              ></div>
              
              {/* Timeline line */}
              {idx < items.length - 1 && (
                <div 
                  className="absolute left-[5px] top-6 w-0.5 h-full bg-gray-200 timeline-line"
                  style={{
                    position: 'absolute',
                    left: '5px',
                    top: '1.5rem',
                    width: '0.125rem',
                    height: '100%',
                    backgroundColor: timelineLineColor
                  }}
                ></div>
              )}
              
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start">
                  <div>
                    <h3 className="font-bold text-base" style={{ color: textColor }}>
                      {company}
                    </h3>
                    {position && (
                      <p className="font-medium text-sm" style={{ color: primaryColor }}>
                        {position}
                      </p>
                    )}
                    {location && (
                      <p className="text-sm" style={{ color: secondaryColor }}>
                        {location}
                      </p>
                    )}
                  </div>
                  
                  {date && (
                    <div className="text-sm font-medium mt-1 sm:mt-0" style={{ color: secondaryColor }}>
                      {date}
                    </div>
                  )}
                </div>
                
                {description && (
                  <div className="text-sm" style={{ color: textColor }}>
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
} 