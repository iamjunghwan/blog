import "@/app/globals.css";
import InnerHeader from "@/components/InnerHeader";
import NotFound from "../../not-found";
import Tags from "@/components/Tags";
import { getTagsArticle } from "./service/getTagsArticle";
import { generateStaticParams } from "@/app/lib/posts";
import PostArticle from "@/components/PostArticle";
import { helperCallApi } from "@/app/utils/helperCallApi";

export const revalidate = 3600;
export const dynamic = "force-static";

export { generateStaticParams };

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let postData;
  try {
    if (slug === "" || slug === "all") {
      postData = await helperCallApi();
    } else {
      postData = await getTagsArticle(slug);
    }
  } catch (error) {
    return <NotFound />;
  }
  console.log(postData);
  return (
    <>
      <InnerHeader title={`Posts ${slug} ${postData.list.length}`} />
      <Tags />
      <PostArticle data={postData}></PostArticle>
    </>
  );
}
