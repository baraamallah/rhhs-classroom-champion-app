import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rhhs-eco-champion.vercel.app'

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/about',
          '/winners',
        ],
        disallow: [
          '/admin',
          '/admin/*',
          '/supervisor',
          '/supervisor/*',
          '/api/*',
          '/login',
          '/signup',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
