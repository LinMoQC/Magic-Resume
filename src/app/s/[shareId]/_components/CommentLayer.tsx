'use client';

import React from 'react';
import { CommentMarker } from './CommentMarker';
import { CommentPopover } from './CommentPopover';
import { Comment, HighlightRect } from '../_types';

interface CommentLayerProps {
    comments: Comment[];
    setComments: (comments: Comment[]) => void;
    draftComment: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    setDraftComment: (draft: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
    activeCommentId: string | null;
    setActiveCommentId: (id: string | null) => void;
    isCommentMode: boolean;
    isDraggingMarkerRef: React.MutableRefObject<boolean>;
    resumeContainerRef: React.RefObject<HTMLDivElement | null>;
    handleSaveDraft: (content: string, color: string) => void;
    isSaving?: boolean;
    onDeleteComment: (commentId: string) => void;
    currentUserId?: string;
    isResumeOwner?: boolean;
}

export const CommentLayer = ({
    comments,
    setComments,
    draftComment,
    setDraftComment,
    activeCommentId,
    setActiveCommentId,
    isCommentMode,
    isDraggingMarkerRef,
    resumeContainerRef,
    handleSaveDraft,
    isSaving,
    onDeleteComment,
    currentUserId,
    isResumeOwner
}: CommentLayerProps) => {
    return (
        <>
            {/* Render Highlights for Existing Comments */}
            {comments.map((comment: Comment) => (
                comment.highlightRects?.map((rect: HighlightRect, i: number) => (
                    <div
                        key={`${comment.id}-rect-${i}`}
                        className="absolute pointer-events-none mix-blend-multiply opacity-40 z-10"
                        style={{
                            left: `${rect.x}%`,
                            top: `${rect.y}%`,
                            width: `${rect.w}%`,
                            height: `${rect.h}%`,
                            backgroundColor: comment.color || '#fbbf24'
                        }}
                    />
                ))
            ))}

            {/* Render Draft Highlights */}
            {draftComment?.highlightRects?.map((rect: HighlightRect, i: number) => (
                <div
                    key={`draft-rect-${i}`}
                    className="absolute pointer-events-none mix-blend-multiply opacity-40 z-10"
                    style={{
                        left: `${rect.x}%`,
                        top: `${rect.y}%`,
                        width: `${rect.w}%`,
                        height: `${rect.h}%`,
                        backgroundColor: draftComment.color || '#9ca3af'
                    }}
                />
            ))}

            {/* Comment Layer */}
            {comments.map((comment, idx) => (
                <React.Fragment key={comment.id}>
                    <CommentMarker
                        x={comment.x}
                        y={comment.y}
                        index={idx + 1}
                        active={activeCommentId === comment.id}
                        containerRef={resumeContainerRef}
                        color={comment.color}
                        avatarUrl={comment.imageUrl}
                        readOnly={!isCommentMode}
                        onDragStart={() => {
                            isDraggingMarkerRef.current = true;
                        }}
                        onClick={() => {
                            setActiveCommentId(activeCommentId === comment.id ? null : comment.id);
                            setDraftComment(null);
                        }}
                        onDragEnd={(newX, newY) => {
                            setTimeout(() => {
                                isDraggingMarkerRef.current = false;
                            }, 50);
                            
                            setComments(comments.map(c => 
                                c.id === comment.id 
                                    ? { ...c, x: newX, y: newY }
                                    : c
                            ));
                        }}
                    />
                    <CommentPopover
                        isOpen={activeCommentId === comment.id}
                        x={comment.x}
                        y={comment.y}
                        authorName={comment.author}
                        avatarUrl={comment.imageUrl}
                        isOwner={comment.isOwner}
                        createdAt={comment.createdAt}
                        initialContent={comment.content}
                        selectedText={comment.selectedText}
                        onSave={() => {}} 
                        onCancel={() => setActiveCommentId(null)}
                        onDelete={
                            (isResumeOwner || (currentUserId && comment.authorId === currentUserId))
                                ? () => onDeleteComment(comment.id)
                                : undefined
                        }
                        readOnly={!isCommentMode}
                    />
                </React.Fragment>
            ))}

            {draftComment && (
                <>
                    <CommentMarker
                        x={draftComment.x}
                        y={draftComment.y}
                        isDraft
                        active
                        containerRef={resumeContainerRef}
                        color={draftComment.color}
                        readOnly={!isCommentMode}
                    />
                    <CommentPopover
                        isOpen={true}
                        x={draftComment.x}
                        y={draftComment.y}
                        isDraft
                        selectedText={draftComment.selectedText}
                        onSave={handleSaveDraft}
                        onCancel={() => setDraftComment(null)}
                        onColorChange={(color) => setDraftComment((prev: any) => prev ? { ...prev, color } : null)} // eslint-disable-line @typescript-eslint/no-explicit-any
                        isLoading={isSaving}
                    />
                </>
            )}
        </>
    );
};
