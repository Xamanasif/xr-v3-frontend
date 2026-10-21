import type { StateCopyEntry } from './state-copy';

/**
 * The state-copy entries of Phase 4A’s FA-10 Settings and FA-11 Preview (B4-06) — part of the one register (`state-copy.ts`,
 * VD-12): every state string or rule these screens show that their board does not draw word for
 * word, with its basis and the decisions it waits on. Decision ids never appear in visible copy.
 */
export const STATE_COPY_ASSESSMENT_SETTINGS = {
  // ---- FA-10 Assessment · Settings (B4-06 f0 … f4) -------------------------------------------
  'FA-10.draft-empty': {
    screen: 'FA-10',
    state: 'The Settings of a draft whose rules are not set (f3 “New draft · nothing pre-filled”)',
    words: null,
    rule: 'Every rule field is empty and no result option is chosen — nothing is pre-filled, ever. The name shows as saved: a draft always has one (“Enter a name to save a draft”), where f3 draws the name empty too.',
    basis:
      'B4-06 f3 and its note “For a new assessment every field is empty and no option is selected”; B4-04 “Enter a name to save a draft”',
    status: 'provisional',
    decisions: ['BC6', 'T-19'],
  },
  'FA-10.changed': {
    screen: 'FA-10',
    state: 'Whether a rule or the result release has been changed (the warnings’ condition)',
    words: null,
    rule: 'Compared with the record as last read: pass mark and attempts as typed (spaces ignored); the deadline and release date by the date and time they read as, so “14 Nov 2026 23:59” is the same as “14 Nov 2026, 23:59”; the result option by its choice. A name or introduction change is not a rule change.',
    basis:
      'B4-06 script `ruleChanged` (pass, attempts, deadline) and `relChanged` (option, release date)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-10.submitted-one': {
    screen: 'FA-10',
    state: 'Before saving a changed rule or result release, when one student has submitted',
    words: '1 student has submitted.',
    rule: 'Who submitted the current version, in the warnings and “How changes apply”, while the submissions are not read yet: once `listSubmissions` answers, the export’s words name them (“Rahul Verma has submitted.”).',
    basis: 'B4-06 f1, f2 “Rahul Verma has submitted.” — the service gives the count, not the names',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-10.submitted-many': {
    screen: 'FA-10',
    state: 'Before saving a changed rule or result release, when several students have submitted',
    words: '{n} students have submitted.',
    basis: 'B4-06 f1, f2 “Rahul Verma has submitted.”; no board draws several',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-10.new-version-warning.one': {
    screen: 'FA-10',
    state:
      'f1 “This makes a new version”: a pass mark, attempts or deadline changed after one submission',
    words: 'Their submission keeps the rules they answered under; new attempts use these.',
    basis:
      'B4-06 f1 “His submission keeps the rules he answered under; new attempts use these.” without a name or gendered pronoun',
    status: 'provisional',
    decisions: ['VD-12', 'OD-B4-13'],
  },
  'FA-10.new-version-warning.many': {
    screen: 'FA-10',
    state: 'f1 “This makes a new version” after several submissions',
    words: 'Their submissions keep the rules they answered under; new attempts use these.',
    basis: 'B4-06 f1, made plural',
    status: 'provisional',
    decisions: ['VD-12', 'OD-B4-13'],
  },
  'FA-10.saved-release-changed': {
    screen: 'FA-10',
    state: 'Saved, and the service answers that the result release changed',
    words: 'New attempts release their result {release}.',
    rule: '{release} is the rules summary’s words: “immediately after marking”, “after the deadline”, “on 20 Nov 2026, 09:00”. It follows the saved sentence.',
    basis:
      'B4-06 f2 (the release warning) and the B4-04 f4 rules summary “results: after the deadline”; B4-06 draws no message for it',
    status: 'provisional',
    decisions: ['VD-12', 'P4-06'],
  },
  'FA-10.saved-focus': {
    screen: 'FA-10',
    state: 'After any answer to “Save settings”',
    words: null,
    rule: 'The answer shows at the top of the form in `#Es-saved`, which takes focus (the board’s `focus(pid + "-saved")`); the warnings go until something is changed again. A refusal of the values shows the error summary instead, which takes focus.',
    basis: 'B4-06 script `save`',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-10.stale.title': {
    screen: 'FA-10',
    state: 'Save refused because the assessment changed elsewhere while it was being edited',
    words: 'This assessment was changed elsewhere',
    rule: 'The record is read again; every typed value stays; the warnings now compare with the current settings; the next save uses the current revision.',
    basis:
      'Appendix G P1-21 interim (“Refetch and render the current drawn state”); Appendix F §6.6 answers kept; B4-06 draws no conflict',
    status: 'provisional',
    decisions: ['VD-12', 'P1-21'],
  },
  'FA-10.stale.line': {
    screen: 'FA-10',
    state: 'The stale save’s next step',
    words:
      'Nothing of yours was saved and your values are still here. Save again to use them, or Cancel to see the current settings.',
    basis: 'Board 04 “State grammar” (what happened + reassurance + what to do)',
    status: 'provisional',
    decisions: ['VD-12', 'P1-21'],
  },
  'FA-10.policy-open.title': {
    screen: 'FA-10',
    state:
      'Save refused because whether this Faculty member may change the assessment is undecided (a co-teaching colleague’s assessment)',
    words: 'These settings can’t be saved yet',
    basis:
      'The service answers the open decision; board 04 “State grammar”; B4-06 draws no refusal',
    status: 'provisional',
    decisions: ['VD-12', 'OD-B4-17'],
  },
  'FA-10.policy-open.line': {
    screen: 'FA-10',
    state: 'The policy-open refusal’s line',
    words: 'Whether you can change this assessment hasn’t been decided yet. Nothing was saved.',
    basis: 'Board 04 “State grammar”; every value typed stays',
    status: 'provisional',
    decisions: ['VD-12', 'OD-B4-17'],
  },
  'FA-10.unavailable.title': {
    screen: 'FA-10',
    state: 'Saving failed for now (service unavailable)',
    words: 'Your settings didn’t save',
    basis:
      'Board 04 “State grammar” Failed formula; Appendix F §6.6 “command unavailable → nothing changes … answers kept”; B4-06 draws no failure',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-10.unavailable.line': {
    screen: 'FA-10',
    state: 'The failed save’s line',
    words: 'Nothing was changed and your values are still here. Try again.',
    basis: 'Board 04 “State grammar” (reassurance + what to do)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-10.cancel': {
    screen: 'FA-10',
    state: '“Cancel”',
    words: null,
    rule: 'Puts back the record’s values as last read and clears the errors and any message; nothing is sent and the page stays.',
    basis: 'B4-06 script `cancel` (restores `orig`, clears `errs` and `saved`)',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-10.gone': {
    screen: 'FA-10',
    state:
      'Save refused because the assessment is no longer there or no longer the Faculty member’s',
    words: null,
    rule: 'The in-shell not-found page (PU-15), as for an unknown address.',
    basis: 'Board 08 “Not found / not yours”; state-copy `FA-shared.not-found`',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-10.no-release-control': {
    screen: 'FA-10',
    state: 'Every state',
    words: null,
    rule: 'Settings configure when results release; nothing here releases a result, makes the assessment available or closes it.',
    basis:
      'B4-06 note “Not designed: … a ‘Make available’ or ‘close’ control”; B4-14 D4 (no release control)',
    status: 'provisional',
    decisions: ['T-18', 'T-21', 'T-22'],
  },

  // ---- FA-11 Assessment · Preview (B4-06 f5, f6) ---------------------------------------------
  'FA-11.view-address': {
    screen: 'FA-11',
    state: 'The view switch and the address',
    words: null,
    rule: 'Student view is the bare address; Answer key is `?view=key`. Switching replaces the address (no history entry), so Back leaves the page; any other `view` shows the Student view and the address becomes the bare one.',
    basis: 'Appendix A FA-11 “optional ?view=key” (rule T3); IA-20 `IA-20.view-address`',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-11.pinned': {
    screen: 'FA-11',
    state: 'A question whose bank version is newer than the one the assessment uses',
    words: null,
    rule: 'The preview shows the version the assessment pins; the newer one shows only after “Use updated version” on Questions. Previewing creates no attempt and saves nothing.',
    basis: 'B4-05 f8 “Use updated version”; B4-07 “assessments keep their version”; B4-06 f5',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-11.key-rows': {
    screen: 'FA-11',
    state: 'The answer key of a question without an explanation or marking guidance',
    words: null,
    rule: 'The row that would be empty is left out: no “Explanation” without one, no “Marking guidance” on a written question without it.',
    basis: 'B4-06 f6 draws every question with its rows filled',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-11.loading': {
    screen: 'FA-11',
    state: 'The preview loading (screen readers), below the record’s header and tabs',
    words: 'Loading the preview',
    basis: 'Board 04 “State grammar” Loading formula; `FA-shared.record-loading`',
    status: 'provisional',
    decisions: ['VD-12'],
  },
  'FA-11.policy-open.title': {
    screen: 'FA-11',
    state:
      'The preview of an assessment holding a colleague’s questions on a co-taught experiment (the service answers policy-open)',
    words: 'This preview isn’t available to you yet',
    rule: 'No question, answer or marking guidance is shown: whether co-teaching Faculty see each other’s questions is undecided (OD-B4-17, Q-10), as the question bank answers it. The tabs stay.',
    basis:
      'Board 08 “not available” pattern; Phase 4A review (the answer key was read without the question’s own rule)',
    status: 'provisional',
    decisions: ['VD-12', 'OD-B4-17'],
  },
  'FA-11.policy-open.line': {
    screen: 'FA-11',
    state: 'The policy-open preview’s next step',
    words:
      'It shows questions another faculty member wrote. Ask them, or use Questions to see what this assessment holds.',
    basis: 'Board 04 formula (what happened, what to do next); OD-B4-17',
    status: 'provisional',
    decisions: ['VD-12', 'OD-B4-17'],
  },
} as const satisfies Readonly<Record<string, StateCopyEntry>>;
