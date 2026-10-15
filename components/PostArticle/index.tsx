import { ArticleList } from "./ArticleList";
import { PaginationNavigation } from "./PaginationNavigation";
import type { Lang, Post } from "@/app/lib/posts/types";

export default function PostArticle({
  posts,
  page,
  slug,
  totalPages,
  totalCount,
  lang,
}: {
  posts: Post[];
  page: number;
  slug: string;
  totalPages: number;
  totalCount: number;
  lang: Lang;
}) {
  return (
    <div className="flex flex-col min-h-full">
      <div className="flex-1">
        <ArticleList articles={posts} lang={lang} />
      </div>

      <PaginationNavigation
        currPage={page}
        totalPages={totalPages}
        totalCount={totalCount}
        slug={slug}
        lang={lang}
      />
    </div>
  );
}
