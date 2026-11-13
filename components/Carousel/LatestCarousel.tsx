/****************************************
 *
 * LatestCarousel : 메인 최신 글 코버플로우
 *
 * 이 블로그의 유일한 클라이언트 경계. 바깥(HomePage)은 서버 컴포넌트로 남는다.
 *
 * 이 파일은 무엇이 그려지는지만 말한다. 어떻게 움직이는지는 useCoverflow 가,
 * 그 안의 산수는 app/lib/carousel/ 이 맡는다.
 *
 * 첫 렌더에서 변환값을 inline style 로 박는 게 중요하다. output: "export" 라
 * 메인 HTML 은 빌드 때 만들어지는데, useEffect 에서만 적용하면 JS 가 붙기 전
 * 첫 페인트에 카드 다섯 장이 가운데 겹쳐 보였다가 튄다.
 *
 ****************************************/
"use client";

import CarouselCard from "@/components/Carousel/CarouselCard";
import CarouselControls from "@/components/Carousel/CarouselControls";
import { useCoverflow } from "@/components/Carousel/useCoverflow";
import { messages } from "@/app/lib/i18n/messages";
import type { CarouselSlide, Lang } from "@/app/lib/posts/types";

interface LatestCarouselProps {
  slides: CarouselSlide[];
  lang: Lang;
  /**
   * 눈에 보이는 제목의 id. 주면 그 제목이 캐러셀의 이름이 된다.
   *
   * 없으면 사전의 carouselLabel 을 쓴다. 화면에 제목이 있는데도 제 이름을
   * 따로 가지면, 스크린리더가 같은 말을 제목에서 한 번, 캐러셀에서 또 한 번
   * 읽는다. ARIA 캐러셀 패턴은 보이는 제목을 이름으로 삼으라고 한다.
   */
  labelledBy?: string;
}

const LatestCarousel = ({ slides, lang, labelledBy }: LatestCarouselProps) => {
  const total = slides.length;
  const m = messages(lang);
  const {
    current,
    settle,
    initialStyle,
    stageRef,
    registerSlide,
    sectionProps,
    stageProps,
  } = useCoverflow(total);

  return (
    <section
      className="carousel"
      aria-roledescription="carousel"
      aria-labelledby={labelledBy}
      aria-label={labelledBy ? undefined : m.carouselLabel}
      {...sectionProps}
    >
      <div ref={stageRef} className="carousel-stage" {...stageProps}>
        <ul className="list-none">
          {slides.map((slide, i) => (
            <li
              key={slide.slug}
              ref={registerSlide(i)}
              data-index={i}
              className="carousel-slide"
              style={initialStyle(i)}
              aria-roledescription="slide"
              aria-label={m.slidePosition(i + 1, total)}
            >
              <CarouselCard slide={slide} lang={lang} priority={i === 0} />
            </li>
          ))}
        </ul>
      </div>

      <CarouselControls
        lang={lang}
        current={current}
        total={total}
        onSelect={settle}
      />

      <p className="sr-only" aria-live="polite">
        {m.slidePosition(current + 1, total)}
      </p>
    </section>
  );
};

export default LatestCarousel;
