import type { Post } from "@/app/lib/posts/types";
import { ArticleItem } from "./ArticleItem";

export const ArticleList = ({ articles }: { articles: Post[] }) => (
  <ul className="list-none grid gap-8 mt-8">
    {articles?.map((item: Post) => (
      <ArticleItem key={item.slug} item={item} />
    ))}
  </ul>
);
