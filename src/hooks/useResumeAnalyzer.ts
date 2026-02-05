import { useSettingStore } from '@/store/useSettingStore';
import { Resume } from '@/types/frontend/resume';
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

    try {
      const config = { apiKey, baseUrl, modelName: model, maxTokens: 4096 };
      
      // 调用流式 API
      const apiEndpoint = process.env.NEXT_PUBLIC_IF_USE_BACKEND === 'true'
        ? '/api/analyze-resume'
        : '/api/node/analyze-resume';

      console.log('[ANALYSIS] Calling API endpoint:', apiEndpoint);
      console.log('[ANALYSIS] NEXT_PUBLIC_IF_USE_BACKEND:', process.env.NEXT_PUBLIC_IF_USE_BACKEND);

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeData, config }),
      });

      console.log('[ANALYSIS] Response status:', response.status);

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';
      const analysisCategories = ['KeySkillsMatch', 'ImpactAndActionability', 'QuantifiableAchievements', 'ClarityAndReadability', 'ProfessionalSummary'];
      let completedCategories = 0;
      let analysisReport: Record<string, any> = {};

      const processMessage = (message: string) => {
        if (!message.trim() || !message.startsWith('data: ')) return;

        try {
          const jsonStr = message.replace(/^data: /, '');
          const data = JSON.parse(jsonStr);
          
          console.log('[ANALYSIS] Stream data:', data);

          // 检查是否有分析结果（最终结果）
          if (data.combiner?.analysisReport) {
            analysisReport = data.combiner.analysisReport;
            console.log('[ANALYSIS] Final report received:', analysisReport);
          }

          // 检查单个类别分析完成
          if (data.analyze_category?.parallelAnalysisResults) {
            const currentResults = data.analyze_category.parallelAnalysisResults;
            completedCategories = Object.keys(currentResults).length;
            
            console.log('[ANALYSIS] Category completed, total:', completedCategories);
            
            const progress = Math.min(95, Math.floor((completedCategories / analysisCategories.length) * 100));
            const lastCompletedCategory = Object.keys(currentResults)[completedCategories - 1];
            
            const progressText = lastCompletedCategory
              ? `正在分析: ${lastCompletedCategory}`
              : '正在分析简历...';
            
            setAnalysisProgress({ value: progress, text: progressText });
          }
        } catch (error) {
          console.error('[ANALYSIS] Failed to parse message:', error);
        }
      };

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          if (buffer) processMessage(buffer);
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const messages = buffer.split('\n\n');
        buffer = messages.pop() || '';

        for (const message of messages) {
          processMessage(message);
        }
      }

      // 转换分析报告为前端格式
      if (Object.keys(analysisReport).length === 0) {
        throw new Error('No analysis results received');
      }

      // 计算总分
      const scores = Object.values(analysisReport).map((cat: any) => cat.score || 0);
      const overallScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

      const result: ResumeAnalysis = {
        overallScore,
        analysis: Object.entries(analysisReport).map(([category, data]: [string, any]) => ({
          category,
          score: data.score || 0,
          justification: data.justification || '',
          suggestions: data.suggestions || []
        }))
      };

      setAnalysisProgress({ value: 100, text: t('modals.aiModal.analysisTab.analysisProgress.done') });
      await new Promise(resolve => setTimeout(resolve, 500));

      setAnalysisResult(result);
      toast.success(t('modals.aiModal.notifications.analysisComplete'));
    } catch (error) {
      console.error("[RESUME_ANALYSIS_ERROR]", error);
      const errorMessage = error instanceof Error ? error.message : t('modals.aiModal.notifications.unknownError');
      toast.error(t('modals.aiModal.notifications.analysisFailed', { error: errorMessage }));
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetAnalysis = () => {
    resetAnalysisStore();
  };

  return { isAnalyzing, analysisResult, analysisProgress, runAnalysis, resetAnalysis };
};