/****************************************
 *
 * 새 글 뼈대 만들기
 *
 * 사용법:
 *   pnpm new-post <slug> "<제목>" [태그,태그]
 *
 * 예:
 *   pnpm new-post use-hook "React 19의 use 훅" react,javascript
 *
 * slug은 공개 URL이 되므로 자동 생성하지 않는다 — 제목은 한글인데 slug은
 * 영문 개념어라 기계적으로 옮길 수 없다 (Oxc, NDJSON-JSON, focus-trap 처럼).
 *
 ****************************************/

import fs from "node:fs";
import path from "node:path";
import { POSTS_DIR, loadPosts } from "@/app/lib/posts/repository";
import { ALL_TAG } from "@/app/lib/posts/constants";

const USAGE = `사용법: pnpm new-post <slug> "<제목>" [태그,태그]
예:     pnpm new-post use-hook "React 19의 use 훅" react,javascript`;

/** slug은 URL이 되므로 영문·숫자·하이픈만 받는다. */
const SLUG_PATTERN = /^[A-Za-z0-9][A-Za-z0-9-]*$/;

function fail(message: string): never {
  console.error(`\n${message}\n`);
  process.exit(1);
}

function parseTags(raw: string | undefined): string[] {
  const tags = (raw ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag !== "");

  if (tags.length === 0) {
    fail(`태그가 필요하다. frontmatter의 tags는 필수값이다.\n\n${USAGE}`);
  }
  if (tags.includes(ALL_TAG)) {
    fail(`'${ALL_TAG}'는 전체 목록 라우트가 쓰는 예약어라 태그로 쓸 수 없다.`);
  }
  return tags;
}

/** YYYY-MM-DD. 로컬 시간대 기준 — 글쓴이가 보는 날짜와 맞춘다. */
function today(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${now.getFullYear()}-${month}-${day}`;
}

function buildFrontmatter(
  slug: string,
  title: string,
  date: string,
  tags: string[]
): string {
  return [
    "---",
    `slug: ${slug}`,
    `title: ${JSON.stringify(title)}`,
    `date: ${date}`,
    `tags: [${tags.map((tag) => JSON.stringify(tag)).join(", ")}]`,
    "draft: true",
    "---",
  ].join("\n");
}

function main(): void {
  const [slug, title, rawTags] = process.argv.slice(2);

  if (!slug || !title) {
    fail(USAGE);
  }
  if (!SLUG_PATTERN.test(slug)) {
    fail(`slug '${slug}'은 쓸 수 없다. 영문·숫자로 시작하고 영문·숫자·하이픈만 쓸 수 있다.`);
  }
  if (slug === ALL_TAG) {
    fail(`'${ALL_TAG}'는 전체 목록 라우트가 쓰는 예약어라 slug으로 쓸 수 없다.`);
  }

  const tags = parseTags(rawTags);
  const date = today();
  const [year, month] = date.split("-");

  // 기존 글을 실제 파서로 읽어 slug 충돌을 미리 잡는다.
  // 빌드가 어차피 막지만, 다 쓰고 나서 알게 되는 것보다 지금 아는 편이 낫다.
  const existing = loadPosts(POSTS_DIR, true).find((post) => post.slug === slug);

  if (existing) {
    fail(`slug '${slug}'은 이미 "${existing.title}" (${existing.date})가 쓰고 있다.`);
  }

  const dir = path.join(POSTS_DIR, year, month);
  const filePath = path.join(dir, `${slug}.md`);

  if (fs.existsSync(filePath)) {
    fail(`${filePath} 가 이미 있다.`);
  }

  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    filePath,
    `${buildFrontmatter(slug, title, date, tags)}\n\n# ${title}\n\n`,
    "utf8"
  );

  const relative = path.relative(process.cwd(), filePath).split(path.sep).join("/");

  console.log(`
만들었다: ${relative}

  draft: true 로 열어뒀다. 다 쓰면 false로 바꾸거나 그 줄을 지운다.
  pnpm dev 로 http://localhost:3000/${slug} 에서 확인할 수 있다.
  이미지는 public/uploads/${year}/${month}/ 에 넣고 /uploads/... 로 참조한다.
`);
}

main();
