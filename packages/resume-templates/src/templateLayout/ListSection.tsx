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
  /** resume section key — enables the editable canvas anchors */
  sectionKey?: string;
}

export const ListSection = React.memo(function ListSection({ title, items, fieldMap, className, style, titleClassName, containerClassName, titleIcon: TitleIcon, sectionKey }: Props) {
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
        {sectionKey && <SectionHandle sectionKey={sectionKey} title={title} />}
      </h4>
      <ul className={`list-none ${containerClassName || "grid gap-x-6 gap-y-1"}`}>
        {items.map((item, idx) => {
          const summary = getFieldEntry(item, fieldMap.summary);
          const itemName = getFieldEntry(item, fieldMap.itemName);
          const itemId = item.id != null ? String(item.id) : null;
          return (
            <li className="space-y-2" key={itemId || idx}>
              <div>
                {/* The item title is the only translatable/editable text for
                    skills / languages / certificates — make it an editable anchor
                    so AI batch changes (e.g. translation) can diff it in place.
                    Falls back to plain text when the canvas isn't enabled. */}
                <div className="font-bold">
                  {itemName && sectionKey && itemId ? (
                    <Editable
                      target={{
                        sectionKey,
                        itemId,
                        fieldKey: itemName.key,
                        kind: 'text',
                        label: `${title} · 第 ${idx + 1} 条`,
                      }}
                      text={itemName.value}
                    />
                  ) : (
                    getFieldValue(item, fieldMap.itemName)
                  )}
                </div>
                {getFieldValue(item, fieldMap.itemDetail) && (
                  <div>{getFieldValue(item, fieldMap.itemDetail)}</div>
                )}
                {getFieldValue(item, fieldMap.date) && (
                  <div>{getFieldValue(item, fieldMap.date)}</div>
                )}
                {summary &&
                  (sectionKey && itemId ? (
                    <Editable
                      target={{
                        sectionKey,
                        itemId,
                        fieldKey: summary.key,
                        kind: 'html',
                        label: `${title} · 第 ${idx + 1} 条`,
                      }}
                      html={summary.value}
                    />
                  ) : (
                    <WysiwygContent dirtyHtml={summary.value} />
                  ))}
              </div>
            </li>
          );
        })}
      </ul>
      {sectionKey && <SectionInsertSlot sectionKey={sectionKey} />}
    </section>
  );
});
