/**
 * The words of the Institute Admin's access screens (IA-04, IA-05, IA-07, IA-14) are the
 * owner-approved export's (V3 Refined B, design/v3-refined-b/roles/IA-v1 `project/Main.dc.html`):
 * each drawn phrase is in its template or script verbatim, and each composed line takes the
 * script's form with the records' values (pinned here with the export's own sample values). Where
 * the export still names a record by its id, the line is the export's without the id, named by
 * content (state-copy `IA-04.no-reference`): those lines are pinned to the export's line they
 * replace. No phrase names a record by its internal reference.
 */
import type { GrantDisplayStatus } from '@xr/domain';
import { describe, expect, it } from 'vitest';

import { iaExport } from '@/test-support/boards';

import {
  addedFlash,
  addedWords,
  addLabel,
  addNoteWithGrants,
  alreadyHasWords,
  alsoInGroupWords,
  courseWords,
  createdLine,
  deactivateBody,
  deactivateTitle,
  firstOf,
  groupChosenWords,
  givenIndividuallyNote,
  givenThroughGroupWords,
  IA04,
  IA04_NONE,
  IA04_VIA,
  IA05,
  IA07,
  IA14,
  inactiveSinceLine,
  licencesLineWords,
  longCalendarDay,
  memberCountWords,
  memberHasItWords,
  memberInactiveWords,
  membersCanOpenWords,
  membersWords,
  memberWaitingWords,
  noExperimentsTitle,
  noLicenceNote,
  planEndedLine,
  planEndedNote,
  planLineWords,
  reactivateAccountLine,
  reactivateBody,
  reactivateTitle,
  removeBody,
  removedFlash,
  removeTitle,
  rowsShownWords,
  seesItWords,
  selectedWords,
  selectionLine,
  selectionPlanWords,
  studentEyebrow,
  studentsChosenWords,
  summaryFormatsWords,
  WITHDRAW,
  withdrawAlsoBody,
  withdrawAlsoNote,
  withdrawAlsoTitle,
  withdrawAria,
  withdrawnAlsoFlash,
  withdrawnNote,
  withdrawnOnlyFlash,
  withdrawOnlyBody,
} from './ia-access';
import { grantWords, wordsOf } from './flow-state-words';
import {
  formatsFromAccessPlanLabel,
  formatsFromPlanLabel,
  IA_PAUSED_READ_ONLY,
  iaListText,
  iaPlural,
  removeFilterLabel,
  showingLabel,
  studentCountLabel,
  viaGroupLabel,
} from './ia-shared';

const IA = iaExport('Main.dc.html');
const TEMPLATE = IA.slice(0, IA.indexOf('<script type="text/x-dc"'));
const SCRIPT = IA.slice(IA.indexOf('<script type="text/x-dc"'));
/** The markup with its tags removed and `&amp;` read, then the raw source (attributes, script). */
const WORDS = `${TEMPLATE.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&')}\n${IA}`;

const IA_REFERENCE = /\b(?:REQ|ACC|SACC|GRP|FMAP|UPD|DTR|SUP|SUB)-\d+/;

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

/**
 * Lines that are not verbatim in the export, each pinned below: the export's id taken out, or a
 * composed form whose parts are the script's.
 */
const NOT_VERBATIM = new Set<string>([
  IA05.nothingHeld.approved,
  IA07.foot,
  IA07.noExperimentsPaused,
  IA07.noExperimentsEnded,
]);

/** Every grant display status the service answers. */
const GRANT_DISPLAYS = [
  'active',
  'waiting-for-a-licence',
  'student-inactive',
  'withdrawn',
  'individual-grant-withdrawn',
  'access-ended',
  'paused',
] as const satisfies readonly GrantDisplayStatus[];

const DRAWN = [
  IA_PAUSED_READ_ONLY,
  // A grant's status words (the export's `RST`), as the shared status model writes them.
  ...GRANT_DISPLAYS.map((display) => wordsOf(grantWords(display)) ?? display),
  ...strings(IA04),
  ...strings(IA04_VIA.map(([, label]) => label)),
  ...strings(IA04_NONE),
  ...strings(WITHDRAW),
  ...strings(IA05),
  ...strings(IA07),
  ...strings(IA14),
].filter((phrase) => !NOT_VERBATIM.has(phrase));

describe('the access screens’ words are the export’s', () => {
  it.each(DRAWN)('“%s”', (phrase) => {
    expect(WORDS).toContain(phrase);
  });

  it('the script’s forms: plural, first name, lists and formats', () => {
    expect(SCRIPT).toContain(
      "plural(n, one, many) { return n + ' ' + (n === 1 ? one : (many || one + 's')); }",
    );
    expect(SCRIPT).toContain(
      "first(n) { return String(n || '').replace(/^(Dr|Prof\\.)\\s+/, '').split(' ')[0]; }",
    );
    expect([iaPlural(1, 'student'), iaPlural(7, 'student')]).toEqual(['1 student', '7 students']);
    expect([firstOf('Rahul Verma'), firstOf('Dr S. Ranganathan')]).toEqual(['Rahul', 'S.']);
    expect([iaListText(['A']), iaListText(['A', 'B', 'C'])]).toEqual(['A', 'A, B and C']);
    expect(longCalendarDay('2027-10-07')).toBe('7 October 2027');
  });

  it('IA-04: the toolbar, the segments’ status line, the group head and the rows', () => {
    expect(SCRIPT).toContain("shownText: 'Showing ' + list.length + ' of ' + cur.n");
    expect(showingLabel(1, 7)).toBe('Showing 1 of 7');
    expect(SCRIPT).toContain(
      "liveText: this.plural(list.length, 'row') + ' shown' + (seg !== 'current' ? ' · ' + cur.label : '')",
    );
    expect(rowsShownWords(7, null)).toBe('7 rows shown');
    expect(rowsShownWords(1, 'Waiting for a licence')).toBe('1 row shown · Waiting for a licence');
    expect(SCRIPT).toContain("label: 'Search: “' + U.q.trim() + '”'");
    expect(SCRIPT).toContain("c.aria = 'Remove filter ' + c.label;");
    expect(removeFilterLabel('Given individually')).toBe('Remove filter Given individually');
    expect(SCRIPT).toContain(
      "fmAria: 'Formats from your access plan: ' + (fm.join(', ') || 'none'), n: this.plural(rows.length, 'student')",
    );
    expect(formatsFromAccessPlanLabel(['WEB', 'VR'])).toBe(
      'Formats from your access plan: WEB, VR',
    );
    expect(studentCountLabel(7)).toBe('7 students');
    expect(SCRIPT).toContain(
      "fmAria: 'Formats from your plan: ' + (x.fmtsOf[r.exp] || []).join(', ')",
    );
    expect(formatsFromPlanLabel(['WEB', 'VR'])).toBe('Formats from your plan: WEB, VR');
    expect(SCRIPT).toContain("viaText: isInd ? 'Individually' : 'Group: ' + (G ? G.name : '')");
    expect(viaGroupLabel('ME ZG523 — Sem II')).toBe('Group: ME ZG523 — Sem II');
    expect(SCRIPT).toContain(
      "alsoText: otherG ? 'Also in ' + otherG.name + ', which has this experiment' + (r.ind && r.ind.wd ? ' · not changed' : '') : ''",
    );
    expect(alsoInGroupWords('ME ZG523 — Sem II', false)).toBe(
      'Also in ME ZG523 — Sem II, which has this experiment',
    );
    expect(alsoInGroupWords('ME ZG523 — Sem II', true)).toBe(
      'Also in ME ZG523 — Sem II, which has this experiment · not changed',
    );
    expect(SCRIPT).toContain("wdText: wdReason ? 'Withdrawn ' + this.fDate(wdReason.at) : ''");
    expect(TEMPLATE).toContain('{{ r.wdText }} · {{ r.reason }}');
    expect(withdrawnNote('12 Oct 2026', 'Given by mistake.')).toBe(
      'Withdrawn 12 Oct 2026 · “Given by mistake.”',
    );
    expect(SCRIPT).toContain(
      "wdAria: otherG ? 'Withdraw ' + S.n + '’s individual grant for ' + E.t : 'Withdraw ' + S.n + '’s access to ' + E.t",
    );
    expect(withdrawAria('Rahul Verma', 'Shell-and-Tube Heat Exchanger', true)).toBe(
      'Withdraw Rahul Verma’s individual grant for Shell-and-Tube Heat Exchanger',
    );
    expect(withdrawAria('Rahul Verma', 'Shell-and-Tube Heat Exchanger', false)).toBe(
      'Withdraw Rahul Verma’s access to Shell-and-Tube Heat Exchanger',
    );
  });

  it('the waiting note names the plan by content (the export: by its id)', () => {
    expect(SCRIPT).toContain(
      "waitText: 'No licence is available for ' + this.first(S.n) + ' on ' + (W.plan ? W.plan.id : 'the plan') + ' right now.'",
    );
    expect(noLicenceNote('Arun Kumar')).toBe(
      'No licence is available for Arun on your access plan right now.',
    );
  });

  it('IA-04 Withdraw: titles, bodies, the note and the flashes (the grant named by who and when)', () => {
    expect(SCRIPT).toContain(
      "title: other ? 'Withdraw ' + S.n + '’s individual grant?' : 'Withdraw access?'",
    );
    expect(withdrawAlsoTitle('Rahul Verma')).toBe('Withdraw Rahul Verma’s individual grant?');
    expect(SCRIPT).toContain(
      "body: other ? 'This withdraws the access you gave ' + S.n + ' individually on ' + this.fDate(G.at) + '. Their work is kept, and the grant stays in the access history.' : 'This is ' + S.n + '’s only grant for ' + E + ', so ' + f + ' will no longer be able to open it. Their work is kept, and the grant stays in the access history.'",
    );
    expect(withdrawAlsoBody('Rahul Verma', '9 Oct 2026')).toBe(
      'This withdraws the access you gave Rahul Verma individually on 9 Oct 2026. Their work is kept, and the grant stays in the access history.',
    );
    expect(withdrawOnlyBody('Rahul Verma', 'Shell-and-Tube Heat Exchanger')).toBe(
      'This is Rahul Verma’s only grant for Shell-and-Tube Heat Exchanger, so Rahul will no longer be able to open it. Their work is kept, and the grant stays in the access history.',
    );
    // The export adds "(… joined after that grant was given)": not held by the reads (reported).
    expect(SCRIPT).toContain(
      "note: other ? f + ' is also in ' + other.gname + ', which has ' + E + ' through its own group grant' + (other.late ?",
    );
    expect(SCRIPT).toContain(
      "'. Withdrawing this individual grant doesn’t change the group grant.' : ''",
    );
    expect(
      withdrawAlsoNote('Rahul Verma', 'ME ZG523 — Sem II', 'Shell-and-Tube Heat Exchanger'),
    ).toBe(
      'Rahul is also in ME ZG523 — Sem II, which has Shell-and-Tube Heat Exchanger through its own group grant. Withdrawing this individual grant doesn’t change the group grant.',
    );
    expect(SCRIPT).toContain(
      "const msg = other ? 'The individual grant for ' + S.n + ' was withdrawn. ' + this.first(S.n) + ' is still in ' + other.gname + ', and its group grant is not changed.' : 'Access withdrawn. That was ' + S.n + '’s only grant for ' + E + ', so ' + this.first(S.n) + ' can no longer open it. Their work is kept.';",
    );
    expect(withdrawnAlsoFlash('Rahul Verma', 'ME ZG523 — Sem II')).toBe(
      'The individual grant for Rahul Verma was withdrawn. Rahul is still in ME ZG523 — Sem II, and its group grant is not changed.',
    );
    expect(withdrawnOnlyFlash('Rahul Verma', 'Shell-and-Tube Heat Exchanger')).toBe(
      'Access withdrawn. That was Rahul Verma’s only grant for Shell-and-Tube Heat Exchanger, so Rahul can no longer open it. Their work is kept.',
    );
  });

  it('IA-05: the steps, the selection, the choices and the review', () => {
    expect(SCRIPT).toContain("over: step < 4 ? 'Step ' + step + ' of 3' : 'Give students access'");
    expect(SCRIPT).toContain("sr: step > i ? ', done' : step === i ? ', current step' : ''");
    expect(SCRIPT).toContain(
      "if (expIds.length) parts.push(this.plural(expIds.length, 'experiment')); if (G0.who === 'grp' && grp) parts.push(grp.name); else if (G0.who === 'stu' && nSel) parts.push(this.plural(nSel, 'student')); return parts.length ? parts.join(' · ') : 'Nothing chosen yet';",
    );
    expect(selectionLine(1, '2 students')).toBe('1 experiment · 2 students');
    expect(selectionLine(0, null)).toBe('Nothing chosen yet');
    expect(SCRIPT).toContain(
      "selCount: nSel === 1 ? '1 student selected' : nSel + ' students selected'",
    );
    expect([selectedWords(1), selectedWords(2)]).toEqual([
      '1 student selected',
      '2 students selected',
    ]);
    expect(SCRIPT).toContain(
      "why: off ? 'Inactive — can’t be given access' : hasAll ? 'Already has ' + this.listText(",
    );
    expect(alreadyHasWords(['Shell-and-Tube Heat Exchanger'])).toBe(
      'Already has Shell-and-Tube Heat Exchanger',
    );
    expect(SCRIPT).toContain(
      "sub: g.members.length ? this.plural(g.members.length, 'member') : 'No members yet'",
    );
    expect([membersWords(7), membersWords(0)]).toEqual(['7 members', 'No members yet']);
    expect(SCRIPT).toContain(
      "(nSel ? selIds.slice(0, 3).map(id => x.stu[id].n).join(', ') + (nSel > 3 ? ' and ' + (nSel - 3) + ' more' : '') : 'Not chosen yet')",
    );
    expect(studentsChosenWords(['A', 'B', 'C', 'D', 'E'])).toBe('A, B, C and 2 more');
    expect(SCRIPT).toContain("grp.name + ' (' + this.plural(grp.members.length, 'member') + ')'");
    expect(groupChosenWords('ME ZG523 — Sem II', 7)).toBe('ME ZG523 — Sem II (7 members)');
    expect(SCRIPT).toContain("this.fmtsText(fmtsAll) + ' — from your access plan' : '—'");
    expect(summaryFormatsWords(['WEB', 'VR'])).toBe('WEB and VR — from your access plan');
    expect(SCRIPT).toContain("course: course + ' — ' + W.courses[course].name");
    expect(courseWords('ME ZG523', 'Thermodynamics & Heat Transfer')).toBe(
      'ME ZG523 — Thermodynamics & Heat Transfer',
    );
    expect(TEMPLATE).toContain('Also published in {{ V.courseCode }} — not in your access plan');
    expect(SCRIPT).toContain(
      "t: S.n + ' → ' + gets.map(e => W.cat[e].t).join(', ') + ' → ' + (w ? 'Waiting for a licence' : 'Active')",
    );
    expect(createdLine('Rahul Verma', ['Shell-and-Tube Heat Exchanger'], 'Active')).toBe(
      'Rahul Verma → Shell-and-Tube Heat Exchanger → Active',
    );
    expect(SCRIPT).toContain(
      "t: this.plural(now.length, 'member') + (now.length === 1 ? ' can' : ' can') + ' open it straight away'",
    );
    expect([membersCanOpenWords(1), membersCanOpenWords(5)]).toEqual([
      '1 member can open it straight away',
      '5 members can open it straight away',
    ]);
    expect(SCRIPT).toContain("t: m.n + ' is waiting for a licence'");
    expect(memberWaitingWords('Arun Kumar')).toBe('Arun Kumar is waiting for a licence');
    expect(SCRIPT).toContain(
      "t: m.n + ' already has it ' + (g && g.kind === 'ind' ? 'individually' : 'through another group') + '. That grant isn’t changed.'",
    );
    expect(memberHasItWords('Rahul Verma')).toBe(
      'Rahul Verma already has it individually. That grant isn’t changed.',
    );
    expect(SCRIPT).toContain("t: m.n + ' is inactive and can’t open experiments while inactive'");
    expect(memberInactiveWords('Sneha Reddy')).toBe(
      'Sneha Reddy is inactive and can’t open experiments while inactive',
    );
    expect(SCRIPT).toContain(
      "note: c.wait ? 'No licence is available for ' + this.first(S.n) + ' on ' + P.id + ' right now.' : this.first(S.n) + ' sees it in My courses with ' + this.fmtsText(x.fmtsOf[c.exp]) + '.'",
    );
    expect(seesItWords('Rahul Verma', ['WEB', 'VR'])).toBe(
      'Rahul sees it in My courses with WEB and VR.',
    );
    expect(SCRIPT).toContain("linkT: 'Open ' + S.n");
    expect(TEMPLATE).toContain(
      'It ended on {{ V.endText }}, so its experiments can’t be given to students. Ask BITS for a renewal.',
    );
    expect(SCRIPT).toContain('endText: P ? this.fFull(P.end)');
    expect(planEndedLine('2027-10-07')).toBe(
      'It ended on 7 October 2027, so its experiments can’t be given to students. Ask BITS for a renewal.',
    );
  });

  it('IA-05: the plan named by content where the export writes its id', () => {
    expect(SCRIPT).toContain(
      "planLine: P.id + ' · ' + this.planSt(x.pst)[1] + ' · ' + P.lic + ' licences · ends ' + this.fDate(P.end)",
    );
    expect(planLineWords('Active', 120, '7 Oct 2027')).toBe(
      'Active · 120 licences · ends 7 Oct 2027',
    );
    expect(SCRIPT).toContain("sumPlan: P.id + ' · ' + course");
    expect(selectionPlanWords('ME ZG523')).toBe('Your access plan · ME ZG523');
    expect(SCRIPT).toContain(
      "licLine: 'Access plan ' + P.id + ' · ' + P.lic + ' licences · ' + P.term + ', ends ' + this.fDate(P.end)",
    );
    expect(TEMPLATE).toContain('<p class="rk-hint">Licences: {{ V.licLine }}</p>');
    expect(licencesLineWords(120, 'Yearly', '7 Oct 2027')).toBe(
      'Licences: Your access plan · 120 licences · Yearly, ends 7 Oct 2027',
    );
    expect(TEMPLATE).toContain(
      'Experiments appear in Content access when BITS activates your access. Request REQ-0042 is approved — payment required.',
    );
    expect(IA05.nothingHeld.approved).toBe('Your request is approved — payment required.');
    expect(TEMPLATE).toContain('>Access plan {{ V.planId }} has ended</h1>');
    expect(IA05.ended.title).toBe(IA04.endedTitle);
  });

  it('IA-07: the head, the empty state, the account, the dialogs and the history', () => {
    expect(TEMPLATE).toContain('<p class="rk-eyebrow">Student · {{ V.id }}</p>');
    expect(studentEyebrow('GIT-2026-0418')).toBe('Student · GIT-2026-0418');
    expect(TEMPLATE).toContain('{{ V.first }} hasn’t been given any experiments yet');
    expect(noExperimentsTitle('Rahul Verma')).toBe('Rahul hasn’t been given any experiments yet');
    expect(SCRIPT).toContain(
      "'Experiments can’t be given while your access plan is ' + (x.pst === 'paused' ? 'paused.' : 'ended.')",
    );
    expect(IA07.noExperimentsPaused).toBe(
      'Experiments can’t be given while your access plan is paused.',
    );
    expect(IA07.noExperimentsEnded).toBe(
      'Experiments can’t be given while your access plan is ended.',
    );
    expect(SCRIPT).toContain(
      "inactiveD: lastDe ? 'Inactive since ' + this.fDate(lastDe.at) + ' · ' + lastDe.by + ': “' + lastDe.reason + '” ' + f + ' can’t open experiments until the account is reactivated.'",
    );
    expect(
      inactiveSinceLine('8 Oct 2026', 'Meera Iyer', 'Left the programme.', 'Sneha Reddy'),
    ).toBe(
      'Inactive since 8 Oct 2026 · Meera Iyer: “Left the programme.” Sneha can’t open experiments until the account is reactivated.',
    );
    expect(SCRIPT).toContain(
      "acctText: inactive ? 'Reactivating lets ' + f + ' open the experiments they’ve been given again, while your access plan allows it.'",
    );
    expect(reactivateAccountLine('Sneha Reddy')).toBe(
      'Reactivating lets Sneha open the experiments they’ve been given again, while your access plan allows it.',
    );
    expect(SCRIPT).toContain("v.offText = r.shown === 'inactive' ? f + '’s account is inactive.'");
    expect(SCRIPT).toContain(
      "'Access plan ' + (P ? P.id : '') + ' ended on ' + (P ? this.fDate(P.end) : '') + '.'",
    );
    expect(planEndedNote('7 Oct 2027')).toBe('Your access plan ended on 7 Oct 2027.');
    expect(TEMPLATE).toContain(
      'Formats come from access plan {{ V.planId }}; they are never chosen per student.',
    );
    expect(IA07.foot).toBe(IA04.foot.slice(IA04.foot.indexOf('Formats')));
    expect(SCRIPT).toContain(
      "added: S.added ? this.fDate(S.added.at) + ' · ' + (S.added.how === 'import' ? 'imported by ' : 'added by ') + S.added.by",
    );
    expect(addedWords('8 Oct 2026', 'import', 'Meera Iyer')).toBe(
      '8 Oct 2026 · imported by Meera Iyer',
    );
    expect(SCRIPT).toContain(
      "title: 'Deactivate ' + S.n + '’s account?', role: 'alertdialog', body: f + ' will see that the account is inactive and won’t be able to open any experiments until you reactivate it. Work and access history are kept.'",
    );
    expect(deactivateTitle('Priya Natarajan')).toBe('Deactivate Priya Natarajan’s account?');
    expect(deactivateBody('Priya Natarajan')).toBe(
      'Priya will see that the account is inactive and won’t be able to open any experiments until you reactivate it. Work and access history are kept.',
    );
    expect(SCRIPT).toContain("title: 'Reactivate ' + S.n + '’s account?'");
    expect(reactivateTitle('Priya Natarajan')).toBe('Reactivate Priya Natarajan’s account?');
    expect(SCRIPT).toContain(
      "'The account becomes active again. Experiments from access plan ' + W.plan.id + ' stay closed because the plan has ended.' : 'The account becomes active again, and the experiments ' + f + ' has been given open again.'",
    );
    expect(reactivateBody('Priya Natarajan', false)).toBe(
      'The account becomes active again, and the experiments Priya has been given open again.',
    );
    expect(reactivateBody('Priya Natarajan', true)).toBe(
      'The account becomes active again. Experiments from your access plan stay closed because the plan has ended.',
    );
    expect(SCRIPT).toContain(
      "n: 'Individually · ' + this.fmtsText(x.fmtsOf[g.exp]) + (W.plan ? ' from ' + W.plan.id : '') + (g.wait ? ' · waiting for a licence' : '')",
    );
    expect(givenIndividuallyNote(['WEB', 'VR'], false)).toBe(
      'Individually · WEB and VR from your access plan',
    );
    expect(SCRIPT).toContain("w: 'Given ' + E + ' through the group ' + (G ? G.name : g.gid)");
    expect(givenThroughGroupWords('Shell-and-Tube Heat Exchanger', 'ME ZG523 — Sem II')).toBe(
      'Given Shell-and-Tube Heat Exchanger through the group ME ZG523 — Sem II',
    );
  });

  it('IA-14: the count, the add panel, the flashes and the remove dialog', () => {
    expect(SCRIPT).toContain(
      "count: G.members.length ? this.plural(G.members.length, 'member') : 'No members yet'",
    );
    expect([memberCountWords(7), memberCountWords(0)]).toEqual(['7 members', 'No members yet']);
    expect(SCRIPT).toContain(
      "addNote: grants.length ? 'This group already has ' + this.listText(expNames) + '. Students you add now are shown as “Added after the group grant”; whether that grant reaches them isn’t decided yet.'",
    );
    expect(addNoteWithGrants(['Shell-and-Tube Heat Exchanger'])).toBe(
      'This group already has Shell-and-Tube Heat Exchanger. Students you add now are shown as “Added after the group grant”; whether that grant reaches them isn’t decided yet.',
    );
    expect(SCRIPT).toContain(
      "addLabel: nPick ? 'Add ' + this.plural(nPick, 'student') : 'Add students'",
    );
    expect([addLabel(0), addLabel(1), addLabel(2)]).toEqual([
      'Add students',
      'Add 1 student',
      'Add 2 students',
    ]);
    expect(SCRIPT).toContain(
      "t: sids.length === 1 ? (this.X(this.state.W).stu[sids[0]].n + ' was added to the group.') : sids.length + ' students were added to the group.'",
    );
    expect(addedFlash(['Vikram Joshi'])).toBe('Vikram Joshi was added to the group.');
    expect(addedFlash(['A', 'B'])).toBe('2 students were added to the group.');
    expect(SCRIPT).toContain(
      "title: 'Remove ' + S.n + ' from this group?', role: 'alertdialog', body: this.first(S.n) + ' will no longer be a member of ' + G.name + '. Their student record stays in People.'",
    );
    expect(removeTitle('Priya Natarajan')).toBe('Remove Priya Natarajan from this group?');
    expect(removeBody('Priya Natarajan', 'ME ZG523 — Sem II')).toBe(
      'Priya will no longer be a member of ME ZG523 — Sem II. Their student record stays in People.',
    );
    expect(SCRIPT).toContain(
      "t: S.n + ' was removed from the group. Their student record stays in People.'",
    );
    expect(removedFlash('Priya Natarajan')).toBe(
      'Priya Natarajan was removed from the group. Their student record stays in People.',
    );
    expect(TEMPLATE).toContain('<span>Given {{ g.date }}</span>');
    expect(SCRIPT).toContain("note: 'Given ' + this.fDate(r.indA.at)");
    expect(TEMPLATE).toContain('aria-label="Experiments given to {{ V.name }}"');
    expect(TEMPLATE).toContain('<caption>Members of {{ V.name }}</caption>');
  });

  it('no phrase names a record by its internal reference', () => {
    for (const phrase of [...DRAWN, ...NOT_VERBATIM]) expect(phrase).not.toMatch(IA_REFERENCE);
  });
});
