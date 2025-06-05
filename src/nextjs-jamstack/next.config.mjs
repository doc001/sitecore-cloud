/** @type {import('next').NextConfig} */

const nextConfig = {
  trailingSlash: true,
  images: {
        remotePatterns: [
          {
            protocol: 'https',
            hostname: 'cdn.prod.website-files.com',
          },
        ],
      },
  env: {
    SITECORE_GRAPHQL_ENDPOINT: process.env.SITECORE_GRAPHQL_ENDPOINT,
    SITECORE_GRAPHQL_API_KEY:   process.env.SITECORE_GRAPHQL_API_KEY,
  },
}

export default nextConfig