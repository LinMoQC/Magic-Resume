'use client'

import { useEditor, EditorContent, Editor, BubbleMenu, FloatingMenu } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Color } from '@tiptap/extension-color'
import ListItem from '@tiptap/extension-list-item'
import TextStyle from '@tiptap/extension-text-style'
import { FaBold, FaItalic, FaStrikethrough, FaListUl, FaListOl, FaCode, FaUndo, FaRedo, FaLink, FaAlignLeft, FaAlignCenter, FaAlignRight, FaAlignJustify, FaUnderline, FaHistory, FaCheck, FaTimes } from 'react-icons/fa';
import Underline from '@tiptap/extension-underline'
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import { useCallback, useState, useEffect } from 'react';
import { Wand2 } from 'lucide-react';
import { LoadingMark } from './LoadingMark';
import { useSettingStore } from '@/store/useSettingStore';
import { createPolishTextChain } from '@/lib/aiLab/chains';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

type LastPolishedState = {
  from: number;
  to: number;
  originalText: string;
  polishedText: string;
};

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

  const buttonClass = (active: boolean) => `p-2 rounded text-sm flex items-center justify-center ${active ? 'bg-neutral-600' : 'hover:bg-neutral-700'}`;
  const disabledButtonClass = 'p-2 rounded text-sm flex items-center justify-center text-neutral-600 cursor-not-allowed';

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 bg-neutral-800 border border-neutral-700 rounded-t-md text-white">
      <button onClick={() => editor.chain().focus().toggleBold().run()} disabled={!editor.can().chain().focus().toggleBold().run()} className={editor.isActive('bold') ? buttonClass(true) : buttonClass(false)} aria-label="Bold"><FaBold /></button>
      <button onClick={() => editor.chain().focus().toggleItalic().run()} disabled={!editor.can().chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? buttonClass(true) : buttonClass(false)} aria-label="Italic"><FaItalic /></button>
      <button onClick={() => editor.chain().focus().toggleUnderline().run()} disabled={!editor.can().chain().focus().toggleUnderline().run()} className={editor.isActive('underline') ? buttonClass(true) : buttonClass(false)} aria-label="Underline"><FaUnderline /></button>
      <button onClick={() => editor.chain().focus().toggleStrike().run()} disabled={!editor.can().chain().focus().toggleStrike().run()} className={editor.isActive('strike') ? buttonClass(true) : buttonClass(false)} aria-label="Strike"><FaStrikethrough /></button>
      <button onClick={setLink} className={editor.isActive('link') ? buttonClass(true) : buttonClass(false)} aria-label="Link"><FaLink /></button>
      <button onClick={() => editor.chain().focus().toggleCode().run()} disabled={!editor.can().chain().focus().toggleCode().run()} className={editor.isActive('code') ? buttonClass(true) : buttonClass(false)} aria-label="Inline Code"><FaCode /></button>
      <div className="h-4 w-px bg-neutral-600 mx-1"></div>
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={editor.isActive('heading', { level: 1 }) ? buttonClass(true) : buttonClass(false)} aria-label="Heading 1">H1</button>
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={editor.isActive('heading', { level: 2 }) ? buttonClass(true) : buttonClass(false)} aria-label="Heading 2">H2</button>
      <button onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={editor.isActive('heading', { level: 3 }) ? buttonClass(true) : buttonClass(false)} aria-label="Heading 3">H3</button>
      <div className="h-4 w-px bg-neutral-600 mx-1"></div>
      <button onClick={() => editor.chain().focus().setTextAlign('left').run()} className={editor.isActive({ textAlign: 'left' }) ? buttonClass(true) : buttonClass(false)} aria-label="Align Left"><FaAlignLeft /></button>
      <button onClick={() => editor.chain().focus().setTextAlign('center').run()} className={editor.isActive({ textAlign: 'center' }) ? buttonClass(true) : buttonClass(false)} aria-label="Align Center"><FaAlignCenter /></button>
      <button onClick={() => editor.chain().focus().setTextAlign('right').run()} className={editor.isActive({ textAlign: 'right' }) ? buttonClass(true) : buttonClass(false)} aria-label="Align Right"><FaAlignRight /></button>
      <button onClick={() => editor.chain().focus().setTextAlign('justify').run()} className={editor.isActive({ textAlign: 'justify' }) ? buttonClass(true) : buttonClass(false)} aria-label="Align Justify"><FaAlignJustify /></button>
      <div className="h-4 w-px bg-neutral-600 mx-1"></div>
      <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive('bulletList') ? buttonClass(true) : buttonClass(false)} aria-label="Bullet List"><FaListUl /></button>
      <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive('orderedList') ? buttonClass(true) : buttonClass(false)} aria-label="Ordered List"><FaListOl /></button>
      <div className="h-4 w-px bg-neutral-600 mx-1"></div>
      <button onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().chain().focus().undo().run()} className={!editor.can().chain().focus().undo().run() ? disabledButtonClass : buttonClass(false)} aria-label="Undo"><FaUndo /></button>
      <button onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().chain().focus().redo().run()} className={!editor.can().chain().focus().redo().run() ? disabledButtonClass : buttonClass(false)} aria-label="Redo"><FaRedo /></button>
    </div>
  )
}

interface TiptapEditorProps {
  content: string;
  onChange: (richText: string) => void;
  placeholder?: string;
  isPolishing: boolean;
  setIsPolishing: (isPolishing: boolean) => void;
  themeColor?: string;
}

const TiptapEditor = ({ content, onChange, placeholder, isPolishing, setIsPolishing, themeColor = '#38bdf8' }: TiptapEditorProps) => {
  const { apiKey, baseUrl, model, maxTokens } = useSettingStore();
  const [lastPolished, setLastPolished] = useState<LastPolishedState | null>(null);
  const [autoHideTimer, setAutoHideTimer] = useState<NodeJS.Timeout | null>(null);
  const [countdown, setCountdown] = useState<number>(15);
  const { t } = useTranslation();

  // 从主题色提取RGB值
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 56, g: 189, b: 248 }; // 默认sky-400
  };

  const themeRgb = hexToRgb(themeColor);
  const primaryColorRgb = `${themeRgb.r}, ${themeRgb.g}, ${themeRgb.b}`;

  // 接受润色结果
  const handleAcceptPolish = useCallback(() => {
    if (!lastPolished) return;
    
    // 清除倒计时定时器
    if (autoHideTimer) {
      clearInterval(autoHideTimer);
      setAutoHideTimer(null);
    }
    
    // 用户接受了优化结果，清除状态
    setLastPolished(null);
    toast.success(t('tiptap.notifications.changesAccepted', 'AI优化已应用'));
  }, [lastPolished, autoHideTimer, t]);

  // 回退润色结果
  const createRejectPolishHandler = (editorInstance: Editor | null) => () => {
    if (!editorInstance || !lastPolished) return;
    
    // 清除倒计时定时器
    if (autoHideTimer) {
      clearInterval(autoHideTimer);
      setAutoHideTimer(null);
    }
    
    const { from, to, originalText } = lastPolished;
    
    editorInstance.chain().focus().setTextSelection({ from, to }).insertContent(originalText).run();
    setLastPolished(null);
    toast.info(t('tiptap.notifications.changesReverted', '已回退到原始文本'));
  };

  // 处理自动隐藏逻辑和倒计时
  useEffect(() => {
    if (lastPolished) {
      setCountdown(15);
      
      // 倒计时定时器
      const countdownInterval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            // 自动接受
            setLastPolished(null);
            toast.success(t('tiptap.notifications.changesAccepted', 'AI优化已应用'));
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      setAutoHideTimer(countdownInterval);
      
      return () => {
        if (countdownInterval) clearInterval(countdownInterval);
      };
    } else {
      // 清理定时器
      if (autoHideTimer) {
        clearInterval(autoHideTimer);
        setAutoHideTimer(null);
      }
      setCountdown(15);
    }
  }, [lastPolished, autoHideTimer, t]);
  
  const editor = useEditor({
    extensions: [
      Color.configure({ types: [TextStyle.name, ListItem.name] }),
      Color.configure({ types: [TextStyle.name, ListItem.name] }),
      StarterKit.configure({
        bulletList: { keepMarks: true, keepAttributes: false },
        orderedList: { keepMarks: true, keepAttributes: false },
      }),
      Underline,
      Link.configure({ openOnClick: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      LoadingMark,
    ],
    content: content,
    onUpdate({ editor }) {
      onChange(editor.getHTML())
      if (lastPolished) {
        setLastPolished(null);
      }
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert dark:prose-invert min-h-[150px] max-h-[250px] overflow-y-auto w-full max-w-none rounded-b-md border border-b-neutral-700 border-x-neutral-700 bg-black px-3 py-2 text-sm text-gray-200 focus:outline-none border-none bg-neutral-800 hide-scrollbar',
      },
    },
  });

  const typewriterInsert = (from: number, to: number, originalText: string, polishedText: string): Promise<void> => {
    return new Promise(resolve => {
      if (!editor) {
        resolve();
        return;
      }

      editor.chain().focus().setTextSelection({ from, to }).unsetMark('loading').deleteSelection().run();

      let i = 0;
      const type = () => {
        if (i < polishedText.length) {
          const char = polishedText.charAt(i);
          editor.chain().focus().insertContentAt(from + i, char).run();
          i++;
          setTimeout(type, 30);
        } else {
          // Typing finished
          const newTo = from + polishedText.length;
          editor.chain().focus().setTextSelection({ from, to: newTo }).run();
          setLastPolished({ from, to: newTo, originalText, polishedText });
          resolve();
        }
      };
      type();
    });
  };

  const handleAIPolishClick = async () => {
    if (!editor || editor.state.selection.empty || isPolishing) {
      if(isPolishing) {
        toast.error(t('tiptap.notifications.polishingInProgress'));
      }
      return;
    };
    
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, ' ');

    if (!selectedText.trim()) return;

    setIsPolishing(true);
    setLastPolished(null); // Clear previous reset state
    editor.chain().focus().setTextSelection({ from, to }).toggleMark('loading').run();

    try {
      if (!apiKey) {
        toast.error(t('modals.aiModal.notifications.apiKeyMissing'));
        throw new Error('API Key not found');
      }
      const chain = createPolishTextChain({ apiKey, baseUrl, modelName: model, maxTokens });
      const polishedText = await chain.invoke({ text: selectedText });
      
      await typewriterInsert(from, to, selectedText, polishedText);

    } catch (error) {
      const message = error instanceof Error ? error.message : t('modals.aiModal.notifications.unknownError');
      if (message !== 'API Key not found') {
        toast.error(t('tiptap.notifications.polishFailed', { message }));
      }
      editor.chain().focus().setTextSelection({ from, to }).unsetMark('loading').run();
    } finally {
      setIsPolishing(false);
    }
  };



  const buttonClass = (active: boolean) => `p-2 rounded text-sm flex items-center justify-center ${active ? 'bg-neutral-600' : 'hover:bg-neutral-700'}`;
  const disabledButtonClass = 'p-2 rounded text-sm flex items-center justify-center text-neutral-500 cursor-not-allowed';

  return (
    <div 
      style={{
        '--ai-color': primaryColorRgb
      } as React.CSSProperties}
    >
      <TiptapToolbar editor={editor} />
      
      {editor && <BubbleMenu
        className="flex items-center gap-1 p-1 bg-neutral-800 border border-neutral-700 rounded-md text-white"
        tippyOptions={{
          appendTo: () => document.body,
          popperOptions: {
            strategy: 'fixed',
            modifiers: [{ name: 'flip' }, { name: 'preventOverflow' }],
          },
        }}
        editor={editor}
      >
        <button onClick={() => editor.chain().focus().toggleBold().run()} className={buttonClass(editor.isActive('bold'))} aria-label="Bold"><FaBold /></button>
        <button onClick={() => editor.chain().focus().toggleItalic().run()} className={buttonClass(editor.isActive('italic'))} aria-label="Italic"><FaItalic /></button>
        <button onClick={() => editor.chain().focus().toggleStrike().run()} className={buttonClass(editor.isActive('strike'))} aria-label="Strike"><FaStrikethrough /></button>
        {!lastPolished && <button 
          onClick={handleAIPolishClick} 
          className={isPolishing ? disabledButtonClass : buttonClass(false)}
          aria-label="AI Polish"
        ><Wand2 size={16} /></button>}
        {lastPolished && <button onClick={createRejectPolishHandler(editor)} className={buttonClass(false)} aria-label="Reject Polish"><FaHistory size={16} /></button>}
      </BubbleMenu>}

      {editor && <FloatingMenu
        className="flex items-center gap-1 p-1 bg-neutral-800 border border-neutral-700 rounded-md text-white"
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
        <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={buttonClass(editor.isActive('heading', { level: 1 }))} aria-label="Heading 1">H1</button>
        <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={buttonClass(editor.isActive('heading', { level: 2 }))} aria-label="Heading 2">H2</button>
        <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={buttonClass(editor.isActive('bulletList'))} aria-label="Bullet List"><FaListUl /></button>
      </FloatingMenu>}

      <div className="relative editor-container">
        <EditorContent editor={editor} placeholder={placeholder} />
        
        {lastPolished && !isPolishing && (
          <div className="ai-polish-panel absolute top-2 right-2 flex items-center gap-1 p-1.5 bg-neutral-900/95 backdrop-blur-sm rounded border border-neutral-600 shadow-lg z-50 ">
            <span className="text-xs text-neutral-400 px-1">{countdown}s</span>
            <button
              onClick={handleAcceptPolish}
              className="ai-polish-button w-6 h-6 text-white text-xs rounded transition-all duration-200 flex items-center justify-center"
              style={{
                backgroundColor: `rgba(${primaryColorRgb}, 0.9)`,
                border: `1px solid rgba(${primaryColorRgb}, 1)`
              }}
              aria-label={t('tiptap.acceptChanges', '接受更改')}
              title={t('tiptap.accept', '接受')}
            >
              <FaCheck size={10} />
            </button>
            <button
              onClick={createRejectPolishHandler(editor)}
              className="ai-polish-button w-6 h-6 bg-neutral-600 hover:bg-neutral-500 text-white text-xs rounded transition-all duration-200 flex items-center justify-center border border-neutral-500"
              aria-label={t('tiptap.rejectChanges', '回退更改')}
              title={t('tiptap.reject', '回退')}
            >
              <FaTimes size={10} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default TiptapEditor; 