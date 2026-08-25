/****************************************
 *
 * CMS -> Markdown 1회성 마이그레이션
 *
 * 사용법:
 *   API_TOKEN=xxx npx tsx scripts/migrate-from-cms.ts
 *
 * 원본 응답을 migration/cms-dump.json에 저장하므로, 두 번째 실행부터는
 * 토큰 없이 덤프만 재사용해 변환을 다시 시도할 수 있다.
 *
 * OUT_DIR 환경변수로 출력 경로를 바꿀 수 있다 (실제 content/posts를 건드리지
 * 않고 시험 실행할 때 사용).
 *
 ****************************************/

import fs from "node:fs";
import path from "node:path";
import TurndownService from "turndown";
import { gfm } from "turndown-plugin-gfm";

const API_URL =
  "https://api.memexdata.io/memex/api/projects/0e9c148b/models/blog/contents/search/v2";
const DUMP_PATH = path.join(process.cwd(), "migration", "cms-dump.json");
const OUT_DIR = process.env.OUT_DIR
  ? path.resolve(process.env.OUT_DIR)
  : path.join(process.cwd(), "content", "posts");

type CmsItem = {
  uid: string;
  createdAt: string;
  data: {
    slug: string;
    content: string;
    title: { KO: string };
    tags: string;
    /** ApiItem 타입에는 없었지만 실제 응답에 존재한다 (기존 사이트맵이 lastmod로 썼다) */
    date?: string;
  };
};

type Warning = { slug: string; kind: string; detail: string };

async function loadDump(): Promise<CmsItem[]> {
  if (fs.existsSync(DUMP_PATH)) {
    console.log(`기존 덤프 재사용: ${DUMP_PATH}`);
    return JSON.parse(fs.readFileSync(DUMP_PATH, "utf8")).list;
  }

  const token = process.env.API_TOKEN;
  if (!token) {
    throw new Error(
      "API_TOKEN 환경변수가 필요합니다. 덤프가 없으면 CMS를 호출해야 합니다."
    );
  }

  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Access-Token": token },
    body: JSON.stringify({
      size: 100,
      page: 0,
      direction: "DESC",
      orderCond: { type: "DATE_CREATE" },
    }),
  });

  if (!response.ok) {
    throw new Error(`CMS 응답 실패: ${response.status}`);
  }

  const json = await response.json();
  if (!Array.isArray(json.list)) {
    throw new Error("응답에 list가 없습니다.");
  }

  fs.mkdirSync(path.dirname(DUMP_PATH), { recursive: true });
  fs.writeFileSync(DUMP_PATH, JSON.stringify(json, null, 2), "utf8");
  console.log(`원본 덤프 저장: ${DUMP_PATH} (${json.list.length}건)`);

  return json.list;
}

function createTurndown(): TurndownService {
  const service = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
    fence: "```",
    bulletListMarker: "-",
    emDelimiter: "*",
  });

  service.use(gfm);

  // md로 표현할 수 없는 것은 조용히 버리지 않고 raw HTML로 남긴다.
  // table은 넣지 않는다 — gfm 플러그인이 md 표로 변환하므로 keep하면 그 변환을 막는다.
  service.keep(["iframe", "video", "source", "figure"]);

  // 코드블록 규칙. **`pre > code`를 전제하면 안 된다.**
  //
  // 실측: 이 CMS의 <pre> 46개 중 <code>를 가진 것은 0개다. TinyMCE가 Prism으로
  // 하이라이팅해서 <pre class="language-javascript"> 안에 <span class="token ..."> 들이
  // 직접 들어 있다. turndown 내장 규칙도 pre>code를 요구하므로 함께 발동하지 않아,
  // 규칙이 없으면 코드가 일반 블록으로 떨어져 마크다운 이스케이프(\[, \-)를 먹고 깨진다.
  //
  // 언어는 <pre>의 class에 있고, textContent가 Prism span들을 원래 코드로 되돌린다.
  service.addRule("fencedCodeBlock", {
    filter: (node) => node.nodeName === "PRE",
    replacement: (_content, node) => {
      const element = node as HTMLElement;
      const className = element.getAttribute?.("class") ?? "";
      const raw = /language-(\S+)/.exec(className)?.[1] ?? "";
      // Prism은 HTML을 'markup'이라 부른다. 펜스에는 통용되는 이름을 쓴다.
      const language = raw === "markup" ? "html" : raw;
      const text = (element.textContent ?? "").replace(/\n+$/, "");

      return `\n\n\`\`\`${language}\n${text}\n\`\`\`\n\n`;
    },
  });

  // 산문 속 꺾쇠를 다시 엔티티로 만든다.
  //
  // 원본에는 `&lt;iframe&gt;` 처럼 **글자로 보여주려는** 태그 이름이 있다. turndown이
  // 엔티티를 디코드해 `<iframe>`로 되돌리는데, markdown-it은 html: true라 그것을 진짜
  // 태그로 파싱해버린다 — 화면에서 그 문구가 사라진다.
  //
  // escape는 텍스트 노드에만 적용된다. keep()으로 남긴 표·video와 코드블록은 이 경로를
  // 타지 않으므로, 의도적으로 보존한 HTML은 그대로 두고 산문만 안전해진다.
  const escapeMarkdown = service.escape.bind(service);
  service.escape = (text: string) => escapeMarkdown(text).replace(/</g, "&lt;");

  return service;
}

/**
 * 자산 경로를 절대경로로 통일한다.
 * 원본은 형식이 섞여 있다: 2026년 이미지는 /uploads/..., 2025년 이미지와 .mov는 uploads/...
 * <img> 뿐 아니라 <source>(동영상)도 대상이다.
 */
function normalizeAssetPaths(markdown: string): string {
  return (
    markdown
      // md 이미지 문법: ![alt](uploads/...) -> ![alt](/uploads/...)
      .replace(/\]\((?:\.\/)?uploads\//g, "](/uploads/")
      // 남은 raw HTML의 <img>, <video>의 <source>
      // 주의: `data-mce-src`가 아니라 `src`만 잡아야 한다 (앞에 하이픈이 오면 안 됨)
      .replace(
        /((?:^|[^-])\bsrc=["'])(?:\.\/)?uploads\//gi,
        "$1/uploads/"
      )
  );
}

function toDateOnly(value: string): string {
  return value.slice(0, 10);
}

function parseTags(raw: string): string[] {
  return raw
    .split(",")
    .map((tag) => tag.trim())
    .filter((tag) => tag !== "");
}

function buildFrontmatter(item: CmsItem, date: string, tags: string[]): string {
  return [
    "---",
    `slug: ${item.data.slug}`,
    `title: ${JSON.stringify(item.data.title.KO)}`,
    `date: ${date}`,
    `tags: [${tags.map((tag) => JSON.stringify(tag)).join(", ")}]`,
    "draft: false",
    "---",
  ].join("\n");
}

function collectWarnings(
  item: CmsItem,
  markdown: string,
  date: string
): Warning[] {
  const warnings: Warning[] = [];
  const slug = item.data.slug;

  /** 펜스로 감싼 코드블록을 지운다. 리스트 안의 펜스는 들여쓰여 있으므로 공백을 허용한다. */
  const stripFences = (source: string): string => {
    const kept: string[] = [];
    let inFence = false;

    for (const line of source.split(/\r\n|\r|\n/)) {
      if (/^[ \t]*```/.test(line)) {
        inFence = !inFence;
        continue;
      }
      if (!inFence) {
        kept.push(line);
      }
    }
    return kept.join("\n");
  };

  // 코드블록이 통째로 유실되지 않았는지 먼저 본다.
  // "언어 없는 펜스"만 세면 펜스가 아예 안 만들어진 경우를 못 잡는다 — 실제로 그 함정에 빠졌었다.
  // 펜스가 리스트 항목 안에 있으면 turndown이 4칸씩 들여쓰므로 줄 앞 공백을 허용해야 한다
  // (컬럼 0에만 고정하면 리스트 안에 중첩된 코드블록을 오탐으로 놓친다).
  const sourcePreCount = (item.data.content.match(/<pre[\s>]/g) ?? []).length;
  const fenceLineCount = (markdown.match(/^[ \t]*```/gm) ?? []).length;
  const blockCount = fenceLineCount / 2;

  if (sourcePreCount !== blockCount) {
    warnings.push({
      slug,
      kind: "코드블록 개수 불일치",
      detail: `원본 <pre> ${sourcePreCount}개 -> 펜스 ${blockCount}개. 변환 규칙이 발동하지 않았을 수 있다`,
    });
  }

  // 언어가 붙은 여는 펜스만 센다. `^```\s*$`로 세면 닫는 펜스까지 세어 항상 경고가 뜬다.
  const withLanguageCount = (markdown.match(/^[ \t]*```\S/gm) ?? []).length;

  if (blockCount !== withLanguageCount) {
    warnings.push({
      slug,
      kind: "코드블록 언어 없음",
      detail: `펜스 ${blockCount}개 중 언어가 붙은 것은 ${withLanguageCount}개 - 확인 필요`,
    });
  }

  // 남아 있는 raw HTML.
  // 코드블록 안은 보지 않는다. TypeScript 제네릭(`reduce<Record<string, User>>`)이나
  // JSX 예시가 태그로 오인되어 `record`, `string` 같은 가짜 경고를 만든다.
  // 경고가 오탐으로 시끄러워지면 진짜 경고를 놓치게 된다.
  const rawTags = [...stripFences(markdown).matchAll(/<([a-z][a-z0-9]*)\b/gi)].map(
    (match) => match[1].toLowerCase()
  );
  const uniqueRawTags = [...new Set(rawTags)];
  if (uniqueRawTags.length > 0) {
    warnings.push({
      slug,
      kind: "raw HTML 유지",
      detail: uniqueRawTags.join(", "),
    });
  }

  // createdAt과 data.date 불일치
  if (item.data.date && toDateOnly(item.data.date) !== date) {
    warnings.push({
      slug,
      kind: "날짜 불일치",
      detail: `createdAt=${date} / data.date=${toDateOnly(item.data.date)} - 어느 쪽을 쓸지 판단 필요`,
    });
  }

  // 수상한 이미지 경로
  for (const match of markdown.matchAll(/!\[[^\]]*\]\(([^)\s]+)/g)) {
    const src = match[1];
    if (!src.startsWith("/uploads/") && !/^https?:\/\//.test(src)) {
      warnings.push({ slug, kind: "이미지 경로 확인", detail: src });
    }
  }

  return warnings;
}

async function main(): Promise<void> {
  const items = await loadDump();
  const turndown = createTurndown();
  const warnings: Warning[] = [];

  fs.mkdirSync(OUT_DIR, { recursive: true });

  for (const item of items) {
    const date = toDateOnly(item.createdAt);
    const tags = parseTags(item.data.tags);
    const body = normalizeAssetPaths(turndown.turndown(item.data.content));
    const fileName = `${date.slice(0, 7)}-${item.data.slug}.md`;

    fs.writeFileSync(
      path.join(OUT_DIR, fileName),
      `${buildFrontmatter(item, date, tags)}\n\n${body.trim()}\n`,
      "utf8"
    );

    warnings.push(...collectWarnings(item, body, date));
    console.log(`작성: ${fileName} (태그 ${tags.length}개)`);
  }

  console.log(`\n총 ${items.length}건 변환 완료 -> ${OUT_DIR}`);

  if (warnings.length === 0) {
    console.log("경고 없음");
    return;
  }

  console.log(`\n=== 확인 필요 ${warnings.length}건 ===`);
  for (const warning of warnings) {
    console.log(`[${warning.kind}] ${warning.slug}: ${warning.detail}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
