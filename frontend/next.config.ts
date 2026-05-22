import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Proxy API calls to the existing Express backend on Render
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`,
      },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'nmd-backend.onrender.com',
      },
    ],
  },
}

export default nextConfig
