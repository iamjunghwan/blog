"use client";

import "@/app/globals.css";
import dayjs from "dayjs";
import InnerHeader from "@/components/InnerHeader";
import { PostData } from "@/type/index";
import useQueryData from "@/hooks/useQueryData";
import Loading from "@/components/\bLoading";

export default function Page() {
  const { isPending, error, postData, isFetching } = useQueryData({
    queryKeyName: ["PostsInfo"],
  });

  if (isPending) return <Loading />;
  if (error) return "An error has occurred: " + error.message;

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
        {postData?.list.length > 0 &&
          postData?.list.map((item: PostData, index: number) => (
            <li
              key={index}
              style={{ paddingTop: "2rem", paddingBottom: "3rem" }}
            >
              <article>
                <div className="postInnerArea">
                  <dl>
                    <dd style={{ color: "gray" }}>
                      <time dateTime={item.createdAt}>
                        {dayjs(item.createdAt).format("YYYY-MM-DD")}
                      </time>
                    </dd>
                  </dl>
                  <h2
                    style={{
                      fontWeight: 700,
                      paddingTop: ".5rem",
                      margin: 0, // h2의 기본 마진 제거
                    }}
                  >
                    <a href={`/${item.data.slug}`}>
                      <div>{item.data.title.KO}</div>
                    </a>
                  </h2>
                </div>
              </article>
            </li>
          ))}
      </ul>
    </>
  );
}
