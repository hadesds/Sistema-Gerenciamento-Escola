/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
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
