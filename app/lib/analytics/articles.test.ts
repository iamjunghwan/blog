import { test } from "node:test";
import assert from "node:assert/strict";
import { articleViews, pathToArticle, type ArticleRef } from "@/app/lib/analytics/articles";

test("경로에서 언어와 slug을 읽는다", () => {
  assert.deepEqual(pathToArticle("/focus-trap"), { slug: "focus-trap", lang: "ko" });
  assert.deepEqual(pathToArticle("/en/focus-trap"), { slug: "focus-trap", lang: "en" });
});

test("끝 슬래시와 퍼센트 인코딩을 정리한다", () => {
  assert.deepEqual(pathToArticle("/focus-trap/"), { slug: "focus-trap", lang: "ko" });
  assert.deepEqual(pathToArticle("/en/Object-Map/"), { slug: "Object-Map", lang: "en" });
  assert.deepEqual(pathToArticle("/%ED%95%9C%EA%B8%80"), { slug: "한글", lang: "ko" });
});

test("글 모양이 아닌 경로는 null이다", () => {
  assert.equal(pathToArticle("/"), null);
  assert.equal(pathToArticle("/en"), null);
  assert.equal(pathToArticle("/en/"), null);
  assert.equal(pathToArticle("/post/all/1"), null);
  assert.equal(pathToArticle("/en/post/react/1"), null);
});

test("잘못된 퍼센트 인코딩에도 던지지 않는다", () => {
  assert.deepEqual(pathToArticle("/bad%E0"), { slug: "bad%E0", lang: "ko" });
});

const ARTICLES: ArticleRef[] = [
  { slug: "scion", title: "Scion 글", lang: "ko" },
  { slug: "scion", title: "Scion post", lang: "en" },
  { slug: "oxc", title: "Oxc 글", lang: "ko" },
  { slug: "oxc", title: "Oxc post", lang: "en" },
  { slug: "only-ko", title: "한국어만", lang: "ko" },
];

test("글 단위로 ko·en을 합산하고 합계 내림차순으로 정렬한다", () => {
  const result = articleViews(
    [
      { label: "/scion", value: 90 },
      { label: "/en/scion", value: 30 },
      { label: "/scion/", value: 5 },
      { label: "/oxc", value: 200 },
    ],
    ARTICLES
  );

  assert.deepEqual(result.slice(0, 2), [
    { slug: "oxc", title: "Oxc 글", total: 200, ko: 200, en: 0 },
    { slug: "scion", title: "Scion 글", total: 125, ko: 95, en: 30 },
  ]);
});

test("글이 아닌 경로와 없는 글은 버린다", () => {
  const result = articleViews(
    [
      { label: "/", value: 500 },
      { label: "/about", value: 40 },
      { label: "/admin", value: 3 },
      { label: "/post/all/1", value: 60 },
      { label: "/en/only-ko", value: 7 },
    ],
    ARTICLES
  );

  assert.equal(result.reduce((sum, a) => sum + a.total, 0), 0);
});

test("조회수 0인 글도 뒤에 남는다", () => {
  const result = articleViews([{ label: "/scion", value: 1 }], ARTICLES);

  assert.deepEqual(
    result.map((a) => [a.slug, a.total]),
    [
      ["scion", 1],
      ["oxc", 0],
      ["only-ko", 0],
    ]
  );
});

test("한국어판이 없으면 영어 제목을 쓴다", () => {
  const result = articleViews([], [{ slug: "en-only", title: "English only", lang: "en" }]);

  assert.equal(result[0].title, "English only");
});
