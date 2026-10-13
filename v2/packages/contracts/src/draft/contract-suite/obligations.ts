/**
 * Proof obligations the contract suite carries for WP-0.11. They are defined here but cannot pass
 * before the sample world exists; until then the suite reports their cases "not run". Nothing here
 * is counted as completed in WP-0.10.
 */
export interface Obligation {
  readonly id: string;
  readonly what: string;
  /** Where the obligation comes from. */
  readonly source: string;
  /** The contract cases that discharge it. */
  readonly cases: readonly string[];
  readonly owner: 'WP-0.11';
}

export const DEFERRED_OBLIGATIONS: readonly Obligation[] = [
  {
    id: 'WP-0.9/5-after-flow-E',
    what: "Both Composite Wall records exist in the afterFlow('E') world.",
    source:
      'WP-0.9 acceptance (5) and invariant 10, deferred by the WP-0.9 README ("Left to WP-0.11")',
    cases: ['invariant:10-after-flow-E'],
    owner: 'WP-0.11',
  },
  {
    id: 'WP-0.9/5-state-coverage',
    what: 'Both Composite Wall records exist in the stateCoverage() world.',
    source: 'WP-0.9 acceptance (5) and invariant 10, deferred by the WP-0.9 README',
    cases: ['invariant:10-state-coverage'],
    owner: 'WP-0.11',
  },
  {
    id: 'WP-0.9/5-spine-start',
    what: 'SUB-0077 does not exist in the spine-start world (before Flow E step 1).',
    source: 'Appendix D §5.5 invariant 10 as reworded at assembly; WP-0.9 acceptance (5)',
    cases: ['invariant:10-spine-start'],
    owner: 'WP-0.11',
  },
  {
    id: 'WP-0.9/12-provenance',
    what: 'Every stand-in or fixture runtime event carries sample provenance (sample-standin / sample-fixture).',
    source: 'Invariant 12 and WP-0.11 acceptance (5), deferred by the WP-0.9 README',
    cases: ['invariant:12-provenance'],
    owner: 'WP-0.11',
  },
  {
    id: 'WP-0.10/flows',
    what: 'The flow cases (A–F, the device chain, the cross-cutting commands) run against the sample world.',
    source:
      'Appendix F WP-0.10 scope and WP-0.11 acceptance (1): "The contract suite passes against createSamplePlatform for every Phase-0 method"',
    cases: [
      'flow:A',
      'flow:A-information',
      'flow:B1-B2',
      'flow:B3-B4',
      'flow:B5-withdraw',
      'flow:C',
      'flow:D',
      'flow:D-objective-marks-interim',
      'flow:E',
      'flow:E-send-backs',
      'flow:E-alt3-override',
      'flow:F',
      'flow:F-return-withdraw',
      'flow:Device',
      'cross:pause-restore',
      'cross:deactivate-student',
      'cross:support-report',
    ],
    owner: 'WP-0.11',
  },
  {
    id: 'WP-0.10/E-alt3-reach',
    what: 'E-alt3 finds the seeded stuck record through SA-12’s all-content list (ProductionService.listAllContent), which Appendix F §4.1’s table places in P6 while its rule makes every read the flow suites call Phase 0. WP-0.11 either implements listAllContent with the Phase-0 set (an owner-visible change to §4.1) or the case stays "not run"; it is never counted as passed.',
    source:
      'Appendix F §4.1 (table vs rule); WP-0.11 acceptance (1) "the drawn alternates (E-alt1…3 …)"',
    cases: ['flow:E-alt3-override'],
    owner: 'WP-0.11',
  },
];
