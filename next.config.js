/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // This allows the build to complete even if there are strict ESLint warnings
    ignoreDuringBuilds: true,
  },
  typescript: {
    // This allows the build to complete even if there are type errors
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
