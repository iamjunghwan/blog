import { test } from "node:test";
import assert from "node:assert/strict";
import {
  isPastSentinel,
  scrollBehavior,
  SCROLL_TOP_ROOT_MARGIN,
  SCROLL_TOP_SENTINEL_ID,
} from "@/app/lib/scroll/scroll-to-top";

const entry = (isIntersecting: boolean, top: number) => ({
  isIntersecting,
  boundingClientRect: { top },
});

test("표식이 관찰 영역 안에 있으면 숨긴다", () => {
  assert.equal(isPastSentinel(entry(true, -100)), false);
  assert.equal(isPastSentinel(entry(true, 50)), false);
});

test("표식이 화면 위로 한 높이 넘게 지나가면 보인다", () => {
  assert.equal(isPastSentinel(entry(false, -2000)), true);
});

test("표식이 화면 아래에 있어 안 보이는 것은 지나간 것이 아니다", () => {
  // 글 머리가 화면 아래에 있는 경우(아주 작은 창 등)에는 보이지 않는다.
  assert.equal(isPastSentinel(entry(false, 900)), false);
});

test("움직임 줄이기 설정이면 즉시 이동한다", () => {
  assert.equal(scrollBehavior(true), "auto");
  assert.equal(scrollBehavior(false), "smooth");
});

test("표식 id와 관찰 여백", () => {
  assert.equal(SCROLL_TOP_SENTINEL_ID, "scroll-top-sentinel");
  assert.equal(SCROLL_TOP_ROOT_MARGIN, "100% 0px 0px 0px");
});
