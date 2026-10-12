/**
 * Recorded exceptions to the static scans. Each one is explicit (rule + file + the exact text
 * found), cites its evidence and names when it ends. The repository scan fails when an
 * exception no longer matches a finding, so a stale exception cannot linger.
 */
export interface ScanException {
  readonly rule: string;
  readonly file: string;
  readonly found: string;
  readonly evidence: string;
  readonly removal: string;
}

export const RECORDED_SCAN_EXCEPTIONS: readonly ScanException[] = [
  {
    rule: 'tailwind-preflight',
    file: 'apps/web/src/app/globals.css',
    found: "@import 'tailwindcss'",
    evidence:
      'The committed foundation stylesheet (1b090c9). ADR-0001 (G-3 Option A) removes Preflight; Appendix F §2.1 marks globals.css "Replace" and WP-0.5 owns that step.',
    removal: 'WP-0.5 (tokens, CSS port and product layer)',
  },
];
