import { useCallback } from "react";

export const useScrollToRef = () => {
  const scrollToRef = useCallback((id: string): void => {
    const ref = document.getElementById(id);
    if (ref) {
      ref.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, []);

  return { scrollToRef };
};
