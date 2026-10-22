/**
 * Scroll reveals (frozen `setupReveal`, 1190–1214): section heads and grids below the fold rise in
 * once (opacity, 28 px, 700 / 900 ms) when they enter the viewport; inside them the connectors
 * (`data-seq` x / y) draw, the markers (`m`) pop and the return connectors (`f`) fade, staggered by
 * list position. Nothing is hidden under reduced motion or without IntersectionObserver.
 *
 * The frozen frame was the observer's root; the product's is the viewport.
 */
export function setupReveal(root: HTMLElement, reduce: boolean): () => void {
  const els = Array.from(root.querySelectorAll<HTMLElement>('[data-reveal]'));
  const clear = (nodes: readonly HTMLElement[]) => {
    for (const n of nodes) {
      n.style.opacity = '';
      n.style.transform = '';
      n.style.transition = '';
    }
  };
  if (reduce || typeof IntersectionObserver === 'undefined') {
    clear([...els, ...Array.from(root.querySelectorAll<HTMLElement>('[data-seq]'))]);
    return () => undefined;
  }
  const bottom = window.innerHeight;
  const pending = els.filter((n) => n.getBoundingClientRect().top > bottom - 24);
  if (!pending.length) return () => undefined;
  for (const n of pending) {
    n.style.transition = 'none';
    n.style.opacity = '0';
    n.style.transform = 'translate3d(0,28px,0)';
    n.querySelectorAll<HTMLElement>('[data-seq]').forEach((d) => {
      const k = d.getAttribute('data-seq');
      d.style.transition = 'none';
      if (k === 'm') {
        d.style.opacity = '0';
        d.style.transform = 'scale(.5)';
      } else if (k === 'f') d.style.opacity = '0';
      else d.style.transform = k === 'y' ? 'scaleY(0)' : 'scaleX(0)';
    });
  }
  const reveal = (n: HTMLElement) => {
    n.style.transition =
      'opacity 700ms cubic-bezier(.2,.7,.2,1), transform 900ms cubic-bezier(.2,.7,.2,1)';
    n.style.opacity = '1';
    n.style.transform = 'translate3d(0,0,0)';
    n.querySelectorAll<HTMLElement>('[data-seq]').forEach((d) => {
      const kind = d.getAttribute('data-seq');
      const li = d.closest('li');
      const k = li?.parentNode ? Array.prototype.indexOf.call(li.parentNode.children, li) : 0;
      const t = 200 + Math.max(0, k) * 90;
      d.style.transition =
        kind === 'm'
          ? `opacity 420ms ease ${t}ms, transform 520ms cubic-bezier(.2,.7,.2,1) ${t}ms`
          : kind === 'f'
            ? `opacity 640ms ease ${t + 260}ms`
            : `transform 760ms cubic-bezier(.3,0,.15,1) ${t + 60}ms`;
      d.style.opacity = '1';
      d.style.transform = 'none';
    });
    observer.unobserve(n);
    waiting.delete(n);
  };
  const waiting = new Set(pending);
  const observer = new IntersectionObserver(
    (entries) => {
      for (const en of entries) if (en.isIntersecting) reveal(en.target as HTMLElement);
    },
    { root: null, threshold: 0.06 },
  );
  for (const n of pending) observer.observe(n);
  // Accessibility correction (adapter-only): a control that takes keyboard focus inside a part
  // still waiting for its reveal starts that reveal at once, so focus never lands on something
  // hidden for the frame before the observer reports it.
  const onFocus = (event: FocusEvent) => {
    const part = event.target instanceof Element ? event.target.closest('[data-reveal]') : null;
    if (part instanceof HTMLElement && waiting.has(part)) reveal(part);
  };
  root.addEventListener('focusin', onFocus);
  return () => {
    observer.disconnect();
    root.removeEventListener('focusin', onFocus);
  };
}
