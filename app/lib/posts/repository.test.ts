import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { loadAllPosts, loadPosts, shouldIncludeDrafts } from "@/app/lib/posts/repository";

const FIXTURES = path.join(process.cwd(), "app", "lib", "posts", "__fixtures__");
const POSTS = path.join(FIXTURES, "posts");

test("date 내림차순으로 정렬한다", () => {
  const posts = loadPosts(POSTS, true, "ko");

  assert.deepEqual(
    posts.map((post) => post.slug),
    ["gamma", "beta", "alpha"]
  );
});

test("includeDrafts가 false면 draft를 제외한다", () => {
  const posts = loadPosts(POSTS, false, "ko");

  assert.deepEqual(
    posts.map((post) => post.slug),
    ["beta", "alpha"]
  );
});

test("md가 아닌 파일은 무시한다", () => {
  const posts = loadPosts(POSTS, true, "ko");

  assert.equal(posts.length, 3);
});

test("하위 폴더에 중첩된 글도 찾는다", () => {
  const posts = loadPosts(POSTS, true, "ko");

  // beta.md는 __fixtures__/posts/2026/02/beta.md에 중첩되어 있다.
  // 평면 파일(alpha, gamma)과 함께 발견되어야 재귀 탐색이 검증된다.
  const beta = posts.find((post) => post.slug === "beta");
  assert.ok(beta !== undefined, "중첩된 beta.md를 찾지 못했다");
});

test("본문을 함께 읽는다", () => {
  const [, beta] = loadPosts(POSTS, true, "ko");

  assert.equal(beta.slug, "beta");
  assert.match(beta.body, /베타 본문\./);
});

test("slug이 중복되면 두 파일명을 담은 에러를 던진다", () => {
  const duplicateDir = path.join(FIXTURES, "duplicate");

  assert.throws(() => loadPosts(duplicateDir, true, "ko"), /same-slug.*a\.md.*b\.md/);
});

test("draft는 프로덕션에서만 숨긴다", () => {
  assert.equal(shouldIncludeDrafts("production"), false);
  assert.equal(shouldIncludeDrafts("development"), true);
  assert.equal(shouldIncludeDrafts("test"), true);
  assert.equal(shouldIncludeDrafts(undefined), true);
});

test("언어 폴더마다 읽어 합치고, 폴더가 곧 lang이 된다", (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "i18n-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const write = (lang: string, name: string, slug: string, title: string) => {
    const full = path.join(dir, lang, "2026", "01");
    fs.mkdirSync(full, { recursive: true });
    fs.writeFileSync(
      path.join(full, name),
      ["---", `slug: ${slug}`, `title: "${title}"`, "date: 2026-01-02", "tags: [javascript]", "---", "", "본문"].join("\n")
    );
  };
  write("ko", "hello.md", "hello", "안녕");
  write("en", "hello.md", "hello", "Hello");

  const posts = loadAllPosts(dir, true);

  assert.equal(posts.length, 2);
  assert.deepEqual(
    posts.map((p) => `${p.lang}:${p.slug}`).sort(),
    ["en:hello", "ko:hello"]
  );
});

test("같은 언어 안에서 slug이 겹치면 빌드를 세운다", (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "i18n-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const full = path.join(dir, "ko", "2026", "01");
  fs.mkdirSync(full, { recursive: true });
  for (const name of ["a.md", "b.md"]) {
    fs.writeFileSync(
      path.join(full, name),
      ["---", "slug: same", 'title: "제목"', "date: 2026-01-02", "tags: [javascript]", "---", "", "본문"].join("\n")
    );
  }
  fs.mkdirSync(path.join(dir, "en"), { recursive: true });

  assert.throws(() => loadAllPosts(dir, true), /same/);
});

test("언어 폴더가 없으면 조용히 넘기지 않고 알린다", (t) => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "i18n-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  fs.mkdirSync(path.join(dir, "ko"), { recursive: true });
  // en 폴더를 만들지 않는다

  assert.throws(() => loadAllPosts(dir, true), /'en' 폴더를 만드세요/);
});

test("날짜와 slug이 같은 번역판끼리는 언어로 순서를 고정한다", (t) => {
  // 같은 글의 번역을 같은 날 올리면 date도 slug도 같아진다. 비교자가 lang까지
  // 보지 않으면 순서가 정렬 알고리즘에 좌우되어 빌드마다 달라질 수 있다.
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "i18n-"));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  for (const lang of ["ko", "en"]) {
    const full = path.join(dir, lang, "2026", "01");
    fs.mkdirSync(full, { recursive: true });
    fs.writeFileSync(
      path.join(full, "hello.md"),
      ["---", "slug: hello", 'title: "제목"', "date: 2026-01-02", "tags: [javascript]", "---", "", "본문"].join("\n")
    );
  }

  assert.deepEqual(
    loadAllPosts(dir, true).map((post) => post.lang),
    ["en", "ko"]
  );
});
