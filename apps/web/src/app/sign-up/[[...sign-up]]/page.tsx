import { redirect } from 'next/navigation';
import { isCloudMode } from '@/lib/config/app';
import SignUpCard from '@/components/auth/SignUpCard';

export default function Page() {
  if (!isCloudMode) redirect('/dashboard');
  return <SignUpCard />;
}
