import { ApiItem } from "@/type/index";
import { callApi } from "@/app/utils/callApi";

export async function getArticleContent(slug: string): Promise<string> {
  const result = await callApi();
  if (!("list" in result)) {
    return "";
  }

  const content = result.list
    .filter((obj: ApiItem) => obj.data.slug === slug)
    .map((obj: ApiItem) => obj.data.content)
    .toString();

  return content;
}
