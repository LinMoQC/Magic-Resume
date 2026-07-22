'use client';

import { useResumeStore } from '@/store/useResumeStore';
import VersionHistoryDialog from '@/app/dashboard/edit/_components/modals/VersionHistoryDialog';
import { useEffect, useState } from 'react';
import { useSettingStore } from '@/store/useSettingStore';
import { useInterceptModalRoute } from '@/hooks/useInterceptModalRoute';

export default function HistoryModalPage() {
  const { open, close } = useInterceptModalRoute();
  const cloudSync = useSettingStore(state => state.cloudSync);
  const { activeResume, refreshCloudVersions, restoreVersion, deleteVersion } = useResumeStore();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadHistory = async () => {
      if (activeResume && cloudSync) {
        setIsLoading(true);
        try {
          await refreshCloudVersions(activeResume.id);
        } finally {
          setIsLoading(false);
        }
      }
    };
    loadHistory();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleRestoreVersion = (versionId: string) => {
    restoreVersion(versionId);
    close();
  };

  if (!activeResume) return null;

  return (
    <VersionHistoryDialog
      isOpen={open}
      onClose={close}
      onRestore={handleRestoreVersion}
      onDelete={async (versionId: string) => {
        if (activeResume) {
          await deleteVersion(activeResume.id, versionId);
        }
      }}
      versions={activeResume?.versions || []}
      isLoading={isLoading}
    />
  );
}
