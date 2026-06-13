import { useState } from 'react';
import { useSettingStore } from '@/store/useSettingStore';
import { Resume } from '@/types/frontend/resume';
import { MultiPersonaResumeAnalysis } from '@/types/agent/multi-persona';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

export const useMultiPersonaAnalyzer = () => {
  const { i18n, t } = useTranslation();
  const { apiKey, baseUrl, model } = useSettingStore();
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<MultiPersonaResumeAnalysis | null>(null);

  const runAnalysis = async ({ resumeData, language }: { resumeData: Resume, language?: string }) => {
    const targetLanguage = language || i18n.language || 'en';
    console.log('[MULTI_PERSONA] i18n.language:', i18n.language);
    console.log('[MULTI_PERSONA] targetLanguage:', targetLanguage);
    if (!apiKey) {
      toast.error(t('modals.aiModal.notifications.apiKeyMissing'));
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const config = { apiKey, baseUrl, modelName: model, maxTokens: 4096 };
      
      const response = await fetch('/api/analyze_multi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeData, config, language: targetLanguage }),
      });

      if (!response.ok) {
        throw new Error(`Analysis failed with status ${response.status}`);
      }

      const result: MultiPersonaResumeAnalysis = await response.json();
      setAnalysisResult(result);
      toast.success('Multi-persona analysis complete!');
    } catch (error) {
      console.error('[MULTI_PERSONA_ANALYSIS_ERROR]', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Analysis failed: ${errorMessage}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetAnalysis = () => {
    setAnalysisResult(null);
  };

  return { isAnalyzing, analysisResult, runAnalysis, resetAnalysis };
};
