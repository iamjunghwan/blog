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
 * 레이아웃은 1200x630(OG 표준 1.91:1) 기준으로 적고 배율만 곱해서 키운다.
 * 비율을 바꾸면 카카오톡·트위터가 카드를 잘라내므로 가로세로를 따로 늘리지 않는다.
 * 카드 썸네일도 같은 40:21이라 목록과 공유 카드 어느 쪽에서도 잘리지 않는다.
 */
import { ImageResponse } from "next/og";
import fs from "node:fs";
import path from "node:path";
import { POSTS_DIR, allPosts } from "@/app/lib/posts/repository";
import type { Post } from "@/app/lib/posts/types";

const BASE_WIDTH = 1200;
const BASE_HEIGHT = 630;

/**
 * 출력 배율. 1배면 1200x630으로, og:image 표준값과 정확히 같다.
 *
 * 목록 카드는 224px 폭으로 그려지므로 1200px이면 3배 고해상도 화면에서도
 * 1.8배 여유가 남는다. 2배로 뽑으면 장당 290KB가 되어 목록 한 페이지가
 * 1.4MB를 넘는데, 눈에 보이는 차이는 없다.
 *
 * 카드를 본문 폭(720px)만큼 키우게 되면 그때 2배를 다시 검토한다.
 */
const SCALE = 1;

const BG_BASE = "#070b14";
/**
 * 테두리 도형의 안쪽을 덮는 색. 뒤의 빛무리를 가려 도형이 또렷해진다.
 * 바탕과 너무 멀면 면이 파란 덩어리로 떠 보이므로 아주 조금만 밝게 둔다.
 */
const BG_CARD = "#0a0f1a";

/** 유리 패널 안쪽 여백. 안쪽 높이 630 - 40*2 = 550. */
const PANEL_INSET = 40;

/** 모티프 확대율. 430 * 1.15 = 494 < 550 이라 패널 안에 들어간다. */
const MOTIF_ZOOM = 1.15;

/** 1200x630 기준으로 적은 치수를 실제 출력 크기로 환산한다. */
const s = (value: number) => Math.round(value * SCALE);

/** 모티프 안의 치수. 360x430 기준으로 적은 좌표를 확대까지 반영해 환산한다. */
const m = (value: number) => Math.round(value * MOTIF_ZOOM * SCALE);

/* ------------------------------------------------------------------ *
 * 그리기 primitive
 *
 * satori는 flex만 다루고 transformOrigin을 지원하지 않는다. 회전은 항상 요소
 * 중심을 축으로 일어나므로, 선은 두 점의 중점에 놓고 돌려야 양 끝이 맞는다.
 * ------------------------------------------------------------------ */

type Point = { x: number; y: number };
type Shape = { accent: string };

function Line({
  from,
  to,
  accent,
  opacity = 0.5,
  thickness = 4,
  radius = 0,
}: {
  from: Point;
  to: Point;
  accent: string;
  opacity?: number;
  thickness?: number;
  radius?: number;
}) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

  return (
    <div
      style={{
        position: "absolute",
        left: m((from.x + to.x) / 2 - length / 2),
        top: m((from.y + to.y) / 2 - thickness / 2),
        width: m(length),
        height: m(thickness),
        borderRadius: m(radius),
        background: accent,
        opacity,
        transform: `rotate(${angle}deg)`,
      }}
    />
  );
}

function Dot({
  at,
  size,
  accent,
  filled = false,
  opacity = 1,
  border = 4,
}: {
  at: Point;
  size: number;
  accent: string;
  filled?: boolean;
  opacity?: number;
  border?: number;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: m(at.x - size / 2),
        top: m(at.y - size / 2),
        width: m(size),
        height: m(size),
        borderRadius: m(size),
        // 단색으로 채우면 평평해 보인다. 같은 색의 농담으로 결을 준다.
        background: filled ? `linear-gradient(140deg, ${accent}, ${accent}99)` : BG_CARD,
        border: `${m(border)}px solid ${accent}`,
        opacity,
        // 네온처럼 쨍하게 빛나지 않도록 넓게 퍼뜨리고 알파를 낮춘다.
        boxShadow: `0 0 ${m(46)}px ${accent}2e`,
      }}
    />
  );
}

function Box({
  left,
  top,
  width,
  height,
  accent,
  radius = 0,
  opacity = 1,
  filled = false,
  border = 4,
  dashed = false,
}: {
  left: number;
  top: number;
  width: number;
  height: number;
  accent: string;
  radius?: number;
  opacity?: number;
  filled?: boolean;
  border?: number;
  dashed?: boolean;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: m(left),
        top: m(top),
        width: m(width),
        height: m(height),
        borderRadius: m(radius),
        border: filled ? "none" : `${m(border)}px ${dashed ? "dashed" : "solid"} ${accent}`,
        background: filled ? `linear-gradient(140deg, ${accent}, ${accent}99)` : "transparent",
        opacity,
      }}
    />
  );
}

/** 체크 표시. 짧은 획과 긴 획을 각각 돌려 붙인다. */
function Check({ at, accent, size = 34 }: { at: Point; accent: string; size?: number }) {
  const k = size / 34;
  return (
    <>
      <Line
        from={{ x: at.x - 13 * k, y: at.y + 2 * k }}
        to={{ x: at.x - 3 * k, y: at.y + 12 * k }}
        accent={accent}
        opacity={1}
        thickness={6 * k}
        radius={3}
      />
      <Line
        from={{ x: at.x - 4 * k, y: at.y + 12 * k }}
        to={{ x: at.x + 14 * k, y: at.y - 12 * k }}
        accent={accent}
        opacity={1}
        thickness={6 * k}
        radius={3}
      />
    </>
  );
}

/** 가위표. */
function Cross({ at, accent, size = 30 }: { at: Point; accent: string; size?: number }) {
  const h = size / 2;
  return (
    <>
      <Line
        from={{ x: at.x - h, y: at.y - h }}
        to={{ x: at.x + h, y: at.y + h }}
        accent={accent}
        opacity={1}
        thickness={6}
        radius={3}
      />
      <Line
        from={{ x: at.x + h, y: at.y - h }}
        to={{ x: at.x - h, y: at.y + h }}
        accent={accent}
        opacity={1}
        thickness={6}
        radius={3}
      />
    </>
  );
}

/* ------------------------------------------------------------------ *
 * 모티프 — 모두 360x430 상자 안에 그린다
 * ------------------------------------------------------------------ */

/** 신경망 — AI가 만든 코드와 개발자의 몫 */
function Nodes({ accent }: Shape) {
  const layers: Point[][] = [
    [
      { x: 20, y: 90 },
      { x: 20, y: 215 },
      { x: 20, y: 340 },
    ],
    [
      { x: 165, y: 30 },
      { x: 165, y: 150 },
      { x: 165, y: 270 },
      { x: 165, y: 390 },
    ],
    [
      { x: 310, y: 150 },
      { x: 310, y: 270 },
    ],
  ];
  const edges: { from: Point; to: Point }[] = [];
  for (let i = 0; i < layers.length - 1; i += 1) {
    for (const from of layers[i]) {
      for (const to of layers[i + 1]) edges.push({ from, to });
    }
  }
  return (
    <>
      {edges.map((e, i) => (
        <Line key={i} from={e.from} to={e.to} accent={accent} opacity={0.18} thickness={2} />
      ))}
      {layers.map((layer, li) =>
        layer.map((at, ni) => (
          <Dot key={`${li}-${ni}`} at={at} size={li === 2 ? 36 : 28} accent={accent} />
        ))
      )}
    </>
  );
}

/** 막대 점수 — 벤치마크 수치. 마지막 막대만 비워 "말해주지 않는 것"을 남긴다. */
function Bars({ accent }: Shape) {
  const bars = [
    { x: 45, h: 90, filled: true },
    { x: 125, h: 170, filled: true },
    { x: 205, h: 250, filled: true },
    { x: 285, h: 320, filled: false },
  ];
  return (
    <>
      {bars.map((b) => (
        <Box
          key={b.x}
          left={b.x}
          top={370 - b.h}
          width={54}
          height={b.h}
          accent={accent}
          radius={8}
          filled={b.filled}
          opacity={b.filled ? 0.85 : 1}
        />
      ))}
      <Box left={20} top={376} width={330} height={5} accent={accent} filled opacity={0.5} />
    </>
  );
}

/** 끈 묶은 소포 — npm 패키지 */
function Package({ accent }: Shape) {
  return (
    <>
      <Box left={55} top={110} width={250} height={210} accent={accent} radius={16} />
      <Box left={55} top={165} width={250} height={9} accent={accent} filled opacity={0.75} />
      <Box left={176} top={110} width={9} height={210} accent={accent} filled opacity={0.75} />
      <Dot at={{ x: 180, y: 169 }} size={36} accent={accent} />
    </>
  );
}

/** 검사 결과 — 린터가 훑은 코드 줄 */
function Lint({ accent }: Shape) {
  const rows = [
    { y: 120, w: 190, ok: true },
    { y: 215, w: 150, ok: false },
    { y: 310, w: 210, ok: true },
  ];
  return (
    <>
      {rows.map((r) => (
        <Box
          key={r.y}
          left={120}
          top={r.y - 9}
          width={r.w}
          height={18}
          accent={accent}
          radius={9}
          filled
          opacity={0.3}
        />
      ))}
      {rows.map((r) =>
        r.ok ? (
          <Check key={r.y} at={{ x: 65, y: r.y }} accent={accent} />
        ) : (
          <Cross key={r.y} at={{ x: 65, y: r.y }} accent={accent} />
        )
      )}
    </>
  );
}

/** 이사 — 왼쪽 상자에서 오른쪽 상자로 */
function Migrate({ accent }: Shape) {
  return (
    <>
      <Box left={15} top={160} width={115} height={115} accent={accent} radius={16} opacity={0.45} />
      <Box left={230} top={160} width={115} height={115} accent={accent} radius={16} />
      <Line from={{ x: 145, y: 217 }} to={{ x: 215, y: 217 }} accent={accent} opacity={0.9} thickness={9} radius={4} />
      <Line from={{ x: 196, y: 200 }} to={{ x: 216, y: 217 }} accent={accent} opacity={0.9} thickness={9} radius={4} />
      <Line from={{ x: 196, y: 234 }} to={{ x: 216, y: 217 }} accent={accent} opacity={0.9} thickness={9} radius={4} />
    </>
  );
}

/** 쌓인 층 — 떠 있지만 살아 있는 컴포넌트 */
function Layers({ accent }: Shape) {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <Box
          key={i}
          left={60}
          top={115 + i * 85}
          width={240}
          height={66}
          accent={accent}
          radius={12}
          opacity={1 - i * 0.3}
        />
      ))}
      <Line from={{ x: 180, y: 148 }} to={{ x: 180, y: 318 }} accent={accent} opacity={0.45} thickness={4} />
      <Dot at={{ x: 180, y: 148 }} size={32} accent={accent} filled />
    </>
  );
}

/** 시계 — 날짜와 시간 */
function Clock({ accent }: Shape) {
  return (
    <>
      <Dot at={{ x: 180, y: 215 }} size={270} accent={accent} border={5} />
      {[
        { x: 180, y: 100 },
        { x: 295, y: 215 },
        { x: 180, y: 330 },
        { x: 65, y: 215 },
      ].map((p) => (
        <Dot key={`${p.x}-${p.y}`} at={p} size={14} accent={accent} filled opacity={0.7} />
      ))}
      <Line from={{ x: 180, y: 215 }} to={{ x: 180, y: 135 }} accent={accent} opacity={1} thickness={11} radius={6} />
      <Line from={{ x: 180, y: 215 }} to={{ x: 255, y: 250 }} accent={accent} opacity={1} thickness={9} radius={5} />
      <Dot at={{ x: 180, y: 215 }} size={26} accent={accent} filled />
    </>
  );
}

/** 줄 단위 레코드 — 한 줄에 하나씩 */
function Rows({ accent }: Shape) {
  const rows = [
    { y: 110, w: 200 },
    { y: 180, w: 165 },
    { y: 250, w: 215 },
    { y: 320, w: 145 },
  ];
  return (
    <>
      {rows.map((r) => (
        <Box key={r.y} left={50} top={r.y - 15} width={30} height={30} accent={accent} radius={7} filled />
      ))}
      {rows.map((r) => (
        <Box
          key={`l${r.y}`}
          left={100}
          top={r.y - 10}
          width={r.w}
          height={20}
          accent={accent}
          radius={10}
          filled
          opacity={0.32}
        />
      ))}
    </>
  );
}

/** 키와 값 — Map의 짝 */
function KeyValue({ accent }: Shape) {
  const ys = [115, 210, 305];
  const pairing = [0, 2, 1];
  return (
    <>
      {ys.map((y, i) => (
        <Line
          key={`c${i}`}
          from={{ x: 118, y }}
          to={{ x: 242, y: ys[pairing[i]] }}
          accent={accent}
          opacity={0.4}
          thickness={4}
        />
      ))}
      {ys.map((y) => (
        <Box key={`k${y}`} left={35} top={y - 32} width={84} height={64} accent={accent} radius={12} />
      ))}
      {ys.map((y) => (
        <Box
          key={`v${y}`}
          left={241}
          top={y - 32}
          width={84}
          height={64}
          accent={accent}
          radius={12}
          filled
          opacity={0.75}
        />
      ))}
    </>
  );
}

/** 스위치 — 참과 거짓 */
function Toggle({ accent }: Shape) {
  return (
    <>
      <Box left={55} top={125} width={250} height={100} accent={accent} radius={50} />
      <Dot at={{ x: 252, y: 175 }} size={66} accent={accent} filled />
      <Box left={55} top={260} width={250} height={100} accent={accent} radius={50} opacity={0.4} />
      <Dot at={{ x: 108, y: 310 }} size={66} accent={accent} opacity={0.4} />
    </>
  );
}

/** 관문 — 가로채서 넘긴다 */
function Proxy({ accent }: Shape) {
  return (
    <>
      <Line from={{ x: 45, y: 215 }} to={{ x: 155, y: 215 }} accent={accent} opacity={0.45} thickness={5} />
      <Line from={{ x: 205, y: 215 }} to={{ x: 315, y: 215 }} accent={accent} opacity={0.45} thickness={5} />
      <Dot at={{ x: 42, y: 215 }} size={48} accent={accent} />
      <Dot at={{ x: 318, y: 215 }} size={48} accent={accent} filled />
      <Box left={152} top={95} width={56} height={240} accent={accent} radius={14} />
      <Box left={152} top={200} width={56} height={30} accent={accent} filled opacity={0.8} />
    </>
  );
}

/** 브라우저 창 — window 객체 */
function Window({ accent }: Shape) {
  return (
    <>
      <Box left={25} top={95} width={310} height={240} accent={accent} radius={16} />
      <Box left={25} top={150} width={310} height={4} accent={accent} filled opacity={0.7} />
      {[60, 94, 128].map((x) => (
        <Dot key={x} at={{ x, y: 123 }} size={17} accent={accent} filled />
      ))}
      {[190, 232, 274].map((y, i) => (
        <Box
          key={y}
          left={62}
          top={y}
          width={i === 2 ? 130 : 240 - i * 42}
          height={13}
          accent={accent}
          radius={7}
          filled
          opacity={0.3}
        />
      ))}
    </>
  );
}

/** 삼각 그래프 — 질의 그래프 */
function Graph({ accent }: Shape) {
  const center = { x: 180, y: 215 };
  const outer: Point[] = [
    { x: 180, y: 55 },
    { x: 318, y: 295 },
    { x: 42, y: 295 },
  ];
  return (
    <>
      {outer.map((p, i) => (
        <Line key={`o${i}`} from={p} to={outer[(i + 1) % 3]} accent={accent} opacity={0.3} thickness={3} />
      ))}
      {outer.map((p, i) => (
        <Line key={`c${i}`} from={center} to={p} accent={accent} opacity={0.5} thickness={3} />
      ))}
      {outer.map((p, i) => (
        <Dot key={`d${i}`} at={p} size={36} accent={accent} />
      ))}
      <Dot at={center} size={48} accent={accent} filled />
    </>
  );
}

/** 원통 더미 — 쌓아 둔 캐시 */
function Cache({ accent }: Shape) {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <Box
          key={i}
          left={60}
          top={115 + i * 78}
          width={240}
          height={72}
          accent={accent}
          radius={36}
          opacity={1 - i * 0.26}
        />
      ))}
      <Dot at={{ x: 180, y: 151 }} size={30} accent={accent} filled />
    </>
  );
}

/** 돌아가는 점 — 기다리는 중 */
function Spinner({ accent }: Shape) {
  const count = 8;
  return (
    <>
      {Array.from({ length: count }, (_, i) => {
        const angle = (i / count) * Math.PI * 2 - Math.PI / 2;
        return (
          <Dot
            key={i}
            at={{ x: 180 + Math.cos(angle) * 125, y: 215 + Math.sin(angle) * 125 }}
            size={36}
            accent={accent}
            filled
            opacity={1 - i * 0.1}
          />
        );
      })}
    </>
  );
}

/** 수직선 — 수와 눈금 */
function NumberLine({ accent }: Shape) {
  const ticks = [50, 120, 190, 260, 325];
  return (
    <>
      <Box left={25} top={212} width={315} height={6} accent={accent} filled opacity={0.5} />
      {ticks.map((x) => (
        <Box key={x} left={x} top={185} width={6} height={60} accent={accent} filled opacity={0.55} />
      ))}
      <Dot at={{ x: 193, y: 215 }} size={52} accent={accent} filled />
    </>
  );
}

/** 가둔 초점 — 테두리 안에 갇힌다 */
function Focus({ accent }: Shape) {
  return (
    <>
      <Box left={40} top={100} width={280} height={230} accent={accent} radius={18} />
      <Box left={80} top={140} width={200} height={150} accent={accent} radius={12} dashed opacity={0.7} />
      <Dot at={{ x: 180, y: 215 }} size={44} accent={accent} filled />
    </>
  );
}

/** 나중에 오는 조각 — 하나는 지금, 나머지는 필요할 때 */
function Lazy({ accent }: Shape) {
  return (
    <>
      <Box left={25} top={160} width={100} height={110} accent={accent} radius={14} />
      <Box left={135} top={160} width={100} height={110} accent={accent} radius={14} dashed opacity={0.6} />
      <Box left={245} top={160} width={100} height={110} accent={accent} radius={14} dashed opacity={0.3} />
    </>
  );
}

/** 치솟는 곡선 — 지수 표기 */
function Curve({ accent }: Shape) {
  const points = Array.from({ length: 9 }, (_, i) => {
    const t = i / 8;
    return { x: 55 + 275 * t, y: 330 - 235 * Math.pow(t, 2.2) };
  });
  return (
    <>
      <Box left={40} top={330} width={300} height={5} accent={accent} filled opacity={0.45} />
      <Box left={40} top={85} width={5} height={250} accent={accent} filled opacity={0.45} />
      {points.slice(0, -1).map((p, i) => (
        <Line key={`l${i}`} from={p} to={points[i + 1]} accent={accent} opacity={0.45} thickness={4} />
      ))}
      {points.map((p, i) => (
        <Dot key={i} at={p} size={20} accent={accent} filled opacity={0.5 + i * 0.06} />
      ))}
    </>
  );
}

/* ------------------------------------------------------------------ *
 * 글 -> 모티프
 * ------------------------------------------------------------------ */

type MotifName =
  | "nodes" | "bars" | "package" | "lint" | "migrate" | "layers" | "clock"
  | "rows" | "keyValue" | "toggle" | "proxy" | "window" | "graph" | "cache"
  | "spinner" | "numberLine" | "focus" | "lazy" | "curve";

const MOTIFS: Record<MotifName, (p: Shape) => React.ReactElement> = {
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
};

/** 모티프마다 다른 색. 같은 그림이 없으니 색도 겹치지 않게 둔다. */
const ACCENT: Record<MotifName, string> = {
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
  ["javascript", "rows"],
];

function motifOf(post: Post): MotifName {
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

/* ------------------------------------------------------------------ *
 * 카드
 * ------------------------------------------------------------------ */

/**
 * 번져 보이는 빛무리.
 *
 * satori는 filter: blur()를 지원하지 않는다. 대신 radial-gradient가 가장자리로
 * 갈수록 투명해지므로, 큰 원형 그라데이션 자체가 흐릿한 빛 역할을 한다.
 */
function Glow({
  accent,
  left,
  top,
  size,
  strength,
}: {
  accent: string;
  left: number;
  top: number;
  size: number;
  strength: string;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left: s(left),
        top: s(top),
        width: s(size),
        height: s(size),
        borderRadius: s(size),
        background: `radial-gradient(circle, ${accent}${strength} 0%, ${accent}00 70%)`,
      }}
    />
  );
}

function Thumbnail({ motif }: { motif: MotifName }) {
  const accent = ACCENT[motif];
  const Motif = MOTIFS[motif];

  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        background: BG_BASE,
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
      }}
    >
      {/* 뒤에 깔리는 빛. 큰 것 하나와 반대편의 작고 옅은 것 하나로 깊이를 만든다. */}
      <Glow accent={accent} left={180} top={-180} size={900} strength="2b" />
      <Glow accent={accent} left={720} top={330} size={620} strength="18" />

      {/* 유리 패널. 바탕보다 아주 조금 밝고 테두리는 흰빛이라 떠 보인다. */}
      <div
        style={{
          display: "flex",
          position: "absolute",
          left: s(PANEL_INSET),
          top: s(PANEL_INSET),
          width: s(BASE_WIDTH - PANEL_INSET * 2),
          height: s(BASE_HEIGHT - PANEL_INSET * 2),
          borderRadius: s(32),
          border: `${s(1)}px solid rgba(255,255,255,0.09)`,
          background:
            "linear-gradient(140deg, rgba(255,255,255,0.055) 0%, rgba(255,255,255,0.012) 100%)",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div style={{ display: "flex", position: "relative", width: m(360), height: m(430) }}>
          <Motif accent={accent} />
        </div>
      </div>
    </div>
  );
}

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
