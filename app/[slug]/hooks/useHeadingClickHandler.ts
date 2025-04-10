import { useEffect, useRef } from "react";
import { useScrollToRef } from "./useScrollToRef";

export const useHeadingClickHandler = (detailData: string) => {
  const refHtml = useRef<HTMLDivElement>(null);
  const { scrollToRef } = useScrollToRef();

  useEffect(
    function handleDataAndEventBinding() {
      if (detailData && refHtml.current) {
        const h2Elements = refHtml.current.querySelectorAll("h2");
        h2Elements.forEach((h2) => {
          h2.addEventListener("click", () => scrollToRef(h2.id));
        });
      }
      return () => {
        if (refHtml.current) {
          const h2Elements = refHtml.current.querySelectorAll("h2");
          h2Elements.forEach((h2) => {
            h2.removeEventListener("click", () => scrollToRef(h2.id));
          });
        }
      };
    },
    [detailData, scrollToRef]
  );

  return { refHtml };
};
