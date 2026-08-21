import type { Post } from "@/app/lib/posts/types";

export const DEFAULT_THUMBNAIL = "/iaman.png";

// ![alt](경로 "title") 에서 경로만 잡는다. 공백/닫는 괄호/> 앞에서 멈춘다.
const MARKDOWN_IMAGE = /!\[[^\]]*\]\(\s*<?([^\s)>]+)>?/;
const HTML_IMAGE = /<img[^>]+src\s*=\s*["']([^"']+)["']/i;

/**
 * 대표 이미지를 결정한다.
 * frontmatter thumbnail → 본문 첫 이미지(markdown 문법과 raw img 중 먼저 나온 것) → 기본 이미지
 */
export function thumbnailOf(post: Pick<Post, "thumbnail" | "body">): string {
  if (post.thumbnail) {
    return normalize(post.thumbnail);
  }

  const markdownMatch = MARKDOWN_IMAGE.exec(post.body);
  const htmlMatch = HTML_IMAGE.exec(post.body);

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
