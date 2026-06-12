'use client';

import { useRouter } from 'next/navigation';
import { useResumeStore } from '@/store/useResumeStore';
import VersionHistoryDialog from '@/app/dashboard/edit/_components/modals/VersionHistoryDialog';
import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useSettingStore } from '@/store/useSettingStore';

export default function HistoryModalPage() {
  const router = useRouter();
  const { getToken } = useAuth();
  const cloudSync = useSettingStore(state => state.cloudSync);
  const { 
    activeResume, 
    fetchCloudResume, 
    restoreVersion, 
    deleteVersion 
  } = useResumeStore();

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadHistory = async () => {
        if (activeResume && cloudSync) {
            const token = await getToken();
            if (token) {
              setIsLoading(true);
              try {
                await fetchCloudResume(activeResume.id, token);
              } finally {
                setIsLoading(false);
              }
            }
          }
    };
    loadHistory();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleOpenChange = (open: boolean) => {
    if (!open) {
      router.back();
    }
  };

  const handleRestoreVersion = (versionId: string) => {
    restoreVersion(versionId);
    handleOpenChange(false);
  };

  if (!activeResume) return null;

  return (
    <VersionHistoryDialog
        isOpen={true}
        onClose={() => handleOpenChange(false)}
        onRestore={handleRestoreVersion}
        onDelete={async (versionId: string) => {
          const token = await getToken();
          if (activeResume) {
            await deleteVersion(activeResume.id, versionId, token || undefined);
          }
        }}
        versions={activeResume?.versions || []}
        isLoading={isLoading}
    />
  );
}
