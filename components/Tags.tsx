import TagList from "./TagList";
import { TagsProps } from "@/type/index";
import { GET_ALL_TAGS } from "@/graphql/queries/articleQueries";
import { getClient } from "@/app/lib/apollo-server-client";

const Tags = async ({ currTag }: TagsProps) => {
  const { data } = await getClient.query({ query: GET_ALL_TAGS });

  return <TagList currTag={currTag} tagNames={[...data.tags]} />;
};

export default Tags;
