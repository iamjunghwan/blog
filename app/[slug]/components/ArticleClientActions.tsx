"use client";
import { useEffect } from "react";

export default function ArticleClientActions() {
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
    const container = document.getElementById("article-content");
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
  }, []);

  return null;
}
