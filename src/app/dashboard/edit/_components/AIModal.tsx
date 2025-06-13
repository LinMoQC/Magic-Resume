import React, { useState } from 'react';
import { Bot, Sparkles, Wand2, Paperclip, CheckCircle, AlertTriangle, Eye, Code, Loader2, BarChart3, RotateCw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/app/components/ui/dialog";
import { useSettingStore } from '@/store/useSettingStore';
import { createJdAnalysisChain, createItemOptimizationChain, createResumeAnalysisChain, jdAnalysisSchema, itemOptimizationSchema } from '@/lib/aiLab/chains';
import { toast } from 'sonner';
import { Button } from '@/app/components/ui/button';
import { Textarea } from '@/app/components/ui/textarea';
import { AnimatePresence, motion } from 'framer-motion';
import { produce } from 'immer';
import { Resume, Section } from '@/store/useResumeStore';
import ResumePreview from './ResumePreview';
import dynamic from 'next/dynamic';
import { ResumeAnalysis } from '@/lib/types/analysis';
import { StructuredOutputParser } from 'langchain/output_parsers';
import { ResumeAnalysisReport } from '@/app/components/ResumeAnalysisReport';
import { useTranslation } from 'react-i18next';

const ReactJsonView = dynamic(() => import('@microlink/react-json-view'), {
    ssr: false,
});

type AIModalProps = {
  isOpen: boolean;
  onClose: () => void;
  resumeData: Resume;
  onApplyChanges: (newSections: Section) => void;
  templateId: string;
};

const TABS_CONFIG = [
  { key: 'optimize', name: 'modals.aiModal.tabs.optimize', icon: <Wand2 size={18} /> },
  { key: 'analyze', name: 'modals.aiModal.tabs.analyze', icon: <BarChart3 size={18} /> },
];

export default function AIModal({ isOpen, onClose, resumeData, onApplyChanges, templateId }: AIModalProps) {
  const { t } = useTranslation();
  const [activeTabKey, setActiveTabKey] = React.useState(TABS_CONFIG[0].key);

  const { apiKey, baseUrl, model, maxTokens } = useSettingStore();
  const [jd, setJd] = useState('');
  const [optimizedResume, setOptimizedResume] = useState<Resume | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState({ value: 0, text: '' });
  const [isPreview, setIsPreview] = useState(false);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ResumeAnalysis | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState({ value: 0, text: '' });

  const handleOptimize = async () => {
    if (!apiKey) {
      toast.error(t('modals.aiModal.notifications.apiKeyMissing'));
      return;
    }
    if (!jd.trim()) {
      toast.warning(t('modals.aiModal.notifications.jdMissing'));
      return;
    }

    setIsLoading(true);
    setOptimizedResume(null);
    setProgress({ value: 0, text: t('modals.aiModal.optimizeTab.optimizationProgress.analyzingJD') });
    setIsPreview(false);

    try {
      const config = { apiKey, baseUrl, modelName: model, maxTokens };

      const jdAnalysisChain = createJdAnalysisChain(config);
      const jdAnalysisParser = StructuredOutputParser.fromZodSchema(jdAnalysisSchema);
      const jdAnalysis = await jdAnalysisChain.invoke({ 
        jd,
        format_instructions: jdAnalysisParser.getFormatInstructions(),
      });

      const jdContext = `Key Skills: ${jdAnalysis.keySkills.join(', ')}. Responsibilities: ${jdAnalysis.responsibilities.join(', ')}.`;

      const optimizationChain = createItemOptimizationChain(config);
      const optimizationParser = StructuredOutputParser.fromZodSchema(itemOptimizationSchema);

      const sectionsToOptimizeKeys = ['experience', 'projects', 'skills'];
      const itemsToOptimize = sectionsToOptimizeKeys.flatMap(key => 
        (resumeData.sections[key] || []).map(item => ({ ...item, sectionKey: key }))
      );

      let completedCount = 0;
      const totalItems = itemsToOptimize.length;

      setProgress({ value: 5, text: t('modals.aiModal.optimizeTab.optimizationProgress.preparing', { count: totalItems }) });

      const optimizationPromises = itemsToOptimize.map(item => {
        const optimizeSingleItem = async () => {
          const result = await optimizationChain.invoke({
            jd_context: jdContext,
            resume_context: JSON.stringify(resumeData),
            item_to_optimize: JSON.stringify(item),
            format_instructions: optimizationParser.getFormatInstructions(),
          });

          const finalOptimizedSummary = result.optimizedSummary;
          
          completedCount++;
          const progressPercentage = (completedCount / totalItems) * 100;
          setProgress({ value: progressPercentage, text: t('modals.aiModal.optimizeTab.optimizationProgress.optimizingItem', { sectionKey: item.sectionKey, completed: completedCount, total: totalItems }) });

          return { ...item, optimizedSummary: finalOptimizedSummary };
        };
        return optimizeSingleItem();
      });

      const optimizedResults = await Promise.all(optimizationPromises);

      const finalOptimizedResume = produce(resumeData, (draft) => {
        optimizedResults.forEach(result => {
          if (result.optimizedSummary) {
            const section = draft.sections[result.sectionKey as keyof Section];
            if (section) {
              const itemToUpdate = section.find(e => e.id === result.id);
              if (itemToUpdate) {
                itemToUpdate.summary = result.optimizedSummary;
              }
            }
          }
        });
      });
      
      setOptimizedResume(finalOptimizedResume);
      toast.success(t('modals.aiModal.notifications.optimizationComplete'));
      setProgress({ value: 100, text: t('modals.aiModal.optimizeTab.optimizationProgress.done') });
      
    } catch (error) {
      console.error("[AI_MODAL_ERROR]", error);
      const errorMessage = error instanceof Error ? error.message : t('modals.aiModal.notifications.unknownError');
      toast.error(t('modals.aiModal.notifications.optimizationFailed', { error: errorMessage }));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyzeResume = async () => {
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
      
      const result = await analysisChain.invoke({ resume: JSON.stringify(resumeData) }) as ResumeAnalysis;

      timeouts.forEach(clearTimeout);
      setAnalysisProgress({ value: 100, text: t('modals.aiModal.analysisTab.analysisProgress.done') });
      
      await new Promise(resolve => setTimeout(resolve, 500)); 

      setAnalysisResult(result);
      toast.success(t('modals.aiModal.notifications.analysisComplete'));
      setIsAnalyzing(false);
    } catch (error) {
      console.error("[RESUME_ANALYSIS_ERROR]", error);
      const errorMessage = error instanceof Error ? error.message : t('modals.aiModal.notifications.unknownError');
      toast.error(t('modals.aiModal.notifications.analysisFailed', { error: errorMessage }));
      timeouts.forEach(clearTimeout);
      setIsAnalyzing(false);
    }
  };

  const handleApplyChanges = () => {
    if (optimizedResume) {
      onApplyChanges(optimizedResume.sections);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[84vh] bg-neutral-950 border-neutral-800 text-white flex flex-col p-0">
        <DialogHeader className="p-4 pb-4 border-b border-neutral-800">
          <DialogTitle className="flex items-center text-xl">
            <Bot className="mr-3 text-sky-400" size={28}/>
            {t('modals.aiModal.title')}
          </DialogTitle>
          <DialogDescription className="text-neutral-400">
            {t('modals.aiModal.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex border-b border-neutral-800 px-6 gap-4">
            {TABS_CONFIG.map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTabKey(tab.key)}
                className={`flex items-center gap-2 px-1 pb-3 pt-2 text-sm font-medium transition-colors relative -bottom-px ${
                  activeTabKey === tab.key
                    ? 'border-b-2 border-sky-500 text-white'
                    : 'text-neutral-400 hover:text-white'
                }`}
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
                className="px-6 flex flex-col"
              >
                {activeTabKey === 'optimize' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full mt-6">
                    <div className="space-y-4 flex flex-col">
                      <div>
                        <label htmlFor="jd" className="font-semibold text-neutral-300 flex items-center mb-2"><Paperclip size={16} className="mr-2"/>{t('modals.aiModal.optimizeTab.jdLabel')}</label>
                        <Textarea
                          id="jd"
                          disabled={isLoading}
                          value={jd}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setJd(e.target.value)}
                          placeholder={t('modals.aiModal.optimizeTab.jdPlaceholder')}
                          className="h-96 bg-neutral-900 border-neutral-800 rounded-lg focus:ring-sky-500 focus:border-sky-500"
                        />
                      </div>
                      <Button onClick={handleOptimize} disabled={isLoading} className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold mt-auto">
                        {isLoading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : <Wand2 className="mr-2 h-4 w-4" />}
                        {isLoading ? t('modals.aiModal.optimizeTab.optimizingButton') : t('modals.aiModal.optimizeTab.optimizeButton')}
                      </Button>
                    </div>

                    {/* Output Section */}
                    <div className="bg-neutral-900 rounded-lg border border-neutral-800 flex flex-col h-[59vh]">
                       <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-neutral-300 flex items-center">
                            <CheckCircle size={18} className="mr-2 text-green-500"/>{t('modals.aiModal.optimizeTab.outputTitle')}
                          </h3>
                          {optimizedResume && (
                            <div className="flex items-center gap-1 bg-neutral-800 p-1 rounded-md">
                              <Button
                                size="sm"
                                onClick={() => setIsPreview(false)}
                                className={`px-2 py-1 h-auto text-xs ${!isPreview ? 'bg-neutral-700' : 'bg-transparent text-neutral-400 hover:bg-neutral-700/50'}`}
                              >
                                <Code size={14} className="mr-1"/>{t('modals.aiModal.optimizeTab.jsonButton')}
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => setIsPreview(true)}
                                className={`px-2 py-1 h-auto text-xs ${isPreview ? 'bg-neutral-700' : 'bg-transparent text-neutral-400 hover:bg-neutral-700/50'}`}
                              >
                                <Eye size={14} className="mr-1"/>{t('modals.aiModal.optimizeTab.previewButton')}
                              </Button>
                            </div>
                          )}
                       </div>

                      <div className="flex-1 overflow-y-auto flex flex-col">
                        {isLoading && (
                          <div className="flex-1 flex flex-col items-center justify-center text-neutral-500 text-center p-4">
                            <Sparkles size={48} className="animate-pulse text-sky-500" />
                            <p className="mt-4 mb-2">{progress.text || t('modals.aiModal.progressText')}</p>
                            <div className="w-[60%] bg-neutral-700 rounded-full h-2.5">
                              <div className="bg-sky-500 h-2.5 rounded-full" style={{ width: `${progress.value}%` }}></div>
                            </div>
                          </div>
                        )}
                        {!isLoading && !optimizedResume && (
                          <div className="flex-1 flex flex-col items-center justify-center text-neutral-500 text-center p-4">
                            <AlertTriangle size={48} className="mb-4" />
                            <p>{t('modals.aiModal.optimizePlaceholder.description')}</p>
                          </div>
                        )}
                        {optimizedResume && (
                          isPreview ? (
                            <div className="p-2 bg-white h-full w-full flex justify-center overflow-y-auto">
                              <div style={{ transform: 'scale(0.5)', transformOrigin: 'top center' }}>
                                <ResumePreview
                                  info={optimizedResume.info}
                                  sections={optimizedResume.sections}
                                  sectionOrder={optimizedResume.sectionOrder.map(s => s.key)}
                                  templateId={templateId}
                                />
                              </div>
                            </div>
                          ) : (
                            <div className="p-4 max-h-96 overflow-y-auto">
                              <pre className="text-xs whitespace-pre-wrap bg-white p-3 rounded-md">
                                <code>
                                  <ReactJsonView src={optimizedResume} displayDataTypes={false}/>
                                </code>
                              </pre>
                            </div>
                          )
                        )}
                      </div>

                      {optimizedResume && (
                        <div className="p-3 border-t border-neutral-800">
                          <Button onClick={handleApplyChanges} className="w-full bg-green-600 hover:bg-green-700 text-white">
                            {t('modals.aiModal.optimizeTab.applyChangesButton')}
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {activeTabKey === 'analyze' && (
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
                          <Button 
                            onClick={() => setAnalysisResult(null)} 
                            variant="ghost" 
                            className="text-neutral-300 hover:bg-neutral-800 hover:text-white"
                          >
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
                        <Button onClick={handleAnalyzeResume} disabled={isAnalyzing} className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg px-8 py-6">
                          {isAnalyzing ? (
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          ) : <Sparkles className="mr-2 h-5 w-5" />}
                          {isAnalyzing ? t('modals.aiModal.analysisTab.analyzingButton') : t('modals.aiModal.analysisTab.analyzeButton')}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 