/****************************************
 *
 * 콘텐츠 타입 정의
 *
 ****************************************/

/** 지원하는 글 언어. 'kr'은 국가 코드라 쓰지 않는다. */
export type Lang = "ko" | "en";

export type PostMeta = {
  slug: string;
  title: string;
  /** YYYY-MM-DD */
  date: string;
  tags: string[];
  thumbnail?: string;
  /** 검색·공유용 설명문. 없으면 본문에서 뽑는다 (excerpt.ts). */
  description?: string;
  draft: boolean;
  /** 이 글이 어느 언어인지. 읽은 폴더가 정한다 — frontmatter에 적지 않는다. */
  lang: Lang;
  /** 언어 폴더 기준 상대 경로. 스크립트가 원본 파일을 되찾는 데 쓴다. */
  fileName: string;
};

export type Post = PostMeta & {
  /** 렌더 전 markdown 본문 */
  body: string;
};

/** 검색 모달에 넘기는 최소 정보 (본문 제외) */
export type SearchEntry = Pick<PostMeta, "slug" | "title" | "date" | "tags">;

/**
 * 메인 캐러셀에 넘기는 최소 정보.
 *
 * 캐러셀은 클라이언트 컴포넌트라 props가 전부 직렬화되어 HTML에 실린다.
 * Post를 그대로 넘기면 마크다운 본문(body) 다섯 편이 메인 HTML에 복사된다.
 * 썸네일 경로는 body를 읽어야 정해지므로 서버에서 thumbnailOf()를 미리 돌리고
 * 결과 문자열만 넘긴다. SearchEntry와 같은 이유로 만든 타입이다.
 */
export type CarouselSlide = Pick<PostMeta, "slug" | "title" | "date" | "tags"> & {
  /** thumbnailOf()가 서버에서 결정한 최종 경로 */
  thumbnailSrc: string;
};
