import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  webpack(config) {
    config.module.rules.push({
      test: /\.svg$/,
      use: ["@svgr/webpack"],
    });
    return config;
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb", // 원하는 크기로 설정 (예: 5MB)
    },
  },
  eslint: {
    ignoreDuringBuilds: true, // 이 설정을 추가하여 빌드 중 ESLint 오류 무시
  },
  typescript: {
    ignoreBuildErrors: true, // 이 설정을 추가하여 TypeScript 체크 오류 무시
  },
};

export default nextConfig;
