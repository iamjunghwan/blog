import { ApiResponse, ApiItem } from "@/type/index";
import { helperCallApi } from "@/app/utils/helperCallApi";

export async function getTagsArticle(slug: string): Promise<ApiResponse> {
  const result = await helperCallApi();

  const article = result?.list.filter((obj: ApiItem) =>
    obj.data.tags.split(",").find((tag) => tag === slug)
  );

  if (article.length === 0) {
    throw new Error("No articles exist on that tag.");
  }

  return { list: article };
}
