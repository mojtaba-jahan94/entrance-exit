import { useEffect, useRef } from 'react';

/**
 * Custom accessible focus trap hook without external dependencies.
 * - Saves the trigger element that opened the modal.
 * - Automatically moves focus to the first focusable element inside the modal upon opening.
 * - Traps Tab and Shift+Tab key navigation strictly within the modal container.
 * - Closes the modal on Escape key press.
 * - Restores focus back to the triggering element upon closing.
 */
export function useFocusTrap(isOpen: boolean, onClose: () => void) {
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Capture the element that was focused right before modal opened
    triggerElementRef.current = document.activeElement as HTMLElement | null;

    const container = containerRef.current;
    if (!container) return;

    // Selector matching all keyboard-focusable interactive elements
    const focusableSelector =
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    // Delay focus slightly so the DOM has mounted
    const focusTimer = setTimeout(() => {
      const focusableEls = container.querySelectorAll<HTMLElement>(focusableSelector);
      if (focusableEls.length > 0) {
        focusableEls[0].focus();
      }
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === 'Tab') {
        const focusableEls = Array.from(
          container.querySelectorAll<HTMLElement>(focusableSelector)
        ).filter((el) => el.offsetParent !== null || el === document.activeElement);

        if (focusableEls.length === 0) {
          e.preventDefault();
          return;
        }

        const firstEl = focusableEls[0];
        const lastEl = focusableEls[focusableEls.length - 1];

        if (e.shiftKey) {
          // Shift + Tab: if on first element, wrap to last
          if (document.activeElement === firstEl || !container.contains(document.activeElement)) {
            e.preventDefault();
            lastEl.focus();
          }
        } else {
          // Tab: if on last element, wrap to first
          if (document.activeElement === lastEl || !container.contains(document.activeElement)) {
            e.preventDefault();
            firstEl.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
      // Restore focus to trigger element on modal exit
      if (triggerElementRef.current && typeof triggerElementRef.current.focus === 'function') {
        triggerElementRef.current.focus();
      }
    };
  }, [isOpen, onClose]);

  return containerRef;
}
