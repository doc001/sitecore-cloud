const publicUrl = process.env.PUBLIC_URL || '';
const sitecoreApiHost = process.env.SITECORE_API_HOST;

if (!sitecoreApiHost) {
  throw new Error('Missing SITECORE_API_HOST environment variable');
}

/**
 * @type {import('next').NextConfig}
 */
const nextConfig = {
  assetPrefix: publicUrl,
  distDir: process.env.NEXTJS_DIST_DIR || '.next',
  env: {
    PUBLIC_URL: publicUrl,
  },
  i18n: {
    locales: ['en'],
    defaultLocale: 'en', // optionally read from env if needed
  },
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'edge*.**',
        port: '',
      },
      {
        protocol: 'https',
        hostname: 'feaas*.blob.core.windows.net',
        port: '',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/sitecore/api/:path*',
        destination: `${sitecoreApiHost}/sitecore/api/:path*`,
      },
      {
        source: '/-/:path*',
        destination: `${sitecoreApiHost}/-/:path*`,
      },
      {
        source: '/healthz',
        destination: '/api/healthz',
      },
      {
        source: '/sitecore/service/:path*',
        destination: `${sitecoreApiHost}/sitecore/service/:path*`,
      },
    ];
  },
};

module.exports = () => {
  const plugins = require('./src/temp/next-config-plugins') || {};
  return Object.values(plugins).reduce((acc, plugin) => plugin(acc), nextConfig);
};
