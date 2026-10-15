import { notFound } from "next/navigation";
import { allPosts } from "@/app/lib/posts/repository";
import { postBySlug, postsIn } from "@/app/lib/posts/queries";
import { renderPostBody } from "@/app/lib/posts/render";
import ArticleContent from "./components/ArticleContent";

// 지금은 한국어 글만 있어 결과가 같다. 영어 글이 들어오면 postBySlug의 find가 정렬상
// 앞서는 영어판을 집어 한국어 URL이 영어 본문을 내보내므로 미리 고정한다.
// 다음 단계에서 "ko"가 라우트 언어로 바뀐다.
const LANG = "ko";

export function generateStaticParams() {
  return postsIn(allPosts(), LANG).map((post) => ({ slug: post.slug }));
}

export default async function SlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = postBySlug(postsIn(allPosts(), LANG), slug);

  if (post === undefined) {
    notFound();
  }

  return <ArticleContent content={renderPostBody(post.body)} />;
}
