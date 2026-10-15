import type { StateCopyEntry } from './state-copy';

/**
 * The state-copy entries of IA-01 Overview, IA-02 Content access, IA-03 Access plan (boards B2-01 … B2-03) — Phase-2 Package 2A, part of the one
 * register (`state-copy.ts`, VD-12): every state string or rule these screens show that their
 * boards do not draw word for word.
 */
export const STATE_COPY_INSTITUTE_HOME = {
  // ---- IA-01 Overview (B2-01) ----
  'IA-01.loading': {
    screen: 'IA-01',
    state: 'The overview loading (announced in the header; skeleton rows below)',
    words: 'Loading your overview',
    basis:
      'Board 04 "State grammar" Loading formula (“Loading your reports”); B2-01 draws no loading frame (B7-01 f2 announces it in the header the same way)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-01.failed': {
    screen: 'IA-01',
    state: 'The overview failed to load (service unavailable; a test fault plan only)',
    words: 'We couldn’t load your overview',
    rule: 'Drawn as B2-02 f9 draws its failed state: the empty pattern with the failed icon, this title, “Nothing has changed. Try again.” and a primary “Try again” that reads again.',
    basis:
      'B2-02 f9 “We couldn’t load content access” (the Institute Admin boards’ failed formula); B2-01 draws no failed frame',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-01.singular': {
    screen: 'IA-01',
    state: 'An attention item that counts one student, or one day',
    words: null,
    rule: '“1 student has no access yet”, “1 student is waiting for a licence”, “Access plan ACC-0107 ends in 1 day” (“… in 0 days” on the last day), “1 day left”. The boards draw only plurals (12 / 3 students, 2 students, 15 days).',
    basis: 'B2-01 f0, f3, f7 plural forms; B2-02 f3, B2-03 f2 “15 days left”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-01.no-platform-code': {
    screen: 'IA-01',
    state: 'An attention item about a course BITS has given no platform code',
    words: null,
    rule: '“access plan ACC-0107” alone under an experiment not given to anyone; “A course has no course code from your institution” for the course. Every sample course has a platform code.',
    basis:
      'B2-01 f0 “ME ZG523 · access plan ACC-0107”, “ME ZG523 has no course code from your institution”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-01.term': {
    screen: 'IA-01',
    state: 'The status line of a plan whose term is not yearly',
    words: null,
    rule: '“Access plan ACC-0107 · 120 licences · Monthly, ends 7 Nov 2026” — the term as B7-03 words it (`planTermWords`, “Until a fixed date” for until-date, SA-07.term-until), then “, ends <date>”. B2-01 draws only “Yearly, ends 7 Oct 2027”.',
    basis: 'B2-01 f0 status line; B7-03 term words',
    status: 'provisional',
    decisions: ['VD-12', 'P1-10'],
  },
  'IA-01.not-rendered': {
    screen: 'IA-01',
    state: 'Attention rows and states whose drawn action opens a screen not built yet',
    words: null,
    rule: 'The row keeps its icon, title and line; the action is not drawn: “Request renewal” (IA-17 / IA-18 Requests), “View request status” (PU-10 from the workspace). “Add course code” opens IA-16 Course codes since Package 2B. “Open requests” (device requests, DEV-17) and “View report” (problem reports, P2-11) belong to items the service does not produce until those decisions are taken (PC-38).',
    basis: 'DEV-21 interim (links to unbuilt screens are not rendered); B2-01 f1, f3, f4, f7',
    status: 'provisional',
    decisions: ['DEV-21', 'DEV-17', 'P2-11'],
  },
  // ---- IA-02 Content access (B2-02) ----
  'IA-02.filters': {
    screen: 'IA-02',
    state: 'Search and Status narrowing the experiments',
    words: null,
    rule: 'Search matches the experiment’s name, the course’s platform code and the course’s name, ignoring case (B2-02 script `caView`); Status keeps the rows whose plan is Active, Ending soon or Ended — a paused plan’s rows show under “All statuses” only, as the board offers no Paused option. Both narrow the port’s one answer (`listContentAccess` takes no filter); a plan with no matching row is not drawn.',
    basis:
      'B2-02 f0 / f7 and its script (`rows.filter(… r.t + r.code + r.course … r.st === s.st)`)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-02.count-courses': {
    screen: 'IA-02',
    state: 'The count when the experiments span several courses',
    words: null,
    rule: '“3 experiments in 2 courses” — the board script writes “in 1 course” as a constant; the courses are counted as the experiments are.',
    basis: 'B2-02 script `count` (“… experiment(s) in 1 course”)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-02.not-in-plan': {
    screen: 'IA-02',
    state: 'An experiment with several published formats outside the plan',
    words: null,
    rule: '“AR and MR are published but not in your plan” — the formats joined in words; none: no line.',
    basis: 'B2-02 f0 “AR is published but not in your plan”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-02.several': {
    screen: 'IA-02',
    state: 'Several plans, or several courses in one plan',
    words: null,
    rule: 'One `section` per plan (newest first), each with its plan band; inside it one course group per course with its own table. The plan’s notice (ending soon, ended, paused) is drawn once, under its first course group’s head, where B2-02 f3 … f5 draw it. The header’s “Give students access” is drawn while any plan is active or ending soon; a row’s “Give access” while its own plan is.',
    basis: 'B2-02 f0, f3, f4, f5 (one plan, one course)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-02.not-rendered': {
    screen: 'IA-02',
    state: 'Drawn controls that open screens not built yet',
    words: null,
    rule: '“Request renewal” in the ending-soon and ended notices (IA-17 / IA-18) and “View request status” under “No content yet” (PU-10 from the workspace) are not drawn; the notices keep their words. The “Course codes” tab and the course group’s “Add code” open IA-16 since Package 2B.',
    basis: 'DEV-21 interim; B2-02 f0, f3, f4, f6',
    status: 'provisional',
    decisions: ['DEV-21'],
  },
  // ---- IA-03 Access plan (B2-03 f0 … f5) ----
  'IA-03.loading': {
    screen: 'IA-03',
    state: 'The access plan loading (screen readers)',
    words: 'Loading the access plan',
    basis:
      'Board 04 "State grammar" Loading formula (“Loading your reports”); B2-03 draws no loading frame',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-03.failed': {
    screen: 'IA-03',
    state: 'The access plan failed to load (service unavailable; a test fault plan only)',
    words: 'We couldn’t load this access plan',
    rule: 'As IA-01.failed: B2-02 f9’s failed pattern with “Nothing has changed. Try again.” and “Try again”.',
    basis: 'B2-02 f9 formula; B2-03 draws no failed frame',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-03.not-found': {
    screen: 'IA-03',
    state: 'An address that names no access plan of the Institute Admin’s institution',
    words: null,
    rule: 'The in-shell not-found page (PU-15), whether the plan does not exist or belongs to another institution — existence is not revealed (as SA-07).',
    basis: 'Board 08 "Page not found · workspace"; ADR-0005 record guards',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-03.given-group': {
    screen: 'IA-03',
    state: 'A student given access through a group grant',
    words: null,
    rule: '“Given”: “12 Oct 2026 · through the group ME ZG523 — Sem II”, the grant’s reference under it; one row per student the group grant reaches now. B2-03 draws only “9 Oct 2026 · individually”.',
    basis: 'B2-03 f1 “9 Oct 2026 · individually”; B2-06 “… through the group ME ZG523 — Sem II”',
    status: 'provisional',
    decisions: ['VD-12', 'OD-B2-01'],
  },
  'IA-03.history': {
    screen: 'IA-03',
    state: 'History lines B2-03 does not draw',
    words: null,
    rule: 'Newest first, the plan’s own history and its request’s “Request submitted” and “Request approved” lines (the payment lines fold into “Access activated”). A group grant: “ME ZG523 — Sem II given Shell-and-Tube Heat Exchanger” · “SACC-0311 · group grant”. A withdrawal: “Nikhil Bose’s access to Shell-and-Tube Heat Exchanger withdrawn” · when · who, the grant’s reference as the note. “Access restored by BITS” · date. An internal request’s approval: “Request approved · Internal” with no note; an activation without a payment: “Plan ACC-0098 created.”; “Request approved with changes · External” for an approval with changes. Other plan events are not written by the sample world and draw nothing until a board words them.',
    basis:
      'B2-03 f0 … f4 history; B2-06 “SACC-0311 · group grant”; B7-03 “Internal — no payment step.”',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-03.history-ended': {
    screen: 'IA-03',
    state: 'An ended plan’s history',
    words: null,
    rule: '“Plan ended” · its end date · “End of the yearly term.” is drawn first once the plan reads ended — from the plan’s end date, as nothing writes an “ended” event (no scheduler in the sample world). Other terms: “End of the monthly term.”, “End of the quarterly term.”, “End of the term.” (until a date).',
    basis: 'B2-03 f3 history',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-03.several': {
    screen: 'IA-03',
    state: 'A plan holding experiments of several courses, or several experiments',
    words: null,
    rule: '“Course” lists each course on its own line (“ME ZG523 · Thermodynamics & Heat Transfer”); the empty state names every experiment (“… give them A and B.”) and its button opens Give students access with the experiment chosen only when the plan holds one.',
    basis: 'B2-03 f0 (one course, one experiment)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'IA-03.not-rendered': {
    screen: 'IA-03',
    state: 'Drawn links that open screens not built in Package 2A',
    words: null,
    rule: '“From request REQ-0042” is plain text (PU-10 from the workspace is not built); the paragraph “Need more, or a renewal? Ask BITS from Requests” and the ended notice’s “Request renewal” are not drawn (IA-17 / IA-18 Requests).',
    basis: 'DEV-21 interim; B2-03 f0 … f5',
    status: 'provisional',
    decisions: ['DEV-21'],
  },
} as const satisfies Readonly<Record<string, StateCopyEntry>>;
