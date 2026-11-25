import { test } from "node:test";
import assert from "node:assert/strict";
import { placeTooltip } from "@/app/lib/footnotes/placement";

const viewport = { width: 800, height: 600, scrollX: 0, scrollY: 0 };
const tip = { width: 200, height: 80 };
const anchor = (left: number, top: number) => ({ left, top, width: 10, height: 16 });

test("공간이 있으면 번호 위에 가운데를 맞춰 띄운다", () => {
  const place = placeTooltip(anchor(395, 300), tip, viewport);

  assert.equal(place.side, "above");
  assert.equal(place.left, 300); // 번호 가운데 400 - 200/2
  assert.equal(place.top, 300 - 80 - 8);
});

test("위 공간이 모자라면 아래에 띄운다", () => {
  const place = placeTooltip(anchor(395, 40), tip, viewport);

  assert.equal(place.side, "below");
  assert.equal(place.top, 40 + 16 + 8);
});

test("왼쪽 끝 번호는 화면 안으로 민다", () => {
  assert.equal(placeTooltip(anchor(5, 300), tip, viewport).left, 8);
});

test("오른쪽 끝 번호는 화면 안으로 당긴다", () => {
  assert.equal(placeTooltip(anchor(785, 300), tip, viewport).left, 800 - 200 - 8);
});

test("문서 좌표로 돌려준다 (스크롤 양을 더한다)", () => {
  const place = placeTooltip(anchor(395, 300), tip, { ...viewport, scrollX: 3, scrollY: 1000 });

  assert.equal(place.left, 303);
  assert.equal(place.top, 1000 + 300 - 80 - 8);
});
