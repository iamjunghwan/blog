import ArticlePage from "@/components/pages/ArticlePage";
import { allPosts } from "@/app/lib/posts/load/repository";
import { postsIn } from "@/app/lib/posts/query/queries";

export function generateStaticParams() {
  return postsIn(allPosts(), "ko").map((post) => ({ slug: post.slug }));
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <ArticlePage lang="ko" slug={slug} />;
}
