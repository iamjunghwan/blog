/****************************************
 *
 * 사이트 소개 문구
 *
 * 검색 결과에 그대로 나가는 문장이다. 페이지마다 복사해 두면 한쪽만 고치다
 * 어긋나므로 — 실제로 "This blog was created by an." 이라는 잘린 문장이
 * 네 곳에 박혀 있었다 — 여기 한 곳에서만 고친다.
 *
 * 구글은 검색 결과에서 설명문을 대략 155자쯤에서 자른다. 그 안에서
 * 페이지마다 다른 문장을 쓴다. 같은 문장이 반복되면 구글이 무시하고
 * 본문에서 임의로 뽑아 쓴다.
 *
 ****************************************/

import type { Lang } from "@/app/lib/posts/types";

type SiteCopy = {
  /** 사이트 이름. og:site_name과 구조화 데이터가 함께 쓴다. */
  siteName: string;
  /** 홈 */
  home: string;
  /** 소개 */
  about: string;
  /** 글 목록 */
  postList: string;
  /** 글쓴이를 한 줄로. 구조화 데이터의 Person.description에 들어간다. */
  author: string;
};

export const SITE_COPY: Record<Lang, SiteCopy> = {
  ko: {
    siteName: "iaman",
    home: "'왜'라는 질문으로 문제에 접근하고 해결하는 프론트엔드 엔지니어의 블로그. 궁금한 것을 파고들어 공부하고 기록합니다.",
    about:
      "'왜'라는 질문으로 문제에 접근하고 해결하는 프론트엔드 엔지니어입니다. 어떤 사람이고 무엇을 공부해 왔는지 적었습니다.",
    postList:
      "'왜'라는 질문으로 문제에 접근하는 프론트엔드 엔지니어가 쓴 글 목록. 프론트엔드, 자바스크립트, 브라우저 동작 원리를 공부하고 기록합니다.",
    author: "'왜'라는 질문으로 문제에 접근하고 해결하는 프론트엔드 엔지니어",
  },
  en: {
    siteName: "iaman",
    home: "A blog by a frontend engineer who approaches problems by asking why. Digging into whatever I'm curious about, studying it, and writing it down.",
    about:
      "A frontend engineer who approaches and solves problems by asking why. Who I am and what I have been studying.",
    postList:
      "Posts by a frontend engineer who approaches problems by asking why — frontend, JavaScript, and how browsers actually work.",
    author: "A frontend engineer who approaches and solves problems by asking why",
  },
};

/** 글쓴이 이름. 구조화 데이터의 author에 들어간다. */
export const AUTHOR_NAME = "iamjunghwan";
