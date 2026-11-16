import type { Lang, Post } from "@/app/lib/posts/types";
import { ArticleItem } from "./ArticleItem";

export const ArticleList = ({
  articles,
  lang,
}: {
  articles: Post[];
  lang: Lang;
}) => (
  <ul className="list-none mt-4 [&>li:last-child>article]:border-b-0">
    {articles?.map((item: Post, index: number) => (
      <ArticleItem
        key={item.slug}
        item={item}
        lang={lang}
        priority={index === 0}
      />
    ))}
  </ul>
);
