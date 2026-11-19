/****************************************
 *
 * 블로그 자기소개용 숫자
 *
 * About 패널이 "언제부터 썼는지"를 말하려면 숫자가 필요한데, 그 숫자를
 * 손으로 적으면 반드시 낡는다. 글을 쓸 때마다 사람이 가서 고쳐야 하고,
 * 안 고치면 간판이 거짓말을 한다.
 *
 * 그래서 콘텐츠에서 계산한다. 빌드 때 한 번 돌고 결과만 HTML 에 박히므로
 * 클라이언트 비용은 0 이다.
 *
 ****************************************/

import type { Post } from "@/app/lib/posts/types";

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
