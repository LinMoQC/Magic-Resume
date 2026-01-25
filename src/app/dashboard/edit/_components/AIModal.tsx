import React, { useState } from 'react';
import { FlaskConical, Wand2, BarChart3, BotMessageSquare, Mic } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/app/components/ui/dialog";
import { Resume, Section } from '@/store/useResumeStore';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import OptimizeTab from './AiLab/OptimizeTab';
import AnalyzeTab from './AiLab/AnalyzeTab';
import CreateTab from './AiLab/CreateTab';
import InterviewTab from './AiLab/InterviewTab';

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

const TABS_CONFIG = [
  { key: 'create', name: 'modals.aiModal.tabs.create', icon: <BotMessageSquare size={18} /> },
  { key: 'optimize', name: 'modals.aiModal.tabs.optimize', icon: <Wand2 size={18} /> },
  { key: 'analyze', name: 'modals.aiModal.tabs.analyze', icon: <BarChart3 size={18} /> },
  { key: 'interview', name: 'modals.aiModal.tabs.interview', icon: <Mic size={18} /> },
];


export default function AIModal({
  isOpen,
  onClose,
  resumeData,
  onApplySectionChanges,
  onApplyFullResume,
  templateId,
  isAiJobRunning,
  setIsAiJobRunning
}: AIModalProps) {
  const { t } = useTranslation();
  const [activeTabKey, setActiveTabKey] = useState(TABS_CONFIG[0].key);


  const handleApplySectionAndClose = (newSections: Section) => {
    onApplySectionChanges(newSections);
    onClose();
  };

  const handleApplyFullResumeAndClose = (newResume: Resume) => {
    onApplyFullResume(newResume);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[84vh] bg-neutral-950 border-neutral-800 text-white flex flex-col p-0 focus:outline-none">
        <DialogHeader className="p-4 pb-4 border-b border-neutral-800">
          <DialogTitle className="flex items-center text-xl">
            <FlaskConical className="mr-2 text-sky-400" size={22} />
            {t('modals.aiModal.title')}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex border-b border-neutral-800 px-6 gap-4">
            {TABS_CONFIG.map(tab => (
              <button
                key={tab.key}
                onClick={() => !isAiJobRunning && setActiveTabKey(tab.key)}
                disabled={isAiJobRunning}
                className={`flex items-center gap-2 px-1 pb-3 pt-2 text-sm font-medium transition-colors relative -bottom-px ${activeTabKey === tab.key
                  ? 'border-b-2 border-sky-500 text-white'
                  : 'text-neutral-400 hover:text-white'
                  } ${isAiJobRunning ? 'cursor-not-allowed opacity-60' : ''}`}
              >
                {tab.icon}
                {t(tab.name)}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTabKey}
                initial={{ opacity: 0, y: 0 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="px-6 flex flex-col h-full"
              >
                {activeTabKey === 'create' && (
                  <CreateTab
                    onApplyChanges={handleApplyFullResumeAndClose}
                    isAiJobRunning={isAiJobRunning}
                    setIsAiJobRunning={setIsAiJobRunning}
                  />
                )}
                {activeTabKey === 'optimize' && (
                  <OptimizeTab
                    resumeData={resumeData}
                    onApplyChanges={handleApplySectionAndClose}
                    templateId={templateId}
                    isAiJobRunning={isAiJobRunning}
                    setIsAiJobRunning={setIsAiJobRunning}
                  />
                )}
                {activeTabKey === 'analyze' && (
                  <AnalyzeTab
                    resumeData={resumeData}
                    isAiJobRunning={isAiJobRunning}
                    setIsAiJobRunning={setIsAiJobRunning}
                  />
                )}
                {activeTabKey === 'interview' && (
                  <InterviewTab
                    resumeData={resumeData}
                    isAiJobRunning={isAiJobRunning}
                    setIsAiJobRunning={setIsAiJobRunning}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
