import "@/app/globals.css";
import dayjs from "dayjs";
import InnerHeader from "@/components/InnerHeader";
import { PostData } from "@/type/index";

const getData = async () => {
  const response = await fetch(
    "https://api.memexdata.io/memex/api/projects/0e9c148b/models/blog/contents/search/v2",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Access-Token":
          "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJSRUJFTDkiLCJpYXQiOjE3Mzk3NzcxMzUsImV4cCI6MjA1NTEzNzEzNSwiSUQiOiIwZTljMTQ4YiIsIkRPTUFJTiI6WyIqIl0sIlRZUEUiOiJFWFRFUk5BTCJ9.i-PuX7QzNpJiqncP06Tc5FyDbFpAg11D-W5csSTdRkg",
        "X-Forwarded-Host": "localhost:3000",
      },

      body: JSON.stringify({
        size: 20,
        page: 0,
        direction: "DESC",
        orderCond: {
          type: "DATE_CREATE",
        },
      }),
    }
  );

  return await response.json();
};

export default async function Page() {
  const postData = await getData();

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
          ? postData?.list.map((item: PostData, index: number) => (
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
            ))
          : null}
      </ul>
    </>
  );
}
