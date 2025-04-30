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
  basePath: "", // basePath가 설정되어 있지 않은지 확인
  assetPrefix: "", // assetPrefix가 잘못 설정되지 않았는지 확인
  experimental: {
    serverActions: {
      bodySizeLimit: "20mb", // 원하는 크기로 설정 (예: 5MB)
    },
  },
};

export default nextConfig;
