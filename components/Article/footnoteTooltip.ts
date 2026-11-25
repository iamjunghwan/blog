/****************************************
 *
 * footnoteTooltip : 각주 번호 자리에서 각주 내용을 말풍선으로 보인다
 *
 * 번호를 누르면 글 아래 목록으로 내려가야 해서 읽던 흐름이 끊긴다.
 * 마우스를 올리거나 키보드로 번호에 가면 그 자리에서 내용을 띄운다.
 * 모바일에는 hover가 없으니 탭하면 이동하지 않고 연다. 마우스 클릭은
 * 지금처럼 목록으로 이동한다.
 *
 * 내용은 글 아래 목록의 li를 복제해 쓴다(되돌아가기 링크만 뺀다).
 * 목록은 그대로 둔다 — 낭독기, JS가 없는 환경, 인쇄에서는 그게 유일한 길이다.
 *
 * 말풍선은 하나를 만들어 돌려 쓴다. 본문 밖(body)에 두는 것은 본문의
 * prose 스타일과 overflow를 타지 않게 하려는 것이다.
 *
 ****************************************/
import { placeTooltip } from "@/app/lib/footnotes/placement";

const TOOLTIP_ID = "footnote-tooltip";
/** 번호에서 말풍선으로 마우스를 옮기는 사이에 닫히지 않게 기다리는 시간 */
const CLOSE_DELAY_MS = 150;

/** 본문의 각주 번호에 말풍선을 붙인다. 돌려받은 함수로 뗀다. */
export function attachFootnoteTooltips(container: HTMLElement): () => void {
  const refs = Array.from(container.querySelectorAll<HTMLAnchorElement>(".footnote-ref a"));
  if (refs.length === 0) {
    return () => {};
  }

  const tip = document.createElement("div");
  tip.id = TOOLTIP_ID;
  tip.className = "footnote-tooltip";
  tip.setAttribute("role", "tooltip");
  tip.hidden = true;
  document.body.append(tip);

  let current: HTMLAnchorElement | null = null;
  let closeTimer: number | undefined;

  const cancelClose = () => window.clearTimeout(closeTimer);

  const close = () => {
    cancelClose();
    if (current === null) {
      return;
    }
    tip.hidden = true;
    current.removeAttribute("aria-describedby");
    current = null;
  };

  const scheduleClose = () => {
    cancelClose();
    closeTimer = window.setTimeout(close, CLOSE_DELAY_MS);
  };

  const open = (ref: HTMLAnchorElement) => {
    cancelClose();
    if (current === ref) {
      return;
    }
    const item = document.getElementById(decodeURIComponent(ref.hash.slice(1)));
    if (item === null) {
      return;
    }

    const content = item.cloneNode(true) as HTMLElement;
    content.querySelectorAll(".footnote-backref").forEach((backref) => backref.remove());

    close();
    tip.replaceChildren(...Array.from(content.childNodes));
    // 크기를 재려면 먼저 보여야 한다. 왼쪽 위에 둔 채 재고 바로 옮긴다.
    tip.style.left = "0px";
    tip.style.top = "0px";
    tip.hidden = false;

    const place = placeTooltip(
      ref.getBoundingClientRect(),
      tip.getBoundingClientRect(),
      {
        width: document.documentElement.clientWidth,
        height: window.innerHeight,
        scrollX: window.scrollX,
        scrollY: window.scrollY,
      },
    );
    tip.style.left = `${place.left}px`;
    tip.style.top = `${place.top}px`;
    tip.dataset.side = place.side;

    ref.setAttribute("aria-describedby", TOOLTIP_ID);
    current = ref;
  };

  const cleanups: Array<() => void> = [];
  const listen = <K extends keyof HTMLElementEventMap>(
    target: HTMLElement | Document | Window,
    type: K,
    handler: (event: HTMLElementEventMap[K]) => void,
    options?: AddEventListenerOptions,
  ) => {
    target.addEventListener(type, handler as EventListener, options);
    cleanups.push(() => target.removeEventListener(type, handler as EventListener, options));
  };

  for (const ref of refs) {
    listen(ref, "pointerenter", (event) => {
      if (event.pointerType === "mouse") open(ref);
    });
    listen(ref, "pointerleave", (event) => {
      if (event.pointerType === "mouse") scheduleClose();
    });
    listen(ref, "focus", () => open(ref));
    listen(ref, "blur", scheduleClose);
    // 마우스 클릭과 키보드 Enter는 목록으로 이동한다. 탭(touch·pen)만 이동을 막고
    // 그 자리에서 연다. 입력 종류는 pointerdown에서 기억한다 — click 이벤트의
    // pointerType은 브라우저에 따라 비어 있다. Enter에는 pointerdown이 없다.
    let tapped = false;
    listen(ref, "pointerdown", (event) => {
      tapped = event.pointerType !== "mouse";
    });
    listen(ref, "click", (event) => {
      if (tapped) {
        event.preventDefault();
        open(ref);
      } else {
        close();
      }
      tapped = false;
    });
  }

  listen(tip, "pointerenter", cancelClose);
  listen(tip, "pointerleave", (event) => {
    if (event.pointerType === "mouse") scheduleClose();
  });
  listen(document, "keydown", (event) => {
    if (event.key === "Escape") close();
  });
  listen(
    document,
    "pointerdown",
    (event) => {
      const target = event.target as Node;
      if (!tip.contains(target) && !refs.some((ref) => ref.contains(target))) close();
    },
    { capture: true },
  );
  listen(window, "resize", close);

  return () => {
    cancelClose();
    cleanups.forEach((cleanup) => cleanup());
    tip.remove();
  };
}
