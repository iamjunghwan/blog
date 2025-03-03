"use client";

import { useEffect, useState } from "react";
import dayjs from "dayjs";

interface PostData {
  uid: string;
  createdAt: string;
  data: {
    title: {
      KO: string;
    };
  };
}

export default function Page() {
  const [postData, setPostData] = useState<PostData[]>([]);

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
        }),
      }
    );

    const getdata = await response.json();
    setPostData(getdata.list);
  };

  useEffect(() => {
    getData();
  }, []);

  return (
    <>
      <div
        style={{
          alignItems: "center",
          justifyContent: "center",
          display: "flex",
        }}
      >
        <h1 style={{ fontSize: "3rem", fontWeight: 900 }}>Posts</h1>
      </div>
      <hr />
      <ul
        style={{
          alignItems: "center",
          justifyContent: "center",
          display: "grid",
        }}
      >
        {postData.length > 0 &&
          postData.map((item, index) => (
            <li
              key={index}
              style={{ paddingTop: "2rem", paddingBottom: "3rem" }}
            >
              <article>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4,minmax(0,1fr))",
                    alignItems: "baseline",
                  }}
                >
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
                      paddingLeft: "2rem",
                    }}
                  >
                    <a href={`/detail/${item.uid}`}>
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
