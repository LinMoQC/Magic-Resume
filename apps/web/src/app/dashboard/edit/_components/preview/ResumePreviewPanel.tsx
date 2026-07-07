"use client";

import React from 'react';
import ResumePreview from './ResumePreview';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { Resume } from '@/types/frontend/resume';
import useMobile from '@/hooks/useMobile';
import { Tools } from '../layout/Tools';
import { EditorDock } from '../layout/EditorDock';
import { AiFab } from '../layout/AiFab';
import AiThinkingOverlay from '../modals/AiThinkingOverlay';
import { useTranslation } from 'react-i18next';
import { isCloudMode } from '@/lib/config/app';

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
  const { t } = useTranslation();

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
                <ResumePreview
                  info={activeResume.info}
                  sections={activeResume.sections}
                  sectionOrder={activeResume.sectionOrder.map(s => s.key)}
                  templateId={activeResume.template}
                  customTemplate={activeResume.customTemplate}
                />
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
