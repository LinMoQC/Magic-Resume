import { useEffect } from 'react';
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
    expandedLogId,
    startTime,
    setStartTime,
    setElapsedTime,
  } = useResumeOptimizerStore();

  // Timer Effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading && startTime) {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isLoading, startTime, setElapsedTime]);

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
    return finalState;
  };

  const updateLogs = (chunk: StreamData) => {
    const nodeId = Object.keys(chunk)[0] as string;
    if (!nodeId) return;

    setLogs(prev => {
      const updatedLogs = [...prev];
      const nodeState = chunk[nodeId] as NodeState;

      // Node Title Map
      const nodeTitles: Record<string, string> = {
        resume_analyzer: t('modals.aiModal.optimizeTab.steps.resume_analyzer.title', 'Resume Analysis'),
        resume_web_search: t('modals.aiModal.optimizeTab.steps.resume_web_search.title', 'Resume Market Research'),
        jd_analyzer: t('modals.aiModal.optimizeTab.steps.jd_analyzer.title'),
        jd_web_search: t('modals.aiModal.optimizeTab.steps.jd_web_search.title', 'Job Market Trends'),
        company_interview_search: t('modals.aiModal.optimizeTab.steps.company_interview_search.title', 'Interview Intel Search'),
        company_analysis: t('modals.aiModal.optimizeTab.steps.company_analysis.title', 'Company Deep-Dive'),
        research_combiner: t('modals.aiModal.optimizeTab.steps.research_combiner.title', 'Strategic Synthesis'),
        prepare_rewriter: t('modals.aiModal.optimizeTab.steps.prepare_rewriter.title', 'Strategic Planner'),
        rewrite_sections_parent: t('modals.aiModal.optimizeTab.steps.rewrite_sections_parent.title', 'Optimization Orchestrator'),
        route_next_rewrite: t('modals.aiModal.optimizeTab.steps.route_next_rewrite.title', 'Rewrite Planner'),
        rewrite_section: t('modals.aiModal.optimizeTab.steps.rewrite_section.title', 'Smart Rewriting'),
        combine_sections: t('modals.aiModal.optimizeTab.steps.combine_sections.title', 'Assembling Draft'),
        adversarial_critique: t('modals.aiModal.optimizeTab.steps.adversarial_critique.title', 'Recruiter Critique'),
        strategic_analyzer: t('modals.aiModal.optimizeTab.steps.strategic_analyzer.title', 'Strategic Gap Analysis'),
        final_answer: t('modals.aiModal.optimizeTab.steps.final_answer.title'),
      };

      // V7 Master Flow Reveal Logic
      const v7ResearchNodes = [
        'resume_analyzer', 'resume_web_search',
        'jd_analyzer', 'jd_web_search',
        'company_interview_search', 'company_analysis',
        'research_combiner'
      ];
      
      let logIndex = updatedLogs.findIndex(log => log.id === nodeId);
      
      // Dynamic insertion if not present
      if (logIndex === -1) {
        if (v7ResearchNodes.includes(nodeId)) {
           v7ResearchNodes.forEach(sNodeId => {
             if (updatedLogs.findIndex(l => l.id === sNodeId) === -1 && nodeTitles[sNodeId]) {
               updatedLogs.push({
                 id: sNodeId,
                 title: nodeTitles[sNodeId],
                 status: sNodeId === nodeId ? 'in_progress' : 'pending' 
               });
             }
           });
           logIndex = updatedLogs.findIndex(log => log.id === nodeId);
        } else if (nodeTitles[nodeId]) {
           updatedLogs.push({ id: nodeId, title: nodeTitles[nodeId], status: 'in_progress' });
           logIndex = updatedLogs.length - 1;
        }
      }

      if (logIndex !== -1) {
        const log = updatedLogs[logIndex];
        
        // Handle Error
        if (nodeState && nodeState.error && nodeState.status === 'failed') {
          log.status = 'failed';
          log.content = nodeState.error as string;
          if (nodeState.is_fatal) {
              setIsLoading(false);
              toast.error(t('modals.aiModal.notifications.optimizationFailed', { error: nodeState.error }));
          }
        } else {
          // Handle Micro-Events (Thinking/Searching)
          if (nodeState && (nodeState.status === 'thinking' || nodeState.status === 'searching' || nodeState.status === 'tool_complete')) {
            log.status = 'in_progress';
            if (!log.children) log.children = [];
            
            const microType = nodeState.status;
            const toolName = nodeState.tool || 'llm';
            const microId = `micro_${microType}_${toolName}`;
            const microTitle = t(`modals.aiModal.optimizeTab.steps.microEvents.${microType}`, { tool: toolName });
            
            const existingChild = log.children.find(c => c.id === microId);
            if (!existingChild) {
                // If it's tool_complete, we should probably check if there's a corresponding 'searching' and mark it done
                if (microType === 'tool_complete') {
                    const searchChild = log.children.find(c => c.id === `micro_searching_${toolName}`);
                    if (searchChild) searchChild.status = 'completed';
                }

                log.children.push({
                    id: microId,
                    title: microTitle,
                    status: microType === 'tool_complete' ? 'completed' : 'in_progress',
                    content: nodeState.tool || ''
                });
            } else {
                // Update existing
                existingChild.status = microType === 'tool_complete' ? 'completed' : 'in_progress';
            }
          } else {
            // Node Completion or Substantial Update
            log.status = 'completed';
            
            // Content Mapping
            if (nodeId === 'resume_analyzer') log.content = nodeState.resumeAnalysis;
            if (nodeId === 'resume_web_search') log.content = nodeState.resumeSearchResults;
            if (nodeId === 'jd_analyzer') log.content = nodeState.jdAnalysis;
            if (nodeId === 'jd_web_search') log.content = nodeState.jdSearchResults;
            if (nodeId === 'company_interview_search') log.content = nodeState.interviewSearchResults;
            if (nodeId === 'company_analysis') log.content = nodeState.companyContext;
            if (nodeId === 'research_combiner') log.content = nodeState.combinedResearch;
            if (nodeId === 'strategic_analyzer') log.content = nodeState.analysisReport;
            if (nodeId === 'combine_sections') log.content = nodeState.optimizedResume;
            
            // Special Handling for Orchestrator
            if (nodeId === 'prepare_rewriter') {
              const tasks = (nodeState.rewriteTasks as string[]) || [];
              const rewriteLogs: LogEntry[] = tasks.map((taskKey: string) => ({
                id: `rewrite_${taskKey}`,
                title: t(`sections.${taskKey}`) || taskKey,
                status: 'pending',
              }));
              
              const orchLogIndex = updatedLogs.findIndex(l => l.id === 'rewrite_sections_parent');
              const orchLog: LogEntry = {
                id: 'rewrite_sections_parent',
                title: `${nodeTitles['rewrite_sections_parent']} (0/${tasks.length})`,
                status: 'in_progress',
                isExpanded: true,
                children: rewriteLogs
              };

              if (orchLogIndex === -1) {
                 updatedLogs.push(orchLog);
              } else {
                 updatedLogs[orchLogIndex] = orchLog;
              }
            }

            // Update Orchestrator Progress
            if (nodeId === 'rewrite_section') {
              const parent = updatedLogs.find(l => l.id === 'rewrite_sections_parent');
              if (parent) {
                const done = (nodeState.rewriteTasksDone as number) || 0;
                const total = (nodeState.rewriteTasksTotal as number) || 0;
                parent.title = `${nodeTitles['rewrite_sections_parent']} (${done}/${total})`;
                
                if (parent.children && (nodeState.taskCompleted || nodeState.currentTask)) {
                  const taskKey = (nodeState.taskCompleted || nodeState.currentTask) as string;
                  const child = parent.children.find(c => c.id === `rewrite_${taskKey}`);
                  if (child) {
                    child.status = 'completed';
                    const optimizedSections = nodeState.optimizedSections as Record<string, unknown>;
                    if (optimizedSections?.[taskKey]) {
                      child.content = optimizedSections[taskKey];
                    }
                  }
                }
              }
            }

            // Handle Critique Retries
            if (nodeId === 'adversarial_critique') {
               const count = (nodeState.critique_count as number) || 1;
               log.title = count > 1 ? `${nodeTitles[nodeId]} (Turn ${count})` : nodeTitles[nodeId];
               log.content = nodeState.critiqueResult;
            }
          }
        }
      }

      return updatedLogs;
    });
  };

  const runOptimization = async ({ jd, resumeData, companyName, jobTitle }: { 
    jd: string; 
    resumeData: Resume;
    companyName?: string;
    jobTitle?: string;
  }) => {
    if (!apiKey) {
      toast.error(t('modals.aiModal.notifications.apiKeyMissing'));
      return;
    }

    setIsLoading(true);
    setStartTime(Date.now());
    setElapsedTime(0);
    setOptimizedResume(null);
    setExpandedLogId(null);
    
    // Reset logs with initial preparer
    setLogs(() => [
      { id: 'preparer', title: t('modals.aiModal.optimizeTab.steps.preparer.title'), status: 'in_progress' }
    ]);

    try {
      const config = { apiKey, baseUrl, modelName: model, maxTokens };

      // V7 Integrated Master Graph Call
      const response = await fetch(`${nextUrl}/optimizer-agent/rewrite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          state: {
            jd,
            resume: resumeData,
            companyName,
            jobTitle,
          },
          config,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`Server error: ${response.status}`);
      }

      const finalState = await processStream(response.body.getReader(), {
        jd,
        resume: resumeData,
      });

      if (finalState.optimizedResume) {
        setOptimizedResume(finalState.optimizedResume);
        toast.success(t('modals.aiModal.notifications.optimizationComplete'));
      }
    } catch (error: unknown) {
      console.error("[OPT_ERROR]", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
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
    jd,
    setIsLoading
  };
};