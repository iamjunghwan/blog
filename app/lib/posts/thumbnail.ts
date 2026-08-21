import type { Post } from "@/app/lib/posts/types";

export const DEFAULT_THUMBNAIL = "/iaman.png";

// ![alt](경로 "title") 에서 경로만 잡는다. 공백/닫는 괄호/> 앞에서 멈춘다.
const MARKDOWN_IMAGE = /!\[[^\]]*\]\(\s*<?([^\s)>]+)>?/;
const HTML_IMAGE = /<img[^>]+src\s*=\s*["']([^"']+)["']/i;

// 펜스 줄: 최대 3칸 들여쓰기 + ` 또는 ~ 3개 이상 + 나머지(info string 또는 빈 문자열)
const FENCE_LINE = /^ {0,3}(`{3,}|~{3,})(.*)$/;

/**
 * 대표 이미지를 결정한다.
 * frontmatter thumbnail → 본문 첫 이미지(markdown 문법과 raw img 중 먼저 나온 것) → 기본 이미지
 *
 * 코드블록 안의 이미지는 예시 코드이므로 후보에서 뺀다. markdown-it도 펜스 안을
 * 이미지로 렌더하지 않으므로, 빼지 않으면 화면에 없는 이미지가 썸네일이 된다.
 */
export function thumbnailOf(post: Pick<Post, "thumbnail" | "body">): string {
  if (post.thumbnail) {
    return normalize(post.thumbnail);
  }

  // 두 정규식을 같은 문자열에 돌리므로 펜스를 지워도 등장 순서 비교는 유효하다.
  const body = stripFencedBlocks(post.body);

  const markdownMatch = MARKDOWN_IMAGE.exec(body);
  const htmlMatch = HTML_IMAGE.exec(body);

  if (markdownMatch && htmlMatch) {
    return normalize(
      markdownMatch.index < htmlMatch.index ? markdownMatch[1] : htmlMatch[1]
    );
  }
  if (markdownMatch) {
    return normalize(markdownMatch[1]);
  }
  if (htmlMatch) {
    return normalize(htmlMatch[1]);
  }
  return DEFAULT_THUMBNAIL;
}

function normalize(src: string): string {
  if (/^(https?:)?\/\//.test(src)) {
    return src;
  }
  return src.startsWith("/") ? src : `/${src}`;
}

/**
 * 코드 펜스 구간을 지운다. 정규식 하나로는 부족해서 줄 단위로 훑는다.
 * CommonMark 규칙을 따른다:
 *  - 여는 펜스는 들여쓰기 최대 3칸, 마커는 ` 또는 ~ 3개 이상
 *  - 닫는 펜스는 같은 문자로 여는 펜스 이상 길이여야 하고 뒤에 내용이 없어야 한다
 *    (그래서 ````로 감싼 안쪽 ```가 블록을 조기에 닫지 않는다)
 *  - 닫는 펜스가 없으면 문서 끝까지 코드로 본다
 */
function stripFencedBlocks(body: string): string {
  const kept: string[] = [];
  let open: { marker: string; length: number } | null = null;

  for (const line of body.split("\n")) {
    const match = FENCE_LINE.exec(line);

    if (open === null) {
      if (match) {
        open = { marker: match[1][0], length: match[1].length };
        continue;
      }
      kept.push(line);
      continue;
    }

    const closes =
      match !== null &&
      match[1][0] === open.marker &&
      match[1].length >= open.length &&
      match[2].trim() === "";

    if (closes) {
      open = null;
    }
  }

  return kept.join("\n");
}
