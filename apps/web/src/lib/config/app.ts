// If NEXT_PUBLIC_APP_MODE is explicitly set, use it.
// Otherwise fall back to auto-detection: if Clerk keys are present assume cloud,
// else self-hosted. This keeps existing deployments working without changes.
const hasClerkKey = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
export const APP_MODE =
  process.env.NEXT_PUBLIC_APP_MODE || (hasClerkKey ? 'cloud' : 'self-hosted');

export const isCloudMode = APP_MODE === 'cloud';
export const isSelfHosted = !isCloudMode;
