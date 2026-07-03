import React from 'react';
import { getFieldValue, getFieldEntry } from './utils';
import { WysiwygContent } from './WysiwygContent';
import { Editable, SectionHandle, SectionInsertSlot } from '../renderer/EditableCanvas';

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
  /** resume section key (e.g. `experience`) — enables the editable canvas anchors */
  sectionKey?: string;
}

export const DefaultSection = React.memo(function DefaultSection({ title, items, fieldMap, className, style, titleClassName, containerClassName, titleIcon: TitleIcon, sectionKey }: Props) {
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
        {TitleIcon && <TitleIcon style={{ display: 'var(--title-icon-display)', flexShrink: 0, width: '1em', height: '1em' }} />}
        {title}
        {sectionKey && <SectionHandle sectionKey={sectionKey} title={title} />}
      </h4>
      <div 
        className={containerClassName || "grid gap-x-6 gap-y-3"}
        style={{ gap: 'var(--paragraph-spacing)' }}
      >
        {items.map((item, idx) => {
          const description = getFieldEntry(item, fieldMap.description);
          const itemId = item.id != null ? String(item.id) : null;
          return (
            <div className="space-y-2" key={itemId || idx}>
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
                {description &&
                  (sectionKey && itemId ? (
                    <Editable
                      target={{
                        sectionKey,
                        itemId,
                        fieldKey: description.key,
                        kind: 'html',
                        label: `${title} · 第 ${idx + 1} 条`,
                      }}
                      html={description.value}
                    />
                  ) : (
                    <WysiwygContent dirtyHtml={description.value} />
                  ))}
              </div>
            </div>
          );
        })}
        {sectionKey && <SectionInsertSlot sectionKey={sectionKey} />}
      </div>
    </section>
  );
});
