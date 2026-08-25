/****************************************
 *
 * 마이그레이션 검증
 *
 * 사용법:
 *   npx tsx scripts/verify-migration.ts
 *
 * migration/cms-dump.json의 원본 HTML과 content/posts의 md를 렌더한 HTML을
 * 구조적으로 비교한다. TOC 삽입이 텍스트를 바꾸므로 processHtml은 거치지 않는다.
 *
 * POSTS_DIR 환경변수로 검증 대상 디렉터리를 바꿀 수 있다 (실제 content/posts를
 * 건드리지 않고 시험 변환 결과물을 검증할 때 사용).
 *
 ****************************************/

import fs from "node:fs";
import path from "node:path";
import * as cheerio from "cheerio";
import matter from "gray-matter";
import MarkdownIt from "markdown-it";

const DUMP_PATH = path.join(process.cwd(), "migration", "cms-dump.json");
const POSTS_DIR = process.env.POSTS_DIR
  ? path.resolve(process.env.POSTS_DIR)
  : path.join(process.cwd(), "content", "posts");
const PUBLIC_DIR = path.join(process.cwd(), "public");

const markdown = new MarkdownIt({ html: true });

type Shape = {
  text: string;
  headings: string[];
  links: string[];
  images: string[];
  codeBlocks: string[];
};

function shapeOf(html: string): Shape {
  const $ = cheerio.load(html);

  return {
    // 원본은 인접한 블록 태그 사이에 공백이 전혀 없을 수 있는데, markdown-it이 직렬화하면
    // 항상 개행이 끼어든다. 그 왕복 아티팩트를 허용하려고 공백을 아예 지운다 (축약이 아니다).
    text: $.root().text().replace(/\s+/g, "").trim(),
    headings: $("h1, h2, h3, h4, h5, h6")
      .map((_, el) => `${el.tagName.toLowerCase()}:${$(el).text().trim()}`)
      .get(),
    links: $("a[href]")
      .map((_, el) => $(el).attr("href") ?? "")
      .get(),
    // <video>의 <source src>도 자산이므로 이미지와 함께 검사한다.
    images: $("img[src], source[src]")
      .map((_, el) => normalizeSrc($(el).attr("src") ?? ""))
      .get(),
    // 원본 <pre>는 <code> 자식을 갖지 않는다 (TinyMCE + Prism). before 쪽에서 "pre code"로
    // 찾으면 항상 0건이라 비교가 무의미해진다 — 양쪽 다 <pre>의 텍스트로 비교한다.
    codeBlocks: $("pre")
      .map((_, el) => $(el).text().trim())
      .get(),
  };
}

/** 원본은 uploads/..., md는 /uploads/... 이므로 앞 슬래시를 무시하고 비교한다. */
function normalizeSrc(src: string): string {
  return src.replace(/^\.?\//, "");
}

function diffList(label: string, before: string[], after: string[]): string[] {
  if (before.length === after.length && before.every((v, i) => v === after[i])) {
    return [];
  }

  const problems: string[] = [`${label}: ${before.length}개 -> ${after.length}개`];
  const max = Math.max(before.length, after.length);

  for (let i = 0; i < max; i += 1) {
    if (before[i] !== after[i]) {
      problems.push(`  [${i}] 원본: ${before[i] ?? "(없음)"}`);
      problems.push(`  [${i}] 변환: ${after[i] ?? "(없음)"}`);
    }
  }
  return problems;
}

function firstTextDifference(before: string, after: string): string {
  // text는 공백이 전부 제거된 문자열이라 같은 글자 수라도 단어 경계가 안 보인다.
  // 창을 넓혀 앞뒤 맥락(단어 여러 개 분량)이 충분히 드러나게 한다.
  const WINDOW = 60;

  for (let i = 0; i < Math.max(before.length, after.length); i += 1) {
    if (before[i] !== after[i]) {
      const from = Math.max(0, i - WINDOW);
      return [
        `  위치 ${i}`,
        `  원본: ...${before.slice(from, i + WINDOW)}...`,
        `  변환: ...${after.slice(from, i + WINDOW)}...`,
      ].join("\n");
    }
  }
  return "";
}

function checkImageFiles(images: string[]): string[] {
  const problems: string[] = [];

  for (const src of images) {
    if (/^https?:\/\//.test(src)) {
      continue;
    }
    const filePath = path.join(PUBLIC_DIR, src);
    if (!fs.existsSync(filePath)) {
      problems.push(`이미지 파일 없음: public/${src}`);
    }
  }
  return problems;
}

function main(): void {
  if (!fs.existsSync(DUMP_PATH)) {
    throw new Error(
      `${DUMP_PATH}가 없습니다. 먼저 pnpm migrate 를 실행하세요.`
    );
  }

  const items = JSON.parse(fs.readFileSync(DUMP_PATH, "utf8")).list;
  const files = fs.readdirSync(POSTS_DIR).filter((f) => f.endsWith(".md"));

  const bySlug = new Map<string, string>();
  for (const file of files) {
    const source = fs.readFileSync(path.join(POSTS_DIR, file), "utf8");
    const { data } = matter(source);
    bySlug.set(String(data.slug), file);
  }

  let failed = 0;

  for (const item of items) {
    const slug = item.data.slug;
    const file = bySlug.get(slug);

    if (file === undefined) {
      console.log(`\n[실패] ${slug}: 대응하는 md 파일이 없습니다.`);
      failed += 1;
      continue;
    }

    const { content } = matter(
      fs.readFileSync(path.join(POSTS_DIR, file), "utf8")
    );

    const before = shapeOf(item.data.content);
    const after = shapeOf(markdown.render(content));

    const problems: string[] = [];

    if (before.text !== after.text) {
      problems.push("텍스트 불일치");
      problems.push(firstTextDifference(before.text, after.text));
    }
    problems.push(...diffList("헤딩", before.headings, after.headings));
    problems.push(...diffList("링크", before.links, after.links));
    problems.push(...diffList("이미지", before.images, after.images));
    problems.push(...diffList("코드블록", before.codeBlocks, after.codeBlocks));
    problems.push(...checkImageFiles(after.images));

    if (problems.length === 0) {
      console.log(`[통과] ${slug} (${file})`);
      continue;
    }

    failed += 1;
    console.log(`\n[실패] ${slug} (${file})`);
    for (const problem of problems) {
      console.log(`  ${problem}`);
    }
  }

  const orphans = [...bySlug.keys()].filter(
    (slug) => !items.some((item: { data: { slug: string } }) => item.data.slug === slug)
  );
  if (orphans.length > 0) {
    console.log(`\n덤프에 없는 md: ${orphans.join(", ")}`);
  }

  console.log(
    `\n=== ${items.length}건 중 ${items.length - failed}건 통과, ${failed}건 실패 ===`
  );

  if (failed > 0) {
    process.exit(1);
  }
}

main();
