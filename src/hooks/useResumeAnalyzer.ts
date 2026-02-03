import { useSettingStore } from '@/store/useSettingStore';
import { Resume } from '@/types/frontend/resume';
import { createResumeAnalysisChain } from '@/lib/aiLab/chains';
import { ResumeAnalysis } from '@/lib/types/analysis';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useResumeAnalyzerStore } from '@/store/useResumeAnalyzerStore';

export const useResumeAnalyzer = () => {
  const { t } = useTranslation();
  const { apiKey, baseUrl, model } = useSettingStore();
  const {
    isAnalyzing,
    analysisResult,
    analysisProgress,
    setIsAnalyzing,
    setAnalysisResult,
    setAnalysisProgress,
    resetAnalysis: resetAnalysisStore,
  } = useResumeAnalyzerStore();

  const runAnalysis = async ({ resumeData }: { resumeData: Resume }) => {
    if (!apiKey) {
      toast.error(t('modals.aiModal.notifications.apiKeyMissing'));
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);
    setAnalysisProgress({ value: 0, text: t('modals.aiModal.analysisTab.analysisProgress.start') });

    const analysisSteps = [
      { value: 15, text: t('modals.aiModal.analysisTab.analysisProgress.impact') },
      { value: 35, text: t('modals.aiModal.analysisTab.analysisProgress.quantification') },
      { value: 55, text: t('modals.aiModal.analysisTab.analysisProgress.clarity') },
      { value: 75, text: t('modals.aiModal.analysisTab.analysisProgress.completeness') },
      { value: 90, text: t('modals.aiModal.analysisTab.analysisProgress.summary') },
      { value: 95, text: t('modals.aiModal.analysisTab.analysisProgress.finalizing') },
    ];

    const timeouts = analysisSteps.map((step, index) => {
      return setTimeout(() => {
        setAnalysisProgress(step);
      }, (index + 1) * 1200);
    });

    try {
      const config = { apiKey, baseUrl, modelName: model, maxTokens: 4096 };
      const analysisChain = createResumeAnalysisChain(config);
      
      const rawResult = await analysisChain.invoke({ resume: JSON.stringify(resumeData) });
      const result: ResumeAnalysis = {
        overallScore: rawResult.overallScore,
        analysis: Object.entries(rawResult.detailedAnalysis).map(([category, data]) => ({
          category,
          score: data.score,
          justification: data.justification,
          suggestions: data.suggestions
        }))
      };

      timeouts.forEach(clearTimeout);
      setAnalysisProgress({ value: 100, text: t('modals.aiModal.analysisTab.analysisProgress.done') });
      
      await new Promise(resolve => setTimeout(resolve, 500)); 

      setAnalysisResult(result);
      toast.success(t('modals.aiModal.notifications.analysisComplete'));
    } catch (error) {
      console.error("[RESUME_ANALYSIS_ERROR]", error);
      const errorMessage = error instanceof Error ? error.message : t('modals.aiModal.notifications.unknownError');
      toast.error(t('modals.aiModal.notifications.analysisFailed', { error: errorMessage }));
      timeouts.forEach(clearTimeout);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetAnalysis = () => {
    resetAnalysisStore();
  };

  return { isAnalyzing, analysisResult, analysisProgress, runAnalysis, resetAnalysis };
};