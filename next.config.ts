import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // 移除错误忽略，确保构建时捕获所有问题
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
};

export default nextConfig;
