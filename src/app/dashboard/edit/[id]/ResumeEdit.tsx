"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { Resume, useResumeStore } from '@/store/useResumeStore';
import { FaUser } from 'react-icons/fa';
import BasicForm from '../_components/BasicForm';
import sidebarMenu from '@/constant/sidebarMenu';
import dynamic from 'next/dynamic';
import SectionListWithModal from '../_components/SectionListWithModal';
import { dynamicFormFields } from '@/constant/dynamicFormFields';
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
import ResumeEditSkeleton from './ResumeEditSkeleton';
import TemplatePanel from './TemplatePanel';
import ResumeContent from './ResumeContent';
import { Section, SectionItem } from '@/store/useResumeStore';
import useMobile from '@/app/hooks/useMobile';
import MobileResumEdit from '../_components/mobile/MobileResumEdit';
import { generateSnapshot } from '@/lib/utils';
import AIModal from '../_components/AIModal';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import JsonModal from '../_components/JsonModal';

const ResumePreviewPanel = dynamic(() => import('../_components/ResumePreviewPanel'), { 
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
    updateInfo,
    setSectionOrder: updateSectionOrder,
    updateSectionItems,
    updateSections,
    updateTemplate,
    rightCollapsed,
    setRightCollapsed,
    activeSection,
    isStoreLoading,
    resumes,
  } = useResumeStore();

  const { isMobile } = useMobile();
  const [leftPanelOpen, setLeftPanelOpen] = useState(false);
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [isAnyModalOpen, setIsAnyModalOpen] = useState(false);
  const [currentTemplateId, setCurrentTemplateId] = useState(activeResume?.template || 'classic');
  const [resumeNotFound, setResumeNotFound] = useState(false);

  const [previewScale, setPreviewScale] = useState(1);
  const [isJsonModalOpen, setIsJsonModalOpen] = useState(false);
  const openJsonModal = () => setIsJsonModalOpen(true);
  const closeJsonModal = () => setIsJsonModalOpen(false);

  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [isAiJobRunning, setIsAiJobRunning] = useState(false);
  const openAIModal = () => setIsAIModalOpen(true);
  const closeAIModal = () => setIsAIModalOpen(false);
  const { t } = useTranslation();

  const handleApplyFullResume = (newResume: Resume) => {
    updateInfo(newResume.info);
    updateSections(newResume.sections);
    if (newResume.sectionOrder) {
      updateSectionOrder(newResume.sectionOrder);
    }
  };

  // 下载简历json
  const handleDownloadJson = () => {
    if (!activeResume) return;
    const jsonString = JSON.stringify(activeResume, null, 2);
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
      }
    }
    loadResumeForEdit(id);
  }, [id, loadResumeForEdit, isStoreLoading, resumes]);

  // 同步activeResume的template到currentTemplateId
  useEffect(() => {
    if (activeResume?.template && activeResume.template !== currentTemplateId) {
      setCurrentTemplateId(activeResume.template);
    }
  }, [activeResume?.template, currentTemplateId]);

  // 保存简历
  const handleSave = async () => {
    const snapshot = await generateSnapshot();
    saveActiveResumeToResumes(snapshot ?? undefined);
  };

  // 选择模板
  const handleSelectTemplate = (templateId: string) => {
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
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      itemRender={sidebarMenu.find(s => s.key === key)?.itemRender as any}
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      items={(sectionItems?.[key as keyof Section] ?? []).map(item => ({...item, id: String(item.id)})) as any}
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
        info={info}
        sectionItems={sectionItems}
        sectionOrder={sectionOrder}
        activeResume={activeResume}
        setPreviewScale={setPreviewScale}
        leftPanelOpen={leftPanelOpen}
        setLeftPanelOpen={setLeftPanelOpen}
        rightPanelOpen={rightPanelOpen}
        setRightPanelOpen={setRightPanelOpen}
        isJsonModalOpen={isJsonModalOpen}
        closeJsonModal={closeJsonModal}
        openJsonModal={openJsonModal}
        handleCopyJson={handleDownloadJson}
        renderSections={renderSections}
        handleSave={handleSave}
        onShowAI={openAIModal}
        isAiJobRunning={isAiJobRunning}
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
          />
        </div>
        <div 
          className='flex-1 flex items-center justify-center bg-black relative transition-all duration-300' 
          style={{ 
            marginRight: rightCollapsed ? '56px' : '280px' 
          }}
        >
          {/* 简历预览面板 */}
        <ResumePreviewPanel
          info={info}
          sections={sectionItems}
          sectionOrder={sectionOrder.map(s => s.key)}
          previewScale={previewScale}
          setPreviewScale={setPreviewScale}
          onShowAI={openAIModal}
          templateId={currentTemplateId}
          customTemplate={activeResume.customTemplate}
          isAiJobRunning={isAiJobRunning}
          themeColor={activeResume.themeColor}
          rightCollapsed={rightCollapsed}
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

      {/* Json Modal */}
      <JsonModal
        isJsonModalOpen={isJsonModalOpen}
        closeJsonModal={closeJsonModal}
        handleDownloadJson={handleDownloadJson}
        activeResume={activeResume}
        t={t}
      />

      {/* AI Modal */}
      <AIModal 
        isOpen={isAIModalOpen}
        onClose={closeAIModal}
        resumeData={activeResume}
        onApplySectionChanges={updateSections}
        onApplyFullResume={handleApplyFullResume}
        templateId={currentTemplateId}
        isAiJobRunning={isAiJobRunning}
        setIsAiJobRunning={setIsAiJobRunning}
      />
    </>
  );
} 