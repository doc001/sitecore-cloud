/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
        unoptimized: true,
        remotePatterns: [
          {
            protocol: 'https',
            hostname: 'cdn.prod.website-files.com',
          },
        ],
      },
}

export default nextConfig