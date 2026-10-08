// Suppress only the ring produced by Escape restoration, never keyboard navigation.
export function mountFocusRestoration(root, signal) {
  let suppressed = null;
  const clear = () => {
    if (suppressed) delete suppressed.dataset.suppressFocusRing;
    suppressed = null;
  };
  const listen = (type, handler) => document.addEventListener(type, handler, { capture: true, signal });
  listen('keydown', event => {
    if (['Tab', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End', 'Enter', ' '].includes(event.key)) clear();
  });
  listen('pointerdown', clear);
  listen('mousedown', clear);
  listen('focusin', clear);
  listen('focusout', clear);
  signal.addEventListener('abort', clear, { once: true });
  return (element, fromEscape = false) => {
    if (!element?.isConnected || !root.contains(element)) return;
    clear();
    element.focus({ preventScroll: true });
    if (fromEscape) {
      element.dataset.suppressFocusRing = 'true';
      suppressed = element;
    }
  };
}
