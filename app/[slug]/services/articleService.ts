import { ApiItem } from "@/type/index";
import { helperCallApi } from "@/app/utils/helperCallApi";

export async function getArticleContent(slug: string): Promise<string> {
  const result = await helperCallApi();

  const content = result.list
    .filter((obj: ApiItem) => obj.data.slug === slug)
    .map((obj: ApiItem) => obj.data.content)
    .toString();

  if (content.length === 0) {
    throw new Error("No articles exist on that slug.");
  }

  return content;
}
