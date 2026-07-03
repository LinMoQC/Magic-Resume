// Cross-app links. Leave PUBLIC_WEB_ORIGIN empty for same-origin deployments,
// or set it to the real web service origin when landing is deployed separately.
const WEB_ORIGIN = normalizeOrigin(
  import.meta.env.PUBLIC_WEB_ORIGIN ?? import.meta.env.PUBLIC_APP_ORIGIN ?? '',
);

function normalizeOrigin(origin: string): string {
  return origin.trim().replace(/\/+$/, '');
}

export const APP_LINKS = {
  dashboard: `${WEB_ORIGIN}/dashboard`,
} as const;

export const GITHUB = {
  repo: 'https://github.com/LinMoQC/Magic-Resume',
  issues: 'https://github.com/LinMoQC/Magic-Resume/issues',
  contributors: 'https://github.com/LinMoQC/Magic-Resume/graphs/contributors',
  contribImage: 'https://contrib.rocks/image?repo=LinMoQC/Magic-Resume',
  owner: 'LinMoQC',
  name: 'Magic-Resume',
} as const;

export const CONTACT_EMAIL = 'linmoeqc@qq.com';
