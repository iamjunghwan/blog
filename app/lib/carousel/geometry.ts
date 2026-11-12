/****************************************
 *
 * 코버플로우 카드 한 장의 3D 변환
 *
 * 중심에서 몇 장 떨어졌는지(offset)만 받아 그 카드가 어디에 어떻게 놓일지를 준다.
 * DOM도 React도 모른다 — 이 기능에서 유일하게 틀리기 쉬운 곳이 이 산수라서,
 * 테스트가 돌 수 있는 자리(app/lib)에 떼어 두었다.
 *
 * offset은 정수가 아니다. 드래그 중에는 1.37 같은 값이 들어오고, 그 중간값에서도
 * 수식이 매끄럽게 이어져야 카드가 손을 따라온다.
 *
 ****************************************/

/** 이만큼 떨어진 카드부터는 자리를 고정한다. 투명도만 계속 떨어진다. */
const MAX_OFFSET = 3;
/** scale이 과하게 작아지지 않도록 거리에 두는 상한. */
const MAX_SCALE_DISTANCE = 2.4;

export interface SlideTransform {
  /** 가로 이동 (px) */
  x: number;
  /** 깊이 (px). 음수가 뒤쪽이다 */
  z: number;
  /** Y축 회전 (deg) */
  rotateY: number;
  scale: number;
  opacity: number;
  zIndex: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * @param offset 중심에서 떨어진 칸 수. 오른쪽이 양수. 소수 가능
 * @param cardWidth 카드 한 장의 폭 (px)
 */
export function slideTransform(offset: number, cardWidth: number): SlideTransform {
  const capped = clamp(offset, -MAX_OFFSET, MAX_OFFSET);
  const cappedDistance = Math.abs(capped);
  // opacity만 자르지 않은 거리를 쓴다. 자리는 멈춰도 사라지기는 해야 한다.
  const distance = Math.abs(offset);

  return {
    x: capped * cardWidth * 0.6,
    // -x 가 아니라 0 - x 로 쓴다. x가 0일 때 -x는 -0을 내는데,
    // Object.is(-0, 0)이 false라 테스트와 비교가 어긋난다. 값은 같다.
    z: 0 - cappedDistance * 90,
    rotateY: 0 - capped * 36,
    scale: 1 - Math.min(cappedDistance, MAX_SCALE_DISTANCE) * 0.13,
    opacity: Math.max(0, 1 - distance * 0.28),
    zIndex: 100 - Math.round(distance * 10),
  };
}

/** style 속성에 넣을 transform 문자열. opacity와 zIndex는 따로 넣는다. */
export function transformCss(t: SlideTransform): string {
  return `translateX(${t.x}px) translateZ(${t.z}px) rotateY(${t.rotateY}deg) scale(${t.scale})`;
}
