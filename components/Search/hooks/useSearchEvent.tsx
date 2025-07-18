import { useEffect } from "react";

const focusableSelectors = `
  a[href],
  input:not([disabled]),
  button:not([disabled]),
  [tabindex]:not([tabindex="-1"])
`;

const useSearchEvent = (
  open: boolean,
  modalContainerRef: React.RefObject<HTMLDivElement | null>,
  searchInputRef: React.RefObject<HTMLInputElement | null>,
  onClose: () => void
) => {
  useEffect(
    function eventSetByModalOpen() {
      const modalContainer = modalContainerRef.current;
      if (!modalContainer) return;

      if (searchInputRef.current !== null) {
        searchInputRef.current?.focus();
      }

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Tab") {
          const focusableElements = Array.from(
            modalContainer.querySelectorAll(focusableSelectors)
          );

          if (focusableElements.length === 0) return;

          const firstElement = focusableElements[0] as HTMLElement;
          const lastElement = focusableElements[
            focusableElements.length - 1
          ] as HTMLElement;
          const currentElement = document.activeElement;

          if (e.shiftKey) {
            if (currentElement === firstElement) {
              e.preventDefault();
              lastElement?.focus();
            }
          } else {
            if (currentElement === lastElement) {
              e.preventDefault();
              firstElement?.focus();
            }
          }
        } else if (e.key === "Escape") {
          e.preventDefault();
          onClose();
        }
      };

      if (open) {
        modalContainer.addEventListener("keydown", handleKeyDown);
      }

      return () => {
        modalContainer.removeEventListener("keydown", handleKeyDown);
      };
    },
    [open, onClose, modalContainerRef, searchInputRef]
  );
};
export default useSearchEvent;
