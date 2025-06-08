"use client";

import React from 'react';
import ResumePreview from './ResumePreview';
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { DownloadIcon } from '@radix-ui/react-icons';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { toast } from 'sonner';
import { InfoType, Section } from '@/store/useResumeStore';
import { oklchToRgb } from '@/lib/export';

interface ResumePreviewPanelProps {
  info: InfoType;
  sections: Section;
  sectionOrder: string[];
  previewScale: number;
  setPreviewScale: (scale: number) => void;
}

const ResumePreviewPanel: React.FC<ResumePreviewPanelProps> = ({
  info,
  sections,
  sectionOrder,
  previewScale,
  setPreviewScale,
}) => {
  // This is a simplified conversion and might not be perfectly accurate,
  // but it's a good-enough polyfill for html2canvas.
  const handleExport = () => {
    const resumeElement = document.getElementById('resume-to-export');
    if (resumeElement) {
      const clonedResume = resumeElement.cloneNode(true) as HTMLElement;
      // Position off-screen to avoid flicker and ensure computation
      clonedResume.style.position = 'absolute';
      clonedResume.style.left = '-9999px';
      clonedResume.style.top = '0px';
      document.body.appendChild(clonedResume);
      
      const elements = [clonedResume, ...Array.from(clonedResume.getElementsByTagName('*')) as HTMLElement[]];
      
      elements.forEach(element => {
        const style = window.getComputedStyle(element);
        const colorProps = ['color', 'background-color', 'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color'];
        const oklchRegex = /oklch\(([^)]+)\)/;
        
        colorProps.forEach(prop => {
          const value = style.getPropertyValue(prop);
          const match = value.match(oklchRegex);
          if (match) {
            try {
              const [l, c, h] = match[1].split(' ').map(s => parseFloat(s.replace('%', '')));
              const [r, g, b] = oklchToRgb(l, c, h);
              element.style.setProperty(prop, `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`, 'important');
            } catch (e) {
              console.warn(`Could not convert oklch color: ${match[0]}`, e);
            }
          }
        });
      });

      const originalStyle = resumeElement.style.transform;
      clonedResume.style.transform = '';

      html2canvas(clonedResume, {
        scale: 2,
        useCORS: true,
        logging: true,
      }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        const imgRatio = canvasWidth / canvasHeight;

        const pdfWidth = 210; // A4 width in mm
        const pdfHeight = pdfWidth / imgRatio;
        
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: [pdfWidth, pdfHeight]
        });
        
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        
        pdf.save(`${info.fullName || 'resume'}.pdf`);
        toast.success('Resume exported successfully!');
      }).catch(error => {
        console.error('Error exporting resume:', error);
        toast.error('Failed to export resume.');
      }).finally(() => {
        document.body.removeChild(clonedResume);
        resumeElement.style.transform = originalStyle;
      });
    }
  };

  return (
    <section
      className="flex-1 flex items-center justify-center bg-black relative overflow-hidden max-h-screen"
    >
      <TransformWrapper
        initialScale={0.8}
        initialPositionX={80}
        initialPositionY={20}
        minScale={0.5}
        maxScale={2}
        limitToBounds={false}
        onTransformed={(_ref, state) => setPreviewScale(state.scale)}
      >
        {({ zoomIn, zoomOut, resetTransform }) => (
          <>
            <TransformComponent
              wrapperStyle={{ width: '100%', height: '100%',maxHeight: '100vh' }}
              contentStyle={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', width: '100%', height: '100%', paddingTop: '5rem', paddingBottom: '5rem' }}
            >
              <ResumePreview info={info} sections={sections} sectionOrder={sectionOrder} />
            </TransformComponent>

            {/* Function Buttons */}
            <div className="absolute bottom-10 right-4 flex flex-col gap-2 z-20 overflow-hidden">
              <button
                className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-white hover:bg-neutral-700 transition"
                onClick={handleExport}
                title="Export PDF"
                type="button"
              >
                <DownloadIcon />
              </button>
              <button
                className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-white hover:bg-neutral-700 transition"
                onClick={() => zoomIn()}
                title="Zoom In"
                type="button"
              >
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M12 5v14m7-7H5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              </button>
              <button
                className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-white hover:bg-neutral-700 transition"
                onClick={() => zoomOut()}
                title="Zoom Out"
                type="button"
              >
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
              </button>
              <button
                className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-white hover:bg-neutral-700 transition"
                onClick={() => resetTransform()}
                title="Reset Zoom"
                type="button"
              >
                <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="6" stroke="currentColor" strokeWidth="2" /></svg>
              </button>
            </div>
          </>
        )}
      </TransformWrapper>
    </section>
  );
};

export default ResumePreviewPanel; 