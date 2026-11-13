import { test } from "node:test";
import assert from "node:assert/strict";
import { slideTransform, transformCss } from "@/app/lib/carousel/geometry";

/** 서버 렌더 기준 카드 폭. 테스트 전체가 이 값을 쓴다. */
const W = 320;

test("가운데 카드는 돌지도 줄지도 흐려지지도 않는다", () => {
  const t = slideTransform(0, W);
  assert.equal(t.x, 0);
  assert.equal(t.z, 0);
  assert.equal(t.rotateY, 0);
  assert.equal(t.scale, 1);
  assert.equal(t.opacity, 1);
});

test("좌우가 대칭이다", () => {
  const left = slideTransform(-1, W);
  const right = slideTransform(1, W);
  assert.equal(left.x, -right.x);
  assert.equal(left.rotateY, -right.rotateY);
  assert.equal(left.z, right.z);
  assert.equal(left.scale, right.scale);
  assert.equal(left.opacity, right.opacity);
  assert.equal(left.zIndex, right.zIndex);
});

test("멀어질수록 작아지고 흐려진다", () => {
  const steps = [0, 1, 2, 3].map((offset) => slideTransform(offset, W));
  for (let i = 1; i < steps.length; i++) {
    assert.ok(steps[i].scale < steps[i - 1].scale, `scale가 ${i}에서 줄지 않았다`);
    assert.ok(steps[i].opacity < steps[i - 1].opacity, `opacity가 ${i}에서 줄지 않았다`);
  }
});

test("scale은 2.4칸에서 더 작아지기를 멈춘다", () => {
  // 위의 단조 감소 테스트만으로는 상한이 지켜지는지 알 수 없다. offset 3에서
  // 이미 상한에 걸려 있어, MAX_SCALE_DISTANCE를 지워도 그 테스트는 통과한다.
  assert.equal(slideTransform(3, W).scale, slideTransform(2.4, W).scale);
  assert.ok(slideTransform(2.4, W).scale < slideTransform(2, W).scale);
});

test("3장 너머는 같은 자리에 겹쳐 둔다", () => {
  // 자르지 않으면 멀리 있는 카드가 화면 밖으로 끝없이 밀려나고
  // translateZ가 과해져 브라우저가 쓸데없이 큰 레이어를 만든다.
  const edge = slideTransform(3, W);
  const far = slideTransform(5, W);
  assert.equal(far.x, edge.x);
  assert.equal(far.z, edge.z);
  assert.equal(far.rotateY, edge.rotateY);
  assert.equal(far.scale, edge.scale);
});

test("겹친 뒤에도 투명도는 계속 떨어진다", () => {
  // 자리는 멈춰도 사라지기는 해야 한다. 안 그러면 멀리 있는 카드가
  // 가장자리에 흐릿하게 박힌 채 영영 남는다.
  assert.ok(slideTransform(5, W).opacity < slideTransform(3, W).opacity);
});

test("투명도는 0 밑으로 내려가지 않는다", () => {
  assert.equal(slideTransform(10, W).opacity, 0);
  assert.equal(slideTransform(-10, W).opacity, 0);
});

test("zIndex는 가운데가 가장 크고 항상 정수다", () => {
  assert.equal(slideTransform(0, W).zIndex, 100);
  assert.ok(slideTransform(1, W).zIndex < slideTransform(0, W).zIndex);
  // 드래그 중에는 offset이 소수로 들어온다. CSS z-index는 정수만 받는다.
  assert.ok(Number.isInteger(slideTransform(1.5, W).zIndex));
});

test("드래그 중간값은 양옆 두 칸 사이에 놓인다", () => {
  const half = slideTransform(0.5, W);
  const zero = slideTransform(0, W);
  const one = slideTransform(1, W);
  assert.ok(half.x > zero.x && half.x < one.x);
  assert.ok(half.scale < zero.scale && half.scale > one.scale);
  assert.ok(half.opacity < zero.opacity && half.opacity > one.opacity);
});

test("transformCss는 네 변환을 순서대로 잇는다", () => {
  // 부동소수점 오차를 피하려고 값을 직접 넣는다.
  const css = transformCss({
    x: 192,
    z: -90,
    rotateY: -36,
    scale: 0.87,
    opacity: 0.72,
    zIndex: 90,
  });
  assert.equal(css, "translateX(192px) translateZ(-90px) rotateY(-36deg) scale(0.87)");
});

test("카드 폭이 커지면 가로 간격만 비례해서 커진다", () => {
  const narrow = slideTransform(1, 240);
  const wide = slideTransform(1, 320);
  assert.ok(wide.x > narrow.x);
  // 회전·축소는 폭과 무관하다. 좁은 화면에서도 같은 각도로 돌아야 한다.
  assert.equal(narrow.rotateY, wide.rotateY);
  assert.equal(narrow.scale, wide.scale);
  assert.equal(narrow.z, wide.z);
});
