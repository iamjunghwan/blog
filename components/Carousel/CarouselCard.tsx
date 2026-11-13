/****************************************
 *
 * CarouselCard : 코버플로우 카드 한 장 (세로형)
 *
 * 썸네일 위, 글 정보 아래. MainArticleItem(가로형)과 달리 폭이 좁아 발췌문을
 * 싣지 않는다. 메타 영역 높이를 132px로 못박는 이유는 다섯 장의 높이가 같아야
 * 하기 때문이다 — 높이가 제각각이면 회전축이 어긋나 카드가 들쭉날쭉 돌아간다.
 *
 * 자기가 몇 번째인지, 어디에 놓이는지는 모른다. 그건 LatestCarousel이 쥔다.
 *
 ****************************************/

import { localePath } from "@/app/lib/i18n/paths";
import CardImageArea from "@/components/Card/CardImageArea";
import CardDateArea from "@/components/Card/CardDateArea";
import CardTagsArea from "@/components/Card/CardTagsArea";
import CardTitleArea from "@/components/Card/CardTitleArea";
import type { CarouselSlide, Lang } from "@/app/lib/posts/types";

interface CarouselCardProps {
  slide: CarouselSlide;
  lang: Lang;
  /** 첫 장만 즉시 받아온다. 나머지는 lazy */
  priority: boolean;
}

const CarouselCard = ({ slide, lang, priority }: CarouselCardProps) => {
  return (
    <article className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-900">
      <CardImageArea
        src={slide.thumbnailSrc}
        priority={priority}
        className="carousel-thumb w-full aspect-[40/21] overflow-hidden"
      />
      <div className="h-[132px] px-4 py-3">
        <CardDateArea
          date={slide.date}
          lang={lang}
          className="flex items-center text-xs mb-1"
        />
        <CardTagsArea
          tags={slide.tags}
          lang={lang}
          className="relative z-10 flex flex-wrap gap-2 mb-1"
          linkClassName="text-xs text-blue-600 dark:text-blue-400 uppercase no-underline"
        />
        {/*
          after:absolute after:inset-0 으로 카드 전체를 제목 링크의 클릭 영역으로
          만든다. 기준이 되는 position 요소는 바깥의 .carousel-slide(absolute)다.
        */}
        <CardTitleArea
          title={slide.title}
          slug={localePath(lang, `/${slide.slug}`)}
          className="flex"
          linkClassName="after:absolute after:inset-0"
        />
      </div>
    </article>
  );
};

export default CarouselCard;
