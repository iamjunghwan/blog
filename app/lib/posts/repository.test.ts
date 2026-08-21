import { test } from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { loadPosts } from "@/app/lib/posts/repository";

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

test("본문을 함께 읽는다", () => {
  const [, beta] = loadPosts(POSTS, true);

  assert.equal(beta.slug, "beta");
  assert.match(beta.body, /베타 본문\./);
});

test("slug이 중복되면 두 파일명을 담은 에러를 던진다", () => {
  const duplicateDir = path.join(FIXTURES, "duplicate");

  assert.throws(() => loadPosts(duplicateDir, true), /same-slug.*a\.md.*b\.md/);
});
