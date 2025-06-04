import "@/app/globals.css";
import InnerHeader from "@/components/InnerHeader";
import NotFound from "../../not-found";
import Tags from "@/components/Tags";
import { generateStaticParams } from "@/app/lib/posts";
import PostArticle from "@/components/PostArticle";
import { fetchArticles } from "../services/fetchArticles";

export const revalidate = 3600;
export const dynamic = "force-static";

export { generateStaticParams };

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const { data } = await fetchArticles(slug);

  if (!data || data.length === 0) {
    return <NotFound />;
  }

  return (
    <>
      <InnerHeader title={`Posts ${slug} ${data.length}`} />
      <Tags currTag={slug} />
      <PostArticle data={data} />
    </>
  );
}
