/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  transpilePackages: ['react-syntax-highlighter'],
  
  // Environment variables configuration
  env: {
    API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000',
    DEBUG: process.env.NEXT_PUBLIC_DEBUG || 'false',
    LOG_LEVEL: process.env.NEXT_PUBLIC_LOG_LEVEL || 'info',
  },

  // Public runtime config
  publicRuntimeConfig: {
    apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000',
    debug: process.env.NEXT_PUBLIC_DEBUG === 'true',
    logLevel: process.env.NEXT_PUBLIC_LOG_LEVEL || 'info',
    isProduction: process.env.NODE_ENV === 'production',
  },

  // Webpack configuration for better environment handling
  webpack: (config, { dev, isServer }) => {
    // Add environment-specific configurations
    if (dev) {
      config.devtool = 'eval-source-map';
    }
    
    return config;
  },
}

module.exports = nextConfig