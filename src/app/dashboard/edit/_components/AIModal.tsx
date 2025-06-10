import React, { useEffect, useState } from 'react';
import { Bot, Sparkles, FileText, Briefcase, Wand2, Paperclip, CheckCircle, AlertTriangle, ArrowRight, Eye, Code, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useSettingStore } from '@/store/useSettingStore';
import { createJdAnalysisChain, createItemOptimizationChain, JdAnalysis } from '@/lib/aiLab/chains';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { AnimatePresence, motion } from 'framer-motion';
import { produce, Draft } from 'immer';
import { Resume, Section } from '@/store/useResumeStore';
import ResumePreview from './ResumePreview';
import ReactJsonView from '@microlink/react-json-view';

type AIModalProps = {
  isOpen: boolean;
  onClose: () => void;
  resumeData: Resume;
  onApplyChanges: (newSections: Section) => void;
};

const TABS = [
  { name: '智能优化', icon: <Wand2 size={18} /> },
  { name: '模块润色', icon: <FileText size={18} /> },
  { name: 'JD匹配度分析', icon: <Briefcase size={18} /> },
];

export default function AIModal({ isOpen, onClose, resumeData, onApplyChanges }: AIModalProps) {
  const [activeTab, setActiveTab] = React.useState(TABS[0].name);

  const { apiKey, baseUrl, model, maxTokens } = useSettingStore();
  const [jd, setJd] = useState('');
  const [optimizedResume, setOptimizedResume] = useState<Resume | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState({ value: 0, text: '' });
  const [isPreview, setIsPreview] = useState(false);

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
      const jdAnalysis = (await jdAnalysisChain.invoke({ jd })) as JdAnalysis;
      const jdContext = `Key Skills: ${jdAnalysis.keySkills.join(', ')}. Responsibilities: ${jdAnalysis.responsibilities.join(', ')}.`;

      const optimizationChain = createItemOptimizationChain(config);

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
          const resultStream = await optimizationChain.stream({
            jd_context: jdContext,
            resume_context: JSON.stringify(resumeData),
            item_to_optimize: JSON.stringify(item),
          });

          let finalOptimizedSummary = "";
          for await (const chunk of resultStream) {
            if (chunk.optimizedSummary) {
              finalOptimizedSummary = chunk.optimizedSummary;
            }
          }
          
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
            AI 简历助手
          </DialogTitle>
          <DialogDescription className="text-neutral-400">
            AI将分析您的简历和目标岗位，然后优化您的工作经历描述。
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
                className="px-6 flex flex-col py-6"
              >
                {activeTab === '智能优化' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
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
                            <p>请在左侧粘贴JD，然后点击"开始智能优化"</p>
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
                              <pre className="text-xs whitespace-pre-wrap bg-neutral-800 p-3 rounded-md">
                                <code>
                                  <ReactJsonView src={optimizedResume} />
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
                {activeTab === '模块润色' && (
                  <div className="flex flex-col items-center justify-center h-96 text-neutral-500">
                    <FileText size={48} className="mb-4" />
                    <p>该功能正在开发中，敬请期待！</p>
                  </div>
                )}
                {activeTab === 'JD匹配度分析' && (
                  <div className="flex flex-col items-center justify-center h-96 text-neutral-500">
                    <Briefcase size={48} className="mb-4" />
                    <p>该功能正在开发中，敬请期待！</p>
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