import type { Post, SearchEntry } from "@/app/lib/posts/types";
import { ALL_TAG } from "@/app/lib/posts/constants";

/** 목록 한 페이지에 보여줄 글 수. 이 값만 쓴다. */
export const PAGE_SIZE = 5;

// ALL_TAG는 constants.ts에 있다. parse.ts도 같은 값을 필요로 하는데, 여기에 두면
// 수집 계층이 조회 계층에 의존하게 되어 파이프라인 방향이 뒤집힌다.

export function postBySlug(posts: Post[], slug: string): Post | undefined {
  return posts.find((post) => post.slug === slug);
}

/** 태그는 정확히 비교한다. 부분 문자열 매칭은 js가 nextjs에 걸리는 버그였다. */
export function postsByTag(posts: Post[], tag: string): Post[] {
  if (tag === ALL_TAG) {
    return posts;
  }
  return posts.filter((post) => post.tags.includes(tag));
}

export function allTags(posts: Post[]): string[] {
  const tags = new Set<string>();

  for (const post of posts) {
    for (const tag of post.tags) {
      tags.add(tag);
    }
  }
  return [...tags].sort();
}

export function paginate<T>(
  items: T[],
  page: number
): { items: T[]; totalPages: number } {
  const totalPages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));

  // 유효하지 않은 page는 빈 결과를 준다. 호출자는 그것으로 404를 판단한다.
  // 1페이지로 클램프하면 존재하지 않는 주소에 실제 글이 노출된다.
  // (가드가 없으면 slice의 음수 인덱스 때문에 page=-1이 최신 글 2개를 돌려준다)
  if (!Number.isInteger(page) || page < 1) {
    return { items: [], totalPages };
  }

  const start = (page - 1) * PAGE_SIZE;

  return { items: items.slice(start, start + PAGE_SIZE), totalPages };
}

/**
 * 검색어로 제목을 거른다. 대소문자를 무시하고 부분 일치를 본다.
 * 검색어가 비었거나 공백뿐이면 전체를 준다 (모달을 열었을 때 목록이 보이는 동작).
 *
 * 훅이 아니라 여기에 두는 이유: 순수 함수라 컴포넌트 테스트 인프라 없이
 * node:test로 그대로 검증된다. 검색 동작이 사용자에게 보이는 계약이므로 고정한다.
 */
export function filterByTitle(
  entries: SearchEntry[],
  query: string
): SearchEntry[] {
  const keyword = query.trim().toLowerCase();

  if (keyword === "") {
    return entries;
  }
  return entries.filter((entry) =>
    entry.title.toLowerCase().includes(keyword)
  );
}

/** 검색 모달에 넘길 최소 정보. 본문을 빼서 페이로드를 작게 유지한다. */
export function searchIndex(posts: Post[]): SearchEntry[] {
  return posts.map((post) => ({
    slug: post.slug,
    title: post.title,
    date: post.date,
    tags: post.tags,
  }));
}

/** /post/[slug]/[...page] 의 generateStaticParams 값 */
export function postListParams(
  posts: Post[]
): { slug: string; page: string[] }[] {
  const params: { slug: string; page: string[] }[] = [];

  for (const slug of [ALL_TAG, ...allTags(posts)]) {
    const { totalPages } = paginate(postsByTag(posts, slug), 1);

    for (let page = 1; page <= totalPages; page += 1) {
      params.push({ slug, page: [String(page)] });
    }
  }
  return params;
}

/** 사이트맵에 넣을 목록 페이지 경로 */
export function postListUrls(posts: Post[]): string[] {
  return postListParams(posts).map(
    ({ slug, page }) => `/post/${slug}/${page[0]}`
  );
}
