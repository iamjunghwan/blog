import { notFound } from "next/navigation";
import ArticleContent from "./components/ArticleContent";
import { getClient } from "../lib/apollo-server-client";
import { GET_ARTICLE } from "@/graphql/queries/articleQueries";

export const revalidate = 3600;
export const dynamic = "force-static";

export default async function Detail({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { data } = await getClient.query({
    query: GET_ARTICLE,
    variables: { slug },
  });

  return <ArticleContent content={data.post.content} />;
}
