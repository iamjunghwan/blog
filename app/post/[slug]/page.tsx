import "@/app/globals.css";
import InnerHeader from "@/components/InnerHeader";
import NotFound from "../../not-found";
import Tags from "@/components/Tags";
import { generateStaticParams } from "@/app/lib/posts";
import PostArticle from "@/components/PostArticle";
import { getClient } from "@/app/lib/apollo-server-client";
import {
  GET_ARTICLES,
  GET_ARTICLES_BY_TAG,
} from "@/graphql/queries/articleQueries";

export const revalidate = 3600;
export const dynamic = "force-static";

// export { generateStaticParams };

async function fetchArticles(slug: string) {
  try {
    const isAll = !slug || slug === "all";

    const { data } = await getClient.query({
      query: isAll ? GET_ARTICLES : GET_ARTICLES_BY_TAG,
      variables: isAll ? undefined : { tag: slug },
    });

    return isAll ? data.posts : data.postsByTag;
  } catch (error) {
    console.error("GraphQL fetch error:", error);
    return null;
  }
}

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await fetchArticles(slug);

  if (!data) {
    return <NotFound />;
  }

  return (
    <>
      <InnerHeader title={`Posts ${slug} ${data.length}`} />
      <Tags currTag={slug} />
      <PostArticle data={data}></PostArticle>
    </>
  );
}
