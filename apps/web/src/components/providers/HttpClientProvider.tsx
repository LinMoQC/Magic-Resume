"use client";

import { useAuth } from '@clerk/nextjs';
import { useEffect } from 'react';
import { configureHttpClient } from '@/lib/api/httpClient';

/**
 * Provider component that configures the HTTP client with Clerk authentication
 * This should be placed high in the component tree (e.g., in the root layout)
 */
export function HttpClientProvider({ children }: { children: React.ReactNode }) {
  const { getToken } = useAuth();

  useEffect(() => {
    // Configure HTTP client to automatically use Clerk token
    configureHttpClient(async () => {
      try {
        return await getToken();
      } catch (error) {
        console.error('Failed to get Clerk token:', error);
        return null;
      }
    });
  }, [getToken]);

  return <>{children}</>;
}
