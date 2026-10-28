/****************************************
 *
 * 본문 폰트 서브셋 만들기
 *
 * 사용법:
 *   pnpm fonts
 *
 * Pretendard Variable 원본(2MB)에서 이 블로그가 실제로 쓰는 글자만 남긴다.
 *
 * 한글 폰트가 무거운 이유는 디자인이 아니라 글자 수다 — 음절이 11,172자라
 * 라틴(약 100자)의 110배다. 그런데 이 블로그가 쓰는 한글은 700자 안팎,
 * 전체의 6% 정도다. 나머지 94%를 내려받게 할 이유가 없다.
 *
 * 변수 폰트라 파일 하나에 굵기 100~900이 전부 들어 있다. 굵기별로 파일을
 * 나누지 않아도 되고, font-bold·font-semibold가 가짜 굵게로 번지지 않는다.
 *
 * 글에 새 글자를 쓰면 이걸 다시 돌려야 한다. 깜빡해도 조용히 넘어가지 않게
 * app/lib/fonts/subset.test.ts 가 매니페스트와 본문을 대조해 실패시킨다.
 *
 ****************************************/

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import subsetFont from "subset-font";

/** Pretendard Variable 원본. 버전을 고정한다 — 글자 모양이 조용히 바뀌면 안 된다. */
const SOURCE_URL =
  "https://cdn.jsdelivr.net/npm/pretendard@1.3.9/dist/web/variable/woff2/PretendardVariable.woff2";

/** 원본은 저장소에 넣지 않는다(2MB). 받아서 여기 두고 재사용한다. */
const CACHE = path.join(".next", "cache", "pretendard-variable.woff2");

const OUT = path.join("public", "fonts", "pretendard-subset.woff2");
const MANIFEST = path.join("public", "fonts", "pretendard-subset.manifest.json");

const POSTS_DIR = path.join("content", "posts");

/** 글 말고도 화면에 나오는 한글이 있는 파일들. 빠뜨리면 그 글자만 시스템 폰트로 빠진다. */
const UI_SOURCES = [
  path.join("app", "lib", "i18n", "messages.ts"),
  path.join("app", "lib", "i18n", "site-copy.ts"),
  path.join("app", "not-found.tsx"),
  path.join("components", "Layout", "Footer.tsx"),
];

/** 글에 안 나와도 항상 넣는다 — 라틴·숫자·문장부호와 일반 구두점. */
function baseline(): string {
  let out = "";
  for (let cp = 0x20; cp <= 0x24f; cp++) out += String.fromCodePoint(cp);
  for (let cp = 0x2000; cp <= 0x206f; cp++) out += String.fromCodePoint(cp);
  return out;
}

function collectFrom(file: string, into: Set<string>): void {
  if (!fs.existsSync(file)) {
    return;
  }
  for (const char of fs.readFileSync(file, "utf8")) {
    into.add(char);
  }
}

function walk(dir: string, into: Set<string>): void {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, into);
    } else if (full.endsWith(".md")) {
      collectFrom(full, into);
    }
  }
}

/** 페이지에 나올 수 있는 모든 글자. 테스트가 같은 함수를 쓰도록 내보낸다. */
export function usedCharacters(): string {
  const chars = new Set<string>();

  walk(POSTS_DIR, chars);
  for (const file of UI_SOURCES) {
    collectFrom(file, chars);
  }
  for (const char of baseline()) {
    chars.add(char);
  }

  // 정렬해 두면 매니페스트 diff가 "무엇이 늘었나"로 읽힌다.
  return [...chars].sort().join("");
}

async function source(): Promise<Buffer> {
  if (fs.existsSync(CACHE)) {
    return fs.readFileSync(CACHE);
  }

  console.log(`원본을 받는다: ${SOURCE_URL}`);
  const response = await fetch(SOURCE_URL);

  if (!response.ok) {
    throw new Error(`원본을 받지 못했다 (HTTP ${response.status})`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  fs.mkdirSync(path.dirname(CACHE), { recursive: true });
  fs.writeFileSync(CACHE, buffer);
  return buffer;
}

async function main(): Promise<void> {
  const text = usedCharacters();
  const original = await source();
  const subset = await subsetFont(original, text, { targetFormat: "woff2" });

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, subset);
  fs.writeFileSync(
    MANIFEST,
    JSON.stringify(
      {
        note: "pnpm fonts 가 만든다. 직접 고치지 않는다.",
        source: SOURCE_URL,
        characters: text.length,
        bytes: subset.length,
        chars: text,
      },
      null,
      2
    ) + "\n"
  );

  const hangul = [...text].filter((c) => {
    const cp = c.codePointAt(0) ?? 0;
    return cp >= 0xac00 && cp <= 0xd7a3;
  }).length;

  console.log(`
원본      ${(original.length / 1024).toFixed(0)}KB
서브셋    ${(subset.length / 1024).toFixed(0)}KB   (${(
    (1 - subset.length / original.length) * 100
  ).toFixed(0)}% 줄었다)

글자      ${text.length}자  (한글 ${hangul}자 / 한글 전체 11,172자의 ${(
    (hangul / 11172) *
    100
  ).toFixed(1)}%)

  ${OUT.split(path.sep).join("/")}
  ${MANIFEST.split(path.sep).join("/")}
`);
}

// 테스트가 usedCharacters만 가져다 쓰므로, 직접 실행할 때만 생성한다.
// 이 가드가 없으면 pnpm test 가 폰트를 다시 뽑는다.
const invokedDirectly =
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (invokedDirectly) {
  main().catch((error) => {
    console.error("실패:", error.message);
    process.exit(1);
  });
}
