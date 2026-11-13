import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CLICK_SLOP,
  DRAG_RATIO,
  FLICK_MAX_CARDS,
  OVERDRAG,
  dragPosition,
  flickCards,
  isDrag,
  releaseTarget,
} from "@/app/lib/carousel/drag";

const W = 320;
/** 카드 한 칸을 넘기는 데 필요한 드래그 거리 */
const STEP = W * DRAG_RATIO;

test("카드 폭 × DRAG_RATIO 만큼 끌면 정확히 한 칸 간다", () => {
  assert.equal(dragPosition(0, 0 - STEP, W, 5), 1);
  assert.equal(dragPosition(2, STEP, W, 5), 1);
});

test("손이 오른쪽으로 가면 앞 카드가 온다", () => {
  // 방향을 뒤집는 실수는 눈으로는 바로 보이지만 수식만 보면 놓치기 쉽다.
  assert.ok(dragPosition(2, 50, W, 5) < 2);
  assert.ok(dragPosition(2, 0 - 50, W, 5) > 2);
});

test("양 끝에서는 OVERDRAG 만큼만 더 끌린다", () => {
  assert.equal(dragPosition(0, 9999, W, 5), 0 - OVERDRAG);
  assert.equal(dragPosition(4, 0 - 9999, W, 5), 4 + OVERDRAG);
});

test("드래그 위치는 소수를 그대로 낸다", () => {
  // 정수로 반올림해 버리면 카드가 손을 따라오지 않고 칸칸이 튄다.
  const p = dragPosition(0, 0 - STEP / 2, W, 5);
  assert.ok(p > 0.49 && p < 0.51, `expected ~0.5, got ${p}`);
});

test("튕김은 한 칸을 넘지 않는다", () => {
  // 단위가 어긋났던 옛 수식(velocity * 1.8)은 보통 손 속도 2px/ms 에서
  // 3.6칸을 밀어 1번에서 5번으로 날아갔다. 상한이 그걸 막는다.
  assert.equal(flickCards(10, W), FLICK_MAX_CARDS);
  assert.equal(flickCards(0 - 10, W), 0 - FLICK_MAX_CARDS);
  assert.ok(Math.abs(flickCards(2, W)) <= FLICK_MAX_CARDS);
});

test("튕김은 카드 폭에 반비례한다", () => {
  /*
   * 이 테스트가 단위 버그의 핵심이다. 옛 수식은 cardWidth 를 아예 쓰지 않아
   * 두 값이 똑같이 나왔다 — 좁은 화면에서 카드 폭 기준으로는 두 배를 날아간
   * 셈인데, 숫자만 봐서는 아무 문제가 없어 보였다.
   *
   * 같은 속도라면, 카드가 좁을수록 그 속도는 "더 많은 칸"에 해당한다.
   */
  const narrow = flickCards(0.5, 160);
  const wide = flickCards(0.5, 320);
  assert.ok(narrow > wide, `narrow ${narrow} should exceed wide ${wide}`);
  assert.ok(Math.abs(narrow - wide * 2) < 1e-9);
});

test("튕기지 않고 놓으면 가장 가까운 칸에 붙는다", () => {
  assert.equal(releaseTarget(1.4, 0, W), 1);
  assert.equal(releaseTarget(1.6, 0, W), 2);
});

test("왼쪽으로 튕기면 뒤 카드로, 오른쪽으로 튕기면 앞 카드로 간다", () => {
  // 왼쪽으로 튕김 = 속도 음수 = 다음(오른쪽) 카드가 와야 한다.
  assert.ok(releaseTarget(1, 0 - 2, W) > 1);
  assert.ok(releaseTarget(3, 2, W) < 3);
});

test("CLICK_SLOP 과 똑같이 움직인 건 아직 클릭이다", () => {
  // 경계를 > 가 아니라 >= 로 쓰면 가만히 누른 손가락의 미세한 떨림이
  // 링크를 죽인다. 어느 쪽인지 고정해 둔다.
  assert.equal(isDrag(CLICK_SLOP), false);
  assert.equal(isDrag(CLICK_SLOP + 1), true);
  assert.equal(isDrag(0), false);
});
