/**
 * What the one-world proof must cover (Appendix F WP-0.14 acceptance 1 and 7): the 27 flows.json
 * steps — read from the frozen handoff by the test file, never copied here — and the drawn alternates,
 * the cross-cutting commands and the owner-approved interims. Each entry names where it is proved.
 */
export interface FlowsJsonStep {
  readonly flow: string;
  readonly step: string;
  readonly actor: string;
  readonly screens: string;
  readonly record: string;
  readonly transition: string;
  readonly evidenceBoards: string;
}

/** `flows.json A1` … `flows.json Device 3` — the coverage key of a flows.json step. */
export function flowKey(step: Pick<FlowsJsonStep, 'flow' | 'step'>): `flows.json ${string}` {
  return step.flow === 'Device'
    ? `flows.json Device ${step.step}`
    : `flows.json ${step.flow}${step.step}`;
}

/**
 * The drawn alternates (Appendix F §7.2 and WP-0.14 acceptance 1: E-alt1…3, F-alt, Hold / Lift
 * hold, B-withdraw) plus Flow A's drawn "Request more information" (Appendix D §4.2) and F2b's
 * return, which Appendix D §4.0 files under F-alt ("withdraw, return").
 */
export const DRAWN_ALTERNATES = [
  'alternate A-request-more-information',
  'alternate B-withdraw',
  'alternate E-alt1',
  'alternate E-alt2',
  'alternate E-alt3',
  'alternate F-alt return',
  'alternate F-alt withdraw',
  'alternate Hold',
  'alternate Lift hold',
] as const;

/** Appendix D §4.9 commands whose effects cross roles, and the account / session commands. */
export const CROSS_CUTTING = [
  'cross-cutting support-report',
  'cross-cutting support-resolve',
  'cross-cutting support-reopen',
  'cross-cutting pause-restore',
  'cross-cutting pause-other-institution',
  'cross-cutting deactivate-student',
  'cross-cutting override-student-status',
  'cross-cutting session',
  'cross-cutting more-licences',
  'cross-cutting people-setup',
  'cross-cutting role-holder',
  'cross-cutting question-bank',
] as const;

/** The owner-approved interims the proof must name in its step titles (Appendix F §10.2). */
export const INTERIMS = ['interim AD-14', 'interim DV-2', 'interim M-3'] as const;

/**
 * Proved elsewhere and reused (WP-0.14 §3 "reuse existing passing tests"): the contract cases on
 * their own fixture worlds keep the per-field validation words and the cases a one-world spine
 * cannot reach without breaking the board timeline.
 */
export const REUSED_CONTRACT_CASES: Readonly<Record<string, string>> = {
  'flow:D-objective-marks-interim':
    'DV-2: confirming without supplied objective marks answers policy-open ATT-07 (the walk supplies them before marking)',
  'flow:A': 'A2/A3 field-level validation words (B1-07, B1-11 f7)',
  'flow:E': 'E1–E3 validation words (B5-03, B5-05 f5, B6-11 f1/f2)',
  'flow:F': 'F1 version-label rule "Use a new version label — 1.2 is live" (B6-09)',
};
