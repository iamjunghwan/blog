import NotFound from "../not-found";
import ArticleContent from "./components/ArticleContent";
import { getArticleContent } from "./services/articleService";

export const revalidate = 3600;
export const dynamic = "force-static";

export default async function SlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let articleContent: string = "";
  try {
    articleContent = await getArticleContent(slug);
  } catch (error) {
    return NotFound();
  }

  return <ArticleContent content={articleContent} />;
}
