import { expect, test as base, type Locator, type Page, type TestInfo } from '@playwright/test';

import {
  captureFixtures,
  compareAll,
  retiredComparisons,
} from '../../../../tools/board-capture/src/parity.mjs';

/** What the board-capture harness records about a board it opened (`openBoard`). */
export interface BoardFacts {
  readonly title: string;
  readonly markersInText: number;
  readonly markersInAttributes: number;
  readonly publicSansReady: boolean;
  readonly publicSansLoadedFaces: number;
  readonly publicSansFailedFaces: number;
  readonly errors: readonly string[];
}

/** The capture network's ledger: localhost requests, vendored responses, blocked requests, fonts. */
export interface NetworkLedger {
  readonly local: number;
  readonly served: readonly string[];
  readonly blocked: readonly string[];
  /** Every font file requested (only the vendored woff2 files are accepted). */
  readonly fonts: readonly string[];
}

export interface BoardOptions {
  readonly viewport?: { readonly width: number; readonly height: number };
  /** Canvas props applied through the runtime (board 05's role, banner). */
  readonly props?: Readonly<Record<string, unknown>>;
  /** Harness-only CSS for the cropped Batch 1–3 frames (START-HERE exception 3). */
  readonly uncrop?: boolean;
  /** Harness-only: the canvas frame `min-height` replaced by the 900-px capture height. */
  readonly frameMinHeight?: number;
}

/** One comparison for `compareAll` (tools/board-capture/src/parity.mjs). */
export interface CompareItem {
  /** `<board>-<what>`: the artefact name of the reference and product captures. */
  readonly name: string;
  readonly reference: Locator;
  readonly product: Locator;
  /** Room around the element's box (a focus ring is drawn outside it). */
  readonly margin?: number;
  /** Crop this many pixels off the left and right (a frame border drawn under a fixed drawer). */
  readonly insetX?: number;
  /** Give the harness box the drawn element's width (block components fill it). */
  readonly matchWidth?: boolean;
  /** Give the harness box the width of another drawn element (a part compared inside a whole). */
  readonly widthFrom?: Locator;
  /** Give the harness box the content width of the drawn element's parent (inline words wrap there). */
  readonly containerWidth?: boolean;
  /** Override the call's tolerance kind for this item ('specimen' is the strict one). */
  readonly kind?: 'specimen' | 'screen';
  /** A whole frame: the only comparison the screen tolerance may be used for. */
  readonly frame?: boolean;
  /** An expected-deviation register id (tools/board-capture/src/deviations.mjs). */
  readonly deviation?: string | readonly string[];
  /** Dynamic regions only (generated references, times), each with its reason. */
  readonly masks?: {
    readonly reference: readonly Locator[];
    readonly product: readonly Locator[];
    readonly reasons: readonly string[];
  };
  readonly before?: {
    readonly reference?: () => Promise<unknown>;
    readonly product?: () => Promise<unknown>;
  };
  readonly after?: {
    readonly reference?: () => Promise<unknown>;
    readonly product?: () => Promise<unknown>;
  };
}

export interface CaptureFixtures {
  readonly network: NetworkLedger;
  readonly openBoardPage: (
    file: string,
    options?: BoardOptions,
  ) => Promise<{ page: Page; facts: BoardFacts; ledger: NetworkLedger }>;
}

/**
 * The parity suite's `test`: the product page on the capture network (localhost plus the vendored,
 * integrity-checked inputs; everything else blocked) and `openBoardPage` for the board reference.
 */
// The fixtures are plain JavaScript (the tools folder has no dependencies); their shape is
// declared here.
export const test = base.extend<CaptureFixtures>(
  captureFixtures as unknown as Parameters<typeof base.extend<CaptureFixtures>>[0],
);
export { expect };

/**
 * Records, as `retired-by-v3`, every v46 comparison of one board that an owner-approved V3 screen
 * supersedes (`docs/v3/V3-COMPARISON-MAP.json` `productScreens[].supersedes`, by name prefix such
 * as `b1-10-`): for a board whose product screens are all migrated, so nothing of it is captured.
 * Each name must be on the map (the map is the only way to retire one); the run's report counts
 * them as retired — never as passed.
 */
export async function recordSuperseded(testInfo: TestInfo, prefix: string): Promise<void> {
  const retired = retiredComparisons() as ReadonlyMap<string, string>;
  const names = [...retired.keys()].filter((name) => name.startsWith(prefix)).sort();
  expect(names.length, `superseded comparisons named ${prefix}*`).toBeGreaterThan(0);
  // Retired names are recorded before any capture: their locators are never read.
  const unread = undefined as unknown as Locator;
  await compareAll({
    expect,
    testInfo,
    kind: 'specimen',
    items: names.map((name) => ({ name, reference: unread, product: unread })),
  });
}
