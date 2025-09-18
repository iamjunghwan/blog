// 페이지네이션 네비게이션 컴포넌트
export const PaginationNavigation = ({
  currPage,
  totalItems,
  slug,
  pageSize = 5,
}: {
  currPage: number;
  totalItems: number;
  slug: string;
  pageSize?: number;
}) => {
  const totalPages = Math.ceil(totalItems / pageSize);
  const hasPrevPage = currPage > 1;
  const hasNextPage = currPage < totalPages;

  return (
    <div className="relative flex justify-center items-center gap-2 mt-8">
      {hasPrevPage && (
        <a
          className="absolute left-0 text-blue-500 hover:text-blue-600 dark:hover:text-blue-400"
          href={`/post/${slug}/${currPage - 1}`}
        >
          {`${currPage - 1} Page`}
        </a>
      )}

      <span>{`page : ${currPage} of ${totalPages} (${totalItems})`}</span>

      {hasNextPage && (
        <a
          className="absolute right-0 text-blue-500 hover:text-blue-600 dark:hover:text-blue-400"
          href={`/post/${slug}/${currPage + 1}`}
        >
          {`${currPage + 1} Page`}
        </a>
      )}
    </div>
  );
};
