"use client";

import { useState, useRef } from "react";
import { ApiItem } from "@/type/index";
import useSearchData from "../hooks/useSearchData";
import useSearchEvent from "../hooks/useSearchEvent";
import SearchIcon from "../../../public/search.svg";
import { useRouter } from "next/navigation";

function SearchModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const modalContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();
  const { filteredData, setSearchValue } = useSearchData(open, searchInputRef);
  useSearchEvent(open, modalContainerRef, searchInputRef, onClose);

  if (!open) {
    return null;
  }

  return (
    <div className=" fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div
        ref={modalContainerRef}
        className="w-full max-w-xl bg-white rounded-lg shadow-lg p-6 w-full max-w-md relative"
      >
        <button
          type="button"
          ref={closeButtonRef}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          onClick={onClose}
        >
          ✕
        </button>
        <div className="text-lg font-bold mb-4 dark:text-gray-500">
          아티클 검색
        </div>
        <input
          onChange={(e) => setSearchValue(e.target.value)}
          ref={searchInputRef}
          type="search"
          placeholder="검색어를 입력하세요"
          className="w-full border rounded px-3 py-2 mb-4 "
        />
        <div className="text-gray-500 text-sm min-h-[400px] w-full">
          {filteredData &&
          Array.isArray(filteredData) &&
          filteredData.length > 0 ? (
            filteredData.map((item: ApiItem, idx: number) => (
              <div
                key={idx}
                className="flex cursor-pointer justify-between px-4 py-2 text-gray-700 dark:text-gray-100 bg-transparent hover:bg-yellow-100"
                tabIndex={0}
                onClick={() => {
                  onClose();
                  router.push(`/${item.data.slug}`);
                }}
              >
                <div className="text-gray-400 text-sm">{item.createdAt}</div>
                <div className="dark:text-gray-500 truncate ml-10 flex-1">
                  {item.data.title.KO}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-400 py-8 min-h-[400px] flex items-center justify-center">
              검색 결과가 없습니다.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const Search = () => {
  const [isSearchPopupOpen, setIsSearchPopupOpen] = useState(false);

  const handleSearchPopup = () => {
    setIsSearchPopupOpen(true);
  };

  const handleClose = () => {
    setIsSearchPopupOpen(false);
  };

  return (
    <>
      <div className="p-4">
        <button
          type="button"
          onClick={handleSearchPopup}
          aria-label="searchButton"
        >
          <SearchIcon className="w-6 h-6" />
        </button>
      </div>
      <SearchModal open={isSearchPopupOpen} onClose={handleClose} />
    </>
  );
};

export default Search;
