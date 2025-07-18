import { ApiItem } from "@/type/index";
import NotFound from "@/app/not-found";
import { helperCallApi } from "@/app/utils/helperCallApi";
import TagList from "./TagList";
import { ApiResponse } from "@/type/index";
import { TagsProps } from "@/type/index";

const Tags = async ({ currTag }: TagsProps) => {
  let postData: ApiResponse = { list: [] };
  try {
    postData = await helperCallApi();
  } catch (error) {
    return <NotFound />;
  }

  const tags = postData.list.map((obj: ApiItem) => obj.data.tags);

  const uniqueTags = new Set<string>();
  tags.forEach((item: string) => {
    item.split(",").forEach((tag) => {
      uniqueTags.add(tag.trim());
    });
  });

  return <TagList currTag={currTag} tagNames={[...uniqueTags]} />;
};

export default Tags;
