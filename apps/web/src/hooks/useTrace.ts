type GithubStarLocation =
  | 'footer'
  | 'hero'
  | 'hero_glass_button'
  | 'hero_macbook_badge'
  | 'footer_mobile';

type TracePayload = Record<string, unknown>;

const noop = () => undefined;
const noopWithPayload = (props: TracePayload) => {
  void props;
};

const traceHandlers = {
  traceGetStarted: noop,
  traceGithubStar: (location: GithubStarLocation) => {
    void location;
  },
  traceDashboardViewed: (count: number) => {
    void count;
  },
  traceCreateResume: noop,
  traceResumeCreated: (id: string) => {
    void id;
  },
  traceImportResume: noop,
  traceEditorViewed: noopWithPayload,
  traceResumeSaved: noopWithPayload,
  traceDownloadJson: noopWithPayload,
  traceTemplateChanged: noopWithPayload,
  traceSettingsViewed: noop,
  traceSettingsSaved: noopWithPayload,
  traceAiCreateViewed: noop,
  traceAiOptimizeViewed: noop,
  traceAiAnalyzeViewed: noop,
  traceAiInterviewViewed: noop,
  traceAiOptimizationStarted: (hasInputContext: boolean) => {
    void hasInputContext;
  },
  traceAiOptimizationApplied: noopWithPayload,
  traceAiAnalysisStarted: noop,
  traceAiAnalysisSucceeded: noop,
};

export const useTrace = () => traceHandlers;
