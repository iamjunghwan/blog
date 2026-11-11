/**
 * 모든 모티프가 공유하는 그리기 조각 — 선·점·상자와 체크·가위표.
 *
 * 좌표는 360x430 모티프 상자 기준으로 적고, 환산은 여기서 m()으로 끝낸다.
 * 그래서 motifs.tsx 는 배율을 몰라도 된다.
 */

import { BG_CARD, m } from "./canvas";

/* ------------------------------------------------------------------ *
 * 그리기 primitive
 *
 * satori는 flex만 다루고 transformOrigin을 지원하지 않는다. 회전은 항상 요소
 * 중심을 축으로 일어나므로, 선은 두 점의 중점에 놓고 돌려야 양 끝이 맞는다.
 * ------------------------------------------------------------------ */

export type Point = { x: number; y: number };
export type Shape = { accent: string };

export function Line({
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

export function Dot({
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

export function Box({
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
export function Check({ at, accent, size = 34 }: { at: Point; accent: string; size?: number }) {
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
export function Cross({ at, accent, size = 30 }: { at: Point; accent: string; size?: number }) {
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
