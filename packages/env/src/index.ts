const hasClerkKey = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

export const APP_MODE =
  process.env.NEXT_PUBLIC_APP_MODE || (hasClerkKey ? 'cloud' : 'self-hosted');

export const isCloudMode = APP_MODE === 'cloud';
export const isSelfHosted = !isCloudMode;
