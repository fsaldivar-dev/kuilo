import { useEffect, useRef } from "react";

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Traps keyboard focus inside a container element.
 * Restores focus to the previously focused element on unmount.
 * @param {React.RefObject} containerRef - ref to the trap container
 * @param {boolean} active - whether the trap is active
 */
export function useFocusTrap(containerRef, active = true) {
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (!active) return;

    previousFocusRef.current = document.activeElement;

    // Focus the first focusable element inside the container
    const container = containerRef.current;
    if (!container) return;

    const firstFocusable = container.querySelector(FOCUSABLE);
    if (firstFocusable) firstFocusable.focus();

    const handleKeyDown = (e) => {
      if (e.key !== "Tab") return;

      const focusable = [...container.querySelectorAll(FOCUSABLE)];
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    container.addEventListener("keydown", handleKeyDown);

    return () => {
      container.removeEventListener("keydown", handleKeyDown);
      if (previousFocusRef.current && typeof previousFocusRef.current.focus === "function") {
        previousFocusRef.current.focus();
      }
    };
  }, [containerRef, active]);
}
