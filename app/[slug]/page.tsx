import { notFound } from "next/navigation";
import ArticleContent from "./components/ArticleContent";
import { getArticleContent } from "./services/articleService";
import { Suspense } from "react";

export default async function Detail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const articleContent = await getArticleContent(slug);

  if (!articleContent) {
    notFound();
  }

  return <ArticleContent content={articleContent} />;
}
