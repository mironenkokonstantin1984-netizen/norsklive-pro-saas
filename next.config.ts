import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/',
          destination: '/index.html'
        }
      ],
      afterFiles: [],
      fallback: []
    };
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'Permissions-Policy',
            value: 'microphone=(self), camera=()'
          }
        ]
      }
    ];
  },
  async redirects() {
    return [
      {
        source: '/norsk',
        destination: '/',
        permanent: true
      },
      {
        source: '/norsk/:path*',
        destination: '/',
        permanent: true
      }
    ];
  }
};

export default nextConfig;
