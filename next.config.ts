import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
    dirs: ['app', 'components', 'lib', 'types', 'data'], // Only lint actual app directories
  },
  // Keep the dev file-watcher off the parallel workspaces. NB: this only affects
  // watching — the actual exclusion from compilation comes from `exclude` in
  // tsconfig.json.
  webpack: (config) => {
    config.watchOptions = {
      ignored: [
        '**/design upgrade/**',
        '**/no_bus/**',
        '**/Digital Maturity Assessment Tool/**',
        '**/node_modules/**',
      ],
    };
    return config;
  },
};

export default nextConfig;
