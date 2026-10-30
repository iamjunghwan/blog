/****************************************
 *
 * ArticleInteractions : 본문을 감싸고 제목 클릭을 받는다
 *
 * 전에는 형제 컴포넌트가 document.getElementById("article-content") 로 바깥에서
 * 본문을 찾아갔다. React 트리에 있는 요소를 전역 조회로 집는 것이라, 이름이
 * 바뀌면 조용히 끊기고 컴포넌트만 봐서는 무엇에 붙는지 알 수 없었다.
 * 자기가 그리는 div를 ref로 잡으면 그 연결이 코드에 드러난다.
 *
 * 본문은 children으로 받는다. 서버에서 그린 결과가 그대로 넘어오므로
 * 글 HTML이 클라이언트 페이로드에 실리지 않는다 — props로 넘기면 실린다.
 *
 * 안쪽 h2까지 ref로 잡을 수는 없다. 그 요소들은 마크다운에서 나온
 * dangerouslySetInnerHTML의 산물이라 React 트리에 없다. 붙일 ref가 없으니
 * 컨테이너 안에서 querySelectorAll로 찾는다 — 범위가 ref 안으로 한정된다.
 *
 ****************************************/
"use client";

import { useEffect, useRef } from "react";

export default function ArticleInteractions({
  children,
}: {
  children: React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (container === null) {
      return;
    }

    const headings = Array.from(container.querySelectorAll("h2"));
    const handlers = headings.map((heading) => {
      const handler = () => {
        document
          .getElementById(heading.id)
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      };
      heading.addEventListener("click", handler);
      return { heading, handler };
    });

    return () => {
      handlers.forEach(({ heading, handler }) => {
        heading.removeEventListener("click", handler);
      });
    };
  }, []);

  return (
    <div id="article-content" ref={containerRef}>
      {children}
    </div>
  );
}
