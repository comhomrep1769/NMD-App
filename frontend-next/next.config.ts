import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
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
