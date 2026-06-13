export const APP_MODE = process.env.NEXT_PUBLIC_APP_MODE || 'self-hosted';
export const isCloudMode = APP_MODE === 'cloud';
export const isSelfHosted = !isCloudMode;
