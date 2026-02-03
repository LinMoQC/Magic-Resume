'use client';

import { useRouter } from 'next/navigation';
import { useResumeStore } from '@/store/useResumeStore';
import AIModal from '../../../_components/modals/AIModal';

export default function AIModalPage() {
  const router = useRouter();
  const { 
    activeResume, 
    updateSections, 
    applyFullResume, 
    isAiGenerating, 
    setIsAiGenerating,
  } = useResumeStore();

  const templateId = activeResume?.template || 'classic';

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      router.back();
    }
  };

  if (!activeResume) return null;

  return (
    <AIModal
      isOpen={true}
      onClose={() => handleOpenChange(false)}
      resumeData={activeResume}
      onApplySectionChanges={updateSections}
      onApplyFullResume={applyFullResume}
      templateId={templateId}
      isAiJobRunning={isAiGenerating}
      setIsAiJobRunning={setIsAiGenerating}
    />
  );
}
