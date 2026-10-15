/****************************************
 *
 * 화면 문자열 사전
 *
 * i18n 라이브러리를 쓰지 않는다. 갈라지는 문자열이 아래가 전부라 객체 두 개면
 * 충분하고, 라이브러리는 번들만 키운다.
 *
 * Posts / About / The Latest Article 은 한국어 화면에서도 영어라 양쪽이 같다.
 *
 ****************************************/

import type { Lang } from "@/app/lib/posts/types";

type Messages = {
  allPosts: string;
  searchPlaceholder: string;
  openMenu: string;
  closeMenu: string;
  searchTitle: string;
  switchTo: string;
  today: string;
  yesterday: string;
  daysAgo: (days: number) => string;
};

export const MESSAGES: Record<Lang, Messages> = {
  ko: {
    allPosts: "모든 글 보기 →",
    searchPlaceholder: "검색어를 입력하세요",
    openMenu: "메뉴 열기",
    closeMenu: "메뉴 닫기",
    searchTitle: "아티클 검색",
    switchTo: "English로 보기",
    today: "오늘",
    yesterday: "어제",
    daysAgo: (days) => `${days}일 전`,
  },
  en: {
    allPosts: "All posts →",
    searchPlaceholder: "Search posts",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    searchTitle: "Search articles",
    switchTo: "한국어로 보기",
    today: "Today",
    yesterday: "Yesterday",
    daysAgo: (days) => `${days} days ago`,
  },
};

export function messages(lang: Lang): Messages {
  return MESSAGES[lang];
}
