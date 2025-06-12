/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/manifest.json',
        destination: '/miniapp.json',
      },
      {
        source: '/.well-known/farcaster.json',
        destination: '/.well-known/farcaster.json',
      },
      {
        source: '/.well-known/frame',
        destination: '/api/frame'
      },
      // {
      //   source: '/.well-known/fc-validation',
      //   destination: '/api/fc-validation'
      // }
    ];
  },
}

module.exports = nextConfig 