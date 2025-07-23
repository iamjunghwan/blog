import { useState, useEffect } from "react";
import { ApiItem } from "@/type/index";
import dayjs from "dayjs";
import { useDebounce } from "./useDebounce";

const useSearchData = (
  open: boolean,
  searchInputRef: React.RefObject<HTMLInputElement | null>
) => {
  const [customData, setCustomData] = useState<ApiItem[]>([]);
  const [searchValue, setSearchValue] = useState<string>("");
  const debouncedSearchValue = useDebounce(searchValue, 500);

  useEffect(
    function fetchDataByOpen() {
      if (open) {
        fetch("/api/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            size: 20,
            page: 0,
            direction: "DESC",
            orderCond: { type: "DATE_CREATE" },
          }),
        })
          .then((res) => res.json())
          .then(function (data) {
            let _customData = data.list.map((obj: ApiItem) => {
              return {
                createdAt: dayjs(obj.createdAt).format("YYYY-MM-DD"),
                data: {
                  slug: obj.data.slug,
                  title: {
                    KO: obj.data.title.KO,
                  },
                },
              };
            });

            setCustomData(_customData);
          });
      }
    },
    [open]
  );

  const filteredData = customData.filter((item: ApiItem) =>
    item.data.title.KO.toLowerCase().includes(
      debouncedSearchValue.toLowerCase()
    )
  );

  return {
    setSearchValue,
    filteredData,
  };
};
export default useSearchData;
