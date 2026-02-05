import { useSettingStore } from '@/store/useSettingStore';
import { Resume } from '@/types/frontend/resume';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useResumeOptimizerStore, LogEntry, StreamData, NodeState } from '@/store/useResumeOptimizerStore';
import { GraphState } from '@/lib/aiLab/graphs';

const nextUrl = process.env.NEXT_PUBLIC_IF_USE_BACKEND === 'true' ? '/api' : '/api/node';

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

  const processStream = async (
    reader: ReadableStreamDefaultReader<Uint8Array>,
    initialState: Partial<GraphState>
  ): Promise<Partial<GraphState>> => {
    const finalState: Partial<GraphState> = { ...initialState };
    const decoder = new TextDecoder();
    let buffer = '';

    const processMessage = (message: string) => {
      if (message.startsWith('data: ')) {
        const jsonString = message.substring('data: '.length);
        if (jsonString) {
          try {
            const chunk: StreamData = JSON.parse(jsonString);
            const nodeState = Object.values(chunk)[0] as NodeState;

            if (nodeState) {
              Object.assign(finalState, nodeState);
              updateLogs(chunk);
            }
          } catch (e) {
            console.error("Error parsing stream chunk", e, `Chunk: "${jsonString}"`);
          }
        }
      }
    };

    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        if (buffer) {
          processMessage(buffer);
        }
        break;
      }
      buffer += decoder.decode(value, { stream: true });
      console.log('buffer', buffer)
      const messages = buffer.split('\n\n');

      buffer = messages.pop() || '';
      console.log('messages', messages)
      for (const message of messages) {
        processMessage(message);
      }
    }
    return finalState;
  };

  const updateLogs = (chunk: StreamData) => {
    const nodeId = Object.keys(chunk)[0] as string;
    if (!nodeId) return;

    setLogs(prev => {
      const updatedLogs = [...prev];
      const nodeState = chunk[nodeId] as NodeState;

      const staticLogIndex = updatedLogs.findIndex(log => log.id === nodeId);
      if (staticLogIndex !== -1) {
        updatedLogs[staticLogIndex].status = 'completed';
        if (nodeId === 'combiner' || nodeId === 'jd_analyzer' || nodeId === 'final_answer') {
          if(nodeId === 'final_answer') console.log('final_answer', nodeState)
          if(nodeId === 'combiner') console.log('combiner', nodeState)
          if(nodeId === 'jd_analyzer') console.log('jd_analyzer', nodeState)
          updatedLogs[staticLogIndex].content = nodeState.webSearchResults ?? nodeState.analysisReport ?? nodeState.jdAnalysis;
        }
        if (nodeId === 'query_writer' || nodeId === 'reflection') {
          if(nodeId === 'query_writer') console.log('query_writer', nodeState)
          if(nodeId === 'reflection') console.log('reflection', nodeState)
          updatedLogs[staticLogIndex].content = nodeState;
        }
        if (staticLogIndex + 1 < updatedLogs.length) {
          const nextLog = updatedLogs[staticLogIndex + 1];
          if (nextLog && nextLog.status === 'pending') nextLog.status = 'in_progress';
        }
      }

      if (nodeId === 'company_analysis') {
        const staticLogIndex = updatedLogs.findIndex(log => log.id === 'company_analysis');
        if (staticLogIndex !== -1) {
          updatedLogs[staticLogIndex].status = 'completed';
          updatedLogs[staticLogIndex].content = nodeState.companyContext;
          if (staticLogIndex + 1 < updatedLogs.length) {
            updatedLogs[staticLogIndex + 1].status = 'in_progress';
          }
        }
      }
      
      if (nodeId === 'adversarial_critique') {
        const staticLogIndex = updatedLogs.findIndex(log => log.id === 'adversarial_critique');
        if (staticLogIndex !== -1) {
          updatedLogs[staticLogIndex].status = 'completed';
          updatedLogs[staticLogIndex].content = nodeState.critiqueResult;
        }
      }

      if (nodeId === 'web_searcher') {
        const parentLog = updatedLogs.find(l => l.id === 'web_searcher');
        if (parentLog) {
          if(nodeState.queries) {
            const newQueryLogs: LogEntry[] = nodeState.queries.map((q: string, i: number) => ({
              id: `query_${(parentLog.children?.length || 0) + i}`,
              title: q,
              status: 'in_progress'
            }));
            parentLog.children = [...(parentLog.children || []), ...newQueryLogs];
          }
          if (nodeState.summaries && nodeState.summaries.length > 0) {
            const summaries = nodeState.summaries;
            parentLog.children?.forEach(child => {
              if (child.status === 'in_progress') {
                child.status = 'completed';
                child.content = summaries.slice(-1)[0];
              }
            });
          }
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
        const prepareIndex = updatedLogs.findIndex(l => l.id === 'prepare_analyzer' || l.id === 'final_answer');
        if (prepareIndex !== -1) {
          updatedLogs.splice(prepareIndex + 1, 0, analysisParentLog);
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
        const combinerIndex = updatedLogs.findIndex(l => l.id === 'combiner');
        if (combinerIndex !== -1) {
          updatedLogs.splice(combinerIndex + 1, 1, rewriteParentLog);
        }
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
          const nextTask = parentLog.children.find(c => c.status === 'pending');
          if (nextTask) {
            nextTask.status = 'in_progress';
          } else if (parentLog.children.every(c => c.status === 'completed')) {
            parentLog.status = 'completed';
          }
        }
      }

      return updatedLogs;
    });
  };

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
      { id: 'combiner', title: t('modals.aiModal.optimizeTab.steps.combiner.title'), status: 'pending' },
      
      // New Smart Optimization Steps
      { id: 'company_analysis', title: t('modals.aiModal.optimizeTab.steps.company_analysis.title', 'Company Deep-Dive'), status: 'pending' },
      
      { id: 'prepare_rewriter', title: t('modals.aiModal.optimizeTab.steps.prepare_rewriter.title'), status: 'pending' },
      // Rewrite section logs will be injected here
      
      { id: 'adversarial_critique', title: t('modals.aiModal.optimizeTab.steps.adversarial_critique.title', 'Recruiter Critique'), status: 'pending' },
    ];
    setLogs(() => initialLogs);

    try {
      const config = { apiKey, baseUrl, modelName: model, maxTokens };

      const researchResponse = await fetch(`${nextUrl}/optimizer-agent/research`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jd, resumeData, config }),
      });
      if (!researchResponse.ok || !researchResponse.body) throw new Error("Research stage failed.");
      const researchState = await processStream(researchResponse.body.getReader(), { jd, resume: resumeData });

      const analysisResponse = await fetch(`${nextUrl}/optimizer-agent/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: researchState, config }),
      });
      if (!analysisResponse.ok || !analysisResponse.body) throw new Error("Analysis stage failed.");
      const analysisState = await processStream(analysisResponse.body.getReader(), researchState);

      const rewriteResponse = await fetch(`${nextUrl}/optimizer-agent/rewrite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ state: analysisState, config }),
      });
      if (!rewriteResponse.ok || !rewriteResponse.body) throw new Error("Rewrite stage failed.");
      const finalState = await processStream(rewriteResponse.body.getReader(), analysisState);
      
      if (!finalState.optimizedResume) {
        throw new Error("Optimization failed to return a valid result.");
      }
      
      setOptimizedResume(finalState.optimizedResume);
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