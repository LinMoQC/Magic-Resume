"use client";
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Section, SectionItem } from '@/types/frontend/resume';
import { useResumeStore, getSanitizedResume } from '@/store/useResumeStore';
import { useSettingStore } from '@/store/useSettingStore';
import debounce from 'lodash/debounce';
import BasicForm from './forms/BasicForm';
import sidebarMenu from '@/lib/constants/sidebarMenu';
import SectionListWithModal from './forms/SectionListWithModal';
import ResumePreviewPanel from './preview/ResumePreviewPanel';
import FormSection from './forms/FormSection';
import { dynamicFormFields } from '@/lib/constants/dynamicFormFields';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { toast } from 'sonner';
import ResumeEditSkeleton from './layout/ResumeEditSkeleton';
import TemplatePanel, { rightPanelWidth } from './templates/TemplatePanel';
import EditorFormPanel from './layout/EditorFormPanel';
import { sectionMeta, leftPanelWidth } from './layout/OutlineRail';
import useMobile from '@/hooks/useMobile';
import MobileResumEdit from './mobile/MobileResumEdit';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import HeaderTab from './layout/HeaderTab';
import { appLifecycle } from '@/lib/extensions/app-lifecycle';

// 预览面板静态引入:它本体很轻(重件 pdf.js / @react-pdf 都在更下层按需懒加载,见
// PdfCanvasPreview 的 dynamic 与 pdf-export 的内部 import())。之前整个面板 dynamic 化,
// 造成"转圈 spinner → dock 独自弹在黑画布上 → 纸才出现"的三段跳;静态引入后舞台、占位纸、
// dock 同帧入场,加载故事从头到尾只有一张持续呼吸的纸。SSR 无虞:父组件在 store 加载完成前
// 渲染的是 ResumeEditSkeleton,服务端不会走到本面板。

type ResumeEditProps = {
  id: string;
};

const MIN_EDITOR_STAGE_WIDTH = 420;

export default function ResumeEdit({ id }: ResumeEditProps) {
  const {
    activeResume,
    loadResumeForEdit,
    saveResume: saveActiveResumeToResumes,
    syncToCloud,
    updateInfo,
    setSectionOrder: updateSectionOrder,
    updateSectionItems,
    updateTemplate,
    rightCollapsed,
    setRightCollapsed,
    leftCollapsed,
    setLeftCollapsed,
    activeSection,
    setActiveSection,
    isStoreLoading,
    resumes,
    syncStatus,
    isAiGenerating,
  } = useResumeStore();

  const router = useRouter();

  const cloudSync = useSettingStore(state => state.cloudSync);

  const { isMobile } = useMobile();

  const [viewportWidth, setViewportWidth] = useState(0);
  const [leftPanelOpen, setLeftPanelOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [isAnyModalOpen, setIsAnyModalOpen] = useState(false);
  const [currentTemplateId, setCurrentTemplateId] = useState(activeResume?.template || 'classic');
  const [resumeNotFound, setResumeNotFound] = useState(false);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const openJsonModal = () => router.push(`/dashboard/edit/${id}/json`);

  const openAIModal = async () => {
    // The AI agent reads the resume from the cloud DB (read_resume tool), so push
    // the latest editor state first (best-effort; no-ops if cloud sync is off).
    try {
      await syncToCloud();
    } catch {
      // Open the lab regardless — read_resume degrades gracefully if unsynced.
    }
    router.push(`/dashboard/edit/${id}/ai-lab`);
  };
  const [isSaving, setIsSaving] = useState(false);

  const openVersionHistory = () => router.push(`/dashboard/edit/${id}/history`);
  const openShareModal = () => router.push(`/dashboard/edit/${id}/share`);
  const openFeedback = () => router.push(`/dashboard/edit/${id}/feedback`);

  const { t } = useTranslation();

  useEffect(() => {
    const updateViewportWidth = () => setViewportWidth(window.innerWidth);
    updateViewportWidth();
    window.addEventListener('resize', updateViewportWidth);

    return () => {
      window.removeEventListener('resize', updateViewportWidth);
    };
  }, []);

  const narrowWorkspace =
    !isMobile &&
    viewportWidth > 0 &&
    viewportWidth <
      leftPanelWidth(false) +
        rightPanelWidth(false) +
        MIN_EDITOR_STAGE_WIDTH;

  const rightWorkspaceInset =
    rightPanelWidth(rightCollapsed) + (rightCollapsed ? 0 : 1);

  const toggleLeftPanel = useCallback(() => {
    const nextCollapsed = !leftCollapsed;
    if (!nextCollapsed && narrowWorkspace && !rightCollapsed) {
      setRightCollapsed(true);
    }
    setLeftCollapsed(nextCollapsed);
  }, [leftCollapsed, narrowWorkspace, rightCollapsed, setLeftCollapsed, setRightCollapsed]);

  const setRightPanelCollapsed = useCallback(
    (collapsed: boolean) => {
      if (!collapsed && narrowWorkspace && !leftCollapsed) {
        setLeftCollapsed(true);
      }
      setRightCollapsed(collapsed);
    },
    [leftCollapsed, narrowWorkspace, setLeftCollapsed, setRightCollapsed],
  );

  const handleDownloadJson = () => {
    if (activeResume) {
      appLifecycle.resumeJsonDownloaded({ source: 'editor' });
    }
    if (!activeResume) return;
    const sanitized = getSanitizedResume(activeResume);
    const jsonString = JSON.stringify(sanitized, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${activeResume.name || 'resume'}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success(t('editPage.notifications.jsonDownloadStarted'));
  };

  const info = activeResume?.info;
  const sectionItems = activeResume?.sections;
  const sectionOrder = activeResume?.sectionOrder;

  // 简历模块的 refs(供大纲轨跳转 / 滚动高亮)
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const leftScrollRef = useRef<HTMLDivElement | null>(null);
  const suppressNextScroll = useRef(false);

  // 拖拽排序的传感器
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // activeSection 变化 → 滚动到对应模块(外部导航 / 轨跳转);scroll-spy 触发的变化跳过,避免回环
  useEffect(() => {
    if (suppressNextScroll.current) {
      suppressNextScroll.current = false;
      return;
    }
    const el = sectionRefs.current[activeSection];
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [activeSection]);

  // 监听store loading状态和resumes变化，确保数据加载完成后能正确加载简历
  useEffect(() => {
    const setupEditor = async () => {
      // 1. 检查是否存在 (UI 逻辑)
      if (!isStoreLoading) {
        const resume = resumes.find(r => r.id === id);
        if (!resume && resumes.length > 0) {
          setResumeNotFound(true);
        } else if (resume) {
          setResumeNotFound(false);
          // 预加载
          router.prefetch(`/dashboard/edit/${id}/ai-lab`);
          router.prefetch(`/dashboard/edit/${id}/history`);
          router.prefetch(`/dashboard/edit/${id}/json`);
          router.prefetch(`/dashboard/edit/${id}/share`);
          router.prefetch(`/dashboard/edit/${id}/feedback`);
        }
      }

      // 2. 触发加载 (数据逻辑)
      const { activeResume, isSyncing } = useResumeStore.getState();
      if (activeResume?.id === id && !isStoreLoading && !isSyncing) {
          return;
      }

      loadResumeForEdit(id);
    };

    setupEditor();
  }, [id, loadResumeForEdit, isStoreLoading, resumes, router]); // resumes 依然保留，但靠内部 activeResume?.id === id 熔断

  // 编辑器查看生命周期
  useEffect(() => {
    if (activeResume && !isStoreLoading) {
      appLifecycle.editorViewed({ templateId: activeResume.template });
    }
  }, [activeResume?.id, activeResume?.template, isStoreLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  // 同步activeResume的template到currentTemplateId
  useEffect(() => {
    if (activeResume?.template && activeResume.template !== currentTemplateId) {
      setCurrentTemplateId(activeResume.template);
    }
  }, [activeResume?.template, currentTemplateId]);

  useEffect(() => {
    if (narrowWorkspace && !leftCollapsed && !rightCollapsed) {
      setLeftCollapsed(true);
    }
  }, [leftCollapsed, narrowWorkspace, rightCollapsed, setLeftCollapsed]);

  // 保存简历
  const handleSave = async () => {
    if (isSaving) return;
    
    setIsSaving(true);
    console.log('[Save] Starting manual save process...');
    try {
      if (activeResume) {
        appLifecycle.resumeSaveRequested({ source: 'manual' });
      }
      
      console.log('[Save] Calling store saveResume...');
      
      console.log('[Save] Calling store saveResume...');
      await saveActiveResumeToResumes('manual', activeResume || undefined);
      console.log('[Save] Store saveResume completed.');
      
      // Update ref to prevent the auto-sync useEffect from thinking this is a fresh unsynced change
      const freshResume = useResumeStore.getState().activeResume;
      if (freshResume) {
          lastUpdatedAtRef.current = freshResume.updatedAt;
      }
    } catch (err) {
      console.error('[Save] Manual save failed:', err);
    } finally {
      setIsSaving(false);
      console.log('[Save] Manual save process ended, loading state released.');
    }
  };

  // 自动同步:10s 防抖 + 45s maxWait。纯 trailing 防抖会被持续输入无限重置 —— 用户连续
  // 写作几分钟,云端(分享链接 / AI read_resume / 其它设备)就几分钟拿不到新内容;maxWait
  // 保证再怎么连续编辑,至多 45s 也会落一次云。
  const debouncedSync = useMemo(
    () => debounce(async () => {
      await syncToCloud();
    }, 10000, { maxWait: 45000 }),
    [syncToCloud]
  );

  // Ref to track the last synced/loaded update time
  const lastUpdatedAtRef = React.useRef<number | null>(null);
  
  // Reset lastUpdatedAt when ID changes
  useEffect(() => {
    lastUpdatedAtRef.current = null;
  }, [id]);

  useEffect(() => {
    const triggerSync = async () => {
      if (cloudSync && activeResume && !isStoreLoading) {
        // Initial load: capture current timestamp and skip sync
        if (lastUpdatedAtRef.current === null) {
          lastUpdatedAtRef.current = activeResume.updatedAt;
          return;
        }

        // If timestamp hasn't changed, it's just a re-render or initial load double-invoke
        if (activeResume.updatedAt === lastUpdatedAtRef.current) {
          return;
        }

        debouncedSync();
        lastUpdatedAtRef.current = activeResume.updatedAt;
      }
    };
    
    triggerSync();

    // 注意:cleanup 里不要 cancel。此 effect 每次编辑都重跑,cancel 会 ①卸载时把待同步
    // 修改静默丢弃 ②每次击键清零 maxWait 的计时,让"最迟 45s 必落云"彻底失效(trailing
    // 计时器 debounce 自己每次调用就会重置,无需 cancel 帮忙)。"待同步不再成立"的场景
    // (关同步 / 无 activeResume)由 syncToCloud 入口的前置检查兜住。
  }, [activeResume, cloudSync, isStoreLoading, debouncedSync]);

  // 离开编辑器(卸载)或切换简历时,把仍在防抖窗口里的待同步立即刷出去,而不是丢弃。
  // flush 对无挂起调用是 no-op;syncToCloud 在 flush 触发时同步地快照 store 里的
  // activeResume(此刻仍是旧简历),同步对象不会串。
  useEffect(() => {
    return () => {
      debouncedSync.flush();
    };
  }, [id, debouncedSync]);

  // 标签页隐藏 / 关闭时尽力刷出 —— 与 store 层 debouncedLocalPersist 的 flush-on-hide
  // 同款模式(useResumeStore.ts 末尾)。分两档:
  //   visibilitychange:hidden(切标签/切应用,页面还活着)→ axios flush,走完整同步算法;
  //   pagehide(关标签/跳走,axios 不保送达)→ keepalive fetch(flushSyncOnExit),浏览器
  //   托管送完;同时 cancel 防抖,避免 bfcache 恢复后重复推送。
  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') void debouncedSync.flush();
    };
    const onPageHide = () => {
      debouncedSync.cancel();
      useResumeStore.getState().flushSyncOnExit();
    };
    window.addEventListener('pagehide', onPageHide);
    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => {
      window.removeEventListener('pagehide', onPageHide);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [debouncedSync]);

  // 网络恢复时,若仍有未落云的修改(modified)或上次同步失败(error),立即补一次,
  // 不必干等下一次编辑才触发。
  useEffect(() => {
    const onOnline = () => {
      const { syncStatus: status } = useResumeStore.getState();
      if (cloudSync && (status === 'modified' || status === 'error')) {
        void syncToCloud();
      }
    };
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [cloudSync, syncToCloud]);

  // 折叠分区 / 大纲轨跳转 / 滚动高亮
  const toggleSection = useCallback((key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: !(prev[key] ?? true) }));
  }, []);

  const jumpToSection = useCallback((key: string) => {
    setOpenSections(prev => ({ ...prev, [key]: true }));
    if (leftCollapsed) {
      if (narrowWorkspace && !rightCollapsed) {
        setRightCollapsed(true);
      }
      setLeftCollapsed(false);
    }
    setActiveSection(key);
  }, [leftCollapsed, narrowWorkspace, rightCollapsed, setLeftCollapsed, setRightCollapsed, setActiveSection]);

  const handleLeftScroll = useCallback(() => {
    const container = leftScrollRef.current;
    if (!container) return;
    const top = container.getBoundingClientRect().top;
    let current = sectionOrder?.[0]?.key ?? 'basics';
    (sectionOrder || []).forEach(({ key }) => {
      const el = sectionRefs.current[key];
      if (el && el.getBoundingClientRect().top - top <= 28) current = key;
    });
    if (current !== activeSection) {
      suppressNextScroll.current = true;
      setActiveSection(current);
    }
  }, [sectionOrder, activeSection, setActiveSection]);

  // 选择模板
  const handleSelectTemplate = useCallback((templateId: string) => {
    if (activeResume) {
      appLifecycle.resumeTemplateSelected({
        previousTemplateId: currentTemplateId,
        nextTemplateId: templateId
      });
    }
    setCurrentTemplateId(templateId);
    updateTemplate(templateId);
  }, [activeResume, currentTemplateId, updateTemplate]);

  // 拖拽排序
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id && sectionOrder) {
      const oldIndex = sectionOrder.findIndex(item => item.key === active.id);
      const newIndex = sectionOrder.findIndex(item => item.key === over.id);
      if (oldIndex !== -1 && newIndex !== -1) {
        const newOrder = arrayMove(sectionOrder, oldIndex, newIndex);
        updateSectionOrder(newOrder);
      }
    }
  }

  // 如果简历未找到，显示错误信息
  if (resumeNotFound) {
    return (
      <div className="flex h-screen bg-desk text-white items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">{t('editPage.errors.resumeNotFound')}</h1>
          <p className="text-neutral-400 mb-8">
            {t('editPage.errors.resumeNotFoundDescription', { id })}
          </p>
          <button
            onClick={() => window.history.back()}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-2 rounded-lg transition-colors"
          >
            {t('editPage.errors.goBack')}
          </button>
        </div>
      </div>
    );
  }

  // 显示loading状态或当简历数据不存在时
  if (isStoreLoading || !activeResume || !info || !sectionItems || !sectionOrder) {
    return <ResumeEditSkeleton />;
  }

  // 简历模块
  function renderSections() {
    return (
      <DndContext
        key="dnd-context"
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={sectionOrder?.map(s => s.key) || []} strategy={verticalListSortingStrategy}>
          {(sectionOrder || []).map(({ key }) => {
            const meta = sectionMeta(key);
            const Icon = meta.icon;
            const title = meta.labelKey ? t(meta.labelKey) : key;
            return (
              <FormSection
                key={key}
                sectionId={key}
                icon={<Icon size={15} />}
                title={title}
                open={openSections[key] ?? true}
                onToggle={() => toggleSection(key)}
                registerRef={(el) => { sectionRefs.current[key] = el; }}
                disabled={key === 'basics' || isAnyModalOpen}
              >
                {key === 'basics' ? (
                  <BasicForm
                    info={info!}
                    updateInfo={updateInfo}
                    enableCustomFields={activeResume?.template === 'product-ops-focus'}
                  />
                ) : (
                  <SectionListWithModal
                    label={meta.labelKey || key}
                    fields={(dynamicFormFields[key as keyof typeof dynamicFormFields] || []).map(f => ({ name: f.key, label: t(f.labelKey), placeholder: f.placeholderKey ? t(f.placeholderKey) : '', required: f.required }))}
                    richtextKey="summary"
                    richtextPlaceholder="..."
                    /* eslint-disable @typescript-eslint/no-explicit-any */
                    itemRender={sidebarMenu.find(s => s.key === key)?.itemRender as any}
                    /* eslint-disable @typescript-eslint/no-explicit-any */
                    items={(sectionItems?.[key as keyof Section] ?? []).map((item: { id: any; }) => ({ ...item, id: String(item.id) })) as any}
                    setItems={(items) => updateSectionItems(key, items as SectionItem[])}
                    onModalStateChange={setIsAnyModalOpen}
                  />
                )}
              </FormSection>
            );
          })}
        </SortableContext>
      </DndContext>
    );
  }

  // 移动端适配
  if (isMobile) {
    return (
      <MobileResumEdit
        activeResume={activeResume}
        leftPanelOpen={leftPanelOpen}
        setLeftPanelOpen={setLeftPanelOpen}
        rightPanelOpen={rightPanelOpen}
        setRightPanelOpen={setRightPanelOpen}
        isJsonModalOpen={false}
        closeJsonModal={() => router.push(`/dashboard/edit/${id}`)}
        openJsonModal={openJsonModal}
        handleCopyJson={handleDownloadJson}
        renderSections={renderSections}
        handleSave={handleSave}
        onShowAI={openAIModal}
        isAiJobRunning={isAiGenerating}
        onShareClick={openShareModal}
        onSelectTemplate={handleSelectTemplate}
        currentTemplateId={currentTemplateId}
      />
    );
  }

  return (
    <>
      <main className="flex h-screen min-w-0 overflow-hidden bg-desk text-white flex-1">
        {/* 左侧:大纲轨 + 可折叠表单面板(入场:opacity-only,不动 fixed 定位) */}
        <div className="editor-enter-left">
          <EditorFormPanel
            renderSections={renderSections}
            sectionOrder={(sectionOrder || []).map(s => ({ key: s.key, label: s.label }))}
            activeSection={activeSection}
            collapsed={leftCollapsed}
            onToggleCollapse={toggleLeftPanel}
            onJump={jumpToSection}
            scrollRef={leftScrollRef}
            onScroll={handleLeftScroll}
          />
        </div>
        <div
          className='min-w-0 flex-1 flex items-center justify-center bg-desk relative overflow-hidden transition-all duration-300 editor-enter-stage'
          style={{
            marginLeft: leftPanelWidth(leftCollapsed),
            marginRight: rightWorkspaceInset
          }}
        >
          <HeaderTab
            updatedAt={activeResume?.updatedAt}
            syncStatus={syncStatus}
            onVersionClick={openVersionHistory}
            onFeedbackClick={openFeedback}
          />
          {/* 简历预览面板 */}
          <ResumePreviewPanel
            activeResume={activeResume}
            onShowAI={openAIModal}
            isAiJobRunning={isAiGenerating}
            onShareClick={openShareModal}
            onJsonClick={openJsonModal}
          />
        </div>
      </main>

      {/* 模板面板(入场:opacity-only,不动 fixed 定位) */}
      <div className="editor-enter-right">
        <TemplatePanel
          rightCollapsed={rightCollapsed}
          setRightCollapsed={setRightPanelCollapsed}
          onSelectTemplate={handleSelectTemplate}
          currentTemplateId={currentTemplateId}
        />
      </div>
    </>
  );
}
