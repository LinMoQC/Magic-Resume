'use client';

import { useRouter } from 'next/navigation';

import { ShareModal } from '@/app/dashboard/edit/_components/modals/ShareModal';

export default function ShareModalPage() {
  const router = useRouter();
  
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      router.back();
    }
  };

  return (
    <ShareModal
      isOpen={true}
      onClose={() => handleOpenChange(false)}
    />
  );
}
