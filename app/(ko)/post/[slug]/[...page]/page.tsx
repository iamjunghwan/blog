import PostListPage from "@/components/pages/PostListPage";
import { allPosts } from "@/app/lib/posts/repository";
import { postListParams, postsIn } from "@/app/lib/posts/queries";

export function generateStaticParams() {
  return postListParams(postsIn(allPosts(), "ko"));
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string; page: string[] }>;
}) {
  const { slug, page } = await params;
  return <PostListPage lang="ko" tag={slug} page={Number(page[0])} />;
}
