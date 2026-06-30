import React from 'react';
import {
  Document,
  Image,
  Link,
  Page,
  Text,
  View,
} from '@react-pdf/renderer';
import type { Style } from '@react-pdf/types';
import type {
  ComponentDefinition,
  FieldMapping,
  MagicTemplateDSL,
} from '../types/magic-dsl';
import type { InfoType, Resume, SectionItem } from '../types/resume';
import { resolvePdfSectionTitle, getPdfSectionIconName, PdfRenderProvider } from './context';
import { buildPdfComponentMap, planPdfLayout, type PdfLayoutPagePlan } from './layout';
import { PdfIcon, type PdfIconName } from './pdfIcons';
import { RichText } from './shared/rich-text';
import { cssSizeToPoints, toPdfComponentStyle } from './shared/styles';

type PdfStyle = Style | Style[];

const sectionKeyOf = (component: ComponentDefinition): string | undefined =>
  component.dataBinding.startsWith('sections.')
    ? component.dataBinding.slice('sections.'.length)
    : undefined;

export interface MagicResumePdfDocumentProps {
  data: Resume;
  template: MagicTemplateDSL;
  locale?: string;
  /**
   * 单页连续模式:把整份简历放在「一整页」上(高度=内容高,不切 A4)。
   * 单位 pt。通常由导出时测量预览 DOM 高度换算得到(px × 0.75)。
   * 仅当布局规划为单页(无显式 pdfLayout.pages)时生效。
   */
  pageHeight?: number;
}

const getNestedValue = (item: Record<string, unknown>, path: string): unknown => {
  return path.split('.').reduce<unknown>((current, key) => {
    if (!current || typeof current !== 'object') return undefined;
    return (current as Record<string, unknown>)[key];
  }, item);
};

const getFieldValue = (
  item: Record<string, unknown>,
  field: string | string[] | undefined,
): string => {
  if (!field) return '';
  const fields = Array.isArray(field) ? field : [field];

  for (const candidate of fields) {
    const value = getNestedValue(item, candidate);
    if (value !== undefined && value !== null && value !== '') return String(value);
  }

  return '';
};

const isVisible = (item: SectionItem) => (
  item.visible !== false && item.visible !== ('false' as unknown) && item.visible !== (0 as unknown)
);

const getSectionItems = (data: Resume, binding: string): SectionItem[] => {
  if (!binding.startsWith('sections.')) return [];
  const key = binding.slice('sections.'.length);
  return (data.sections[key] ?? []).filter(isVisible);
};

const resolveTitle = (component: ComponentDefinition, locale?: string): string => {
  const title = String(component.props?.title ?? 'Section');
  return resolvePdfSectionTitle({ sectionKey: sectionKeyOf(component), fallbackTitle: title, locale });
};

interface RenderContext {
  colors: MagicTemplateDSL['designTokens']['colors'];
  typography: MagicTemplateDSL['designTokens']['typography'];
  spacing: MagicTemplateDSL['designTokens']['spacing'];
  showTitleDivider: boolean;
  showTitleIcon: boolean;
  locale?: string;
}

const SectionTitle = ({ title, sidebar, context, iconName }: { title: string; sidebar?: boolean; context: RenderContext; iconName?: PdfIconName | null }) => {
  const color = sidebar ? context.colors.background : context.colors.primary;
  const titleSize = cssSizeToPoints(context.typography.fontSize.lg, 12);
  return (
    <View
      wrap={false}
      minPresenceAhead={48}
      style={{
        alignItems: 'center',
        borderBottomColor: color,
        borderBottomWidth: context.showTitleDivider ? 0.75 : 0,
        flexDirection: 'row',
        gap: titleSize * 0.4,
        marginBottom: cssSizeToPoints(context.spacing.sm, 6),
        paddingBottom: cssSizeToPoints(context.spacing.sm, 6),
      }}
    >
      {context.showTitleIcon && iconName ? (
        <PdfIcon name={iconName} size={titleSize} color={color} />
      ) : context.showTitleIcon ? (
        <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: color }} />
      ) : null}
      <Text
        style={{
          color,
          fontSize: titleSize,
          fontWeight: 700,
          textTransform: sidebar ? 'uppercase' : undefined,
        }}
      >
        {title}
      </Text>
    </View>
  );
};

const safeWebsiteUrl = (value: string): string => {
  if (!value) return '';
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
};

const ContactText = ({ value, href, style }: { value: string; href?: string; style: PdfStyle }) => {
  if (!value) return null;
  return href ? <Link src={href} style={style}>{value}</Link> : <Text style={style}>{value}</Text>;
};

const HeaderBlock = ({ info, component, context }: {
  info: InfoType;
  component: ComponentDefinition;
  context: RenderContext;
}) => {
  const props = component.props ?? {};
  const avatarPosition = props.avatarPosition === 'right' ? 'right' : 'left';
  const labelContacts = props.contactStyle === 'label';
  const avatarWidth = cssSizeToPoints(Number(props.avatarWidth ?? 40));
  const avatarHeight = cssSizeToPoints(Number(props.avatarHeight ?? 40));
  const contacts: Array<{ label: string; value: string; href: string; icon?: PdfIconName }> = [
    { label: context.locale?.startsWith('zh') ? '电话' : 'Phone', value: info.phoneNumber, href: info.phoneNumber ? `tel:${info.phoneNumber}` : '', icon: 'phone' },
    { label: context.locale?.startsWith('zh') ? '邮箱' : 'Email', value: info.email, href: info.email ? `mailto:${info.email}` : '', icon: 'mail' },
    { label: context.locale?.startsWith('zh') ? '地址' : 'Address', value: info.address, href: '', icon: 'mapPin' },
    { label: context.locale?.startsWith('zh') ? '网站' : 'Website', value: info.website, href: safeWebsiteUrl(info.website), icon: 'globe' },
  ].filter((item) => item.value);

  if (props.showCustomFields) {
    for (const field of info.customFields ?? []) {
      if (field.name?.trim() && field.value?.trim()) {
        contacts.push({ label: field.name.trim(), value: field.value.trim(), href: '' });
      }
    }
  }

  const avatar = info.avatar ? (
    <Image
      src={info.avatar}
      style={{
        width: avatarWidth,
        height: avatarHeight,
        borderRadius: props.avatarRounded === false ? 3 : Math.min(avatarWidth, avatarHeight) / 2,
        objectFit: 'cover',
      }}
    />
  ) : null;

  return (
    <View
      wrap={false}
      style={[
        { flexDirection: 'row', alignItems: 'flex-start', gap: 12, marginBottom: cssSizeToPoints(context.spacing.lg, 12) },
        toPdfComponentStyle(component.style),
      ]}
    >
      {avatarPosition === 'left' ? avatar : null}
      <View style={{ flexGrow: 1, flexShrink: 1, gap: 3 }}>
        <Text style={{ color: context.colors.text, fontSize: labelContacts ? 16 : 13, fontWeight: 700 }}>
          {info.fullName || (context.locale?.startsWith('zh') ? '你的名字' : 'Your Name')}
        </Text>
        {info.headline ? <Text style={{ color: context.colors.textSecondary, fontSize: 9 }}>{info.headline}</Text> : null}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: labelContacts ? 5 : 7, marginTop: 2 }}>
          {contacts.map((item) => (
            <View key={`${item.label}:${item.value}`} style={{ flexDirection: 'row', gap: 2.5, alignItems: 'center', width: labelContacts ? '47%' : undefined }}>
              {labelContacts ? (
                <Text style={{ color: context.colors.textSecondary, fontSize: 7.5 }}>{item.label}:</Text>
              ) : item.icon ? (
                <PdfIcon name={item.icon} size={7.5} color={context.colors.primary} />
              ) : null}
              <ContactText value={item.value} href={item.href} style={{ color: context.colors.text, fontSize: 7.5, textDecoration: 'none' }} />
            </View>
          ))}
        </View>
      </View>
      {avatarPosition === 'right' ? avatar : null}
    </View>
  );
};

const ProfileBlock = ({ info, component, sidebar, context }: {
  info: InfoType;
  component: ComponentDefinition;
  sidebar: boolean;
  context: RenderContext;
}) => {
  const textColor = component.style?.color ?? (sidebar ? context.colors.background : context.colors.text);
  return (
    <View
      wrap={false}
      style={[
        { alignItems: 'center', gap: 6, marginBottom: cssSizeToPoints(context.spacing.lg, 12) },
        toPdfComponentStyle(component.style),
      ]}
    >
      {info.avatar ? (
        <Image src={info.avatar} style={{ width: 72, height: 72, borderRadius: 36, objectFit: 'cover' }} />
      ) : null}
      <Text style={{ color: textColor, fontSize: sidebar ? 14 : 18, fontWeight: 700, textAlign: 'center' }}>
        {info.fullName || (context.locale?.startsWith('zh') ? '你的名字' : 'Your Name')}
      </Text>
      {info.headline ? <Text style={{ color: textColor, fontSize: 9, opacity: 0.85, textAlign: 'center' }}>{info.headline}</Text> : null}
      {!sidebar ? (
        <Text style={{ color: context.colors.textSecondary, fontSize: 8, textAlign: 'center' }}>
          {[info.email, info.phoneNumber, info.address, info.website].filter(Boolean).join('  |  ')}
        </Text>
      ) : null}
    </View>
  );
};

const ContactBlock = ({ info, component, sidebar, context }: {
  info: InfoType;
  component: ComponentDefinition;
  sidebar: boolean;
  context: RenderContext;
}) => {
  const color = component.style?.color ?? (sidebar ? context.colors.background : context.colors.text);
  const items = [
    { value: info.address, href: '' },
    { value: info.phoneNumber, href: info.phoneNumber ? `tel:${info.phoneNumber}` : '' },
    { value: info.email, href: info.email ? `mailto:${info.email}` : '' },
    { value: info.website, href: safeWebsiteUrl(info.website) },
  ].filter((item) => item.value);
  if (items.length === 0) return null;

  return (
    <View style={[{ marginBottom: cssSizeToPoints(context.spacing.lg, 12) }, toPdfComponentStyle(component.style)]}>
      <SectionTitle title={context.locale?.startsWith('zh') ? '联系方式' : 'Contact'} sidebar={sidebar} context={context} iconName={getPdfSectionIconName('contact')} />
      <View style={{ gap: 7 }}>
        {items.map((item) => (
          <ContactText key={item.value} value={item.value} href={item.href} style={{ color, fontSize: 8, textDecoration: 'none' }} />
        ))}
      </View>
    </View>
  );
};

const Description = ({ value, color }: { value: string; color: string }) => (
  <RichText html={value} baseFontSize={8} color={color} lineHeight={1.1} />
);

const DefaultSectionBlock = ({ component, items, context }: {
  component: ComponentDefinition;
  items: SectionItem[];
  context: RenderContext;
}) => {
  const fields = component.fieldMap ?? {};
  return (
    <View style={[{ marginBottom: cssSizeToPoints(context.spacing.lg, 12) }, toPdfComponentStyle(component.style)]}>
      <SectionTitle title={resolveTitle(component, context.locale)} context={context} iconName={getPdfSectionIconName(sectionKeyOf(component))} />
      <View style={{ gap: cssSizeToPoints(context.spacing.md, 8) }}>
        {items.map((item, index) => {
          const record = item as Record<string, unknown>;
          return (
            <View key={item.id || index} style={{ gap: 2 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }} wrap={false}>
                <View style={{ flexGrow: 1, flexShrink: 1, gap: 1 }}>
                  <Text style={{ color: context.colors.text, fontSize: 9, fontWeight: 700 }}>{getFieldValue(record, fields.mainTitle)}</Text>
                  <Text style={{ color: context.colors.text, fontSize: 8 }}>{getFieldValue(record, fields.mainSubtitle)}</Text>
                  <Text style={{ color: context.colors.textSecondary, fontSize: 7.5 }}>{getFieldValue(record, fields.secondarySubtitle)}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', flexShrink: 0, gap: 1 }}>
                  <Text style={{ color: context.colors.text, fontSize: 8, fontWeight: 700 }}>{getFieldValue(record, fields.sideTitle)}</Text>
                  <Text style={{ color: context.colors.text, fontSize: 7.5 }}>{getFieldValue(record, fields.sideSubtitle)}</Text>
                  <Text style={{ color: context.colors.textSecondary, fontSize: 7.5 }}>{getFieldValue(record, fields.secondarySideSubtitle)}</Text>
                </View>
              </View>
              <Description value={getFieldValue(record, fields.description)} color={context.colors.text} />
            </View>
          );
        })}
      </View>
    </View>
  );
};

const ListSectionBlock = ({ component, items, context }: {
  component: ComponentDefinition;
  items: SectionItem[];
  context: RenderContext;
}) => {
  const fields = component.fieldMap ?? {};
  return (
    <View style={[{ marginBottom: cssSizeToPoints(context.spacing.lg, 12) }, toPdfComponentStyle(component.style)]}>
      <SectionTitle title={resolveTitle(component, context.locale)} context={context} iconName={getPdfSectionIconName(sectionKeyOf(component))} />
      <View style={{ gap: 6 }}>
        {items.map((item, index) => {
          const record = item as Record<string, unknown>;
          return (
            <View key={item.id || index} style={{ gap: 2 }}>
              <Text style={{ color: context.colors.text, fontSize: 8.5, fontWeight: 700 }}>{getFieldValue(record, fields.itemName)}</Text>
              <Text style={{ color: context.colors.text, fontSize: 8 }}>{getFieldValue(record, fields.itemDetail)}</Text>
              <Text style={{ color: context.colors.textSecondary, fontSize: 7.5 }}>{getFieldValue(record, fields.date)}</Text>
              <Description value={getFieldValue(record, fields.summary)} color={context.colors.text} />
            </View>
          );
        })}
      </View>
    </View>
  );
};

const CompactListBlock = ({ component, items, sidebar, context }: {
  component: ComponentDefinition;
  items: SectionItem[];
  sidebar: boolean;
  context: RenderContext;
}) => {
  const fields: FieldMapping = component.fieldMap ?? {};
  const color = component.style?.color ?? (sidebar ? context.colors.background : context.colors.text);
  return (
    <View style={[{ marginBottom: cssSizeToPoints(context.spacing.lg, 12) }, toPdfComponentStyle(component.style)]}>
      <SectionTitle title={resolveTitle(component, context.locale)} sidebar={sidebar} context={context} iconName={getPdfSectionIconName(sectionKeyOf(component))} />
      <View style={{ gap: 7 }}>
        {items.map((item, index) => {
          const record = item as Record<string, unknown>;
          const name = getFieldValue(record, fields.title ?? ['name', 'skill', 'language', 'certificate']);
          const level = getFieldValue(record, fields.level ?? 'level');
          return (
            <View key={item.id || index} wrap={false} style={{ gap: 2 }}>
              <Text style={{ color, fontSize: 8.5, fontWeight: 700 }}>{name}</Text>
              {level ? <Text style={{ color, fontSize: 7.5, opacity: 0.8 }}>{level}</Text> : null}
            </View>
          );
        })}
      </View>
    </View>
  );
};

const TimelineBlock = ({ component, items, context }: {
  component: ComponentDefinition;
  items: SectionItem[];
  context: RenderContext;
}) => {
  const fields = component.fieldMap ?? {};
  const color = component.style?.color ?? context.colors.text;
  return (
    <View style={[{ marginBottom: cssSizeToPoints(context.spacing.lg, 12) }, toPdfComponentStyle(component.style)]}>
      <SectionTitle title={resolveTitle(component, context.locale)} context={context} iconName={getPdfSectionIconName(sectionKeyOf(component))} />
      <View style={{ gap: cssSizeToPoints(context.spacing.md, 8) }}>
        {items.map((item, index) => {
          const record = item as Record<string, unknown>;
          const title = getFieldValue(record, fields.title ?? ['company', 'school', 'name']);
          const subtitle = getFieldValue(record, fields.subtitle ?? ['position', 'degree', 'role']);
          const date = getFieldValue(record, fields.date ?? 'date');
          const location = getFieldValue(record, ['location']);
          const description = getFieldValue(record, fields.description ?? ['summary', 'description']);
          return (
            <View key={item.id || index} style={{ flexDirection: 'row', gap: 7 }}>
              <View style={{ alignItems: 'center', width: 7 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: context.colors.primary, marginTop: 2 }} />
                {index < items.length - 1 ? <View style={{ width: 0.75, flexGrow: 1, minHeight: 18, backgroundColor: context.colors.border }} /> : null}
              </View>
              <View style={{ flexGrow: 1, flexShrink: 1, gap: 2 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }} wrap={false}>
                  <View style={{ flexGrow: 1, flexShrink: 1, gap: 1 }}>
                    <Text style={{ color, fontSize: 9, fontWeight: 700 }}>{title}</Text>
                    {subtitle ? <Text style={{ color: context.colors.primary, fontSize: 8, fontWeight: 700 }}>{subtitle}</Text> : null}
                    {location ? <Text style={{ color, fontSize: 7.5, opacity: 0.75 }}>{location}</Text> : null}
                  </View>
                  {date ? <Text style={{ color, fontSize: 7.5, opacity: 0.75 }}>{date}</Text> : null}
                </View>
                <Description value={description} color={color} />
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
};

const ComponentBlock = ({ component, data, sidebar, context }: {
  component: ComponentDefinition;
  data: Resume;
  sidebar: boolean;
  context: RenderContext;
}) => {
  if (component.dataBinding === 'info') {
    if (component.type === 'ProfileCard') return <ProfileBlock info={data.info} component={component} sidebar={sidebar} context={context} />;
    if (component.type === 'ContactInfo') return <ContactBlock info={data.info} component={component} sidebar={sidebar} context={context} />;
    return <HeaderBlock info={data.info} component={component} context={context} />;
  }

  const items = getSectionItems(data, component.dataBinding);
  if (items.length === 0) return null;

  if (component.type === 'CompactList') return <CompactListBlock component={component} items={items} sidebar={sidebar} context={context} />;
  if (component.type === 'Timeline') return <TimelineBlock component={component} items={items} context={context} />;
  if (component.type === 'ListSection') return <ListSectionBlock component={component} items={items} context={context} />;
  return <DefaultSectionBlock component={component} items={items} context={context} />;
};

export const MagicResumePdfDocument = ({ data, template, locale, pageHeight }: MagicResumePdfDocumentProps) => {
  const { colors, typography, spacing } = template.designTokens;
  const context: RenderContext = {
    colors,
    typography,
    spacing,
    showTitleDivider: template.layout.showTitleDivider !== false,
    showTitleIcon: template.layout.showTitleIcon !== false,
    locale,
  };
  const layoutPlan = planPdfLayout(template, data);
  const componentMap = buildPdfComponentMap(template);
  // 单页连续模式:仅在单页规划 + 提供了 pageHeight 时启用。
  const continuous = typeof pageHeight === 'number' && pageHeight > 0 && layoutPlan.pages.length === 1;
  const containerWidthPt = cssSizeToPoints(template.layout.containerWidth, 595);
  const pageSize: 'A4' | [number, number] = continuous ? [containerWidthPt, pageHeight as number] : 'A4';
  // Source Han Sans 行盒偏高:把基础行高收紧(封顶 1.3),避免标题/副标题/日期等也显得松。
  const lineHeight = Math.min(typography.lineHeight ?? 1.5, 1.3);
  const baseStyle: Style = {
    backgroundColor: colors.background,
    color: colors.text,
    fontFamily: 'Source Han Sans SC',
    fontSize: cssSizeToPoints(typography.fontSize.sm, 9),
    lineHeight,
  };
  const padding = cssSizeToPoints(template.layout.padding, 24);
  const renderComponents = (ids: string[], sidebar: boolean) => ids.map((id) => {
    const component = componentMap.get(id);
    if (!component) return null;

    return <ComponentBlock key={component.id} component={component} data={data} sidebar={sidebar} context={context} />;
  });

  const renderTwoColumnPage = (page: PdfLayoutPagePlan, index: number) => {
    const sidebarWidth = layoutPlan.sidebarWidth ? `${layoutPlan.sidebarWidth}%` : template.layout.twoColumn?.leftWidth;

    return (
      <Page key={`page-${index}`} size={pageSize} wrap={!continuous} style={[baseStyle, { flexDirection: 'row' }]}>
        <View
          fixed={!continuous}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            width: sidebarWidth,
            backgroundColor: colors.sidebar ?? colors.primary,
          }}
        />
        <View
          style={{
            width: sidebarWidth,
            padding,
            paddingRight: Math.max(padding - cssSizeToPoints(template.layout.twoColumn?.gap) / 2, 8),
          }}
        >
          {renderComponents(page.sidebar, true)}
        </View>
        <View
          style={{
            flexGrow: 1,
            flexShrink: 1,
            padding,
            paddingLeft: Math.max(padding - cssSizeToPoints(template.layout.twoColumn?.gap) / 2, 8),
          }}
        >
          {renderComponents(page.main, false)}
        </View>
      </Page>
    );
  };

  const renderFullWidthPage = (page: PdfLayoutPagePlan, index: number) => (
    <Page key={`page-${index}`} size={pageSize} wrap={!continuous} style={[baseStyle, { padding }]}>
      {renderComponents([...page.sidebar, ...page.main], false)}
    </Page>
  );

  return (
    <PdfRenderProvider data={data} template={template} locale={locale}>
      <Document
        author={data.info.fullName}
        creator="Magic Resume"
        language={locale ?? 'zh-CN'}
        producer="Magic Resume"
        subject={data.info.headline}
        title={data.name || data.info.fullName}
      >
        {layoutPlan.pages.map((page, index) => (
          template.layout.type === 'two-column' && template.layout.twoColumn && !page.fullWidth
            ? renderTwoColumnPage(page, index)
            : renderFullWidthPage(page, index)
        ))}
      </Document>
    </PdfRenderProvider>
  );
};
