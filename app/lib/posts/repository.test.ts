import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { loadPosts, shouldIncludeDrafts } from "@/app/lib/posts/repository";

const FIXTURES = path.join(process.cwd(), "app", "lib", "posts", "__fixtures__");
const POSTS = path.join(FIXTURES, "posts");

test("date 내림차순으로 정렬한다", () => {
  const posts = loadPosts(POSTS, true);

  assert.deepEqual(
    posts.map((post) => post.slug),
    ["gamma", "beta", "alpha"]
  );
});

test("includeDrafts가 false면 draft를 제외한다", () => {
  const posts = loadPosts(POSTS, false);

  assert.deepEqual(
    posts.map((post) => post.slug),
    ["beta", "alpha"]
  );
});

test("md가 아닌 파일은 무시한다", () => {
  const posts = loadPosts(POSTS, true);

  assert.equal(posts.length, 3);
});

test("하위 폴더에 중첩된 글도 찾는다", () => {
  const posts = loadPosts(POSTS, true);

  // beta.md는 __fixtures__/posts/2026/02/beta.md에 중첩되어 있다.
  // 평면 파일(alpha, gamma)과 함께 발견되어야 재귀 탐색이 검증된다.
  const beta = posts.find((post) => post.slug === "beta");
  assert.ok(beta !== undefined, "중첩된 beta.md를 찾지 못했다");
});

test("본문을 함께 읽는다", () => {
  const [, beta] = loadPosts(POSTS, true);

  assert.equal(beta.slug, "beta");
  assert.match(beta.body, /베타 본문\./);
});

test("slug이 중복되면 두 파일명을 담은 에러를 던진다", () => {
  const duplicateDir = path.join(FIXTURES, "duplicate");

  assert.throws(() => loadPosts(duplicateDir, true), /same-slug.*a\.md.*b\.md/);
});

test("draft는 프로덕션에서만 숨긴다", () => {
  assert.equal(shouldIncludeDrafts("production"), false);
  assert.equal(shouldIncludeDrafts("development"), true);
  assert.equal(shouldIncludeDrafts("test"), true);
  assert.equal(shouldIncludeDrafts(undefined), true);
});
