/**
 * Recorded exceptions to the static scans. Each one is explicit (rule + file + the exact text
 * found), cites its evidence and names when it ends. The repository scan fails when an
 * exception no longer matches a finding, so a stale exception cannot linger.
 *
 * None is recorded. The WP-0.4 exception for `@import 'tailwindcss'` (Preflight) in
 * apps/web/src/app/globals.css ended in WP-0.5: globals.css now imports only Tailwind's theme and
 * utilities (ADR-0001, G-3 Option A).
 */
export interface ScanException {
  readonly rule: string;
  readonly file: string;
  readonly found: string;
  readonly evidence: string;
  readonly removal: string;
}

export const RECORDED_SCAN_EXCEPTIONS: readonly ScanException[] = [];
