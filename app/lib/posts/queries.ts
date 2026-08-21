import type { Post, SearchEntry } from "@/app/lib/posts/types";

/** 목록 한 페이지에 보여줄 글 수. 이 값만 쓴다. */
export const PAGE_SIZE = 5;

/** 목록 라우트에서 전체를 뜻하는 slug */
const ALL = "all";

export function postBySlug(posts: Post[], slug: string): Post | undefined {
  return posts.find((post) => post.slug === slug);
}

/** 태그는 정확히 비교한다. 부분 문자열 매칭은 js가 nextjs에 걸리는 버그였다. */
export function postsByTag(posts: Post[], tag: string): Post[] {
  if (tag === ALL) {
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
  const start = (page - 1) * PAGE_SIZE;

  return { items: items.slice(start, start + PAGE_SIZE), totalPages };
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

  for (const slug of [ALL, ...allTags(posts)]) {
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
