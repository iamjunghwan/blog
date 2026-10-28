import type { NextConfig } from "next";

// SVG 로더(@svgr/webpack)를 걷어냈다. 아이콘 4개를 쓰자고 babel·svgo를 포함해
// 117개 패키지를 들이고 있었다. 지금은 components/Icon/ 에 직접 적는다.
const nextConfig: NextConfig = {
  output: "export",
};

export default nextConfig;
