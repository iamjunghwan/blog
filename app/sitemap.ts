import type { MetadataRoute } from "next";
import { allPosts } from "@/app/lib/posts/repository";
import { postListUrls } from "@/app/lib/posts/queries";

const BASE_URL = "https://iaman.kr";

// 정적 export에서는 메타데이터 라우트도 빌드 타임에 고정된 정적 파일로
// 내보내야 한다는 것을 Next에 명시해야 한다.
export const dynamic = "force-static";

/**
 * next-sitemap을 대체하는 Next 메타데이터 라우트.
 * 빌드 산출물(out/sitemap.xml)에 직접 포함되어, 빌드 후 public/에 쓰던
 * next-sitemap과 달리 정적 export 결과에 항상 반영된다.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const posts = allPosts();
  const latestDate = posts[0]?.date;

  return [
    { url: BASE_URL, lastModified: latestDate },
    { url: `${BASE_URL}/about` },
    ...posts.map((post) => ({
      url: `${BASE_URL}/${post.slug}`,
      lastModified: post.date,
    })),
    ...postListUrls(posts).map((path) => ({
      url: `${BASE_URL}${path}`,
      lastModified: latestDate,
    })),
  ];
}
