'use client';

import { useRouter } from 'next/navigation';
import { useResumeStore, getSanitizedResume } from '@/store/useResumeStore';
import JsonModal from '@/app/dashboard/edit/_components/modals/JsonModal';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { appLifecycle } from '@/lib/extensions/app-lifecycle';

export default function JsonModalPage() {
  const router = useRouter();
  const { activeResume } = useResumeStore();
  const { t } = useTranslation();

  const handleClose = () => router.back();

  const handleDownloadJson = () => {
    if (activeResume) {
      appLifecycle.resumeJsonDownloaded({ source: 'json_modal' });
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
    <JsonModal
      isJsonModalOpen={true}
      closeJsonModal={handleClose}
      handleDownloadJson={handleDownloadJson}
      activeResume={activeResume}
      t={t}
    />
  );
}
