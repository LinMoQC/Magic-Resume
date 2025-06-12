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

export function DefaultSection({ title, items, fieldMap, className }: Props) {
  if (!items || items.length === 0) return null;

  return (
    <section className={`grid text-[12px] ${className || ''}`}>
      <h4 className="font-bold text-primary text-[1.2em] text-blue-500">{title}</h4>
      <div className="grid gap-x-6 gap-y-3">
        {items.map((item, idx) => (
          <div className="space-y-2" key={idx}>
            <div>
              <div className="flex items-start">
                <div className="flex-1 text-left">
                  <div className="font-bold">{getFieldValue(item, fieldMap.mainTitle)}</div>
                  <div>{getFieldValue(item, fieldMap.mainSubtitle)}</div>
                  <div>{getFieldValue(item, fieldMap.secondarySubtitle)}</div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="font-bold">{getFieldValue(item, fieldMap.sideTitle)}</div>
                  <div>{getFieldValue(item, fieldMap.sideSubtitle)}</div>
                  <div>{getFieldValue(item, fieldMap.secondarySideSubtitle)}</div>
                </div>
              </div>
              {getFieldValue(item, fieldMap.description) && (
                <WysiwygContent dirtyHtml={getFieldValue(item, fieldMap.description) || ''} />
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
} 