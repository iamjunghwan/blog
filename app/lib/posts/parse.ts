import matter from "gray-matter";
import type { Post } from "@/app/lib/posts/types";
import { ALL_TAG } from "@/app/lib/posts/queries";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * md 문자열을 Post로 파싱한다.
 * 필수 필드가 없으면 파일명을 포함한 에러를 던져 빌드를 실패시킨다.
 * 조용히 넘기면 글이 사이트에서 사라지는데 아무도 알 수 없다.
 */
export function parsePost(source: string, fileName: string): Post {
  // 이 저장소는 core.autocrlf=true 라 워킹트리 파일이 CRLF다.
  // 파싱 경계에서 한 번 정규화해 아래 모듈들이 줄바꿈을 신경 쓰지 않게 한다.
  const { data, content } = matter(source.replace(/\r\n/g, "\n"));

  return {
    slug: requireString(data.slug, "slug", fileName),
    title: requireString(data.title, "title", fileName),
    date: requireDate(data.date, fileName),
    tags: requireTags(data.tags, fileName),
    thumbnail:
      typeof data.thumbnail === "string" && data.thumbnail.trim() !== ""
        ? data.thumbnail.trim()
        : undefined,
    draft: data.draft === true,
    body: content.trim(),
  };
}

function requireString(value: unknown, field: string, fileName: string): string {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error(
      `${fileName}: frontmatter의 '${field}'는 비어 있지 않은 문자열이어야 합니다.`
    );
  }
  return value.trim();
}

/**
 * YAML은 따옴표 없는 2026-07-14를 Date 객체로 파싱한다.
 * Date는 UTC 자정이므로 ISO 앞 10자를 그대로 쓰면 원래 날짜가 보존된다.
 */
function requireDate(value: unknown, fileName: string): string {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === "string" && DATE_PATTERN.test(value.trim())) {
    return value.trim();
  }
  throw new Error(
    `${fileName}: frontmatter의 'date'는 YYYY-MM-DD 형식이어야 합니다. (받은 값: ${String(value)})`
  );
}

function requireTags(value: unknown, fileName: string): string[] {
  if (!Array.isArray(value)) {
    throw new Error(
      `${fileName}: frontmatter의 'tags'는 YAML 배열이어야 합니다. 예: tags: [javascript, react]`
    );
  }

  const tags = value.map((tag) => String(tag).trim()).filter((tag) => tag !== "");

  if (tags.length === 0) {
    throw new Error(`${fileName}: frontmatter의 'tags'가 비어 있습니다.`);
  }

  // 'all'은 전체 목록 라우트(/post/all/1)가 쓰는 예약어다. 태그로 허용하면 그 태그로는
  // 필터가 불가능해지고 목록 라우트도 중복 생성된다. 조용히 무시하지 않고 빌드를 세운다.
  if (tags.includes(ALL_TAG)) {
    throw new Error(
      `${fileName}: '${ALL_TAG}'는 전체 목록 라우트가 쓰는 예약어라 태그로 쓸 수 없습니다.`
    );
  }

  return tags;
}
