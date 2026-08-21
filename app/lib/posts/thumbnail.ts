import type { Post } from "@/app/lib/posts/types";

export const DEFAULT_THUMBNAIL = "/iaman.png";

// ![alt](경로 "title") 에서 경로만 잡는다. 공백/닫는 괄호/> 앞에서 멈춘다.
const MARKDOWN_IMAGE = /!\[[^\]]*\]\(\s*<?([^\s)>]+)>?/;
const HTML_IMAGE = /<img[^>]+src\s*=\s*["']([^"']+)["']/i;

// 펜스로 감싼 코드블록. 여는 줄의 info string(```markdown 등)까지 함께 삼킨다.
const FENCED_BLOCK = /^(```|~~~)[\s\S]*?^\1[ \t]*$/gm;

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
  const body = post.body.replace(FENCED_BLOCK, "");

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
