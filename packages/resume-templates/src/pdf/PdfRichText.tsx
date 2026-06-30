import React from 'react';
import { Link, Text, View } from '@react-pdf/renderer';
import type { Style } from '@react-pdf/types';
import { HTMLElement, NodeType, parse } from 'node-html-parser';
import Html from 'react-pdf-html';

interface PdfRichTextProps {
  html: string;
  color: string;
  fontFamily: string;
  fontSize: number;
  lineHeight?: number;
  marginTop?: number;
}

type HtmlRenderers = NonNullable<React.ComponentProps<typeof Html>['renderers']>;

const INLINE_TAGS = new Set([
  'a', 'abbr', 'b', 'br', 'cite', 'code', 'dfn', 'em', 'i', 'q', 's', 'span', 'strong', 'sub', 'sup', 'u',
]);
const SAFE_STYLE_PROPERTIES = new Set([
  'background-color', 'color', 'font-style', 'font-weight', 'text-align', 'text-decoration',
]);
const SAFE_TEXT_STYLE_KEYS = new Set<keyof Style>([
  'backgroundColor',
  'color',
  'fontFamily',
  'fontSize',
  'fontStyle',
  'fontWeight',
  'letterSpacing',
  'lineHeight',
  'opacity',
  'textAlign',
  'textDecoration',
  'textDecorationColor',
  'textDecorationStyle',
  'textIndent',
  'textTransform',
]);
const safeTextLayoutStyle = {
  flexShrink: 1,
  maxWidth: '100%',
  minWidth: 0,
} satisfies Style;

const constrainedWidthStyle = {
  flexShrink: 1,
  maxWidth: '100%',
  minWidth: 0,
  width: '100%',
} satisfies Style;

const getTagName = (element: HTMLElement): string => element.rawTagName.toLowerCase();

const isInlineNode = (node: import('node-html-parser').Node): boolean => {
  if (node.nodeType === NodeType.TEXT_NODE || node.nodeType === NodeType.COMMENT_NODE) return true;
  if (node.nodeType !== NodeType.ELEMENT_NODE) return false;

  const element = node as HTMLElement;
  return INLINE_TAGS.has(getTagName(element)) && element.childNodes.every(isInlineNode);
};

const safeLinkTarget = (value: string): string => {
  const target = value.trim();
  return /^(https?:|mailto:|tel:)/i.test(target) ? target : '';
};

const sanitizeInlineStyle = (value: string): string => value
  .split(';')
  .map((declaration) => declaration.trim())
  .filter(Boolean)
  .flatMap((declaration) => {
    const separator = declaration.indexOf(':');
    if (separator < 0) return [];
    const property = declaration.slice(0, separator).trim().toLowerCase();
    const styleValue = declaration.slice(separator + 1).trim();
    if (!SAFE_STYLE_PROPERTIES.has(property) || !styleValue || /url\s*\(/i.test(styleValue)) return [];
    return [`${property}: ${styleValue}`];
  })
  .join('; ');

const sanitizeElements = (root: HTMLElement) => {
  for (const element of root.querySelectorAll('*')) {
    const tagName = getTagName(element);
    if (['iframe', 'img', 'link', 'script', 'style'].includes(tagName)) {
      element.remove();
      continue;
    }

    for (const attribute of Object.keys(element.attributes)) {
      if (attribute.toLowerCase().startsWith('on')) element.removeAttribute(attribute);
    }

    const style = sanitizeInlineStyle(element.getAttribute('style') ?? '');
    if (style) element.setAttribute('style', style);
    else element.removeAttribute('style');

    if (tagName === 'a') {
      const target = safeLinkTarget(element.getAttribute('href') ?? '');
      if (target) element.setAttribute('href', target);
      else element.removeAttribute('href');
    }
  }
};

const unwrapSingleParagraphListItems = (root: HTMLElement) => {
  for (const listItem of root.querySelectorAll('li')) {
    const meaningfulChildren = listItem.childNodes.filter((node) => (
      node.nodeType !== NodeType.TEXT_NODE || node.toString().trim().length > 0
    ));
    if (meaningfulChildren.length !== 1) continue;

    const child = meaningfulChildren[0];
    if (!(child instanceof HTMLElement) || getTagName(child) !== 'p') continue;
    listItem.innerHTML = child.innerHTML;
  }
};

const normalizeRichTextHtml = (html: string): string => {
  const root = parse(html.trim(), { comment: false });
  sanitizeElements(root);
  unwrapSingleParagraphListItems(root);

  const normalized: string[] = [];
  let inlineNodes: string[] = [];
  const flushInlineNodes = () => {
    const inlineHtml = inlineNodes.join('').trim();
    if (inlineHtml) normalized.push(`<p>${inlineHtml}</p>`);
    inlineNodes = [];
  };

  for (const node of root.childNodes) {
    if (isInlineNode(node)) {
      inlineNodes.push(node.toString());
      continue;
    }
    flushInlineNodes();
    normalized.push(node.toString());
  }
  flushInlineNodes();

  return normalized.join('');
};

const safeTextStyles = (styles: Style[]): Style[] => styles.map((style) => {
  const safeStyle: Style = {};
  for (const [key, value] of Object.entries(style)) {
    if (SAFE_TEXT_STYLE_KEYS.has(key as keyof Style)) {
      (safeStyle as Record<string, unknown>)[key] = value;
    }
  }
  return safeStyle;
});

const stripListLayoutStyles = (styles: Style[]): Style[] => styles.map((style) => {
  const cleanStyle = { ...style } as Style & Record<string, unknown>;
  for (const property of [
    'display',
    'flexDirection',
    'listStyle',
    'listStyleType',
    'margin',
    'marginBottom',
    'marginTop',
    'marginVertical',
    'padding',
    'paddingLeft',
  ]) {
    delete cleanStyle[property];
  }
  return cleanStyle;
});

const resolveStyleColor = (styles: Style[], fallback: string): string => {
  let color = fallback;
  for (const style of styles) {
    if (typeof style.color === 'string') color = style.color;
  }
  return color;
};

const createRenderers = (fontSize: number, lineHeight: number, color: string): HtmlRenderers => ({
  p: ({ style, children }) => (
    <Text style={[...safeTextStyles(style), safeTextLayoutStyle]}>{children}</Text>
  ),
  b: ({ style, children }) => (
    <Text style={[...safeTextStyles(style), { fontWeight: 700 }, safeTextLayoutStyle]}>{children}</Text>
  ),
  strong: ({ style, children }) => (
    <Text style={[...safeTextStyles(style), { fontWeight: 700 }, safeTextLayoutStyle]}>{children}</Text>
  ),
  em: ({ style, children }) => (
    <Text style={[...safeTextStyles(style), { fontStyle: 'italic' }, safeTextLayoutStyle]}>{children}</Text>
  ),
  i: ({ style, children }) => (
    <Text style={[...safeTextStyles(style), { fontStyle: 'italic' }, safeTextLayoutStyle]}>{children}</Text>
  ),
  a: ({ element, style, children }) => {
    const target = safeLinkTarget(element.attributes.href ?? '');
    const textStyle = [...safeTextStyles(style), { color: '#2563eb', textDecoration: 'underline' } as Style, safeTextLayoutStyle];
    return target
      ? <Link src={target} style={textStyle}>{children}</Link>
      : <Text style={textStyle}>{children}</Text>;
  },
  li: ({ element, style, children }) => {
    const parentTag = element.parentNode?.rawTagName?.toLowerCase();
    const ordered = parentTag === 'ol';
    const markerWidth = fontSize * 1.35;
    const bulletSize = Math.max(2.25, fontSize * 0.34);
    const marker = ordered ? (
      <Text style={{ flexShrink: 0, fontSize, lineHeight, width: markerWidth }}>
        {element.indexOfType + 1}.
      </Text>
    ) : (
      <View
        style={{
          alignItems: 'center',
          flexShrink: 0,
          height: fontSize * lineHeight,
          justifyContent: 'center',
          width: markerWidth,
        }}
      >
        <View
          style={{
            backgroundColor: resolveStyleColor(style, color),
            borderRadius: bulletSize / 2,
            height: bulletSize,
            width: bulletSize,
          }}
        />
      </View>
    );
    return (
      <View
        style={[...stripListLayoutStyles(style), { flexDirection: 'row', flexShrink: 1, maxWidth: '100%', minWidth: 0 }]}
      >
        {marker}
        <View style={{ flexBasis: 0, flexGrow: 1, flexShrink: 1, minWidth: 0 }}>{children}</View>
      </View>
    );
  },
});

const createStylesheet = (color: string, fontSize: number, lineHeight: number) => ({
  p: { color, fontSize, lineHeight, margin: 0 },
  ul: { margin: 0, paddingLeft: fontSize * 1.2 },
  ol: { margin: 0, paddingLeft: fontSize * 1.2 },
  li: { margin: 0 },
  b: { fontWeight: 700 },
  strong: { fontWeight: 700 },
  em: { fontStyle: 'italic' },
  i: { fontStyle: 'italic' },
  u: { textDecoration: 'underline' },
  s: { textDecoration: 'line-through' },
  strike: { textDecoration: 'line-through' },
  a: { color: '#2563eb', textDecoration: 'underline' },
  code: { backgroundColor: '#f3f3f3', color: '#d6336c', fontSize: fontSize * 0.95 },
  blockquote: {
    borderLeftColor: color,
    borderLeftWidth: 2.25,
    marginVertical: fontSize * 0.5,
    opacity: 0.8,
    paddingLeft: fontSize,
  },
  pre: {
    backgroundColor: '#18181b',
    color: '#ffffff',
    fontSize: fontSize * 0.95,
    lineHeight,
    marginVertical: fontSize,
    padding: fontSize * 0.8,
  },
  h1: { color, fontSize: fontSize * 1.5, fontWeight: 700, lineHeight: 1.2, marginBottom: fontSize * 0.5, marginTop: fontSize * 1.2 },
  h2: { color, fontSize: fontSize * 1.3, fontWeight: 700, lineHeight: 1.2, marginBottom: fontSize * 0.5, marginTop: fontSize * 1.2 },
  h3: { color, fontSize: fontSize * 1.15, fontWeight: 700, lineHeight: 1.2, marginBottom: fontSize * 0.5, marginTop: fontSize * 1.2 },
});

export const PdfRichText = ({
  html,
  color,
  fontFamily,
  fontSize,
  lineHeight = 1.5,
  marginTop = 0,
}: PdfRichTextProps) => {
  const normalizedHtml = normalizeRichTextHtml(html);
  if (!normalizedHtml) return null;

  return (
    <View style={[constrainedWidthStyle, { marginTop }]}>
      <Html
        resetStyles
        renderers={createRenderers(fontSize, lineHeight, color)}
        style={[constrainedWidthStyle, { color, fontFamily, fontSize, lineHeight }]}
        stylesheet={createStylesheet(color, fontSize, lineHeight)}
      >
        {normalizedHtml}
      </Html>
    </View>
  );
};
