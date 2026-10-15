import ArticlePage from "@/components/pages/ArticlePage";
import { allPosts } from "@/app/lib/posts/repository";
import { postsIn } from "@/app/lib/posts/queries";

export function generateStaticParams() {
  // 영어판이 있는 글만 /en 아래에 생긴다. 없는 글은 영어 쪽에 내지 않는다.
  return postsIn(allPosts(), "en").map((post) => ({ slug: post.slug }));
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <ArticlePage lang="en" slug={slug} />;
}
