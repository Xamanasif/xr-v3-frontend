/**
 * The interim same-name check for institutions (owner decision DP-09, 5 Nov 2026; P1 register §A).
 * A public request names its institution in free text and carries no institution until it is
 * approved, so approving it would create a second record for an institution that already exists
 * (audit P0-5). Until a request can be matched to an existing institution (Q-A1, SEL-05), names are
 * compared exactly after normalising letter case, leading and trailing whitespace, repeated
 * internal whitespace and the equivalent Unicode dash characters, with any whitespace around a dash
 * ignored ("Pilani—Hyderabad" and "Pilani — Hyderabad" are the same name) — nothing else: no fuzzy
 * match, no e-mail match, and no record is ever merged.
 */
import type { InstitutionId } from '../kernel/ids.js';
import type { Institution } from './model.js';

/**
 * Hyphen-minus and the dash characters people type or paste in its place: hyphen, non-breaking
 * hyphen, figure dash, en dash, em dash, horizontal bar, minus sign, small em dash, small
 * hyphen-minus, full-width hyphen-minus.
 */
const DASH = '[\\u002D\\u2010\\u2011\\u2012\\u2013\\u2014\\u2015\\u2212\\uFE58\\uFE63\\uFF0D]';

/** One dash with any whitespace on either side: it becomes a bare hyphen-minus. */
const DASH_WITH_SPACES = new RegExp(`\\s*${DASH}\\s*`, 'g');

/** The comparison form of an institution name. */
export function institutionNameKey(name: string): string {
  return name.replace(DASH_WITH_SPACES, '-').replace(/\s+/g, ' ').trim().toLowerCase();
}

/** Do two institution names name the same institution under the interim rule? */
export function sameInstitutionName(a: string, b: string): boolean {
  return institutionNameKey(a) === institutionNameKey(b);
}

/** The existing institutions whose name is the same as `name`, in the order given. */
export function institutionsNamed<T extends Pick<Institution, 'id' | 'name'>>(
  name: string,
  institutions: readonly T[],
): readonly T[] {
  const key = institutionNameKey(name);
  return key === '' ? [] : institutions.filter((record) => institutionNameKey(record.name) === key);
}

/** Their ids, as a decision's input carries them. */
export function institutionIdsNamed(
  name: string,
  institutions: readonly Pick<Institution, 'id' | 'name'>[],
): readonly InstitutionId[] {
  return institutionsNamed(name, institutions).map((record) => record.id);
}
