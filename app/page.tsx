import InnerHeader from "@/components/InnerHeader";
import ArticleCard from "@/components/Card/ArticleCard";
import { PostData } from "@/type/index";
import NotFound from "./not-found";

const fetchData = async () => {
  try {
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
  } catch (error) {
    return { error: "데이터를 불러오는 데 문제가 발생했습니다." };
  }
};

const Page = async () => {
  const postData = await fetchData();
  if (!postData) {
    return <NotFound />;
  }
  return (
    <>
      <InnerHeader title={`The Latest Article`} />
      <ul className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
        {postData?.list.length > 0 &&
          postData?.list.map((item: PostData, index: number) => {
            if (index < 3) {
              return (
                <li
                  key={index}
                  className="flex flex-col justify-start pt-8 pb-12"
                >
                  <ArticleCard getData={item} />
                </li>
              );
            }

            return (
              <li
                key={index}
                className={`flex flex-col justify-start pt-8 pb-12 ${
                  index === 3
                    ? "md:col-span-2 md:col-start-1"
                    : "md:col-span-2 md:col-start-2"
                }`}
              >
                <ArticleCard getData={item} />
              </li>
            );
          })}
      </ul>
    </>
  );
};

export default Page;
