import type { MetadataRoute } from "next";
import { SITE_URL } from "@/app/lib/site";
import { allPosts } from "@/app/lib/posts/repository";
import { postListUrls, postsIn } from "@/app/lib/posts/queries";

// 정적 export에서는 메타데이터 라우트도 빌드 타임에 고정된 정적 파일로
// 내보내야 한다는 것을 Next에 명시해야 한다.
export const dynamic = "force-static";

/**
 * next-sitemap을 대체하는 Next 메타데이터 라우트.
 * 빌드 산출물(out/sitemap.xml)에 직접 포함되어, 빌드 후 public/에 쓰던
 * next-sitemap과 달리 정적 export 결과에 항상 반영된다.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  // 한 URL이 두 줄 들어가지 않도록 언어를 고정한다. 지금은 한국어 글만 있어 결과가 같고,
  // 영어 글이 들어오면 같은 slug가 중복된다. 다음 단계에서 "ko"가 언어별 사이트맵으로 바뀐다.
  const posts = postsIn(allPosts(), "ko");
  const latestDate = posts[0]?.date;

  return [
    { url: SITE_URL, lastModified: latestDate },
    { url: `${SITE_URL}/about` },
    ...posts.map((post) => ({
      url: `${SITE_URL}/${post.slug}`,
      lastModified: post.date,
    })),
    ...postListUrls(posts).map((path) => ({
      url: `${SITE_URL}${path}`,
      lastModified: latestDate,
    })),
  ];
}
