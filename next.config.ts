import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: 'standalone',
  // 生产环境配置：暂时允许警告，但阻止错误
  typescript: {
    // TypeScript错误已修复，可以严格检查
    ignoreBuildErrors: false,
  },
  eslint: {
    // 暂时忽略ESLint警告，后续迭代优化
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
