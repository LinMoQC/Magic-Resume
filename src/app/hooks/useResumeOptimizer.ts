/* eslint-disable @typescript-eslint/no-explicit-any */
import { useSettingStore } from '@/store/useSettingStore';
import { Resume } from '@/store/useResumeStore';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useResumeOptimizerStore, LogEntry, StreamData } from '@/store/useResumeOptimizerStore';

export const useResumeOptimizer = () => {
  const { t } = useTranslation();
  const { apiKey, baseUrl, model, maxTokens } = useSettingStore();
  const {
    isLoading,
    logs,
    optimizedResume,
    setLogs,
    setIsLoading,
    setOptimizedResume,
    toggleExpand,
    setExpandedLogId,
    setJd,
    jd,
    expandedLogId
  } = useResumeOptimizerStore();

  const runOptimization = async ({ jd, resumeData }: { jd: string; resumeData: Resume; }) => {
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
    setExpandedLogId(null);
    
    const initialLogs: LogEntry[] = [
      { id: 'preparer', title: t('modals.aiModal.optimizeTab.steps.preparer.title'), status: 'in_progress' },
      { id: 'jd_analyzer', title: t('modals.aiModal.optimizeTab.steps.jd_analyzer.title'), status: 'pending' },
      { id: 'prepare_research', title: t('modals.aiModal.optimizeTab.steps.prepare_research.title'), status: 'pending' },
      { id: 'query_writer', title: t('modals.aiModal.optimizeTab.steps.query_writer.title'), status: 'pending' },
      { id: 'web_searcher', title: t('modals.aiModal.optimizeTab.steps.web_searcher.title'), status: 'pending', isExpanded: true, children: [] },
      { id: 'reflection', title: t('modals.aiModal.optimizeTab.steps.reflection.title'), status: 'pending' },
      { id: 'final_answer', title: t('modals.aiModal.optimizeTab.steps.final_answer.title'), status: 'pending' },
      { id: 'prepare_analyzer', title: t('modals.aiModal.optimizeTab.steps.parallel_analyzer.title'), status: 'pending' },
      { id: 'combiner', title: t('modals.aiModal.optimizeTab.steps.combiner.title'), status: 'pending' },
      { id: 'prepare_rewriter', title: t('modals.aiModal.optimizeTab.steps.prepare_rewriter.title'), status: 'pending' },
    ];
    setLogs(() => initialLogs);

    try {
      let finalResume: Resume | null = null;
      const config = { apiKey, baseUrl, modelName: model, maxTokens };

      const response = await fetch('/api/graph-optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jd,
          resumeData,
          config,
        }),
      });

      if (!response.body) {
        throw new Error("Response body is null");
      }
      const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const lines = value.split('\\n\\n').filter(line => line.startsWith('data: '));
        for (const line of lines) {
          const jsonString = line.substring('data: '.length);
          let chunk: StreamData;
          try{
            const parsed = JSON.parse(jsonString);
            if(typeof parsed === 'object' && parsed !== null) {
              chunk = parsed as StreamData;
            } else {
              console.log('Parsed JSON is not an object:', parsed);
              continue;
            }
          }catch{
            console.log('error', jsonString)
            continue;
          }
          const nodeId = Object.keys(chunk)[0] as string;
          if (nodeId) {
            setLogs(prev => {
              const updatedLogs = [...prev];
              const nodeState = chunk[nodeId];

              const staticLogIndex = updatedLogs.findIndex(log => log.id === nodeId);
              if (staticLogIndex !== -1) {
                updatedLogs[staticLogIndex].status = 'completed';
                if (nodeId === 'combiner' || nodeId === 'jd_analyzer' || nodeId === 'final_answer') {
                  updatedLogs[staticLogIndex].content =
  (nodeState.analysisReport as unknown as any)?.webSearchResults ??
  nodeState.analysisReport ??
  nodeState.jdAnalysis;
                }
                if (nodeId === 'query_writer' || nodeId === 'reflection') {
                  updatedLogs[staticLogIndex].content = nodeState;
                }

                if (staticLogIndex + 1 < updatedLogs.length) {
                  const nextLog = updatedLogs[staticLogIndex + 1];
                  if (nextLog && nextLog.status === 'pending') nextLog.status = 'in_progress';
                }
              }

              if (nodeId === 'web_searcher') {
                const parentLog = updatedLogs.find(l => l.id === 'web_searcher');
                if (parentLog && nodeState.queries) {
                  // Create children for new queries
                  const newQueryLogs: LogEntry[] = nodeState.queries.map((q: string, i: number) => ({
                    id: `query_${parentLog.children?.length || 0 + i}`,
                    title: q,
                    status: 'in_progress'
                  }));
                  parentLog.children = [...(parentLog.children || []), ...newQueryLogs];
                }

                if (parentLog && nodeState.summaries && nodeState.summaries.length > 0) {
                  const summaries = nodeState.summaries;
                  // Mark completed queries and update content
                  parentLog.children?.forEach(child => {
                    if (child.status === 'in_progress') {
                      child.status = 'completed';
                      // This is a simplification. A more robust solution might map summaries to queries.
                      child.content = summaries.slice(-1)[0];
                    }
                  });
                }
              }

              if (nodeId === 'prepare_analyzer') {
                const tasks = nodeState.analysisTasks || [];
                const analysisLogs: LogEntry[] = tasks.map((taskKey: string) => ({
                  id: `analyze_${taskKey}`,
                  title: t(`report.categories.${taskKey}`, taskKey),
                  status: 'pending',
                }));

                const analysisParentLog: LogEntry = {
                  id: 'analysis_parent',
                  title: t('modals.aiModal.optimizeTab.steps.parallel_analyzer.title'),
                  status: 'in_progress',
                  isExpanded: true,
                  children: analysisLogs,
                };

                // Replace prepare_analyzer with the parent log
                const prepareIndex = updatedLogs.findIndex(l => l.id === 'prepare_analyzer');
                if (prepareIndex !== -1) {
                  updatedLogs.splice(prepareIndex, 1, analysisParentLog);
                  // Also mark the first child as in_progress
                  if (analysisParentLog.children && analysisParentLog.children.length > 0) {
                    analysisParentLog.children[0].status = 'in_progress';
                  }
                }
              }

              if (nodeId === 'route_next_analysis') {
                const currentTask = nodeState.currentAnalysisTask;
                const parentLog = updatedLogs.find(l => l.id === 'analysis_parent');
                if (parentLog?.children && currentTask) {
                  const taskLog = parentLog.children.find(log => log.id === `analyze_${currentTask}`);
                  if (taskLog) taskLog.status = 'in_progress';
                }
              }

              if (nodeId === 'analyze_category') {
                const parentLog = updatedLogs.find(l => l.id === 'analysis_parent');
                if (parentLog && parentLog.children && nodeState.parallelAnalysisResults) {
                  const completedTaskKey = Object.keys(nodeState.parallelAnalysisResults).find(key => {
                    const child = parentLog.children?.find(c => c.id === `analyze_${key}`);
                    return child && child.status !== 'completed';
                  });

                  if (completedTaskKey) {
                    const taskLogIndex = parentLog.children.findIndex(log => log.id === `analyze_${completedTaskKey}`);
                    if (taskLogIndex !== -1) {
                      parentLog.children[taskLogIndex].status = 'completed';
                      parentLog.children[taskLogIndex].content = nodeState.parallelAnalysisResults[completedTaskKey];

                      // Mark next task as in_progress
                      if (taskLogIndex + 1 < parentLog.children.length) {
                        parentLog.children[taskLogIndex + 1].status = 'in_progress';
                      }
                    }
                  }

                  if (parentLog.children.every(c => c.status === 'completed')) {
                    parentLog.status = 'completed';
                  }
                }
              }

              if (nodeId === 'prepare_rewriter') {
                const tasks = nodeState.rewriteTasks || [];
                const sectionLogs: LogEntry[] = tasks.map((taskKey: string) => ({
                  id: `rewrite_${taskKey}`,
                  title: t(`sections.${taskKey}`) || taskKey,
                  status: 'pending',
                }));

                const rewriteParentLog: LogEntry = {
                  id: 'rewrite_sections_parent',
                  title: t('modals.aiModal.optimizeTab.steps.rewrite_section.title'),
                  status: 'in_progress',
                  isExpanded: true,
                  children: sectionLogs
                };
                updatedLogs.splice(staticLogIndex + 1, 0, rewriteParentLog);
              }

              if (nodeId === 'rewrite_section') {
                const completedTask = nodeState.taskCompleted;
                const parentLog = updatedLogs.find(l => l.id === 'rewrite_sections_parent');
                if (parentLog?.children && completedTask && nodeState.optimizedSections) {
                  const taskLog = parentLog.children.find(log => log.id === `rewrite_${completedTask}`);
                  if (taskLog) {
                    taskLog.status = 'completed';
                    taskLog.content = nodeState.optimizedSections[completedTask];
                  }
                  if (parentLog.children.every(c => c.status === 'completed')) {
                    parentLog.status = 'completed';
                  }
                }
              }

              if (nodeId === 'combine_sections') {
                if (nodeState.optimizedResume) {
                  finalResume = nodeState.optimizedResume;
                  setOptimizedResume(nodeState.optimizedResume);
                }
              }
              return updatedLogs;
            });
          }
        }
      }

      if (!finalResume) {
        throw new Error("Optimization failed to return a valid result from the stream.");
      }

      toast.success(t('modals.aiModal.notifications.optimizationComplete'));
    } catch (error) {
      console.error("[AI_MODAL_ERROR]", error);
      const errorMessage = error instanceof Error ? error.message : t('modals.aiModal.notifications.unknownError');
      toast.error(t('modals.aiModal.notifications.optimizationFailed', { error: errorMessage }));
      setLogs(() => []);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    logs,
    optimizedResume,
    runOptimization,
    toggleExpand,
    setExpandedLogId,
    expandedLogId,
    setJd,
    jd
  };
};