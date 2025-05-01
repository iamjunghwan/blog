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

  let articleContent;
  try {
    articleContent = await getArticleContent(slug);
  } catch (error) {
    notFound();
  }

  return <ArticleContent content={articleContent} />;
}
