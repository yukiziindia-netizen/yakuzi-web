/** @type {import('next').NextConfig} */
console.log('[NextConfig] API URL:', process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'NOT FOUND');

// Origin of the API, for the preconnect hint sent with every document.
const apiOrigin = (() => {
  try {
    return new URL(
      process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.dev.yukizi.com/api',
    ).origin;
  } catch {
    return 'https://api.dev.yukizi.com';
  }
})();

const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  transpilePackages: ['@yukizi/ui', '@yukizi/api-client', '@yukizi/utils', 'framer-motion'],
  reactStrictMode: true,
  compiler: { removeConsole: process.env.NODE_ENV === 'production' },
  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 3600,
    remotePatterns: [
      { protocol: 'https', hostname: 'cdn.worldvectorlogo.com' },
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: 'localhost' },
    ],
  },
  rewrites: async () => [
    { source: '/api/:path*', destination: `${process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api'}/:path*` },
    { source: '/blog', destination: '/blogs' },
    { source: '/blog/:path*', destination: '/blogs/:path*' },
  ],
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        // The browser opens the TCP+TLS connection to the API while the page
        // is still parsing, instead of when the first XHR fires.
        { key: 'Link', value: `<${apiOrigin}>; rel=preconnect; crossorigin` },
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        // Voice search uses SpeechRecognition, so the microphone stays allowed.
        { key: 'Permissions-Policy', value: 'camera=(), geolocation=(), microphone=(self)' },
      ],
    },
    {
      // Public catalogue pages, cached at the edge.
      //
      // These were served `private, no-store` with a CDN miss on every single
      // request, so every visitor and every crawler reached the origin. They
      // hold nothing personal — cart and session are client-side — so a short
      // shared cache is safe, and stale-while-revalidate means a visitor never
      // waits for a refresh.
      //
      // Set here rather than per page because a dynamic segment that reads
      // searchParams cannot use `revalidate`, and this applies whatever the
      // render mode turns out to be.
      source: '/:path((?!api|_next|admin).*)',
      headers: [
        { key: 'Cache-Control', value: 'public, s-maxage=120, stale-while-revalidate=600' },
      ],
    },
    {
      // Images under /public are served with max-age=0 by default, so every
      // navigation revalidates each of them. An hour of caching plus a day of
      // stale-while-revalidate removes those round trips without risking a
      // stale logo for long after a redeploy.
      source: '/:all*(svg|jpg|jpeg|png|webp|ico|gif)',
      headers: [
        { key: 'Cache-Control', value: 'public, max-age=3600, stale-while-revalidate=86400' },
      ],
    },
  ],
  assetPrefix: process.env.NODE_ENV === 'production' ? process.env.CDN_URL || '' : '',
};

module.exports = nextConfig;
