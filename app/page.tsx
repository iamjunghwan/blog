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
          ? postData.list
              .slice(0, 3)
              .map((item: ApiResponse, index: number) => (
                <li
                  key={index}
                  className="flex flex-col justify-start pt-8 pb-12"
                >
                  <ArticleCard getData={item} />
                </li>
              ))
          : null}

        {postData?.list && postData.list.length > 4 ? (
          <li className="md:col-span-3 flex flex-col md:flex-row gap-8 pt-8 pb-12">
            {[postData.list[3], postData.list[4]].map((item, i) => (
              <div key={i}>
                <ArticleCard getData={item} />
              </div>
            ))}
          </li>
        ) : null}
      </ul>
    </>
  );
};

export default Page;
