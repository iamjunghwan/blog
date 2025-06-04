import { getClient } from "@/app/lib/apollo-server-client";
import { GET_ALL_ARTICLES } from "@/graphql/queries/articleQueries";
import { ApiItem } from "@/type/index";

type FetchArticlesResult = {
  data: ApiItem[];
};

export async function fetchArticles(
  slug?: string
): Promise<FetchArticlesResult> {
  const isAll = !slug || slug === "all";

  const { data } = await getClient.query({
    query: GET_ALL_ARTICLES,
    variables: isAll ? {} : { tag: slug },
  });

  return {
    data: data.posts,
  };
}
