/**
 * Zwei Buchstaben für Nutzer-Avatare: bei Vor- und Nachname jeweils Anfangsbuchstabe,
 * sonst die ersten zwei Zeichen des Namens; bei nur einem Zeichen wird es verdoppelt.
 */
export function getUserInitials(name: string | undefined | null): string {
  const n = (name ?? '').trim();
  if (!n) {
    return 'UU';
  }
  const parts = n.split(/\s+/);
  if (parts.length >= 2) {
    const a = parts[0][0] ?? '';
    const b = parts[parts.length - 1][0] ?? '';
    return (a + b).toUpperCase();
  }
  if (n.length >= 2) {
    return n.substring(0, 2).toUpperCase();
  }
  return (n[0] + n[0]).toUpperCase();
}
