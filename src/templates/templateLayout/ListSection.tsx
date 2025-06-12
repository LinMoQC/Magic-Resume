import React from 'react';
import get from 'lodash.get';
import { WysiwygContent } from './WysiwygContent';

interface Item {
  [key: string]: unknown;
}

interface Props {
  title: string;
  items: Item[];
  fieldMap: Record<string, string | string[]>;
  className?: string;
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

export function ListSection({ title, items, fieldMap, className }: Props) {
  if (!items || items.length === 0) return null;

  return (
    <section className={`grid text-[12px] ${className || ''}`}>
      <h4 className="font-bold text-primary text-[1.2em] text-blue-500">{title}</h4>
      <div className="grid gap-x-6 gap-y-1">
        {items.map((item, idx) => (
          <div className="space-y-2" key={idx}>
            <div>
              <div className="font-bold">
                {getFieldValue(item, fieldMap.itemName)}
              </div>
              {getFieldValue(item, fieldMap.itemDetail) && (
                <div>{getFieldValue(item, fieldMap.itemDetail)}</div>
              )}
              {getFieldValue(item, fieldMap.date) && (
                <div>{getFieldValue(item, fieldMap.date)}</div>
              )}
              {getFieldValue(item, fieldMap.summary) && (
                <WysiwygContent dirtyHtml={getFieldValue(item, fieldMap.summary) || ''} />
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
} 