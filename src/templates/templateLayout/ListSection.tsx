import React from 'react';
import { getFieldValue } from './utils';
import { WysiwygContent } from './WysiwygContent';

interface Item {
  [key: string]: unknown;
}

interface Props {
  title: string;
  items: Item[];
  fieldMap: Record<string, string | string[]>;
  className?: string;
  style?: React.CSSProperties;
  titleClassName?: string;
  containerClassName?: string;
  titleIcon?: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
}

export const ListSection = React.memo(function ListSection({ title, items, fieldMap, className, style, titleClassName, containerClassName, titleIcon: TitleIcon }: Props) {
  if (!items || items.length === 0) return null;

  return (
    <section 
      className={`grid ${className || ''}`}
      style={{
        ...style,
        fontSize: 'var(--font-size-body)',
        lineHeight: 'var(--line-height)',
        letterSpacing: 'var(--letter-spacing)',
      }}
    >
      <h4
        className={titleClassName || "font-bold"}
        style={{
          color: 'var(--color-primary)',
          fontSize: 'var(--font-size-title)',
          marginBottom: 'var(--section-title-spacing)',
          paddingBottom: 'var(--section-title-spacing)',
          borderBottomWidth: 'var(--title-divider-width)',
          borderBottomStyle: 'solid',
          borderBottomColor: 'var(--color-primary)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4em',
        }}
      >
        {TitleIcon && <TitleIcon style={{ display: 'var(--title-icon-display)', flexShrink: 0, width: '1em', height: '1em' }} />}
        {title}
      </h4>
      <ul className={`list-none ${containerClassName || "grid gap-x-6 gap-y-1"}`}>
        {items.map((item, idx) => (
          <li className="space-y-2" key={idx}>
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
          </li>
        ))}
      </ul>
    </section>
  );
});
