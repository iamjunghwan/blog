/**
 * 글마다 다른 그림. 모두 360x430 상자 안에 그린다.
 *
 * 새 모티프를 그렸으면 registry.ts 에 네 줄을 더해야 한다 —
 * 이름(MotifName), 함수(MOTIFS), 색(ACCENT), 그리고 어느 글이 쓸지(MOTIF_BY_SLUG).
 *
 * 상자를 벗어난 좌표는 잘리지는 않지만 그림이 가운데에서 밀린다.
 */

import { Box, Check, Cross, Dot, Line } from "./primitives";
import type { Point, Shape } from "./primitives";

/* ------------------------------------------------------------------ *
 * 모티프 — 모두 360x430 상자 안에 그린다
 * ------------------------------------------------------------------ */

/** 신경망 — AI가 만든 코드와 개발자의 몫 */
export function Nodes({ accent }: Shape) {
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

/**
 * 하나가 끌고 오는 여럿 — 전이 의존성.
 *
 * Nodes는 층끼리 그물처럼 얽히지만 이쪽은 위에서 아래로 갈라지기만 한다.
 * 뿌리 하나가 아래로 갈수록 불어나는 모양이다.
 */
export function Deps({ accent }: Shape) {
  const root: Point = { x: 200, y: 60 };
  const mid: Point[] = [
    { x: 95, y: 200 },
    { x: 200, y: 200 },
    { x: 305, y: 200 },
  ];
  const leaf: Point[] = [40, 105, 170, 235, 300, 360].map((x) => ({ x, y: 340 }));

  return (
    <>
      {mid.map((to, i) => (
        <Line key={`a${i}`} from={root} to={to} accent={accent} opacity={0.26} thickness={3} />
      ))}
      {leaf.map((to, i) => (
        <Line
          key={`b${i}`}
          from={mid[Math.min(Math.floor(i / 2), mid.length - 1)]}
          to={to}
          accent={accent}
          opacity={0.14}
          thickness={2}
        />
      ))}
      <Dot at={root} size={40} accent={accent} filled />
      {mid.map((at, i) => (
        <Dot key={`m${i}`} at={at} size={26} accent={accent} />
      ))}
      {leaf.map((at, i) => (
        <Dot key={`l${i}`} at={at} size={15} accent={accent} filled opacity={0.45} />
      ))}
    </>
  );
}

/**
 * 파일 격자 — 증분 타입 검사.
 *
 * 고친 파일 하나가 꽉 차 있고, 의존 그래프를 타고 닿은 몇 개만 옅게 켜진다.
 * 나머지는 윤곽만 남겨 "이번에 건너뛴 것"을 보여준다. 켜진 칸보다 꺼진 칸이
 * 훨씬 많아야 그림이 말이 된다 — 그게 증분 검사가 버는 것이다.
 */
export function Recheck({ accent }: Shape) {
  // 모티프 캔버스는 360x430이다. 6칸이 가로 360에 들어가도록 잡고 남는 만큼
  // 상하좌우를 똑같이 띄운다. 넘치면 잘리지는 않지만 그림이 가운데에서 밀린다.
  const COLS = 6;
  const ROWS = 6;
  const CELL = 42;
  const GAP = 18;
  const STEP = CELL + GAP;
  const SPAN = COLS * CELL + (COLS - 1) * GAP; // 342
  const ORIGIN_X = (360 - SPAN) / 2;
  const ORIGIN_Y = (430 - SPAN) / 2;

  const at = (col: number, row: number) => ({
    left: ORIGIN_X + col * STEP,
    top: ORIGIN_Y + row * STEP,
  });
  const center = (col: number, row: number): Point => ({
    x: ORIGIN_X + col * STEP + CELL / 2,
    y: ORIGIN_Y + row * STEP + CELL / 2,
  });

  /** 고친 파일. */
  const changed: [col: number, row: number] = [1, 1];
  /** 그 파일을 쓰고 있어 같이 다시 검사된 파일. */
  const rechecked: [col: number, row: number][] = [
    [3, 1],
    [1, 3],
    [4, 3],
    [2, 4],
  ];

  const lit = (col: number, row: number) =>
    (col === changed[0] && row === changed[1]) ||
    rechecked.some(([c, r]) => c === col && r === row);

  const skipped: [number, number][] = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (!lit(col, row)) {
        skipped.push([col, row]);
      }
    }
  }

  return (
    <>
      {skipped.map(([col, row]) => (
        <Box
          key={`skip-${col}-${row}`}
          {...at(col, row)}
          width={CELL}
          height={CELL}
          accent={accent}
          radius={10}
          border={3}
          opacity={0.13}
        />
      ))}
      {rechecked.map(([col, row]) => (
        <Line
          key={`edge-${col}-${row}`}
          from={center(changed[0], changed[1])}
          to={center(col, row)}
          accent={accent}
          opacity={0.22}
          thickness={3}
        />
      ))}
      {rechecked.map(([col, row]) => (
        <Box
          key={`hit-${col}-${row}`}
          {...at(col, row)}
          width={CELL}
          height={CELL}
          accent={accent}
          radius={10}
          filled
          opacity={0.5}
        />
      ))}
      <Box
        {...at(changed[0], changed[1])}
        width={CELL}
        height={CELL}
        accent={accent}
        radius={10}
        filled
      />
    </>
  );
}

/** 막대 점수 — 벤치마크 수치. 마지막 막대만 비워 "말해주지 않는 것"을 남긴다. */
export function Bars({ accent }: Shape) {
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
export function Package({ accent }: Shape) {
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
export function Lint({ accent }: Shape) {
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
export function Migrate({ accent }: Shape) {
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
export function Layers({ accent }: Shape) {
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
export function Clock({ accent }: Shape) {
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
export function Rows({ accent }: Shape) {
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

/**
 * 표시가 붙은 문서 — 마크다운
 *
 * Rows와 헷갈리지 않게 가른다. Rows는 같은 크기 네 줄이고, 이쪽은
 * 맨 위 제목 줄이 두껍고 아래 본문 줄은 폭이 들쭉날쭉하다.
 * 왼쪽의 작은 사각형들이 ## 과 - 같은 구조 표시에 해당한다.
 */
export function Markup({ accent }: Shape) {
  const body = [
    { y: 205, w: 210 },
    { y: 262, w: 170 },
    { y: 319, w: 195 },
  ];

  return (
    <>
      {/* ## — 제목 앞의 표시 두 개 */}
      <Box left={48} top={110} width={22} height={22} accent={accent} radius={5} filled />
      <Box left={78} top={110} width={22} height={22} accent={accent} radius={5} filled />
      {/* 제목 줄 — 두껍다 */}
      <Box left={118} top={104} width={190} height={34} accent={accent} radius={9} filled opacity={0.9} />

      {/* - 로 시작하는 본문 줄 — 폭이 제각각이다 */}
      {body.map((row) => (
        <Box
          key={row.y}
          left={48}
          top={row.y + 6}
          width={22}
          height={10}
          accent={accent}
          radius={5}
          filled
          opacity={0.75}
        />
      ))}
      {body.map((row) => (
        <Box
          key={`t${row.y}`}
          left={88}
          top={row.y}
          width={row.w}
          height={22}
          accent={accent}
          radius={11}
          filled
          opacity={0.3}
        />
      ))}

      {/* ** ** — 가운데 줄 한 조각만 강조돼 있다 */}
      <Box left={138} top={262} width={64} height={22} accent={accent} radius={11} filled opacity={0.85} />
    </>
  );
}

/** 키와 값 — Map의 짝 */
export function KeyValue({ accent }: Shape) {
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
export function Toggle({ accent }: Shape) {
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
export function Proxy({ accent }: Shape) {
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
export function Window({ accent }: Shape) {
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
export function Graph({ accent }: Shape) {
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
export function Cache({ accent }: Shape) {
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
export function Spinner({ accent }: Shape) {
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
export function NumberLine({ accent }: Shape) {
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
export function Focus({ accent }: Shape) {
  return (
    <>
      <Box left={40} top={100} width={280} height={230} accent={accent} radius={18} />
      <Box left={80} top={140} width={200} height={150} accent={accent} radius={12} dashed opacity={0.7} />
      <Dot at={{ x: 180, y: 215 }} size={44} accent={accent} filled />
    </>
  );
}

/** 나중에 오는 조각 — 하나는 지금, 나머지는 필요할 때 */
export function Lazy({ accent }: Shape) {
  return (
    <>
      <Box left={25} top={160} width={100} height={110} accent={accent} radius={14} />
      <Box left={135} top={160} width={100} height={110} accent={accent} radius={14} dashed opacity={0.6} />
      <Box left={245} top={160} width={100} height={110} accent={accent} radius={14} dashed opacity={0.3} />
    </>
  );
}

/** 치솟는 곡선 — 지수 표기 */
export function Curve({ accent }: Shape) {
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

export function Brick({ accent }: Shape) {
  // "Flexbox만 된다"가 무슨 뜻인지 그린다. flex-wrap으로 줄을 바꾸면 각 줄이
  // 따로 공간을 나눠 가지므로, 폭이 제각각인 아이템은 줄끼리 열이 어긋난다.
  // 점선은 Grid였다면 생겼을 열 경계고, 벽돌의 모서리는 거기에 닿지 않는다.
  //
  // 모티프 캔버스는 360x430이다. 가로 300을 쓰고 남는 60을 양쪽에 30씩 둔다.
  const SPAN = 300;
  const ORIGIN_X = (360 - SPAN) / 2; // 30
  const BRICK_H = 48;
  const ROW_GAP = 24;
  const ITEM_GAP = 10;
  const COLS = 3;

  /** 줄마다 다른 폭. 세 개의 합은 280으로 같고, 나뉘는 지점만 다르다. */
  const ROWS: number[][] = [
    [70, 135, 75],
    [125, 95, 60],
    [75, 90, 115],
    [50, 160, 70],
  ];

  const stackH = ROWS.length * BRICK_H + (ROWS.length - 1) * ROW_GAP; // 264
  const ORIGIN_Y = (430 - stackH) / 2; // 83

  // Grid였다면 생겼을 열 경계. 300을 3등분하므로 100마다 선이 선다.
  const GUIDE_TOP = ORIGIN_Y - 18;
  const GUIDE_BOTTOM = ORIGIN_Y + stackH + 18;
  const DASH = 10;
  const DASH_GAP = 8;

  const guides: { x: number; y: number }[] = [];
  for (let col = 0; col <= COLS; col++) {
    const x = ORIGIN_X + (col * SPAN) / COLS;
    for (let y = GUIDE_TOP; y + DASH <= GUIDE_BOTTOM; y += DASH + DASH_GAP) {
      guides.push({ x, y });
    }
  }

  const bricks: { left: number; top: number; width: number; dim: number }[] = [];
  ROWS.forEach((widths, row) => {
    let left = ORIGIN_X;
    widths.forEach((width, col) => {
      bricks.push({
        left,
        top: ORIGIN_Y + row * (BRICK_H + ROW_GAP),
        width,
        // 같은 줄 안에서도 조금씩 다르게 — 한 덩어리로 뭉쳐 보이지 않게.
        dim: 0.34 + ((row + col) % 3) * 0.09,
      });
      left += width + ITEM_GAP;
    });
  });

  return (
    <>
      {guides.map(({ x, y }, i) => (
        <Line
          key={`guide-${i}`}
          from={{ x, y }}
          to={{ x, y: y + DASH }}
          accent={accent}
          opacity={0.22}
          thickness={2}
        />
      ))}
      {bricks.map(({ left, top, width, dim }, i) => (
        <Box
          key={`brick-${i}`}
          left={left}
          top={top}
          width={width}
          height={BRICK_H}
          accent={accent}
          radius={8}
          opacity={dim}
          filled
        />
      ))}
    </>
  );
}
