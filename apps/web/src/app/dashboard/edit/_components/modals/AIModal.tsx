import React from 'react';
import { InfoType, Resume, Section } from '@/types/frontend/resume';
import { AnimatePresence, motion } from 'framer-motion';
import AiChatShell from '../ai/AiChatShell';

type AIModalProps = {
  isOpen: boolean;
  onClose: () => void;
  resumeData: Resume;
  onApplySectionChanges: (newSections: Section) => void;
  onApplyInfo: (info: InfoType) => void;
  onApplyFullResume: (newResume: Resume) => void;
  templateId: string;
  isAiJobRunning: boolean;
  setIsAiJobRunning: (isRunning: boolean) => void;
};

export default function AIModal({
  isOpen,
  onClose,
  resumeData,
  onApplySectionChanges,
  onApplyInfo,
  onApplyFullResume,
  templateId,
  isAiJobRunning,
  setIsAiJobRunning,
}: AIModalProps) {
  const handleBackdropClose = () => {
    // Closing puts the AI Lab away and preserves the transcript, but an in-flight
    // stream is still aborted so work does not continue in the background.
    if (
      isAiJobRunning &&
      typeof window !== 'undefined' &&
      !window.confirm('AI 正在生成，关闭将停止本次生成。确定关闭？')
    ) {
      return;
    }
    onClose();
  };
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleBackdropClose}
            className="fixed inset-0 bg-black/40 z-100 backdrop-blur-sm cursor-pointer"
          />
          <div className="fixed inset-0 z-101 flex items-center justify-center p-3 sm:p-5 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 12 }}
              className="w-full h-full max-w-[1500px] bg-desk border border-neutral-800 rounded-3xl shadow-[0_8px_28px_rgba(0,0,0,0.14)] overflow-hidden focus:outline-none pointer-events-auto"
            >
              <AiChatShell
                resumeData={resumeData}
                templateId={templateId}
                onClose={onClose}
                onApplySections={onApplySectionChanges}
                onApplyInfo={onApplyInfo}
                onApplyFullResume={onApplyFullResume}
                setIsAiJobRunning={setIsAiJobRunning}
              />
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
