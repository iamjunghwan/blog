/**
 * 글 대표 이미지(og:image) 생성기. next/og(satori)로 PNG를 만든다.
 * 한글 글리프가 필요해서 윈도우 기본 폰트 malgun.ttf를 읽는다.
 *
 *   pnpm thumbnail <출력경로.png> "<제목 윗줄>" "<제목 아랫줄>" "<부제>" [배율]
 *
 * 제목 아랫줄의 마지막 낱말은 액센트 색으로 칠한다.
 *
 * 레이아웃은 1200x630(OG 표준 1.91:1) 기준으로 적고, 배율만 곱해서 키운다.
 * 비율을 바꾸면 카카오톡·트위터가 카드를 잘라내므로 가로세로를 따로 늘리지 않는다.
 * 배율을 올리면 같은 그림이 고해상도로 나와 레티나 화면에서 또렷해진다.
 */
import { ImageResponse } from "next/og";
import fs from "node:fs";
import path from "node:path";

const BASE_WIDTH = 1200;
const BASE_HEIGHT = 630;
const DEFAULT_SCALE = 2;

const BG_DARK = "#0b1220";
const BG_CARD = "#111827";
const ACCENT = "#60a5fa";
const MUTED = "#9ca3af";

const regular = fs.readFileSync("C:/Windows/Fonts/malgun.ttf");
const bold = fs.readFileSync("C:/Windows/Fonts/malgunbd.ttf");

type Point = { x: number; y: number };

/** 신경망 느낌의 노드 그래프. satori는 flex만 다루므로 선은 회전시킨 div로 긋는다. */
const LAYERS: Point[][] = [
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

function edges(): { from: Point; to: Point }[] {
  const result: { from: Point; to: Point }[] = [];
  for (let i = 0; i < LAYERS.length - 1; i += 1) {
    for (const from of LAYERS[i]) {
      for (const to of LAYERS[i + 1]) {
        result.push({ from, to });
      }
    }
  }
  return result;
}

/** 1200x630 기준으로 적은 치수를 실제 출력 크기로 환산한다. */
type Scale = (value: number) => number;

function Line({ from, to, s }: { from: Point; to: Point; s: Scale }) {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

  // satori는 transformOrigin을 지원하지 않고 항상 요소 중심을 축으로 회전시킨다.
  // 그래서 선을 두 점의 중점에 놓고 회전시켜야 양 끝이 노드에 닿는다.
  const thickness = 2;

  return (
    <div
      style={{
        position: "absolute",
        left: s((from.x + to.x) / 2 - length / 2),
        top: s((from.y + to.y) / 2 - thickness / 2),
        width: s(length),
        height: s(thickness),
        background: ACCENT,
        // 가까운 연결일수록 진하게 — 전부 같은 농도면 그물처럼 뭉개진다.
        opacity: 0.1 + 0.14 * (1 - Math.min(Math.abs(dy) / 260, 1)),
        transform: `rotate(${angle}deg)`,
      }}
    />
  );
}

function Node({ at, size, s }: { at: Point; size: number; s: Scale }) {
  return (
    <div
      style={{
        position: "absolute",
        left: s(at.x - size / 2),
        top: s(at.y - size / 2),
        width: s(size),
        height: s(size),
        borderRadius: s(size),
        background: BG_CARD,
        border: `${s(3)}px solid ${ACCENT}`,
        boxShadow: `0 0 ${s(22)}px ${ACCENT}55`,
      }}
    />
  );
}

type Text = { top: string; bottom: string; subtitle: string };

function Thumbnail({ text, s }: { text: Text; s: Scale }) {
  // 아랫줄은 마지막 낱말만 액센트 색으로 뽑는다.
  const parts = text.bottom.split(" ");
  const bottomHead = parts.slice(0, -1).join(" ");
  const bottomTail = parts[parts.length - 1];

  return (
    <div
      style={{
        display: "flex",
        width: "100%",
        height: "100%",
        background: `linear-gradient(135deg, ${BG_DARK} 0%, ${BG_CARD} 55%, #0b1220 100%)`,
        padding: s(72),
        alignItems: "center",
        position: "relative",
      }}
    >
      {/* 왼쪽 위 액센트 획 */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: s(10),
          height: s(BASE_HEIGHT),
          background: `linear-gradient(180deg, ${ACCENT} 0%, ${ACCENT}00 70%)`,
        }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          paddingRight: s(40),
        }}
      >
        <div
          style={{
            display: "flex",
            fontSize: s(25),
            color: MUTED,
            letterSpacing: s(3),
            marginBottom: s(26),
          }}
        >
          iaman.kr
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            fontSize: s(68),
            fontWeight: 700,
            color: "#f3f4f6",
            lineHeight: 1.28,
          }}
        >
          <div style={{ display: "flex" }}>{text.top}</div>
          <div style={{ display: "flex" }}>
            {bottomHead}&nbsp;<span style={{ color: ACCENT }}>{bottomTail}</span>
          </div>
        </div>

        <div
          style={{
            display: "flex",
            width: s(96),
            height: s(5),
            background: ACCENT,
            marginTop: s(34),
            marginBottom: s(30),
          }}
        />

        <div style={{ display: "flex", fontSize: s(29), color: MUTED }}>
          {text.subtitle}
        </div>
      </div>

      {/* 오른쪽 노드 그래프 */}
      <div
        style={{
          display: "flex",
          position: "relative",
          width: s(360),
          height: s(430),
        }}
      >
        {edges().map((edge, i) => (
          <Line key={`e${i}`} from={edge.from} to={edge.to} s={s} />
        ))}
        {LAYERS.map((layer, li) =>
          layer.map((at, ni) => (
            <Node key={`n${li}-${ni}`} at={at} size={li === 2 ? 34 : 26} s={s} />
          ))
        )}
      </div>
    </div>
  );
}

async function main() {
  const [out, top, bottom, subtitle, rawScale] = process.argv.slice(2);
  if (!out || !top || !bottom || !subtitle) {
    console.error(
      '사용법: pnpm thumbnail <출력경로.png> "<제목 윗줄>" "<제목 아랫줄>" "<부제>" [배율]'
    );
    process.exit(1);
  }

  const scale = rawScale === undefined ? DEFAULT_SCALE : Number(rawScale);
  if (!Number.isFinite(scale) || scale <= 0) {
    console.error(`배율이 잘못됐다: ${rawScale}`);
    process.exit(1);
  }

  const s: Scale = (value) => Math.round(value * scale);
  const width = s(BASE_WIDTH);
  const height = s(BASE_HEIGHT);

  const image = new ImageResponse(<Thumbnail text={{ top, bottom, subtitle }} s={s} />, {
    width,
    height,
    fonts: [
      { name: "Malgun", data: regular, weight: 400, style: "normal" },
      { name: "Malgun", data: bold, weight: 700, style: "normal" },
    ],
  });

  const buffer = Buffer.from(await image.arrayBuffer());
  fs.mkdirSync(path.dirname(out), { recursive: true });
  fs.writeFileSync(out, buffer);
  console.log(
    `${out} — ${width}x${height}, ${(buffer.length / 1024).toFixed(0)}KB (배율 ${scale})`
  );
}

main().catch((error) => {
  console.error("실패:", error.message);
  process.exit(1);
});
