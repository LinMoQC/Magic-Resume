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
  ComponentStyle,
  FieldMapping,
  MagicTemplateDSL,
} from '../types/magic-dsl';
import type { InfoType, Resume, SectionItem } from '../types/resume';

type PdfStyle = Style | Style[];

export interface MagicResumePdfDocumentProps {
  data: Resume;
  template: MagicTemplateDSL;
  locale?: string;
}

const ZH_TITLE_BY_SECTION_KEY: Record<string, string> = {
  summary: '个人总结',
  experience: '工作经历',
  education: '教育经历',
  projects: '项目经历',
  skills: '专业技能',
  languages: '语言能力',
  certificates: '证书资质',
  profiles: '个人主页',
  awards: '奖项',
};

const ZH_TITLE_BY_ENGLISH: Record<string, string> = {
  summary: '个人总结',
  experience: '工作经历',
  'work experience': '工作经历',
  'professional experience': '专业经历',
  education: '教育经历',
  projects: '项目经历',
  skills: '专业技能',
  'technical skills': '技术技能',
  languages: '语言能力',
  certificates: '证书资质',
  certifications: '证书资质',
  profiles: '个人主页',
  links: '个人主页',
  awards: '奖项',
};

const cssSizeToPoints = (value: string | number | undefined, fallback = 0): number => {
  if (typeof value === 'number') return value * 0.75;
  if (!value) return fallback;

  const parsed = Number.parseFloat(value);
  if (!Number.isFinite(parsed)) return fallback;
  if (value.endsWith('rem')) return parsed * 12;
  if (value.endsWith('mm')) return parsed * 2.83465;
  if (value.endsWith('pt')) return parsed;
  return parsed * 0.75;
};

const htmlToText = (value: string | null | undefined): string => {
  if (!value) return '';

  return value
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\s*li[^>]*>/gi, '• ')
    .replace(/<\s*\/\s*(p|div|li|ul|ol|h[1-6])\s*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

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
  if (!locale?.toLowerCase().startsWith('zh')) return title;

  const sectionKey = component.dataBinding.startsWith('sections.')
    ? component.dataBinding.slice('sections.'.length)
    : '';
  return ZH_TITLE_BY_SECTION_KEY[sectionKey] ?? ZH_TITLE_BY_ENGLISH[title.trim().toLowerCase()] ?? title;
};

const sortComponents = (template: MagicTemplateDSL, data: Resume): ComponentDefinition[] => {
  const sidebar = template.components
    .filter((component) => component.position?.area === 'sidebar')
    .sort((a, b) => (a.position?.order ?? 0) - (b.position?.order ?? 0));
  const main = template.components.filter((component) => component.position?.area !== 'sidebar');
  const headers = main.filter((component) => component.dataBinding === 'info');
  const sections = main.filter((component) => component.dataBinding.startsWith('sections.'));
  const ordered: ComponentDefinition[] = [];

  for (const entry of data.sectionOrder ?? []) {
    const component = sections.find((candidate) => candidate.dataBinding === `sections.${entry.key}`);
    if (component) ordered.push(component);
  }

  for (const component of sections) {
    if (!ordered.includes(component)) ordered.push(component);
  }

  return [...sidebar, ...headers, ...ordered];
};

const toPdfComponentStyle = (style?: ComponentStyle): Style => {
  if (!style) return {};

  return {
    backgroundColor: style.backgroundColor,
    color: style.color,
    padding: cssSizeToPoints(style.padding),
    marginTop: cssSizeToPoints(style.marginTop ?? style.margin),
    marginRight: cssSizeToPoints(style.marginRight ?? style.margin),
    marginBottom: cssSizeToPoints(style.marginBottom ?? style.margin),
    marginLeft: cssSizeToPoints(style.marginLeft ?? style.margin),
    borderRadius: cssSizeToPoints(style.borderRadius),
    fontSize: style.fontSize ? cssSizeToPoints(style.fontSize) : undefined,
    fontWeight: style.fontWeight ? Number(style.fontWeight) : undefined,
    textAlign: style.textAlign,
  };
};

interface RenderContext {
  colors: MagicTemplateDSL['designTokens']['colors'];
  typography: MagicTemplateDSL['designTokens']['typography'];
  spacing: MagicTemplateDSL['designTokens']['spacing'];
  showTitleDivider: boolean;
  showTitleIcon: boolean;
  locale?: string;
}

const SectionTitle = ({ title, sidebar, context }: { title: string; sidebar?: boolean; context: RenderContext }) => {
  const color = sidebar ? context.colors.background : context.colors.primary;
  return (
    <View
      style={{
        alignItems: 'center',
        borderBottomColor: color,
        borderBottomWidth: context.showTitleDivider ? 0.75 : 0,
        flexDirection: 'row',
        gap: 4,
        marginBottom: cssSizeToPoints(context.spacing.sm, 6),
        paddingBottom: cssSizeToPoints(context.spacing.sm, 6),
      }}
    >
      {context.showTitleIcon ? (
        <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: color }} />
      ) : null}
      <Text
        style={{
          color,
          fontSize: cssSizeToPoints(context.typography.fontSize.lg, 12),
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
  const contacts = [
    { label: context.locale?.startsWith('zh') ? '电话' : 'Phone', value: info.phoneNumber, href: info.phoneNumber ? `tel:${info.phoneNumber}` : '' },
    { label: context.locale?.startsWith('zh') ? '邮箱' : 'Email', value: info.email, href: info.email ? `mailto:${info.email}` : '' },
    { label: context.locale?.startsWith('zh') ? '地址' : 'Address', value: info.address, href: '' },
    { label: context.locale?.startsWith('zh') ? '网站' : 'Website', value: info.website, href: safeWebsiteUrl(info.website) },
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
            <View key={`${item.label}:${item.value}`} style={{ flexDirection: 'row', gap: 2, width: labelContacts ? '47%' : undefined }}>
              {labelContacts ? <Text style={{ color: context.colors.textSecondary, fontSize: 7.5 }}>{item.label}:</Text> : null}
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
      <SectionTitle title={context.locale?.startsWith('zh') ? '联系方式' : 'Contact'} sidebar={sidebar} context={context} />
      <View style={{ gap: 7 }}>
        {items.map((item) => (
          <ContactText key={item.value} value={item.value} href={item.href} style={{ color, fontSize: 8, textDecoration: 'none' }} />
        ))}
      </View>
    </View>
  );
};

const Description = ({ value, color }: { value: string; color: string }) => {
  const text = htmlToText(value);
  return text ? <Text style={{ color, fontSize: 8, lineHeight: 1.45, marginTop: 4 }}>{text}</Text> : null;
};

const DefaultSectionBlock = ({ component, items, context }: {
  component: ComponentDefinition;
  items: SectionItem[];
  context: RenderContext;
}) => {
  const fields = component.fieldMap ?? {};
  return (
    <View style={[{ marginBottom: cssSizeToPoints(context.spacing.lg, 12) }, toPdfComponentStyle(component.style)]}>
      <SectionTitle title={resolveTitle(component, context.locale)} context={context} />
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
      <SectionTitle title={resolveTitle(component, context.locale)} context={context} />
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
      <SectionTitle title={resolveTitle(component, context.locale)} sidebar={sidebar} context={context} />
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
      <SectionTitle title={resolveTitle(component, context.locale)} context={context} />
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

export const MagicResumePdfDocument = ({ data, template, locale }: MagicResumePdfDocumentProps) => {
  const { colors, typography, spacing } = template.designTokens;
  const context: RenderContext = {
    colors,
    typography,
    spacing,
    showTitleDivider: template.layout.showTitleDivider !== false,
    showTitleIcon: template.layout.showTitleIcon !== false,
    locale,
  };
  const sorted = sortComponents(template, data);
  const sidebar = sorted.filter((component) => component.position?.area === 'sidebar');
  const main = sorted.filter((component) => component.position?.area !== 'sidebar');
  const lineHeight = typography.lineHeight ?? 1.5;
  const baseStyle: Style = {
    backgroundColor: colors.background,
    color: colors.text,
    fontFamily: 'Source Han Sans SC',
    fontSize: cssSizeToPoints(typography.fontSize.sm, 9),
    lineHeight,
  };
  const padding = cssSizeToPoints(template.layout.padding, 24);

  return (
    <Document
      author={data.info.fullName}
      creator="Magic Resume"
      language={locale ?? 'zh-CN'}
      producer="Magic Resume"
      subject={data.info.headline}
      title={data.name || data.info.fullName}
    >
      {template.layout.type === 'two-column' && template.layout.twoColumn ? (
        <Page size="A4" style={[baseStyle, { flexDirection: 'row' }]}>
          <View
            style={{
              width: template.layout.twoColumn.leftWidth,
              backgroundColor: colors.sidebar ?? colors.primary,
              padding,
              paddingRight: Math.max(padding - cssSizeToPoints(template.layout.twoColumn.gap) / 2, 8),
            }}
          >
            {sidebar.map((component) => <ComponentBlock key={component.id} component={component} data={data} sidebar context={context} />)}
          </View>
          <View
            style={{
              flexGrow: 1,
              flexShrink: 1,
              padding,
              paddingLeft: Math.max(padding - cssSizeToPoints(template.layout.twoColumn.gap) / 2, 8),
            }}
          >
            {main.map((component) => <ComponentBlock key={component.id} component={component} data={data} sidebar={false} context={context} />)}
          </View>
        </Page>
      ) : (
        <Page size="A4" style={[baseStyle, { padding }]}>
          {main.map((component) => <ComponentBlock key={component.id} component={component} data={data} sidebar={false} context={context} />)}
        </Page>
      )}
    </Document>
  );
};
