"use client";

import { useEffect } from 'react';
import { configureHttpClient } from '@/lib/api/httpClient';
import { useAppAuth } from '@/lib/auth';

export function HttpClientProvider({ children }: { children: React.ReactNode }) {
  const { getToken } = useAppAuth();

  useEffect(() => {
    configureHttpClient(getToken);
  }, [getToken]);

  return <>{children}</>;
}
