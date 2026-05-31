/** @type {import('next').NextConfig} */
console.log('[NextConfig] API URL:', process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'NOT FOUND');
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  transpilePackages: ['@yukizi/ui', '@yukizi/api-client', '@yukizi/utils', 'framer-motion'],
  reactStrictMode: true,
  compiler: { removeConsole: process.env.NODE_ENV === 'production' },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: 'localhost' },
    ],
  },
  rewrites: async () => [
    { source: '/api/:path*', destination: `${process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000/api'}/:path*` },
    { source: '/blog', destination: '/blogs' },
    { source: '/blog/:path*', destination: '/blogs/:path*' },
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.worldvectorlogo.com",
      },
    ],
  },
};

module.exports = nextConfig;
