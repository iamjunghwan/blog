"use client";

import Image from "next/image";
import dayjs from "dayjs";
import { useQuery } from "@tanstack/react-query";

interface PostData {
  uid: string;
  createdAt: string;
  data: {
    slug: string;
    content: string;
    title: {
      KO: string;
    };
  };
}

export default function Page() {
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

    return await response.json();
  };

  const {
    isPending,
    error,
    data: postData,
    isFetching,
  } = useQuery({
    queryKey: ["LatestInfo"],
    queryFn: getData,
  });

  if (isPending) return "Loading...";

  if (error) return "An error has occurred: " + error.message;

  const check = (htmlString: string): string => {
    const regex = /<img[^>]*>/; // <img> 태그를 찾는 정규 표현식
    const firstImageTag = htmlString.match(regex); // 첫 번째 <img> 태그를 찾음
    if (firstImageTag === null) {
      return "/iaman.png"; // 기본 경로를 리턴
    }

    const regex2 = /<img[^>]+src=["']([^"']+)["']/;
    const match = firstImageTag[0].match(regex2);

    if (match) {
      const srcValue = match[1];

      return "/" + srcValue;
    } else {
      return "/iaman.png"; // 기본 경로를 리턴
    }
  };

  return (
    <>
      <div className="main ">
        <h1 className="mainH1">The Latest Article</h1>
      </div>

      <hr />
      <ul className="mainUl">
        {postData?.list.length > 0 &&
          postData?.list.map((item: PostData, index: number) => {
            if (index < 3) {
              return (
                <li key={index} className="firstFlexLine">
                  <a href={`/${item.data.slug}`}>
                    <article className="mainArticle">
                      <div className="mainTime">
                        <time dateTime={item.createdAt}>
                          {dayjs(item.createdAt).format("YYYY-MM-DD")}
                        </time>
                      </div>
                      <div className="mainImage">
                        <Image
                          src={check(item.data.content)}
                          alt=""
                          width={100}
                          height={100}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                          }}
                        />
                      </div>
                      <h2 className="mainH2">
                        <div>{item.data.title.KO}</div>
                      </h2>
                    </article>
                  </a>
                </li>
              );
            }

            // 두 번째 줄 (index 3, 4) => 첫 번째 줄의 항목 사이에 배치
            return (
              <li
                key={index}
                //className="secondFlexLine"
                className="container"
                style={{
                  display: "flex",
                  flexDirection: "column", // 세로로 정렬되도록 설정
                  justifyContent: "flex-start", // 세로 방향으로 정렬
                  paddingTop: "2rem",
                  paddingBottom: "3rem",
                  height: "auto", // 높이를 자동으로 조정
                  gridColumn: index === 3 ? "1 / span 2" : "2 / span 2", // 4번 항목은 첫 번째 열, 5번 항목은 세 번째 열에 배치
                  gridRow: "2", // 두 번째 줄에 배치
                }}
              >
                <a href={`/${item.data.slug}`}>
                  <article className="mainArticle">
                    <div className="mainTime">
                      <time dateTime={`${item.createdAt}`}>
                        {dayjs(item.createdAt).format("YYYY-MM-DD")}
                      </time>
                    </div>

                    <div className="mainImage">
                      <Image
                        src={check(item.data.content)}
                        alt=""
                        width={100}
                        height={100}
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
                      />
                    </div>

                    <h2 className="mainH2">
                      <div>{item.data.title.KO}</div>
                    </h2>
                  </article>
                </a>
                <div className="image"></div>
              </li>
            );
          })}
      </ul>
    </>
  );
}
