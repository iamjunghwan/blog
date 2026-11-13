import assert from "node:assert/strict";
import { test } from "node:test";
import { topTags, writingSince } from "@/app/lib/blog/stats";
import type { Post } from "@/app/lib/posts/types";

/** 테스트에 필요한 세 필드만 채운 글. 나머지는 이 계산이 보지 않는다. */
function post(date: string, tags: string[]): Post {
  return { date, tags, slug: date, title: date, lang: "ko", body: "" } as Post;
}

test("가장 오래된 글의 연월을 낸다", () => {
  const posts = [
    post("2026-11-09", []),
    post("2025-03-10", []),
    post("2025-12-01", []),
  ];
  assert.equal(writingSince(posts), "2025.03");
});

test("입력 순서가 달라도 같은 값을 낸다", () => {
  // 들어오는 배열이 이미 최신순으로 정렬돼 있어서, 첫 원소를 집는 구현도
  // 실제 데이터에서는 우연히 맞는다. 뒤집어도 맞아야 진짜다.
  const posts = [post("2025-03-10", []), post("2026-11-09", [])];
  assert.equal(writingSince(posts), writingSince([...posts].reverse()));
});

test("글이 없으면 null", () => {
  // 히어로가 "부터"만 덩그러니 띄우지 않도록, 없음을 값으로 알린다.
  assert.equal(writingSince([]), null);
});

test("많이 쓴 태그부터 센다", () => {
  const posts = [
    post("2025-01-01", ["javascript", "react"]),
    post("2025-01-02", ["javascript"]),
    post("2025-01-03", ["javascript", "react"]),
    post("2025-01-04", ["ai"]),
  ];
  assert.deepEqual(topTags(posts, 3), [
    { tag: "javascript", count: 3 },
    { tag: "react", count: 2 },
    { tag: "ai", count: 1 },
  ]);
});

test("수가 같으면 이름순으로 가른다", () => {
  /*
   * 이 테스트가 없으면 동점 태그의 순서가 Map 의 삽입 순서를 따라간다.
   * 글 하나를 추가하는 것만으로 간판의 태그 순서가 뒤바뀌고, 내용이 바뀌지
   * 않았는데 빌드 결과물의 diff 가 생긴다.
   */
  const posts = [post("2025-01-01", ["zig", "ai", "md"])];
  assert.deepEqual(topTags(posts, 3).map((t) => t.tag), ["ai", "md", "zig"]);
});

test("태그가 limit 보다 적으면 있는 만큼만 준다", () => {
  const posts = [post("2025-01-01", ["ai"])];
  assert.equal(topTags(posts, 5).length, 1);
});

test("limit 을 넘겨 자른다", () => {
  const posts = [post("2025-01-01", ["a", "b", "c", "d", "e", "f"])];
  assert.equal(topTags(posts, 5).length, 5);
});

test("같은 글 안에 같은 태그가 두 번 있어도 한 번만 센다", () => {
  // frontmatter 는 사람이 손으로 쓰는 곳이라 중복이 들어올 수 있다.
  // 글 1편인데 count 2 가 되면 간판이 거짓말을 한다.
  const posts = [post("2025-01-01", ["ai", "ai"])];
  assert.deepEqual(topTags(posts, 5), [{ tag: "ai", count: 1 }]);
});
