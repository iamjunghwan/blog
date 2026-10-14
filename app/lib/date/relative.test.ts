import { test } from "node:test";
import assert from "node:assert/strict";
import { relativeLabel } from "@/app/lib/date/relative";

// now를 인자로 받으므로 시간을 고정해 검증할 수 있다.
const NOW = new Date(2026, 9, 14, 12, 0, 0); // 2026-10-14 12:00 로컬

test("오늘 올린 글은 '오늘'", () => {
  assert.equal(relativeLabel("2026-10-14", NOW), "오늘");
});

test("하루 전은 '어제'", () => {
  assert.equal(relativeLabel("2026-10-13", NOW), "어제");
});

test("이틀 전부터는 'N일 전'", () => {
  assert.equal(relativeLabel("2026-10-12", NOW), "2일 전");
});

test("30일 전까지는 붙인다 (경계)", () => {
  assert.equal(relativeLabel("2026-09-14", NOW), "30일 전");
});

test("31일을 넘으면 붙이지 않는다 (경계)", () => {
  assert.equal(relativeLabel("2026-09-13", NOW), null);
});

test("미래 날짜는 붙이지 않는다", () => {
  assert.equal(relativeLabel("2026-10-15", NOW), null);
});

test("형식이 다르면 붙이지 않는다", () => {
  assert.equal(relativeLabel("2026/10/14", NOW), null);
  assert.equal(relativeLabel("", NOW), null);
});

test("경과 시간이 아니라 달력 날짜로 센다", () => {
  // 자정 1분 뒤에 본다면 하루도 채 지나지 않았지만 날짜는 하루 넘어갔다.
  // 경과 시간(ms)으로 나누면 '오늘'이 되어 틀린다.
  const justAfterMidnight = new Date(2026, 9, 15, 0, 1, 0);
  assert.equal(relativeLabel("2026-10-14", justAfterMidnight), "어제");

  // 반대로 자정 직전은 아직 같은 날이다.
  const justBeforeMidnight = new Date(2026, 9, 14, 23, 59, 0);
  assert.equal(relativeLabel("2026-10-14", justBeforeMidnight), "오늘");
});

test("해를 넘겨도 날짜 차이를 맞게 센다", () => {
  const newYear = new Date(2027, 0, 5, 9, 0, 0); // 2027-01-05
  assert.equal(relativeLabel("2026-12-27", newYear), "9일 전");
});
