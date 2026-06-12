import { create } from 'zustand';
import { Resume } from '@/types/frontend/resume';

export interface LogEntry {
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  content?: unknown;
  children?: LogEntry[];
  isExpanded?: boolean;
}

export interface NodeState {
  analysisReport?: unknown;
  jdAnalysis?: unknown;
  queries?: string[];
  summaries?: string[];
  analysisTasks?: string[];
  currentAnalysisTask?: string;
  parallelAnalysisResults?: Record<string, unknown>;
  rewriteTasks?: string[];
  rewriteTasksTotal?: number;
  rewriteTasksDone?: number;
  currentTask?: string;
  taskCompleted?: string;
  critique_count?: number;
  critiqueResult?: unknown;
  optimizedSections?: Record<string, unknown>;
  optimizedResume?: Resume;
  [key: string]: unknown;
}

export type StreamData = Record<string, NodeState>;

interface ResumeOptimizerState {
  isLoading: boolean;
  logs: LogEntry[];
  optimizedResume: Resume | null;
  expandedLogId: string | null;
  jd: string;
  startTime: number | null;
  elapsedTime: number;
  setIsLoading: (isLoading: boolean) => void;
  setLogs: (updater: (prev: LogEntry[]) => LogEntry[]) => void;
  setOptimizedResume: (resume: Resume | null) => void;
  setExpandedLogId: (logId: string | null) => void;
  setStartTime: (time: number | null) => void;
  setElapsedTime: (time: number) => void;
  setJd: (jd: string) => void;
  toggleExpand: (logId: string) => void;
  resetOptimizer: () => void;
}

export const useResumeOptimizerStore = create<ResumeOptimizerState>((set) => ({
  isLoading: false,
  logs: [],
  optimizedResume: null,
  expandedLogId: null,
  jd: '',
  startTime: null,
  elapsedTime: 0,
  setIsLoading: (isLoading) => set({ isLoading }),
  setLogs: (updater) => set(state => ({ logs: updater(state.logs) })),
  setOptimizedResume: (optimizedResume) => set({ optimizedResume }),
  setExpandedLogId: (expandedLogId) => set({ expandedLogId }),
  setStartTime: (startTime) => set({ startTime }),
  setElapsedTime: (elapsedTime) => set({ elapsedTime }),
  setJd: (jd) => set({ jd }),
  toggleExpand: (logId) => {
    set(state => ({
      logs: state.logs.map(log =>
        log.id === logId ? { ...log, isExpanded: !log.isExpanded } : log
      )
    }));
  },
  resetOptimizer: () => {
    set({
      isLoading: false,
      logs: [],
      optimizedResume: null,
      expandedLogId: null,
      startTime: null,
      elapsedTime: 0,
    });
  },
}));
