/**
 * 어느 글이 어느 그림을 쓰는가.
 *
 * 태그로만 고르면 javascript 글 일곱 편이 전부 같은 그림이 되므로 슬러그로
 * 직접 배정한다. 배정이 없는 글은 TAG_FALLBACK 이 임시로 맡는다.
 */

import type { Post } from "@/app/lib/posts/types";
import type { Shape } from "./primitives";
import {
  Nodes,
  Deps,
  Recheck,
  Bars,
  Package,
  Lint,
  Migrate,
  Layers,
  Clock,
  Rows,
  Markup,
  KeyValue,
  Toggle,
  Proxy,
  Window,
  Graph,
  Cache,
  Spinner,
  NumberLine,
  Focus,
  Lazy,
  Curve,
  Brick,
} from "./motifs";

/* ------------------------------------------------------------------ *
 * 글 -> 모티프
 * ------------------------------------------------------------------ */

export type MotifName =
  | "nodes" | "bars" | "package" | "lint" | "migrate" | "layers" | "clock"
  | "rows" | "keyValue" | "toggle" | "proxy" | "window" | "graph" | "cache"
  | "spinner" | "numberLine" | "focus" | "lazy" | "curve" | "markup" | "deps"
  | "recheck" | "brick";

export const MOTIFS: Record<MotifName, (p: Shape) => React.ReactElement> = {
  nodes: Nodes,
  bars: Bars,
  package: Package,
  lint: Lint,
  migrate: Migrate,
  layers: Layers,
  clock: Clock,
  rows: Rows,
  keyValue: KeyValue,
  toggle: Toggle,
  proxy: Proxy,
  window: Window,
  graph: Graph,
  cache: Cache,
  spinner: Spinner,
  numberLine: NumberLine,
  focus: Focus,
  lazy: Lazy,
  curve: Curve,
  markup: Markup,
  deps: Deps,
  recheck: Recheck,
  brick: Brick,
};

/** 모티프마다 다른 색. 같은 그림이 없으니 색도 겹치지 않게 둔다. */
export const ACCENT: Record<MotifName, string> = {
  nodes: "#60a5fa",
  bars: "#38bdf8",
  package: "#f87171",
  lint: "#34d399",
  migrate: "#a78bfa",
  layers: "#c084fc",
  clock: "#fbbf24",
  rows: "#4ade80",
  keyValue: "#f472b6",
  toggle: "#facc15",
  proxy: "#2dd4bf",
  window: "#22d3ee",
  graph: "#e879f9",
  cache: "#fb923c",
  spinner: "#818cf8",
  numberLine: "#fde047",
  focus: "#f43f5e",
  lazy: "#06b6d4",
  curve: "#a3e635",
  markup: "#fb7185",
  deps: "#14b8a6",
  recheck: "#3b82f6",
  brick: "#f97316",
};

/**
 * 글 하나에 모티프 하나. 제목이 다루는 내용에 맞춘다.
 *
 * 태그로만 고르면 javascript 글 일곱 편이 전부 같은 그림이 된다.
 * 그래서 슬러그로 직접 배정한다. 새 글은 아래 TAG_FALLBACK이 임시로 맡고,
 * 어울리는 그림이 생기면 여기에 한 줄 추가하면 된다.
 */
const MOTIF_BY_SLUG: Record<string, MotifName> = {
  "ai-developer-responsibility": "nodes",
  "swe-bench": "bars",
  "npm-tgz": "package",
  Oxc: "lint",
  CloudflarePages: "migrate",
  "Activity-Compoments": "layers",
  Temporal: "clock",
  "NDJSON-JSON": "rows",
  "Object-Map": "keyValue",
  "truthy-falsy": "toggle",
  "javascript-proxy": "proxy",
  "window-object": "window",
  "graphql-study": "graph",
  "code-caching": "cache",
  "react-suspense-javascript-promise-throw": "spinner",
  "difference-between-number-and-parseInt": "numberLine",
  "focus-trap": "focus",
  "dynamic-components-and-lazy": "lazy",
  "JavaScript-String-Index-notation": "curve",
  "ai-markdown": "markup",
  "dependabot-alerts": "deps",
  "tsc-incremental-type-check": "recheck",
  "next-og-satori": "brick",
};

/** 아직 배정하지 않은 글이 쓸 기본값. 위에 있는 태그가 이긴다. */
const TAG_FALLBACK: [tag: string, motif: MotifName][] = [
  ["swe-bench", "bars"],
  ["ai", "nodes"],
  ["graphql", "graph"],
  ["npm", "package"],
  ["cloudflare", "migrate"],
  ["nextjs", "layers"],
  ["browser", "window"],
  ["react", "lazy"],
  ["typescript", "recheck"],
  ["javascript", "rows"],
];

export function motifOf(post: Post): MotifName {
  const assigned = MOTIF_BY_SLUG[post.slug];
  if (assigned !== undefined) {
    return assigned;
  }
  for (const [tag, motif] of TAG_FALLBACK) {
    if (post.tags.includes(tag)) {
      return motif;
    }
  }
  return "nodes";
}
