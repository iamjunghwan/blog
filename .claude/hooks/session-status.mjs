/**
 * SessionStart — 진행 중인 글을 알려 준다. 할 일이 없으면 아무것도 출력하지 않는다.
 *
 * - draft: true 인 글
 * - 한국어판만 있고 영어판이 없는 글
 *
 * 세션 시작마다 돌므로 tsx 없이 frontmatter 두 줄만 정규식으로 읽는다.
 * stdout 이 세션 컨텍스트에 들어간다.
 */
import fs from "node:fs";
import path from "node:path";

const POSTS_DIR = path.join(process.env.CLAUDE_PROJECT_DIR ?? process.cwd(), "content", "posts");

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return walk(full);
    return entry.name.endsWith(".md") ? [full] : [];
  });
}

function read(lang) {
  return walk(path.join(POSTS_DIR, lang)).map((file) => {
    const head = fs.readFileSync(file, "utf8").split(/^---\s*$/m)[1] ?? "";
    return {
      slug: head.match(/^slug:\s*(.+?)\s*$/m)?.[1],
      draft: /^draft:\s*true\s*$/m.test(head),
      file: path.relative(POSTS_DIR, file).split(path.sep).join("/"),
    };
  });
}

const ko = read("ko");
const en = read("en");
const enSlugs = new Set(en.map((post) => post.slug));

const drafts = [...ko, ...en].filter((post) => post.draft).map((post) => post.file);
const untranslated = ko.filter((post) => !enSlugs.has(post.slug)).map((post) => post.slug);

const lines = [];
if (drafts.length > 0) lines.push(`작성 중(draft): ${drafts.join(", ")}`);
if (untranslated.length > 0) lines.push(`영어판 없음: ${untranslated.join(", ")}`);

if (lines.length > 0) {
  console.log(`[블로그 진행 상황]\n${lines.join("\n")}`);
}
