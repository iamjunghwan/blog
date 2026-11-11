/**
 * 모티프를 감싸는 카드 — 바탕, 빛무리, 유리 패널.
 *
 * 그림이 무엇이든 카드는 같다. 글마다 달라지는 건 모티프와 그 색뿐이다.
 */

import { BASE_HEIGHT, BASE_WIDTH, BG_BASE, PANEL_INSET, m, s } from "./canvas";
import { ACCENT, MOTIFS } from "./registry";
import type { MotifName } from "./registry";

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

export function Thumbnail({ motif }: { motif: MotifName }) {
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
