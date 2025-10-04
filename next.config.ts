import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
    dirs: ['app', 'components', 'lib', 'types', 'data'], // Only lint actual app directories
  },
  // Exclude design upgrade folder from compilation
  webpack: (config) => {
    config.watchOptions = {
      ignored: ['**/design upgrade/**', '**/node_modules/**'],
    };
    return config;
  },
};

export default nextConfig;
