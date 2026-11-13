/****************************************
 *
 * HomePage : 메인 본체
 *
 * 라우트 파일이 아니라 여기에 둔다. 한국어(/)와 영어(/en)가 같은 화면을 쓰는데
 * 루트 레이아웃이 달라 라우트 파일을 둘로 나눠야 하기 때문이다. 본체가 하나면
 * 한쪽만 고쳐져 두 언어가 어긋나는 일이 없다.
 *
 * 서버 컴포넌트로 남는다. 캐러셀은 클라이언트라 props가 전부 HTML에 실리므로,
 * 마크다운 본문을 뺀 CarouselSlide로 줄여서 넘긴다.
 *
 ****************************************/

import Link from "next/link";
import AboutPanel from "@/components/Home/AboutPanel";
import TagChips from "@/components/Home/TagChips";
import LatestCarousel from "@/components/Carousel/LatestCarousel";
import { allPosts } from "@/app/lib/posts/repository";
import { postsIn } from "@/app/lib/posts/queries";
import { topTags, writingSince } from "@/app/lib/blog/stats";
import { thumbnailOf } from "@/app/lib/posts/thumbnail";
import { localePath } from "@/app/lib/i18n/paths";
import { messages } from "@/app/lib/i18n/messages";
import { ALL_TAG } from "@/app/lib/posts/constants";
import type { CarouselSlide, Lang } from "@/app/lib/posts/types";

/** 메인에 보여줄 글 개수. 이 값만 쓴다. */
const LATEST_COUNT = 5;
/** 히어로 아래에 띄울 주제 칩 개수. */
const TOP_TAG_COUNT = 5;
/** 캐러셀이 aria-labelledby 로 가리킬 제목의 id. */
const LATEST_HEADING_ID = "latest-articles";

const HomePage = ({ lang }: { lang: Lang }) => {
  const posts = postsIn(allPosts(), lang);

  const slides: CarouselSlide[] = posts.slice(0, LATEST_COUNT).map((post) => ({
    slug: post.slug,
    title: post.title,
    date: post.date,
    tags: post.tags,
    // body를 읽어야 정해진다. 서버에서 끝내고 결과만 넘긴다.
    thumbnailSrc: thumbnailOf(post),
  }));

  return (
    <>
      <header className="pt-2 pb-8 md:pb-16">
        <AboutPanel lang={lang} since={writingSince(posts)} />
        <TagChips lang={lang} tags={topTags(posts, TOP_TAG_COUNT)} />
      </header>

      {/*
        캐러셀이 이 제목을 자기 이름으로 삼는다(aria-labelledby). 제목과
        캐러셀이 각자 이름을 가지면 스크린리더가 "Latest Articles" 를 연달아
        두 번 읽는다. ARIA 캐러셀 패턴도 눈에 보이는 제목을 이름으로 쓰라고 한다.
      */}
      <h2
        id={LATEST_HEADING_ID}
        className="text-center text-2xl font-black sm:text-3xl"
      >
        Latest Articles
      </h2>
      <div className="my-6 h-px w-full bg-gray-300 dark:bg-gray-700" />

      <LatestCarousel slides={slides} lang={lang} labelledBy={LATEST_HEADING_ID} />
      <div className="flex justify-center py-8">
        <Link
          href={localePath(lang, `/post/${ALL_TAG}/1`)}
          className="font-semibold text-blue-600 dark:text-blue-400"
        >
          {messages(lang).allPosts}
        </Link>
      </div>
    </>
  );
};

export default HomePage;
