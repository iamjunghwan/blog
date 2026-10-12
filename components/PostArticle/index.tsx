import { ArticleList } from "./ArticleList";
import { PaginationNavigation } from "./PaginationNavigation";
import type { Post } from "@/app/lib/posts/types";

export default function PostArticle({
  posts,
  page,
  slug,
  totalPages,
  totalCount,
}: {
  posts: Post[];
  page: number;
  slug: string;
  totalPages: number;
  totalCount: number;
}) {
  return (
    <div className="flex flex-col min-h-full">
      <div className="flex-1">
        <ArticleList articles={posts} />
      </div>

      <PaginationNavigation
        currPage={page}
        totalPages={totalPages}
        totalCount={totalCount}
        slug={slug}
      />
    </div>
  );
}
