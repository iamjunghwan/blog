import InnerHeader from "@/components/InnerHeader";
import ArticleCard from "@/components/Card/ArticleCard";
import { ApiResponse } from "@/type/index";
import NotFound from "./not-found";
import { callApi } from "./utils/callApi";

const Page = async () => {
  const postData = await callApi();
  if (!("list" in postData)) {
    return <NotFound />;
  }
  return (
    <>
      <InnerHeader title={`The Latest Article`} />
      <ul className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
        {postData?.list
          ? postData?.list.map((item: ApiResponse, index: number) => {
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
            })
          : null}
      </ul>
    </>
  );
};

export default Page;
