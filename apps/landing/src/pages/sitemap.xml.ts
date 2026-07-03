import type { APIRoute } from 'astro';
import { LOCALES } from '@/i18n/ui';

// Small hand-rolled sitemap (two locale roots). Avoids a heavy dependency for
// what is, today, two URLs. Add entries here as the landing grows.
export const GET: APIRoute = ({ site }) => {
  const base = (site ?? new URL('https://magic-resume.cn')).origin;
  const urls = LOCALES.map((loc) => `${base}/${loc}`);
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u}</loc></url>`).join('\n')}
</urlset>
`;
  return new Response(body, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
