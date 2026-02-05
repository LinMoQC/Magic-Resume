import React, { useEffect, useState } from 'react';
import { Resume } from '@/types/frontend/resume';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Sparkles, BarChart3, RotateCw, Code2, Briefcase, Users, Cpu } from 'lucide-react';
import MultiPersonaAnalysisReport from '@/components/MultiPersonaAnalysisReport';
import { useMultiPersonaAnalyzer } from '@/hooks/useMultiPersonaAnalyzer';
import { useTrace } from '@/hooks/useTrace';
import { motion, AnimatePresence } from 'framer-motion';

type AnalyzeTabProps = {
  resumeData: Resume;   
  isAiJobRunning: boolean;
  setIsAiJobRunning: (isRunning: boolean) => void;
};

function LoadingState() {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);
  
  const steps = [
    { icon: Code2, text: t('modals.aiModal.analysisTab.multiSteps.peer'), color: 'text-blue-400' },
    { icon: Briefcase, text: t('modals.aiModal.analysisTab.multiSteps.lead'), color: 'text-purple-400' },
    { icon: Users, text: t('modals.aiModal.analysisTab.multiSteps.hrbp'), color: 'text-green-400' },
    { icon: Cpu, text: t('modals.aiModal.analysisTab.multiSteps.finalizing'), color: 'text-blue-500' }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setStep((s) => (s + 1) % steps.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [steps.length]);

  const CurrentIcon = steps[step].icon;

  return (
    <div className="flex flex-col items-center justify-center h-[65vh] text-center p-4">
      <div className="relative mb-8">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          className="w-32 h-32 rounded-full border-2 bg-linear-to-r from-blue-500/20 via-purple-500/20 to-blue-500/20 border-white/5 shadow-[0_0_20px_rgba(59,130,246,0.1)]"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.5, opacity: 0 }}
              className={`p-4 rounded-xl bg-neutral-900/50 backdrop-blur-xl border border-white/5 ${steps[step].color}`}
            >
              <CurrentIcon className="w-8 h-8" />
            </motion.div>
          </AnimatePresence>
        </div>
        
        {/* Scanning Effect */}
        <motion.div
          animate={{ top: ['0%', '100%', '0%'] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="absolute left-0 w-full h-px bg-linear-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_8px_rgba(96,165,250,0.8)] z-10"
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.p
          key={step}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="text-white font-medium max-w-[280px]"
        >
          {steps[step].text}
        </motion.p>
      </AnimatePresence>
      <p className="mt-2 text-xs text-neutral-500 uppercase tracking-[0.2em]">{t('modals.aiModal.progressText')}</p>
    </div>
  );
}

export default function AnalyzeTab({ resumeData, isAiJobRunning, setIsAiJobRunning }: AnalyzeTabProps) {
  const { t } = useTranslation();
  const { isAnalyzing, analysisResult, runAnalysis, resetAnalysis } = useMultiPersonaAnalyzer();
  const { traceAiAnalysisStarted } = useTrace();

  useEffect(() => {
    setIsAiJobRunning(isAnalyzing);
  }, [isAnalyzing, setIsAiJobRunning]);

  const handleAnalyze = () => {
    traceAiAnalysisStarted();
    runAnalysis({ resumeData });
  };
  
  return (
    <div className="relative h-full">
      <AnimatePresence mode="wait">
        {isAnalyzing ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <LoadingState />
          </motion.div>
        ) : analysisResult ? (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className='relative overflow-y-auto max-h-[calc(100vh-200px)] scrollbar-hide'
          >
            <style jsx global>{`
              .scrollbar-hide::-webkit-scrollbar {
                display: none !important;
              }
              .scrollbar-hide {
                -ms-overflow-style: none !important;
                scrollbar-width: none !important;
              }
            `}</style>
            <div className="sticky top-0 right-0 w-full flex justify-end p-4 z-40 h-0 pointer-events-none">
              <Button 
                onClick={() => !isAiJobRunning && resetAnalysis()} 
                disabled={isAiJobRunning} 
                variant="ghost" 
                className="pointer-events-auto text-neutral-400 hover:bg-neutral-800 hover:text-white backdrop-blur-md bg-black/40 border border-white/5 rounded-full"
              >
                <RotateCw size={14} className="mr-2" />
                {t('modals.aiModal.analysisTab.reAnalyzeButton')}
              </Button>
            </div>
            <div className="pt-4 px-1">
              <MultiPersonaAnalysisReport analysis={analysisResult} />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center text-center h-[65vh] p-4"
          >
            <div className="relative mb-8">
              <div className="p-8 rounded-2xl bg-linear-to-br from-blue-500/10 to-purple-500/10 border border-white/5 shadow-2xl">
                <BarChart3 size={48} className="text-blue-400" />
              </div>
              <motion.div
                animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute inset-0 bg-blue-500/20 blur-2xl -z-10 rounded-full"
              />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">{t('modals.aiModal.analysisTab.title')}</h2>
            <p className="text-neutral-400 max-w-sm mb-8 leading-relaxed">
              {t('modals.aiModal.analysisTab.placeholder.description')}
            </p>
            <Button 
              onClick={handleAnalyze} 
              disabled={isAiJobRunning} 
              className="group relative overflow-hidden bg-blue-600 hover:bg-blue-700 text-white font-bold text-lg px-8 py-6 rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)]"
            >
              <div className="flex items-center gap-2 relative z-10">
                <Sparkles className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                {t('modals.aiModal.analysisTab.analyzeButton')}
              </div>
              <motion.div
                initial={{ left: '-100%' }}
                whileHover={{ left: '100%' }}
                transition={{ duration: 0.8 }}
                className="absolute top-0 w-full h-full bg-linear-to-r from-transparent via-white/20 to-transparent skew-x-12"
              />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}