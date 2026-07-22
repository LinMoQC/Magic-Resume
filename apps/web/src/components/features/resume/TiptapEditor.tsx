'use client'

import { useEditor, EditorContent, BubbleMenu, FloatingMenu } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Color } from '@tiptap/extension-color'
import ListItem from '@tiptap/extension-list-item'
import TextStyle from '@tiptap/extension-text-style'
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Link2,
  Code,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Undo2,
  Redo2,
  Check,
  ExternalLink,
  Unlink,
} from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

// 关键:工具栏按钮按下时阻止默认行为,否则点击按钮会让编辑器失焦、选区丢失,
// 导致"点了没反应"(选中文字后点加粗等无效)。preventDefault 保住选区。
const keepSelection = (e: React.MouseEvent) => e.preventDefault();

const ICON = { size: 15, strokeWidth: 1.75 } as const;

/** 28px 方形工具按钮 — 激活态 sky、禁用态沉灰,与工作台按钮语言一致。 */
function ToolButton({
  onClick,
  active = false,
  disabled = false,
  label,
  children,
}: {
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        'flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors',
        active
          ? 'bg-sky-500/15 text-sky-300'
          : disabled
            ? 'cursor-default text-neutral-700'
            : 'text-neutral-400 hover:bg-white/[0.06] hover:text-neutral-100',
      )}
    >
      {children}
    </button>
  );
}

const Divider = () => <span aria-hidden className="mx-1 h-4 w-px shrink-0 bg-white/[0.08]" />;

/** 贴选区的链接编辑面板(替换原生 window.prompt)。 */
type LinkPanelState = {
  open: boolean;
  top: number;
  left: number;
  url: string;
  hasLink: boolean;
};

const LINK_PANEL_W = 272;
const LINK_PANEL_H = 42;

interface TiptapEditorProps {
  content: string;
  onChange: (richText: string) => void;
  placeholder?: string;
  /** @deprecated AI 润色已移除;保留可选 prop 以兼容现有调用方,不再使用。 */
  isPolishing?: boolean;
  /** @deprecated AI 润色已移除;保留可选 prop 以兼容现有调用方,不再使用。 */
  setIsPolishing?: (isPolishing: boolean) => void;
  themeColor?: string;
}

const TiptapEditor = ({ content, onChange, placeholder }: TiptapEditorProps) => {
  const { t } = useTranslation();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [linkPanel, setLinkPanel] = useState<LinkPanelState>({ open: false, top: 0, left: 0, url: '', hasLink: false });

  // 关键:编辑器常挂在 Radix modal Dialog 里,而 modal 会给 body 打上 pointer-events:none。
  // tippy 默认(或旧代码显式)把气泡菜单挂到 document.body,就落在这层"死区"里 —— 菜单能
  // 显示却点不动(表现为"选中文字工具栏触发不了")。改挂到最近的 [role=dialog](即弹窗内容
  // 层,pointer-events:auto 且不裁剪),按钮恢复可点;非弹窗场景回退到 body。
  const appendToDialog = useCallback(
    () => wrapperRef.current?.closest<HTMLElement>('[role="dialog"]') ?? document.body,
    [],
  );

  const editor = useEditor({
    extensions: [
      Color.configure({ types: [TextStyle.name, ListItem.name] }),
      StarterKit.configure({
        bulletList: { keepMarks: true, keepAttributes: false },
        orderedList: { keepMarks: true, keepAttributes: false },
      }),
      Underline,
      Link.configure({ openOnClick: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: placeholder ?? '' }),
    ],
    content: content,
    onUpdate({ editor }) {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class:
          'tiptap-desc min-h-[160px] max-h-[300px] overflow-y-auto w-full max-w-none px-4 py-3.5 text-[13.5px] leading-[1.7] text-neutral-200 focus:outline-none hide-scrollbar cursor-text',
      },
    },
  });

  const closeLinkPanel = useCallback(() => {
    setLinkPanel((s) => ({ ...s, open: false }));
  }, []);

  // 打开面板:定位到选区下缘中点;贴近容器底部时翻到选区上方,避免被 overflow 裁剪。
  const openLinkPanel = useCallback(() => {
    if (!editor || !wrapperRef.current) return;
    const { from, to } = editor.state.selection;
    const wrapper = wrapperRef.current.getBoundingClientRect();
    const start = editor.view.coordsAtPos(from);
    const end = editor.view.coordsAtPos(to);
    const centerX = (start.left + end.left) / 2 - wrapper.left;
    const left = Math.min(Math.max(centerX - LINK_PANEL_W / 2, 8), Math.max(wrapper.width - LINK_PANEL_W - 8, 8));
    let top = end.bottom - wrapper.top + 8;
    if (top + LINK_PANEL_H > wrapper.height - 4) {
      top = start.top - wrapper.top - LINK_PANEL_H - 8;
    }
    const href: string = editor.getAttributes('link').href || '';
    setLinkPanel({ open: true, top, left, url: href, hasLink: Boolean(href) });
  }, [editor]);

  const applyLink = useCallback(() => {
    if (!editor) return;
    const raw = linkPanel.url.trim();
    if (!raw) {
      if (linkPanel.hasLink) editor.chain().focus().extendMarkRange('link').unsetLink().run();
      closeLinkPanel();
      return;
    }
    const href = /^(https?:\/\/|mailto:|tel:)/i.test(raw) ? raw : `https://${raw}`;
    editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
    closeLinkPanel();
  }, [editor, linkPanel.url, linkPanel.hasLink, closeLinkPanel]);

  const removeLink = useCallback(() => {
    editor?.chain().focus().extendMarkRange('link').unsetLink().run();
    closeLinkPanel();
  }, [editor, closeLinkPanel]);

  if (!editor) return null;

  // 链接按钮仅在"有选区"或"光标在链接上"时可用 — 空选区设置链接是无效操作。
  const canLink = !editor.state.selection.empty || editor.isActive('link');

  const floatMenuClass =
    'flex items-center gap-0.5 rounded-xl border border-white/[0.08] bg-[#1b1b1e]/95 p-1 text-neutral-200 shadow-[0_10px_34px_-8px_rgba(0,0,0,0.7)] backdrop-blur-xl';

  return (
    <div ref={wrapperRef} className="relative">
      {/* 工具栏:单行五组,窄容器横向滚动而非换行 */}
      <div
        className="flex h-10 items-center gap-0.5 overflow-x-auto border-b border-white/[0.06] px-1.5 hide-scrollbar"
        onMouseDown={keepSelection}
      >
        <ToolButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} label={t('tiptap.toolbar.bold')}><Bold {...ICON} /></ToolButton>
        <ToolButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} label={t('tiptap.toolbar.italic')}><Italic {...ICON} /></ToolButton>
        <ToolButton onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} label={t('tiptap.toolbar.underline')}><UnderlineIcon {...ICON} /></ToolButton>
        <ToolButton onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} label={t('tiptap.toolbar.strike')}><Strikethrough {...ICON} /></ToolButton>
        <ToolButton onClick={openLinkPanel} active={editor.isActive('link')} disabled={!canLink} label={t('tiptap.toolbar.link')}><Link2 {...ICON} /></ToolButton>
        <ToolButton onClick={() => editor.chain().focus().toggleCode().run()} active={editor.isActive('code')} label={t('tiptap.toolbar.code')}><Code {...ICON} /></ToolButton>
        <Divider />
        <ToolButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} active={editor.isActive('heading', { level: 1 })} label={t('tiptap.toolbar.h1')}><Heading1 {...ICON} /></ToolButton>
        <ToolButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} label={t('tiptap.toolbar.h2')}><Heading2 {...ICON} /></ToolButton>
        <ToolButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} label={t('tiptap.toolbar.h3')}><Heading3 {...ICON} /></ToolButton>
        <Divider />
        <ToolButton onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} label={t('tiptap.toolbar.alignLeft')}><AlignLeft {...ICON} /></ToolButton>
        <ToolButton onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} label={t('tiptap.toolbar.alignCenter')}><AlignCenter {...ICON} /></ToolButton>
        <ToolButton onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} label={t('tiptap.toolbar.alignRight')}><AlignRight {...ICON} /></ToolButton>
        <ToolButton onClick={() => editor.chain().focus().setTextAlign('justify').run()} active={editor.isActive({ textAlign: 'justify' })} label={t('tiptap.toolbar.alignJustify')}><AlignJustify {...ICON} /></ToolButton>
        <Divider />
        <ToolButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} label={t('tiptap.toolbar.bulletList')}><List {...ICON} /></ToolButton>
        <ToolButton onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} label={t('tiptap.toolbar.orderedList')}><ListOrdered {...ICON} /></ToolButton>
        <Divider />
        <ToolButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().chain().focus().undo().run()} label={t('tiptap.toolbar.undo')}><Undo2 {...ICON} /></ToolButton>
        <ToolButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().chain().focus().redo().run()} label={t('tiptap.toolbar.redo')}><Redo2 {...ICON} /></ToolButton>
      </div>

      {/* 气泡菜单:只留最高频的 加粗/斜体/链接 */}
      <BubbleMenu
        className={floatMenuClass}
        tippyOptions={{
          appendTo: appendToDialog,
          duration: 120,
          maxWidth: 'none',
          popperOptions: {
            strategy: 'fixed',
            modifiers: [{ name: 'flip' }, { name: 'preventOverflow', options: { padding: 8 } }],
          },
        }}
        editor={editor}
      >
        <div className="flex items-center gap-0.5" onMouseDown={keepSelection}>
          <ToolButton onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} label={t('tiptap.toolbar.bold')}><Bold {...ICON} /></ToolButton>
          <ToolButton onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} label={t('tiptap.toolbar.italic')}><Italic {...ICON} /></ToolButton>
          <ToolButton onClick={openLinkPanel} active={editor.isActive('link')} label={t('tiptap.toolbar.link')}><Link2 {...ICON} /></ToolButton>
        </div>
      </BubbleMenu>

      {/* 空行浮动菜单:小标题 + 列表 两个起手式 */}
      <FloatingMenu
        className={floatMenuClass}
        tippyOptions={{
          placement: 'left',
          appendTo: appendToDialog,
          duration: 120,
          maxWidth: 'none',
          popperOptions: {
            strategy: 'fixed',
            modifiers: [{ name: 'flip' }, { name: 'preventOverflow', options: { padding: 8 } }],
          },
        }}
        editor={editor}
      >
        <div className="flex items-center gap-0.5" onMouseDown={keepSelection}>
          <ToolButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} label={t('tiptap.toolbar.h2')}><Heading2 {...ICON} /></ToolButton>
          <ToolButton onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} label={t('tiptap.toolbar.bulletList')}><List {...ICON} /></ToolButton>
        </div>
      </FloatingMenu>

      <div className="relative editor-container">
        <EditorContent editor={editor} />
      </div>

      {/* 链接编辑面板 — 贴选区的深色玻璃条,替代原生 prompt */}
      {linkPanel.open && (
        <>
          <div className="fixed inset-0 z-40" onMouseDown={closeLinkPanel} />
          <div
            className="absolute z-50 flex items-center gap-0.5 rounded-xl border border-white/[0.08] bg-[#1b1b1e]/95 p-1 shadow-[0_10px_34px_-8px_rgba(0,0,0,0.7)] backdrop-blur-xl [animation:tiptap-pop_.12s_ease-out]"
            style={{ top: linkPanel.top, left: linkPanel.left, width: LINK_PANEL_W }}
          >
            <Link2 size={13} strokeWidth={1.75} className="ml-1.5 shrink-0 text-neutral-500" />
            <input
              autoFocus
              value={linkPanel.url}
              onChange={(e) => setLinkPanel((s) => ({ ...s, url: e.target.value }))}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); applyLink(); }
                if (e.key === 'Escape') { e.preventDefault(); closeLinkPanel(); editor.chain().focus().run(); }
              }}
              placeholder={t('tiptap.link.placeholder')}
              className="h-7 min-w-0 flex-1 bg-transparent px-1 text-[13px] text-neutral-100 placeholder:text-neutral-600 focus:outline-none"
            />
            <ToolButton onClick={applyLink} disabled={!linkPanel.url.trim() && !linkPanel.hasLink} label={t('tiptap.link.apply')}>
              <Check {...ICON} className={linkPanel.url.trim() ? 'text-sky-300' : undefined} />
            </ToolButton>
            {linkPanel.hasLink && (
              <>
                <Divider />
                <ToolButton
                  onClick={() => window.open(linkPanel.url, '_blank', 'noopener,noreferrer')}
                  label={t('tiptap.link.open')}
                >
                  <ExternalLink {...ICON} />
                </ToolButton>
                <ToolButton onClick={removeLink} label={t('tiptap.link.remove')}>
                  <Unlink {...ICON} />
                </ToolButton>
              </>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default TiptapEditor;
