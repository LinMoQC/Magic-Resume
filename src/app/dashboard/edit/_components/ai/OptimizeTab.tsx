import React, { useState, useEffect } from 'react';
import { Resume, Section } from '@/types/frontend/resume';
import { useTranslation } from 'react-i18next';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Paperclip, Wand2, Loader2, CheckCircle, Eye, Code, Zap, Brain, Minimize2 } from 'lucide-react';
import { useResumeOptimizer } from '@/hooks/useResumeOptimizer';
import ResumePreview from '../preview/ResumePreview';
import { trackEvent } from '@/components/features/analytics/Analytics';
import { useTrace } from '@/hooks/useTrace';
import { motion, AnimatePresence } from 'framer-motion';
import { createPortal } from 'react-dom';

import { ProcessGraph } from './ProcessGraph';
import { EditorComponents } from '@/lib/utils/componentOptimization';
import { DiffEditor } from '@monaco-editor/react';
import { useResumeOptimizerStore } from '@/store/useResumeOptimizerStore';

const ReactJsonView = EditorComponents.JsonViewer;

type OptimizeTabProps = {
  resumeData: Resume;
  onApplyChanges: (newSections: Section) => void;
  templateId: string;
  isAiJobRunning: boolean;
  setIsAiJobRunning: (isRunning: boolean) => void;
};

export default function OptimizeTab({ resumeData, onApplyChanges, templateId, setIsAiJobRunning }: OptimizeTabProps) {
  const { t } = useTranslation();
  const { traceAiOptimizationStarted } = useTrace();
  const [viewMode, setViewMode] = useState<'preview' | 'json' | 'diff'>('preview'); // State for optimizer
  const [mounted, setMounted] = useState(false);

  // Destructure from the store
  const {
    isLoading: storeIsLoading, // Renamed to avoid conflict with hook's isLoading
    elapsedTime
  } = useResumeOptimizerStore();

  // Map store state to local variables for compatibility
  const isAiJobRunning = storeIsLoading;

  const [isMinimized, setIsMinimized] = useState(false);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // V7 Three-Track: Company and Job Title inputs
  const [companyName, setCompanyName] = useState('');
  const [jobTitle, setJobTitle] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

const {
    isLoading,
    logs,
    optimizedResume,
    runOptimization,
    setJd,
    jd,
  } = useResumeOptimizer();



  useEffect(() => {
    setIsAiJobRunning(storeIsLoading);
    if (!storeIsLoading) {
      setIsMinimized(false);
    }
  }, [storeIsLoading, setIsAiJobRunning]);

  const handleOptimize = () => {
    setViewMode('preview');
    setIsMinimized(false);

    // 追踪AI优化使用
    trackEvent('ai_optimization_started', {
      feature: 'resume_optimize',
      user_action: 'optimize_button_click'
    });

    traceAiOptimizationStarted(!!jd);

    // V7: Include company name and job title
    runOptimization({ jd, resumeData, companyName, jobTitle });
  };

  const handleApply = () => {
    if (optimizedResume) {
      // 追踪优化结果应用
      trackEvent('ai_optimization_applied', {
        feature: 'resume_optimize',
        sections_optimized: Object.keys(optimizedResume.sections || {}).length
      });

      onApplyChanges(optimizedResume.sections);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 h-full mt-3">
        {/* 左侧输入区域 */}
        <div className="lg:col-span-2 space-y-4 flex flex-col h-[62vh]">
          <div className="flex-1 flex flex-col bg-linear-to-br from-neutral-900/70 to-neutral-800/40 p-4 rounded-lg border border-neutral-700/50 backdrop-blur-sm">
            <label htmlFor="jd" className="font-bold text-neutral-200 flex items-center mb-3 text-base">
              <div className="w-6 h-6 bg-neutral-800 rounded-md flex items-center justify-center mr-2">
                <Paperclip size={14} className="text-white" />
              </div>
              {t('modals.aiModal.optimizeTab.jdLabel')}
            </label>
            <Textarea
              id="jd"
              disabled={isAiJobRunning}
              value={jd}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setJd(e.target.value)}
              placeholder={t('modals.aiModal.optimizeTab.jdPlaceholder')}
              className="flex-1 bg-neutral-900/70 border-neutral-700/50 rounded-lg focus:ring-2 focus:ring-sky-500/40 focus:border-sky-500/40 resize-none text-sm leading-relaxed shadow-inner transition-all duration-200 hover:border-neutral-600/50"
            />
          </div>

          {/* V7 Three-Track: Company Name Input */}
          <div className="flex flex-col bg-linear-to-br from-neutral-900/70 to-neutral-800/40 p-3 rounded-lg border border-neutral-700/50 backdrop-blur-sm">
            <label htmlFor="companyName" className="font-semibold text-neutral-200 flex items-center mb-2 text-sm">
              <div className="w-5 h-5 bg-neutral-800 rounded-md flex items-center justify-center mr-2">
                <Brain size={12} className="text-white" />
              </div>
              公司名称 *
            </label>
            <input
              type="text"
              id="companyName"
              disabled={isAiJobRunning}
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="例如: Google, 阿里巴巴"
              className="h-10 px-3 bg-neutral-900/70 border border-neutral-700/50 rounded-lg focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500/40 text-sm text-neutral-100 placeholder:text-neutral-500 shadow-inner transition-all duration-200 hover:border-neutral-600/50"
              required
            />
          </div>

          {/* V7 Three-Track: Job Title Input */}
          <div className="flex flex-col bg-linear-to-br from-neutral-900/70 to-neutral-800/40 p-3 rounded-lg border border-neutral-700/50 backdrop-blur-sm">
            <label htmlFor="jobTitle" className="font-semibold text-neutral-200 flex items-center mb-2 text-sm">
              <div className="w-5 h-5 bg-neutral-800 rounded-md flex items-center justify-center mr-2">
                <Zap size={12} className="text-white" />
              </div>
              岗位名称 *
            </label>
            <input
              type="text"
              id="jobTitle"
              disabled={isAiJobRunning}
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="例如: 高级前端工程师, Senior Software Engineer"
              className="h-10 px-3 bg-neutral-900/70 border border-neutral-700/50 rounded-lg focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/40 text-sm text-neutral-100 placeholder:text-neutral-500 shadow-inner transition-all duration-200 hover:border-neutral-600/50"
              required
            />
          </div>

          <Button
            onClick={handleOptimize}
            disabled={storeIsLoading || !companyName || !jobTitle}
            className="optimize-button w-full h-10 bg-linear-to-r from-slate-200 to-slate-100 hover:from-white hover:to-slate-100 text-slate-900 font-semibold mt-auto rounded-lg border border-slate-300/60 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                <span className="text-sm">{t('modals.aiModal.optimizeTab.optimizingButton')}</span>
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" />
                <span className="text-sm">{t('modals.aiModal.optimizeTab.optimizeButton')}</span>
              </>
            )}
          </Button>
        </div>

        {/* 右侧输出区域 */}
        <div className="lg:col-span-3 bg-linear-to-br from-neutral-900/70 to-neutral-800/40 rounded-lg border border-neutral-700/50 backdrop-blur-sm flex flex-col h-[62vh] shadow-xl">
          <div className="p-4 border-b border-neutral-700/50 flex items-center justify-between bg-linear-to-r from-neutral-900/60 to-neutral-800/40 rounded-t-lg">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-neutral-800 rounded-lg flex items-center justify-center mr-3">
                <CheckCircle size={16} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-neutral-100">
                  {t('modals.aiModal.optimizeTab.outputTitle')}
                </h3>
                {optimizedResume && (
                  <p className="text-xs text-neutral-400 mt-0.5">
                    {t('modals.aiModal.optimizeTab.optimizedCount', { count: Object.keys(optimizedResume.sections || {}).length })}
                  </p>
                )}
              </div>
            </div>
            {optimizedResume && (
              <div className="flex items-center gap-1 bg-neutral-900/70 p-1 rounded-lg border border-neutral-600/40 backdrop-blur-sm shadow-lg">
                <Button
                  size="sm"
                  onClick={() => setViewMode('json')}
                  className={`px-3 py-2 h-auto text-xs font-medium rounded-md transition-all duration-200 ${viewMode === 'json'
                    ? 'bg-linear-to-r from-slate-200 to-slate-100 text-slate-900'
                    : 'bg-transparent text-neutral-400 hover:bg-neutral-800/60 hover:text-neutral-200'
                    }`}
                >
                  <Code size={14} className="mr-1" />{t('modals.aiModal.optimizeTab.jsonButton')}
                </Button>
                <Button
                  size="sm"
                  onClick={() => setViewMode('diff')}
                  className={`px-3 py-2 h-auto text-xs font-medium rounded-md transition-all duration-200 ${viewMode === 'diff'
                    ? 'bg-linear-to-r from-slate-200 to-slate-100 text-slate-900'
                    : 'bg-transparent text-neutral-400 hover:bg-neutral-800/60 hover:text-neutral-200'
                    }`}
                >
                  <Zap size={14} className="mr-1" />{t('modals.aiModal.optimizeTab.diffButton', 'Diff')}
                </Button>
                <Button
                  size="sm"
                  onClick={() => setViewMode('preview')}
                  className={`px-3 py-2 h-auto text-xs font-medium rounded-md transition-all duration-200 ${viewMode === 'preview'
                    ? 'bg-linear-to-r from-slate-200 to-slate-100 text-slate-900'
                    : 'bg-transparent text-neutral-400 hover:bg-neutral-800/60 hover:text-neutral-200'
                    }`}
                >
                  <Eye size={14} className="mr-1" />{t('modals.aiModal.optimizeTab.previewButton')}
                </Button>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto flex flex-col bg-neutral-900/30 backdrop-blur-sm relative">
            {/* Main Content Area */}
            {isLoading && !isMinimized && (
              <div className="flex-1 flex flex-col items-center justify-center text-neutral-500 text-center p-6">
                <Brain size={48} className="mb-4 text-sky-500/40" />
                <p className="max-w-xs">{t('modals.aiModal.optimizeTab.optimizingButton')}...</p>
              </div>
            )}

            {isLoading && isMinimized && (
              <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6">
                <div className="relative">
                  <motion.div 
                    className="absolute inset-0 bg-sky-500/10 blur-3xl rounded-full"
                    animate={{ scale: [1, 1.2, 1], opacity: [0.2, 0.4, 0.2] }}
                    transition={{ duration: 6, repeat: Infinity }}
                  />
                  <div className="relative w-24 h-24 bg-neutral-900/60 rounded-2xl border border-neutral-700/60 flex items-center justify-center">
                    <Brain size={48} className="text-sky-400" />
                  </div>
                </div>
                <div className="space-y-2">
                  <h4 className="text-lg font-bold text-white tracking-tight">{t('modals.aiModal.optimizeTab.neuralEngine.progress.title')}</h4>
                  <p className="text-sm text-neutral-400 max-w-[280px]">{t('modals.aiModal.optimizeTab.neuralEngine.progress.description')}</p>
                </div>
                <Button
                  onClick={() => setIsMinimized(false)}
                  className="bg-slate-200 hover:bg-slate-100 text-slate-900 font-bold px-8 rounded-xl h-12 border border-slate-300/60 transition-all"
                >
                  <Eye className="mr-2 h-5 w-5" />
                  {t('modals.aiModal.optimizeTab.neuralEngine.progress.showButton')}
                </Button>
              </div>
            )}

            {!isLoading && !optimizedResume && (
              <div className="flex-1 flex flex-col items-center justify-center text-neutral-500 text-center p-6 space-y-4">
                <div className="w-20 h-20 bg-neutral-900/60 rounded-2xl flex items-center justify-center border border-neutral-700/60">
                  <Zap size={40} className="text-sky-500/50" />
                </div>
                <p className="max-w-xs text-sm leading-relaxed text-neutral-400">
                  {t('modals.aiModal.optimizeTab.emptyState')}
                </p>
              </div>
            )}

            {!isLoading && optimizedResume && (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-6 custom-scrollbar">
                  {viewMode === 'preview' && (
                    <div className="p-3 bg-white/95 h-full w-full flex justify-center overflow-y-auto rounded-lg">
                      <div style={{ transform: 'scale(0.5)', transformOrigin: 'top center', minWidth: '600px' }}>
                        <ResumePreview
                          info={optimizedResume.info}
                          sections={optimizedResume.sections}
                          sectionOrder={optimizedResume.sectionOrder.map(s => s.key)}
                          templateId={templateId}
                        />
                      </div>
                    </div>
                  )}

                  {viewMode === 'json' && (
                    <div className="bg-neutral-900 rounded-xl p-4 border border-neutral-700/50 shadow-xl">
                      <ReactJsonView
                        src={optimizedResume}
                        theme="ocean"
                        collapsed={1}
                        displayDataTypes={false}
                        name={false}
                        displayObjectSize={true}
                        displayArrayKey={true}
                        style={{
                          background: 'transparent',
                          fontSize: '12px',
                          lineHeight: '1.5'
                        }}
                      />
                    </div>
                  )}

                  {viewMode === 'diff' && (
                    <div className="flex-1 h-full min-h-[400px] bg-neutral-900 rounded-xl overflow-hidden border border-neutral-700/50 shadow-xl">
                      <DiffEditor
                        original={JSON.stringify({ sections: resumeData.sections }, null, 2)}
                        modified={JSON.stringify({ sections: optimizedResume.sections }, null, 2)}
                        language="json"
                        theme="vs-dark"
                        options={{
                          readOnly: true,
                          minimap: { enabled: false },
                          fontSize: 12,
                          scrollBeyondLastLine: false,
                          renderSideBySide: true,
                          automaticLayout: true
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {optimizedResume && !isLoading && (
            <div className="p-4 border-t border-neutral-700/50 bg-neutral-900/70 rounded-b-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center text-xs text-neutral-400">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-2"></div>
                  {t('modals.aiModal.optimizeTab.resultsReady')}
                </div>
                <div className="text-xs text-neutral-500">
                  {t('modals.aiModal.optimizeTab.applyHint')}
                </div>
              </div>
              <Button
                onClick={handleApply}
                className="apply-changes-button w-full h-10 bg-linear-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold rounded-lg transition-all duration-200"
              >
                <CheckCircle className="mr-2 h-4 w-4" />
                <span className="text-sm">{t('modals.aiModal.optimizeTab.applyChangesButton')}</span>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Pop-out Thinking Modal Overlay - Portal to Body for true full-screen */}
      {mounted && createPortal(
        <AnimatePresence>
          {isLoading && !isMinimized && (
            <motion.div
              className="fixed inset-0 z-9999 flex items-center justify-center p-4 md:p-8 bg-black/80 backdrop-blur-xl"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="relative w-full max-w-6xl h-full max-h-[90vh] bg-[#0d0d0d] border border-neutral-700/50 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden"
                initial={{ scale: 0.8, opacity: 0, y: 40 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0, y: 40 }}
                transition={{ type: 'spring', damping: 30, stiffness: 200 }}
              >
                <div className="flex items-center justify-end px-8 py-7 border-b border-neutral-800/50 relative z-20 bg-black/40">
                  <div className="flex items-center gap-4">
                    {/* Execution Time Timer */}
                    <div className="bg-neutral-900/80 backdrop-blur-md border border-neutral-800 rounded-full px-5 py-2.5 flex items-center gap-4 shadow-2xl ring-1 ring-white/5">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isLoading ? 'bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.6)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]'}`} />
                        <span className="text-neutral-400 text-[10px] font-bold uppercase tracking-[0.2em]">
                          {t('modals.aiModal.optimizeTab.neuralEngine.console.execution_time', { defaultValue: 'Execution Time' })}
                        </span>
                      </div>
                      <div className="w-px h-3 bg-neutral-800" />
                      <span className="text-white font-mono text-base font-black tabular-nums tracking-tight">
                        {formatTime(elapsedTime)}
                      </span>
                    </div>

                    {/* Top Right Controls */}
                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsMinimized(!isMinimized)}
                        className={`text-neutral-400 hover:text-white hover:bg-neutral-800 ${isMinimized ? 'bg-neutral-800 text-white' : ''} rounded-full px-4 h-9 flex items-center gap-2 border border-neutral-800 transition-all`}
                      >
                        <Minimize2 size={14} />
                        <span className="text-[10px] font-black uppercase tracking-widest">
                          {t('modals.aiModal.optimizeTab.neuralEngine.minimize', { defaultValue: 'MINIMIZE' })}
                        </span>
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-hidden relative">
                  <ProcessGraph logs={logs} isLoading={isLoading} />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  );
}