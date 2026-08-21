import fs from "node:fs";
import path from "node:path";
import { parsePost } from "@/app/lib/posts/parse";
import type { Post } from "@/app/lib/posts/types";

export const POSTS_DIR = path.join(process.cwd(), "content", "posts");

/**
 * 폴더에서 글을 읽어 date 내림차순으로 정렬한다.
 * dir을 인자로 받아 테스트에서 픽스처를 쓸 수 있게 한다.
 */
export function loadPosts(dir: string, includeDrafts: boolean): Post[] {
  const files = fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".md"))
    .sort();

  const entries = files.map((file) => ({
    file,
    post: parsePost(fs.readFileSync(path.join(dir, file), "utf8"), file),
  }));

  assertUniqueSlugs(entries);

  return entries
    .map((entry) => entry.post)
    .filter((post) => includeDrafts || !post.draft)
    .sort(byDateDescThenSlug);
}

let cache: Post[] | null = null;

/**
 * content/posts의 글 목록. 빌드 중 반복 파싱을 막기 위해 캐시한다.
 * draft는 프로덕션 빌드에서만 제외한다 (dev에서는 미리보기).
 */
export function allPosts(): Post[] {
  if (cache === null) {
    cache = loadPosts(POSTS_DIR, process.env.NODE_ENV !== "production");
  }
  return cache;
}

/** 날짜가 같으면 slug으로 갈라 정적 빌드 순서를 안정시킨다. */
function byDateDescThenSlug(a: Post, b: Post): number {
  if (a.date !== b.date) {
    return a.date < b.date ? 1 : -1;
  }
  return a.slug < b.slug ? -1 : 1;
}

/** slug 중복은 한 글이 조용히 사라지는 결과를 낳으므로 빌드를 실패시킨다. */
function assertUniqueSlugs(entries: { file: string; post: Post }[]): void {
  const seen = new Map<string, string>();

  for (const { file, post } of entries) {
    const previous = seen.get(post.slug);
    if (previous !== undefined) {
      throw new Error(
        `slug '${post.slug}'가 중복됩니다: ${previous} 와 ${file}`
      );
    }
    seen.set(post.slug, file);
  }
}
