import { ApiItem } from "@/type/index";
import { useEffect, useState } from "react";

// 페이지네이션 상태 관리 훅
export const usePaginationState = (
  initialPage: number,
  displayData: ApiItem[]
) => {
  const [currPage, setCurrPage] = useState<number>(initialPage);
  const [currArticlePageList, setCurrArticlePageList] = useState<ApiItem[]>([
    ...displayData,
  ]);
  const [sumCnt, setSumCnt] = useState<number>(displayData.length);

  useEffect(() => {
    setCurrArticlePageList([...displayData]);
    setSumCnt(displayData.length);
  }, [displayData]);

  return {
    currPage,
    currArticlePageList,
    sumCnt,
    setCurrPage,
  };
};
