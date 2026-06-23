import React from 'react';
import { Resume, Section } from '@/types/frontend/resume';
import { AnimatePresence, motion } from 'framer-motion';
import AiChatShell from '../ai/chat/AiChatShell';

type AIModalProps = {
  isOpen: boolean;
  onClose: () => void;
  resumeData: Resume;
  onApplySectionChanges: (newSections: Section) => void;
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
  templateId,
  setIsAiJobRunning,
}: AIModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-100 backdrop-blur-md cursor-pointer"
          />
          <div className="fixed inset-0 z-101 flex items-center justify-center p-3 sm:p-5 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, y: 12 }}
              className="w-full h-full max-w-[1500px] bg-[#0A0A0A] border border-neutral-800 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden focus:outline-none pointer-events-auto"
            >
              <AiChatShell
                resumeData={resumeData}
                templateId={templateId}
                onClose={onClose}
                onApplySections={onApplySectionChanges}
                setIsAiJobRunning={setIsAiJobRunning}
              />
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
