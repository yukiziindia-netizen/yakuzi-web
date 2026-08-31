import type { MetadataRoute } from 'next';
import { absoluteUrl } from '@/lib/seo/site';

const PRIVATE = ['/checkout', '/orders', '/payments', '/profile', '/wishlist',
  '/notifications', '/login', '/onboarding', '/support', '/credit', '/api/'];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: PRIVATE },
      // explicit welcome for AI crawlers (some check for their own UA block)
      { userAgent: ['GPTBot', 'ClaudeBot', 'Claude-Web', 'PerplexityBot', 'Google-Extended', 'Bingbot', 'cohere-ai'], allow: '/', disallow: PRIVATE },
    ],
    sitemap: [absoluteUrl('/sitemap.xml'), absoluteUrl('/image-sitemap.xml')],
  };
}
