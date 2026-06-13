"use client";

import { useAuth } from '@clerk/nextjs';
import { useEffect } from 'react';
import { configureHttpClient } from '@/lib/api/httpClient';

export function HttpClientProvider({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth();

  useEffect(() => {
    configureHttpClient(() => getToken());
  }, [getToken]);

  return <>{children}</>;
}
