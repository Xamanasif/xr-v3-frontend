/**
 * The independent expected-words fixture of WP-0.14 (Appendix F WP-0.14 acceptance 3; owner
 * instruction §6): for each flows.json step and drawn alternate, the words each role is drawn
 * seeing — a status word, a heading or an action — copied from the frozen board frame named, NOT
 * from the application's copy tables. `flow-words.test.ts` checks every entry against
 * `design/handoff-v46/derived/frame-index.json` (that frame of that board carries these exact
 * words in that field) and then compares the application's words, computed from the sample
 * world's own read models at that step, with them.
 *
 * Entries name an approved interim or a documented deviation where one applies. States the boards
 * do not word are absent; where a step reaches an unresolved copy decision, `expected` is `null`
 * and `decision` names it.
 */
export type FlowStep =
  | 'A1'
  | 'A2'
  | 'A3'
  | 'A4'
  | 'B1'
  | 'B2'
  | 'B3'
  | 'B4'
  | 'C1'
  | 'C2'
  | 'C3'
  | 'D1'
  | 'D2'
  | 'D3'
  | 'D4'
  | 'E1'
  | 'E2'
  | 'E3'
  | 'E4'
  | 'E5'
  | 'F1'
  | 'F2'
  | 'F3'
  | 'F4'
  | 'Device 1'
  | 'Device 2'
  | 'Device 3'
  | 'A-info'
  | 'B-withdraw'
  | 'E-alt1'
  | 'E-alt2'
  | 'E-alt3'
  | 'F-alt return'
  | 'F-alt withdraw'
  | 'Hold'
  | 'Lift hold'
  | 'Pause'
  | 'Deactivate'
  | 'Support';

/**
 * flows.json steps whose state the frame index carries no word for: proved at port level only
 * (`@xr/sample-platform` one-world C1), never given invented words.
 */
export const UNWORDED_STEPS: Readonly<Partial<Record<FlowStep, string>>> = {
  C1: 'B3-01 draws a resource’s "Opened <date>" only in row text the frame index does not extract (no status, heading or control)',
  E5: 'the listed experiment’s page heading is its own name (data, not words); E5-before checks the drawn state before publication (B6-12 f6)',
};

/** The role whose screen draws the words (`requester` = the request's contact on PU-10). */
export type FixtureRole =
  | 'Public visitor'
  | 'Requester'
  | 'Student'
  | 'Faculty'
  | 'Institute Admin'
  | 'Vendor'
  | 'Academic Reviewer'
  | 'Content Manager'
  | 'Super Admin';

export interface ExpectedWords {
  readonly id: string;
  readonly step: FlowStep;
  readonly screen: string;
  readonly role: FixtureRole;
  /** Board code and frame number in `derived/frame-index.json`. */
  readonly board: string;
  readonly frame: number;
  /** Where the frame index records the words. */
  readonly field: 'status' | 'heading' | 'control';
  readonly expected: string | null;
  /** An owner decision the entry rests on: an approved interim, a deviation or an open decision. */
  readonly decision?: string;
  /**
   * The open decision the step reaches: the words are drawn, but the application cannot choose to
   * show them until it is decided — the sample world answers `policy-open` with this id.
   */
  readonly open?: string;
}

const entry = (
  id: string,
  step: FlowStep,
  screen: string,
  role: FixtureRole,
  board: string,
  frame: number,
  field: ExpectedWords['field'],
  expected: string | null,
  decision?: string,
): ExpectedWords => ({
  id,
  step,
  screen,
  role,
  board,
  frame,
  field,
  expected,
  ...(decision ? { decision } : {}),
});

export const EXPECTED_WORDS: readonly ExpectedWords[] = [
  // Flow A — B1-06, B1-07, B1-08, B1-10, B1-11, B7-03
  entry('A1-selection', 'A1', 'PU-07', 'Public visitor', 'B1-06', 0, 'heading', 'Your selection'),
  entry('A2-sent', 'A2', 'PU-09', 'Requester', 'B1-07', 8, 'heading', 'Request sent'),
  entry(
    'A2-requester',
    'A2',
    'PU-10',
    'Requester',
    'B1-08',
    1,
    'status',
    'Submitted',
    'AD-14 interim: "Under review" waits for the seeded or test-only review-start fact',
  ),
  entry('A2-sa', 'A2', 'SA-02', 'Super Admin', 'B1-10', 0, 'status', 'Under review'),
  entry(
    'A2-review-started',
    'A2',
    'PU-10',
    'Requester',
    'B1-08',
    2,
    'status',
    'Under review',
    'AD-14 interim: supplied by the test-only seam',
  ),
  entry('A3-sa', 'A3', 'SA-03', 'Super Admin', 'B1-11', 9, 'status', 'Approved — payment required'),
  entry(
    'A3-requester',
    'A3',
    'PU-10',
    'Requester',
    'B1-08',
    0,
    'status',
    'Approved — payment required',
  ),
  entry('A3-next', 'A3', 'PU-10', 'Requester', 'B1-08', 0, 'control', 'Continue to payment'),
  entry('A4-requester', 'A4', 'PU-13', 'Requester', 'B1-08', 8, 'status', 'Access active'),
  entry('A4-next', 'A4', 'PU-13', 'Requester', 'B1-08', 8, 'control', 'Sign in'),
  entry('A4-sa', 'A4', 'SA-07', 'Super Admin', 'B7-03', 0, 'status', 'Access active'),
  entry(
    'A-info-requester',
    'A-info',
    'PU-10',
    'Requester',
    'B1-08',
    3,
    'status',
    'Information requested',
  ),
  entry(
    'A-info-sa',
    'A-info',
    'SA-03',
    'Super Admin',
    'B1-11',
    12,
    'status',
    'Information requested',
  ),
  // Flow B — B2-01 … B2-05, B2-10, B2-12, B7-03
  entry('B1-ia', 'B1', 'IA-01', 'Institute Admin', 'B2-01', 0, 'status', 'Access active'),
  entry('B2-content', 'B2', 'IA-02', 'Institute Admin', 'B2-02', 0, 'status', 'Active'),
  entry('B2-plan', 'B2', 'IA-03', 'Institute Admin', 'B2-03', 0, 'status', 'Active'),
  entry('B3-given', 'B3', 'IA-05', 'Institute Admin', 'B2-05', 3, 'heading', 'Access given'),
  entry('B3-grant', 'B3', 'IA-04', 'Institute Admin', 'B2-04', 0, 'status', 'Active'),
  entry(
    'B4-ar',
    'B4',
    'ST-07',
    'Student',
    'B3-12',
    0,
    'status',
    'Not included for your institution',
  ),
  entry(
    'B4-mr',
    'B4',
    'ST-07',
    'Student',
    'B3-12',
    0,
    'status',
    'Not available for this experiment',
  ),
  entry(
    'B4-vr',
    'B4',
    'ST-07',
    'Student',
    'B3-12',
    0,
    'status',
    'Not started',
    'ST-07’s chooser read is Phase 3: the same per-format word is read from the ST-05 hub row',
  ),
  entry(
    'B-withdraw-ia',
    'B-withdraw',
    'IA-04',
    'Institute Admin',
    'B2-04',
    5,
    'status',
    'Withdrawn',
  ),
  {
    ...entry(
      'B-withdraw-student',
      'B-withdraw',
      'ST-19',
      'Student',
      'B2-12',
      4,
      'heading',
      'This experiment is no longer given to you',
      'SACC-14 UNRESOLVED: which pages stay viewable read-only after the only grant is withdrawn',
    ),
    open: 'SACC-14',
  },
  entry(
    'B-withdraw-courses',
    'B-withdraw',
    'ST-02',
    'Student',
    'B2-11',
    7,
    'heading',
    'No experiments are given to you right now',
  ),
  entry(
    'B-withdraw-earlier',
    'B-withdraw',
    'ST-02',
    'Student',
    'B2-11',
    7,
    'heading',
    'Earlier work',
  ),
  // Flow C — B3-01, B3-03, B3-04, B3-06, B3-12
  entry('C2-launch', 'C2', 'ST-08', 'Student', 'B3-03', 1, 'control', 'Launch WEB'),
  entry('C2-not-started', 'C2', 'ST-08', 'Student', 'B3-03', 1, 'status', 'Not started'),
  entry('C2-in-progress', 'C2', 'ST-08', 'Student', 'B3-03', 0, 'status', 'In progress'),
  entry('C2-continue', 'C2', 'ST-08', 'Student', 'B3-03', 2, 'control', 'Continue WEB'),
  entry(
    'C2-web-completed',
    'C2',
    'ST-08',
    'Student',
    'B3-03',
    3,
    'status',
    'Completed 14 Oct 2026',
  ),
  entry('C2-web-heading', 'C2', 'ST-08', 'Student', 'B3-03', 3, 'heading', 'You’ve completed WEB'),
  entry('C3-web-offer', 'C3', 'ST-08', 'Student', 'B3-03', 3, 'control', 'Give feedback on WEB'),
  entry('C2-vr-in-progress', 'C2', 'ST-09', 'Student', 'B3-04', 0, 'status', 'In progress'),
  entry('C2-vr-completed', 'C2', 'ST-09', 'Student', 'B3-04', 2, 'status', 'Completed 20 Oct 2026'),
  entry('C3-vr-offer', 'C3', 'ST-09', 'Student', 'B3-04', 2, 'control', 'Give feedback on VR'),
  entry('C2-faculty-web', 'C2', 'FA-21', 'Faculty', 'B4-10', 3, 'status', 'Completed 14 Oct 2026'),
  entry('C2-faculty-vr', 'C2', 'FA-21', 'Faculty', 'B4-10', 3, 'status', 'Completed 20 Oct 2026'),
  entry('C3-web-sent', 'C3', 'ST-17', 'Student', 'B3-06', 3, 'heading', 'Feedback on WEB sent'),
  entry('C3-web-see', 'C3', 'ST-08', 'Student', 'B3-03', 4, 'control', 'See your feedback'),
  entry('C3-vr-sent', 'C3', 'ST-17', 'Student', 'B3-06', 4, 'heading', 'Feedback on VR sent'),
  // Flow D — B4-06, B4-09, B4-11, B4-12, B4-13, B4-14
  entry('D1-created', 'D1', 'FA-07', 'Faculty', 'B4-14', 0, 'heading', 'Assessment created'),
  entry('D1-ready', 'D1', 'FA-10', 'Faculty', 'B4-06', 0, 'status', 'Ready'),
  entry('D1-student', 'D1', 'ST-11', 'Student', 'B4-11', 0, 'status', 'To do'),
  entry('D2-submitted', 'D2', 'ST-13', 'Student', 'B4-12', 4, 'heading', 'Answers submitted'),
  entry('D2-student', 'D2', 'ST-11', 'Student', 'B4-11', 2, 'status', 'Waiting for marking'),
  entry('D2-faculty-detail', 'D2', 'FA-21', 'Faculty', 'B4-10', 3, 'status', 'Waiting for marking'),
  entry('D2-faculty-queue', 'D2', 'FA-18', 'Faculty', 'B4-09', 0, 'status', 'Waiting for marking'),
  entry(
    'D3-confirmed',
    'D3',
    'FA-19',
    'Faculty',
    'B4-09',
    2,
    'status',
    'Marks confirmed',
    'DV-2 interim: objective marks supplied by the fixture',
  ),
  entry('D3-marked', 'D3', 'FA-12', 'Faculty', 'B4-06', 8, 'status', 'Marked'),
  entry('D3-faculty-detail', 'D3', 'FA-21', 'Faculty', 'B4-10', 4, 'status', 'Marked'),
  entry('D3-student', 'D3', 'ST-11', 'Student', 'B4-11', 3, 'status', 'Result not released yet'),
  entry(
    'D3-result-page',
    'D3',
    'ST-14',
    'Student',
    'B4-13',
    2,
    'heading',
    'Result not released yet',
  ),
  entry(
    'D4-student',
    'D4',
    'ST-11',
    'Student',
    'B4-11',
    4,
    'status',
    'Result ready',
    'flows.json D4 "FA-12 (release)" is a handoff defect: released by the setting (B4-14)',
  ),
  entry('D4-passed', 'D4', 'ST-14', 'Student', 'B4-13', 0, 'status', 'Passed'),
  entry('D4-heading', 'D4', 'ST-14', 'Student', 'B4-13', 0, 'heading', 'You passed'),
  // Flow E — B5-05, B5-06, B6-02, B6-03, B6-06, B6-07, B6-12, B7-06
  entry('E1-sent', 'E1', 'VE-06', 'Vendor', 'B5-05', 1, 'heading', 'Submitted for academic review'),
  entry('E1-vendor', 'E1', 'VE-07', 'Vendor', 'B5-06', 2, 'status', 'With Academic Reviewer'),
  entry(
    'E1-reviewer',
    'E1',
    'RV-03',
    'Academic Reviewer',
    'B6-03',
    2,
    'status',
    'Waiting · revision 1',
  ),
  entry('E1-sa', 'E1', 'SA-13', 'Super Admin', 'B7-06', 4, 'status', 'With Academic Reviewer'),
  entry(
    'E1-cm',
    'E1',
    'CM-03',
    'Content Manager',
    'B6-07',
    3,
    'status',
    'Still in academic review',
  ),
  entry('E2-vendor', 'E2', 'VE-07', 'Vendor', 'B5-06', 3, 'status', 'Returned'),
  entry(
    'E2-vendor-heading',
    'E2',
    'VE-07',
    'Vendor',
    'B5-06',
    3,
    'heading',
    'Returned by the Academic Reviewer',
  ),
  entry(
    'E2-reviewed',
    'E2',
    'RV-05',
    'Academic Reviewer',
    'B6-02',
    1,
    'status',
    'Returned to vendor · revision 1',
  ),
  entry(
    'E2-resubmitted',
    'E2',
    'VE-07',
    'Vendor',
    'B5-06',
    4,
    'status',
    'Submitted',
    'M-3: no gate named after a resubmit; routed by the test-only seam',
  ),
  entry(
    'E2-reviewer',
    'E2',
    'RV-03',
    'Academic Reviewer',
    'B6-03',
    0,
    'status',
    'Resubmitted · revision 2',
  ),
  entry('E3-vendor', 'E3', 'VE-07', 'Vendor', 'B5-06', 5, 'status', 'With Content Manager'),
  entry('E3-cm', 'E3', 'CM-03', 'Content Manager', 'B6-07', 0, 'status', 'Ready to publish'),
  entry(
    'E3-reviewer',
    'E3',
    'RV-06',
    'Academic Reviewer',
    'B6-03',
    4,
    'status',
    'Approved — with the Content Manager',
  ),
  entry('E4-cm', 'E4', 'CM-03', 'Content Manager', 'B6-07', 4, 'status', 'Published'),
  entry('E4-vendor', 'E4', 'VE-07', 'Vendor', 'B5-06', 8, 'status', 'Published'),
  entry('E4-sa', 'E4', 'SA-13', 'Super Admin', 'B7-06', 3, 'status', 'Published'),
  entry(
    'E4-reviewed',
    'E4',
    'RV-05',
    'Academic Reviewer',
    'B6-02',
    1,
    'status',
    'Approved — published',
  ),
  entry(
    'E5-before',
    'E5',
    'PU-06',
    'Public visitor',
    'B6-12',
    6,
    'heading',
    'We can’t find that experiment',
  ),
  entry(
    'E-alt1-vendor',
    'E-alt1',
    'VE-07',
    'Vendor',
    'B5-06',
    7,
    'status',
    'With Academic Reviewer',
  ),
  entry(
    'E-alt1-reviewer',
    'E-alt1',
    'RV-03',
    'Academic Reviewer',
    'B6-03',
    3,
    'status',
    'Back for a re-check',
  ),
  entry(
    'E-alt1-reviewed',
    'E-alt1',
    'RV-05',
    'Academic Reviewer',
    'B6-02',
    1,
    'status',
    'Approved — later sent back for a re-check',
  ),
  entry('E-alt2-vendor', 'E-alt2', 'VE-07', 'Vendor', 'B5-06', 6, 'status', 'Returned'),
  entry(
    'E-alt2-heading',
    'E-alt2',
    'VE-07',
    'Vendor',
    'B5-06',
    6,
    'heading',
    'Returned by the Content Manager',
  ),
  entry('E-alt2-sa', 'E-alt2', 'SA-12', 'Super Admin', 'B7-06', 0, 'status', 'Returned to vendor'),
  entry(
    'E-alt3-stuck',
    'E-alt3',
    'SA-13',
    'Super Admin',
    'B7-06',
    1,
    'status',
    'Stuck — nobody can act',
  ),
  entry(
    'E-alt3-moved',
    'E-alt3',
    'SA-12',
    'Super Admin',
    'B7-06',
    0,
    'status',
    'Returned to vendor',
  ),
  entry(
    'E-alt3-vendor',
    'E-alt3',
    'VE-07',
    'Vendor',
    'B7-06',
    5,
    'status',
    null,
    'B7-06: the Vendor-side view of an override is not drawn (Appendix D §4.6 "Vendor wording UNRESOLVED")',
  ),
  // Flow F — B6-04, B6-08, B6-09, B7-05, B7-11
  entry('F1-cm', 'F1', 'CM-08', 'Content Manager', 'B6-09', 3, 'status', 'In academic review'),
  entry(
    'F1-reviewer',
    'F1',
    'RV-04',
    'Academic Reviewer',
    'B6-04',
    0,
    'status',
    'Waiting for your decision',
  ),
  entry('F1-open', 'F1', 'CM-05', 'Content Manager', 'B6-08', 1, 'control', 'Open update'),
  entry(
    'F2-cm',
    'F2',
    'CM-08',
    'Content Manager',
    'B6-09',
    5,
    'status',
    'Awaiting release decision',
  ),
  entry(
    'F2-reviewer',
    'F2',
    'RV-04',
    'Academic Reviewer',
    'B6-04',
    4,
    'status',
    'Approved — with the Super Admin',
  ),
  entry('F2-sa', 'F2', 'SA-10', 'Super Admin', 'B7-05', 0, 'status', 'Waiting for your decision'),
  entry('Hold-sa', 'Hold', 'SA-11', 'Super Admin', 'B7-05', 5, 'status', 'On hold'),
  entry('Hold-cm', 'Hold', 'CM-08', 'Content Manager', 'B6-09', 6, 'status', 'On hold'),
  entry(
    'Lift-hold-sa',
    'Lift hold',
    'SA-11',
    'Super Admin',
    'B7-05',
    7,
    'status',
    'Waiting for your decision',
  ),
  entry('F3-sa', 'F3', 'SA-11', 'Super Admin', 'B7-05', 6, 'status', 'Released'),
  entry('F3-cm', 'F3', 'CM-08', 'Content Manager', 'B6-09', 7, 'status', 'Released'),
  entry(
    'F3-reviewed',
    'F3',
    'RV-05',
    'Academic Reviewer',
    'B6-02',
    1,
    'status',
    'Update approved — released',
  ),
  entry('F4-cm', 'F4', 'CM-05', 'Content Manager', 'B7-11', 4, 'status', 'Published'),
  entry(
    'F-alt-return-cm',
    'F-alt return',
    'CM-08',
    'Content Manager',
    'B6-09',
    2,
    'status',
    'Returned',
  ),
  entry(
    'F-alt-return-heading',
    'F-alt return',
    'CM-08',
    'Content Manager',
    'B6-09',
    2,
    'heading',
    'Returned by the Academic Reviewer',
  ),
  entry(
    'F-alt-return-reviewer',
    'F-alt return',
    'RV-04',
    'Academic Reviewer',
    'B6-04',
    3,
    'status',
    'Returned to the Content Manager',
  ),
  entry(
    'F-alt-withdraw-cm',
    'F-alt withdraw',
    'CM-08',
    'Content Manager',
    'B6-09',
    8,
    'status',
    'Withdrawn',
  ),
  // Device chain — B3-07, B3-09, B3-11
  entry(
    'Dv1-student',
    'Device 1',
    'ST-18',
    'Student',
    'B3-07',
    4,
    'status',
    'With your Institute Admin',
  ),
  entry('Dv1-ia', 'Device 1', 'IA-18', 'Institute Admin', 'B3-09', 0, 'status', 'Waiting on you'),
  entry(
    'Dv1-sa',
    'Device 1',
    'SA-18',
    'Super Admin',
    'B3-11',
    2,
    'status',
    'Still with the institution',
  ),
  entry(
    'Dv1-forward',
    'Device 1',
    'IA-19',
    'Institute Admin',
    'B3-09',
    5,
    'control',
    'Forward to BITS',
  ),
  entry('Dv2-student', 'Device 2', 'ST-18', 'Student', 'B3-07', 5, 'status', 'Forwarded to BITS'),
  entry(
    'Dv2-ia',
    'Device 2',
    'IA-19',
    'Institute Admin',
    'B3-09',
    2,
    'status',
    'Forwarded to BITS',
  ),
  entry('Dv2-sa', 'Device 2', 'SA-18', 'Super Admin', 'B3-11', 0, 'status', 'Forwarded'),
  entry(
    'Dv2-approve',
    'Device 2',
    'SA-19',
    'Super Admin',
    'B3-11',
    4,
    'control',
    'Approve transfer',
  ),
  entry('Dv3-student', 'Device 3', 'ST-18', 'Student', 'B3-07', 6, 'status', 'Approved'),
  entry(
    'Dv3-ia',
    'Device 3',
    'IA-19',
    'Institute Admin',
    'B3-09',
    3,
    'status',
    'Decided · approved by BITS',
  ),
  entry('Dv3-sa', 'Device 3', 'SA-19', 'Super Admin', 'B3-11', 5, 'status', 'Approved'),
  // Cross-cutting — pause (B7-03, B2-01, B2-02, B3-03), deactivate (B2-04, B2-10), support (B7-09)
  entry('Pause-sa', 'Pause', 'SA-07', 'Super Admin', 'B7-03', 2, 'status', 'Access paused'),
  entry('Pause-ia', 'Pause', 'IA-01', 'Institute Admin', 'B2-01', 5, 'status', 'Access paused'),
  entry('Pause-ia-content', 'Pause', 'IA-02', 'Institute Admin', 'B2-02', 5, 'status', 'Paused'),
  entry('Pause-student', 'Pause', 'ST-08', 'Student', 'B3-03', 5, 'status', 'Paused'),
  entry(
    'Pause-student-heading',
    'Pause',
    'ST-08',
    'Student',
    'B3-03',
    5,
    'heading',
    'You can’t open the simulation right now',
  ),
  entry(
    'Deactivate-ia',
    'Deactivate',
    'IA-04',
    'Institute Admin',
    'B2-04',
    1,
    'status',
    'Student inactive',
  ),
  entry(
    'Deactivate-student',
    'Deactivate',
    'ST-01',
    'Student',
    'B2-10',
    7,
    'heading',
    'Your account is inactive',
  ),
  entry(
    'Support-open',
    'Support',
    'SA-20',
    'Super Admin',
    'B7-09',
    7,
    'status',
    'Open',
    'Board 07 Rules: the reporter reads the same words as the Super Admin side; SA-20’s list is a Phase-6 read',
  ),
  entry(
    'Support-resolved',
    'Support',
    'SA-21',
    'Super Admin',
    'B7-09',
    9,
    'status',
    'Resolved',
    'Board 07 Rules: the reporter reads the same words as the Super Admin side',
  ),
];
