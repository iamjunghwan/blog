/****************************************
 *
 * 드래그 산수
 *
 * 손이 움직인 거리와 속도를, 카드가 놓일 "칸 수"로 바꾼다.
 * DOM도 React도 포인터 이벤트도 모른다 — 들어오는 건 숫자뿐이다.
 *
 * geometry.ts 와 같은 이유로 app/lib 에 둔다. 이 기능에서 틀리기 쉬운 곳은
 * 이벤트 배선이 아니라 이 산수고, 여기 있어야 테스트가 돈다. 실제로
 * 튕김 수식의 단위가 어긋나 있던 걸 한참 뒤에야 브라우저 실측으로 잡았다.
 * 그 버그는 아래 테스트 한 줄로 잡혔을 것이다.
 *
 ****************************************/

import { clamp } from "@/app/lib/carousel/geometry";

/** 카드 한 장을 넘기는 데 필요한 드래그 거리 = 카드 폭 × 이 비율. */
export const DRAG_RATIO = 0.72;

/**
 * 튕김의 세기. 속도(px/ms)에 곱해 "손을 놓은 뒤 더 미끄러질 거리(px)"가 된다.
 *
 * 계획서의 FLICK_WEIGHT=1.8 을 이 값으로 대체했다. 1.8 은 px/ms 를 칸 수에서
 * 바로 빼는 식이라 단위가 맞지 않았다. 보통 손 속도(2px/ms)로 300px 을 끌면
 * 네 칸을 건너뛰었고, 카드 폭이 달라져도 튕김이 그대로였다.
 *
 * 이 값만 키우고 줄이면 튕김의 세기가 조절된다.
 */
export const FLICK_MS = 120;

/** 튕김 한 번으로 건너뛸 수 있는 최대 칸 수. 계획이 말한 "한 장 더"가 이것이다. */
export const FLICK_MAX_CARDS = 1;

/** 이보다 적게 움직였으면 드래그가 아니라 클릭이다. (px) */
export const CLICK_SLOP = 5;

/** 양 끝에서 더 끌리는 여유. 끝에 닿았다는 감각을 준다. (칸) */
export const OVERDRAG = 0.45;

/**
 * 드래그 중 손을 따라가는 실수 위치.
 *
 * @param startPos 누르기 시작한 순간의 위치 (칸, 소수 가능)
 * @param dx 그때부터 손이 가로로 움직인 거리 (px). 오른쪽이 양수
 * @param cardWidth 카드 한 장의 폭 (px)
 * @param total 카드 장수
 */
export function dragPosition(
  startPos: number,
  dx: number,
  cardWidth: number,
  total: number,
): number {
  // 손이 오른쪽으로 가면 카드는 왼쪽 것이 와야 하므로 뺀다.
  return clamp(
    startPos - dx / (cardWidth * DRAG_RATIO),
    0 - OVERDRAG,
    total - 1 + OVERDRAG,
  );
}

/**
 * 튕김이 더 밀어 주는 칸 수.
 *
 * 속도(px/ms) → 거리(px) → 칸 수 순서로 환산한다. 중간에 카드 폭으로 나누는
 * 단계가 빠지면 단위가 맞지 않아, 좁은 화면에서 훨씬 멀리 날아간다.
 *
 * @param velocity 손을 놓는 순간의 가로 속도 (px/ms). 오른쪽이 양수
 */
export function flickCards(velocity: number, cardWidth: number): number {
  return clamp(
    (velocity * FLICK_MS) / (cardWidth * DRAG_RATIO),
    0 - FLICK_MAX_CARDS,
    FLICK_MAX_CARDS,
  );
}

/** 손을 놓았을 때 안착할 정수 칸. */
export function releaseTarget(
  pos: number,
  velocity: number,
  cardWidth: number,
): number {
  return Math.round(pos - flickCards(velocity, cardWidth));
}

/**
 * 이번 포인터 조작이 클릭이 아니라 드래그였는가.
 * 드래그였다면 뒤따라오는 click 을 막아야 한다 — 안 막으면 카드를 쓸어 넘긴
 * 손가락이 그대로 글을 연다.
 *
 * @param moved 이번 조작에서 가장 멀리 움직인 거리 (px)
 */
export function isDrag(moved: number): boolean {
  return moved > CLICK_SLOP;
}
