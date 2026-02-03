"use client";

import React from 'react';
import ResumePreview from './ResumePreview';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { Resume } from '@/types/frontend/resume';
import useMobile from '@/hooks/useMobile';
import { Tools } from '../layout/Tools';
import AiThinkingOverlay from '../modals/AiThinkingOverlay';

interface ResumePreviewPanelProps {
  activeResume: Resume | null;
  previewScale: number;
  setPreviewScale: (scale: number) => void;
  onShowAI: () => void;
  onVersionClick?: () => void;
  isAiJobRunning: boolean;
  rightCollapsed?: boolean;
  onShareClick?: () => void;
}

const ResumePreviewPanel: React.FC<ResumePreviewPanelProps> = ({
  activeResume,
  setPreviewScale,
  onShowAI,
  onVersionClick,
  isAiJobRunning,
  rightCollapsed = false,
  onShareClick
}) => {
  const { isMobile } = useMobile();

  if (!activeResume) {
    return (
      <section className="flex-1 flex items-center justify-center bg-black relative overflow-hidden max-h-screen">
        <div className="text-white">Loading...</div>
      </section>
    );
  }

  return (
    <section
      className="flex-1 flex items-center justify-center bg-black relative overflow-hidden max-h-screen"
    >
      <TransformWrapper
        initialScale={0.6}
        minScale={0.5}
        maxScale={2}
        limitToBounds={false}
        onTransformed={(_ref, state) => setPreviewScale(state.scale)}
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

            <Tools 
              isMobile={isMobile} 
              zoomIn={zoomIn} 
              zoomOut={zoomOut} 
              resetTransform={resetTransform} 
              info={activeResume.info} 
              onShowAI={onShowAI} 
              onVersionClick={onVersionClick}
              rightCollapsed={rightCollapsed}
              templateId={activeResume.template}
              customTemplate={activeResume.customTemplate}
              onShareClick={onShareClick}
            />
          </>
        )}
      </TransformWrapper>
    </section>
  );
};

export default ResumePreviewPanel; 