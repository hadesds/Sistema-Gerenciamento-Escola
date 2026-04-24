const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5433';
const apiOrigin = new URL(apiUrl);

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: apiOrigin.protocol.replace(':', ''),
        hostname: apiOrigin.hostname,
        port: apiOrigin.port,
        pathname: '/media/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '5433',
        pathname: '/media/**',
      },
      {
        protocol: 'http',
        hostname: 'cara_app',
        port: '5433',
        pathname: '/media/**',
      },
    ],
  },
}

module.exports = nextConfig
