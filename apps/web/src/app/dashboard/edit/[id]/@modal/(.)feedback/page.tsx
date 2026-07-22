'use client';
import { FeedbackModal } from '@/app/dashboard/edit/_components/modals/FeedbackModal';
import { useInterceptModalRoute } from '@/hooks/useInterceptModalRoute';

export default function FeedbackModalPage() {
  const { open, close } = useInterceptModalRoute();

  return (
    <FeedbackModal
      open={open}
      onOpenChange={(next) => { if (!next) close(); }}
    />
  );
}
