import "@/app/globals.css";
import dayjs from "dayjs";
import InnerHeader from "@/components/InnerHeader";
import { ApiResponse } from "@/type/index";
import { callApi } from "../utils/callApi";
import NotFound from "../not-found";

export default async function Page() {
  const postData = await callApi();
  if (!("list" in postData)) {
    return <NotFound />;
  }
  return (
    <>
      <InnerHeader title={`Posts`} />
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
