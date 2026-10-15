import fs from "node:fs";
import path from "node:path";
import { parsePost } from "@/app/lib/posts/parse";
import type { Lang, Post } from "@/app/lib/posts/types";

export const POSTS_DIR = path.join(process.cwd(), "content", "posts");

/** 글 폴더에 있어야 하는 언어들. 폴더가 없으면 빌드가 실패한다. */
export const LANGS: readonly Lang[] = ["ko", "en"];

/**
 * 한 언어 폴더에서 글을 읽어 date 내림차순으로 정렬한다.
 * dir을 인자로 받아 테스트에서 픽스처를 쓸 수 있게 한다.
 *
 * 글이 연도/월 폴더 아래 중첩되어 있으므로 재귀적으로 훑는다.
 */
export function loadPosts(dir: string, includeDrafts: boolean, lang: Lang): Post[] {
  const files = collectMarkdownFiles(dir).sort();

  const entries = files.map((file) => ({
    file,
    post: parsePost(fs.readFileSync(path.join(dir, file), "utf8"), file, lang),
  }));

  assertUniqueSlugs(entries);

  return entries
    .map((entry) => entry.post)
    .filter((post) => includeDrafts || !post.draft)
    .sort(byDateDescThenSlugThenLang);
}

/**
 * 모든 언어 폴더를 읽어 합친다.
 *
 * 언어 폴더가 없으면 던진다. 조용히 넘기면 번역을 통째로 빠뜨린 채
 * 빌드가 성공해 버린다. 언어를 늘릴 때 폴더를 만들라고 알려주는 편이 낫다.
 */
export function loadAllPosts(baseDir: string, includeDrafts: boolean): Post[] {
  const all: Post[] = [];

  for (const lang of LANGS) {
    const dir = path.join(baseDir, lang);
    if (!fs.existsSync(dir)) {
      throw new Error(`글 폴더가 없습니다: ${dir} ('${lang}' 폴더를 만드세요)`);
    }
    all.push(...loadPosts(dir, includeDrafts, lang));
  }

  return all.sort(byDateDescThenSlugThenLang);
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

  const posts = loadAllPosts(POSTS_DIR, shouldIncludeDrafts());

  // 캐시 여부를 NODE_ENV로 다시 판단하지 않는다. 같은 개념을 두 곳에서 각자 비교하면
  // 한쪽만 바뀌었을 때 캐싱과 draft 표시가 조용히 어긋난다.
  if (!shouldIncludeDrafts()) {
    cache = posts;
  }
  return posts;
}

/**
 * dir 아래를 재귀적으로 훑어 .md 파일을 dir 기준 상대경로로 모은다.
 *
 * 각 단계에서 디렉터리 항목을 이름순으로 정렬해 순회 순서를 결정적으로 만든다 —
 * assertUniqueSlugs의 에러 메시지가 항상 같은 순서로 파일을 가리키게 하기 위해서다.
 * 상대경로는 Windows에서도 슬래시(`/`)로 통일한다 — 에러 메시지가 OS에 따라
 * 달라지지 않게 하기 위해서다.
 */
function collectMarkdownFiles(dir: string): string[] {
  const result: string[] = [];

  for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) =>
    a.name < b.name ? -1 : a.name > b.name ? 1 : 0
  )) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      for (const nested of collectMarkdownFiles(fullPath)) {
        result.push(`${entry.name}/${nested}`);
      }
      continue;
    }

    if (entry.isFile() && entry.name.endsWith(".md")) {
      result.push(entry.name);
    }
  }

  return result;
}

/**
 * 날짜 내림차순, 같으면 slug, 그래도 같으면 언어로 가른다.
 *
 * slug은 더 이상 전역 유일하지 않다 — 같은 글의 한국어판과 영어판이 같은 slug을
 * 쓰고(그게 두 판을 잇는 열쇠다), 번역을 같은 날 올리면 date까지 같아진다.
 * 그때 lang까지 보지 않으면 compare(a,b)와 compare(b,a)가 모두 1이 되어
 * 비교자 계약이 깨지고, 정렬 결과가 알고리즘의 내부 동작에 좌우된다.
 */
function byDateDescThenSlugThenLang(a: Post, b: Post): number {
  if (a.date !== b.date) {
    return a.date < b.date ? 1 : -1;
  }
  if (a.slug !== b.slug) {
    return a.slug < b.slug ? -1 : 1;
  }
  return a.lang < b.lang ? -1 : a.lang > b.lang ? 1 : 0;
}

/**
 * slug 중복은 한 글이 조용히 사라지는 결과를 낳으므로 빌드를 실패시킨다.
 *
 * 한 언어 폴더 안에서만 검사한다. 같은 글의 한국어판과 영어판은 slug이 같아야
 * 하고(그게 두 판을 잇는 열쇠다), 그 둘은 서로 다른 폴더에 있다.
 */
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
