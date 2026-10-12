/****************************************
 *
 * 콘텐츠 타입 정의
 *
 ****************************************/

export type PostMeta = {
  slug: string;
  title: string;
  /** YYYY-MM-DD */
  date: string;
  tags: string[];
  thumbnail?: string;
  draft: boolean;
};

export type Post = PostMeta & {
  /** 렌더 전 markdown 본문 */
  body: string;
};

/** 검색 모달에 넘기는 최소 정보 (본문 제외) */
export type SearchEntry = Pick<PostMeta, "slug" | "title" | "date" | "tags">;
