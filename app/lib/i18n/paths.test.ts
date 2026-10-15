import { test } from "node:test";
import assert from "node:assert/strict";
import { localePath } from "@/app/lib/i18n/paths";

test("한국어는 접두사가 붙지 않는다", () => {
  assert.equal(localePath("ko", "/"), "/");
  assert.equal(localePath("ko", "/swe-bench"), "/swe-bench");
  assert.equal(localePath("ko", "/post/all/1"), "/post/all/1");
});

test("영어는 /en 이 붙는다", () => {
  assert.equal(localePath("en", "/swe-bench"), "/en/swe-bench");
  assert.equal(localePath("en", "/post/all/1"), "/en/post/all/1");
});

test("영어 루트는 /en 이다 (/en/ 이 아니다)", () => {
  // 끝에 슬래시가 붙으면 정적 export에서 /en/index.html 과 /en.html 이 갈린다.
  assert.equal(localePath("en", "/"), "/en");
});

test("앞에 슬래시가 없어도 붙여 준다", () => {
  assert.equal(localePath("ko", "swe-bench"), "/swe-bench");
  assert.equal(localePath("en", "swe-bench"), "/en/swe-bench");
});

test("이미 접두사가 붙은 경로를 두 번 붙이지 않는다", () => {
  // 호출부가 실수로 완성된 경로를 넘겨도 /en/en/... 이 되지 않아야 한다.
  assert.equal(localePath("en", "/en/swe-bench"), "/en/swe-bench");
  assert.equal(localePath("en", "/en"), "/en");
});

test("'en'으로 시작하는 slug을 접두사로 오인하지 않는다", () => {
  // "/english-is-hard"는 접두사가 아니라 그냥 slug이다.
  assert.equal(localePath("en", "/english-is-hard"), "/en/english-is-hard");
});
