"use client";

import InnerHeader from "@/components/InnerHeader";
import ArticleCard from "@/components/Card/ArticleCard";
import { PostData } from "@/type/index";
import useQueryData from "@/hooks/useQueryData";

export default function Page() {
  const { isPending, error, postData, isFetching } = useQueryData({
    queryKeyName: ["LatestInfo"],
  });

  if (isPending) return "Loading...";
  if (error) return "An error has occurred: " + error.message;

  return (
    <>
      <InnerHeader title={`The Latest Article`} />
      <ul className="mainUl">
        {postData?.list.length > 0 &&
          postData?.list.map((item: PostData, index: number) => {
            if (index < 3) {
              return (
                <li key={index} className="firstFlexLine">
                  <ArticleCard getData={item} />
                </li>
              );
            }

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
                <ArticleCard getData={item} />
              </li>
            );
          })}
      </ul>
    </>
  );
}
