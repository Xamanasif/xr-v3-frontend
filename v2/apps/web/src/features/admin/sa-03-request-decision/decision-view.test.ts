/**
 * SA-03's view of the port's answers (the Super Admin export's `V.decision`), on the seeded
 * decision pages: which panel applies, the checks the panel runs before a confirmation, the
 * difference a smaller scope makes, what the confirmation says, and the words of the decided panel.
 * The commands decide; these only read.
 */
import type { DecisionPage } from '@xr/contracts/draft';
import { DRAWN_MESSAGES } from '@xr/contracts/draft';
import { describe, expect, it } from 'vitest';

import { DECISION_ERRORS, SAME_NAME_BLOCK } from '@/copy/requests';
import { stateWords } from '@/copy/state-copy';
import { SUPER_ADMIN, tabPlatform } from '@/test-support/workspace';

import {
  approvalCreatesPlan,
  confirmLines,
  createdByThisApproval,
  decisionCommand,
  differencesOf,
  draftErrors,
  EMPTY_DRAFT,
  errorList,
  existingAccessWords,
  hasPanelErrors,
  historyLines,
  needsRoute,
  nextLine,
  panelErrorsOf,
  holdsForSameName,
  panelKindOf,
  pendingHint,
  planEffectOf,
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

describe('DP-09 interim safeguard: an institution of the same name already exists', () => {
  const SAME = {
    institutionId: 'bitshyd',
    name: 'BITS Pilani — Hyderabad Campus',
    kind: 'internal',
  } as unknown as DecisionPage['sameNameInstitutions'][number];
  const LINE =
    'BITS Pilani — Hyderabad Campus is already on the platform (Internal). This request can’t be decided until requests can be matched to an existing institution.';

  it('a new institution’s request with a namesake waits: no open panel; Existing access names it', async () => {
    const seeded = await pages();
    const fresh = newInstitutionRequest(seeded['REQ-0038']!);
    const held: DecisionPage = { ...fresh, sameNameInstitutions: [SAME] };
    expect(holdsForSameName(held)).toBe(true);
    expect(panelKindOf(held)).toBe('same-name');
    expect(existingAccessWords(held, name)).toBe(LINE);
    // Without a namesake: the drawn new-institution panel and words, as before.
    expect(panelKindOf(fresh)).toBe('open');
    expect(existingAccessWords(fresh, name)).toMatch(/^None\. There is no institution record/);
  });

  it('a request that already has its institution is never held; a decided request shows its decided panel', async () => {
    const seeded = await pages();
    const renewal: DecisionPage = { ...seeded['REQ-0038']!, sameNameInstitutions: [SAME] };
    expect(holdsForSameName(renewal)).toBe(false);
    expect(panelKindOf(renewal)).toBe('open');
    const decided: DecisionPage = {
      ...newInstitutionRequest(seeded['REQ-0038']!),
      request: {
        ...newInstitutionRequest(seeded['REQ-0038']!).request,
        status: 'information-requested',
      },
      sameNameInstitutions: [SAME],
    };
    expect(panelKindOf(decided)).toBe('decided');
  });

  it('the title is the state-copy register’s (SA-03.same-name)', () => {
    expect(stateWords('SA-03.same-name')).toBe(SAME_NAME_BLOCK.title);
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

describe('the decided panel and the details (the export’s `doneHtml`, `existing`, `hist`)', () => {
  it('“Where this request stands” for each decided seeded request', async () => {
    const seeded = await pages();
    const values = (id: string) => standRows(seeded[id]!).map((row) => row.value);
    expect(values('REQ-0041')).toEqual([
      'Not created',
      'Information requested',
      'Not started',
      'Not active',
    ]);
    expect(values('REQ-0037')).toEqual([
      'Created 22 Sep 2026, 15:00',
      'Approved (external)',
      'Waiting, not confirmed',
      'Not active',
    ]);
    expect(values('REQ-0039')).toEqual([
      'Created 26 Sep 2026, 11:00',
      'Approved (internal)',
      'Not needed (internal)',
      'Active since 26 Sep 2026, 11:00',
    ]);
    // A payment started but not confirmed: no access line (the export's `pend`).
    expect(values('REQ-0036')).toEqual(['Exists', 'Approved (external)', 'Not confirmed']);
    // No plan is named by its reference.
    for (const id of ['REQ-0036', 'REQ-0037', 'REQ-0039', 'REQ-0041']) {
      expect(values(id).join(' ')).not.toMatch(/ACC-\d/);
    }
  });

  it('the record this approval created is read from the request and its plans only', async () => {
    const seeded = await pages();
    expect(createdByThisApproval(seeded['REQ-0037']!)).toBe(true);
    expect(createdByThisApproval(seeded['REQ-0039']!)).toBe(true);
    expect(createdByThisApproval(seeded['REQ-0036']!)).toBe(false);
    expect(createdByThisApproval(seeded['REQ-0038']!)).toBe(false);
    expect(createdByThisApproval(seeded['REQ-0041']!)).toBe(false);
  });

  it('“Existing access” before and after a decision, plans named by content and term', async () => {
    const seeded = await pages();
    expect(existingAccessWords(seeded['REQ-0039']!, name)).toBe(
      'Institution record created on 26 Sep 2026, 11:00. Institutional access active since then (internal, no payment step).',
    );
    expect(existingAccessWords(seeded['REQ-0040']!, () => 'Buck Converter Ripple')).toBe(
      'An access plan with Buck Converter Ripple (WEB, AR) and 60 licences, on a quarterly term that ends on 2 Nov 2026.',
    );
    expect(existingAccessWords(seeded['REQ-0038']!, name)).toBe(
      'The current access plan holds these 2 experiments and 80 licences. Its current term ends on 31 Oct 2026.',
    );
    expect(existingAccessWords(newInstitutionRequest(seeded['REQ-0040']!), name)).toBe(
      'None. There is no institution record for Konark Polytechnic yet. Approving this request creates the record; it does not activate access.',
    );
  });

  it('the history for the Super Admin, newest first, in the export’s words', async () => {
    const lines = historyLines((await pages())['REQ-0037']!);
    expect(lines.map((line) => line.what)).toEqual([
      'Request approved (external)',
      'Request submitted',
    ]);
    expect(lines[0]!.note).toBe(
      'Institution record created. Status: Approved — payment required. Access not active until the payment is confirmed.',
    );
    expect(lines[0]!.when).toBe('22 Sep 2026, 15:00 by Arjun Mehta');
    expect(lines[1]!.when).toBe('22 Sep 2026, 10:00 by K. Rao, contact person');
  });

  it('the plan effect: the command’s answer when decided here, else read from the page', async () => {
    const seeded = await pages();
    // A new institution's internal approval created its plan; nothing else writes one (OD-B3-09).
    expect(planEffectOf(seeded['REQ-0039']!, null)).toBe('plan-created');
    expect(planEffectOf(seeded['REQ-0037']!, null)).toBe('none');
    expect(planEffectOf(seeded['REQ-0038']!, { kind: 'policy-open', decision: 'OD-B3-09' })).toBe(
      'policy-open',
    );
    const renewalActive = {
      ...seeded['REQ-0038']!,
      request: { ...seeded['REQ-0038']!.request, status: 'access-active' as const },
    };
    expect(planEffectOf(renewalActive, null)).toBe('policy-open');
    expect(nextLine(renewalActive)).toBe(
      'The renewal is approved. The current plan isn’t changed from this page; its term still shows as ending on 31 Oct 2026.',
    );
    expect(nextLine(seeded['REQ-0039']!)).toBe(
      'Institutional access is active. The institution administrator can now give students access.',
    );
    // Payment started but not confirmed: no next line (state-copy `SA-03.next-undrawn`).
    expect(nextLine(seeded['REQ-0036']!)).toBeNull();
  });

  it('the confirmation claims a plan only where the approval creates one', async () => {
    const seeded = await pages();
    const approve = { ...EMPTY_DRAFT, choice: 'approve' as const };
    const fresh = newInstitutionRequest(seeded['REQ-0040']!);
    expect(approvalCreatesPlan(fresh)).toBe(true);
    expect(confirmLines(fresh, approve, 'internal')).toEqual({
      now: [
        'Creates the institution record for Konark Polytechnic, classified internal.',
        'Approves the request. There is no payment step.',
        'Institutional access is activated now and the access plan is created.',
      ],
      later: ['Students get access only when the institution’s administrator gives it.'],
    });
    expect(confirmLines(fresh, approve, 'external')).toEqual({
      now: [
        'Creates the institution record for Konark Polytechnic, classified external.',
        'Approves the request. Its status becomes Approved — payment required.',
      ],
      later: [
        'Institutional access is not activated now. It is activated only after the payment is confirmed.',
        'Students get access only when the institution’s administrator gives it.',
      ],
    });
    expect(approvalCreatesPlan(seeded['REQ-0038']!)).toBe(false);
    expect(confirmLines(seeded['REQ-0038']!, approve, 'internal')).toEqual({
      now: ['Approves the renewal. There is no payment step.'],
      later: [
        'This page does not change the current plan. Its term still shows as ending on 31 Oct 2026.',
        'Students get access only when the institution’s administrator gives it.',
      ],
    });
  });
});

describe('the command a decision sends (P1-21; Package 1E)', () => {
  it('takes the revision it is given — the decision’s — not the page’s, even when the page is newer', async () => {
    const seeded = await pages();
    const page = seeded['REQ-0040']!;
    const began = page.request.rev;
    // The page read again after a change elsewhere: a newer revision.
    const newer = { ...page, request: { ...page.request, rev: began + 1 } };
    expect(decisionCommand(newer, { ...EMPTY_DRAFT, choice: 'approve' }, began)).toEqual({
      choice: 'approve',
      input: { id: 'REQ-0040', route: null, expectedRev: began },
    });
    expect(
      decisionCommand(newer, { ...EMPTY_DRAFT, choice: 'info', reason: 'Which section?' }, began),
    ).toEqual({
      choice: 'info',
      input: { id: 'REQ-0040', reason: 'Which section?', expectedRev: began },
    });
    expect(decisionCommand(page, EMPTY_DRAFT, began)).toBeNull();
  });

  it('a smaller scope: the narrowed items, licences, term and reason the panel shows', async () => {
    const seeded = await pages();
    const page = seeded['REQ-0040']!;
    const draft = {
      ...EMPTY_DRAFT,
      choice: 'smaller' as const,
      formats: ['web' as const],
      reason: 'AR is not part of the second section.',
    };
    expect(decisionCommand(page, draft, 7)).toEqual({
      choice: 'smaller',
      input: {
        id: 'REQ-0040',
        route: null,
        items: smallerScopeItems(page, draft),
        licences: String(page.request.licencesRequested),
        term: termValue(page, draft),
        reason: 'AR is not part of the second section.',
        expectedRev: 7,
      },
    });
  });

  it('a new institution’s route goes with the approval; a committed route is never re-sent', async () => {
    const seeded = await pages();
    const fresh = newInstitutionRequest(seeded['REQ-0040']!);
    expect(
      decisionCommand(fresh, { ...EMPTY_DRAFT, choice: 'approve', route: 'internal' }, 3),
    ).toMatchObject({ input: { route: 'internal', expectedRev: 3 } });
    expect(
      decisionCommand(
        seeded['REQ-0038']!,
        { ...EMPTY_DRAFT, choice: 'approve', route: 'external' },
        3,
      ),
    ).toMatchObject({ input: { route: null } });
  });
});
