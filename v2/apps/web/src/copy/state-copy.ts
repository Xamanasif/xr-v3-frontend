/**
 * The per-screen state-copy register (VD-12, register P0-18; Appendix F §6.6 "Undrawn states use
 * the board-04 copy formula and go into a per-screen state copy register for sign-off"; Appendix E
 * §5; WP-0.13 acceptance 2: the P0-31 title "marked provisional in the state-copy register").
 *
 * Every state string or rule a Phase-0 screen shows that its own board does not draw word for
 * word: where it comes from, and whether the owner has it yet. `drawn` = the words are on a board
 * (cited); `provisional` = written to a board formula or chosen as an interim, awaiting sign-off.
 * The screens read their words from here, so the register and the product cannot drift apart.
 * Later phases add their screens' entries (Appendix F §9).
 */
export type StateCopyStatus = 'drawn' | 'provisional';

export interface StateCopyEntry {
  /** The screen (or the shell around every screen). */
  readonly screen: 'Shell' | 'XS-06' | 'XS-07' | 'PU-15';
  /** The state, as the screen reaches it. */
  readonly state: string;
  /** The words shown; `null` where the entry is a rule rather than words. */
  readonly words: string | null;
  /** The rule, where the entry is one (how a value is made, or what is left out). */
  readonly rule?: string;
  /** The board, formula or record it rests on. */
  readonly basis: string;
  readonly status: StateCopyStatus;
  /** The owner decision(s) it waits on, where one exists. */
  readonly decisions?: readonly string[];
}

export const STATE_COPY = {
  'shell.session-loading': {
    screen: 'Shell',
    state: 'The tab’s session is resolving (a workspace address before the shell can be drawn)',
    words: 'Loading …',
    basis:
      'Board 04 "State grammar" Loading ("announced politely"); board 12 "Reduced motion" (“Loading …” still announced). No board draws this wait.',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'shell.document-title': {
    screen: 'Shell',
    state: 'The browser tab’s title on every Phase-0 page (WCAG 2.4.2)',
    words: null,
    rule: '“<the page’s top-bar title> · XR Learning Platform”; “XR Learning Platform” alone while loading. The public not-found: “We can’t find that page · XR Learning Platform”.',
    basis:
      'Appendix F §3.3 (metadata "XR Learning Platform" + per-page titles); the product name as the shells write it. No board draws document titles.',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'XS-06.top-title': {
    screen: 'XS-06',
    state: 'Top bar on another role’s workspace',
    words: 'Not your workspace',
    basis: 'Board 08 "At 375 px" (`span.xr-top-title`) and "The family" crumb',
    status: 'drawn',
  },
  'PU-15.top-title': {
    screen: 'PU-15',
    state: 'Top bar on the in-shell not-found',
    words: 'Not found',
    basis: 'Board 08 "The family": "Page not found · workspace" (crumb "Not found")',
    status: 'drawn',
  },
  'XS-07.reports.loading': {
    screen: 'XS-07',
    state: 'My reports loading (screen readers)',
    words: 'Loading your reports',
    basis: 'Board 04 "State grammar" Loading: → screen readers: “Loading your reports”',
    status: 'drawn',
  },
  'XS-07.reports.failed': {
    screen: 'XS-07',
    state: 'My reports failed to load (service unavailable; reached only under a test fault plan)',
    words: 'Your reports didn’t load. Nothing was lost.',
    basis:
      'Board 04 "State grammar" Failed + retry (“What didn’t work + reassurance + retry”, sample “The simulation didn’t open. Nothing was lost.”); line and actions as board 03 draws the failed state',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'XS-07.failed.line': {
    screen: 'XS-07',
    state: 'The failed state’s next step (My reports, a report)',
    words: 'Try again. If it keeps happening, report the problem.',
    basis: 'Board 03 "Notices, empty, error, loading and read-only" (the failed notice’s line)',
    status: 'drawn',
  },
  'XS-07.detail.loading': {
    screen: 'XS-07',
    state: 'A report loading (screen readers)',
    words: 'Loading your report',
    basis: 'Board 04 "State grammar" Loading formula (sample “Loading your reports”)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'XS-07.detail.failed': {
    screen: 'XS-07',
    state: 'A report failed to load (service unavailable; reached only under a test fault plan)',
    words: 'Your report didn’t load. Nothing was lost.',
    basis: 'Board 04 "State grammar" Failed + retry formula',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'XS-07.send.failed': {
    screen: 'XS-07',
    state: 'Send report failed for now (service unavailable)',
    words: null,
    rule: 'Nothing changes: the form keeps what was typed and Send can be pressed again; no message is shown.',
    basis:
      'Board 07 draws no failure frame (contract ledger note on reportProblem); Appendix F §6.6 “command unavailable → nothing changes … answers kept”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'XS-07.report-title': {
    screen: 'XS-07',
    state: 'A report’s title in My reports and on its detail',
    words: null,
    rule: 'The beginning of “What happened”: spaces collapsed; up to 60 characters shown whole without a closing full stop; longer text cut at the last whole word, with “…”. Display only — no title is saved.',
    basis:
      'Owner decision P0-31 (12 Oct 2026: display-only excerpt of “What happened”); board 07 draws titles up to 46 characters and no cut title',
    status: 'provisional',
    decisions: ['P0-31'],
  },
  'XS-07.where-prefill': {
    screen: 'XS-07',
    state: '“Where did it happen?” pre-filled',
    words: null,
    rule: 'The last page the person saw outside Help & support in this tab, in that page’s top-bar words joined with “ · ” (e.g. “Not found”, “Not your workspace” in Phase 0); empty when there is none. Never an address.',
    basis:
      'Board 07 "State 1" (“Where” is pre-filled from the page the person came from; places written “Content library · Forced Convection”); board 08 "Rules" (never route names)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'XS-07.where-empty': {
    screen: 'XS-07',
    state: 'Report detail when no place was given',
    words: null,
    rule: 'The “Where” row of “What you reported” is left out.',
    basis: 'Board 07 draws a place in every frame; no words for an empty one are drawn',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'XS-07.no-screenshot': {
    screen: 'XS-07',
    state: 'Report detail when no screenshot was chosen',
    words: 'No screenshot added',
    basis: 'Board 07 "State 3a · Report detail · reopened" (`shot`)',
    status: 'drawn',
  },
  'XS-07.dates': {
    screen: 'XS-07',
    state: 'Every date on Help & support',
    words: null,
    rule: 'Day and month (“3 Oct”), read in Indian time (the sample world’s zone); no year.',
    basis:
      'Board 07 (“sent 3 Oct”, “Resolution note · 23 Sep”); B8-03 (no numeric dates). The zone and the year left out across years are interim.',
    status: 'provisional',
    decisions: ['VD-12'],
  },
} as const satisfies Readonly<Record<string, StateCopyEntry>>;

export type StateCopyId = keyof typeof STATE_COPY;

type WordsId = {
  readonly [Id in StateCopyId]: (typeof STATE_COPY)[Id]['words'] extends string ? Id : never;
}[StateCopyId];

/** The words of a register entry that has words. */
export function stateWords(id: WordsId): string {
  return STATE_COPY[id].words;
}
