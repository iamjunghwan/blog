/**
 * PreToolUse(Bash) — 되돌리기 어려운 명령을 실행 전에 막는다.
 *
 * - `pnpm thumbnail`을 slug 없이: 대표 이미지 전부를 다시 그린다. 배경 글로우가
 *   잘리는 문제가 있어 기존 PNG가 더 낫다 (scripts/README.md).
 * - `pnpm fonts`를 main 밖에서: 모든 글 기준으로 다시 만들어 브랜치마다 결과가 갈린다.
 *
 * exit 2 + stderr → 명령이 막히고 이유가 Claude에게 전달된다.
 */
import { execSync } from "node:child_process";

let input = "";
for await (const chunk of process.stdin) input += chunk;

const { tool_input: toolInput, cwd } = JSON.parse(input);
const command = String(toolInput?.command ?? "");

function block(reason) {
  console.error(reason);
  process.exit(2);
}

// 한 줄에 여러 명령이 이어질 수 있으므로 구분자로 나눠 각각 본다.
for (const part of command.split(/&&|\|\||;|\n/)) {
  const words = part.trim().split(/\s+/);
  const at = words.findIndex((word, i) =>
    (word === "thumbnail" && (words[i - 1] === "pnpm" || words[i - 1] === "run")) ||
    word.endsWith("scripts/thumbnail/main.tsx")
  );

  if (at !== -1 && (words[at + 1] === undefined || words[at + 1].startsWith("|") || words[at + 1].startsWith(">"))) {
    block(
      "pnpm thumbnail 은 slug 없이 돌리지 않는다 — 대표 이미지 전부를 다시 그린다.\n" +
        "한 글만 뽑는다: pnpm thumbnail <slug>"
    );
  }

  if (/\bpnpm\s+(run\s+)?fonts\b/.test(part)) {
    let branch = "";
    try {
      branch = execSync("git rev-parse --abbrev-ref HEAD", { cwd, encoding: "utf8" }).trim();
    } catch {
      continue;
    }
    if (branch !== "main") {
      block(
        `pnpm fonts 는 main 에서만 돌린다 (지금 브랜치: ${branch}).\n` +
          "모든 글 기준으로 서브셋을 다시 만들어 브랜치마다 결과가 갈린다. main 에 합친 뒤 돌린다."
      );
    }
  }
}
