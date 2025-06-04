import InnerHeader from "@/components/InnerHeader";
import ArticleCard from "@/components/Card/ArticleCard";
import { ApiItem } from "@/type/index";
import NotFound from "./not-found";
import { fetchArticles } from "./post/services/fetchArticles";

const Page = async () => {
  const { data: posts } = await fetchArticles();

  if (!posts) {
    return <NotFound />;
  }

  return (
    <>
      <InnerHeader title={`The Latest Article`} />
      <ul className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
        {posts.slice(0, 3).map((item: ApiItem, index: number) => (
          <li
            key={index}
            className="flex flex-col h-full justify-start pt-8 pb-12"
          >
            <div className="h-full">
              <ArticleCard getData={item} />
            </div>
          </li>
        ))}

        {posts.length > 4 && (
          <li className="md:col-span-3 flex flex-col md:flex-row gap-8 pt-8 pb-12 items-stretch">
            {[posts[3], posts[4]].map((item, i) => (
              <div key={i} className="flex-1 h-full">
                <ArticleCard getData={item} />
              </div>
            ))}
          </li>
        )}
      </ul>
    </>
  );
};

export default Page;
