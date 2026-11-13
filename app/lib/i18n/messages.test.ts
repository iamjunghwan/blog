import { test } from "node:test";
import assert from "node:assert/strict";
import { messages, MESSAGES } from "@/app/lib/i18n/messages";

test("두 언어 사전의 키가 같다", () => {
  // 한쪽에만 키가 있으면 그 언어에서 문구가 undefined로 새어 나온다.
  assert.deepEqual(Object.keys(MESSAGES.ko).sort(), Object.keys(MESSAGES.en).sort());
});

test("언어별 문구를 준다", () => {
  assert.equal(messages("ko").today, "오늘");
  assert.equal(messages("en").today, "Today");
});

test("N일 전은 수를 받아 만든다", () => {
  assert.equal(messages("ko").daysAgo(3), "3일 전");
  assert.equal(messages("en").daysAgo(3), "3 days ago");
});

test("캐러셀 위치 문구는 현재와 전체를 받아 만든다", () => {
  assert.equal(messages("ko").slidePosition(2, 5), "5개 중 2번째");
  assert.equal(messages("en").slidePosition(2, 5), "2 of 5");
});

test("점 버튼 문구는 번호를 받아 만든다", () => {
  assert.equal(messages("ko").goToSlide(3), "3번째 글로 이동");
  assert.equal(messages("en").goToSlide(3), "Go to article 3");
});
