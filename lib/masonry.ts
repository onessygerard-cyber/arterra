import type { CSSProperties } from 'react';

const ROW = 8;
const GAP = 56;

let observer: ResizeObserver | null = null;

function getObserver(): ResizeObserver | null {
  if (typeof ResizeObserver === 'undefined') return null;
  if (!observer) {
    observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const el = entry.target as HTMLElement;
        const span = Math.max(1, Math.ceil((el.offsetHeight + GAP) / ROW));
        el.style.gridRowEnd = `span ${span}`;
      }
    });
  }
  return observer;
}

export function masonryItemRef(el: HTMLElement | null): void | (() => void) {
  if (!el) return;
  const ro = getObserver();
  if (!ro) return;
  ro.observe(el);
  return () => ro.unobserve(el);
}

export function ratioStyle(width?: number | null, height?: number | null): CSSProperties {
  const ok = !!width && !!height && width > 0 && height > 0;
  const ratio = ok ? Math.min(2, Math.max(0.5, (width as number) / (height as number))) : 1;
  return { aspectRatio: String(ratio) };
}