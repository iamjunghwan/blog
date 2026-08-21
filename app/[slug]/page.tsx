import { allPosts } from "@/app/lib/posts/repository";
import { postBySlug } from "@/app/lib/posts/queries";
import { renderPostBody } from "@/app/lib/posts/render";
import NotFound from "../not-found";
import ArticleContent from "./components/ArticleContent";

export function generateStaticParams() {
  return allPosts().map((post) => ({ slug: post.slug }));
}

export default async function SlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = postBySlug(allPosts(), slug);

  if (post === undefined) {
    return NotFound();
  }

  return <ArticleContent content={renderPostBody(post.body)} />;
}
