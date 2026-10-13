/**
 * A person's avatar initials as the boards draw them (board 05 `initials`: "Rahul Verma" → RV,
 * "Dr S. Ranganathan" → SR, "Prof. A. Menon" → AM). The circle is decorative (`aria-hidden`); the
 * account button carries the full name. A title before the name is not an initial.
 */
const TITLES: ReadonlySet<string> = new Set(['dr', 'prof', 'mr', 'mrs', 'ms']);

export function initialsOf(displayName: string): string {
  const words = displayName
    .split(/\s+/)
    .map((word) => word.replace(/[^\p{L}]/gu, ''))
    .filter((word) => word.length > 0);
  const named = words.length > 1 && TITLES.has(words[0]!.toLowerCase()) ? words.slice(1) : words;
  if (named.length === 0) return '';
  const first = named[0]!.charAt(0);
  const last = named.length > 1 ? named[named.length - 1]!.charAt(0) : '';
  return `${first}${last}`.toLocaleUpperCase('en');
}
