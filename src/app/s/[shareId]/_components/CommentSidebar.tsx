'use client';

import React, { useRef, useEffect } from 'react';
import { X, MessageSquare, Send } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from "@/lib/utils";
import { Comment } from '../_types';
import { useTranslation } from 'react-i18next';

interface CommentSidebarProps {
    isOpen: boolean;
    onClose: () => void;
    comments: Comment[];
    activeCommentId: string | null;
    onCommentClick: (id: string) => void;
    onReply: (commentId: string, content: string) => Promise<void>;
    currentUserId?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const formatDate = (dateStr: string, t: any) => {
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

const CommentItem = ({ 
    comment, 
    active, 
    onClick,
    onReply,
}: { 
    comment: Comment; 
    active: boolean; 
    onClick: () => void;
    onReply: (commentId: string, content: string) => Promise<void>;
    currentUserId?: string;
}) => {
    const { t } = useTranslation();
    const itemRef = useRef<HTMLDivElement>(null);
    const [replyText, setReplyText] = React.useState('');
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    useEffect(() => {
        if (active && itemRef.current) {
            itemRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    }, [active]);

    return (
        <div 
            ref={itemRef}
            onClick={onClick}
            className={cn(
                "p-4 rounded-xl border transition-all cursor-pointer group mb-3",
                active 
                    ? "bg-white/10 border-white/20 shadow-lg" 
                    : "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10"
            )}
        >
            <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                    {comment.user ? (
                        <div className="flex items-center gap-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img 
                                src={comment.user.imageUrl} 
                                alt={comment.user.username} 
                                className="w-6 h-6 rounded-full border border-white/10" 
                            />
                            <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium text-neutral-200">
                                        {comment.user.firstName || comment.user.username || t('sharedPage.comments.anonymous')}
                                    </span>
                                    {comment.isOwner && (
                                        <span className="px-1 py-0.25 rounded bg-amber-100/10 text-amber-500 text-[8px] font-bold uppercase tracking-wider border border-amber-500/20">
                                            {t('sharedPage.comments.owner')}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-linear-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-[10px] font-bold text-white uppercase">
                                {comment.author?.[0] || 'A'}
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-neutral-200">{comment.author || t('sharedPage.comments.anonymous')}</span>
                                {comment.isOwner && (
                                    <span className="px-1 py-0.25 rounded bg-amber-100/10 text-amber-500 text-[8px] font-bold uppercase tracking-wider border border-amber-500/20">
                                        {t('sharedPage.comments.owner')}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>
                <span className="text-[10px] text-neutral-500">{formatDate(comment.createdAt, t)}</span>
            </div>

            {comment.selectedText && (
                <div className="mb-2 px-2 py-1 bg-white/5 border-l-2 border-indigo-500/50 rounded-r text-[11px] text-neutral-400 italic line-clamp-2">
                    &quot;{comment.selectedText}&quot;
                </div>
            )}

            <p className="text-sm text-neutral-300 leading-relaxed mb-3">
                {comment.content}
            </p>

            {/* Replies Section */}
            {comment.replies && comment.replies.length > 0 && (
                <div className="mt-4 space-y-3 pl-4 border-l border-white/10">
                    {comment.replies.map((reply) => (
                        <div key={reply.id} className="relative">
                            <div className="flex items-start justify-between mb-1">
                                <div className="flex items-center gap-2">
                                    {reply.user ? (
                                        <div className="flex items-center gap-1.5">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img 
                                                src={reply.user.imageUrl} 
                                                alt={reply.user.username} 
                                                className="w-5 h-5 rounded-full border border-white/10" 
                                            />
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[12px] font-medium text-neutral-300">
                                                    {reply.user.firstName || reply.user.username}
                                                </span>
                                                {reply.isOwner && (
                                                    <span className="px-1 py-0.25 rounded bg-amber-100/10 text-amber-500 text-[7px] font-bold uppercase tracking-wider border border-amber-500/20">
                                                        {t('sharedPage.comments.owner')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-5 h-5 rounded-full bg-neutral-700 flex items-center justify-center text-[9px] font-bold text-white uppercase">
                                                {reply.author?.[0] || 'A'}
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <span className="text-[12px] font-medium text-neutral-300">{reply.author}</span>
                                                {reply.isOwner && (
                                                    <span className="px-1 py-0.25 rounded bg-amber-100/10 text-amber-500 text-[7px] font-bold uppercase tracking-wider border border-amber-500/20">
                                                        {t('sharedPage.comments.owner')}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                                <span className="text-[9px] text-neutral-500">{formatDate(reply.createdAt, t)}</span>
                            </div>
                            <p className="text-[12px] text-neutral-400 leading-relaxed">
                                {reply.content}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {/* Reply Input */}
            {active && (
                <div className="mt-4 flex items-center gap-2">
                    <form 
                        className="flex-1 bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 flex items-center gap-2"
                        onSubmit={async (e) => {
                            e.preventDefault();
                            if (!replyText.trim() || isSubmitting) return;
                            setIsSubmitting(true);
                            try {
                                await onReply(comment.id, replyText);
                                setReplyText('');
                            } finally {
                                setIsSubmitting(false);
                            }
                        }}
                    >
                        <input 
                            type="text" 
                            value={replyText}
                            onChange={(e) => setReplyText(e.target.value)}
                            placeholder={t('sharedPage.comments.replyPlaceholder')} 
                            disabled={isSubmitting}
                            className="flex-1 bg-transparent border-none outline-none text-xs text-neutral-300 placeholder:text-neutral-600 disabled:opacity-50"
                            onClick={(e) => e.stopPropagation()}
                        />
                        <button 
                            type="submit"
                            disabled={isSubmitting || !replyText.trim()}
                            className="text-neutral-500 hover:text-white transition-colors disabled:opacity-30"
                        >
                            <Send size={12} />
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};

export const CommentSidebar = ({
    isOpen,
    onClose,
    comments,
    activeCommentId,
    onCommentClick,
    onReply,
    currentUserId
}: CommentSidebarProps) => {
    const { t } = useTranslation();
    const [isMobile, setIsMobile] = React.useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 1024);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop for mobile */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                    />

                    {/* Sidebar / Drawer */}
                    <motion.aside
                        initial={isMobile ? { y: '100%', x: 0 } : { x: '100%', y: 0 }}
                        animate={{ x: 0, y: 0 }}
                        exit={isMobile ? { y: '100%', x: 0 } : { x: '100%', y: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className={cn(
                            "fixed bottom-0 right-0 z-50 bg-[#0F0F0F] border-white/10 flex flex-col shadow-2xl overflow-hidden",
                            // Desktop: Sidebar on the right
                            "lg:top-16 lg:bottom-0 lg:w-96 lg:border-l",
                            // Mobile: Drawer from bottom
                            "w-full h-[75vh] rounded-t-3xl lg:rounded-none lg:h-auto"
                        )}
                    >
                        {/* Mobile Handle */}
                        <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto my-3 lg:hidden" />

                        {/* Header */}
                        <div className="px-6 py-4 flex items-center justify-between border-b border-white/5">
                            <div className="flex items-center gap-2">
                                <MessageSquare size={18} className="text-indigo-400" />
                                <h2 className="text-lg font-semibold text-white">{t('sharedPage.comments.title')}</h2>
                                <span className="px-2 py-0.5 rounded-full bg-white/5 text-[10px] text-neutral-400 font-medium">
                                    {comments.length}
                                </span>
                            </div>
                            <button 
                                onClick={onClose}
                                className="p-2 rounded-lg hover:bg-white/5 text-neutral-500 hover:text-white transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* List Area */}
                        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                            {comments.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center px-8 opacity-40">
                                    <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center mb-4">
                                        <MessageSquare size={24} />
                                    </div>
                                    <p className="text-sm">{t('sharedPage.comments.noComments')}</p>
                                    <p className="text-xs mt-1">{t('sharedPage.comments.markersHint')}</p>
                                </div>
                            ) : (
                                comments.map((comment) => (
                                    <CommentItem 
                                        key={comment.id}
                                        comment={comment}
                                        active={activeCommentId === comment.id}
                                        onClick={() => onCommentClick(comment.id)}
                                        onReply={onReply}
                                        currentUserId={currentUserId}
                                    />
                                ))
                            )}
                        </div>

                    </motion.aside>
                </>
            )}
        </AnimatePresence>
    );
};
