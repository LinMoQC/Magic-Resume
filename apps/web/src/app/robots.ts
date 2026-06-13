import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://magic-resume.cn'
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/'
        ],
        disallow: [
          '/dashboard*',
          '/edit*', 
          '/api/*',
          '/sign-in*',
          '/sign-up*',
          '/*?*'  // 禁止带参数的URL
        ],
        crawlDelay: 1,
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        crawlDelay: 0,
      },
      {
        userAgent: 'Baiduspider',
        allow: '/',
        crawlDelay: 1,
      }
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
} 