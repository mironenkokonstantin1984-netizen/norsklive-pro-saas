/**
 * Scrolls an element into view so it is not hidden under the sticky top bar or the fixed mic dock.
 *
 * `Element.scrollIntoView` with CSS `scroll-margin` is not enough here: in Chrome the margin is
 * ignored when the element sits in a non-scrolling `overflow: auto` block and the page itself is
 * what scrolls, so the reply or error card ends up under the dock. We compute the page offset
 * ourselves and fall back to `scrollIntoView` only when the element's own container scrolls.
 */

const GAP_PX = 8;

export type ClearBlock = 'start' | 'end' | 'nearest';

function scrollableAncestor(el: Element): HTMLElement | null {
  let node = el.parentElement;
  while (node && node !== document.body && node !== document.documentElement) {
    const overflowY = getComputedStyle(node).overflowY;
    if (
      (overflowY === 'auto' || overflowY === 'scroll') &&
      node.scrollHeight > node.clientHeight + 1
    ) {
      return node;
    }
    node = node.parentElement;
  }
  return null;
}

export function scrollIntoViewClear(
  el: Element,
  block: ClearBlock,
  behavior: ScrollBehavior,
  obstacles: { topSelector?: string; bottomSelector?: string } = {}
): void {
  if (typeof window === 'undefined') return;

  if (scrollableAncestor(el)) {
    if (typeof (el as HTMLElement).scrollIntoView === 'function') {
      (el as HTMLElement).scrollIntoView({ block, behavior });
    }
    return;
  }

  const top = obstacles.topSelector ? document.querySelector(obstacles.topSelector) : null;
  const bottom = obstacles.bottomSelector ? document.querySelector(obstacles.bottomSelector) : null;
  const visibleTop = Math.max(0, top ? top.getBoundingClientRect().bottom : 0) + GAP_PX;
  const visibleBottom =
    Math.min(window.innerHeight, bottom ? bottom.getBoundingClientRect().top : window.innerHeight) -
    GAP_PX;

  const rect = el.getBoundingClientRect();
  let delta = 0;
  if (block === 'start') {
    delta = rect.top - visibleTop;
  } else if (block === 'end') {
    delta = rect.bottom - visibleBottom;
  } else if (rect.bottom > visibleBottom) {
    // 'nearest': move the least, but never push the element's start above the visible area.
    delta = Math.min(rect.bottom - visibleBottom, rect.top - visibleTop);
  } else if (rect.top < visibleTop) {
    delta = rect.top - visibleTop;
  }

  if (Math.abs(delta) < 1) return;
  window.scrollTo({ top: window.scrollY + delta, behavior });
}
