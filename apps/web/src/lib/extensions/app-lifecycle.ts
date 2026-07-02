export type GithubStarLocation =
  | 'footer'
  | 'hero'
  | 'hero_glass_button'
  | 'hero_macbook_badge'
  | 'footer_mobile';

export type ResumeImportSource = 'json' | 'pdf';
export type FileSizeBucket = 'small' | 'medium' | 'large';

export type ResumeImportCompletedPayload = {
  source: ResumeImportSource;
  cloudSyncEnabled: boolean;
  sizeBucket?: FileSizeBucket;
};

export type DashboardViewedPayload = {
  resumeCount: number;
};

export type EditorViewedPayload = {
  templateId?: string;
};

export type ResumeSaveRequestedPayload = {
  source: 'manual' | 'auto';
};

export type ResumeJsonDownloadedPayload = {
  source: 'editor' | 'json_page' | 'json_modal';
};

export type ResumeTemplateSelectedPayload = {
  previousTemplateId?: string;
  nextTemplateId: string;
};

type LifecyclePayload = Record<string, unknown>;

const noop = () => undefined;
const ignore = <T,>(value: T) => {
  void value;
};

export const appLifecycle = {
  getStartedClicked: noop,
  githubStarClicked: (location: GithubStarLocation) => {
    ignore(location);
  },
  dashboardViewed: (payload: DashboardViewedPayload) => {
    ignore(payload);
  },
  resumeCreateRequested: noop,
  resumeCreated: noop,
  resumeImportRequested: noop,
  resumeImportCompleted: (payload: ResumeImportCompletedPayload) => {
    ignore(payload);
  },
  editorViewed: (payload: EditorViewedPayload) => {
    ignore(payload);
  },
  resumeSaveRequested: (payload: ResumeSaveRequestedPayload) => {
    ignore(payload);
  },
  resumeJsonDownloaded: (payload: ResumeJsonDownloadedPayload) => {
    ignore(payload);
  },
  resumeTemplateSelected: (payload: ResumeTemplateSelectedPayload) => {
    ignore(payload);
  },
  settingsViewed: noop,
  settingsSaved: (payload: LifecyclePayload) => {
    ignore(payload);
  },
  aiCreateViewed: noop,
  aiOptimizeViewed: noop,
  aiAnalyzeViewed: noop,
  aiInterviewViewed: noop,
  aiOptimizationStarted: (hasInputContext: boolean) => {
    ignore(hasInputContext);
  },
  aiOptimizationApplied: (payload: LifecyclePayload) => {
    ignore(payload);
  },
  aiAnalysisStarted: noop,
  aiAnalysisSucceeded: noop,
};

export type AppLifecycle = typeof appLifecycle;
