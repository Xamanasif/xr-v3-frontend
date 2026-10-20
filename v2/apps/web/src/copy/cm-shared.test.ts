/**
 * The words more than one Content Manager screen group draws are the owner-approved export's (V3
 * Refined B, design/v3-refined-b/roles/CM-v1 `project/Main.dc.html`): each drawn phrase is in its
 * markup or script verbatim, and each composed line takes the script's form with the records'
 * values (pinned here with the export's own sample values).
 */
import { describe, expect, it } from 'vitest';

import { cmExport } from '@/test-support/boards';

import {
  approvedByOn,
  CM_SUBMISSION_STATUS,
  CM_UPDATE_STATUS,
  liveVersion,
  NO_VERSION_LABEL,
  proposedVersion,
  readyToResolve,
  returnedOn,
  revisionOn,
  savedOn,
  sinceDay,
  STAGE_STATE_WORDS,
  STAGE_TRACK_LABEL,
  STAGE_WHAT,
  STAGE_WHEN,
  STAGE_WHO,
  staysLive,
  toResolveFirst,
  versionSince,
  versionUnchanged,
  waitingSince,
  whenReleasedLiveNow,
  withdrawnVersion,
  YOUR_STEP,
} from './cm-shared';

const MAIN = cmExport('Main.dc.html');
/** The markup with its tags removed and `&amp;` read, then the raw source (attributes, script). */
const WORDS = `${MAIN.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&')}\n${MAIN}`;

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

describe('the shared Content Manager words are the export’s', () => {
  it.each([
    ...strings(CM_SUBMISSION_STATUS),
    ...strings(CM_UPDATE_STATUS),
    ...strings(STAGE_TRACK_LABEL),
    ...strings(STAGE_WHO),
    ...strings(STAGE_WHAT),
    ...strings(STAGE_WHEN),
    YOUR_STEP,
    NO_VERSION_LABEL,
  ])('“%s”', (phrase) => {
    expect(WORDS).toContain(phrase);
  });

  it('each stage’s who, what and when is a whole value of the script’s flows, as quoted strings', () => {
    for (const phrase of [...strings(STAGE_WHO), ...strings(STAGE_WHAT), ...strings(STAGE_WHEN)]) {
      expect(MAIN, phrase).toContain(`'${phrase}'`);
    }
    for (const label of strings(STAGE_TRACK_LABEL)) {
      expect(MAIN).toContain(`aria-label="${label}"`);
    }
    expect(MAIN).toContain(`<span class="cm-you">${YOUR_STEP}</span>`);
  });

  it('the screen-reader state words are the script’s `SR`, trailing space included', () => {
    expect(MAIN).toContain(
      `const SR = { done: '${STAGE_STATE_WORDS.done}', you: '${STAGE_STATE_WORDS.you}', now: '${STAGE_STATE_WORDS.now}', back: '${STAGE_STATE_WORDS.back}', held: '${STAGE_STATE_WORDS.held}', off: '${STAGE_STATE_WORDS.off}', next: '${STAGE_STATE_WORDS.next}' };`,
    );
  });

  it('the status words are the script’s `subSt` and `UST` labels', () => {
    expect(MAIN).toContain(
      "label: 'Ready to publish · ' + nb + ' to resolve' } : { cls: 'xr-st xr-st--info', label: 'Ready to publish' };",
    );
    expect(MAIN).toContain(
      "if (x.st === 'with_rv') return { cls: 'xr-st xr-st--info', label: 'In academic review' };",
    );
    expect(MAIN).toContain(
      "if (x.st === 'recheck') return { cls: 'xr-st xr-st--info', label: 'Back with the Academic Reviewer' };",
    );
    expect(MAIN).toContain(
      "if (x.st === 'published') return { cls: 'xr-st xr-st--ok', label: 'Published' };",
    );
    expect(MAIN).toContain("return { cls: 'xr-st', label: 'With the vendor' };");
    expect(readyToResolve(2)).toBe('Ready to publish · 2 to resolve');
    for (const [state, cls] of [
      ['draft', "cls: 'xr-st', label: 'Draft'"],
      ['returned', "cls: 'xr-st xr-st--err', label: 'Returned'"],
      ['in-academic-review', "cls: 'xr-st xr-st--info', label: 'In academic review'"],
      ['awaiting-release-decision', "cls: 'xr-st xr-st--info', label: 'Awaiting release decision'"],
      ['on-hold', "cls: 'xr-st xr-st--paused', label: 'On hold'"],
      ['released', "cls: 'xr-st xr-st--ok', label: 'Released'"],
      ['withdrawn', "cls: 'xr-st rk-st-ended', label: 'Withdrawn'"],
    ] as const) {
      expect(MAIN).toContain(cls);
      expect(cls).toContain(`'${CM_UPDATE_STATUS[state]}'`);
    }
  });
});

describe('the composed stage lines take the script’s forms', () => {
  it('a submission’s stages (the decision view’s flow)', () => {
    expect(MAIN).toContain(
      "const subm = x.rev > 1 ? 'Revision ' + x.rev + ' · ' + this.short(x.resubmitted) : this.short(x.submitted);",
    );
    expect(revisionOn(2, '26 Aug')).toBe('Revision 2 · 26 Aug');
    // A resubmission whose date the record does not hold keeps its revision only.
    expect(revisionOn(2, null)).toBe('Revision 2');
    expect(MAIN).toContain("'Prof. A. Menon · ' + this.short(x.appr)");
    expect(approvedByOn('Prof. A. Menon', '27 Aug')).toBe('Prof. A. Menon · 27 Aug');
    expect(approvedByOn('', '27 Aug')).toBe('27 Aug');
    expect(MAIN).toContain(
      "nb ? this.plural(nb, 'thing') + ' to resolve first' : 'Waiting since ' + this.short(x.appr)",
    );
    expect(toResolveFirst(1)).toBe('1 thing to resolve first');
    expect(toResolveFirst(2)).toBe('2 things to resolve first');
    expect(waitingSince('27 Aug')).toBe('Waiting since 27 Aug');
    expect(MAIN).toContain("'Since ' + this.short(x.recheck.when)");
    expect(MAIN).toContain("'Since ' + this.short(x.since)");
    expect(sinceDay('25 Aug')).toBe('Since 25 Aug');
    expect(MAIN).toContain(
      "'Returned ' + this.short(x.ret ? x.ret.when : x.since) + (x.st === 'returned_cm' ? ' by you' : ' by the Academic Reviewer')",
    );
    expect(returnedOn('24 Aug', 'academic-reviewer')).toBe(
      'Returned 24 Aug by the Academic Reviewer',
    );
    expect(returnedOn('24 Aug', 'content-manager')).toBe('Returned 24 Aug by you');
    // A Super Admin's override is not worded: the date alone.
    expect(returnedOn('24 Aug', null)).toBe('Returned 24 Aug');
  });

  it('a correction’s stages (the script’s `updFlow`)', () => {
    expect(MAIN).toContain("u.saved ? 'Saved ' + sh(u.saved) : 'Not sent yet'");
    expect(savedOn('24 Aug')).toBe('Saved 24 Aug');
    expect(MAIN).toContain("'Returned ' + sh(u.ret.when), 'back'");
    expect(returnedOn('26 Aug', null)).toBe('Returned 26 Aug');
    expect(MAIN).toContain("'Since ' + sh(u.sent), 'now'");
    expect(MAIN).toContain("'Waiting since ' + sh(u.lifted || u.appr), 'now'");
    expect(MAIN).toContain("'When released · ' + e.ver + ' live now', 'next'");
    expect(whenReleasedLiveNow('1.2')).toBe('When released · 1.2 live now');
    expect(MAIN).toContain("'Since ' + sh(u.hold.when), 'held'");
    expect(MAIN).toContain("e.ver + ' stays live', 'next'");
    expect(staysLive('2.0')).toBe('2.0 stays live');
    expect(MAIN).toContain("'Version ' + this.T(u.ver) + ' since ' + sh(u.rel.when), 'done'");
    expect(versionSince('1.1', '5 Aug')).toBe('Version 1.1 since 5 Aug');
    expect(MAIN).toContain("'Version ' + e.ver + ' unchanged', 'off'");
    expect(versionUnchanged('1.0')).toBe('Version 1.0 unchanged');
  });

  it('the version change (`updListVM`, `updVM`, `pubVM`, `ovVM`)', () => {
    expect(MAIN).toContain(
      "{ va: e.ver + ' live', vaCls: 'cm-ver-live', vb: v ? v + ' proposed' : 'No version label yet', vbCls: 'cm-ver-new' }",
    );
    expect(MAIN).toContain(
      "{ va: e.ver + ' live', vaCls: 'cm-ver-live', vb: (v || 'Update') + ' withdrawn', vbCls: 'cm-ver-old' }",
    );
    expect(MAIN).toContain(
      "{ va: u.from, vaCls: 'cm-ver-old', vb: v + ' live', vbCls: 'cm-ver-live' }",
    );
    expect(liveVersion('1.2')).toBe('1.2 live');
    expect(proposedVersion('1.3')).toBe('1.3 proposed');
    expect(withdrawnVersion('1.1')).toBe('1.1 withdrawn');
    expect(withdrawnVersion(null)).toBe('Update withdrawn');
  });
});
