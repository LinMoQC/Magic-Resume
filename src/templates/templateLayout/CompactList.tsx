import React from 'react';
import get from 'lodash.get';

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

export function CompactList({ title, items, fieldMap = {}, style, position }: Props) {
  if (!items || items.length === 0) return null;

  // 判断是否在侧边栏使用（双栏布局）还是主区域使用（单栏布局）
  const isInSidebar = position?.area === 'sidebar';
  
  // 根据位置和style选择颜色主题
  const textColor = style?.color || (isInSidebar ? '#ffffff' : '#000000');
  const secondaryColor = style?.color ? `${style.color}cc` : (isInSidebar ? '#dbeafe' : '#6b7280');

  return (
    <div className="space-y-3" style={style}>
      <h3 className="text-sm font-bold mb-4 uppercase tracking-wide" style={{ color: textColor }}>
        {title}
      </h3>
      
      <ul className="space-y-2 list-none">
        {items.map((item, idx) => {
          const name = getFieldValue(item, fieldMap.title || ['name', 'skill', 'language', 'certificate']);
          const level = getFieldValue(item, fieldMap.level || 'level');
          
          return (
            <li key={idx} style={{ color: textColor }}>
              <div className="text-xs font-medium">
                {name}
              </div>
              {level && (
                <div className="text-xs mt-1" style={{ color: secondaryColor }}>
                  {level}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
} 