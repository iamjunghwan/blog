/****************************************
 *
 * useCoverflow : 캐러셀의 움직임 전부
 *
 * 카드가 어디에 있고, 어떻게 움직이고, 포인터·키보드·포커스에 어떻게 반응하는지.
 * JSX 는 모른다 — 돌려주는 ref 와 props 를 받아 붙이기만 하면 된다.
 *
 * 왜 떼었나: LatestCarousel 안에 섞여 있을 때는 "화면에 무엇이 그려지는가"와
 * "그것이 어떻게 움직이는가"를 한 파일에서 번갈아 읽어야 했다. 움직임 쪽이
 * 압도적으로 길고 까다로운데, 그 사이사이에 li 와 className 이 끼어 있었다.
 *
 * 산수는 여기에도 없다. app/lib/carousel/ 의 geometry.ts(카드 한 장의 3D 변환)와
 * drag.ts(손의 움직임 → 칸 수)에 있고, 거기서 테스트가 돈다.
 * 이 파일이 맡는 건 그 둘을 React 와 DOM 에 잇는 배선뿐이다.
 *
 ****************************************/

import { useCallback, useEffect, useRef, useState } from "react";
import type {
  CSSProperties,
  FocusEvent as ReactFocusEvent,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  PointerEvent as ReactPointerEvent,
  RefObject,
} from "react";
import {
  clamp,
  slideTransform,
  transformCss,
} from "@/app/lib/carousel/geometry";
import { dragPosition, isDrag, releaseTarget } from "@/app/lib/carousel/drag";

/**
 * 서버가 첫 HTML 을 그릴 때 쓰는 카드 폭. CSS --card-w 의 최대값과 같다.
 *
 * 서버는 CSS clamp() 가 실제로 얼마로 풀릴지 모른다. 그래서 이 값으로 그려 두고
 * 마운트 직후 실제 폭을 재어 다시 칠한다. 서버와 클라이언트의 첫 렌더가
 * 같은 값을 내야 hydration 경고가 나지 않으므로, 이 상수는 양쪽이 함께 쓴다.
 */
const BASE_CARD_WIDTH = 320;

export interface Coverflow {
  /** 화살표·점·aria 가 보는 정수 위치. 드래그 중에는 바뀌지 않는다. */
  current: number;
  /** 정수 칸으로 자리잡는다. 전환 애니메이션이 붙는다. */
  settle: (next: number) => void;
  /** 첫 렌더용 inline style. 서버와 클라이언트가 같은 값을 내야 한다. */
  initialStyle: (index: number) => CSSProperties;
  stageRef: RefObject<HTMLDivElement | null>;
  /** 카드 li 에 ref 를 붙인다. 드래그 중 이 DOM 노드에 직접 style 을 쓴다. */
  registerSlide: (index: number) => (el: HTMLLIElement | null) => void;
  /** 바깥 section 에 펼친다. 키보드·포커스·클릭을 받는다. */
  sectionProps: {
    onKeyDown: (e: ReactKeyboardEvent<HTMLElement>) => void;
    onFocusCapture: (e: ReactFocusEvent<HTMLElement>) => void;
    onClickCapture: (e: ReactMouseEvent<HTMLElement>) => void;
  };
  /** 스테이지 div 에 펼친다. 포인터를 받는다. */
  stageProps: {
    onPointerDown: (e: ReactPointerEvent<HTMLDivElement>) => void;
    onPointerMove: (e: ReactPointerEvent<HTMLDivElement>) => void;
    onPointerUp: () => void;
    onPointerCancel: () => void;
    onDragStart: (e: ReactMouseEvent<HTMLDivElement>) => void;
  };
}

export function useCoverflow(total: number): Coverflow {
  const stageRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLLIElement | null)[]>([]);
  /** 실수 위치. 드래그 중 매 프레임 바뀌므로 state 로 두지 않는다. */
  const posRef = useRef(0);
  const cardWidthRef = useRef(BASE_CARD_WIDTH);
  const [current, setCurrent] = useState(0);

  /**
   * 드래그 한 번 동안만 사는 값들. state 로 두면 pointermove 마다 리렌더가 난다.
   * moved 는 "이번 드래그에서 가장 멀리 움직인 거리"로, 손을 놓을 때
   * 클릭이었는지 드래그였는지 가른다.
   */
  const drag = useRef({
    active: false,
    startX: 0,
    startPos: 0,
    lastX: 0,
    lastT: 0,
    velocity: 0,
    moved: 0,
    captured: false,
  });

  /** posRef 를 읽어 카드들의 style 을 직접 쓴다. 리렌더 없음. */
  const paint = useCallback(() => {
    const width = cardWidthRef.current;
    slideRefs.current.forEach((el, i) => {
      if (!el) return;
      const t = slideTransform(i - posRef.current, width);
      el.style.transform = transformCss(t);
      el.style.opacity = String(t.opacity);
      el.style.zIndex = String(t.zIndex);
    });
  }, []);

  /**
   * Math.round 는 방어적이다 — 드래그가 끝날 때 넘어오는 값은 이미 정수지만,
   * 여기서 한 번 더 자르지 않으면 current 가 소수가 되어 점 다섯 개가 전부
   * 꺼진 상태가 될 수 있다.
   */
  const settle = useCallback(
    (next: number) => {
      posRef.current = clamp(Math.round(next), 0, total - 1);
      setCurrent(posRef.current);
      paint();
    },
    [paint, total],
  );

  // 실제 카드 폭을 재어 다시 칠한다. 창 크기가 바뀌면 다시 잰다.
  useEffect(() => {
    const measure = () => {
      const first = slideRefs.current[0];
      // offsetWidth 는 레이아웃 폭이라 transform(scale) 의 영향을 받지 않는다.
      if (first) cardWidthRef.current = first.offsetWidth;
      paint();
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [paint]);

  const initialStyle = (index: number): CSSProperties => {
    const t = slideTransform(index, BASE_CARD_WIDTH);
    return { transform: transformCss(t), opacity: t.opacity, zIndex: t.zIndex };
  };

  const registerSlide = (index: number) => (el: HTMLLIElement | null) => {
    slideRefs.current[index] = el;
  };

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    // 마우스는 왼쪽 버튼만. 터치·펜은 button 이 0 이라 그대로 통과한다.
    if (e.pointerType === "mouse" && e.button !== 0) return;

    drag.current = {
      active: true,
      startX: e.clientX,
      startPos: posRef.current,
      lastX: e.clientX,
      lastT: e.timeStamp,
      velocity: 0,
      moved: 0,
      captured: false,
    };
    stageRef.current?.classList.add("is-dragging");
    // Task 5: 여기서 자동 넘김을 잠시 멈춘다.
  };

  const handlePointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d.active) return;

    const dx = e.clientX - d.startX;
    d.moved = Math.max(d.moved, Math.abs(dx));

    /*
     * 포인터 붙잡기를 pointerdown 이 아니라 여기서 — 클릭 문턱을 넘은 뒤에 한다.
     * 스테이지 밖으로 나가도 move/up 을 계속 받으려면 캡처가 필요한데,
     * 누르자마자 잡으면 Chrome 이 뒤따라오는 click 의 target 을 스테이지로
     * 바꿔 버린다. 그러면 카드 링크가 영영 눌리지 않는다. 실측으로 잡았다 —
     * click 의 target 이 A 가 아니라 DIV.carousel-stage 로 찍혔다.
     *
     * 문턱을 넘은 뒤라면 어차피 그 click 은 드래그 꼬리라 막을 대상이다.
     */
    if (!d.captured && isDrag(d.moved)) {
      e.currentTarget.setPointerCapture(e.pointerId);
      d.captured = true;
    }

    posRef.current = dragPosition(d.startPos, dx, cardWidthRef.current, total);
    paint();

    const dt = e.timeStamp - d.lastT;
    if (dt > 0) {
      d.velocity = (e.clientX - d.lastX) / dt;
      d.lastX = e.clientX;
      d.lastT = e.timeStamp;
    }
  };

  const handlePointerUp = () => {
    const d = drag.current;
    if (!d.active) return;
    d.active = false;

    // settle 전에 꺼야 전환 애니메이션이 붙는다.
    stageRef.current?.classList.remove("is-dragging");
    // Task 5: 여기서 자동 넘김을 영구 정지시킨다 (isDrag(d.moved) 일 때).
    settle(releaseTarget(posRef.current, d.velocity, cardWidthRef.current));
  };

  /**
   * 카드 링크로 Tab 이 들어오면 그 카드를 가운데로 데려온다.
   *
   * :focus-visible 로 거르는 게 핵심이다. Chrome 은 마우스로 링크를 누를 때도
   * click 보다 먼저 포커스를 주는데, 그때 current 를 옮겨 버리면
   * handleClickCapture 가 "이미 가운데 카드"로 보고 클릭을 통과시킨다.
   * 옆 카드를 눌렀는데 글이 열린다. 이 동작은 키보드 사용자용이다.
   */
  const handleFocusCapture = (e: ReactFocusEvent<HTMLElement>) => {
    const target = e.target as HTMLElement;
    if (!target.matches(":focus-visible")) return;
    const index = slideIndexOf(target);
    if (index !== null && index !== current) settle(index);
  };

  /**
   * 옆 카드를 누르면 글로 가지 않고 가운데로 데려온다.
   * 그리고 드래그 끝에 따라오는 click 을 막는다 — 안 막으면 카드를 쓸어 넘긴
   * 손가락이 그대로 글을 연다.
   */
  const handleClickCapture = (e: ReactMouseEvent<HTMLElement>) => {
    if (isDrag(drag.current.moved)) {
      e.preventDefault();
      e.stopPropagation();
      drag.current.moved = 0;
      return;
    }

    const index = slideIndexOf(e.target as HTMLElement);
    if (index === null || index === current) return;
    e.preventDefault();
    settle(index);
  };

  const handleKeyDown = (e: ReactKeyboardEvent<HTMLElement>) => {
    // Alt+← 는 브라우저 뒤로 가기다. 수식 키가 눌린 조합은 넘기지 않는다.
    if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      settle(current - 1);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      settle(current + 1);
    }
  };

  return {
    current,
    settle,
    initialStyle,
    stageRef,
    registerSlide,
    sectionProps: {
      onKeyDown: handleKeyDown,
      onFocusCapture: handleFocusCapture,
      onClickCapture: handleClickCapture,
    },
    stageProps: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onPointerCancel: handlePointerUp,
      // 브라우저 기본 이미지·텍스트 드래그가 먼저 집어가지 못하게 한다.
      onDragStart: (e: ReactMouseEvent<HTMLDivElement>) => e.preventDefault(),
    },
  };
}

/** 이 DOM 노드가 몇 번째 카드 안에 있는지. 카드 밖이면 null. */
function slideIndexOf(el: HTMLElement): number | null {
  const slide = el.closest<HTMLElement>("[data-index]");
  if (!slide) return null;
  const index = Number(slide.dataset.index);
  return Number.isInteger(index) ? index : null;
}
