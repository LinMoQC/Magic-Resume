import React, { useState } from 'react';
import { Bot, Sparkles, Wand2, Paperclip, CheckCircle, AlertTriangle, Eye, Code, Loader2, BarChart3, RotateCw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useSettingStore } from '@/store/useSettingStore';
import { createJdAnalysisChain, createItemOptimizationChain, createResumeAnalysisChain, jdAnalysisSchema, itemOptimizationSchema } from '@/lib/aiLab/chains';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AnimatePresence, motion } from 'framer-motion';
import { produce } from 'immer';
import { Resume, Section } from '@/store/useResumeStore';
import ResumePreview from './ResumePreview';
import ReactJsonView from '@microlink/react-json-view';
import { ResumeAnalysis } from '@/lib/types/analysis';
import { ResumeAnalysisReport } from '@/components/ui/ResumeAnalysisReport';
import { StructuredOutputParser } from 'langchain/output_parsers';

type AIModalProps = {
  isOpen: boolean;
  onClose: () => void;
  resumeData: Resume;
  onApplyChanges: (newSections: Section) => void;
};

const TABS = [
  { name: '智能优化', icon: <Wand2 size={18} /> },
  { name: '简历分析', icon: <BarChart3 size={18} /> },
];

export default function AIModal({ isOpen, onClose, resumeData, onApplyChanges }: AIModalProps) {
  const [activeTab, setActiveTab] = React.useState(TABS[0].name);

  const { apiKey, baseUrl, model, maxTokens } = useSettingStore();
  const [jd, setJd] = useState('');
  const [optimizedResume, setOptimizedResume] = useState<Resume | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState({ value: 0, text: '' });
  const [isPreview, setIsPreview] = useState(false);

  // States for Resume Analysis
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ResumeAnalysis | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState({ value: 0, text: '' });

  const handleOptimize = async () => {
    if (!apiKey) {
      toast.error('API Key not found. Please set it in the settings page.');
      return;
    }
    if (!jd.trim()) {
      toast.warning('Please provide the Job Description.');
      return;
    }

    // 初始化状态：重置UI，显示加载动画，清空上次的优化结果，准备开始新的优化流程
    setIsLoading(true);
    setOptimizedResume(null);
    setProgress({ value: 0, text: 'Analyzing Job Description...' });
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

      // 定义需要优化的模块的key
      const sectionsToOptimizeKeys = ['experience', 'projects', 'skills'];
      // 从简历数据中筛选出这些模块的条目，并为每个条目附加其所属的模块key
      const itemsToOptimize = sectionsToOptimizeKeys.flatMap(key => 
        (resumeData.sections[key] || []).map(item => ({ ...item, sectionKey: key }))
      );

      let completedCount = 0;
      const totalItems = itemsToOptimize.length;

      setProgress({ value: 5, text: `Preparing to optimize ${totalItems} items...` });

      const optimizationPromises = itemsToOptimize.map(item => {
        const optimizeSingleItem = async () => {
          const result = await optimizationChain.invoke({
            jd_context: jdContext,
            resume_context: JSON.stringify(resumeData),
            item_to_optimize: JSON.stringify(item),
            format_instructions: optimizationParser.getFormatInstructions(),
          });

          // The output from this chain is now the full structured object, not a stream
          const finalOptimizedSummary = result.optimizedSummary;
          
          completedCount++;
          const progressPercentage = (completedCount / totalItems) * 100;
          setProgress({ value: progressPercentage, text: `Optimized ${item.sectionKey} item ${completedCount} of ${totalItems}...` });

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
      toast.success("AI optimization complete!");
      setProgress({ value: 100, text: 'Done!' });
      
    } catch (error) {
      console.error("[AI_MODAL_ERROR]", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast.error(`Optimization failed: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyzeResume = async () => {
    if (!apiKey) {
      toast.error('API Key not found. Please set it in the settings page.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult(null);
    setAnalysisProgress({ value: 0, text: '正在启动分析引擎...' });

    const analysisSteps = [
      { value: 15, text: '评估简历的「影响与行动力」...' },
      { value: 35, text: '检查「量化成就」的使用情况...' },
      { value: 55, text: '分析「清晰与可读性」...' },
      { value: 75, text: '审核「完整性与结构」...' },
      { value: 90, text: '评估「专业概述」质量...' },
      { value: 95, text: '综合评分并生成报告...' },
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
      setAnalysisProgress({ value: 100, text: '分析完成！' });
      
      await new Promise(resolve => setTimeout(resolve, 500)); 

      setAnalysisResult(result);
      toast.success("分析报告已生成!");
      setIsAnalyzing(false);
    } catch (error) {
      console.error("[RESUME_ANALYSIS_ERROR]", error);
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
      toast.error(`分析失败: ${errorMessage}`);
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
            AI Lab
          </DialogTitle>
          <DialogDescription className="text-neutral-400">
            分析并优化您的简历，以匹配目标岗位要求，或获取专业的Lighthouse风格分析报告。
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex border-b border-neutral-800 px-6 gap-4">
            {TABS.map(tab => (
              <button
                key={tab.name}
                onClick={() => setActiveTab(tab.name)}
                className={`flex items-center gap-2 px-1 pb-3 pt-2 text-sm font-medium transition-colors relative -bottom-px ${
                  activeTab === tab.name
                    ? 'border-b-2 border-sky-500 text-white'
                    : 'text-neutral-400 hover:text-white'
                }`}
              >
                {tab.icon}
                {tab.name}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 0 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
                className="px-6 flex flex-col"
              >
                {activeTab === '智能优化' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full mt-6">
                    <div className="space-y-4 flex flex-col">
                      <div>
                        <label htmlFor="jd" className="font-semibold text-neutral-300 flex items-center mb-2"><Paperclip size={16} className="mr-2"/> 目标岗位描述 (JD)</label>
                        <Textarea
                          id="jd"
                          disabled={isLoading}
                          value={jd}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setJd(e.target.value)}
                          placeholder="在此处粘贴目标岗位的JD，AI将根据JD优化您的简历..."
                          className="h-96 bg-neutral-900 border-neutral-800 rounded-lg focus:ring-sky-500 focus:border-sky-500"
                        />
                      </div>
                      <Button onClick={handleOptimize} disabled={isLoading} className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold mt-auto">
                        {isLoading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : <Wand2 className="mr-2 h-4 w-4" />}
                        {isLoading ? '正在优化...' : '开始智能优化'}
                      </Button>
                    </div>

                    {/* Output Section */}
                    <div className="bg-neutral-900 rounded-lg border border-neutral-800 flex flex-col h-[59vh]">
                       <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
                          <h3 className="text-lg font-semibold text-neutral-300 flex items-center">
                            <CheckCircle size={18} className="mr-2 text-green-500"/> 优化建议
                          </h3>
                          {optimizedResume && (
                            <div className="flex items-center gap-1 bg-neutral-800 p-1 rounded-md">
                              <Button
                                size="sm"
                                onClick={() => setIsPreview(false)}
                                className={`px-2 py-1 h-auto text-xs ${!isPreview ? 'bg-neutral-700' : 'bg-transparent text-neutral-400 hover:bg-neutral-700/50'}`}
                              >
                                <Code size={14} className="mr-1"/> JSON
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => setIsPreview(true)}
                                className={`px-2 py-1 h-auto text-xs ${isPreview ? 'bg-neutral-700' : 'bg-transparent text-neutral-400 hover:bg-neutral-700/50'}`}
                              >
                                <Eye size={14} className="mr-1"/> 预览
                              </Button>
                            </div>
                          )}
                       </div>

                      <div className="flex-1 overflow-y-auto flex flex-col">
                        {isLoading && (
                          <div className="flex-1 flex flex-col items-center justify-center text-neutral-500 text-center p-4">
                            <Sparkles size={48} className="animate-pulse text-sky-500" />
                            <p className="mt-4 mb-2">{progress.text || 'AI正在全力分析和创作中...'}</p>
                            <div className="w-[60%] bg-neutral-700 rounded-full h-2.5">
                              <div className="bg-sky-500 h-2.5 rounded-full" style={{ width: `${progress.value}%` }}></div>
                            </div>
                          </div>
                        )}
                        {!isLoading && !optimizedResume && (
                          <div className="flex-1 flex flex-col items-center justify-center text-neutral-500 text-center p-4">
                            <AlertTriangle size={48} className="mb-4" />
                            <p>请在左侧粘贴JD，然后点击&quot;开始智能优化&quot;</p>
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
                            应用优化建议
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                {activeTab === '简历分析' && (
                  <div>
                    {isAnalyzing ? (
                      <div className="flex flex-col items-center justify-center h-[65vh] text-neutral-500 text-center p-4">
                        <Sparkles size={48} className="animate-pulse text-purple-500" />
                        <p className="mt-4 mb-2 text-white">{analysisProgress.text || 'AI正在全力分析和创作中...'}</p>
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
                            重新分析
                          </Button>
                        </div>
                        <ResumeAnalysisReport analysis={analysisResult} />
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-center h-[65vh] p-4">
                        <div className="p-6 rounded-full bg-purple-500/10 border-2 border-dashed border-purple-500/30 mb-6">
                          <BarChart3 size={48} className="text-purple-300" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">简历健康度分析</h2>
                        <p className="text-neutral-400 max-w-md mb-8">
                          获取一份专业的、类似 Lighthouse 的简历分析报告。AI 将从多个维度评估您的简历，并提供可行的改进建议，助您脱颖而出。
                        </p>
                        <Button onClick={handleAnalyzeResume} disabled={isAnalyzing} className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-lg px-8 py-6">
                          {isAnalyzing ? (
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          ) : <Sparkles className="mr-2 h-5 w-5" />}
                          {isAnalyzing ? '正在分析...' : '开始分析'}
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