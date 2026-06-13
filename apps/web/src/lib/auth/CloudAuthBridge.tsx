'use client';

// This component is ONLY rendered inside ClerkProvider (cloud mode).
// It calls Clerk hooks and feeds values into AppAuthContext so the rest
// of the app never needs to import from @clerk/nextjs directly.

import { useAuth, useUser, useClerk } from '@clerk/nextjs';
import { AppAuthContext, AppUser } from './context';

export function CloudAuthBridge({ children }: { children: React.ReactNode }) {
  const { isSignedIn, userId, getToken } = useAuth();
  const { user } = useUser();
  const { redirectToSignIn } = useClerk();

  const appUser: AppUser | null = user
    ? {
        fullName: user.fullName,
        primaryEmailAddress: user.primaryEmailAddress
          ? { emailAddress: user.primaryEmailAddress.emailAddress }
          : null,
        imageUrl: user.imageUrl,
      }
    : null;

  return (
    <AppAuthContext.Provider
      value={{
        isSignedIn: isSignedIn ?? false,
        userId: userId ?? null,
        getToken: () => getToken(),
        user: appUser,
        redirectToSignIn,
      }}
    >
      {children}
    </AppAuthContext.Provider>
  );
}
