/** Zeichenobergrenze (ein … am Ende); passt typisch in ~3–4 Zeilen, max-height in CSS fängt Randfälle ab */
const TASK_TILE_PREVIEW_MAX_CHARS = 160;

function htmlDescriptionToPlain(text: string): string {
  if (typeof document !== 'undefined') {
    const div = document.createElement('div');
    div.innerHTML = text;
    const plain = (div.textContent || div.innerText || '')
      .replace(/\u00a0/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return plain;
  }
  return text
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Kürzt am Wortende; genau ein Unicode-Ellipsis am Schluss */
function truncatePreviewAtWordEnd(plain: string, maxLen: number): string {
  if (plain.length <= maxLen) return plain;
  const slice = plain.slice(0, maxLen);
  const lastSpace = slice.lastIndexOf(' ');
  const atWord =
    lastSpace > maxLen * 0.55 ? slice.slice(0, lastSpace).trimEnd() : slice.trimEnd();
  return `${atWord}\u2026`;
}

/** Kurztext für Aufgaben-Kacheln: HTML → Klartext, dann eine saubere Endkürzung */
export function descriptionPreviewPlain(text: string | null | undefined): string {
  if (!text || typeof text !== 'string') return '';
  const plain = htmlDescriptionToPlain(text);
  return truncatePreviewAtWordEnd(plain, TASK_TILE_PREVIEW_MAX_CHARS);
}
