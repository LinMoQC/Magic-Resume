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

  // 从style中提取颜色，如果没有则使用默认值
  const textColor = style?.color || '#1f2937';
  const primaryColor = '#3b82f6'; // 保持蓝色作为强调色
  const secondaryColor = style?.color ? `${style.color}80` : '#6b7280'; // 半透明版本

  return (
    <section className="space-y-6" style={style}>
      <h2 className="text-lg font-bold border-b-2 border-blue-500 pb-2" style={{ color: textColor }}>
        {title}
      </h2>
      
      <div className="space-y-6">
        {items.map((item, idx) => {
          const company = getFieldValue(item, fieldMap.title || ['company', 'school', 'name']);
          const position = getFieldValue(item, fieldMap.subtitle || ['position', 'degree', 'role']);
          const date = getFieldValue(item, fieldMap.date || 'date');
          const location = getFieldValue(item, ['location']);
          const description = getFieldValue(item, fieldMap.description || ['summary', 'description']);
          
          return (
            <div key={idx} className="relative pl-6">
              {/* Timeline dot */}
              <div className="absolute left-0 top-2 w-3 h-3 bg-blue-500 rounded-full border-2 border-white shadow-md"></div>
              
              {/* Timeline line */}
              {idx < items.length - 1 && (
                <div className="absolute left-[5px] top-6 w-0.5 h-full bg-gray-200"></div>
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