'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useAppAuth } from '@/lib/auth';
import { resumeApi, isLocalResumeId } from '@/lib/api/resume';
import { getMagicTemplateById } from '@magic-resume/resume-templates/config/magic-templates';
import { mergeTemplateConfig } from '@/lib/utils/templateUtils';
import { Resume } from '@/types/frontend/resume';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { Comment, HighlightRect } from '../_types';
import { ReactZoomPanPinchRef } from "react-zoom-pan-pinch";

const mapBackendComment = (c: any, resumeUserId?: string): Comment => ({ // eslint-disable-line @typescript-eslint/no-explicit-any
    ...c,
    authorId: c.authorId,
    isOwner: resumeUserId ? c.authorId === resumeUserId : false,
    x: c.position?.x ?? 0,
    y: c.position?.y ?? 0,
    highlightRects: c.position?.highlightRects ?? [],
    author: c.user ? `${c.user.firstName || ''} ${c.user.lastName || ''}`.trim() || c.user.username : c.author || 'Anonymous',
    imageUrl: c.user?.imageUrl,
    replies: c.replies?.map((r: any) => mapBackendComment(r, resumeUserId)) // eslint-disable-line @typescript-eslint/no-explicit-any
});

export function useSharedResume() {
    const { t } = useTranslation();
    const params = useParams();
    const shareId = params?.shareId as string;

    // Core State
    const [resume, setResume] = useState<Resume | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [template, setTemplate] = useState<any>(null); // eslint-disable-line @typescript-eslint/no-explicit-any
    const [isCommentMode, setIsCommentMode] = useState(false);
    
    // Zoom/Scale State
    const [initialScale, setInitialScale] = useState(1);
    const [isScaleReady, setIsScaleReady] = useState(false);
    
    // Comment State
    const [comments, setComments] = useState<Comment[]>([]);
    const [draftComment, setDraftComment] = useState<{ 
        x: number, 
        y: number, 
        highlightRects?: HighlightRect[], 
        selectedText?: string, 
        color?: string 
    } | null>(null);
    const [activeCommentId, setActiveCommentId] = useState<string | null>(null);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const { userId: currentUserId, redirectToSignIn } = useAppAuth();
    const isDraggingMarkerRef = useRef(false);

    const resumeContainerRef = useRef<HTMLDivElement>(null);
    const transformComponentRef = useRef<ReactZoomPanPinchRef | null>(null);

    // Initial Scale Calculation
    useEffect(() => {
        const updateScale = () => {
            const width = window.innerWidth;
            const height = window.innerHeight;
            const RESUME_WIDTH_PX = 794; 
            const RESUME_HEIGHT_PX = 1123; 
            const PADDING_X = 40;
            const PADDING_Y = 120;

            const scaleX = (width - PADDING_X) / RESUME_WIDTH_PX;
            const scaleY = (height - PADDING_Y) / RESUME_HEIGHT_PX;
            const fitScale = Math.min(scaleX, scaleY);
            
            let targetScale = Math.min(1.0, fitScale);
            if (width < 768) {
                const mobileScale = (width - 20) / RESUME_WIDTH_PX;
                targetScale = Math.max(0.3, mobileScale);
            } else {
                targetScale = Math.max(0.4, targetScale);
            }

            setInitialScale(targetScale);
            setIsScaleReady(true);
        };

        updateScale();
        window.addEventListener('resize', updateScale);
        return () => window.removeEventListener('resize', updateScale);
    }, []);

    // Set sidebar open if comments exist initially (only once)
    useEffect(() => {
        if (comments.length > 0 && !isSidebarOpen) {
            // setIsSidebarOpen(true); // Maybe not auto-open to keep it clean
        }
    }, [comments.length]); // eslint-disable-line react-hooks/exhaustive-deps

    // ESC Key Handling
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (draftComment) setDraftComment(null);
                if (activeCommentId) setActiveCommentId(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [draftComment, activeCommentId]);

    // Data Fetching
    useEffect(() => {
        if (!shareId) return;
        let ignore = false;

        const fetchResume = async () => {
            try {
                setLoading(true);
                const data = await resumeApi.fetchSharedResume(shareId);
                if (ignore) return;

                let parsedResume = { ...data };
                // Content is usually a string in DB, but sometimes it might be parsed by interceptor
                if (typeof data.content === 'string') {
                    try {
                        const contentObj = JSON.parse(data.content);
                        // IMPORTANT: Spread contentObj FIRST, then data.
                        // Database fields like shareRole, isPublic, etc. must take precedence.
                        parsedResume = { 
                            ...contentObj, 
                            ...data 
                        };
                    } catch (e) {
                        console.error("Failed to parse content", e);
                    }
                } else if (data.content) {
                    parsedResume = { ...data.content, ...data };
                }
                
                const baseTemplate = await getMagicTemplateById(parsedResume.template || 'classic');
                const fullTemplate = mergeTemplateConfig(baseTemplate, parsedResume.customTemplate);

                if (ignore) return;

                // Guard the render-critical shape so a malformed/legacy payload renders
                // empty instead of white-screening the public page.
                if (!parsedResume.sections || typeof parsedResume.sections !== 'object') {
                    parsedResume.sections = {};
                }
                if (!Array.isArray(parsedResume.sectionOrder)) {
                    parsedResume.sectionOrder = [];
                }

                setResume(parsedResume);
                setTemplate(fullTemplate);

                // Set comments from backend
                if (data.comments) {
                    setComments(data.comments.map((c: any) => mapBackendComment(c, data.userId || parsedResume.userId))); // eslint-disable-line @typescript-eslint/no-explicit-any
                    
                    // Handle deep link to comment
                    const searchParams = new URLSearchParams(window.location.search);
                    const linkedCommentId = searchParams.get('commentId');
                    if (linkedCommentId && data.comments.some((c: any) => c.id === linkedCommentId)) { // eslint-disable-line @typescript-eslint/no-explicit-any
                        setActiveCommentId(linkedCommentId);
                        setIsSidebarOpen(true);
                        // Optional: Switch to comment mode to see markers
                        setIsCommentMode(true);
                    }
                }
            } catch (err: any) { // eslint-disable-line @typescript-eslint/no-explicit-any
                if (ignore) return;
                console.error('Error fetching resume:', err);
                setError(err.response?.status === 404 ? t('sharedPage.error.resumeNotFound') : t('sharedPage.error.failedToLoad'));
                if (err.response?.status === 404) {
                    toast.error(t('sharedPage.notifications.resumeNotFound'));
                }
            } finally {
                if (!ignore) setLoading(false);
            }
        };

        fetchResume();
        // `t` is intentionally omitted: it changes identity on language switch, which
        // would refetch and (without cancellation) let a stale response overwrite newer
        // data. The ignore flag cancels in-flight work on shareId change / unmount.
        return () => { ignore = true; };
    }, [shareId]); // eslint-disable-line react-hooks/exhaustive-deps

    // Handlers
    const handleResumeMouseUp = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        if (!isCommentMode || !resumeContainerRef.current) return;
        
        if (isDraggingMarkerRef.current) {
            isDraggingMarkerRef.current = false;
            return;
        }

        const selection = window.getSelection();
        let hasSelection = false;
        const selectionRects: HighlightRect[] = [];
        let selectionText = '';
        let selectionX = 0;
        let selectionY = 0;

        if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
            const range = selection.getRangeAt(0);
            selectionText = selection.toString();
            const rect = resumeContainerRef.current.getBoundingClientRect();

            if (resumeContainerRef.current.contains(range.commonAncestorContainer)) {
                hasSelection = true;
                const clientRects = range.getClientRects();
                
                for (let i = 0; i < clientRects.length; i++) {
                    const r = clientRects[i];
                    selectionRects.push({
                        x: ((r.left - rect.left) / rect.width) * 100,
                        y: ((r.top - rect.top) / rect.height) * 100,
                        w: (r.width / rect.width) * 100,
                        h: (r.height / rect.height) * 100
                    });
                }
                
                const lastRect = clientRects[clientRects.length - 1];
                selectionX = ((lastRect.right - rect.left) / rect.width) * 100;
                selectionY = ((lastRect.top - rect.top) / rect.height) * 100;
            }
        }

        const rect = resumeContainerRef.current.getBoundingClientRect();
        const pointX = ((e.clientX - rect.left) / rect.width) * 100;
        const pointY = ((e.clientY - rect.top) / rect.height) * 100;

        if (hasSelection) {
            setDraftComment({ 
                x: selectionX, 
                y: selectionY,
                highlightRects: selectionRects,
                selectedText: selectionText,
                color: '#fbbf24'
            });
        } else {
            if (activeCommentId) {
                setActiveCommentId(null);
            } else {
                setDraftComment({ 
                    x: pointX, 
                    y: pointY,
                    color: '#fbbf24'
                });
            }
        }
    }, [isCommentMode, activeCommentId]);

    const handleSaveDraft = useCallback(async (content: string, color: string) => {
        if (!draftComment || !resume?.id) return;
        
        try {
            const isLocalId = isLocalResumeId(String(resume.id));
            if (isLocalId) {
                toast.error(t('sharedPage.notifications.syncing'));
                return;
            }

            if (!currentUserId) {
                toast.error(t('sharedPage.notifications.loginToComment'));
                redirectToSignIn();
                return;
            }

            setIsSaving(true);
            const newComment = await resumeApi.addComment(shareId, {
                content,
                position: { x: draftComment.x, y: draftComment.y, highlightRects: draftComment.highlightRects },
                color: color,
                selectedText: draftComment.selectedText
            });
            
            setComments(prev => [...prev, mapBackendComment(newComment, resume.userId)]);
            setDraftComment(null);
            window.getSelection()?.removeAllRanges();
            toast.success(t('sharedPage.notifications.commentAdded'));
        } catch (e) {
            console.error("Failed to save comment", e);
            toast.error(t('sharedPage.notifications.commentSaveFailed'));
        } finally {
            setIsSaving(false);
        }
    }, [draftComment, resume, shareId, t, currentUserId, redirectToSignIn]);

    const handleReply = useCallback(async (commentId: string, content: string) => {
        if (!resume?.id) return;

        try {
            if (!currentUserId) {
                toast.error(t('sharedPage.notifications.loginToReply'));
                redirectToSignIn();
                return;
            }

            const reply = await resumeApi.addReply(shareId, commentId, { content });
            
            // Update comments tree
            setComments(prev => prev.map(c => {
                if (c.id === commentId) {
                    return { ...c, replies: [...(c.replies || []), mapBackendComment(reply, resume.userId)] };
                }
                return c;
            }));
            toast.success(t('sharedPage.notifications.replyAdded'));
        } catch (e) {
            console.error("Failed to save reply", e);
            toast.error(t('sharedPage.notifications.replySaveFailed'));
        }
    }, [resume, shareId, t, currentUserId, redirectToSignIn]);

    const handleDeleteComment = useCallback(async (commentId: string) => {
        if (!resume?.id) return;

        try {
            if (!currentUserId) {
                toast.error(t('sharedPage.notifications.loginToDelete'));
                return;
            }

            await resumeApi.deleteComment(resume.id, commentId);

            setComments(prev => prev.filter(c => c.id !== commentId));
            if (activeCommentId === commentId) {
                setActiveCommentId(null);
            }
            toast.success(t('sharedPage.notifications.commentDeleted'));
        } catch (e) {
            console.error("Failed to delete comment", e);
            toast.error(t('sharedPage.notifications.commentDeleteFailed'));
        }
    }, [resume, t, currentUserId, activeCommentId]);

    const toggleCommentMode = useCallback(() => {
        if (isCommentMode) {
            setDraftComment(null);
            setActiveCommentId(null);
        }
        setIsCommentMode(prev => !prev);
    }, [isCommentMode]);

    const toggleSidebar = useCallback(() => setIsSidebarOpen(prev => !prev), []);

    const scrollToComment = useCallback((commentId: string) => {
        const comment = comments.find(c => c.id === commentId);
        if (comment && transformComponentRef.current) {
            // Focus and open popover
            setActiveCommentId(commentId);
            setDraftComment(null);
            // Optional: center the view on the comment
            // transformComponentRef.current.zoomToElement(...);
        }
    }, [comments]);

    return {
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
        currentUserId,
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
        isSaving
    };
}
