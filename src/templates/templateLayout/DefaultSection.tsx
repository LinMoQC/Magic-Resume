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

export const DefaultSection = React.memo(function DefaultSection({ title, items, fieldMap, className, style, titleClassName, containerClassName, titleIcon: TitleIcon }: Props) {
  if (!items || items.length === 0) return null;

  return (
    <section 
      className={`grid ${className || ''}`} 
      style={{
        ...style,
        fontSize: 'var(--font-size-body)',
        lineHeight: 'var(--line-height)',
        letterSpacing: 'var(--letter-spacing)',
        marginBottom: 'var(--section-spacing)',
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
        {TitleIcon && <TitleIcon size={16} style={{ display: 'var(--title-icon-display)', flexShrink: 0 }} />}
        {title}
      </h4>
      <div 
        className={containerClassName || "grid gap-x-6 gap-y-3"}
        style={{ gap: 'var(--paragraph-spacing)' }}
      >
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
});
