/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },
  transpilePackages: ["@yukizi/utils"],
  compiler: { removeConsole: process.env.NODE_ENV === "production" },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: 'localhost' },
    ],
  },
  rewrites: async () => ({
    beforeFiles: [
      { source: '/api/:path*', destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'}/:path*` },
    ],
  }),
  assetPrefix: process.env.NODE_ENV === 'production' ? process.env.CDN_URL || '' : '',
};
module.exports = nextConfig;
