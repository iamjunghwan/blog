import assert from "node:assert/strict";
import { test } from "node:test";
import { writingSince } from "@/app/lib/blog/stats";
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
