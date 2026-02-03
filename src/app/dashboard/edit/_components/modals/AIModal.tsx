import React, { useState, useEffect } from 'react';
import { FlaskConical, Wand2, BarChart3, BotMessageSquare, Mic, X } from 'lucide-react';
import { Resume, Section } from '@/types/frontend/resume';
import { useTranslation } from 'react-i18next';
import { AnimatePresence, motion } from 'framer-motion';
import OptimizeTab from '../ai/OptimizeTab';
import AnalyzeTab from '../ai/AnalyzeTab';
import CreateTab from '../ai/CreateTab';
import InterviewTab from '../ai/InterviewTab';
import { useTrace } from '@/hooks/useTrace';

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
  const { traceAiCreateViewed, traceAiOptimizeViewed, traceAiAnalyzeViewed, traceAiInterviewViewed } = useTrace();

  useEffect(() => {
    if (isOpen) {
      switch (activeTabKey) {
        case 'create':
          traceAiCreateViewed();
          break;
        case 'optimize':
          traceAiOptimizeViewed();
          break;
        case 'analyze':
          traceAiAnalyzeViewed();
          break;
        case 'interview':
          traceAiInterviewViewed();
          break;
      }
    }
  }, [isOpen, activeTabKey, traceAiCreateViewed, traceAiOptimizeViewed, traceAiAnalyzeViewed, traceAiInterviewViewed]);


  const handleApplySectionAndClose = (newSections: Section) => {
    onApplySectionChanges(newSections);
    onClose();
  };

  const handleApplyFullResumeAndClose = (newResume: Resume) => {
    onApplyFullResume(newResume);
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
            onClick={() => !isAiJobRunning && onClose()}
            className="fixed inset-0 bg-black/60 z-[100] backdrop-blur-md"
          />
          <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="w-full max-w-5xl h-[85vh] bg-[#0A0A0A] border border-neutral-800 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden focus:outline-none pointer-events-auto"
            >
              <div className="flex items-center justify-between p-6 border-b border-neutral-800 bg-neutral-900/20">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-sky-500/10 flex items-center justify-center text-sky-400 border border-sky-500/20">
                    <FlaskConical size={22} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">{t('modals.aiModal.title')}</h2>
                    <p className="text-xs text-neutral-500 mt-0.5">{t('modals.aiModal.subtitle') || 'Powerful AI tools to elevate your resume'}</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full hover:bg-neutral-800 text-neutral-500 hover:text-white transition-all active:scale-90"
                  type="button"
                  disabled={isAiJobRunning}
                >
                  <X size={22} />
                </button>
              </div>

              <div className="flex-1 flex flex-col overflow-hidden">
                <div className="flex border-b border-neutral-800 px-8 gap-8 bg-neutral-900/10">
                  {TABS_CONFIG.map(tab => (
                    <button
                      key={tab.key}
                      onClick={() => !isAiJobRunning && setActiveTabKey(tab.key)}
                      disabled={isAiJobRunning}
                      className={`flex items-center gap-2.5 px-1 pb-4 pt-5 text-sm font-semibold transition-all relative ${activeTabKey === tab.key
                        ? 'text-sky-400'
                        : 'text-neutral-500 hover:text-neutral-300'
                        } ${isAiJobRunning ? 'cursor-not-allowed opacity-40' : ''}`}
                    >
                      {tab.icon}
                      {t(tab.name)}
                      {activeTabKey === tab.key && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-400 rounded-t-full shadow-[0_0_10px_rgba(56,189,248,0.5)]"
                        />
                      )}
                    </button>
                  ))}
                </div>

                <div className="flex-1 overflow-hidden custom-scrollbar">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTabKey}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.25, ease: "easeInOut" }}
                      className="h-full px-8 pb-8"
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
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
