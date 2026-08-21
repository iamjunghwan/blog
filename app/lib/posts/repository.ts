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

/**
 * draft는 프로덕션 빌드에서만 숨긴다. dev에서는 미리보기용으로 보여준다.
 *
 * 환경값을 인자로 받는다. `process.env.NODE_ENV`는 Next 타입 정의에서 읽기 전용이라
 * 테스트에서 대입할 수 없고, 대입 대신 값을 넘기면 캐스팅도 전역 상태 조작도 없이
 * 순수 함수로 검증된다.
 */
export function shouldIncludeDrafts(
  nodeEnv: string | undefined = process.env.NODE_ENV
): boolean {
  return nodeEnv !== "production";
}

let cache: Post[] | null = null;

/**
 * content/posts의 글 목록.
 *
 * 캐시는 **프로덕션 빌드에서만** 쓴다. dev에서 캐시하면 md를 고쳐도 서버를
 * 재시작해야 반영된다 — 콘텐츠 파일은 webpack 모듈 그래프에 없어서 Fast Refresh가
 * 이 모듈을 다시 평가하지 않기 때문이다. 글을 쓰면서 바로 확인하는 게 md 전환의
 * 핵심이므로 dev에서는 매번 읽는다. 파일 16개 파싱은 충분히 싸다.
 */
export function allPosts(): Post[] {
  if (cache !== null) {
    return cache;
  }

  const posts = loadPosts(POSTS_DIR, shouldIncludeDrafts());

  if (process.env.NODE_ENV === "production") {
    cache = posts;
  }
  return posts;
}

/**
 * 날짜가 같으면 slug으로 갈라 정적 빌드 순서를 안정시킨다.
 * slug이 같은 경우는 없다 — assertUniqueSlugs가 이 비교자보다 먼저 돌아 빌드를 세운다.
 */
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
