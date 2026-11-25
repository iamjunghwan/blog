/**
 * 각주 말풍선의 자리를 정한다.
 *
 * 번호 위에 가운데를 맞춰 띄우고, 위 공간이 모자라면 아래로 내린다.
 * 좌우는 화면 밖으로 나가지 않게 여백 안으로 맞춘다 — 본문 끝에 붙은 번호가
 * 많아서 그대로 가운데를 맞추면 말풍선이 오른쪽으로 잘린다.
 *
 * 입력은 getBoundingClientRect 기준(화면 좌표)이고, 돌려주는 값은 문서 좌표다.
 * 말풍선을 position: absolute로 두면 스크롤해도 번호를 따라가 다시 계산할 일이 없다.
 */

export const TOOLTIP_GAP = 8;
export const TOOLTIP_MARGIN = 8;

type Rect = { left: number; top: number; width: number; height: number };
type Size = { width: number; height: number };
type Viewport = { width: number; height: number; scrollX: number; scrollY: number };

export type Placement = { left: number; top: number; side: "above" | "below" };

export function placeTooltip(anchor: Rect, tip: Size, viewport: Viewport): Placement {
  const fitsAbove = anchor.top - tip.height - TOOLTIP_GAP >= TOOLTIP_MARGIN;
  const side = fitsAbove ? "above" : "below";
  const top = fitsAbove
    ? anchor.top - tip.height - TOOLTIP_GAP
    : anchor.top + anchor.height + TOOLTIP_GAP;

  const centered = anchor.left + anchor.width / 2 - tip.width / 2;
  const maxLeft = viewport.width - tip.width - TOOLTIP_MARGIN;
  const left = Math.max(TOOLTIP_MARGIN, Math.min(centered, maxLeft));

  return { left: left + viewport.scrollX, top: top + viewport.scrollY, side };
}
