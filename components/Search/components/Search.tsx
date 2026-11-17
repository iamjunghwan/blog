"use client";

import { useState, useRef } from "react";
import type { Lang, SearchEntry } from "@/app/lib/posts/types";
import { localePath } from "@/app/lib/i18n/paths";
import { messages } from "@/app/lib/i18n/messages";
import useSearchData from "../hooks/useSearchData";
import useSearchEvent from "../hooks/useSearchEvent";
import SearchIcon from "@/components/Icon/SearchIcon";
import { useRouter } from "next/navigation";

function SearchModal({
  open,
  onClose,
  index,
  lang,
}: {
  open: boolean;
  onClose: () => void;
  index: SearchEntry[];
  lang: Lang;
}) {
  const modalContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const router = useRouter();
  const { filteredData, hasQuery, setSearchValue } = useSearchData(index);
  useSearchEvent(open, modalContainerRef, searchInputRef, onClose);

  if (!open) {
    return null;
  }

  // 세로 가운데가 아니라 위에 붙인다. 가운데 정렬이면 결과 수에 따라 모달이
  // 자랄 때 위쪽 모서리가 같이 올라가서, 타이핑하는 중에 입력창이 움직인다.
  // 위를 기준으로 두면 제목과 입력창의 y가 고정되고 목록만 아래로 자란다.
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center px-4 pt-[10vh] bg-black/40">
      <div
        ref={modalContainerRef}
        className="w-full max-w-xl bg-white rounded-lg shadow-lg p-6 relative"
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
          {messages(lang).searchTitle}
        </div>
        <input
          onChange={(e) => setSearchValue(e.target.value)}
          ref={searchInputRef}
          type="search"
          placeholder={messages(lang).searchPlaceholder}
          className="w-full border rounded px-3 py-2 mb-4 "
        />
        {/*
          천장만 두고 안에서 스크롤한다. 고정 높이로 두면 검색어가 없을 때
          400px 빈 상자가 남고, 천장이 없으면 결과가 늘수록 모달이 화면을
          넘긴다. 뷰포트가 낮은 기기에서는 400px도 과해서 절반까지만 쓴다.
        */}
        <div className="text-gray-500 text-sm max-h-[min(400px,50vh)] w-full overflow-y-auto">
          {filteredData.length > 0 ? (
            filteredData.map((item: SearchEntry) => (
              <div
                key={item.slug}
                className="flex cursor-pointer justify-between px-4 py-2 text-gray-700 dark:text-gray-100 bg-transparent hover:bg-yellow-100"
                tabIndex={0}
                onClick={() => {
                  onClose();
                  router.push(localePath(lang, `/${item.slug}`));
                }}
              >
                <div className="text-gray-400 text-sm">{item.date}</div>
                <div className="dark:text-gray-500 truncate ml-10 flex-1">
                  {item.title}
                </div>
              </div>
            ))
          ) : (
            // 빈 결과가 두 가지다. 아직 안 찾았거나, 찾았는데 없거나.
            <div className="text-center text-gray-400 px-6 py-10">
              {hasQuery ? messages(lang).noResults : messages(lang).searchHint}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const Search = ({ index, lang }: { index: SearchEntry[]; lang: Lang }) => {
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
          aria-label={messages(lang).searchLabel}
        >
          <SearchIcon className="w-6 h-6" />
        </button>
      </div>
      <SearchModal
        open={isSearchPopupOpen}
        onClose={handleClose}
        index={index}
        lang={lang}
      />
    </>
  );
};

export default Search;
