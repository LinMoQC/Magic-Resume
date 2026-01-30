import { usePostHog } from 'posthog-js/react';
import { useUser } from '@clerk/nextjs';
import { useCallback } from 'react';

export const useTrace = () => {
  const posthog = usePostHog();
  const { user } = useUser();

  // 获取公共属性 (用户名等)
  const getCommonProps = useCallback(() => {
    return {
      username: user?.username || user?.fullName || user?.primaryEmailAddress?.emailAddress || 'anonymous',
    };
  }, [user]);

  // Landing Page - 追踪点击 "Get Started" 按钮
  const traceGetStarted = useCallback(() => {
    console.log('[useTrace] traceGetStarted');
    posthog.capture('clicked_get_started', { location: 'hero_section' });
  }, [posthog]);

  // Landing Page - 追踪点击 GitHub Star
  const traceGithubStar = useCallback((location: 'footer' | 'hero' | 'hero_glass_button' | 'hero_macbook_badge' | 'footer_mobile') => {
    console.log('[useTrace] traceGithubStar', location);
    posthog.capture('clicked_github_star', { location });
  }, [posthog]);

  // Dashboard - 追踪仪表盘查看
  const traceDashboardViewed = useCallback((resumeCount: number) => {
    console.log('[useTrace] traceDashboardViewed', resumeCount);
    posthog.capture('dashboard_viewed', {
      resume_count: resumeCount,
      ...getCommonProps()
    });
  }, [posthog, getCommonProps]);

  // Dashboard - 追踪点击创建简历
  const traceCreateResume = useCallback(() => {
    console.log('[useTrace] traceCreateResume');
    posthog.capture('clicked_create_resume', { ...getCommonProps() });
  }, [posthog, getCommonProps]);

  // Dashboard - 追踪简历创建成功
  const traceResumeCreated = useCallback((resumeId: string) => {
    console.log('[useTrace] traceResumeCreated', resumeId);
    posthog.capture('resume_created', {
      resume_id: resumeId,
      ...getCommonProps()
    });
  }, [posthog, getCommonProps]);

  // Dashboard - 追踪导入简历
  const traceImportResume = useCallback(() => {
    console.log('[useTrace] traceImportResume');
    posthog.capture('clicked_import_resume', { ...getCommonProps() });
  }, [posthog, getCommonProps]);

  // Editor - 追踪编辑器查看
  const traceEditorViewed = useCallback((props: { resumeId: string; templateId: string; resumeName: string }) => {
    console.log('[useTrace] traceEditorViewed', props);
    posthog.capture('editor_viewed', {
      resume_id: props.resumeId,
      template_id: props.templateId,
      resume_name: props.resumeName,
      ...getCommonProps()
    });
  }, [posthog, getCommonProps]);

  // Editor - 追踪简历保存
  const traceResumeSaved = useCallback((props: { resumeId: string; resumeName: string }) => {
    console.log('[useTrace] traceResumeSaved', props);
    posthog.capture('resume_saved', {
      resume_id: props.resumeId,
      resume_name: props.resumeName,
      ...getCommonProps()
    });
  }, [posthog, getCommonProps]);

  // Editor - 追踪下载 JSON
  const traceDownloadJson = useCallback((props: { resumeId: string; resumeName: string }) => {
    console.log('[useTrace] traceDownloadJson', props);
    posthog.capture('clicked_download_json', {
      resume_id: props.resumeId,
      resume_name: props.resumeName,
      ...getCommonProps()
    });
  }, [posthog, getCommonProps]);

  // Editor - 追踪模板切换
  const traceTemplateChanged = useCallback((props: { oldTemplate: string; newTemplate: string; resumeName: string }) => {
    console.log('[useTrace] traceTemplateChanged', props);
    posthog.capture('template_changed', {
      old_template: props.oldTemplate,
      new_template: props.newTemplate,
      resume_name: props.resumeName,
      ...getCommonProps()
    });
  }, [posthog, getCommonProps]);

  // Settings - 追踪设置页查看
  const traceSettingsViewed = useCallback(() => {
    console.log('[useTrace] traceSettingsViewed');
    posthog.capture('settings_viewed', { ...getCommonProps() });
  }, [posthog, getCommonProps]);

  // Settings - 追踪设置保存
  const traceSettingsSaved = useCallback((props: { model: string }) => {
    console.log('[useTrace] traceSettingsSaved', props);
    posthog.capture('settings_saved', {
      model: props.model,
      ...getCommonProps()
    });
  }, [posthog, getCommonProps]);

  // AI Lab - 追踪 AI 创作 Tab 查看
  const traceAiCreateViewed = useCallback(() => {
    console.log('[useTrace] traceAiCreateViewed');
    posthog.capture('ai_create_viewed', { ...getCommonProps() });
  }, [posthog, getCommonProps]);

  // AI Lab - 追踪 AI 优化 Tab 查看
  const traceAiOptimizeViewed = useCallback(() => {
    console.log('[useTrace] traceAiOptimizeViewed');
    posthog.capture('ai_optimize_viewed', { ...getCommonProps() });
  }, [posthog, getCommonProps]);

  // AI Lab - 追踪 AI 分析 Tab 查看
  const traceAiAnalyzeViewed = useCallback(() => {
    console.log('[useTrace] traceAiAnalyzeViewed');
    posthog.capture('ai_analyze_viewed', { ...getCommonProps() });
  }, [posthog, getCommonProps]);

  // AI Lab - 追踪 AI 面试 Tab 查看
  const traceAiInterviewViewed = useCallback(() => {
    console.log('[useTrace] traceAiInterviewViewed');
    posthog.capture('ai_interview_viewed', { ...getCommonProps() });
  }, [posthog, getCommonProps]);

  // AI Lab - 追踪开始 AI 优化
  const traceAiOptimizationStarted = useCallback((hasJd: boolean) => {
    console.log('[useTrace] traceAiOptimizationStarted', hasJd);
    posthog.capture('ai_optimization_started', {
      has_jd: hasJd,
      ...getCommonProps()
    });
  }, [posthog, getCommonProps]);

  // AI Lab - 追踪开始 AI 分析
  const traceAiAnalysisStarted = useCallback(() => {
    console.log('[useTrace] traceAiAnalysisStarted');
    posthog.capture('ai_analysis_started', { ...getCommonProps() });
  }, [posthog, getCommonProps]);

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
    traceAiAnalysisStarted
  };
};
