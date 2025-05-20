"use client";

import { useEffect, useRef } from "react";

export default function ArticleContent({ content }: { content: string }) {
  const refHtml = useRef<HTMLDivElement>(null);

  const scrollToRef = (id: string): void => {
    const ref = document.getElementById(id);
    if (ref) {
      ref.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  };

  useEffect(() => {
    const container = refHtml.current;
    if (!container) return;

    const h2Elements = container.querySelectorAll("h2");
    const clickHandlers = Array.from(h2Elements).map((h2) => {
      const handler = () => scrollToRef(h2.id);
      h2.addEventListener("click", handler);
      return { element: h2, handler };
    });

    return () => {
      clickHandlers.forEach(({ element, handler }) => {
        element.removeEventListener("click", handler);
      });
    };
  }, [content]);

  return (
    <article className="font-body">
      <div ref={refHtml} dangerouslySetInnerHTML={{ __html: content }}></div>
    </article>
  );
}
