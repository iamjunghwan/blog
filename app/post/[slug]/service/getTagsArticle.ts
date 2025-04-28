import { ApiResponse } from "@/type/index";
import { callApi } from "@/app/utils/callApi";

export async function getTagsArticle(slug: string) {
  const result = await callApi();

  const article = result?.list.filter((obj: ApiResponse) =>
    obj.data.tags.includes(slug)
  );

  return { list: article };
}
