import type { MetadataRoute } from "next";

const BASE_URL = "https://iaman.kr";

// 정적 export에서는 메타데이터 라우트도 빌드 타임에 고정된 정적 파일로
// 내보내야 한다는 것을 Next에 명시해야 한다.
export const dynamic = "force-static";

/** next-sitemap이 만들던 robots.txt를 대체하는 Next 메타데이터 라우트. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/" }],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
