import { generateStaticParams } from "../lib/posts";
import { processHtml } from "../lib/processHtml";
import NotFound from "../not-found";
import ArticleContent from "./components/ArticleContent";
import { getArticleContent } from "./services/articleService";

export const revalidate = 3600;
export const dynamic = "force-static";

export { generateStaticParams };

export default async function SlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let articleContent: string = "";

  let html = "";
  try {
    articleContent = await getArticleContent(slug);

    const result = processHtml(articleContent);
    html = result.html;

  } catch (error) {
    return NotFound();
  }

  return (
      <ArticleContent
         content={html}  
       />
    )
}
