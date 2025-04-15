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
                        margin: 0,
                      }}
                    >
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
