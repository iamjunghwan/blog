import { test } from "node:test";
import assert from "node:assert/strict";
import {
  PAGE_SIZE,
  allTags,
  paginate,
  postBySlug,
  postListParams,
  postListUrls,
  postsByTag,
  searchIndex,
} from "@/app/lib/posts/queries";
import type { Post } from "@/app/lib/posts/types";

function makePost(slug: string, date: string, tags: string[]): Post {
  return { slug, title: slug.toUpperCase(), date, tags, draft: false, body: `# ${slug}` };
}

// date 내림차순 (repository가 이미 정렬한 상태를 가정한다)
const POSTS: Post[] = [
  makePost("g", "2026-01-07", ["nextjs"]),
  makePost("f", "2026-01-06", ["javascript"]),
  makePost("e", "2026-01-05", ["javascript"]),
  makePost("d", "2026-01-04", ["javascript"]),
  makePost("c", "2026-01-03", ["javascript"]),
  makePost("b", "2026-01-02", ["javascript", "react"]),
  makePost("a", "2026-01-01", ["react"]),
];

test("PAGE_SIZE는 5다", () => {
  assert.equal(PAGE_SIZE, 5);
});

test("postBySlug는 slug으로 글을 찾는다", () => {
  assert.equal(postBySlug(POSTS, "b")?.slug, "b");
  assert.equal(postBySlug(POSTS, "없는slug"), undefined);
});

test("postsByTag는 태그를 정확히 비교한다 (부분 문자열 매칭 금지)", () => {
  // 'js'는 'nextjs'의 부분 문자열이지만 매칭되면 안 된다.
  assert.deepEqual(postsByTag(POSTS, "js"), []);
  assert.deepEqual(
    postsByTag(POSTS, "nextjs").map((post) => post.slug),
    ["g"]
  );
});

test("postsByTag('all')은 전체를 준다", () => {
  assert.equal(postsByTag(POSTS, "all").length, POSTS.length);
});

test("postsByTag는 여러 태그를 가진 글도 잡는다", () => {
  assert.deepEqual(
    postsByTag(POSTS, "react").map((post) => post.slug),
    ["b", "a"]
  );
});

test("allTags는 중복을 제거하고 사전순으로 정렬한다", () => {
  assert.deepEqual(allTags(POSTS), ["javascript", "nextjs", "react"]);
});

test("paginate는 페이지 단위로 자르고 총 페이지 수를 준다", () => {
  const first = paginate(POSTS, 1);
  const second = paginate(POSTS, 2);

  assert.deepEqual(first.items.map((post) => post.slug), ["g", "f", "e", "d", "c"]);
  assert.equal(first.totalPages, 2);
  assert.deepEqual(second.items.map((post) => post.slug), ["b", "a"]);
  assert.equal(second.totalPages, 2);
});

test("paginate는 범위를 넘는 페이지에 빈 배열을 준다", () => {
  assert.deepEqual(paginate(POSTS, 3).items, []);
});

test("paginate는 빈 목록에도 totalPages 1을 준다", () => {
  const result = paginate([], 1);

  assert.deepEqual(result.items, []);
  assert.equal(result.totalPages, 1);
});

test("paginate는 유효하지 않은 page에 빈 배열을 준다", () => {
  // 가드가 없으면 slice의 음수 인덱스 때문에 page=-1이 최신 글 2개를 돌려준다.
  assert.deepEqual(paginate(POSTS, 0).items, []);
  assert.deepEqual(paginate(POSTS, -1).items, []);
  assert.deepEqual(paginate(POSTS, 1.5).items, []);
  assert.deepEqual(paginate(POSTS, Number.NaN).items, []);

  // totalPages는 여전히 알려준다 (전체 개수 정보는 유효하다)
  assert.equal(paginate(POSTS, -1).totalPages, 2);
});

test("searchIndex는 본문을 제외한다", () => {
  const [first] = searchIndex(POSTS);

  assert.deepEqual(Object.keys(first).sort(), ["date", "slug", "tags", "title"]);
  assert.equal(first.slug, "g");
});

test("postListParams는 all과 각 태그의 페이지를 만든다", () => {
  const params = postListParams(POSTS);

  // all: 7건 -> 2페이지, javascript: 5건 -> 1페이지, nextjs: 1건 -> 1페이지, react: 2건 -> 1페이지
  assert.deepEqual(params, [
    { slug: "all", page: ["1"] },
    { slug: "all", page: ["2"] },
    { slug: "javascript", page: ["1"] },
    { slug: "nextjs", page: ["1"] },
    { slug: "react", page: ["1"] },
  ]);
});

test("postListParams는 all과 실제 태그만 라우트로 만든다", () => {
  const slugs = postListParams(POSTS).map((param) => param.slug);
  const allowed = new Set(["all", ...allTags(POSTS)]);

  // 기존 버그: 아티클 slug과 콤마로 이어붙인 태그 문자열이 라우트로 생성됐다.
  // 특정 문자열("a", 콤마)이 아니라 허용 집합 소속으로 확인해, 같은 버그가 다른
  // 모양(다른 slug, 다른 구분자)으로 돌아오는 경우까지 잡는다.
  assert.ok(slugs.length > 0, "라우트가 하나도 없으면 이 단정은 의미가 없다");

  for (const slug of slugs) {
    assert.ok(allowed.has(slug), `허용되지 않은 목록 라우트 slug: ${slug}`);
  }
});

test("postListUrls는 사이트맵용 경로 문자열을 준다", () => {
  assert.deepEqual(postListUrls(POSTS), [
    "/post/all/1",
    "/post/all/2",
    "/post/javascript/1",
    "/post/nextjs/1",
    "/post/react/1",
  ]);
});
