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
import { useCallback } from 'react';
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

  return (
    <div>
      <TiptapToolbar editor={editor} />

      {editor && <BubbleMenu
        className="flex items-center gap-0.5 rounded-lg border border-white/10 bg-neutral-900 p-1 text-white shadow-xl shadow-black/50"
        tippyOptions={{
          appendTo: () => document.body,
          popperOptions: {
            strategy: 'fixed',
            modifiers: [{ name: 'flip' }, { name: 'preventOverflow' }],
          },
        }}
        editor={editor}
      >
        <div className="flex items-center gap-0.5" onMouseDown={keepSelection}>
          <button onClick={() => editor.chain().focus().toggleBold().run()} className={buttonClass(editor.isActive('bold'))} aria-label="Bold"><FaBold /></button>
          <button onClick={() => editor.chain().focus().toggleItalic().run()} className={buttonClass(editor.isActive('italic'))} aria-label="Italic"><FaItalic /></button>
          <button onClick={() => editor.chain().focus().toggleStrike().run()} className={buttonClass(editor.isActive('strike'))} aria-label="Strike"><FaStrikethrough /></button>
        </div>
      </BubbleMenu>}

      {editor && <FloatingMenu
        className="flex items-center gap-0.5 rounded-lg border border-white/10 bg-neutral-900 p-1 text-white shadow-xl shadow-black/50"
        tippyOptions={{
          placement: 'left',
          appendTo: () => document.body,
          popperOptions: {
            strategy: 'fixed',
            modifiers: [{ name: 'flip' }, { name: 'preventOverflow' }],
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
