/****************************************
 *
 * 맨 위로 버튼의 판단 로직
 *
 * 버튼(components/Button/ScrollToTopButton.tsx)은 "use client" 파일이다.
 * 그 파일에서 상수를 export 하면 서버 컴포넌트(ArticleContent)가 가져갈 때
 * 값이 아니라 클라이언트 참조가 된다. 그래서 둘이 함께 쓰는 id는 여기 둔다.
 * 판단 함수도 DOM 없이 node:test로 검사하려고 여기 둔다.
 *
 ****************************************/

/** ArticleContent가 글 머리에 두는 높이 0짜리 표식 */
export const SCROLL_TOP_SENTINEL_ID = "scroll-top-sentinel";

/**
 * 관찰 영역을 화면 위로 한 높이만큼 늘린다.
 * 표식이 이 영역 밖(화면 위쪽)으로 나가면 = 한 화면 넘게 내려왔다.
 */
export const SCROLL_TOP_ROOT_MARGIN = "100% 0px 0px 0px";

type SentinelEntry = {
  isIntersecting: boolean;
  boundingClientRect: { top: number };
};

/** 표식이 관찰 영역을 벗어나 위쪽에 있으면 버튼을 보인다. */
export function isPastSentinel(entry: SentinelEntry): boolean {
  return !entry.isIntersecting && entry.boundingClientRect.top < 0;
}

export function scrollBehavior(prefersReducedMotion: boolean): ScrollBehavior {
  return prefersReducedMotion ? "auto" : "smooth";
}
