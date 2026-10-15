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
