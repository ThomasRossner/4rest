import { useLayoutEffect, type DependencyList, type RefObject } from 'react';

/**
 * Setzt --task-grid-row-height auf dem Scroll-Container, damit die Kategorie-Matrix
 * genau zwei sichtbare Zeilen im Viewport hat (2×2-Kacheln).
 */
export function useCategoryTaskGridRowHeight(
  scrollRef: RefObject<HTMLDivElement | null>,
  deps: DependencyList
): void {
  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const readGapPx = () => {
      const grid = el.querySelector<HTMLElement>('.tasks-category-matrix');
      if (grid) {
        const g = getComputedStyle(grid).gap;
        const parsed = parseFloat(g);
        if (Number.isFinite(parsed) && parsed > 0) return parsed;
      }
      const raw = getComputedStyle(document.documentElement).getPropertyValue('--spacing-md').trim();
      const fallback = parseFloat(raw);
      return Number.isFinite(fallback) && fallback > 0 ? fallback : 16;
    };

    const apply = () => {
      const run = () => {
        const h = el.clientHeight;
        if (h <= 0) return;
        const gap = readGapPx();
        const row = Math.max(88, (h - gap) / 2);
        el.style.setProperty('--task-grid-row-height', `${Math.floor(row)}px`);
      };
      requestAnimationFrame(() => requestAnimationFrame(run));
    };

    apply();
    const ro = new ResizeObserver(() => apply());
    ro.observe(el);
    window.addEventListener('orientationchange', apply);
    window.addEventListener('resize', apply);
    const t = window.setTimeout(apply, 150);
    return () => {
      ro.disconnect();
      window.removeEventListener('orientationchange', apply);
      window.removeEventListener('resize', apply);
      window.clearTimeout(t);
    };
  }, deps);
}
