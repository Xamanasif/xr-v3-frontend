/**
 * The owner's identifier rule for every reviewer page (RV-v1 HANDOFF "Internal technical
 * identifiers"; lead decision 4): no SUB-, UPD-, REQ-, ACC-, DTR- or SUP- reference in the page's
 * words, accessible names, dialogs, breadcrumbs, screen-reader words or prefilled text — the
 * references stay in addresses, keys and services. The named exceptions are text a person wrote,
 * quoted as written ("Correction UPD-0005.", the sample world's seeded correction reasons), and the
 * support report references of Help & support (XS). The reviewer screen groups' tests check every
 * drawn state with `internalReferencesIn`.
 */
export const INTERNAL_REFERENCE = /\b(?:REQ|ACC|UPD|DTR|SUP|SUB)-\d+/g;

/** The attributes that name or describe an element, or prefill what a person reads. */
const NAMING_ATTRIBUTES = [
  'aria-label',
  'aria-description',
  'aria-valuetext',
  'title',
  'alt',
  'placeholder',
  'value',
] as const;

/**
 * Every internal reference `root` shows — in its text (visually hidden text included), its naming
 * attributes and its form fields' values — after each `allowed` text (a person's own words, quoted
 * as written) is taken out. `[]` when there is none.
 */
export function internalReferencesIn(root: Element, allowed: readonly string[] = []): string[] {
  const strip = (text: string) =>
    allowed.reduce((rest, exception) => rest.split(exception).join(' '), text);
  const found: string[] = [];
  const scan = (where: string, text: string | null | undefined) => {
    for (const match of strip(text ?? '').matchAll(INTERNAL_REFERENCE)) {
      found.push(`${where}: ${match[0]}`);
    }
  };
  scan('text', root.textContent);
  for (const element of [root, ...root.querySelectorAll('*')]) {
    for (const name of NAMING_ATTRIBUTES) scan(name, element.getAttribute(name));
    if (
      element instanceof HTMLInputElement ||
      element instanceof HTMLTextAreaElement ||
      element instanceof HTMLSelectElement
    ) {
      scan('field', element.value);
    }
  }
  return found;
}
