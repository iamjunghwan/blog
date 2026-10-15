import PostListPage from "@/components/pages/PostListPage";
import { allPosts } from "@/app/lib/posts/repository";
import { postListParams, postsIn } from "@/app/lib/posts/queries";

export function generateStaticParams() {
  // 영어 글이 가진 태그의 목록만 만든다. 글이 0편이면 아무 페이지도 생기지 않는다.
  return postListParams(postsIn(allPosts(), "en"));
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string; page: string[] }>;
}) {
  const { slug, page } = await params;
  return <PostListPage lang="en" tag={slug} page={Number(page[0])} />;
}
