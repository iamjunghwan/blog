/**
 * PostToolUse(Edit|Write) — 글 파일을 고친 직후 그 파일 하나만 검사한다.
 *
 * - 실제 파서(parsePost)로 읽어 frontmatter 오류를 잡는다
 * - 짝(같은 slug의 반대 언어판)이 있으면 date·tags·thumbnail 일치를 본다
 *
 * draft는 보지 않는다. 번역 중에는 갈리는 게 정상이고, 경고하면 Claude가 draft를
 * 맞추려다 글을 공개해 버릴 수 있다. 공개 시점의 일치는 content.test.ts가 검사한다.
 *
 * exit 2 + stderr → 이미 고친 뒤라 막지는 않고, 문제를 Claude에게 알려 고치게 한다.
 */
import fs from "node:fs";
import path from "node:path";
import { parsePost } from "@/app/lib/posts/parse";
import { POSTS_DIR, loadPosts } from "@/app/lib/posts/repository";
import type { Lang, Post } from "@/app/lib/posts/types";

async function readStdin(): Promise<string> {
  let input = "";
  for await (const chunk of process.stdin) input += chunk;
  return input;
}

function fail(message: string): never {
  console.error(message);
  process.exit(2);
}

async function main(): Promise<void> {
  const { tool_input: toolInput } = JSON.parse(await readStdin());
  const filePath = path.resolve(String(toolInput?.file_path ?? ""));
  const relative = path.relative(POSTS_DIR, filePath).split(path.sep);
  const lang = relative[0] as Lang;

  // content/posts/<ko|en>/.../*.md 가 아니면 상관하지 않는다.
  if (!["ko", "en"].includes(lang) || !filePath.endsWith(".md")) {
    return;
  }

  const fileName = relative.slice(1).join("/");
  let post: Post;

  try {
    post = parsePost(fs.readFileSync(filePath, "utf8"), fileName, lang);
  } catch (error) {
    fail(`${lang}/${fileName}: ${(error as Error).message}`);
  }

  const otherLang: Lang = lang === "ko" ? "en" : "ko";
  let pair: Post | undefined;

  try {
    pair = loadPosts(path.join(POSTS_DIR, otherLang), true, otherLang).find((p) => p.slug === post.slug);
  } catch {
    // 반대 언어 폴더의 다른 글이 깨져 있으면 그 글을 고칠 때 이 훅이 잡는다.
    return;
  }

  if (!pair) {
    return;
  }

  const problems: string[] = [];

  if (post.date !== pair.date) {
    problems.push(`date: ${post.date} ↔ ${otherLang} ${pair.date} (썸네일 경로가 날짜로 정해진다)`);
  }
  if (JSON.stringify(post.tags) !== JSON.stringify(pair.tags)) {
    problems.push(`tags: ${JSON.stringify(post.tags)} ↔ ${otherLang} ${JSON.stringify(pair.tags)}`);
  }
  if (post.thumbnail && pair.thumbnail && post.thumbnail !== pair.thumbnail) {
    problems.push(`thumbnail: ${post.thumbnail} ↔ ${otherLang} ${pair.thumbnail}`);
  }

  if (problems.length > 0) {
    fail(`${lang}/${fileName}: ${otherLang}판과 짝이 맞지 않는다\n- ${problems.join("\n- ")}`);
  }
}

main();
