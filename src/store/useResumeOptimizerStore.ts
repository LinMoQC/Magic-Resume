import { create } from 'zustand';
import { Resume } from '@/types/frontend/resume';

export interface LogEntry {
    id: string;
    title: string;
    status: 'pending' | 'in_progress' | 'completed';
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
  taskCompleted?: string;
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
  setIsLoading: (isLoading: boolean) => void;
  setLogs: (updater: (prev: LogEntry[]) => LogEntry[]) => void;
  setOptimizedResume: (resume: Resume | null) => void;
  setExpandedLogId: (logId: string | null) => void;
  toggleExpand: (logId: string) => void;
  resetOptimizer: () => void;
  jd: string;
  setJd: (jd: string) => void;
}

export const useResumeOptimizerStore = create<ResumeOptimizerState>((set) => ({
  isLoading: false,
  logs: [],
  optimizedResume: null,
  expandedLogId: null,
  jd: '',
  setIsLoading: (isLoading) => set({ isLoading }),
  setLogs: (updater) => set(state => ({ logs: updater(state.logs) })),
  setOptimizedResume: (optimizedResume) => set({ optimizedResume }),
  setExpandedLogId: (expandedLogId) => set({ expandedLogId }),
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
    });
  },
  setJd: (jd) => set({ jd }),
}));

