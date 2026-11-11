/**
 * 글 대표 이미지(og:image) 생성기. next/og(satori)로 PNG를 만든다.
 *
 *   pnpm thumbnail            모든 글의 썸네일을 만들고 frontmatter를 갱신한다
 *   pnpm thumbnail <slug>     그 글 하나만
 *
 * 카드에 글씨는 넣지 않는다. 공유 카드에서는 제목이 og:title로 따로 나오고,
 * 목록에서는 바로 옆에 제목이 붙으므로 그림 안에서 반복할 이유가 없다.
 *
 * 대신 **글마다 다른 그림**을 그린다. 같은 태그라도 다루는 내용이 다르면
 * 다른 모티프를 쓴다 (javascript 글이 전부 중괄호가 되지 않도록).
 *
 * 그림을 고치려면 motifs.tsx, 어느 글이 무엇을 쓸지는 registry.ts 를 본다.
 */

import { ImageResponse } from "next/og";
import fs from "node:fs";
import path from "node:path";
import { POSTS_DIR, allPosts } from "@/app/lib/posts/repository";
import type { Post } from "@/app/lib/posts/types";
import { BASE_HEIGHT, BASE_WIDTH, s } from "./canvas";
import { Thumbnail } from "./card";
import { motifOf } from "./registry";
import type { MotifName } from "./registry";

/* ------------------------------------------------------------------ *
 * 실행
 * ------------------------------------------------------------------ */

async function renderToFile(post: Post, outPath: string): Promise<number> {
  const image = new ImageResponse(<Thumbnail motif={motifOf(post)} />, {
    width: s(BASE_WIDTH),
    height: s(BASE_HEIGHT),
  });

  const buffer = Buffer.from(await image.arrayBuffer());
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, buffer);
  return buffer.length;
}

/**
 * frontmatter에 thumbnail 줄을 넣거나 바꾼다.
 * 줄 단위로 다루되 원본의 줄바꿈 문자를 유지한다 — CRLF 파일에 LF를 섞으면
 * 깃 diff가 파일 전체를 바뀐 것으로 본다.
 */
function setThumbnail(filePath: string, value: string): "추가" | "갱신" | "그대로" {
  const source = fs.readFileSync(filePath, "utf8");
  const eol = source.includes("\r\n") ? "\r\n" : "\n";
  const lines = source.split(/\r?\n/);

  const end = lines.indexOf("---", 1);
  if (lines[0] !== "---" || end === -1) {
    throw new Error(`${filePath}: frontmatter를 찾지 못했다`);
  }

  const line = `thumbnail: "${value}"`;
  const at = lines.findIndex((l, i) => i > 0 && i < end && l.startsWith("thumbnail:"));

  if (at !== -1) {
    if (lines[at] === line) {
      return "그대로";
    }
    lines[at] = line;
    fs.writeFileSync(filePath, lines.join(eol));
    return "갱신";
  }

  const tagsAt = lines.findIndex((l, i) => i > 0 && i < end && l.startsWith("tags:"));
  lines.splice(tagsAt === -1 ? end : tagsAt + 1, 0, line);
  fs.writeFileSync(filePath, lines.join(eol));
  return "추가";
}

async function main() {
  const only = process.argv[2];
  const posts = allPosts().filter((p) => only === undefined || p.slug === only);

  if (posts.length === 0) {
    console.error(only ? `'${only}' 글을 찾지 못했다` : "글이 없다");
    process.exit(1);
  }

  const used = new Map<MotifName, string>();

  for (const post of posts) {
    const date = post.date; // "YYYY-MM-DD"
    const rel = `/uploads/${date.slice(0, 4)}/${date.slice(5, 7)}/${post.slug}.png`;
    const outPath = path.join("public", rel);
    const motif = motifOf(post);

    const bytes = await renderToFile(post, outPath);
    // 경로를 날짜로 재조립하지 않는다. 글이 언제 쓰였는지와 어느 폴더에 있는지는
    // 다른 문제이고, 언어 폴더가 생기면서 재조립이 실제로 깨졌다.
    const result = setThumbnail(
      path.join(POSTS_DIR, post.lang, post.fileName),
      rel
    );

    // 그림이 겹치면 목록에서 같은 카드가 두 장 보인다. 조용히 지나가지 않게 알린다.
    // 단 같은 slug의 두 언어판은 같은 글이라 같은 그림이 맞다 — 그것까지 경고하면
    // 번역이 늘수록 경고가 전부 오탐이 되어 진짜 충돌을 가린다.
    const clash = used.get(motif);
    const mark =
      clash === undefined || clash === post.slug ? "" : `  ** ${clash} 와(과) 같은 그림`;
    used.set(motif, post.slug);

    console.log(
      `${motif.padEnd(11)} ${String(Math.round(bytes / 1024)).padStart(4)}KB  ` +
        `${result}  ${post.title}${mark}`
    );
  }

  console.log(`\n${posts.length}개 완료 — 서로 다른 그림 ${used.size}종`);
}

main().catch((error) => {
  console.error("실패:", error.message);
  process.exit(1);
});
