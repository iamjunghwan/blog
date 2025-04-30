import { notFound } from "next/navigation";
import ArticleContent from "./components/ArticleContent";
import { getArticleContent } from "./services/articleService";

export const revalidate = 3600;
export const dynamic = "force-static";

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
