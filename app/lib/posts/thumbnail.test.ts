import { test } from "node:test";
import assert from "node:assert/strict";
import { DEFAULT_THUMBNAIL, thumbnailOf } from "@/app/lib/posts/thumbnail";

test("frontmatter의 thumbnail이 최우선이다", () => {
  const result = thumbnailOf({
    thumbnail: "/uploads/2026/07/hero.png",
    body: "![다른거](/uploads/2026/07/other.png)",
  });

  assert.equal(result, "/uploads/2026/07/hero.png");
});

test("thumbnail이 없으면 본문의 첫 markdown 이미지를 쓴다", () => {
  const body = "# 제목\n\n![대체텍스트](/uploads/2026/07/first.png)\n\n![두번째](/uploads/2026/07/second.png)";

  assert.equal(thumbnailOf({ body }), "/uploads/2026/07/first.png");
});

test("markdown 이미지의 title 속성을 경로에 포함시키지 않는다", () => {
  const body = '![alt](/uploads/a.png "제목")';

  assert.equal(thumbnailOf({ body }), "/uploads/a.png");
});

test("raw HTML img 태그도 인식한다", () => {
  const body = '<img src="/uploads/2026/07/raw.png" alt="x" />';

  assert.equal(thumbnailOf({ body }), "/uploads/2026/07/raw.png");
});

test("markdown 이미지와 raw img가 함께 있으면 본문에서 먼저 나온 쪽을 쓴다", () => {
  const htmlFirst = '<img src="/uploads/raw.png">\n\n![md](/uploads/md.png)';
  const mdFirst = '![md](/uploads/md.png)\n\n<img src="/uploads/raw.png">';

  assert.equal(thumbnailOf({ body: htmlFirst }), "/uploads/raw.png");
  assert.equal(thumbnailOf({ body: mdFirst }), "/uploads/md.png");
});

test("상대 경로에 앞 슬래시를 붙인다", () => {
  assert.equal(thumbnailOf({ body: "![a](uploads/2026/07/rel.png)" }), "/uploads/2026/07/rel.png");
});

test("절대 URL은 그대로 둔다", () => {
  const body = "![a](https://example.com/x.png)";

  assert.equal(thumbnailOf({ body }), "https://example.com/x.png");
});

test("이미지가 없으면 기본 이미지를 쓴다", () => {
  assert.equal(thumbnailOf({ body: "# 제목\n\n이미지 없음" }), DEFAULT_THUMBNAIL);
  assert.equal(DEFAULT_THUMBNAIL, "/iaman.png");
});

test("코드 펜스 안의 markdown 이미지는 무시한다", () => {
  const body = [
    "# 제목",
    "",
    "```markdown",
    "![예시](/uploads/in-code.png)",
    "```",
    "",
    "![실제](/uploads/real.png)",
  ].join("\n");

  assert.equal(thumbnailOf({ body }), "/uploads/real.png");
});

test("코드 펜스 안의 raw img도 무시한다", () => {
  const body = ["# 제목", "", "~~~html", '<img src="/uploads/in-code.png">', "~~~"].join(
    "\n"
  );

  assert.equal(thumbnailOf({ body }), DEFAULT_THUMBNAIL);
});

test("리스트 안에 들여쓴 펜스도 무시한다", () => {
  const body = [
    "# 제목",
    "",
    "1. 먼저 이렇게 쓴다",
    "",
    "   ```markdown",
    "   ![예시](/uploads/in-code.png)",
    "   ```",
    "",
    "![실제](/uploads/real.png)",
  ].join("\n");

  assert.equal(thumbnailOf({ body }), "/uploads/real.png");
});

test("긴 펜스로 감싼 안쪽 펜스가 블록을 조기에 닫지 않는다", () => {
  const body = [
    "# 제목",
    "",
    "````markdown",
    "```",
    "![예시](/uploads/in-code.png)",
    "```",
    "````",
    "",
    "![실제](/uploads/real.png)",
  ].join("\n");

  assert.equal(thumbnailOf({ body }), "/uploads/real.png");
});

test("닫히지 않은 펜스는 문서 끝까지 코드로 본다", () => {
  const body = ["# 제목", "", "```", "![예시](/uploads/in-code.png)"].join("\n");

  assert.equal(thumbnailOf({ body }), DEFAULT_THUMBNAIL);
});

test("CRLF 본문에서도 펜스를 인식한다", () => {
  // 이 저장소는 core.autocrlf=true라 디스크의 md가 CRLF다.
  // "\n"으로만 쪼개면 각 줄에 \r가 남아 펜스 인식이 전부 무동작이 된다.
  const body = [
    "# 제목",
    "",
    "```markdown",
    "![예시](/uploads/in-code.png)",
    "```",
    "",
    "![실제](/uploads/real.png)",
  ].join("\r\n");

  assert.equal(thumbnailOf({ body }), "/uploads/real.png");
});
