const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable React strict mode for better development experience
  reactStrictMode: true,

  // Disable server-side rendering for Monaco Editor
  transpilePackages: ['@monaco-editor/react'],

  // Turbopack config (Next.js 16+)
  turbopack: {
    root: __dirname,
  },

  // Exclude native modules from client-side bundling
  serverExternalPackages: ['node-pty'],

  // Webpack config for native modules and path resolution
  webpack: (config, { isServer }) => {
    // Ensure @/ alias resolves correctly even when running from node_modules
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname),
    };

    if (!isServer) {
      // Don't bundle node-pty on client side
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        child_process: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },

  // Security headers for local development
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
