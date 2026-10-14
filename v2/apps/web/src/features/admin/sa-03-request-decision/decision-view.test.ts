/**
 * SA-03's view of the port's answers (B1-11), on the seeded decision pages: which panel applies,
 * the drawn checks the panel runs before a confirmation, the difference a smaller scope makes, and
 * the words of the decided panel. The commands decide; these only read.
 */
import type { DecisionPage } from '@xr/contracts/draft';
import { DRAWN_MESSAGES } from '@xr/contracts/draft';
import { describe, expect, it } from 'vitest';

import { DECISION_ERRORS } from '@/copy/requests';
import { SUPER_ADMIN, tabPlatform } from '@/test-support/workspace';

import {
  createdByThisApproval,
  differencesOf,
  draftErrors,
  EMPTY_DRAFT,
  errorList,
  existingAccessWords,
  hasPanelErrors,
  historyLines,
  needsRoute,
  panelErrorsOf,
  panelKindOf,
  pendingHint,
  smallerScopeItems,
  standRows,
  termValue,
} from './decision-view';

async function pages(): Promise<Readonly<Record<string, DecisionPage>>> {
  const { runtime } = await tabPlatform(SUPER_ADMIN, 'spine-start');
  const out: Record<string, DecisionPage> = {};
  for (const id of ['REQ-0036', 'REQ-0037', 'REQ-0038', 'REQ-0039', 'REQ-0040', 'REQ-0041']) {
    const answer = await runtime.ports.accessRequests.getRequestForDecision(id as never);
    if (!answer.ok) throw new Error(`${id}: ${answer.error.kind}`);
    out[id] = answer.value;
  }
  return out;
}

/** A new institution's request under review (REQ-0042's shape before Package 1C creates it). */
function newInstitutionRequest(page: DecisionPage): DecisionPage {
  return {
    ...page,
    request: {
      ...page.request,
      status: 'under-review',
      type: 'new-access',
      decision: null,
      route: null,
      institutionId: null,
      term: { kind: 'yearly' },
      licencesRequested: 120,
    },
    existingAccess: null,
    routeCommitted: null,
    whereItStands: { ...page.whereItStands, institutionRecord: 'not-created' },
  };
}

const name = (experimentId: string) => experimentId;

describe('the panel B1-11 draws for each seeded request', () => {
  it('under review → open (paused → blocked); any other status → decided', async () => {
    const seeded = await pages();
    expect(panelKindOf(seeded['REQ-0038']!)).toBe('open');
    expect(panelKindOf(seeded['REQ-0040']!)).toBe('open');
    const paused = {
      ...seeded['REQ-0040']!,
      existingAccess: { ...seeded['REQ-0040']!.existingAccess!, paused: true },
    };
    expect(panelKindOf(paused)).toBe('blocked');
    for (const id of ['REQ-0036', 'REQ-0037', 'REQ-0039', 'REQ-0041']) {
      expect(panelKindOf(seeded[id]!), id).toBe('decided');
    }
  });
});

describe('the drawn checks before a confirmation (B1-11 `validate`)', () => {
  it('the words are the contract catalogue’s (SA-03.*)', () => {
    expect(DECISION_ERRORS).toEqual({
      choice: DRAWN_MESSAGES['SA-03.decision.required'].text,
      route: DRAWN_MESSAGES['SA-03.route.required'].text,
      formats: DRAWN_MESSAGES['SA-03.items.keep-one-format'].text,
      licences: DRAWN_MESSAGES['SA-03.licences.whole-number'].text,
      change: DRAWN_MESSAGES['SA-03.decision.change-something'].text,
      reason: DRAWN_MESSAGES['SA-03.reason.required'].text,
      question: DRAWN_MESSAGES['SA-03.informationReason.required'].text,
    });
  });

  it('a new institution: the route is required to approve (f4, f7)', async () => {
    const page = newInstitutionRequest((await pages())['REQ-0041']!);
    const draft = { ...EMPTY_DRAFT, choice: 'approve' as const };
    expect(needsRoute(page, draft)).toBe(true);
    expect(pendingHint(page, draft)).toBe('Choose internal or external before approving.');
    expect(errorList(draftErrors(page, draft))).toEqual(['Choose internal or external']);
    expect(errorList(draftErrors(page, { ...draft, route: 'external' }))).toEqual([]);
  });

  it('a smaller scope with nothing changed and no reason (f8); then one format kept', async () => {
    const page = newInstitutionRequest((await pages())['REQ-0041']!);
    const draft = { ...EMPTY_DRAFT, choice: 'smaller' as const, route: 'external' as const };
    expect(differencesOf(page, draft)).toEqual([]);
    expect(errorList(draftErrors(page, draft))).toEqual([
      'Change at least one thing, or choose Approve request',
      'Enter the reason for the change',
    ]);
    const narrowed = { ...draft, licences: '100', reason: 'First term only.' };
    expect(differencesOf(page, narrowed)).toEqual(['Licences: 120 → 100']);
    expect(errorList(draftErrors(page, narrowed))).toEqual([]);
    expect(errorList(draftErrors(page, { ...narrowed, formats: [] }))).toEqual([
      'Keep at least one format',
    ]);
    expect(errorList(draftErrors(page, { ...narrowed, licences: '1.5' }))).toEqual([
      'Enter a whole number of licences',
    ]);
    expect(differencesOf(page, { ...narrowed, term: 'monthly' })).toEqual([
      'Licences: 120 → 100',
      'Term: Yearly → Monthly',
    ]);
  });

  it('only the first experiment is narrowed (P1-07); the others go as asked', async () => {
    const page = (await pages())['REQ-0041']!;
    const items = smallerScopeItems(page, { ...EMPTY_DRAFT, formats: [] });
    expect(items).toHaveLength(page.request.items.length);
    expect(items[0]!.formats).toEqual([]);
    expect(items.slice(1)).toEqual(page.request.items.slice(1));
  });

  it('a request for information needs the question (f6)', async () => {
    const page = (await pages())['REQ-0040']!;
    const draft = { ...EMPTY_DRAFT, choice: 'info' as const };
    expect(pendingHint(page, draft)).toBe('Add your question before sending.');
    expect(errorList(draftErrors(page, draft))).toEqual(['Enter what you need from the requester']);
  });

  it('“Current term” is not an option: Monthly shows, and the difference says so', async () => {
    const page = (await pages())['REQ-0040']!;
    const draft = { ...EMPTY_DRAFT, choice: 'smaller' as const };
    expect(termValue(page, draft)).toBe('monthly');
    expect(differencesOf(page, draft)).toEqual(['Term: Current term → Monthly']);
  });

  it('the service’s field errors go to their places; an undrawn rule is kept as a mark, not words', () => {
    const errors = panelErrorsOf([
      { field: 'reason', key: 'SA-03.reason.required', message: 'Enter the reason', params: {} },
      { field: 'items', key: 'SA-03.items.not-requested', message: null, params: {} },
      { field: 'decision', key: 'SA-03.decision.change-something', message: 'Change', params: {} },
    ]);
    expect(errors).toEqual({ reason: 'Enter the reason', change: 'Change', undrawn: ['formats'] });
    expect(errorList(errors)).toEqual(['Change', 'Enter the reason']);
    // A refusal whose only rule has no drawn words still opens "Check your decision".
    const only = panelErrorsOf([
      { field: 'licences', key: 'SA-03.licences.not-smaller', message: null, params: {} },
    ]);
    expect(only).toEqual({ undrawn: ['licences'] });
    expect(hasPanelErrors(only)).toBe(true);
    expect(hasPanelErrors({})).toBe(false);
  });
});

describe('the decided panel and the details (B1-11 f9 … f12)', () => {
  it('“Where this request stands” for each decided seeded request', async () => {
    const seeded = await pages();
    const values = (id: string) => standRows(seeded[id]!).map((row) => row.value);
    expect(values('REQ-0041')).toEqual(['Not created', 'Information requested', '—', 'Not active']);
    expect(values('REQ-0037')).toEqual([
      'Created · 22 Sep 2026, 15:00',
      'Approved · External',
      'Waiting — not confirmed',
      'Not active',
    ]);
    expect(values('REQ-0039')).toEqual([
      'Created · 26 Sep 2026, 11:00',
      'Approved · Internal',
      'Not needed (internal)',
      'Active · ACC-0098',
    ]);
    expect(values('REQ-0036')).toEqual([
      'Exists',
      'Approved · External',
      'Waiting — not confirmed',
      'Active',
    ]);
  });

  it('the record this approval created is read from the request and its plans only', async () => {
    const seeded = await pages();
    expect(createdByThisApproval(seeded['REQ-0037']!)).toBe(true);
    expect(createdByThisApproval(seeded['REQ-0039']!)).toBe(true);
    expect(createdByThisApproval(seeded['REQ-0036']!)).toBe(false);
    expect(createdByThisApproval(seeded['REQ-0038']!)).toBe(false);
    expect(createdByThisApproval(seeded['REQ-0041']!)).toBe(false);
  });

  it('“Existing access” before and after a decision', async () => {
    const seeded = await pages();
    expect(existingAccessWords(seeded['REQ-0039']!, name)).toBe(
      'Institution record created · 26 Sep 2026, 11:00. Institutional access active since 26 Sep 2026, 11:00 (internal, no payment step) · access plan ACC-0098.',
    );
    expect(existingAccessWords(seeded['REQ-0040']!, () => 'Buck Converter Ripple')).toBe(
      'Access plan ACC-0091 · Buck Converter Ripple (WEB, AR) · 60 licences · term ends 2 Nov 2026.',
    );
  });

  it('the history for the Super Admin, newest first, in B1-11’s words', async () => {
    const lines = historyLines((await pages())['REQ-0037']!);
    expect(lines.map((line) => line.what)).toEqual([
      'Request approved · External',
      'Request submitted',
    ]);
    expect(lines[0]!.note).toBe(
      'Institution record created. Status: Approved — payment required. Access not active until the payment is confirmed.',
    );
    expect(lines[0]!.when).toBe('22 Sep 2026, 15:00 · Arjun Mehta');
    expect(lines[1]!.when).toBe('22 Sep 2026, 10:00 · K. Rao, contact person');
  });
});
