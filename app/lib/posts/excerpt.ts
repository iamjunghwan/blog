import type { Post } from "@/app/lib/posts/types";
import { stripFencedBlocks } from "@/app/lib/posts/markdown";

/** 검색 결과에서 잘리지 않는 대략적인 상한. 구글은 155자 안팎에서 자른다. */
const MAX_LENGTH = 155;

/**
 * 본문에서 검색·공유용 설명문을 뽑는다.
 *
 * frontmatter에 `description`을 적으면 그쪽이 우선이고, 없으면 이걸 쓴다.
 * 글마다 설명을 손으로 쓰지 않아도 검색 결과에 본문이 보이게 하는 것이 목적이다.
 *
 * 코드·이미지·표처럼 설명문으로 읽히지 않는 것은 걷어내고, 첫 문단에서 끊는다.
 */
export function excerptOf(
  post: Pick<Post, "body" | "description">,
  maxLength: number = MAX_LENGTH
): string {
  if (post.description) {
    return post.description;
  }

  const text = toPlainText(post.body);

  return text.length <= maxLength ? text : truncate(text, maxLength);
}

function toPlainText(body: string): string {
  return (
    stripFencedBlocks(body)
      .split(/\r\n|\r|\n/)
      // 제목 줄은 이미 title로 쓰이므로 설명문에 넣지 않는다.
      .filter((line) => !/^\s{0,3}#{1,6}\s/.test(line))
      // 표는 셀 구분자가 그대로 읽혀서 설명문으로 쓸 수 없다.
      .filter((line) => !/^\s*\|/.test(line))
      // 구분선
      .filter((line) => !/^\s*([-*_]\s*){3,}$/.test(line))
      .join("\n")
      // 이미지는 통째로 버린다 (대체 텍스트만 남으면 문맥이 깨진다).
      .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
      // 링크는 보이는 글자만 남긴다.
      .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
      // raw HTML 태그
      .replace(/<[^>]+>/g, "")
      // 강조·인라인 코드 기호
      .replace(/[*_~`]/g, "")
      // 인용·목록 머리표
      .replace(/^\s*[>\-+*]\s+/gm, "")
      .replace(/^\s*\d+[.)]\s+/gm, "")
      // HTML 엔티티 중 실제로 등장하는 것들
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&amp;/g, "&")
      .replace(/\s+/g, " ")
      .trim()
  );
}

/** 단어 중간에서 자르지 않는다. */
function truncate(text: string, maxLength: number): string {
  const cut = text.slice(0, maxLength);
  const lastSpace = cut.lastIndexOf(" ");

  return `${(lastSpace > maxLength * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}
