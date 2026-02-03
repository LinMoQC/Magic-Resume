'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Trash2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

interface CommentPopoverProps {
    x: number;
    y: number;
    initialContent?: string;
    isDraft?: boolean;
    authorName?: string;
    avatarUrl?: string;
    isOwner?: boolean;
    createdAt?: string;
    initialColor?: string;
    selectedText?: string;
    onSave: (content: string, color: string) => void;
    onColorChange?: (color: string) => void;
    onCancel: () => void;
    onDelete?: () => void;
    isOpen: boolean;
    readOnly?: boolean;
    isLoading?: boolean;
}

const formatDate = (dateStr: string, t: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
    if (!dateStr || dateStr === 'Just now') return t('sharedPage.comments.justNow');
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString(undefined, { 
            month: 'short', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    } catch {
        return dateStr;
    }
};

const COLORS = [
    { name: 'yellow', value: '#fbbf24' },
    { name: 'green', value: '#4ade80' },
    { name: 'blue', value: '#60a5fa' },
    { name: 'purple', value: '#c084fc' },
    { name: 'red', value: '#f87171' },
];

export const CommentPopover = ({
    x,
    y,
    initialContent = '',
    isDraft,
    authorName = 'Anonymous',
    createdAt = 'Just now',
    initialColor = COLORS[0].value,
    selectedText,
    onSave,
    onColorChange,
    onCancel,
    onDelete,
    isOpen,
    readOnly = false,
    avatarUrl,
    isOwner,
    isLoading
}: CommentPopoverProps) => {
    const { t } = useTranslation();
    const [content, setContent] = useState(initialContent);
    const [selectedColor, setSelectedColor] = useState(initialColor);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (isOpen && isDraft) {
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [isOpen, isDraft]);

    const isTopHalf = y < 50;
    const isLeftHalf = x < 50;

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    className={cn(
                        "absolute z-30 w-[280px] bg-white dark:bg-neutral-900 rounded-xl shadow-xl border border-neutral-200 dark:border-neutral-800 flex flex-col overflow-hidden",
                    )}
                    initial={{ opacity: 0, scale: 0.9, x: '-50%', y: isTopHalf ? 10 : -10 }} 
                    animate={{ 
                        opacity: 1, 
                        scale: 1, 
                        x: '-50%',
                        y: isTopHalf ? 24 : '-104%' 
                    }}
                    exit={{ opacity: 0, scale: 0.9, x: '-50%', y: isTopHalf ? 10 : -10 }}
                    style={{
                        left: `${x}%`,
                        top: `${y}%`,
                        transformOrigin: `${isLeftHalf ? 'center' : 'center'} ${isTopHalf ? 'top' : 'bottom'}`
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onMouseUp={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-3 py-2 border-b border-neutral-100 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/50">
                       <div className="flex items-center gap-2">
                           {avatarUrl ? (
                                <>
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={avatarUrl} alt={authorName} className="w-5 h-5 rounded-full object-cover border border-neutral-200 dark:border-neutral-700" />
                                </>
                            ) : (
                               <div className="w-5 h-5 rounded-full bg-linear-to-br from-blue-500 to-purple-500 flex items-center justify-center text-[10px] text-white font-bold">
                                   {authorName && authorName !== 'Anonymous' ? authorName.charAt(0) : (t('sharedPage.comments.anonymous') || 'A').charAt(0)}
                               </div>
                           )}
                           <div className="flex flex-col">
                               <div className="flex items-center gap-1.5">
                                   <span className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">{authorName === 'Anonymous' ? t('sharedPage.comments.anonymous') : authorName}</span>
                                   {isOwner && (
                                       <span className="px-1 py-0.25 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 text-[8px] font-bold uppercase tracking-wider border border-amber-200 dark:border-amber-800">
                                           {t('sharedPage.comments.owner')}
                                       </span>
                                   )}
                               </div>
                               <span className="text-[10px] text-neutral-500">{formatDate(createdAt, t)}</span>
                           </div>
                       </div>
                       {!isDraft && onDelete && !readOnly && (
                           <button onClick={onDelete} className="text-neutral-400 hover:text-red-500 transition-colors">
                               <Trash2 size={14} />
                           </button>
                       )}
                    </div>

                    {/* Content */}
                    <div className="p-3">
                        {/* Quote Block */}
                        {selectedText && (
                            <div className="mb-2 pl-2 border-l-2 border-blue-500 bg-neutral-50 dark:bg-neutral-800/50 py-1">
                                <p className="text-xs text-neutral-500 dark:text-neutral-400 italic line-clamp-3">
                                    &quot;{selectedText}&quot;
                                </p>
                            </div>
                        )}

                        {isDraft ? (
                            <textarea
                                ref={inputRef}
                                value={content}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder={t('sharedPage.comments.writeCommentPlaceholder')}
                                className="w-full min-h-[80px] text-sm bg-transparent border-none resize-none focus:ring-0 focus:outline-none placeholder:text-neutral-400 text-neutral-900 dark:text-neutral-100"
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        if (content.trim()) onSave(content, selectedColor);
                                    }
                                    if (e.key === 'Escape') onCancel();
                                }}
                            />
                        ) : (
                            <p className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap leading-relaxed">
                                {content}
                            </p>
                        )}
                    </div>

                    {/* Footer (Actions) */}
                    {isDraft && (
                        <div className="flex items-center justify-between px-3 py-2 border-t border-neutral-100 dark:border-neutral-800">
                             {/* Color Picker */}
                             <div className="flex items-center gap-1.5">
                                 {COLORS.map((color) => (
                                     <button
                                         key={color.name}
                                         type="button"
                                         onClick={() => {
                                             setSelectedColor(color.value);
                                             onColorChange?.(color.value);
                                         }}
                                         className={cn(
                                             "w-4 h-4 rounded-full transition-transform hover:scale-110 focus:outline-none ring-1 ring-neutral-200 dark:ring-neutral-700",
                                             selectedColor === color.value && "ring-2 ring-neutral-900 dark:ring-white scale-110"
                                         )}
                                         style={{ backgroundColor: color.value }}
                                         title={color.name}
                                     />
                                 ))}
                             </div>

                             <div className="flex items-center gap-2">
                                 <button 
                                    onClick={onCancel}
                                    className="text-xs text-neutral-500 hover:text-neutral-700 px-2 py-1 rounded"
                                 >
                                     {t('sharedPage.comments.cancel')}
                                 </button>
                                 <button
                                    onClick={() => content.trim() && onSave(content, selectedColor)}
                                    disabled={!content.trim() || isLoading}
                                    className="flex items-center gap-1.5 bg-blue-600 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                 >
                                     {isLoading ? (
                                         <Loader2 size={12} className="animate-spin" />
                                     ) : (
                                         <>
                                            {t('sharedPage.comments.post')} <Send size={12} />
                                         </>
                                     )}
                                 </button>
                             </div>
                        </div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
};
