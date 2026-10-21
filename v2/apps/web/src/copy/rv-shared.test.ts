/**
 * The words more than one Academic Reviewer screen group draws are the owner-approved export's (V3
 * Refined B, design/v3-refined-b/roles/RV-v1 `project/RV.dc.html`): each drawn phrase is in its
 * markup or script verbatim, and each composed line takes the script's form with the records'
 * values (pinned here with the export's own sample values). No phrase names a record by its
 * internal reference.
 */
import { describe, expect, it } from 'vitest';

import { rvExport } from '@/test-support/boards';

import {
  ageWords,
  decidedByYouOn,
  decidedElsewhereOn,
  formatsFact,
  fromContentManager,
  fromSender,
  publishedOn,
  releasedOn,
  revisionDetail,
  revisionInQueue,
  RV_APPROVE_DIALOG,
  RV_BACK,
  RV_FACT_TERMS,
  RV_ITEM,
  RV_KIND_WORDS,
  RV_NOW,
  RV_REFUSAL,
  RV_STAND,
  RV_STATUS,
  sinceWords,
  toVersionDetail,
  versionChangeDetail,
  waitingFact,
  waitingSentFact,
  withdrawnOn,
} from './rv-shared';

const RV = rvExport('RV.dc.html');
const TEMPLATE = RV.slice(0, RV.indexOf('<script type="text/x-dc"'));
const SCRIPT = RV.slice(RV.indexOf('<script type="text/x-dc"'));
/** The markup with its tags removed and `&amp;` read, then the raw source (attributes, script). */
const WORDS = `${TEMPLATE.replace(/<[^>]+>/g, ' ').replace(/&amp;/g, '&')}\n${RV}`;

function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

const ALL = [
  ...strings(RV_KIND_WORDS),
  ...strings(RV_STATUS),
  ...strings(RV_NOW),
  ...strings(RV_FACT_TERMS),
  ...strings(RV_ITEM),
  ...strings(RV_STAND),
  ...strings(RV_REFUSAL),
  ...strings(RV_APPROVE_DIALOG),
  ...strings(RV_BACK),
];

describe('the shared Academic Reviewer words are the export’s', () => {
  it.each(ALL)('“%s”', (phrase) => {
    expect(WORDS).toContain(phrase);
  });

  it('the kind tag’s words are the script’s `kindOf`, as quoted values', () => {
    for (const word of strings(RV_KIND_WORDS)) expect(SCRIPT).toContain(`t: '${word}'`);
    expect(SCRIPT).toContain(`d: 'revision ' + R.rev`);
    expect(SCRIPT).toContain(`R.liveVer + ' → ' + R.newVer : 'to version ' + R.newVer`);
    expect(revisionDetail(2)).toBe('revision 2');
    expect(versionChangeDetail('1.2', '1.3')).toBe('1.2 → 1.3');
    expect(toVersionDetail('2.1')).toBe('to version 2.1');
  });

  it('the status and where-it-is-now words are the script’s `standing`', () => {
    for (const label of strings(RV_STATUS)) expect(SCRIPT).toContain(`label: '${label}'`);
    const nows = strings(RV_NOW).filter((now) => now !== RV_NOW.releasedBySuperAdmin);
    for (const now of nows) expect(SCRIPT).toContain(`'${now}'`);
    // A release the list read holds no date or version for: the export's history words for it.
    expect(SCRIPT).toContain(`w: '${RV_NOW.releasedBySuperAdmin}'`);
    expect(SCRIPT).toContain(`'Revision ' + R.rev + ' is in your queue'`);
    expect(SCRIPT).toContain(`now: 'Published on ' + R.pubWhen`);
    expect(SCRIPT).toContain(
      `now: 'Released on ' + R.relWhen + ' · version ' + R.newVer + ' is live'`,
    );
    expect(revisionInQueue(2)).toBe('Revision 2 is in your queue');
    expect(publishedOn('30 Jul 2026')).toBe('Published on 30 Jul 2026');
    expect(releasedOn('5 Aug 2026', '1.1')).toBe('Released on 5 Aug 2026 · version 1.1 is live');
  });

  it('the waiting age is the script’s `ageOf` and `short`', () => {
    expect(SCRIPT).toContain(`return d <= 0 ? 'Today' : d === 1 ? '1 day' : d + ' days';`);
    expect(SCRIPT).toContain(`since: 'since ' + this.short(R.since)`);
    expect(SCRIPT).toContain(`this.ageOf(R.iso) + ' · since ' + this.short(R.since)`);
    expect(SCRIPT).toContain(`this.ageOf(R.iso) + ' · sent ' + this.short(R.since)`);
    expect([ageWords(0), ageWords(1), ageWords(13)]).toEqual(['Today', '1 day', '13 days']);
    expect(sinceWords('24 Aug')).toBe('since 24 Aug');
    expect(waitingFact('3 days', '24 Aug')).toBe('3 days · since 24 Aug');
    expect(waitingSentFact('2 days', '25 Aug')).toBe('2 days · sent 25 Aug');
  });

  it('the identity card’s shared facts and sender are the script’s', () => {
    expect(SCRIPT).toContain(`facts.push({ k: '${RV_FACT_TERMS.waiting}', v: `);
    expect(SCRIPT).toContain(
      `k: decidedSrc.dec === 'withdrawn' ? '${RV_FACT_TERMS.withdrawn}' : '${RV_FACT_TERMS.decided}'`,
    );
    expect(SCRIPT).toContain(`facts.push({ k: 'Formats', v: (R.fmts || []).join(' · ') });`);
    expect(SCRIPT).toContain(
      `const meta1 = upd ? 'From ' + R.who + ', Content Manager' : 'From ' + R.who;`,
    );
    expect(formatsFact(['WEB', 'VR'])).toBe('WEB · VR');
    expect(fromSender('Meridian Virtual Labs')).toBe('From Meridian Virtual Labs');
    expect(fromContentManager('Kavya Nair')).toBe('From Kavya Nair, Content Manager');
  });

  it('the item page’s shared words are drawn where the template draws them', () => {
    expect(TEMPLATE).toContain(
      `<nav class="rv-onpage" aria-label="${RV_ITEM.onThisPage}"><span class="rv-onpage-k" aria-hidden="true">${RV_ITEM.onThisPage}</span>`,
    );
    expect(TEMPLATE).toContain(
      `<a class="rb-btn rk-goto" href="#rv-panel">${RV_ITEM.goToDecision}</a>`,
    );
    expect(TEMPLATE).toContain(`<h2 id="rv-panel-h">${RV_ITEM.yourDecision}</h2>`);
    expect(TEMPLATE).toContain(`<p class="rv-ready-h">${RV_ITEM.beforeYouDecide}</p>`);
    expect(TEMPLATE).toContain(`<p class="rv-path-h">${RV_ITEM.whatHappensNext}</p>`);
    expect(TEMPLATE).toContain(`<legend>${RV_ITEM.decision}</legend>`);
    expect(TEMPLATE).toContain(`<p class="rk-errsum-t">${RV_ITEM.checkYourDecision}</p>`);
    expect(TEMPLATE).toContain(`<p class="rb-note">${RV_ITEM.readOnly}</p>`);
    expect(TEMPLATE).toContain(`<p class="rb-note">${RV_ITEM.newestFirst}</p>`);
    expect(TEMPLATE).toContain(`<div class="rv-done-q"><b>${RV_ITEM.yourReason}</b>`);
    expect(SCRIPT).toContain(
      `histTitle: upd ? '${RV_ITEM.updateHistory}' : '${RV_ITEM.reviewHistory}'`,
    );
    expect(SCRIPT).toContain(`{ n: '1', t: '${RV_ITEM.youAcademicDecision}'`);
  });

  it('the decided outcome’s words are the script’s', () => {
    expect(SCRIPT).toContain(
      `'Decided by you on ' + src.when + ', in another window' : 'Decided by you on ' + src.when`,
    );
    expect(SCRIPT).toContain(`'Withdrawn on ' + src.when`);
    expect(SCRIPT).toContain(`{ k: '${RV_STAND.academicReview}', v: '${RV_STAND.approvedByYou}' }`);
    expect(SCRIPT).toContain(`{ k: '${RV_STAND.access}', v: `);
    expect(SCRIPT).toContain(
      `d.refusal === 'stale' ? '${RV_REFUSAL.stale}' : '${RV_REFUSAL.elsewhere}'`,
    );
    expect(SCRIPT).toContain(
      `backLabel: from === 'reviewed' ? '${RV_BACK.reviewed}' : from === 'overview' ? 'Back to Overview' : '${RV_BACK.queue}'`,
    );
    expect(decidedByYouOn('27 Aug 2026, 15:20')).toBe('Decided by you on 27 Aug 2026, 15:20');
    expect(decidedElsewhereOn('27 Aug 2026, 15:20')).toBe(
      'Decided by you on 27 Aug 2026, 15:20, in another window',
    );
    expect(withdrawnOn('27 Aug 2026')).toBe('Withdrawn on 27 Aug 2026');
  });

  it('the approval dialog’s shared words are the template’s and the script’s', () => {
    expect(TEMPLATE).toContain(`<p id="rv-dlg-d">${RV_APPROVE_DIALOG.description}</p>`);
    expect(TEMPLATE).toContain(`<h3>${RV_APPROVE_DIALOG.now}</h3>`);
    expect(TEMPLATE).toContain(`<h3>${RV_APPROVE_DIALOG.later}</h3>`);
    expect(SCRIPT).toContain(`'${RV_APPROVE_DIALOG.leavesQueue}'`);
  });

  it('no shared phrase names a record by its internal reference', () => {
    for (const phrase of ALL) expect(phrase).not.toMatch(/\b(?:REQ|ACC|UPD|DTR|SUP|SUB)-\d+/);
  });
});
