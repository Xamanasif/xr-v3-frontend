/**
 * Technology availability of an Experiment — one enum (STK31-15).
 *
 * `TECHNOLOGIES` is the canonical identifier list in the FRD format order
 * (1.2.1 Web · 1.2.2 VR · 1.2.3 MR · 1.2.4 AR). It is data order, NOT display order:
 * screens present formats in `FORMAT_DISPLAY_ORDER` (WEB · AR · VR · MR, frozen v46).
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

/** The code shown on every format chip (v46 B8-03: "always the chip with the code next to words"). */
export type FormatCode = 'WEB' | 'AR' | 'VR' | 'MR';

/**
 * The v46 display order everywhere a list of formats is shown: WEB · AR · VR · MR
 * (design/handoff-v46 boards B8-03, 04, B1-06, B5-04). Identifiers are unchanged.
 */
export const FORMAT_DISPLAY_ORDER = [
  'web',
  'ar',
  'vr',
  'mr',
] as const satisfies readonly Technology[];

export interface FormatMeta {
  readonly id: Technology;
  /** Chip code. */
  readonly code: FormatCode;
  /** Words next to the chip code (B6-07 `fmtName`). */
  readonly name: string;
  /** Format checkbox label in the Vendor editor (B5-04). */
  readonly vendorLabel: string;
  /** "How it runs" sentence (B6-07 `fmtText`). */
  readonly howItRuns: string;
  readonly delivery: DeliveryModel;
}

/** The one format vocabulary for product copy, transcribed from the frozen v46 boards. */
export const FORMAT_META: Readonly<Record<Technology, FormatMeta>> = {
  web: {
    id: 'web',
    code: 'WEB',
    name: 'Browser',
    vendorLabel: 'Browser (WEB)',
    howItRuns: 'The experiment in a web browser, on a laptop or desktop.',
    delivery: 'hosted',
  },
  ar: {
    id: 'ar',
    code: 'AR',
    name: 'Augmented reality',
    vendorLabel: 'Augmented reality (AR)',
    howItRuns: 'The experiment overlaid on your surroundings, on a supported phone or tablet.',
    delivery: 'package',
  },
  vr: {
    id: 'vr',
    code: 'VR',
    name: 'Virtual reality',
    vendorLabel: 'Virtual reality (VR)',
    howItRuns: 'The experiment in a virtual lab, on a supported VR headset.',
    delivery: 'package',
  },
  mr: {
    id: 'mr',
    code: 'MR',
    name: 'Mixed reality',
    vendorLabel: 'Mixed reality (MR)',
    howItRuns:
      'The experiment combined with your real surroundings, on a supported mixed-reality device.',
    delivery: 'package',
  },
};

export function isTechnology(value: unknown): value is Technology {
  return typeof value === 'string' && (TECHNOLOGIES as readonly string[]).includes(value);
}

/** Put technologies into the v46 display order (WEB · AR · VR · MR), dropping duplicates. */
export function inDisplayOrder(list: Iterable<Technology>): Technology[] {
  const unique = [...new Set(list)];
  return unique.sort((a, b) => FORMAT_DISPLAY_ORDER.indexOf(a) - FORMAT_DISPLAY_ORDER.indexOf(b));
}

/**
 * Sort technologies into the canonical FRD data order (`TECHNOLOGIES`), dropping
 * duplicates. Not a UI order — screens use `inDisplayOrder`.
 */
export function sortTechnologies(list: Iterable<Technology>): Technology[] {
  const unique = [...new Set(list)];
  return unique.sort((a, b) => TECHNOLOGIES.indexOf(a) - TECHNOLOGIES.indexOf(b));
}
