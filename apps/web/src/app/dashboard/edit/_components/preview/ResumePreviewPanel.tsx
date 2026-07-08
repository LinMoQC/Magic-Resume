"use client";

import React from 'react';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { Resume } from '@/types/frontend/resume';
import useMobile from '@/hooks/useMobile';
import { Tools } from '../layout/Tools';
import { EditorDock } from '../layout/EditorDock';
import { AiFab } from '../layout/AiFab';
import AiThinkingOverlay from '../modals/AiThinkingOverlay';
import { useTranslation } from 'react-i18next';
import { isCloudMode } from '@/lib/config/app';
import { PdfCanvasPreview } from './PdfCanvasPreview';

interface ResumePreviewPanelProps {
  activeResume: Resume | null;
  onShowAI: () => void;
  isAiJobRunning: boolean;
  onShareClick?: () => void;
  onFeedbackClick?: () => void;
  onJsonClick: () => void;
}

const ResumePreviewPanel: React.FC<ResumePreviewPanelProps> = ({
  activeResume,
  onShowAI,
  isAiJobRunning,
  onShareClick,
  onFeedbackClick,
  onJsonClick,
}) => {
  const { isMobile } = useMobile();
  const { t, i18n } = useTranslation();

  if (!activeResume) {
    return (
      <section className="min-w-0 flex-1 flex items-center justify-center bg-desk relative overflow-hidden max-h-screen">
        <div className="text-white">{t('common.loading')}</div>
      </section>
    );
  }

  return (
    <section
      className="min-w-0 flex-1 flex items-center justify-center bg-desk relative overflow-hidden max-h-screen"
      data-ai-running={isAiJobRunning ? "true" : "false"}
    >
      {isAiJobRunning && (
        <div className="ai-canvas-edge-flow" aria-hidden>
          <div className="ai-canvas-edge-flow__spin" />
        </div>
      )}

      <TransformWrapper
        initialScale={0.6}
        minScale={0.5}
        maxScale={2}
        limitToBounds={false}
        onInit={(controls) => controls.centerView(0.5, 0)}
        onPanningStart={() => document.body.classList.add('grabbing')}
        onPanningStop={() => document.body.classList.remove('grabbing')}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            <TransformComponent
              wrapperStyle={{ width: '100%', height: '100%',maxHeight: '100vh' }}
              contentStyle={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', width: '100%', height: '100%', paddingTop: '5rem', paddingBottom: '5rem' }}
            >
              <div className="relative">
                <PdfCanvasPreview resume={activeResume} locale={i18n.resolvedLanguage || i18n.language} />
                <AiThinkingOverlay
                  isVisible={isAiJobRunning}
                  themeColor={activeResume.themeColor || '#38bdf8'}
                />
              </div>
            </TransformComponent>

            {isMobile ? (
              <Tools
                isMobile
                zoomIn={zoomIn}
                zoomOut={zoomOut}
                resetTransform={resetTransform}
                resume={activeResume}
                onShowAI={onShowAI}
                onShareClick={onShareClick}
                onFeedbackClick={onFeedbackClick}
              />
            ) : (
              <EditorDock
                zoomIn={zoomIn}
                zoomOut={zoomOut}
                resetTransform={resetTransform}
                resume={activeResume}
                onShareClick={onShareClick}
                onJsonClick={onJsonClick}
              />
            )}
          </>
        )}
      </TransformWrapper>

      {!isMobile && isCloudMode && <AiFab onClick={onShowAI} isRunning={isAiJobRunning} />}
    </section>
  );
};

export default ResumePreviewPanel;
