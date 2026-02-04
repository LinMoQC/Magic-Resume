"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { Section, SectionItem } from '@/types/frontend/resume';
import { useResumeStore, getSanitizedResume } from '@/store/useResumeStore';
import { useAuth } from '@clerk/nextjs';
import { useSettingStore } from '@/store/useSettingStore';
import debounce from 'lodash/debounce';
import { FaUser } from 'react-icons/fa';
import BasicForm from './forms/BasicForm';
import sidebarMenu from '@/lib/constants/sidebarMenu';
import dynamic from 'next/dynamic';
import SectionListWithModal from './forms/SectionListWithModal';
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
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toast } from 'sonner';
import ResumeEditSkeleton from './layout/ResumeEditSkeleton';
import TemplatePanel from './templates/TemplatePanel';
import ResumeContent from './layout/ResumeContent';
import useMobile from '@/hooks/useMobile';
import MobileResumEdit from './mobile/MobileResumEdit';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import HeaderTab from './layout/HeaderTab';
import { useTrace } from '@/hooks/useTrace';

const ResumePreviewPanel = dynamic(() => import('./preview/ResumePreviewPanel'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-black flex items-center justify-center text-white">
      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
    </div>
  )
});

type ResumeEditProps = {
  id: string;
};

function SortableSection({ id, children, disabled }: { id: string, children: React.ReactNode, disabled?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: disabled ? 'default' : 'grab'
  };
  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      {children}
    </div>
  );
}

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
    activeSection,
    isStoreLoading,
    resumes,
    syncStatus,
    isAiGenerating,
  } = useResumeStore();

  const router = useRouter();

  const { getToken } = useAuth();
  const cloudSync = useSettingStore(state => state.cloudSync);

  const { traceEditorViewed, traceResumeSaved, traceDownloadJson, traceTemplateChanged } = useTrace();

  const { isMobile } = useMobile();

  const [leftPanelOpen, setLeftPanelOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [isAnyModalOpen, setIsAnyModalOpen] = useState(false);
  const [currentTemplateId, setCurrentTemplateId] = useState(activeResume?.template || 'classic');
  const [resumeNotFound, setResumeNotFound] = useState(false);

  const [previewScale, setPreviewScale] = useState(1);
  const openJsonModal = () => router.push(`/dashboard/edit/${id}/json`);

  const openAIModal = () => router.push(`/dashboard/edit/${id}/ai-lab`);
  const [isSaving, setIsSaving] = useState(false);

  const openVersionHistory = () => router.push(`/dashboard/edit/${id}/history`);
  const openShareModal = () => router.push(`/dashboard/edit/${id}/share`);

  const { t } = useTranslation();

  const handleDownloadJson = () => {
    if (activeResume) {
      traceDownloadJson({
        resumeId: activeResume.id,
        resumeName: activeResume.name
      });
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

  // 简历模块的refs
  const sectionRefs = useMemo(() => {
    const refs: Record<string, React.RefObject<HTMLDivElement | null>> = {
      basics: React.createRef<HTMLDivElement>(),
      summary: React.createRef<HTMLDivElement>(),
      projects: React.createRef<HTMLDivElement>(),
      education: React.createRef<HTMLDivElement>(),
      skills: React.createRef<HTMLDivElement>(),
      languages: React.createRef<HTMLDivElement>(),
      certificates: React.createRef<HTMLDivElement>(),
      experience: React.createRef<HTMLDivElement>(),
      profiles: React.createRef<HTMLDivElement>(),
    };
    return refs;
  }, []);

  // 拖拽排序的传感器
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // 监听activeSection变化，滚动到对应的简历模块
  useEffect(() => {
    if (activeSection && sectionRefs[activeSection]?.current) {
      sectionRefs[activeSection].current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [activeSection, sectionRefs]);

  // 监听store loading状态和resumes变化，确保数据加载完成后能正确加载简历
  useEffect(() => {
    if (!isStoreLoading) {
      // 数据加载完成，检查简历是否存在
      const resume = resumes.find(r => r.id === id);
      if (!resume && resumes.length > 0) {
        // 如果有其他简历但找不到目标简历，说明确实不存在
        setResumeNotFound(true);
        return;
      } else if (resume) {
        // 找到了简历，重置错误状态
        setResumeNotFound(false);
        // 预加载所有弹窗路由，减少首次加载延迟
        router.prefetch(`/dashboard/edit/${id}/ai-lab`);
        router.prefetch(`/dashboard/edit/${id}/history`);
        router.prefetch(`/dashboard/edit/${id}/json`);
        router.prefetch(`/dashboard/edit/${id}/share`);
      }
    }
    loadResumeForEdit(id);
  }, [id, loadResumeForEdit, isStoreLoading, resumes, router]);

  // 追踪编辑器查看事件
  useEffect(() => {
    if (activeResume && !isStoreLoading) {
      traceEditorViewed({
        resumeId: activeResume.id,
        templateId: activeResume.template,
        resumeName: activeResume.name
      });
    }
  }, [activeResume?.id, activeResume?.template, activeResume?.name, isStoreLoading, traceEditorViewed]); // eslint-disable-line react-hooks/exhaustive-deps

  // 同步activeResume的template到currentTemplateId
  useEffect(() => {
    if (activeResume?.template && activeResume.template !== currentTemplateId) {
      setCurrentTemplateId(activeResume.template);
    }
  }, [activeResume?.template, currentTemplateId]);

  // 保存简历
  const handleSave = async () => {
    if (isSaving) return;
    
    setIsSaving(true);
    console.log('[Save] Starting manual save process...');
    try {
      if (activeResume) {
        traceResumeSaved({
          resumeId: activeResume.id,
          resumeName: activeResume.name
        });
      }
      
      console.log('[Save] Calling store saveResume...');
      
      const token = cloudSync ? await getToken() : undefined;
      
      console.log('[Save] Calling store saveResume...');
      // Let the store handle the full manual save process (metadata, cloud sync, and versioning)
      // Pass activeResume explicitly to avoid stale state in async save
      await saveActiveResumeToResumes(token as string | undefined, 'manual', activeResume || undefined);
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

  // 自动同步逻辑 - 10000ms (10s) 防抖
  const debouncedSync = useMemo(
    () => debounce(async (token: string) => {
      await syncToCloud(token);
    }, 10000),
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

        const token = await getToken();
        if (token) {
          debouncedSync(token);
          // Update ref to prevent re-triggering for same update
          lastUpdatedAtRef.current = activeResume.updatedAt;
        }
      }
    };
    
    triggerSync();
    
    return () => {
      debouncedSync.cancel();
    };
  }, [activeResume, cloudSync, isStoreLoading, getToken, debouncedSync]);

  // 选择模板
  const handleSelectTemplate = (templateId: string) => {
    if (activeResume) {
      traceTemplateChanged({
        oldTemplate: currentTemplateId,
        newTemplate: templateId,
        resumeName: activeResume.name
      });
    }
    setCurrentTemplateId(templateId);
    updateTemplate(templateId);
  };

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
      <div className="flex h-screen bg-black text-white items-center justify-center">
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
          {(sectionOrder || []).map(({ key }, index) => {
            const isLast = index === (sectionOrder?.length || 0) - 1;
            return (
              <SortableSection key={key} id={key} disabled={key === 'basics' || isAnyModalOpen}>
                {key === 'basics' && (
                  <div ref={sectionRefs.basics} className={`scroll-mt-24 ${isLast ? '' : 'mb-8'}`} id="basics">
                    <h2 className="text-2xl font-bold flex items-center gap-3 mb-8"><FaUser className="text-[16px]" /> {t('editPage.sections.basics')}</h2>
                    <BasicForm
                      info={info!}
                      updateInfo={updateInfo}
                    />
                  </div>
                )}
                {key !== 'basics' && (
                  <div ref={sectionRefs[key as keyof typeof sectionRefs]} key={key} id={key} className="scroll-mt-24 pl-1">
                    <SectionListWithModal
                      icon={sidebarMenu.find(s => s.key === key)?.icon || FaUser}
                      label={sidebarMenu.find(s => s.key === key)?.label || ''}
                      fields={(dynamicFormFields[key as keyof typeof dynamicFormFields] || []).map(f => ({ name: f.key, label: t(f.labelKey), placeholder: f.placeholderKey ? t(f.placeholderKey) : '', required: f.required }))}
                      richtextKey="summary"
                      richtextPlaceholder="..."
                      /* eslint-disable @typescript-eslint/no-explicit-any */
                      itemRender={sidebarMenu.find(s => s.key === key)?.itemRender as any}
                      /* eslint-disable @typescript-eslint/no-explicit-any */
                      items={(sectionItems?.[key as keyof Section] ?? []).map((item: { id: any; }) => ({ ...item, id: String(item.id) })) as any}
                      setItems={(items) => updateSectionItems(key, items as SectionItem[])}
                      className={isLast ? 'mb-0' : ''}
                      onModalStateChange={setIsAnyModalOpen}
                    />
                  </div>
                )}
              </SortableSection>
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
        setPreviewScale={setPreviewScale}
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
      />
    );
  }

  return (
    <>
      <main className="flex h-screen bg-black text-white flex-1">
        {/* 左侧简历内容 */}
        <div className="w-[300px] transition-all duration-300 bg-transparent h-full">
          <ResumeContent
            renderSections={renderSections}
            handleSave={handleSave}
            onShowJson={openJsonModal}
            isSaving={isSaving}
          />
        </div>
        <div
          className='flex-1 flex items-center justify-center bg-black relative transition-all duration-300'
          style={{
            marginRight: rightCollapsed ? '56px' : '280px'
          }}
        >
          <HeaderTab
            title={activeResume?.name}
            updatedAt={activeResume?.updatedAt}
            syncStatus={syncStatus}
          />
          {/* 简历预览面板 */}
          <ResumePreviewPanel
            activeResume={activeResume}
            previewScale={previewScale}
            setPreviewScale={setPreviewScale}
            onShowAI={openAIModal}
            onVersionClick={openVersionHistory}
            isAiJobRunning={isAiGenerating}
            rightCollapsed={rightCollapsed}
            onShareClick={openShareModal}
          />
        </div>
      </main>

      {/* 模板面板 */}
      <TemplatePanel
        rightCollapsed={rightCollapsed}
        setRightCollapsed={setRightCollapsed}
        onSelectTemplate={handleSelectTemplate}
        currentTemplateId={currentTemplateId}
      />
    </>
  );
}