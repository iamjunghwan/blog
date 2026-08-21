import { test } from "node:test";
import assert from "node:assert/strict";
import { parsePost } from "@/app/lib/posts/parse";

const VALID = `---
slug: nextjs-16-upgrade
title: "Next.js 16 업그레이드"
date: 2026-07-14
tags: [nextjs, react]
---

# Next.js 16 업그레이드

본문이다.
`;

test("frontmatter와 본문을 분리해 Post를 만든다", () => {
  const post = parsePost(VALID, "2026-07-nextjs-16-upgrade.md");

  assert.equal(post.slug, "nextjs-16-upgrade");
  assert.equal(post.title, "Next.js 16 업그레이드");
  assert.equal(post.date, "2026-07-14");
  assert.deepEqual(post.tags, ["nextjs", "react"]);
  assert.equal(post.draft, false);
  assert.equal(post.thumbnail, undefined);
  assert.equal(post.body, "# Next.js 16 업그레이드\n\n본문이다.");
});

test("YAML이 Date 객체로 파싱한 date를 YYYY-MM-DD 문자열로 되돌린다", () => {
  // date: 2026-07-14 (따옴표 없음) 는 js-yaml이 Date 객체로 만든다.
  const post = parsePost(VALID, "f.md");
  assert.equal(typeof post.date, "string");
  assert.equal(post.date, "2026-07-14");
});

test("date를 따옴표로 감싼 문자열도 허용한다", () => {
  const source = VALID.replace("date: 2026-07-14", 'date: "2026-07-14"');
  assert.equal(parsePost(source, "f.md").date, "2026-07-14");
});

test("thumbnail과 draft를 읽는다", () => {
  const source = VALID.replace(
    "tags: [nextjs, react]",
    "tags: [nextjs]\nthumbnail: /uploads/2026/07/hero.png\ndraft: true"
  );
  const post = parsePost(source, "f.md");

  assert.equal(post.thumbnail, "/uploads/2026/07/hero.png");
  assert.equal(post.draft, true);
});

test("slug이 없으면 파일명을 포함한 에러를 던진다", () => {
  const source = VALID.replace("slug: nextjs-16-upgrade\n", "");

  assert.throws(
    () => parsePost(source, "2026-07-broken.md"),
    /2026-07-broken\.md.*slug/s
  );
});

test("title이 없으면 파일명을 포함한 에러를 던진다", () => {
  const source = VALID.replace('title: "Next.js 16 업그레이드"\n', "");

  assert.throws(() => parsePost(source, "broken.md"), /broken\.md.*title/s);
});

test("date 형식이 틀리면 에러를 던진다", () => {
  const source = VALID.replace("date: 2026-07-14", "date: 2026년 7월");

  assert.throws(() => parsePost(source, "broken.md"), /broken\.md.*date/s);
});

test("tags가 배열이 아니면 에러를 던진다", () => {
  const source = VALID.replace("tags: [nextjs, react]", "tags: nextjs,react");

  assert.throws(() => parsePost(source, "broken.md"), /broken\.md.*tags/s);
});

test("tags가 비어 있으면 에러를 던진다", () => {
  const source = VALID.replace("tags: [nextjs, react]", "tags: []");

  assert.throws(() => parsePost(source, "broken.md"), /broken\.md.*tags/s);
});
