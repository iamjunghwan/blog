import "@/app/globals.css";
import dayjs from "dayjs";
import InnerHeader from "@/components/InnerHeader";
import { ApiResponse } from "@/type/index";
import { callApi } from "../../utils/callApi";
import NotFound from "../../not-found";
import Tags from "@/components/Tags";
import { getTagsArticle } from "./service/getTagsArticle";

export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let postData;
  if (slug === "" || slug === "all") {
    postData = await callApi();
  } else {
    postData = await getTagsArticle(slug);
  }

  if (!("list" in postData)) {
    return <NotFound />;
  }

  return (
    <>
      <InnerHeader title={`Posts ${slug} ${postData.list.length}`} />
      <Tags />
      <ul
        style={{
          alignItems: "center",
          justifyContent: "center",
          display: "grid",
        }}
      >
        {postData?.list
          ? postData?.list.map((item: ApiResponse, index: number) => (
              <li key={index} className="pt-8 pb-12">
                <article>
                  <div className="grid grid-cols-2 gap-2.5 items-baseline max-[500px]:flex max-[500px]:flex-col">
                    <dl>
                      <dd className="text-gray-500">
                        <time dateTime={item.createdAt}>
                          {dayjs(item.createdAt).format("YYYY-MM-DD")}
                        </time>
                      </dd>
                    </dl>
                    <h2 className="font-bold pt-2 m-0">
                      <a href={`/${item.data.slug}`}>
                        <div>{item.data.title.KO}</div>
                      </a>
                    </h2>
                  </div>
                </article>
              </li>
            ))
          : null}
      </ul>
    </>
  );
}
