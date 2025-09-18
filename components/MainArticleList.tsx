import ArticleCard from "@/components/Card/ArticleCard";
import { ApiItem, ApiResponse } from "@/type/index";

interface MainArticleListProps {
  postData: ApiResponse;
}

const MainArticleList = ({ postData }: MainArticleListProps) => {
  return (
    <ul className="grid grid-cols-1 md:grid-cols-3 gap-8 ">
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
        <li className="md:col-span-3 flex flex-col md:flex-row gap-2  items-stretch">
          {[postData.list[3], postData.list[4]].map((item, i) => (
            <div key={i} className="flex-1 h-full pt-8 pb-12">
              <ArticleCard getData={item} />
            </div>
          ))}
        </li>
      ) : null}
    </ul>
  );
};

export default MainArticleList;
