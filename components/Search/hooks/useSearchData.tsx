import { useState } from "react";
import { filterByTitle } from "@/app/lib/posts/queries";
import type { SearchEntry } from "@/app/lib/posts/types";

/**
 * 빌드 타임에 받은 인덱스를 제목으로 필터링한다.
 *
 * 디바운스는 쓰지 않는다. 원래는 키 입력마다 CMS를 호출하는 것을 막으려던 것인데
 * 이제 필터링이 로컬 배열 연산이라 500ms를 기다릴 이유가 없다. 즉시 반응한다.
 * 필터 규칙 자체는 queries.ts의 filterByTitle에 있어 단위 테스트로 고정된다.
 */
const useSearchData = (index: SearchEntry[]) => {
  const [searchValue, setSearchValue] = useState<string>("");

  return {
    setSearchValue,
    filteredData: filterByTitle(index, searchValue),
  };
};
export default useSearchData;
