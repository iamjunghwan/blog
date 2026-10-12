import { test } from "node:test";
import assert from "node:assert/strict";
import { excerptOf } from "@/app/lib/posts/excerpt";

test("frontmatter의 description이 있으면 그것을 쓴다", () => {
  const result = excerptOf({
    description: "직접 쓴 설명",
    body: "# 제목\n\n본문이다.",
  });

  assert.equal(result, "직접 쓴 설명");
});

test("description이 없으면 본문에서 뽑는다", () => {
  const result = excerptOf({ body: "# 제목\n\n첫 문단이다." });

  assert.equal(result, "첫 문단이다.");
});

test("제목 줄은 설명에 넣지 않는다", () => {
  // 제목은 이미 title로 쓰이므로 설명에서 반복하면 자리만 낭비한다.
  const result = excerptOf({ body: "# 제목\n\n## 소제목\n\n본문." });

  assert.equal(result, "본문.");
});

test("코드블록은 빼고 본다", () => {
  const body = ["# 제목", "", "설명 문장.", "", "```js", "const a = 1;", "```"].join(
    "\n"
  );

  assert.equal(excerptOf({ body }), "설명 문장.");
});

test("리스트 안에 들여쓴 코드블록도 뺀다", () => {
  // 실제 글에 있는 형태다. CommonMark는 최상위에서 3칸까지만 허용하지만
  // 리스트 항목 안에서는 상대 들여쓰기라 4칸 이상도 정상적인 펜스다.
  const body = [
    "# 제목",
    "",
    "-   항목",
    "",
    "    ```javascript",
    "    const a = 1;",
    "    ```",
    "",
    "-   다음 항목",
  ].join("\n");

  const result = excerptOf({ body });

  assert.ok(!result.includes("const a"), `코드가 샜다: ${result}`);
  assert.ok(!result.includes("javascript"), `펜스 언어가 샜다: ${result}`);
});

test("이미지는 버리고 링크는 보이는 글자만 남긴다", () => {
  const body = "# 제목\n\n![대체텍스트](/a.png) [링크글자](https://example.com)를 본다.";

  const result = excerptOf({ body });

  assert.ok(!result.includes("대체텍스트"), result);
  assert.ok(!result.includes("/a.png"), result);
  assert.match(result, /링크글자를 본다\./);
});

test("강조 기호와 raw HTML 태그를 걷어낸다", () => {
  const body = "# 제목\n\n**굵게** `코드` <strong>태그</strong> 설명.";

  assert.equal(excerptOf({ body }), "굵게 코드 태그 설명.");
});

test("표는 설명에 넣지 않는다", () => {
  const body = "# 제목\n\n설명 문장.\n\n| a | b |\n|---|---|\n| 1 | 2 |";

  assert.equal(excerptOf({ body }), "설명 문장.");
});

test("길면 단어 중간이 아니라 공백에서 자르고 말줄임을 붙인다", () => {
  const body = `# 제목\n\n${"가나다 ".repeat(100)}`;

  const result = excerptOf({ body });

  assert.ok(result.length <= 156, `너무 길다: ${result.length}`);
  assert.match(result, /…$/);
  assert.ok(!result.includes("  "), "공백이 겹치면 안 된다");
});

test("짧으면 말줄임을 붙이지 않는다", () => {
  const result = excerptOf({ body: "# 제목\n\n짧은 본문." });

  assert.ok(!result.endsWith("…"), result);
});
