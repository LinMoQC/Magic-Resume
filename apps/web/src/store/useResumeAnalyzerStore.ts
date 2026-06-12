import { create } from 'zustand';
import { ResumeAnalysis } from '@/lib/types/analysis';

interface ResumeAnalyzerState {
  isAnalyzing: boolean;
  analysisResult: ResumeAnalysis | null;
  analysisProgress: { value: number; text: string };
  setIsAnalyzing: (isAnalyzing: boolean) => void;
  setAnalysisResult: (result: ResumeAnalysis | null) => void;
  setAnalysisProgress: (progress: { value: number; text: string }) => void;
  resetAnalysis: () => void;
}

export const useResumeAnalyzerStore = create<ResumeAnalyzerState>((set) => ({
  isAnalyzing: false,
  analysisResult: null,
  analysisProgress: { value: 0, text: '' },
  setIsAnalyzing: (isAnalyzing) => set({ isAnalyzing }),
  setAnalysisResult: (analysisResult) => set({ analysisResult }),
  setAnalysisProgress: (analysisProgress) => set({ analysisProgress }),
  resetAnalysis: () => {
    set({
      analysisResult: null,
      analysisProgress: { value: 0, text: '' },
    });
  },
})); 