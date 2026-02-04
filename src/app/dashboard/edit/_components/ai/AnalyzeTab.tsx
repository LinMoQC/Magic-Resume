import React, { useEffect } from 'react';
import { Resume } from '@/types/frontend/resume';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Sparkles, BarChart3, Loader2, RotateCw } from 'lucide-react';
import { ResumeAnalysisReport } from '@/components/features/resume/ResumeAnalysisReport';
import { useResumeAnalyzer } from '@/hooks/useResumeAnalyzer';
import { useTrace } from '@/hooks/useTrace';

type AnalyzeTabProps = {
  resumeData: Resume;   
  isAiJobRunning: boolean;
  setIsAiJobRunning: (isRunning: boolean) => void;
};

export default function AnalyzeTab({ resumeData, isAiJobRunning, setIsAiJobRunning }: AnalyzeTabProps) {
  const { t } = useTranslation();
  const { isAnalyzing, analysisResult, analysisProgress, runAnalysis, resetAnalysis } = useResumeAnalyzer();
  const { traceAiAnalysisStarted } = useTrace();

  useEffect(() => {
    setIsAiJobRunning(isAnalyzing);
  }, [isAnalyzing, setIsAiJobRunning]);

  const handleAnalyze = () => {
    traceAiAnalysisStarted();
    runAnalysis({ resumeData });
  };
  
  return (
    <div>
      {isAnalyzing ? (
        <div className="flex flex-col items-center justify-center h-[65vh] text-neutral-500 text-center p-4">
          <Sparkles size={48} className="animate-pulse text-purple-500" />
          <p className="mt-4 mb-2 text-white">{analysisProgress.text || t('modals.aiModal.progressText')}</p>
          <div className="w-[60%] bg-neutral-700 rounded-full h-2.5">
            <div className="bg-purple-600 h-2.5 rounded-full" style={{ width: `${analysisProgress.value}%` }}></div>
          </div>
        </div>
      ) : analysisResult ? (
        <div className='relative py-4'>
          <div className="flex justify-end mb-4 absolute top-6 right-4">
            <Button onClick={() => !isAiJobRunning && resetAnalysis()} disabled={isAiJobRunning} variant="ghost" className="text-neutral-300 hover:bg-neutral-800 hover:text-white">
              <RotateCw size={16} className="mr-2" />
              {t('modals.aiModal.analysisTab.reAnalyzeButton')}
            </Button>
          </div>
          <ResumeAnalysisReport analysis={analysisResult} />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center text-center h-[65vh] p-4">
          <div className="p-6 rounded-full bg-purple-500/10 border-2 border-dashed border-purple-500/30 mb-6">
            <BarChart3 size={48} className="text-purple-300" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">{t('modals.aiModal.analysisTab.title')}</h2>
          <p className="text-neutral-400 max-w-md mb-8">
            {t('modals.aiModal.analysisTab.placeholder.description')}
          </p>
          <Button onClick={handleAnalyze} disabled={isAiJobRunning} className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg px-8 py-6">
            {isAnalyzing ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : <Sparkles className="mr-2 h-5 w-5" />}
            {isAnalyzing ? t('modals.aiModal.analysisTab.analyzingButton') : t('modals.aiModal.analysisTab.analyzeButton')}
          </Button>
        </div>
      )}
    </div>
  );
}