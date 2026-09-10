/**
 * Technology availability of an Experiment — one enum, one label set (STK31-15).
 *
 * Order follows the FRD format order (1.2.1 Web · 1.2.2 VR · 1.2.3 MR · 1.2.4 AR).
 * MR is retained: an omission in a spoken list is not a decision (STK31-45).
 * Web is a HOSTED experience represented by a link; AR / VR / MR are authorised,
 * downloadable PACKAGES (STK31-37). The distribution MECHANISM is not selected
 * (PM-05 / QT-01 — docs/OPEN_DECISIONS.md A-03, A-04).
 *
 * Transcribed from the gold standard: js/data.js `TECHNOLOGIES`, `TECH_ORDER`, `sortTech`.
 */
export const TECHNOLOGIES = ['web', 'vr', 'mr', 'ar'] as const;

export type Technology = (typeof TECHNOLOGIES)[number];

export type DeliveryModel = 'hosted' | 'package';

export interface TechnologyMeta {
  readonly id: Technology;
  readonly label: string;
  readonly name: string;
  readonly delivery: DeliveryModel;
}

export const TECHNOLOGY_META: Readonly<Record<Technology, TechnologyMeta>> = {
  web: { id: 'web', label: 'Web', name: 'Web', delivery: 'hosted' },
  vr: { id: 'vr', label: 'VR', name: 'Virtual Reality', delivery: 'package' },
  mr: { id: 'mr', label: 'MR', name: 'Mixed Reality', delivery: 'package' },
  ar: { id: 'ar', label: 'AR', name: 'Augmented Reality', delivery: 'package' },
};

export function isTechnology(value: unknown): value is Technology {
  return typeof value === 'string' && (TECHNOLOGIES as readonly string[]).includes(value);
}

/** Sort technologies into the canonical display order, dropping duplicates. */
export function sortTechnologies(list: Iterable<Technology>): Technology[] {
  const unique = [...new Set(list)];
  return unique.sort((a, b) => TECHNOLOGIES.indexOf(a) - TECHNOLOGIES.indexOf(b));
}
