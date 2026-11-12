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
  noResults: string;
  searchLabel: string;
  searchTitle: string;
  switchTo: string;
  today: string;
  yesterday: string;
  daysAgo: (days: number) => string;
  carouselLabel: string;
  prevSlide: string;
  nextSlide: string;
  slidePosition: (current: number, total: number) => string;
  goToSlide: (n: number) => string;
};

export const MESSAGES: Record<Lang, Messages> = {
  ko: {
    allPosts: "모든 글 보기 →",
    searchPlaceholder: "검색어를 입력하세요",
    openMenu: "메뉴 열기",
    closeMenu: "메뉴 닫기",
    noResults: "검색 결과가 없습니다.",
    searchLabel: "검색",
    searchTitle: "아티클 검색",
    switchTo: "English로 보기",
    today: "오늘",
    yesterday: "어제",
    daysAgo: (days) => `${days}일 전`,
    carouselLabel: "최신 글",
    prevSlide: "이전 글",
    nextSlide: "다음 글",
    slidePosition: (current, total) => `${total}개 중 ${current}번째`,
    goToSlide: (n) => `${n}번째 글로 이동`,
  },
  en: {
    allPosts: "All posts →",
    searchPlaceholder: "Search posts",
    openMenu: "Open menu",
    closeMenu: "Close menu",
    noResults: "No results found.",
    searchLabel: "Search",
    searchTitle: "Search articles",
    switchTo: "한국어로 보기",
    today: "Today",
    yesterday: "Yesterday",
    daysAgo: (days) => `${days} days ago`,
    carouselLabel: "Latest articles",
    prevSlide: "Previous article",
    nextSlide: "Next article",
    slidePosition: (current, total) => `${current} of ${total}`,
    goToSlide: (n) => `Go to article ${n}`,
  },
};

export function messages(lang: Lang): Messages {
  return MESSAGES[lang];
}
