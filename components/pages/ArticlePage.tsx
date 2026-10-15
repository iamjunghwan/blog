import { notFound } from "next/navigation";
import { allPosts } from "@/app/lib/posts/repository";
import { postBySlug, postsIn } from "@/app/lib/posts/queries";
import { renderPostBody } from "@/app/lib/posts/render";
import ArticleContent from "@/app/[slug]/components/ArticleContent";
import type { Lang } from "@/app/lib/posts/types";

const ArticlePage = ({ lang, slug }: { lang: Lang; slug: string }) => {
  // 반드시 그 언어의 글에서 찾는다. 두 언어판은 slug이 같아서, 전체에서 찾으면
  // 정렬상 앞서는 쪽이 잡혀 한국어 주소가 영어 본문을 내보낸다.
  const post = postBySlug(postsIn(allPosts(), lang), slug);

  if (post === undefined) {
    notFound();
  }

  return <ArticleContent content={renderPostBody(post.body)} />;
};

export default ArticlePage;
