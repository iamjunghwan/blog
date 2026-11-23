import { test } from "node:test";
import assert from "node:assert/strict";
import { renderPostBody } from "@/app/lib/posts/render/render";
import { findBrokenEmphasis } from "@/app/lib/posts/render/emphasis";

const render = (md: string) => renderPostBody(`# 제목\n\n---\n\n${md}`);

test("닫는 ** 앞이 구두점이고 뒤가 글자면 깨진 강조로 잡는다", () => {
  const found = findBrokenEmphasis(render("그걸 **파생 데이터(derived data)**로 만든다."));

  assert.deepEqual(found, ["그걸 **파생 데이터(derived data)**로 만든다."]);
});

test("제대로 렌더된 강조는 잡지 않는다", () => {
  assert.deepEqual(findBrokenEmphasis(render("이건 **굵게** 보인다. **(괄호)** 뒤 공백도 된다.")), []);
});

test("인라인 코드와 코드블록 안의 **는 잡지 않는다", () => {
  const md = "거듭제곱은 `2 ** 3`이다.\n\n```js\nconst x = 2 ** 3;\n```";

  assert.deepEqual(findBrokenEmphasis(render(md)), []);
});

test("하위 목록이 달린 항목의 바깥 줄도 검사한다", () => {
  const md = "- **바깥(a)**는 깨졌다\n  - 안쪽은 멀쩡하다";

  assert.deepEqual(findBrokenEmphasis(render(md)), ["**바깥(a)**는 깨졌다"]);
});

test("깨진 줄이 여러 개면 모두 돌려준다", () => {
  const md = "**가(a)**는 첫째.\n\n**나(b)**는 둘째.";

  assert.deepEqual(findBrokenEmphasis(render(md)), ["**가(a)**는 첫째.", "**나(b)**는 둘째."]);
});
