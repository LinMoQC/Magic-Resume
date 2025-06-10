"use client";

import React from 'react';
import ResumePreview from './ResumePreview';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { InfoType, Section } from '@/store/useResumeStore';
import useMobile from '@/app/hooks/useMobile';
import { Tools } from './Tools';

interface ResumePreviewPanelProps {
  info: InfoType;
  sections: Section;
  sectionOrder: string[];
  previewScale: number;
  setPreviewScale: (scale: number) => void;
  onShowAI: () => void;
}

const ResumePreviewPanel: React.FC<ResumePreviewPanelProps> = ({
  info,
  sections,
  sectionOrder,
  setPreviewScale,
  onShowAI,
}) => {
  const { isMobile } = useMobile();

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
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            <TransformComponent
              wrapperStyle={{ width: '100%', height: '100%',maxHeight: '100vh' }}
              contentStyle={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', width: '100%', height: '100%', paddingTop: '5rem', paddingBottom: '5rem' }}
            >
              <ResumePreview info={info} sections={sections} sectionOrder={sectionOrder} />
            </TransformComponent>

            <Tools isMobile={isMobile} zoomIn={zoomIn} zoomOut={zoomOut} resetTransform={resetTransform} info={info} onShowAI={onShowAI} />
          </>
        )}
      </TransformWrapper>
    </section>
  );
};

export default ResumePreviewPanel; 