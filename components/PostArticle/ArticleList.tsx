import { ApiItem } from "@/type/index";
import { ArticleItem } from "./ArticleItem";

export const ArticleList = ({ articles }: { articles: ApiItem[] }) => (
  <ul className="list-none grid gap-8 mt-8">
    {articles?.map((item: ApiItem, index: number) => (
      <ArticleItem key={index} item={item} />
    ))}
  </ul>
);
