'use client'

import { useEditor, EditorContent, Editor, BubbleMenu, FloatingMenu } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Color } from '@tiptap/extension-color'
import ListItem from '@tiptap/extension-list-item'
import TextStyle from '@tiptap/extension-text-style'
import { FaBold, FaItalic, FaStrikethrough, FaListUl, FaListOl, FaCode, FaUndo, FaRedo, FaLink, FaAlignLeft, FaAlignCenter, FaAlignRight, FaAlignJustify, FaUnderline } from 'react-icons/fa';
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import { useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';

// 关键:工具栏按钮按下时阻止默认行为,否则点击按钮会让编辑器失焦、选区丢失,
// 导致"点了没反应"(选中文字后点加粗等无效)。preventDefault 保住选区。
const keepSelection = (e: React.MouseEvent) => e.preventDefault();

const TiptapToolbar = ({ editor }: { editor: Editor | null }) => {
  const { t } = useTranslation();
  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt(t('tiptap.prompt.url'), previousUrl);

    if (url === null) {
      return;
    }

    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor, t]);

  if (!editor) {
    return null
  }

  const buttonClass = (active: boolean) => `flex h-8 w-8 items-center justify-center rounded-md text-[13px] transition-colors ${active ? 'bg-sky-500/15 text-sky-300' : 'text-neutral-400 hover:bg-white/[0.06] hover:text-neutral-100'}`;
  const disabledButtonClass = 'flex h-8 w-8 items-center justify-center rounded-md text-[13px] text-neutral-700 cursor-not-allowed';

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-white/[0.06] px-2 py-1.5" onMouseDown={keepSelection}>
      <button onClick={() => editor.chain().focus().toggleBold().run()} disabled={!editor.can().chain().focus().toggleBold().run()} className={editor.isActive('bold') ? buttonClass(true) : buttonClass(false)} aria-label="Bold"><FaBold /></button>
      <button onClick={() => editor.chain().focus().toggleItalic().run()} disabled={!editor.can().chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? buttonClass(true) : buttonClass(false)} aria-label="Italic"><FaItalic /></button>
      <button onClick={() => editor.chain().focus().toggleUnderline().run()} disabled={!editor.can().chain().focus().toggleUnderline().run()} className={editor.isActive('underline') ? buttonClass(true) : buttonClass(false)} aria-label="Underline"><FaUnderline /></button>
      <button onClick={() => editor.chain().focus().toggleStrike().run()} disabled={!editor.can().chain().focus().toggleStrike().run()} className={editor.isActive('strike') ? buttonClass(true) : buttonClass(false)} aria-label="Strike"><FaStrikethrough /></button>
      <button onClick={setLink} className={editor.isActive('link') ? buttonClass(true) : buttonClass(false)} aria-label="Link"><FaLink /></button>
      <button onClick={() => editor.chain().focus().toggleCode().run()} disabled={!editor.can().chain().focus().toggleCode().run()} className={editor.isActive('code') ? buttonClass(true) : buttonClass(false)} aria-label="Inline Code"><FaCode /></button>
      <div className="mx-1 h-4 w-px bg-white/[0.08]"></div>
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={editor.isActive('heading', { level: 1 }) ? buttonClass(true) : buttonClass(false)} aria-label="Heading 1">{'H1'}</button>
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={editor.isActive('heading', { level: 2 }) ? buttonClass(true) : buttonClass(false)} aria-label="Heading 2">{'H2'}</button>
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={editor.isActive('heading', { level: 3 }) ? buttonClass(true) : buttonClass(false)} aria-label="Heading 3">{'H3'}</button>
      <div className="mx-1 h-4 w-px bg-white/[0.08]"></div>
      <button onClick={() => editor.chain().focus().setTextAlign('left').run()} className={editor.isActive({ textAlign: 'left' }) ? buttonClass(true) : buttonClass(false)} aria-label="Align Left"><FaAlignLeft /></button>
      <button onClick={() => editor.chain().focus().setTextAlign('center').run()} className={editor.isActive({ textAlign: 'center' }) ? buttonClass(true) : buttonClass(false)} aria-label="Align Center"><FaAlignCenter /></button>
      <button onClick={() => editor.chain().focus().setTextAlign('right').run()} className={editor.isActive({ textAlign: 'right' }) ? buttonClass(true) : buttonClass(false)} aria-label="Align Right"><FaAlignRight /></button>
      <button onClick={() => editor.chain().focus().setTextAlign('justify').run()} className={editor.isActive({ textAlign: 'justify' }) ? buttonClass(true) : buttonClass(false)} aria-label="Align Justify"><FaAlignJustify /></button>
      <div className="mx-1 h-4 w-px bg-white/[0.08]"></div>
      <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? buttonClass(true) : buttonClass(false)} aria-label="Bullet List"><FaListUl /></button>
      <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive('orderedList') ? buttonClass(true) : buttonClass(false)} aria-label="Ordered List"><FaListOl /></button>
      <div className="mx-1 h-4 w-px bg-white/[0.08]"></div>
      <button onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().chain().focus().undo().run()} className={!editor.can().chain().focus().undo().run() ? disabledButtonClass : buttonClass(false)} aria-label="Undo"><FaUndo /></button>
      <button onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().chain().focus().redo().run()} className={!editor.can().chain().focus().redo().run() ? disabledButtonClass : buttonClass(false)} aria-label="Redo"><FaRedo /></button>
    </div>
  )
}

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
    ],
    content: content,
    onUpdate({ editor }) {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert dark:prose-invert min-h-[160px] max-h-[300px] overflow-y-auto w-full max-w-none px-4 py-3 text-sm leading-relaxed text-neutral-200 focus:outline-none hide-scrollbar cursor-text',
      },
    },
  });

  const buttonClass = (active: boolean) => `flex h-8 w-8 items-center justify-center rounded-md text-[13px] transition-colors ${active ? 'bg-sky-500/15 text-sky-300' : 'text-neutral-400 hover:bg-white/[0.06] hover:text-neutral-100'}`;

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt(t('tiptap.prompt.url'), previousUrl);
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  }, [editor, t]);

  // 浮动菜单容器:略高于弹窗底色的深色玻璃面 + 极细边 + 柔和投影,呼应工作台美学(少 border、
  // sky 点缀由内部按钮的 active 态承担)。取代旧的扁平 bg-neutral-900 方块。
  const floatMenuClass =
    'flex items-center gap-0.5 rounded-xl border border-white/[0.08] bg-[#1b1b1e]/95 p-1 text-neutral-200 shadow-[0_10px_34px_-8px_rgba(0,0,0,0.7)] backdrop-blur-xl';

  return (
    <div ref={wrapperRef}>
      <TiptapToolbar editor={editor} />

      {editor && <BubbleMenu
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
          <button onClick={() => editor.chain().focus().toggleBold().run()} className={buttonClass(editor.isActive('bold'))} aria-label="Bold"><FaBold /></button>
          <button onClick={() => editor.chain().focus().toggleItalic().run()} className={buttonClass(editor.isActive('italic'))} aria-label="Italic"><FaItalic /></button>
          <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={buttonClass(editor.isActive('underline'))} aria-label="Underline"><FaUnderline /></button>
          <button onClick={() => editor.chain().focus().toggleStrike().run()} className={buttonClass(editor.isActive('strike'))} aria-label="Strike"><FaStrikethrough /></button>
          <div className="mx-0.5 h-5 w-px bg-white/10" aria-hidden />
          <button onClick={setLink} className={buttonClass(editor.isActive('link'))} aria-label="Link"><FaLink /></button>
        </div>
      </BubbleMenu>}

      {editor && <FloatingMenu
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
          <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={buttonClass(editor.isActive('heading', { level: 1 }))} aria-label="Heading 1">{'H1'}</button>
          <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={buttonClass(editor.isActive('heading', { level: 2 }))} aria-label="Heading 2">{'H2'}</button>
          <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={buttonClass(editor.isActive('bulletList'))} aria-label="Bullet List"><FaListUl /></button>
        </div>
      </FloatingMenu>}

      <div className="relative editor-container">
        <EditorContent editor={editor} placeholder={placeholder} />
      </div>
    </div>
  )
}

export default TiptapEditor;
