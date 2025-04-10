import { notFound } from "next/navigation";
import ArticleContent from "./components/ArticleContent";
import { getArticleContent } from "./services/articleService";

export default async function Detail({ params }: { params: { slug: string } }) {
  const { slug } = await Promise.resolve(params);
  const articleContent = await getArticleContent(slug);

  if (!articleContent) {
    notFound();
  }

  return <ArticleContent content={articleContent} />;
}
