import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { usedCharacters } from "@/scripts/gen-fonts";

/**
 * 서브셋 폰트가 본문을 다 덮는지 확인한다.
 *
 * 글에 새 글자를 쓰고 `pnpm fonts`를 깜빡하면 그 글자만 시스템 폰트로 빠진다.
 * 화면에서는 티가 잘 안 나고(비슷한 고딕으로 대체된다) 빌드도 통과한다.
 * 그래서 여기서 막는다.
 */

const MANIFEST = path.join("public", "fonts", "pretendard-subset.manifest.json");
const FONT = path.join("public", "fonts", "pretendard-subset.woff2");

test("서브셋 폰트 파일이 있다", () => {
  assert.ok(fs.existsSync(FONT), `${FONT} 가 없다. pnpm fonts 를 돌린다.`);
  assert.ok(fs.existsSync(MANIFEST), `${MANIFEST} 가 없다. pnpm fonts 를 돌린다.`);
});

test("본문에 쓰인 글자가 서브셋에 전부 들어 있다", () => {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8")) as { chars: string };
  const covered = new Set(manifest.chars);
  const missing = [...usedCharacters()].filter((char) => !covered.has(char));

  assert.deepEqual(
    missing,
    [],
    `서브셋에 없는 글자 ${missing.length}자: ${missing.slice(0, 30).join("")}\n` +
      `  → pnpm fonts 를 다시 돌린다.`
  );
});

test("매니페스트의 글자 수가 실제와 맞는다", () => {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST, "utf8")) as {
    chars: string;
    characters: number;
    bytes: number;
  };

  assert.equal(manifest.chars.length, manifest.characters);
  assert.equal(fs.statSync(FONT).size, manifest.bytes, "폰트 파일과 매니페스트가 어긋난다");
});
