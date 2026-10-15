import type { Lang, Post } from "@/app/lib/posts/types";
import { ArticleItem } from "./ArticleItem";

export const ArticleList = ({
  articles,
  lang,
}: {
  articles: Post[];
  lang: Lang;
}) => (
  <ul className="list-none grid gap-8 mt-8">
    {/* 맨 위 한 장만 즉시 받는다. 나머지는 스크롤해야 보이므로 미룬다. */}
    {articles?.map((item: Post, index: number) => (
      <ArticleItem key={item.slug} item={item} lang={lang} priority={index === 0} />
    ))}
  </ul>
);
