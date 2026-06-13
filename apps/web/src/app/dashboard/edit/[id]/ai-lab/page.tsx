'use client';

import { useRouter } from 'next/navigation';
import { useResumeStore } from '@/store/useResumeStore';
import AIModal from '../../_components/modals/AIModal';
import { useParams } from 'next/navigation';
import { useEffect } from 'react';

export default function AIModalPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;


  const { 
    activeResume, 
    loadResumeForEdit,
    updateSections, 
    applyFullResume, 
    isAiGenerating, 
    setIsAiGenerating,
  } = useResumeStore();
  
  const templateId = activeResume?.template || 'classic';

  // Ensure resume is loaded if hitting this page directly
  useEffect(() => {
    if (id && (!activeResume || activeResume.id !== id)) {
       loadResumeForEdit(id);
    }
  }, [id, activeResume, loadResumeForEdit]);


  const handleOpenChange = (open: boolean) => {
    if (!open) {
      router.push(`/dashboard/edit/${id}`);
    }
  };

  if (!activeResume) return null;

  return (
    <div className="flex items-center justify-center min-h-screen bg-black">
        {/* Fallback for hard navigation: Just the modal */}
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
    </div>
  );
}
