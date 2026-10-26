/****************************************
 *
 * 구조화 데이터 (JSON-LD)
 *
 * 검색 엔진이 페이지의 의미를 읽는 경로다. 메타 태그가 "이 글의 제목은 X"라고
 * 말한다면, 구조화 데이터는 "이건 블로그 글이고, 글쓴이는 누구고, 언제 썼고,
 * 어느 사이트에 속한다"까지 말한다.
 *
 * WebSite 는 홈에만 넣는다. 구글이 검색 결과 상단의 사이트 이름을 정할 때
 * 홈페이지의 WebSite 만 본다.
 *
 * Next 문서(node_modules/next/dist/docs/01-app/02-guides/json-ld.md)가 권하는 대로
 * next/script 가 아니라 평범한 <script> 로 넣는다. 실행 코드가 아니라 데이터다.
 *
 ****************************************/

import { SITE_URL, absoluteUrl } from "@/app/lib/site";
import { localePath } from "@/app/lib/i18n/paths";
import { SITE_COPY, AUTHOR_NAME } from "@/app/lib/i18n/site-copy";
import { excerptOf } from "@/app/lib/posts/excerpt";
import { thumbnailOf } from "@/app/lib/posts/thumbnail";
import type { Lang, Post } from "@/app/lib/posts/types";

const BCP47: Record<Lang, string> = {
  ko: "ko-KR",
  en: "en-US",
};

/**
 * JSON.stringify 는 XSS에 쓰이는 문자열을 걸러주지 않는다.
 * `<` 를 유니코드로 바꿔 </script> 가 태그로 닫히지 않게 한다.
 */
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}

function person(lang: Lang) {
  return {
    "@type": "Person",
    name: AUTHOR_NAME,
    description: SITE_COPY[lang].author,
    url: SITE_URL,
  };
}

/** 홈에 넣는다. 구글이 검색 결과의 사이트 이름을 여기서 읽는다. */
export function websiteJsonLd(lang: Lang) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_COPY[lang].siteName,
    url: `${SITE_URL}${localePath(lang, "/")}`,
    description: SITE_COPY[lang].home,
    inLanguage: BCP47[lang],
    author: person(lang),
  };
}

/** 글 페이지에 넣는다. */
export function blogPostingJsonLd(post: Post, lang: Lang) {
  const url = `${SITE_URL}${localePath(lang, `/${post.slug}`)}`;

  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: excerptOf(post),
    image: absoluteUrl(thumbnailOf(post)),
    // 수정 이력을 따로 두지 않는다. 쓴 날이 곧 마지막으로 고친 날이다.
    datePublished: post.date,
    dateModified: post.date,
    author: person(lang),
    publisher: person(lang),
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    inLanguage: BCP47[lang],
    ...(post.tags.length > 0 ? { keywords: post.tags.join(", ") } : {}),
  };
}
