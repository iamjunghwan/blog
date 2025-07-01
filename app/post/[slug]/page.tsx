import NotFound from "../../not-found";
import { getTagsArticle } from "./service/getTagsArticle";
import { generateStaticParams } from "@/app/lib/posts";
import { helperCallApi } from "@/app/utils/helperCallApi";
import { ApiResponse } from "@/type/index";
import PostPageContent from "@/components/PostPageContent";

export const revalidate = 3600;
export const dynamic = "force-static";

export { generateStaticParams };

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let postData: ApiResponse = { list: [] };

  try {
    if (slug === "" || slug === "all") {
      postData = await helperCallApi();
    } else {
      postData = await getTagsArticle(slug);
    }
  } catch (error) {
    return <NotFound />;
  }

  return <PostPageContent slug={slug} postData={postData} />;
}
