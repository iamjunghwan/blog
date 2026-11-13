/****************************************
 *
 * CarouselControls : 화살표 · 점 · 번호
 *
 * 드래그를 못 하거나 모르는 방문자가 글 다섯 개에 닿는 유일한 길이다.
 * 장식이 아니라 접근성 장치라서, 보기에 번잡하다고 빼면 안 된다.
 *
 * 상태를 갖지 않는다. 지금 몇 번째인지는 받아서 그리기만 한다.
 *
 ****************************************/

import { messages } from "@/app/lib/i18n/messages";
import type { Lang } from "@/app/lib/posts/types";

interface CarouselControlsProps {
  lang: Lang;
  /** 0부터 센다 */
  current: number;
  total: number;
  onSelect: (index: number) => void;
}

const CarouselControls = ({ lang, current, total, onSelect }: CarouselControlsProps) => {
  const m = messages(lang);

  return (
    <>
      <button
        type="button"
        className="carousel-arrow carousel-arrow-prev"
        aria-label={m.prevSlide}
        disabled={current === 0}
        onClick={() => onSelect(current - 1)}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="M15 5 8 12l7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <button
        type="button"
        className="carousel-arrow carousel-arrow-next"
        aria-label={m.nextSlide}
        disabled={current === total - 1}
        onClick={() => onSelect(current + 1)}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <path d="m9 5 7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div className="mt-4 flex items-center justify-center gap-4">
        <ul className="flex list-none items-center">
          {Array.from({ length: total }, (_, i) => (
            <li key={i}>
              <button
                type="button"
                className={i === current ? "carousel-dot is-current" : "carousel-dot"}
                aria-label={m.goToSlide(i + 1)}
                aria-current={i === current ? "true" : undefined}
                onClick={() => onSelect(i)}
              />
            </li>
          ))}
        </ul>
        {/*
          번호를 점 옆에 둔다. 스테이지 안(설계 스케치의 오른쪽 아래)에 두면
          가장자리 페이드 마스크에 함께 흐려져 읽히지 않는다.
        */}
        <span className="text-sm tabular-nums text-gray-500 dark:text-gray-400">
          {current + 1} / {total}
        </span>
      </div>
    </>
  );
};

export default CarouselControls;
