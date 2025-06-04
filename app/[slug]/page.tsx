import ArticleContent from "./components/ArticleContent";
import NotFound from "../not-found";
import { fetchArticles } from "./services/articleService";

export const revalidate = 3600;
export const dynamic = "force-static";

const Page = async ({ params }: { params: { slug: string } }) => {
  const { slug } = await params;
  const { data } = await fetchArticles(slug);

  if (!data) {
    return <NotFound />;
  }

  return <ArticleContent content={data.content} />;
};

export default Page;
