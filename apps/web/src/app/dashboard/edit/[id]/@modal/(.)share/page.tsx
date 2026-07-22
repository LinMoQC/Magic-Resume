'use client';

import { ShareModal } from '@/app/dashboard/edit/_components/modals/ShareModal';
import { useInterceptModalRoute } from '@/hooks/useInterceptModalRoute';

export default function ShareModalPage() {
  const { open, close } = useInterceptModalRoute();

  return (
    <ShareModal
      isOpen={open}
      onClose={close}
    />
  );
}
