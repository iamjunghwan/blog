import InnerHeader from "@/components/InnerHeader";
import ArticleCard from "@/components/Card/ArticleCard";
import { ApiItem } from "@/type/index";
import NotFound from "./not-found";
import { getClient } from "./lib/apollo-server-client";
import { GET_ARTICLES } from "@/graphql/queries/articleQueries";

const Page = async () => {
  //let postData;
  let data;
  try {
    //postData = await helperCallApi();
    data = await getClient.query({
      query: GET_ARTICLES,
    });
  } catch (error) {
    return <NotFound />;
  }

  return (
    <>
      <InnerHeader title={`The Latest Article`} />
      <ul className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
        {data?.data.posts
          ? data.data.posts.slice(0, 3).map((item: ApiItem, index: number) => (
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

        {data?.data.posts && data.data.posts.length > 4 ? (
          <li className="md:col-span-3 flex flex-col md:flex-row gap-8 pt-8 pb-12 items-stretch">
            {[data.data.posts[3], data.data.posts[4]].map((item, i) => (
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
