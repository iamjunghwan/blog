"use client";

import { ApiItem, ApiResponse } from "@/type/index";
import { usePaginationState } from "./hooks/usePaginationState";
import { ArticleList } from "./ArticleList";
import { PaginationNavigation } from "./PaginationNavigation";

export default function PostArticle({
  data,
  page,
  slug,
  displayData,
}: {
  data: ApiResponse;
  page: string;
  slug: string;
  startIndex: number;
  endIndex: number;
  displayData: ApiResponse;
}) {
  const { currPage, currArticlePageList } = usePaginationState(
    Number(page),
    displayData.list
  );

  return (
    <div className="flex flex-col min-h-full">
      <div className="flex-1">
        <ArticleList articles={currArticlePageList} />
      </div>

      <PaginationNavigation
        currPage={currPage}
        totalItems={data.list.length}
        slug={slug}
      />
    </div>
  );
}
