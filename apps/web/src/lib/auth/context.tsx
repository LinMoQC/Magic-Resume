'use client';

import { createContext, useContext } from 'react';

export interface AppUser {
  fullName: string | null;
  primaryEmailAddress: { emailAddress: string } | null;
  imageUrl?: string | null;
}

export interface AppAuthContextValue {
  isSignedIn: boolean;
  userId: string | null;
  getToken: () => Promise<string | null>;
  user: AppUser | null;
  redirectToSignIn: () => void;
  signOut: () => Promise<void>;
}

// Default: self-hosted values (no auth, always locally "signed in")
const defaultValue: AppAuthContextValue = {
  isSignedIn: true,
  userId: null,
  getToken: async () => null,
  user: { fullName: null, primaryEmailAddress: null, imageUrl: null },
  redirectToSignIn: () => {},
  signOut: async () => {},
};

export const AppAuthContext = createContext<AppAuthContextValue>(defaultValue);

export function useAppAuth(): AppAuthContextValue {
  return useContext(AppAuthContext);
}

export function useAppUser(): { user: AppUser | null } {
  const { user } = useContext(AppAuthContext);
  return { user };
}
