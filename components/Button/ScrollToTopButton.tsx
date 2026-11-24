/****************************************
 *
 * ScrollToTopButton : 아티클 페이지의 맨 위로 버튼
 *
 * 글 머리의 표식(ArticleContent가 그린다)을 IntersectionObserver로 본다.
 * 관찰 영역을 화면 위로 한 높이 늘려 두었으므로, 표식이 그 밖으로 나가면
 * 한 화면 넘게 내려온 것이다. scroll 이벤트는 듣지 않는다.
 *
 * 숨어 있을 때는 투명할 뿐 아니라 탭 이동과 낭독기에서도 빠진다.
 * 감지할 수 없으면(IntersectionObserver 없음, 표식 없음) 항상 보인다 —
 * 숨겨 두는 것보다 안전하다.
 *
 ****************************************/
"use client";

import { useEffect, useState } from "react";
import ArrowUpToLineIcon from "@/components/Icon/ArrowUpToLineIcon";
import { messages } from "@/app/lib/i18n/messages";
import {
  isPastSentinel,
  scrollBehavior,
  SCROLL_TOP_ROOT_MARGIN,
  SCROLL_TOP_SENTINEL_ID,
} from "@/app/lib/scroll/scroll-to-top";
import type { Lang } from "@/app/lib/posts/types";

export default function ScrollToTopButton({ lang }: { lang: Lang }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const sentinel = document.getElementById(SCROLL_TOP_SENTINEL_ID);
    if (sentinel === null || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => setVisible(isPastSentinel(entry)),
      { rootMargin: SCROLL_TOP_ROOT_MARGIN },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  const scrollToTop = () => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: scrollBehavior(reduce) });
  };

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label={messages(lang).scrollToTop}
      aria-hidden={visible ? undefined : true}
      tabIndex={visible ? 0 : -1}
      className={`fixed bottom-6 right-6 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white/90 text-gray-700 shadow-md transition-opacity duration-200 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-900/90 dark:text-gray-200 dark:hover:bg-gray-800 motion-reduce:transition-none ${
        visible ? "opacity-100" : "pointer-events-none opacity-0"
      }`}
    >
      <ArrowUpToLineIcon className="h-5 w-5" />
    </button>
  );
}
