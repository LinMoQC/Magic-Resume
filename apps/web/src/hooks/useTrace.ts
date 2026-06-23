import { useAppUser } from '@/lib/auth';
import { useCallback } from 'react';
import { captureCoreAnalyticsEvent } from '@/lib/analytics/core-events';

export const useTrace = () => {
  const { user } = useAppUser();

  const getCommonProps = useCallback(() => {
    return {
      username: user?.fullName || user?.primaryEmailAddress?.emailAddress || 'anonymous',
    };
  }, [user]);

  const captureProductEvent = useCallback((type: string, properties?: Record<string, unknown>) => {
    const resumeId = properties?.resume_id || properties?.resumeId;
    captureCoreAnalyticsEvent({
      type,
      userId: undefined,
      source: 'web',
      resumeId: typeof resumeId === 'string' ? resumeId : undefined,
      properties,
    });
  }, []);

  const traceGetStarted = useCallback(() => {
    captureProductEvent('clicked_get_started', { location: 'hero_section' });
  }, [captureProductEvent]);

  const traceGithubStar = useCallback((location: 'footer' | 'hero' | 'hero_glass_button' | 'hero_macbook_badge' | 'footer_mobile') => {
    captureProductEvent('clicked_github_star', { location });
  }, [captureProductEvent]);

  const traceDashboardViewed = useCallback((resumeCount: number) => {
    captureProductEvent('dashboard_viewed', {
      resume_count: resumeCount,
      ...getCommonProps(),
    });
  }, [getCommonProps, captureProductEvent]);

  const traceCreateResume = useCallback(() => {
    captureProductEvent('clicked_create_resume', { ...getCommonProps() });
  }, [getCommonProps, captureProductEvent]);

  const traceResumeCreated = useCallback((resumeId: string) => {
    captureProductEvent('resume_created', {
      resume_id: resumeId,
      ...getCommonProps(),
    });
  }, [getCommonProps, captureProductEvent]);

  const traceImportResume = useCallback(() => {
    captureProductEvent('clicked_import_resume', { ...getCommonProps() });
  }, [getCommonProps, captureProductEvent]);

  const traceEditorViewed = useCallback((props: { resumeId: string; templateId: string; resumeName: string }) => {
    captureProductEvent('editor_viewed', {
      resume_id: props.resumeId,
      template_id: props.templateId,
      resume_name: props.resumeName,
      ...getCommonProps(),
    });
  }, [getCommonProps, captureProductEvent]);

  const traceResumeSaved = useCallback((props: { resumeId: string; resumeName: string }) => {
    captureProductEvent('resume_saved', {
      resume_id: props.resumeId,
      resume_name: props.resumeName,
      ...getCommonProps(),
    });
  }, [getCommonProps, captureProductEvent]);

  const traceDownloadJson = useCallback((props: { resumeId: string; resumeName: string }) => {
    captureProductEvent('clicked_download_json', {
      resume_id: props.resumeId,
      resume_name: props.resumeName,
      ...getCommonProps(),
    });
  }, [getCommonProps, captureProductEvent]);

  const traceTemplateChanged = useCallback((props: { oldTemplate: string; newTemplate: string; resumeName: string }) => {
    captureProductEvent('template_changed', {
      old_template: props.oldTemplate,
      new_template: props.newTemplate,
      resume_name: props.resumeName,
      ...getCommonProps(),
    });
  }, [getCommonProps, captureProductEvent]);

  const traceSettingsViewed = useCallback(() => {
    captureProductEvent('settings_viewed', { ...getCommonProps() });
  }, [getCommonProps, captureProductEvent]);

  const traceSettingsSaved = useCallback((props: { model: string }) => {
    captureProductEvent('settings_saved', {
      model: props.model,
      ...getCommonProps(),
    });
  }, [getCommonProps, captureProductEvent]);

  const traceAiCreateViewed = useCallback(() => {
    captureProductEvent('ai_create_viewed', { ...getCommonProps() });
  }, [getCommonProps, captureProductEvent]);

  const traceAiOptimizeViewed = useCallback(() => {
    captureProductEvent('ai_optimize_viewed', { ...getCommonProps() });
  }, [getCommonProps, captureProductEvent]);

  const traceAiAnalyzeViewed = useCallback(() => {
    captureProductEvent('ai_analyze_viewed', { ...getCommonProps() });
  }, [getCommonProps, captureProductEvent]);

  const traceAiInterviewViewed = useCallback(() => {
    captureProductEvent('ai_interview_viewed', { ...getCommonProps() });
  }, [getCommonProps, captureProductEvent]);

  const traceAiOptimizationStarted = useCallback((hasJd: boolean) => {
    captureProductEvent('ai_optimization_started', {
      has_jd: hasJd,
      ...getCommonProps(),
    });
  }, [getCommonProps, captureProductEvent]);

  const traceAiOptimizationApplied = useCallback((props: { sectionsOptimized: number }) => {
    captureProductEvent('ai_optimization_applied', {
      sections_optimized: props.sectionsOptimized,
      ...getCommonProps(),
    });
  }, [getCommonProps, captureProductEvent]);

  const traceAiAnalysisStarted = useCallback(() => {
    captureProductEvent('ai_analysis_started', { ...getCommonProps() });
  }, [getCommonProps, captureProductEvent]);

  const traceAiAnalysisSucceeded = useCallback(() => {
    captureProductEvent('ai_analysis_succeeded', { ...getCommonProps() });
  }, [getCommonProps, captureProductEvent]);

  return {
    traceGetStarted,
    traceGithubStar,
    traceDashboardViewed,
    traceCreateResume,
    traceResumeCreated,
    traceImportResume,
    traceEditorViewed,
    traceResumeSaved,
    traceDownloadJson,
    traceTemplateChanged,
    traceSettingsViewed,
    traceSettingsSaved,
    traceAiCreateViewed,
    traceAiOptimizeViewed,
    traceAiAnalyzeViewed,
    traceAiInterviewViewed,
    traceAiOptimizationStarted,
    traceAiOptimizationApplied,
    traceAiAnalysisStarted,
    traceAiAnalysisSucceeded,
  };
};
