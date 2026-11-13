/****************************************
 *
 * 블로그 자기소개용 숫자
 *
 * 메인 히어로가 "언제부터 썼는지"와 "무엇을 얼마나 썼는지"를 말하려면 숫자가
 * 필요한데, 그 숫자를 손으로 적으면 반드시 낡는다. 글을 쓸 때마다 사람이
 * 가서 고쳐야 하고, 안 고치면 간판이 거짓말을 한다.
 *
 * 그래서 콘텐츠에서 계산한다. 빌드 때 한 번 돌고 결과만 HTML 에 박히므로
 * 클라이언트 비용은 0 이다.
 *
 ****************************************/

import type { Post } from "@/app/lib/posts/types";

export interface TagCount {
  tag: string;
  count: number;
}

/**
 * 가장 오래된 글의 연월. "2025.03" 꼴.
 *
 * frontmatter 의 date 는 "2025-03-10" 꼴 문자열이다. Date 로 파싱하지 않고
 * 문자열을 그대로 비교한다 — ISO 날짜는 사전순이 곧 시간순이고, 파싱하면
 * 시간대 때문에 하루가 밀릴 수 있다.
 *
 * @returns 글이 하나도 없으면 null
 */
export function writingSince(posts: Post[]): string | null {
  let earliest: string | null = null;

  for (const post of posts) {
    if (earliest === null || post.date < earliest) {
      earliest = post.date;
    }
  }
  if (earliest === null) return null;

  return earliest.slice(0, 7).replace("-", ".");
}

/**
 * 많이 쓴 순서대로 태그와 그 글 수.
 *
 * 수가 같으면 이름순으로 가른다. 그러지 않으면 글을 하나 더 쓸 때마다
 * 같은 수의 태그끼리 순서가 뒤바뀌어, 내용이 안 변했는데 빌드 결과가 달라진다.
 *
 * @param limit 돌려줄 개수. 태그가 그보다 적으면 있는 만큼만 준다
 */
export function topTags(posts: Post[], limit: number): TagCount[] {
  const counts = new Map<string, number>();

  for (const post of posts) {
    // 한 글 안의 중복은 한 번만 센다. frontmatter 는 사람이 손으로 쓰는 곳이라
    // tags: [ai, ai] 가 들어올 수 있고, parse.ts 는 그걸 거르지 않는다.
    // 거르지 않으면 글 1편짜리 태그가 2편으로 보인다 — 간판이 거짓말을 한다.
    for (const tag of new Set(post.tags)) {
      counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag))
    .slice(0, limit);
}
