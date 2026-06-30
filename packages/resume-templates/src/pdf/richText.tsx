import React from 'react';
import { Link, Text, View } from '@react-pdf/renderer';
import type { Style } from '@react-pdf/types';
import { parse, type HTMLElement as ParsedElement, type Node as ParsedNode } from 'node-html-parser';

/**
 * 把简历富文本(Tiptap 输出的 HTML)渲染成 @react-pdf/renderer 元素 —— 矢量、可选中。
 * 支持的标签与编辑器一致:p / h1-h6 / ul / ol / li / blockquote / br /
 * strong·b / em·i / u / s·strike·del / a / span(inline color、text-align)。
 * 这是导出 PDF 与预览保真的关键:取代旧的 htmlToText 纯文本压平。
 */

const NODE_TYPE_ELEMENT = 1;
const NODE_TYPE_TEXT = 3;

const BLOCK_TAGS = new Set(['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'ul', 'ol', 'li', 'blockquote', 'div', 'pre']);
const HEADING_SCALE: Record<string, number> = { h1: 1.5, h2: 1.3, h3: 1.15, h4: 1, h5: 1, h6: 1 };

export interface RichTextOptions {
  baseFontSize: number;
  color: string;
  linkColor?: string;
  lineHeight?: number;
}

interface ResolvedOptions extends Required<RichTextOptions> {}

interface InlineMarks {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  color?: string;
}

const decodeEntities = (value: string): string =>
  value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");

// CJK 按字断行由字体的 hyphenation 回调统一处理(见 fonts.ts:createMagicResumeHyphenationCallback),
// 这里不再插入零宽空格,避免重复处理。

const tagOf = (node: ParsedNode): string =>
  ((node as ParsedElement).rawTagName || '').toLowerCase();

const isElement = (node: ParsedNode): node is ParsedElement => node.nodeType === NODE_TYPE_ELEMENT;
const isText = (node: ParsedNode): boolean => node.nodeType === NODE_TYPE_TEXT;
const isBlock = (node: ParsedNode): boolean => isElement(node) && BLOCK_TAGS.has(tagOf(node));

const styleAttr = (node: ParsedElement, prop: string): string | undefined => {
  const style = node.getAttribute('style');
  if (!style) return undefined;
  const match = style.match(new RegExp(`${prop}\\s*:\\s*([^;]+)`, 'i'));
  return match ? match[1].trim() : undefined;
};

const marksToStyle = (marks: InlineMarks): Style => {
  const decorations: string[] = [];
  if (marks.underline) decorations.push('underline');
  if (marks.strike) decorations.push('line-through');
  const style: Style = {};
  if (marks.bold) style.fontWeight = 700;
  if (marks.italic) style.fontStyle = 'italic';
  if (marks.color) style.color = marks.color;
  if (decorations.length) style.textDecoration = decorations.join(' ') as Style['textDecoration'];
  return style;
};

const mergeMarks = (parent: InlineMarks, node: ParsedElement): InlineMarks => {
  const tag = tagOf(node);
  const next: InlineMarks = { ...parent };
  if (tag === 'strong' || tag === 'b') next.bold = true;
  if (tag === 'em' || tag === 'i') next.italic = true;
  if (tag === 'u' || tag === 'ins') next.underline = true;
  if (tag === 's' || tag === 'strike' || tag === 'del') next.strike = true;
  const color = styleAttr(node, 'color');
  if (color) next.color = color;
  return next;
};

// 渲染一段行内内容(可嵌套加粗/斜体/链接),返回 string | <Text> | <Link> 数组。
const renderInline = (
  nodes: ParsedNode[],
  opts: ResolvedOptions,
  marks: InlineMarks,
  keyPrefix: string,
): React.ReactNode[] => {
  const out: React.ReactNode[] = [];

  nodes.forEach((node, index) => {
    const key = `${keyPrefix}-${index}`;

    if (isText(node)) {
      const raw = decodeEntities((node as unknown as { rawText: string }).rawText ?? '').replace(/\s+/g, ' ');
      if (raw) out.push(raw);
      return;
    }
    if (!isElement(node)) return;

    const tag = tagOf(node);
    if (tag === 'br') {
      out.push('\n');
      return;
    }

    if (tag === 'a') {
      const href = node.getAttribute('href') || '';
      const children = renderInline(node.childNodes, opts, marks, key);
      const linkStyle: Style = { color: opts.linkColor, textDecoration: 'underline' };
      out.push(
        href ? (
          <Link key={key} src={href} style={linkStyle}>
            {children}
          </Link>
        ) : (
          <Text key={key} style={linkStyle}>
            {children}
          </Text>
        ),
      );
      return;
    }

    const nextMarks = mergeMarks(marks, node);
    const children = renderInline(node.childNodes, opts, nextMarks, key);
    if (children.length === 0) return;
    out.push(
      <Text key={key} style={marksToStyle(nextMarks)}>
        {children}
      </Text>,
    );
  });

  return out;
};

const splitListItem = (li: ParsedElement) => {
  const inlineNodes: ParsedNode[] = [];
  const blockNodes: ParsedElement[] = [];
  for (const child of li.childNodes) {
    if (isElement(child) && (tagOf(child) === 'ul' || tagOf(child) === 'ol')) {
      blockNodes.push(child);
    } else {
      inlineNodes.push(child);
    }
  }
  return { inlineNodes, blockNodes };
};

const renderList = (node: ParsedElement, opts: ResolvedOptions, key: string): React.ReactNode => {
  const ordered = tagOf(node) === 'ol';
  const items = node.childNodes.filter((child) => isElement(child) && tagOf(child) === 'li') as ParsedElement[];
  const markerWidth = opts.baseFontSize * 1.1;

  return (
    <View key={key} style={{ paddingLeft: opts.baseFontSize * 0.5 }}>
      {items.map((li, index) => {
        const { inlineNodes, blockNodes } = splitListItem(li);
        const marker = ordered ? `${index + 1}.` : '•';
        return (
          <View key={`${key}-${index}`} style={{ flexDirection: 'row' }} wrap={false}>
            <Text style={{ width: markerWidth, color: opts.color, lineHeight: opts.lineHeight }}>{marker}</Text>
            <View style={{ flexGrow: 1, flexShrink: 1 }}>
              <Text style={{ color: opts.color, lineHeight: opts.lineHeight }}>
                {renderInline(inlineNodes, opts, {}, `${key}-${index}-t`)}
              </Text>
              {blockNodes.map((nested, nestedIndex) =>
                renderList(nested, opts, `${key}-${index}-n${nestedIndex}`),
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
};

const renderBlock = (node: ParsedElement, opts: ResolvedOptions, key: string): React.ReactNode => {
  const tag = tagOf(node);

  if (tag === 'ul' || tag === 'ol') return renderList(node, opts, key);

  if (tag === 'div') {
    // div 作为容器:把它的子节点继续按块渲染。
    return (
      <View key={key}>{renderBlocks(node.childNodes, opts, key)}</View>
    );
  }

  if (tag === 'blockquote') {
    return (
      <View
        key={key}
        style={{
          borderLeftWidth: 1.5,
          borderLeftColor: opts.color,
          paddingLeft: 6,
          marginTop: 1.5,
          marginBottom: 1.5,
        }}
      >
        <Text style={{ color: opts.color, fontStyle: 'italic', lineHeight: opts.lineHeight }}>
          {renderInline(node.childNodes, opts, {}, key)}
        </Text>
      </View>
    );
  }

  if (HEADING_SCALE[tag]) {
    return (
      <Text
        key={key}
        style={{
          color: opts.color,
          fontSize: opts.baseFontSize * HEADING_SCALE[tag],
          fontWeight: 700,
          lineHeight: opts.lineHeight,
          marginTop: 2,
          marginBottom: 0.5,
          textAlign: styleAttr(node, 'text-align') as Style['textAlign'],
        }}
      >
        {renderInline(node.childNodes, opts, {}, key)}
      </Text>
    );
  }

  // p / pre / fallback paragraph
  const children = renderInline(node.childNodes, opts, {}, key);
  if (children.length === 0) return null;
  return (
    <Text
      key={key}
      style={{
        color: opts.color,
        lineHeight: opts.lineHeight,
        marginBottom: 0.5,
        textAlign: styleAttr(node, 'text-align') as Style['textAlign'],
      }}
    >
      {children}
    </Text>
  );
};

// 顶层:块级元素各自成块,连续的行内/文本节点合并成一个隐式段落。
function renderBlocks(nodes: ParsedNode[], opts: ResolvedOptions, keyPrefix: string): React.ReactNode[] {
  const blocks: React.ReactNode[] = [];
  let inlineBuffer: ParsedNode[] = [];
  let counter = 0;

  const flush = () => {
    if (inlineBuffer.length === 0) return;
    const key = `${keyPrefix}-p${counter++}`;
    const children = renderInline(inlineBuffer, opts, {}, key);
    inlineBuffer = [];
    // 跳过只含空白的隐式段落(块级元素之间的换行/缩进文本节点)。
    const hasContent = children.some((child) => typeof child !== 'string' || child.trim().length > 0);
    if (!hasContent) return;
    blocks.push(
      <Text key={key} style={{ color: opts.color, lineHeight: opts.lineHeight, marginBottom: 0.5 }}>
        {children}
      </Text>,
    );
  };

  for (const node of nodes) {
    if (isBlock(node)) {
      flush();
      const rendered = renderBlock(node as ParsedElement, opts, `${keyPrefix}-b${counter++}`);
      if (rendered) blocks.push(rendered);
    } else {
      inlineBuffer.push(node);
    }
  }
  flush();

  return blocks;
}

export interface RichTextProps extends RichTextOptions {
  html: string | null | undefined;
  style?: Style;
}

export const RichText = ({ html, baseFontSize, color, linkColor, lineHeight, style }: RichTextProps) => {
  if (!html || !html.trim()) return null;

  const opts: ResolvedOptions = {
    baseFontSize,
    color,
    linkColor: linkColor ?? '#2563eb',
    lineHeight: lineHeight ?? 1.45,
  };

  const root = parse(html);
  if (!root.text.trim() && !/<(br|li|img)/i.test(html)) return null;

  const blocks = renderBlocks(root.childNodes, opts, 'rt');
  if (blocks.length === 0) return null;

  return <View style={[{ marginTop: 1, fontSize: baseFontSize }, ...(style ? [style] : [])]}>{blocks}</View>;
};
