import { redirect } from 'next/navigation';
import { isCloudMode } from '@/lib/config/app';
import SignInCard from '@/components/auth/SignInCard';

export default function Page() {
  if (!isCloudMode) redirect('/dashboard');
  return <SignInCard />;
}
