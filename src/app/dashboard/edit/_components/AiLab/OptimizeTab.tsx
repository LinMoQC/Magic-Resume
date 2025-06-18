import React, { useState, useEffect } from 'react';
import { Resume, Section } from '@/store/useResumeStore';
import { useTranslation } from 'react-i18next';
import { Textarea } from '@/app/components/ui/textarea';
import { Button } from '@/app/components/ui/button';
import { Paperclip, Wand2, Loader2, CheckCircle, Eye, Code } from 'lucide-react';
import { LogItem } from './LogItem';
import dynamic from 'next/dynamic';
import { useResumeOptimizer } from '@/app/hooks/useResumeOptimizer';
import ResumePreview from '../ResumePreview';

const ReactJsonView = dynamic(() => import('@microlink/react-json-view'), { ssr: false });

type OptimizeTabProps = {
  resumeData: Resume;
  onApplyChanges: (newSections: Section) => void;
  templateId: string;
  isAiJobRunning: boolean;
  setIsAiJobRunning: (isRunning: boolean) => void;
};

export default function OptimizeTab({ resumeData, onApplyChanges, templateId, isAiJobRunning, setIsAiJobRunning }: OptimizeTabProps) {
  const { t } = useTranslation();
  const [isPreview, setIsPreview] = useState(false);
  
  const {
    isLoading,
    logs,
    optimizedResume,
    expandedLogId,
    runOptimization,
    toggleExpand,
    setExpandedLogId,
    setJd,
    jd
  } = useResumeOptimizer();

  useEffect(() => {
    setIsAiJobRunning(isLoading);
  }, [isLoading, setIsAiJobRunning]);

  const handleOptimize = () => {
    setIsPreview(false);
    runOptimization({ jd, resumeData });
  };
  
  const handleApply = () => {
    if (optimizedResume) {
      onApplyChanges(optimizedResume.sections);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full mt-6">
      <div className="space-y-4 flex flex-col">
        <div>
          <label htmlFor="jd" className="font-semibold text-neutral-300 flex items-center mb-2"><Paperclip size={16} className="mr-2"/>{t('modals.aiModal.optimizeTab.jdLabel')}</label>
          <Textarea
            id="jd"
            disabled={isAiJobRunning}
            value={jd}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setJd(e.target.value)}
            placeholder={t('modals.aiModal.optimizeTab.jdPlaceholder')}
            className="h-96 bg-neutral-900 border-neutral-800 rounded-lg focus:ring-sky-500 focus:border-sky-500 resize-none"
          />
        </div>
        <Button onClick={handleOptimize} disabled={isAiJobRunning} className="w-full bg-sky-500 hover:bg-sky-600 text-white font-bold mt-auto">
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : <Wand2 className="mr-2 h-4 w-4" />}
          {isLoading ? t('modals.aiModal.optimizeTab.optimizingButton') : t('modals.aiModal.optimizeTab.optimizeButton')}
        </Button>
      </div>

      <div className="bg-neutral-900 rounded-lg border border-neutral-800 flex flex-col h-[59vh]">
         <div className="p-4 border-b border-neutral-800 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-neutral-300 flex items-center">
              <CheckCircle size={18} className="mr-2 text-green-500"/>{t('modals.aiModal.optimizeTab.outputTitle')}
            </h3>
            {optimizedResume && (
              <div className="flex items-center gap-1 bg-neutral-800 p-1 rounded-md">
                <Button size="sm" onClick={() => setIsPreview(false)} className={`px-2 py-1 h-auto text-xs ${!isPreview ? 'bg-neutral-700' : 'bg-transparent text-neutral-400 hover:bg-neutral-700/50'}`}>
                  <Code size={14} className="mr-1"/>{t('modals.aiModal.optimizeTab.jsonButton')}
                </Button>
                <Button size="sm" onClick={() => setIsPreview(true)} className={`px-2 py-1 h-auto text-xs ${isPreview ? 'bg-neutral-700' : 'bg-transparent text-neutral-400 hover:bg-neutral-700/50'}`}>
                  <Eye size={14} className="mr-1"/>{t('modals.aiModal.optimizeTab.previewButton')}
                </Button>
              </div>
            )}
         </div>

        <div className="flex-1 overflow-y-auto flex flex-col">
          {isLoading ? (
            <div className="flex-1 flex flex-col items-center justify-center p-10">
              <div className="w-full max-w-md">
                {logs.map((log, index) => (
                  <LogItem
                    key={log.id}
                    log={log}
                    isLast={index === logs.length - 1}
                    onToggleExpand={toggleExpand}
                    expandedLogId={expandedLogId}
                    onToggleContentExpand={(id) => setExpandedLogId(expandedLogId === id ? null : id)}
                  />
                ))}
              </div>
            </div>
          ) : !isLoading && !optimizedResume ? (
            <div className="flex-1 flex flex-col items-center justify-center text-neutral-500 text-center p-4">
              <Wand2 size={48} className="mb-4 text-neutral-600" />
              <h3 className="text-lg font-semibold text-neutral-300">{t('modals.aiModal.optimizePlaceholder.title')}</h3>
              <p className="max-w-xs">{t('modals.aiModal.optimizePlaceholder.description')}</p>
            </div>
          ) : (
            optimizedResume && (
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
                <div className="p-4 rounded-md bg-black h-full overflow-y-auto">
                  <ReactJsonView
                    src={optimizedResume}
                    theme="ocean"
                    displayDataTypes={false}
                    name={false}
                    style={{ background: 'transparent' }}
                  />
              </div>
              )
            )
          )}
        </div>

        {optimizedResume && !isLoading && (
          <div className="p-3 border-t border-neutral-800">
            <Button onClick={handleApply} className="w-full bg-green-600 hover:bg-green-700 text-white">
              {t('modals.aiModal.optimizeTab.applyChangesButton')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}