'use client';

import { useParams, useRouter } from 'next/navigation';
import { useResumeStore, getSanitizedResume } from '@/store/useResumeStore';
import JsonModal from '@/app/dashboard/edit/_components/modals/JsonModal';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useTrace } from '@/hooks/useTrace';
import { useEffect } from 'react';

export default function JsonModalPage() {
  const router = useRouter();
  const params = useParams();
  const { activeResume, loadResumeForEdit } = useResumeStore();
  const { t } = useTranslation();
  const { traceDownloadJson } = useTrace();
  const id = params.id as string;

  // Load resume if not present (handling refresh case)
  useEffect(() => {
    if (!activeResume || activeResume.id !== id) {
       loadResumeForEdit(id);
    }
  }, [id, activeResume, loadResumeForEdit]);

  const handleClose = () => router.push(`/dashboard/edit/${id}`);

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

  if (!activeResume) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <JsonModal
        isJsonModalOpen={true}
        closeJsonModal={handleClose}
        handleDownloadJson={handleDownloadJson}
        activeResume={activeResume}
        t={t}
        />
    </div>
  );
}
