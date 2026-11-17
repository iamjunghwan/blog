import type { NextConfig } from "next";

// SVG 로더(@svgr/webpack)를 걷어냈다. 아이콘 4개를 쓰자고 babel·svgo를 포함해
// 117개 패키지를 들이고 있었다. 지금은 components/Icon/ 에 직접 적는다.
const nextConfig: NextConfig = {
  output: "export",

  experimental: {
    // 보안 권고가 나온 버전만 알려 준다. next dev 가 띄우는 업그레이드 안내를
    // 끄는 게 아니라, 보안 건으로 범위를 좁히는 설정이다.
    agentUpgrade: "security",
  },
};

export default nextConfig;
