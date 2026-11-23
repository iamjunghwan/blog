import type { Metadata } from "next";
import AdminDashboard from "@/components/Admin/AdminDashboard";
import { allPosts } from "@/app/lib/posts/load/repository";
import type { ArticleRef } from "@/app/lib/analytics/articles";

// 혼자 보는 페이지다. 검색엔진에 올리지 않는다 (robots.ts에서도 막는다).
export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default function Page() {
  // 클라이언트로는 slug·제목·언어만 넘긴다. 본문을 HTML에 싣지 않는다.
  const articles: ArticleRef[] = allPosts()
    .filter((post) => !post.draft)
    .map(({ slug, title, lang }) => ({ slug, title, lang }));

  return <AdminDashboard articles={articles} />;
}
