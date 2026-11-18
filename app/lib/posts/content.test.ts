import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { POSTS_DIR, loadAllPosts } from "@/app/lib/posts/repository";
import { postsIn } from "@/app/lib/posts/queries";
import { renderPostBody } from "@/app/lib/posts/render";
import { thumbnailOf, DEFAULT_THUMBNAIL } from "@/app/lib/posts/thumbnail";
import { MOTIF_BY_SLUG } from "@/scripts/thumbnail/registry";

/**
 * 실제 content/posts를 대상으로 하는 회귀 테스트.
 *
 * 나머지 테스트는 전부 합성 픽스처를 쓴다. 마이그레이션 스크립트와 원본 덤프는
 * 배포가 안정되면 지울 예정이라, 그 뒤에는 이 파일이 실제 글을 지키는 유일한 장치다.
 */
const posts = loadAllPosts(POSTS_DIR, true);

test("언어 폴더가 글의 lang을 정한다", () => {
  // 폴더가 언어를 정한다. 이동이나 추가가 잘못되면 글이 엉뚱한 언어로 잡힌다.
  const ko = postsIn(posts, "ko");
  const en = postsIn(posts, "en");

  assert.equal(ko.length + en.length, posts.length, "ko도 en도 아닌 글이 있다");
  // 양쪽에 하한을 둔다. 한쪽만 재면 반대 폴더 글이 그쪽으로 잘못 잡혀도 통과한다.
  // 특히 en 폴더 글이 ko로 잡히는 쪽이 위험하다 — 한국어 주소가 영어 본문을 내게 된다.
  assert.ok(ko.length >= 19, `한국어 글이 ${ko.length}편뿐이다 (19편 이상이어야 한다)`);
  assert.ok(en.length >= 1, `영어 글이 ${en.length}편이다 (1편 이상이어야 한다)`);
});

test("모든 글이 파싱되고 최소 1건 이상 존재한다", () => {
  assert.ok(posts.length > 0, "content/posts가 비어 있다");
});

test("모든 글에 h1이 정확히 하나 있다", () => {
  for (const post of posts) {
    const count = (renderPostBody(post.body).match(/<h1[\s>]/g) ?? []).length;

    assert.equal(count, 1, `${post.slug}: h1이 ${count}개다`);
  }
});

test("모든 글이 TOC 헤딩을 하나 이상 만든다", () => {
  for (const post of posts) {
    const html = renderPostBody(post.body);

    assert.match(html, /class="toc"/, `${post.slug}: TOC가 없다`);
  }
});

test("모든 대표 이미지가 public에 실재한다", () => {
  for (const post of posts) {
    const thumbnail = thumbnailOf(post);

    if (thumbnail === DEFAULT_THUMBNAIL || /^https?:/.test(thumbnail)) {
      continue;
    }
    const filePath = path.join(process.cwd(), "public", decodeURIComponent(thumbnail));

    assert.ok(fs.existsSync(filePath), `${post.slug}: ${thumbnail} 파일이 없다`);
  }
});

test("slug이 언어 안에서 겹치지 않는다", () => {
  // 두 언어판은 같은 slug으로 짝을 이루므로, 중복 검사는 언어별로 한다.
  for (const lang of ["ko", "en"] as const) {
    const slugs = postsIn(posts, lang).map((post) => post.slug);

    assert.equal(new Set(slugs).size, slugs.length, `${lang} slug 중복`);
  }
});

test("ko·en 짝은 date·tags·thumbnail·draft가 같다", () => {
  // 썸네일 경로가 날짜로 조립되므로 날짜가 갈리면 영어판이 다른 그림을 가리킨다.
  // draft가 갈리면 한쪽만 공개된다.
  const ko = new Map(postsIn(posts, "ko").map((post) => [post.slug, post]));

  for (const en of postsIn(posts, "en")) {
    const pair = ko.get(en.slug);

    if (!pair) {
      continue;
    }
    assert.equal(en.date, pair.date, `${en.slug}: date가 다르다`);
    assert.deepEqual(en.tags, pair.tags, `${en.slug}: tags가 다르다`);
    assert.equal(en.thumbnail, pair.thumbnail, `${en.slug}: thumbnail이 다르다`);
    assert.equal(en.draft, pair.draft, `${en.slug}: draft가 다르다`);
  }
});

test("공개된 영어판에는 description이 있다", () => {
  // 없으면 본문 첫 문단이 검색·공유 설명으로 나간다. 빌드는 통과하므로 여기서 잡는다.
  for (const post of postsIn(posts, "en")) {
    if (post.draft) {
      continue;
    }
    assert.ok(post.description, `${post.slug}: 영어판에 description이 없다`);
  }
});

test("공개된 글마다 고유한 썸네일 그림이 배정돼 있다", () => {
  // 배정이 없으면 태그 폴백이 고르는데, 폴백 그림은 전부 다른 글이 이미 쓰고 있다.
  const published = new Set(posts.filter((post) => !post.draft).map((post) => post.slug));

  for (const slug of published) {
    assert.ok(slug in MOTIF_BY_SLUG, `${slug}: scripts/thumbnail/registry.ts의 MOTIF_BY_SLUG에 그림이 없다`);
  }

  const motifs = Object.entries(MOTIF_BY_SLUG)
    .filter(([slug]) => published.has(slug))
    .map(([, motif]) => motif);

  assert.equal(new Set(motifs).size, motifs.length, "두 글이 같은 그림을 쓴다");
});
