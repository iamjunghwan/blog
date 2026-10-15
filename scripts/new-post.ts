/****************************************
 *
 * 새 글 뼈대 만들기
 *
 * 사용법:
 *   pnpm new-post <slug> "<제목>" [태그,태그] [ko|en]
 *
 * 예:
 *   pnpm new-post use-hook "React 19의 use 훅" react,javascript
 *   pnpm new-post use-hook "The use hook in React 19" react,javascript en
 *
 * slug은 공개 URL이 되므로 자동 생성하지 않는다 — 제목은 한글인데 slug은
 * 영문 개념어라 기계적으로 옮길 수 없다 (Oxc, NDJSON-JSON, focus-trap 처럼).
 *
 * 같은 slug의 두 언어판이 짝이 된다. 그래서 충돌 검사는 해당 언어 폴더 안에서만
 * 하고, 영어판을 만들 때는 한국어 원문의 날짜를 물려받는다 — 썸네일 경로가
 * 날짜로 조립되므로 날짜가 갈리면 같은 그림의 PNG가 한 장 더 생긴다.
 *
 ****************************************/

import fs from "node:fs";
import path from "node:path";
import { POSTS_DIR, loadPosts, LANGS } from "@/app/lib/posts/repository";
import type { Lang } from "@/app/lib/posts/types";
import { ALL_TAG } from "@/app/lib/posts/constants";
import { localePath } from "@/app/lib/i18n/paths";

const USAGE = `사용법: pnpm new-post <slug> "<제목>" [태그,태그] [ko|en]
예:     pnpm new-post use-hook "React 19의 use 훅" react,javascript
        pnpm new-post use-hook "The use hook in React 19" react,javascript en`;

/** slug은 URL이 되므로 영문·숫자·하이픈만 받는다. */
const SLUG_PATTERN = /^[A-Za-z0-9][A-Za-z0-9-]*$/;

/** 라우트가 이미 쓰고 있어 글 slug으로 내줄 수 없는 이름. */
const RESERVED_SLUGS = [ALL_TAG, "en", "about", "post"];

function fail(message: string): never {
  console.error(`\n${message}\n`);
  process.exit(1);
}

function parseLang(raw: string | undefined): Lang {
  if (raw === undefined) {
    return "ko";
  }
  if (!LANGS.includes(raw as Lang)) {
    fail(`언어 '${raw}'는 없다. ${LANGS.join(" 또는 ")} 중 하나를 쓴다.\n\n${USAGE}`);
  }
  return raw as Lang;
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
  const [slug, title, rawTags, rawLang] = process.argv.slice(2);

  if (!slug || !title) {
    fail(USAGE);
  }
  if (!SLUG_PATTERN.test(slug)) {
    fail(`slug '${slug}'은 쓸 수 없다. 영문·숫자로 시작하고 영문·숫자·하이픈만 쓸 수 있다.`);
  }
  if (RESERVED_SLUGS.includes(slug)) {
    fail(`'${slug}'은 라우트가 쓰는 예약어라 slug으로 쓸 수 없다.`);
  }

  const lang = parseLang(rawLang);
  const langDir = path.join(POSTS_DIR, lang);
  const tags = parseTags(rawTags);

  // 기존 글을 실제 파서로 읽어 slug 충돌을 미리 잡는다.
  // 빌드가 어차피 막지만, 다 쓰고 나서 알게 되는 것보다 지금 아는 편이 낫다.
  // 같은 slug의 반대 언어판은 충돌이 아니라 짝이므로 같은 폴더만 본다.
  const existing = loadPosts(langDir, true, lang).find((post) => post.slug === slug);

  if (existing) {
    fail(`${lang}에 slug '${slug}'은 이미 "${existing.title}" (${existing.date})가 쓰고 있다.`);
  }

  // 반대 언어에 원문이 있으면 그 날짜를 쓴다. 두 판이 같은 썸네일을 가리키게 하고,
  // 목록에서도 나란히 서게 한다.
  const otherLang: Lang = lang === "ko" ? "en" : "ko";
  const counterpart = loadPosts(path.join(POSTS_DIR, otherLang), true, otherLang).find(
    (post) => post.slug === slug
  );
  const date = counterpart?.date ?? today();
  const [year, month] = date.split("-");

  const dir = path.join(langDir, year, month);
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
  const pairNote = counterpart
    ? `\n  ${otherLang} 원문 "${counterpart.title}" 의 날짜 ${date} 를 물려받았다.`
    : "";

  console.log(`
만들었다: ${relative}${pairNote}

  draft: true 로 열어뒀다. 다 쓰면 false로 바꾸거나 그 줄을 지운다.
  pnpm dev 로 http://localhost:3000${localePath(lang, `/${slug}`)} 에서 확인할 수 있다.
  이미지는 public/uploads/${year}/${month}/ 에 넣고 /uploads/... 로 참조한다.
`);
}

main();
