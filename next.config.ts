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
};

export default nextConfig;
