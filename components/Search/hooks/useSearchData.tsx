import { useState } from "react";
import { useDebounce } from "./useDebounce";
import type { SearchEntry } from "@/app/lib/posts/types";

/**
 * 빌드 타임에 받은 인덱스를 제목으로 필터링한다.
 * 디바운스는 입력마다 리렌더가 도는 것을 막기 위해 유지한다.
 */
const useSearchData = (index: SearchEntry[]) => {
  const [searchValue, setSearchValue] = useState<string>("");
  const debouncedSearchValue = useDebounce(searchValue, 500);

  const keyword = debouncedSearchValue.trim().toLowerCase();

  const filteredData =
    keyword === ""
      ? index
      : index.filter((entry: SearchEntry) =>
          entry.title.toLowerCase().includes(keyword)
        );

  return {
    setSearchValue,
    filteredData,
  };
};
export default useSearchData;
