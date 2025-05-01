import { ApiItem } from "@/type/index";
import { callApi } from "@/app/utils/callApi";
import { helperCallApi } from "@/app/utils/helperCallApi";

export async function getArticleContent(slug: string): Promise<string> {
  const result = await helperCallApi();

  const content = result.list
    .filter((obj: ApiItem) => obj.data.slug === slug)
    .map((obj: ApiItem) => obj.data.content)
    .toString();

  return content;
}
