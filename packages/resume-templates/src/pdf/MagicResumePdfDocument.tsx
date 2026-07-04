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
import type { IconNode } from 'lucide';
import {
  Award,
  Briefcase,
  FolderOpen,
  Globe,
  GraduationCap,
  Languages,
  Mail,
  MapPin,
  Phone,
  User,
  Wrench,
} from 'lucide';
import type {
  ComponentDefinition,
  ComponentStyle,
  FieldMapping,
  MagicTemplateDSL,
} from '../types/magic-dsl';
import type { InfoType, Resume, SectionItem } from '../types/resume';
import { getPdfFontStack, getPdfRichTextFontFamily } from '../font-family';
import { PdfLucideIcon } from './PdfLucideIcon';
import { PdfRichText } from './PdfRichText';
import { FREE_FORM_PAGE_MIN_HEIGHT_STYLE, FREE_FORM_PAGE_SIZE } from './page-size';

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

const SECTION_ICON_MAP: Record<string, IconNode> = {
  summary: User,
  experience: Briefcase,
  education: GraduationCap,
  projects: FolderOpen,
  skills: Wrench,
  languages: Languages,
  certificates: Award,
  profiles: User,
  awards: Award,
};

const TITLE_ICON_KEYWORDS: Array<[string, IconNode]> = [
  ['工作', Briefcase], ['experience', Briefcase], ['work', Briefcase],
  ['教育', GraduationCap], ['education', GraduationCap],
  ['项目', FolderOpen], ['project', FolderOpen],
  ['技能', Wrench], ['skill', Wrench], ['technical', Wrench],
  ['语言', Languages], ['language', Languages],
  ['证书', Award], ['certif', Award], ['award', Award],
  ['个人', User], ['profile', User], ['summary', User],
  ['联系', Globe], ['contact', Globe],
];

const getSectionIcon = (component: ComponentDefinition): IconNode | undefined => {
  const sectionKey = component.dataBinding.startsWith('sections.')
    ? component.dataBinding.slice('sections.'.length)
    : '';
  if (SECTION_ICON_MAP[sectionKey]) return SECTION_ICON_MAP[sectionKey];

  const title = String(component.props?.title ?? '').toLowerCase();
  return TITLE_ICON_KEYWORDS.find(([keyword]) => title.includes(keyword))?.[1];
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

  const pdfStyle: Style = {};
  const marginTop = style.marginTop ?? style.margin;
  const marginRight = style.marginRight ?? style.margin;
  const marginBottom = style.marginBottom ?? style.margin;
  const marginLeft = style.marginLeft ?? style.margin;

  if (style.backgroundColor !== undefined) pdfStyle.backgroundColor = style.backgroundColor;
  if (style.color !== undefined) pdfStyle.color = style.color;
  if (style.padding !== undefined) pdfStyle.padding = cssSizeToPoints(style.padding);
  if (marginTop !== undefined) pdfStyle.marginTop = cssSizeToPoints(marginTop);
  if (marginRight !== undefined) pdfStyle.marginRight = cssSizeToPoints(marginRight);
  if (marginBottom !== undefined) pdfStyle.marginBottom = cssSizeToPoints(marginBottom);
  if (marginLeft !== undefined) pdfStyle.marginLeft = cssSizeToPoints(marginLeft);
  if (style.borderRadius !== undefined) pdfStyle.borderRadius = cssSizeToPoints(style.borderRadius);
  if (style.fontSize !== undefined) pdfStyle.fontSize = cssSizeToPoints(style.fontSize);
  if (style.fontWeight !== undefined) pdfStyle.fontWeight = Number(style.fontWeight);
  if (style.textAlign !== undefined) pdfStyle.textAlign = style.textAlign;

  return pdfStyle;
};

interface RenderContext {
  colors: MagicTemplateDSL['designTokens']['colors'];
  typography: MagicTemplateDSL['designTokens']['typography'];
  spacing: MagicTemplateDSL['designTokens']['spacing'];
  showTitleDivider: boolean;
  showTitleIcon: boolean;
  richTextFontFamily: string;
  locale?: string;
}

const InlineIcon = ({ icon, color, size, offsetY, strokeWidth = 2 }: {
  icon: IconNode;
  color: string;
  size: number;
  offsetY?: number;
  strokeWidth?: number;
}) => (
  <PdfLucideIcon
    icon={icon}
    color={color}
    size={size}
    strokeWidth={strokeWidth}
    style={{
      flexShrink: 0,
      marginTop: offsetY,
    }}
  />
);

const SectionTitle = ({ title, icon, sidebar, color, dividerColor, fontSize, context }: {
  title: string;
  icon?: IconNode;
  sidebar?: boolean;
  color?: string;
  dividerColor?: string;
  fontSize?: number;
  context: RenderContext;
}) => {
  const titleColor = color ?? (sidebar ? context.colors.background : context.colors.primary);
  const borderColor = dividerColor ?? titleColor;
  const resolvedFontSize = fontSize ?? cssSizeToPoints(context.typography.fontSize.lg, 12);
  const lineHeight = context.typography.lineHeight ?? 1.5;
  return (
    <View
      style={{
        alignItems: 'flex-start',
        borderBottomColor: borderColor,
        borderBottomWidth: context.showTitleDivider ? 0.75 : 0,
        flexDirection: 'row',
        gap: 4,
        marginBottom: cssSizeToPoints(context.spacing.sm, 6),
        paddingBottom: cssSizeToPoints(context.spacing.sm, 6),
      }}
    >
      {context.showTitleIcon && icon ? (
        <InlineIcon icon={icon} color={titleColor} size={resolvedFontSize} />
      ) : null}
      <Text
        style={{
          color: titleColor,
          fontSize: resolvedFontSize,
          fontWeight: context.typography.fontWeight.medium ?? 500,
          lineHeight,
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

const DateText = ({
  value,
  color,
  fontFamily,
  fontSize,
  fontWeight,
  opacity,
  textAlign,
}: {
  value: string;
  color: string;
  fontFamily: string[];
  fontSize: number;
  fontWeight?: number;
  opacity?: number;
  textAlign?: 'left' | 'right';
}) => {
  if (!value) return null;

  return (
    <Text
      style={{
        color,
        fontFamily: fontFamily as unknown as string,
        fontSize,
        fontWeight,
        lineHeight: 1.2,
        opacity,
        textAlign,
      }}
    >
      {value}
    </Text>
  );
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
  const contactFontSize = 7.5;
  const contactIconOffsetY = -0.75;
  const contactLineHeight = 1;
  const contacts: Array<{ label: string; value: string; href: string; icon?: IconNode }> = [
    { label: context.locale?.startsWith('zh') ? '电话' : 'Phone', value: info.phoneNumber, href: info.phoneNumber ? `tel:${info.phoneNumber}` : '', icon: Phone },
    { label: context.locale?.startsWith('zh') ? '邮箱' : 'Email', value: info.email, href: info.email ? `mailto:${info.email}` : '', icon: Mail },
    { label: context.locale?.startsWith('zh') ? '地址' : 'Address', value: info.address, href: '', icon: MapPin },
    { label: context.locale?.startsWith('zh') ? '网站' : 'Website', value: info.website, href: safeWebsiteUrl(info.website), icon: Globe },
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
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: labelContacts ? 5 : 7, marginTop: 2 }}>
          {contacts.map((item) => (
            <View key={`${item.label}:${item.value}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 2, width: labelContacts ? '47%' : undefined }}>
              {labelContacts ? <Text style={{ color: context.colors.textSecondary, fontSize: contactFontSize, lineHeight: contactLineHeight }}>{item.label}:</Text> : null}
              {!labelContacts && item.icon ? (
                <InlineIcon
                  icon={item.icon}
                  color={context.colors.primary}
                  size={contactFontSize}
                  offsetY={contactIconOffsetY}
                  strokeWidth={2.5}
                />
              ) : null}
              <ContactText value={item.value} href={item.href} style={{ color: context.colors.text, fontSize: contactFontSize, lineHeight: contactLineHeight, textDecoration: 'none' }} />
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
  const nameFontSize = cssSizeToPoints(
    sidebar ? context.typography.fontSize.xl : context.typography.fontSize.xxl,
    sidebar ? 15 : 18,
  );
  const headlineFontSize = cssSizeToPoints(
    sidebar ? context.typography.fontSize.md : context.typography.fontSize.lg,
    sidebar ? 10.5 : 12,
  );
  const contentGap = cssSizeToPoints(context.spacing.sm, 6);
  const contacts = [
    { icon: Mail, value: info.email },
    { icon: Phone, value: info.phoneNumber },
    { icon: MapPin, value: info.address },
    { icon: Globe, value: info.website },
  ].filter((item) => item.value);
  return (
    <View
      wrap={false}
      style={[
        { alignItems: 'center', gap: contentGap, marginBottom: cssSizeToPoints(context.spacing.lg, 12) },
        toPdfComponentStyle(component.style),
      ]}
    >
      {info.avatar ? (
        <Image src={info.avatar} style={{ width: 72, height: 72, borderRadius: 36, objectFit: 'cover' }} />
      ) : null}
      <Text style={{ color: textColor, fontSize: nameFontSize, fontWeight: 700, textAlign: 'center' }}>
        {info.fullName || (context.locale?.startsWith('zh') ? '你的名字' : 'Your Name')}
      </Text>
      {info.headline ? (
        <Text style={{ color: textColor, fontSize: headlineFontSize, fontWeight: 500, opacity: 0.8, textAlign: 'center' }}>
          {info.headline}
        </Text>
      ) : null}
      {!sidebar && contacts.length > 0 ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 7 }}>
          {contacts.map((item) => (
            <View key={item.value} style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
              <InlineIcon icon={item.icon} color={context.colors.textSecondary} size={8} offsetY={-0.75} />
              <Text style={{ color: context.colors.textSecondary, fontSize: 8, lineHeight: 1 }}>{item.value}</Text>
            </View>
          ))}
        </View>
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
  const iconColor = /^#[\da-f]{6}$/i.test(color) ? `${color}cc` : color;
  const fontSize = cssSizeToPoints('14px', 10.5);
  const iconSize = cssSizeToPoints('16px', 12);
  const lineHeight = 1.2;
  const itemGap = cssSizeToPoints('12px', 9);
  const items = [
    { icon: MapPin, value: info.address, href: '' },
    { icon: Phone, value: info.phoneNumber, href: info.phoneNumber ? `tel:${info.phoneNumber}` : '' },
    { icon: Mail, value: info.email, href: info.email ? `mailto:${info.email}` : '' },
    { icon: Globe, value: info.website, href: safeWebsiteUrl(info.website) },
  ].filter((item) => item.value);
  if (items.length === 0) return null;

  return (
    <View
      style={[
        {
          gap: cssSizeToPoints(context.spacing.md, 12),
          marginBottom: cssSizeToPoints(context.spacing.lg, 12),
        },
        toPdfComponentStyle(component.style),
      ]}
    >
      <SectionTitle
        title={context.locale?.startsWith('zh') ? '联系方式' : 'Contact'}
        sidebar={sidebar}
        color={color}
        dividerColor={color}
        fontSize={fontSize}
        context={context}
      />
      <View style={{ gap: itemGap }}>
        {items.map((item) => (
          <View key={item.value} style={{ flexDirection: 'row', alignItems: 'center', gap: itemGap }}>
            <InlineIcon icon={item.icon} color={iconColor} size={iconSize} />
            <ContactText
              value={item.value}
              href={item.href}
              style={{ color, fontSize, lineHeight, textDecoration: 'none' }}
            />
          </View>
        ))}
      </View>
    </View>
  );
};

const Description = ({
  value,
  color,
  fontFamily,
  fontSize = 8,
  marginTop = 0,
}: {
  value: string;
  color: string;
  fontFamily: string;
  fontSize?: number;
  marginTop?: number;
}) => {
  return value ? (
    <PdfRichText
      html={value}
      color={color}
      fontFamily={fontFamily}
      fontSize={fontSize}
      lineHeight={1.5}
      marginTop={marginTop}
    />
  ) : null;
};

const DefaultSectionBlock = ({ component, items, context }: {
  component: ComponentDefinition;
  items: SectionItem[];
  context: RenderContext;
}) => {
  const fields = component.fieldMap ?? {};
  const bodyFontSize = cssSizeToPoints(context.typography.fontSize.sm, 9);
  const fieldWeight = context.typography.fontWeight.medium ?? 500;
  const dateFontFamily = getPdfFontStack(context.typography.fontFamily.primary);
  return (
    <View style={[{ marginBottom: cssSizeToPoints(context.spacing.lg, 12) }, toPdfComponentStyle(component.style)]}>
      <SectionTitle title={resolveTitle(component, context.locale)} icon={getSectionIcon(component)} context={context} />
      <View style={{ gap: cssSizeToPoints(context.spacing.md, 8) }}>
        {items.map((item, index) => {
          const record = item as Record<string, unknown>;
          return (
            <View key={item.id || index} wrap={false}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                <View style={{ flexGrow: 1, flexShrink: 1 }}>
                  <Text style={{ color: context.colors.text, fontSize: bodyFontSize, fontWeight: fieldWeight }}>{getFieldValue(record, fields.mainTitle)}</Text>
                  <Text style={{ color: context.colors.text, fontSize: bodyFontSize }}>{getFieldValue(record, fields.mainSubtitle)}</Text>
                  <Text style={{ color: context.colors.textSecondary, fontSize: bodyFontSize }}>{getFieldValue(record, fields.secondarySubtitle)}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', flexShrink: 0 }}>
                  <DateText
                    value={getFieldValue(record, fields.sideTitle)}
                    color={context.colors.text}
                    fontFamily={dateFontFamily}
                    fontSize={bodyFontSize}
                    fontWeight={fieldWeight}
                    textAlign="right"
                  />
                  <Text style={{ color: context.colors.text, fontSize: bodyFontSize }}>{getFieldValue(record, fields.sideSubtitle)}</Text>
                  <Text style={{ color: context.colors.textSecondary, fontSize: bodyFontSize }}>{getFieldValue(record, fields.secondarySideSubtitle)}</Text>
                </View>
              </View>
              <Description
                value={getFieldValue(record, fields.description)}
                color={context.colors.text}
                fontFamily={context.richTextFontFamily}
                fontSize={bodyFontSize}
              />
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
  const bodyFontSize = cssSizeToPoints(context.typography.fontSize.sm, 9);
  const fieldWeight = context.typography.fontWeight.medium ?? 500;
  const dateFontFamily = getPdfFontStack(context.typography.fontFamily.primary);
  return (
    <View style={[{ marginBottom: cssSizeToPoints(context.spacing.lg, 12) }, toPdfComponentStyle(component.style)]}>
      <SectionTitle title={resolveTitle(component, context.locale)} icon={getSectionIcon(component)} context={context} />
      <View style={{ gap: 6 }}>
        {items.map((item, index) => {
          const record = item as Record<string, unknown>;
          return (
            <View key={item.id || index} wrap={false}>
              <Text style={{ color: context.colors.text, fontSize: bodyFontSize, fontWeight: fieldWeight }}>{getFieldValue(record, fields.itemName)}</Text>
              <Text style={{ color: context.colors.text, fontSize: bodyFontSize }}>{getFieldValue(record, fields.itemDetail)}</Text>
              <DateText
                value={getFieldValue(record, fields.date)}
                color={context.colors.textSecondary}
                fontFamily={dateFontFamily}
                fontSize={bodyFontSize}
              />
              <Description
                value={getFieldValue(record, fields.summary)}
                color={context.colors.text}
                fontFamily={context.richTextFontFamily}
                fontSize={bodyFontSize}
              />
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
      <SectionTitle
        title={resolveTitle(component, context.locale)}
        icon={getSectionIcon(component)}
        sidebar={sidebar}
        color={color}
        dividerColor={color}
        context={context}
      />
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
  const dateFontFamily = getPdfFontStack(context.typography.fontFamily.primary);
  return (
    <View style={[{ marginBottom: cssSizeToPoints(context.spacing.lg, 12) }, toPdfComponentStyle(component.style)]}>
      <SectionTitle
        title={resolveTitle(component, context.locale)}
        icon={getSectionIcon(component)}
        color={color}
        dividerColor={context.colors.primary}
        context={context}
      />
      <View style={{ gap: cssSizeToPoints(context.spacing.md, 8) }}>
        {items.map((item, index) => {
          const record = item as Record<string, unknown>;
          const title = getFieldValue(record, fields.title ?? ['company', 'school', 'name']);
          const subtitle = getFieldValue(record, fields.subtitle ?? ['position', 'degree', 'role']);
          const date = getFieldValue(record, fields.date ?? 'date');
          const location = getFieldValue(record, ['location']);
          const description = getFieldValue(record, fields.description ?? ['summary', 'description']);
          return (
            <View key={item.id || index} wrap={false} style={{ flexDirection: 'row', gap: 7 }}>
              <View style={{ alignItems: 'center', width: 7 }}>
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: context.colors.primary, marginTop: 2 }} />
                {index < items.length - 1 ? <View style={{ width: 0.75, flexGrow: 1, minHeight: 18, backgroundColor: context.colors.border }} /> : null}
              </View>
              <View style={{ flexGrow: 1, flexShrink: 1, gap: 2 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                  <View style={{ flexGrow: 1, flexShrink: 1, gap: 1 }}>
                    <Text style={{ color, fontSize: 9, fontWeight: 700 }}>{title}</Text>
                    {subtitle ? <Text style={{ color: context.colors.primary, fontSize: 8, fontWeight: 700 }}>{subtitle}</Text> : null}
                    {location ? <Text style={{ color, fontSize: 7.5, opacity: 0.75 }}>{location}</Text> : null}
                  </View>
                  <DateText
                    value={date}
                    color={color}
                    fontFamily={dateFontFamily}
                    fontSize={7.5}
                    opacity={0.75}
                    textAlign="right"
                  />
                </View>
                <Description
                  value={description}
                  color={color}
                  fontFamily={context.richTextFontFamily}
                  marginTop={4}
                />
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
    richTextFontFamily: getPdfRichTextFontFamily(typography.fontFamily.primary),
    locale,
  };
  const sorted = sortComponents(template, data);
  const sidebar = sorted.filter((component) => component.position?.area === 'sidebar');
  const main = sorted.filter((component) => component.position?.area !== 'sidebar');
  const lineHeight = typography.lineHeight ?? 1.5;
  const baseStyle: Style = {
    backgroundColor: colors.background,
    color: colors.text,
    fontFamily: getPdfFontStack(typography.fontFamily.primary) as unknown as string,
    fontSize: cssSizeToPoints(typography.fontSize.sm, 9),
    lineHeight,
  };
  const padding = cssSizeToPoints(template.layout.padding, 24);
  const columnGap = cssSizeToPoints(template.layout.twoColumn?.gap, 0);

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
        <Page
          size={FREE_FORM_PAGE_SIZE}
          style={[baseStyle, FREE_FORM_PAGE_MIN_HEIGHT_STYLE, { flexDirection: 'row', gap: columnGap }]}
        >
          <View
            style={{
              width: cssSizeToPoints(template.layout.twoColumn.leftWidth),
              backgroundColor: colors.sidebar ?? colors.primary,
              padding,
            }}
          >
            {sidebar.map((component) => <ComponentBlock key={component.id} component={component} data={data} sidebar context={context} />)}
          </View>
          <View
            style={{
              flexGrow: 1,
              flexShrink: 1,
              padding,
            }}
          >
            {main.map((component) => <ComponentBlock key={component.id} component={component} data={data} sidebar={false} context={context} />)}
          </View>
        </Page>
      ) : (
        <Page size={FREE_FORM_PAGE_SIZE} style={[baseStyle, FREE_FORM_PAGE_MIN_HEIGHT_STYLE]}>
          <View style={{ padding }}>
            {main.map((component) => <ComponentBlock key={component.id} component={component} data={data} sidebar={false} context={context} />)}
          </View>
        </Page>
      )}
    </Document>
  );
};
