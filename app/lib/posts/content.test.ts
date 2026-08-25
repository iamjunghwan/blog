import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { POSTS_DIR, loadPosts } from "@/app/lib/posts/repository";
import { renderPostBody } from "@/app/lib/posts/render";
import { thumbnailOf, DEFAULT_THUMBNAIL } from "@/app/lib/posts/thumbnail";

/**
 * 실제 content/posts를 대상으로 하는 회귀 테스트.
 *
 * 나머지 테스트는 전부 합성 픽스처를 쓴다. 마이그레이션 스크립트와 원본 덤프는
 * 배포가 안정되면 지울 예정이라, 그 뒤에는 이 파일이 실제 글을 지키는 유일한 장치다.
 */
const posts = loadPosts(POSTS_DIR, true);

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

test("slug이 서로 겹치지 않는다", () => {
  const slugs = posts.map((post) => post.slug);

  assert.equal(new Set(slugs).size, slugs.length, "slug 중복");
});
