'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, ZoomIn, ZoomOut, MessageSquare, RotateCcw, Eye, Wand2 } from 'lucide-react';
import { AnimatePresence, motion } from "motion/react";
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';

import { FloatingDock } from "@/components/ui/floating-dock";
import { useSharedResume } from './_hooks/useSharedResume';
import { SharedResumeHeader } from './_components/SharedResumeHeader';
import { CommentLayer } from './_components/CommentLayer';
import { ResumeTransformView } from './_components/ResumeTransformView';
import { CommentSidebar } from './_components/CommentSidebar';

export default function SharedResumePage() {
  const router = useRouter();
  const { t } = useTranslation();
  const [countdown, setCountdown] = useState(5);
  const {
    resume,
    loading,
    error,
    template,
    isCommentMode,
    initialScale,
    isScaleReady,
    comments,
    setComments,
    draftComment,
    setDraftComment,
    activeCommentId,
    setActiveCommentId,
    isSidebarOpen,
    setIsSidebarOpen,
    isDraggingMarkerRef,
    resumeContainerRef,
    transformComponentRef,
    handleResumeMouseUp,
    handleSaveDraft,
    handleReply,
    handleDeleteComment,
    toggleCommentMode,
    toggleSidebar,
    scrollToComment,
    currentUserId,
    isSaving
  } = useSharedResume();

  // Filter Toolbar Configuration based on permissions
  const dockItems = [
    {
      id: "zoom-out",
      title: t('sharedPage.toolbar.zoomOut'),
      icon: <ZoomOut className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
      onClick: () => transformComponentRef.current?.zoomOut(),
    },
    {
      id: "zoom-reset",
      title: t('sharedPage.toolbar.resetZoom'),
      icon: <RotateCcw className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
      onClick: () => transformComponentRef.current?.resetTransform(),
    },
    {
      id: "zoom-in",
      title: t('sharedPage.toolbar.zoomIn'),
      icon: <ZoomIn className="h-full w-full text-neutral-500 dark:text-neutral-300" />,
      onClick: () => transformComponentRef.current?.zoomIn(),
    },
    {
        id: "comments-list",
        title: t('sharedPage.toolbar.feedbackList'),
        icon: (
            <div className="relative w-full h-full flex items-center justify-center">
                <MessageSquare className="h-full w-full text-neutral-500 dark:text-neutral-300" />
                {comments.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 rounded-full text-[10px] flex items-center justify-center text-white border-2 border-[#0D0D0D]">
                        {comments.length}
                    </span>
                )}
            </div>
        ),
        onClick: toggleSidebar,
    },
    {
      id: "comment-toggle",
      title: isCommentMode ? t('sharedPage.toolbar.returnToView') : t('sharedPage.toolbar.commentMode'), 
      icon: (
        <div className="w-full h-full flex items-center justify-center">
            <AnimatePresence mode="wait" initial={false}>
                {isCommentMode ? (
                    <motion.div
                        key="view-icon"
                        initial={{ rotate: -90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: 90, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="w-full h-full flex items-center justify-center"
                    >
                        <Eye className="h-full w-full text-neutral-500 dark:text-neutral-300" />
                    </motion.div>
                ) : (
                    <motion.div
                        key="comment-icon"
                        initial={{ rotate: 90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: -90, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="w-full h-full flex items-center justify-center"
                    >
                        <Wand2 className="h-full w-full text-neutral-500 dark:text-neutral-300" />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
      ),
      onClick: toggleCommentMode,
    },
  ].filter(item => {
    // Hide comment-toggle if user is only a VIEWER and not the owner
    const isOwner = resume?.userId === currentUserId;
    if (item.id === 'comment-toggle' && resume?.shareRole === 'VIEWER' && !isOwner) {
        return false;
    }
    return true;
  });

  useEffect(() => {
    if (error || (!loading && !resume)) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            router.push('/');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [error, loading, resume, router]);

  if (loading || !isScaleReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-950">
        <Loader2 className="w-8 h-8 text-neutral-500 animate-spin" />
      </div>
    );
  }

  if (error || !resume || !template) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-950 text-white p-4">
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
        >
            <h1 className="text-6xl font-black mb-4 bg-linear-to-b from-white to-white/40 bg-clip-text text-transparent">404</h1>
            <p className="text-xl text-neutral-400 mb-8">{error || t('sharedPage.error.resumeNotFound')}</p>
            <div className="flex flex-col items-center gap-4">
                <div className="h-1 w-48 bg-neutral-800 rounded-full overflow-hidden">
                    <motion.div 
                        initial={{ width: "100%" }}
                        animate={{ width: "0%" }}
                        transition={{ duration: 5, ease: "linear" }}
                        className="h-full bg-blue-500"
                    />
                </div>
                <p className="text-sm text-neutral-500">
                    {t('sharedPage.error.redirectingPre')} <span className="text-blue-500 font-mono font-bold">{countdown}</span> {t('sharedPage.error.redirectingPost')}
                </p>
                <button 
                    onClick={() => router.push('/')}
                    className="mt-4 px-6 py-2 bg-white text-black rounded-full text-sm font-medium hover:bg-neutral-200 transition-colors"
                >
                    {t('sharedPage.error.returnNow')}
                </button>
            </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="h-screen w-screen bg-[#0A0A0A] flex flex-col overflow-hidden fixed inset-0">
        {/* Background Effects */}
        <div className="absolute inset-0 z-0 pointer-events-none">
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[120px]" />
            <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center mask-[linear-gradient(180deg,white,rgba(255,255,255,0))]" />
        </div>

        <SharedResumeHeader />

        <div className="flex-1 flex overflow-hidden relative">
            <ResumeTransformView
                transformComponentRef={transformComponentRef}
                initialScale={initialScale}
                isCommentMode={isCommentMode}
                resumeContainerRef={resumeContainerRef}
                handleResumeMouseUp={handleResumeMouseUp}
                template={template}
                resume={resume}
            >
                <CommentLayer 
                    comments={comments}
                    setComments={setComments}
                    draftComment={draftComment}
                    setDraftComment={setDraftComment}
                    activeCommentId={activeCommentId}
                    setActiveCommentId={setActiveCommentId}
                    isCommentMode={isCommentMode}
                    isDraggingMarkerRef={isDraggingMarkerRef}
                    resumeContainerRef={resumeContainerRef}
                    handleSaveDraft={handleSaveDraft}
                    isSaving={isSaving}
                    onDeleteComment={handleDeleteComment}
                    currentUserId={currentUserId || undefined}
                    isResumeOwner={resume?.userId === currentUserId}
                />
            </ResumeTransformView>

            <CommentSidebar 
                isOpen={isSidebarOpen}
                onClose={() => setIsSidebarOpen(false)}
                comments={comments}
                activeCommentId={activeCommentId}
                onCommentClick={scrollToComment}
                onReply={handleReply}
                currentUserId={currentUserId || undefined}
            />
        </div>

        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
            <FloatingDock items={dockItems} />
        </div>
    </div>
  );
}
