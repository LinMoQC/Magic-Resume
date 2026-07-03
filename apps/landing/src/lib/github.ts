import { GITHUB } from '@/consts';

/**
 * Fetch the repo star count at build time (Astro frontmatter runs server-side).
 * Falls back to null on any failure so the page still renders. Re-runs on each
 * deploy; pair with a daily rebuild to keep it fresh (stars aren't real-time).
 */
export async function getStarCount(): Promise<number | null> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB.owner}/${GITHUB.name}`,
      {
        headers: {
          Accept: 'application/vnd.github+json',
          'User-Agent': 'magic-resume-landing',
          ...(process.env.GITHUB_TOKEN
            ? { Authorization: `Bearer ${process.env.GITHUB_TOKEN}` }
            : {}),
        },
      },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { stargazers_count?: number };
    return typeof data.stargazers_count === 'number'
      ? data.stargazers_count
      : null;
  } catch {
    return null;
  }
}

/** 1234 -> "1.2k" for compact display. */
export function formatStars(n: number): string {
  if (n < 1000) return String(n);
  return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`;
}
