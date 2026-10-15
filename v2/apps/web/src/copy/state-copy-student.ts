import type { StateCopyEntry } from './state-copy';

/**
 * The state-copy entries of ST-01 Home, ST-02 My courses, ST-03 Course, ST-05 Experiment hub, ST-19 Experiment not available (boards B2-10 … B2-12) — Phase-2 Package 2A, part of the one
 * register (`state-copy.ts`, VD-12): every state string or rule these screens show that their
 * boards do not draw word for word.
 */
export const STATE_COPY_STUDENT = {
  // ---- ST-01 Home (B2-10; B2-13 f1, f4, f6) ----
  'ST-01.greeting': {
    screen: 'ST-01',
    state: 'The greeting above the Home',
    words: null,
    rule: '“Hello, <first name>”: the first word of the signed-in person’s name as the session reads it; the overline is the session’s institution name.',
    basis:
      'B2-10 f0 … f9 “Hello, Rahul” (Rahul Verma), B2-13 f6 “Hello, Priya” (Priya Natarajan); no board states the rule',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'ST-01.card': {
    screen: 'ST-01',
    state: 'Which experiment the Home’s first card names',
    words: null,
    rule: '“Continue where you left off” names the experiment the service’s `continue` names (the one last worked on, with each given format’s progress word, never a percentage). With nothing opened yet, “Start here” names the experiment of the first format item the service lists in Up next (only what the Student can open now). Neither: no card. Its button opens the experiment hub (ST-05).',
    basis:
      'B2-10 f1 (“Start here”, 9 Oct, nothing opened), f4 (“Continue where you left off”, later sample); StudentAccessService.getMyHome `continue`, `upNext`',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'ST-01.up-next': {
    screen: 'ST-01',
    state: 'What Up next lists',
    words: null,
    rule: 'The service’s Up next items in its order, leaving out the format items of the experiment the first card names (B2-10 f1, f4: “Nothing else is waiting for you right now.” beside that card), at most three, with “<n> of at most 3”. A format item of another experiment opens its hub (“Open experiment”). A feedback item’s “Give feedback” opens that format’s feedback (ST-16, Phase 3; the service lists it only for a format with its own completion and no feedback yet). An assessment item keeps its words; its “Open assessment” is not rendered until ST-11 is built (Phase 4, DEV-21). An assessment is named from the Student’s own assessments list.',
    basis:
      'B2-10 f1, f4, f5 (f5 is the pattern frame of the three item types: “Sample wording for later states”; it lists a format of the card’s own experiment, which f4 does not)',
    status: 'provisional',
    decisions: ['VD-12', 'DEV-21'],
  },
  'ST-01.loading': {
    screen: 'ST-01',
    state: 'The Home loading (screen readers)',
    words: 'Loading your experiments',
    basis:
      'B2-11 f2 (ST-04 “Loading your experiments”) reused; B2-10 draws no loading frame. Board 04 “State grammar” Loading formula',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'ST-01.failed': {
    screen: 'ST-01',
    state: 'The Home failed to load (service unavailable; a test fault plan only)',
    words: 'We couldn’t load your experiments',
    basis:
      'B2-11 f2 (ST-04 failed: “We couldn’t load your experiments” / “Nothing has changed. Try again.”) reused; B2-10 draws no failed frame',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'ST-01.earlier-only': {
    screen: 'ST-01',
    state:
      'Nothing is given now, only earlier work (the only grant withdrawn, or the access ended, after some work)',
    words: 'No experiments are given to you right now',
    rule: 'B2-10 f8 and B2-13 f1 name the experiment and the cause (“ended on 7 Oct 2027”, “Your institution withdrew it”); while SACC-14 is open the Student’s reads give neither (PC-23: no row, words or progress — only the course’s earlier-work flag), so the Home says what My courses says (B2-11 f7, f8 heading) and lists the course as earlier work. “See earlier work” is not rendered: Progress (ST-15, Phase 3) is built but has no earlier-work row to show while SACC-14 is open (`ST-15.earlier-only`).',
    basis:
      'B2-11 f7, f8 heading reused; B2-10 f8, B2-13 f1 (not reproducible: the cause and the name are not read); StudentAccessService.getMyHome `myCourses[].earlierWork`',
    status: 'provisional',
    decisions: ['SACC-14', 'VD-12'],
  },
  'ST-01.earlier-only.line': {
    screen: 'ST-01',
    state: 'The line under “No experiments are given to you right now” on the Home',
    words: 'Your earlier work is kept.',
    basis:
      'B2-11 f7 “Your earlier work is kept below.” and B2-10 f8 “Your earlier work is kept.” — the Home lists the course below in My courses',
    status: 'provisional',
    decisions: ['SACC-14', 'VD-12'],
  },
  'ST-01.no-courses-section': {
    screen: 'ST-01',
    state: 'Which states show the My courses section and “View all courses”',
    words: null,
    rule: 'As drawn: none before access (f0) and for an inactive account (f7); the course rows without “View all courses” when the institution is paused (f6) or only earlier work is left (f8); rows and “View all courses” otherwise (f1, f4, f9). A course of earlier work only has no “Open course” (its experiments are not listed while SACC-14 is open).',
    basis: 'B2-10 f0, f1, f4, f6, f7, f8, f9',
    status: 'provisional',
    decisions: ['VD-12', 'SACC-14'],
  },
  // ---- ST-02 My courses (B2-11) ----
  'ST-02.format-list': {
    screen: 'ST-02',
    state: 'Formats named in a sentence (rows, the hub’s Simulation card)',
    words: null,
    rule: 'One code alone (“WEB”), two joined by “and” (“WEB and VR”), three or more as “WEB, AR and VR”, in the v46 display order WEB · AR · VR · MR.',
    basis: 'B2-10 f1, B2-11 f0 “WEB and VR available”; B2-12 f0, f2; FORMAT_DISPLAY_ORDER (B8-03)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'ST-02.tabs': {
    screen: 'ST-02',
    state: 'The “Courses | All experiments” tab strip',
    words: null,
    rule: 'Package 2A did not render the strip (ST-04 not built, DEV-21). Since Package 2B it renders as drawn — “Courses” (ST-02, the bare address) and “All experiments” (ST-04, `?tab=experiments`) — under the page header on every state.',
    basis: 'B2-11 f0, f3, f5, f7 … f11, f13 (`nav.xr-tabs aria-label="My courses"`)',
    status: 'provisional',
    decisions: ['DEV-21'],
  },
  'ST-02.row-none-open': {
    screen: 'ST-02',
    state:
      'A course row whose experiments the Student cannot open now and is not drawn (an inactive account, a licence wait, an undecided overlap)',
    words: null,
    rule: 'The row shows its name and code only — no count or format clause, and “Open course” stays (its experiments are listed there with their own words). The shell banner says why for an inactive account (XS-08); the row has no word for a licence wait (contract gap in the sample adapter README) or an undecided overlap (OD-B2-01, OD-B2-02, GRP-05).',
    basis: 'B2-11 draws the paused row (f5) only; StudentAccessService.listMyCourses rows',
    status: 'provisional',
    decisions: ['VD-12', 'OD-B2-01', 'OD-B2-02', 'GRP-05'],
  },
  'ST-02.earlier-rows': {
    screen: 'ST-02',
    state: 'Earlier work (the only grant withdrawn, or the access ended, after some work)',
    words: null,
    rule: 'B2-11 f7 and f8 list each experiment of earlier work with its cause (“No longer given to you.”, “Access ended on 7 Oct 2027.”) and “View earlier work”; while SACC-14 is open the read keeps only the course’s earlier-work flag (PC-23), so “Earlier work” lists the course — its name and “<code> · earlier work kept” (B2-10 f8) — with no action. “View earlier work” is not rendered: Progress (ST-15, Phase 3) is built but the service gives it no earlier-work row while SACC-14 is open (`ST-15.earlier-only`), so the action would lead to nothing.',
    basis: 'B2-11 f7, f8; B2-10 f8; StudentAccessService.listMyCourses `earlierWork`',
    status: 'provisional',
    decisions: ['SACC-14', 'DEV-21'],
  },
  // ---- ST-03 Course (B2-11 f1, f6, f14) ----
  'ST-03.loading': {
    screen: 'ST-03',
    state: 'The course loading (screen readers)',
    words: 'Loading the course',
    basis: 'Board 04 “State grammar” Loading formula; B2-11 draws no course loading frame',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'ST-03.failed': {
    screen: 'ST-03',
    state: 'The course failed to load (service unavailable; a test fault plan only)',
    words: 'We couldn’t load this course',
    basis:
      'B2-11 f10 failed pattern (“We couldn’t load your courses” / “Nothing has changed. Try again.”); no course failed frame',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'ST-03.not-found': {
    screen: 'ST-03',
    state: 'A course address that names no course with an experiment given to the Student',
    words: null,
    rule: 'The workspace’s in-shell not-found page (PU-15), as the service answers not found; existence is not revealed.',
    basis: 'B2-11 draws no such frame; StudentAccessService.getMyCourse `not-found`; board 08',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'ST-03.no-experiments': {
    screen: 'ST-03',
    state: 'A course with earlier work only (reached by its address)',
    words: 'No experiments are given to you right now',
    rule: 'The header shows no count; the section shows this heading in place of rows (B2-11 f7 heading).',
    basis:
      'B2-11 f7, f8 heading reused; the read lists no experiment while SACC-14 is open (PC-23)',
    status: 'provisional',
    decisions: ['SACC-14', 'VD-12'],
  },
  'ST-03.inactive': {
    screen: 'ST-03',
    state: 'The course of an inactive Student',
    words: null,
    rule: 'As the paused course (B2-11 f6) with B2-10 f7’s words: the notice “Your account is inactive” / “You can’t open experiments until your institution reactivates your account. Your work is kept.”, each experiment’s formats off with “Your account is inactive. Your work is kept.”, no “Open”, no status pill.',
    basis:
      'B2-10 f7 words; B2-11 f6 pattern; the session banner (XS-08) carries the inactive account',
    status: 'provisional',
    decisions: ['VD-12', 'P2-09'],
  },
  'ST-03.inactive-row': {
    screen: 'ST-03',
    state: 'An experiment row of an inactive Student',
    words: 'Your account is inactive. Your work is kept.',
    basis: 'B2-10 f7 (“Your account is inactive”, “Your work is kept.”); B2-11 f6 row pattern',
    status: 'provisional',
    decisions: ['VD-12', 'P2-09'],
  },
  'ST-03.policy-open': {
    screen: 'ST-03',
    state:
      'An experiment whose open gate reaches an undecided rule (OD-B2-01 overlap, OD-B2-02 added after the group grant, GRP-05 removed after it)',
    words: 'Your access to this experiment hasn’t been settled yet.',
    rule: 'The row names the experiment with this line in place of formats and progress, and no “Open”: no can / can’t statement while the decision is open.',
    basis: 'No board draws it (B2-13 f8: “Nothing here says whether he can still open it”)',
    status: 'provisional',
    decisions: ['OD-B2-01', 'OD-B2-02', 'GRP-05'],
  },
  // ---- ST-05 Experiment hub (B2-12) ----
  'ST-05.loading': {
    screen: 'ST-05',
    state: 'The experiment loading (screen readers)',
    words: 'Loading the experiment',
    basis: 'Board 04 “State grammar” Loading formula; B2-12 draws no loading frame',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'ST-05.failed': {
    screen: 'ST-05',
    state: 'The experiment failed to load (service unavailable; a test fault plan only)',
    words: 'We couldn’t load this experiment',
    basis:
      'B2-11 f10 failed pattern (“We couldn’t load your courses” / “Nothing has changed. Try again.”); B2-12 draws no failed frame',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'ST-05.unbuilt': {
    screen: 'ST-05',
    state: 'The hub’s tabs and its actions (Phase 3)',
    words: null,
    rule: 'Since Phase 3 the tab strip renders Overview, Resources, Simulation and Progress (ST-06, ST-07, ST-10), the header’s one “Next step: …” line with its button (`ST-05.next-step`) and the cards’ actions (`ST-05.card-actions`). The Assessment tab and any assessment action lead to Phase-4 screens (ST-11 … ST-14) and are not rendered (DEV-21); the Assessment card keeps its words.',
    basis: 'B2-12 f0 … f3, f5; B3-01; B3-02',
    status: 'provisional',
    decisions: ['DEV-21'],
  },
  'ST-05.format-order': {
    screen: 'ST-05',
    state: 'The order of the header’s formats',
    words: null,
    rule: 'The formats given to the Student (the plan’s, published) first, then those not included for the institution, then those not available for the experiment — each group in the display order WEB · AR · VR · MR.',
    basis:
      'B2-12 f0, f2, f3 (WEB, VR, AR, MR for Shell-and-Tube); FORMAT_DISPLAY_ORDER (B8-03) within each group',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'ST-05.code': {
    screen: 'ST-05',
    state: 'The course code on the hub (overline, “Course”, the course crumb)',
    words: null,
    rule: 'The code the Student’s course row shows (T-17: the institution’s code once set, “MEC-523”; otherwise the platform code); the course name alone when neither is set.',
    basis:
      'B2-12 f0 (ME ZG523, before the institution’s code); B2-10 f9, B2-11 f11 (MEC-523); T-17',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'ST-05.resources-opened': {
    screen: 'ST-05',
    state: 'The Resources card once a resource has been opened',
    words: null,
    rule: '“<n> resources · <k> opened. <n − k> more to read.”; “<n> resources · all opened.” when every one is. B2-12 f1 names the resource and its date (“Lab brief opened on 12 Oct. 2 more to read.”), which the hub read does not give (a count only).',
    basis: 'B2-12 f0 (“3 resources · none opened yet.”), f1; ExperimentHub `resourceSummary`',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'ST-05.no-resources': {
    screen: 'ST-05',
    state: 'An experiment with no resources',
    words: 'No resources for this experiment yet.',
    basis: 'Board 04 “State grammar” Empty (“one line”); B2-12 draws three resources',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'ST-05.simulation': {
    screen: 'ST-05',
    state: 'The Simulation card’s words',
    words: null,
    rule: 'Nothing started: “<available> is / are available to you[; <format> is not available right now].” then each given format’s progress (“WEB not started · VR not started.”). Something started: the progress, then “Each format has its own progress.” No aggregate, no percentage, no lock.',
    basis: 'B2-12 f0, f1, f2',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'ST-05.assessment-set': {
    screen: 'ST-05',
    state: 'The Assessment card when the faculty has set one',
    words: null,
    rule: 'The Student’s assessment status in B4-11’s words (“To do”, “Attempt in progress”, “Waiting for marking”, “Result not released yet”, “Result ready”); no marks; “Open assessment” is not rendered (Phase 4, DEV-21).',
    basis: 'B2-12 draws only “none set” (f0 … f3); B4-11 f0 … f4 status words',
    status: 'provisional',
    decisions: ['VD-12', 'DEV-21'],
  },
  'ST-05.inactive': {
    screen: 'ST-05',
    state: 'The hub of an inactive Student',
    words: null,
    rule: 'As the paused hub (B2-12 f3): the given formats off, the Resources and Simulation cards with the inactive line and “Nothing to do here yet.”.',
    basis: 'B2-12 f3 pattern; the session banner (XS-08) carries the inactive account',
    status: 'provisional',
    decisions: ['VD-12', 'P2-09'],
  },
  'ST-05.inactive-format': {
    screen: 'ST-05',
    state: 'A given format of an inactive Student (the header)',
    words: 'Inactive',
    basis: 'B2-12 f3 “Paused” pattern; board 05 XS-08 “Your account is inactive.”',
    status: 'provisional',
    decisions: ['VD-12', 'P2-09'],
  },
  'ST-05.inactive-resources': {
    screen: 'ST-05',
    state: 'The Resources card of an inactive Student',
    words: 'Not available while your account is inactive.',
    basis: 'B2-12 f3 “Not available while your institution’s access is paused.” pattern',
    status: 'provisional',
    decisions: ['VD-12', 'P2-09'],
  },
  'ST-05.inactive-simulation': {
    screen: 'ST-05',
    state: 'The Simulation card of an inactive Student',
    words: 'Not available while your account is inactive. Your progress is kept.',
    basis: 'B2-12 f3 “… Your progress is kept.” pattern',
    status: 'provisional',
    decisions: ['VD-12', 'P2-09'],
  },
  'ST-05.format-policy-open': {
    screen: 'ST-05',
    state: 'A format whose availability reaches an undecided rule',
    words: 'Not settled yet',
    basis: 'No board draws it; contract `formatAvailabilityOrOpen` `{ policyOpen }`',
    status: 'provisional',
    decisions: ['OD-B2-01', 'OD-B2-02', 'GRP-05', 'D-26'],
  },
  'ST-05.what-you-need': {
    screen: 'ST-05',
    state: 'The “What you need” list',
    words: null,
    rule: 'One line per given format: “<code> — <the format’s device needs>” with the first letter lower-cased, as B2-12 writes them.',
    basis:
      'B2-12 f0 (“WEB — laptop or desktop with a current web browser”, “VR — supported VR headset”)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  // ---- ST-19 Experiment not available (B2-11 f12, B2-12 f4, f6; B2-13 f3) ----
  'ST-19.sacc-14': {
    screen: 'ST-19',
    state:
      'The hub answers policy-open SACC-14 (the only grant withdrawn, or the access ended: which pages stay readable is open)',
    words: null,
    rule: 'The drawn “no longer given” message (B2-12 f4, B2-13 f3): “This experiment is no longer given to you” / “Your institution no longer gives you <name>. Your work is kept.” with “Back to My courses” and Help. It states only that the experiment no longer reaches the Student — nothing about which earlier pages can be read. The access-ended message (B2-12 f6, “It ended on <date>”) needs the cause and the date, which the answer does not carry while SACC-14 is open (PC-23).',
    basis: 'B2-12 f4, f6; B2-13 f3; contract PC-23',
    status: 'provisional',
    decisions: ['SACC-14'],
  },
  'ST-19.unnamed': {
    screen: 'ST-19',
    state: 'An experiment the public catalogue does not name (unknown or not published)',
    words:
      'Your institution hasn’t given you this experiment. Experiments you can open are in My courses.',
    basis:
      'B2-11 f12 with “this experiment” for the name (the hub answers “not given” for an unknown or unpublished one, so existence is not revealed)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'ST-19.no-longer-unnamed': {
    screen: 'ST-19',
    state: '“No longer given” for an experiment the public catalogue does not name',
    words: 'Your institution no longer gives you this experiment. Your work is kept.',
    basis: 'B2-12 f4 with “this experiment” for the name',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'ST-19.ended-line': {
    screen: 'ST-19',
    state: 'The access-ended message without its date (a refusal carries none)',
    words: 'Your earlier work is kept.',
    basis:
      'B2-12 f6 “It ended on 7 Oct 2027. Your earlier work is kept.” without the date sentence',
    status: 'provisional',
    decisions: ['SACC-14', 'VD-12'],
  },
  'ST-19.ended-unnamed': {
    screen: 'ST-19',
    state: 'The access-ended title for an experiment the public catalogue does not name',
    words: 'Your access to this experiment has ended',
    basis: 'B2-12 f6 with “this experiment” for the name',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'ST-19.undecided': {
    screen: 'ST-19',
    state:
      'The hub answers policy-open OD-B2-01, OD-B2-02 or GRP-05 (an undecided group-grant rule)',
    words: 'Your access to this experiment hasn’t been settled yet',
    rule: 'With the line from `ST-19.undecided.line`, “Back to My courses” and Help; no can / can’t statement.',
    basis:
      'No board draws it (B2-13 f8 “Nothing here says whether he can still open it”); board 08 message template',
    status: 'provisional',
    decisions: ['OD-B2-01', 'OD-B2-02', 'GRP-05'],
  },
  'ST-19.undecided.line': {
    screen: 'ST-19',
    state: 'The line of the undecided message',
    words: 'Your institution’s access rules for it are still being decided. Your work is kept.',
    basis: 'Board 08 message template (one sentence: why, and what still holds)',
    status: 'provisional',
    decisions: ['OD-B2-01', 'OD-B2-02', 'GRP-05'],
  },
  'ST-19.other-refusals': {
    screen: 'ST-19',
    state:
      'The hub refused as paused, inactive or waiting for a licence (not answered by the read today: those are read-only hubs)',
    words: null,
    rule: 'Paused: B2-10 f6’s “You can’t open experiments right now” / its line; inactive: B2-10 f7’s “Your account is inactive” / its line; waiting for a licence and a format refusal: the “isn’t available” message (B2-11 f12). Each with “Back to My courses” and Help.',
    basis: 'B2-10 f6, f7; B2-11 f12; the gate’s refusal codes (Appendix C M15)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'ST-19.tone': {
    screen: 'ST-19',
    state: 'The message icon’s tint',
    words: null,
    rule: 'Neutral, with the Not available icon (minus) and, for the end of access, the clock — as B2-11 f12 and B2-12 f4, f6 draw them. The amber “paused” tone (DEV-16) is owner-deferred and no ST-19 frame of these boards draws a paused message.',
    basis: 'B2-11 f12; B2-12 f4, f6; owner decision record DEV-16 (deferred to ST-19)',
    status: 'provisional',
    decisions: ['DEV-16'],
  },
  'ST-05.waiting': {
    screen: 'ST-05',
    state:
      'A supplied licence wait closes the experiment for now (later sample only; the gate refuses “waiting for a licence”)',
    words: null,
    rule: 'The hub header keeps “Available to you” for the given formats (as B3-02 draws it); the Simulation step reads “No licence is available for you on <plan> right now.” (B3-02’s words) with “Nothing to do here yet.”; ST-03’s experiment row shows its given formats off with the same sentence and keeps “Open”. Home and My courses count only what opens now (Phase-0 rows), so a waiting experiment is not counted there.',
    basis:
      'B3-02 “Waiting for a licence · Arun Kumar (later sample)” (format chooser, Phase 3); PC-45; independent review of Package 2A',
    status: 'provisional',
    decisions: ['D7', 'VD-12'],
  },
} as const satisfies Readonly<Record<string, StateCopyEntry>>;
