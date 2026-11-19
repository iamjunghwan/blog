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
import LatestCarousel from "@/components/Carousel/LatestCarousel";
import MostRead from "@/components/Home/MostRead";
import { allPosts, featuredSlugs } from "@/app/lib/posts/repository";
import { featuredPosts, postsIn } from "@/app/lib/posts/queries";
import { thumbnailOf } from "@/app/lib/posts/thumbnail";
import { localePath } from "@/app/lib/i18n/paths";
import { messages } from "@/app/lib/i18n/messages";
import { ALL_TAG } from "@/app/lib/posts/constants";
import type { CarouselSlide, Lang } from "@/app/lib/posts/types";

/** 메인에 보여줄 글 개수. 이 값만 쓴다. */
const LATEST_COUNT = 5;
/** 캐러셀이 aria-labelledby 로 가리킬 제목의 id. */
const LATEST_HEADING_ID = "latest-articles";
/** Most Read에 보일 글 개수. 이 값만 쓴다. */
const MOST_READ_COUNT = 3;
/** Most Read 목록이 aria-labelledby 로 가리킬 제목의 id. */
const MOST_READ_HEADING_ID = "most-read";

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

  const mostRead = featuredPosts(posts, featuredSlugs(), lang, MOST_READ_COUNT);

  return (
    <>
      {/*
        페이지 제목. 자기소개 패널을 About 으로 옮긴 뒤 화면에 보이는 h1 이
        없어졌다. "Latest Articles" 는 섹션 이름이라 h1 로 올리지 않고,
        검색엔진·스크린리더용으로 블로그 이름과 성격을 숨겨서 둔다.
      */}
      <h1 className="sr-only">iaman — {messages(lang).aboutRole} blog</h1>

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

      {mostRead.length > 0 && (
        <section className="pb-8">
          <h2
            id={MOST_READ_HEADING_ID}
            className="text-center text-2xl font-black sm:text-3xl"
          >
            Most Read
          </h2>
          <div className="my-6 h-px w-full bg-gray-300 dark:bg-gray-700" />
          <MostRead posts={mostRead} lang={lang} labelledBy={MOST_READ_HEADING_ID} />
        </section>
      )}
    </>
  );
};

export default HomePage;
