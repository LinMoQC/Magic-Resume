'use client';

import React from 'react';
import { TransformWrapper, TransformComponent, ReactZoomPanPinchRef } from "react-zoom-pan-pinch";
import { cn } from "@/lib/utils";
import { MagicResumeRenderer } from '@/templates/renderer/MagicResumeRenderer';

interface ResumeTransformViewProps {
    transformComponentRef: React.RefObject<ReactZoomPanPinchRef | null>;
    initialScale: number;
    isCommentMode: boolean;
    resumeContainerRef: React.RefObject<HTMLDivElement | null>;
    handleResumeMouseUp: (e: React.MouseEvent<HTMLDivElement>) => void;
    template: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    resume: any; // eslint-disable-line @typescript-eslint/no-explicit-any
    children?: React.ReactNode;
}

export const ResumeTransformView = ({
    transformComponentRef,
    initialScale,
    isCommentMode,
    resumeContainerRef,
    handleResumeMouseUp,
    template,
    resume,
    children
}: ResumeTransformViewProps) => {
    return (
        <main className="flex-1 overflow-hidden relative z-10 flex flex-col">
            <TransformWrapper
                ref={transformComponentRef}
                initialScale={initialScale}
                minScale={0.5}
                maxScale={2}
                centerOnInit
                limitToBounds={false}
                disabled={isCommentMode}
                wheel={{ disabled: isCommentMode }}
                panning={{ disabled: isCommentMode }}
            >
                {() => (
                    <TransformComponent
                        wrapperClass={cn(
                            "!w-full !h-full", 
                            isCommentMode ? "!cursor-text" : "!cursor-grab active:!cursor-grabbing"
                        )}
                        contentClass={cn(
                            "w-fit min-h-full flex items-start justify-center pt-12 pb-32",
                            isCommentMode ? "pointer-events-auto" : "pointer-events-none"
                        )}
                    >
                        <div 
                            ref={resumeContainerRef}
                            className={cn(
                                "relative w-[210mm] min-w-[210mm] bg-white shadow-2xl transition-shadow duration-300",
                                "shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)]",
                                isCommentMode ? "select-text cursor-text" : "select-none" 
                            )}
                            style={{ minHeight: '297mm' }}
                            onMouseUp={handleResumeMouseUp}
                        >
                            <MagicResumeRenderer template={template} data={resume} />
                            {children}
                        </div>
                    </TransformComponent>
                )}
            </TransformWrapper>
        </main>
    );
};
