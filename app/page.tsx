import InnerHeader from "@/components/InnerHeader";
import ArticleCard from "@/components/Card/ArticleCard";
import { ApiItem } from "@/type/index";
import NotFound from "./not-found";
import { helperCallApi } from "./utils/helperCallApi";

const Page = async () => {
  let postData;
  try {
    postData = await helperCallApi();
  } catch (error) {
    return <NotFound />;
  }

  return (
    <>
      <InnerHeader title={`The Latest Article`} />
      <ul className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
        {postData?.list
          ? postData.list.slice(0, 3).map((item: ApiItem, index: number) => (
              <li
                key={index}
                className="flex flex-col h-full justify-start pt-8 pb-12"
              >
                <div className="h-full">
                  <ArticleCard getData={item} />
                </div>
              </li>
            ))
          : null}

        {postData?.list && postData.list.length > 4 ? (
          <li className="md:col-span-3 flex flex-col md:flex-row gap-8 pt-8 pb-12 items-stretch">
            {[postData.list[3], postData.list[4]].map((item, i) => (
              <div key={i} className="flex-1 h-full">
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
