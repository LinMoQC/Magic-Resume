'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useResumeStore } from '@/store/useResumeStore';
import { useMultiPersonaAnalyzer } from '@/hooks/useMultiPersonaAnalyzer';
import MultiPersonaAnalysisReport from '@/components/MultiPersonaAnalysisReport';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

export default function MultiPersonaAnalysisDemo() {
  const params = useParams();
  const id = params.id as string;
  const { activeResume, loadResumeForEdit, resumes, loadResumes } = useResumeStore();
  const { isAnalyzing, analysisResult, runAnalysis, resetAnalysis } = useMultiPersonaAnalyzer();
  const [hasResume, setHasResume] = useState(false);
  const [analysisLanguage, setAnalysisLanguage] = useState<'en' | 'zh'>('zh');

  // Ensure resume is loaded if hitting this page directly
  useEffect(() => {
    if (resumes.length === 0) {
      loadResumes();
    }
  }, [resumes.length, loadResumes]);

  useEffect(() => {
    if (id && (!activeResume || activeResume.id !== id)) {
      loadResumeForEdit(id);
    }
  }, [id, activeResume, loadResumeForEdit]);

  useEffect(() => {
    setHasResume(!!activeResume);
  }, [activeResume]);

  const handleAnalyze = () => {
    if (activeResume) {
      runAnalysis({ resumeData: activeResume, language: analysisLanguage });
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-neutral-950 p-8 custom-scrollbar">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Multi-Persona Resume Analysis</h1>
            <p className="text-neutral-400">
              Get comprehensive feedback from ATS Bot, Hiring Manager, and HR Specialist perspectives
            </p>
          </div>
          
          {/* Language Selector */}
          <div className="flex bg-neutral-900 border border-neutral-800 p-1 rounded-lg self-start">
            <button
              onClick={() => setAnalysisLanguage('en')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
                analysisLanguage === 'en'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              English
            </button>
            <button
              onClick={() => setAnalysisLanguage('zh')}
              className={`px-4 py-1.5 text-xs font-semibold rounded-md transition-all ${
                analysisLanguage === 'zh'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              简体中文
            </button>
          </div>
        </div>

        {!hasResume ? (
          <div className="bg-neutral-900 rounded-lg p-8 border border-neutral-800 text-center">
            <p className="text-neutral-400">
              Please load a resume first. Go to the editor and load or create a resume.
            </p>
          </div>
        ) : (
          <>
            <div className="mb-6">
              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  'Run Multi-Persona Analysis'
                )}
              </Button>
              {analysisResult && (
                <Button
                  onClick={resetAnalysis}
                  variant="ghost"
                  className="ml-2 text-neutral-400 hover:text-white"
                >
                  Reset
                </Button>
              )}
            </div>

            {analysisResult && (
              <MultiPersonaAnalysisReport analysis={analysisResult!} />
            )}
          </>
        )}
      </div>
    </div>
  );
}
