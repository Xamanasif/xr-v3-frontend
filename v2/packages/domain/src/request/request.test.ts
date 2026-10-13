/**
 * Access requests and the selection (Appendix C M03, M04; matrix REQ-*, SEL-*, INST-01, ACC-01,
 * ACC-02; BR-036 four separate events). AD-14 owner decision (12 Oct 2026): review starts only
 * from a seeded or test-supplied fact — never from opening SA-03 (this supersedes the older
 * Appendix F WP-0.9 (8) interim).
 */
import { describe, expect, it } from 'vitest';

import { calendarDate } from '../kernel/time.js';
import {
  counterIds,
  expectOk,
  ids,
  institution,
  plan,
  refusalOf,
  request,
  system,
  T,
  who,
} from '../testing/fixtures.js';
import { institutionStatus } from '../institution/decide.js';
import {
  approveRequest,
  approveSmallerScope,
  recordReviewStarted,
  reportPaymentOutcome,
  requesterSeesSubmitted,
  requestMoreInformation,
  startPayment,
  submitAdditionalLicencesRequest,
  submitPublicRequest,
  submitRenewalRequest,
} from './decide.js';
import {
  EMPTY_SELECTION,
  REQUEST_STATUSES,
  REQUEST_TRANSITIONS,
  type RequestCommand,
  type RequestStatus,
} from './model.js';
import {
  addToSelection,
  removeFromSelection,
  selectionSummary,
  setSelectionFormats,
  undoRemove,
} from './selection.js';

const freshIds = () => counterIds();
const PUBLISHED = () => ['web', 'ar', 'vr'] as const;

/** Runs one command on a request in `status`, with valid inputs; returns the new status or null. */
function run(
  status: RequestStatus,
  command: Exclude<
    RequestCommand,
    'submitPublicRequest' | 'submitRenewalRequest' | 'submitAdditionalLicencesRequest'
  >,
): RequestStatus | null {
  const base = request({
    status,
    payments:
      status === 'payment-not-confirmed'
        ? [{ id: 'pay-1' as never, startedAt: T.oct9, outcome: 'pending', outcomeAt: null }]
        : [],
  });
  const ids = freshIds();
  const now = T.oct14;
  const existing = institution();
  switch (command) {
    case 'recordReviewStarted': {
      const d = recordReviewStarted({
        request: base,
        actor: system('system:review-start'),
        now,
        ids,
      });
      return d.ok ? d.value.status : null;
    }
    case 'requestMoreInformation': {
      const d = requestMoreInformation({
        request: base,
        institution: null,
        reason: 'Which semester?',
        actor: who.superAdmin,
        now,
        ids,
      });
      return d.ok ? d.value.status : null;
    }
    case 'approveRequest': {
      const d = approveRequest({
        request: base,
        institution: null,
        route: 'external',
        actor: who.superAdmin,
        now,
        ids,
      });
      return d.ok ? d.value.request.status : null;
    }
    case 'approveSmallerScope': {
      const d = approveSmallerScope({
        request: base,
        institution: null,
        route: 'internal',
        items: [
          {
            experimentId: ids === null ? base.items[0]!.experimentId : base.items[0]!.experimentId,
            formats: ['web'],
          },
        ],
        licences: 100,
        term: { kind: 'yearly' },
        reason: 'Licences: 120 → 100',
        actor: who.superAdmin,
        now,
        ids,
      });
      return d.ok ? d.value.request.status : null;
    }
    case 'startPayment': {
      const d = startPayment({
        request: base,
        payer: { kind: 'requester', name: 'Meera Iyer' },
        now,
        ids,
      });
      return d.ok ? d.value.status : null;
    }
    case 'paymentConfirmed':
    case 'paymentFailed': {
      const d = reportPaymentOutcome({
        request: base,
        outcome: command === 'paymentConfirmed' ? 'confirmed' : 'failed',
        institution: existing,
        plans: [],
        actor: system('system:payment-provider'),
        now,
        ids,
      });
      return d.ok ? d.value.request.status : null;
    }
  }
}

describe('the request machine (acceptance 2): every drawn transition allowed, every other refused', () => {
  const commands = [
    'recordReviewStarted',
    'requestMoreInformation',
    'approveRequest',
    'approveSmallerScope',
    'startPayment',
    'paymentConfirmed',
    'paymentFailed',
  ] as const;
  for (const from of REQUEST_STATUSES) {
    for (const command of commands) {
      const drawn = REQUEST_TRANSITIONS.filter(
        (row) => row.from === from && row.command === command,
      );
      it(`${from} · ${command}: ${drawn.length ? `→ ${drawn.map((row) => row.to).join(' | ')}` : 'refused'}`, () => {
        const to = run(from, command);
        if (drawn.length === 0) expect(to).toBeNull();
        else expect(drawn.map((row) => row.to)).toContain(to);
      });
    }
  }

  it('creations land in under-review; there is no Declined state or decline command (T-02; REQ-10, REQ-20)', () => {
    expect(
      REQUEST_TRANSITIONS.filter((row) => row.from === null).every(
        (row) => row.to === 'under-review',
      ),
    ).toBe(true);
    expect(REQUEST_STATUSES.join(' ')).not.toMatch(/declin|reject/);
    expect(REQUEST_TRANSITIONS.map((row) => row.command).join(' ')).not.toMatch(/declin|reject/i);
  });

  it('nothing leaves "Information requested" (T-03; REQ-06, REQ-18): deciding it is policy-open', () => {
    expect(REQUEST_TRANSITIONS.some((row) => row.from === 'information-requested')).toBe(false);
    expect(
      refusalOf(
        approveRequest({
          request: request({ status: 'information-requested' }),
          institution: null,
          route: 'external',
          actor: who.superAdmin,
          now: T.oct14,
          ids: freshIds(),
        }),
      ),
    ).toEqual({
      kind: 'policy-open',
      decision: 'T-03',
    });
  });
});

describe('AD-14 / P1-04 (owner decision, supersedes the Appendix F WP-0.9 (8) interim): review starts only from a seeded or test fact — opening SA-03 changes nothing', () => {
  it('the requester reads "Submitted" until the fact is supplied, then "Under review"', () => {
    const sent = request();
    expect(requesterSeesSubmitted(sent)).toBe(true);
    const started = expectOk(
      recordReviewStarted({
        request: sent,
        actor: system('system:review-start'),
        now: T.oct9,
        ids: freshIds(),
      }),
    );
    expect(started.reviewStartedAt).toBe(T.oct9);
    expect(requesterSeesSubmitted(started)).toBe(false);
    expect(started.history.at(-1)?.event).toBe('review-started');
  });

  it('no Super Admin decision or read sets it — and only the review-start system writer may', () => {
    const asked = expectOk(
      requestMoreInformation({
        request: request(),
        institution: null,
        reason: 'Which semester?',
        actor: who.superAdmin,
        now: T.oct14,
        ids: freshIds(),
      }),
    );
    expect(asked.reviewStartedAt).toBeNull();
    const approved = expectOk(
      approveRequest({
        request: request(),
        institution: null,
        route: 'external',
        actor: who.superAdmin,
        now: T.oct14,
        ids: freshIds(),
      }),
    );
    expect(approved.request.reviewStartedAt).toBeNull();
    expect(
      recordReviewStarted({
        request: request(),
        actor: system('system:payment-provider') as never,
        now: T.oct9,
        ids: freshIds(),
      }).ok,
    ).toBe(false);
  });
});

describe('approval: four separate events (BR-036); a record is not access (B1-11)', () => {
  it('external, new institution: record created, Approved — payment required, no plan yet (REQ-13, INST-01)', () => {
    const outcome = expectOk(
      approveRequest({
        request: request(),
        institution: null,
        route: 'external',
        actor: who.superAdmin,
        now: T.oct8,
        ids: freshIds(),
      }),
    );
    expect(outcome.request.status).toBe('approved-payment-required');
    expect(outcome.request.route).toBe('external');
    expect(outcome.institution.kind).toBe('external');
    expect(outcome.institution.history.map((entry) => entry.event)).toEqual(['record-created']);
    expect(outcome.plan).toBeNull();
    expect(institutionStatus(outcome.institution, [], T.oct8)).toBe('approved-payment-required');
  });

  it('payment confirmed: the plan is created and access activates (ACC-02); failed: try again (REQ-07)', () => {
    const ids = freshIds();
    const approved = expectOk(
      approveRequest({
        request: request(),
        institution: null,
        route: 'external',
        actor: who.superAdmin,
        now: T.oct8,
        ids,
      }),
    );
    const paying = expectOk(
      startPayment({
        request: approved.request,
        payer: { kind: 'requester', name: 'Meera Iyer' },
        now: T.oct8,
        ids,
      }),
    );
    expect(paying.status).toBe('payment-not-confirmed');
    const failed = expectOk(
      reportPaymentOutcome({
        request: paying,
        outcome: 'failed',
        institution: approved.institution,
        plans: [],
        actor: system('system:payment-provider'),
        now: T.oct8,
        ids,
      }),
    );
    expect(failed.request.status).toBe('payment-failed');
    const again = expectOk(
      startPayment({
        request: failed.request,
        payer: { kind: 'requester', name: 'Meera Iyer' },
        now: T.oct8,
        ids,
      }),
    );
    const confirmed = expectOk(
      reportPaymentOutcome({
        request: again,
        outcome: 'confirmed',
        institution: approved.institution,
        plans: [],
        actor: system('system:payment-provider'),
        now: T.oct8,
        ids,
      }),
    );
    expect(confirmed.request.status).toBe('access-active');
    expect(confirmed.planEffect.kind).toBe('plan-created');
    expect(confirmed.plan).toMatchObject({
      items: request().items,
      licences: 120,
      term: 'yearly',
      startsOn: '2026-10-08',
      endsOn: '2027-10-07',
    });
    expect(confirmed.request.payments.map((payment) => payment.outcome)).toEqual([
      'failed',
      'confirmed',
    ]);
    expect(institutionStatus(confirmed.institution, [confirmed.plan!], T.oct8)).toBe(
      'access-active',
    );
  });

  it('internal, new institution: approval and activation together, no payment step (REQ-14, REQ-09, ACC-01)', () => {
    const outcome = expectOk(
      approveRequest({
        request: request(),
        institution: null,
        route: 'internal',
        actor: who.superAdmin,
        now: T.oct8,
        ids: freshIds(),
      }),
    );
    expect(outcome.request.status).toBe('access-active');
    expect(outcome.planEffect.kind).toBe('plan-created');
    expect(outcome.request.payments).toEqual([]);
    expect(
      refusalOf(
        startPayment({
          request: outcome.request,
          payer: { kind: 'requester', name: 'x' },
          now: T.oct8,
          ids: freshIds(),
        }),
      ),
    ).toEqual({ kind: 'invalid-state', current: 'access-active' });
  });

  it('a renewal or more licences for an existing institution writes no plan: OD-B3-09 is open', () => {
    const renewal = request({
      type: 'renewal',
      origin: 'institute-admin',
      institutionId: ids.godavari,
      route: 'internal',
      sourcePlanId: ids.plan,
    });
    const internal = expectOk(
      approveRequest({
        request: renewal,
        institution: institution({ kind: 'internal' }),
        route: null,
        actor: who.superAdmin,
        now: T.oct14,
        ids: freshIds(),
      }),
    );
    expect(internal.plan).toBeNull();
    expect(internal.planEffect).toEqual({ kind: 'policy-open', decision: 'OD-B3-09' });
    const external = request({
      type: 'additional-licences',
      origin: 'institute-admin',
      institutionId: ids.godavari,
      route: 'external',
      status: 'payment-not-confirmed',
      payments: [{ id: 'p' as never, startedAt: T.oct9, outcome: 'pending', outcomeAt: null }],
      term: { kind: 'current-plan' },
    });
    const paid = expectOk(
      reportPaymentOutcome({
        request: external,
        outcome: 'confirmed',
        institution: institution(),
        plans: [plan()],
        actor: system('system:payment-provider'),
        now: T.oct14,
        ids: freshIds(),
      }),
    );
    expect(paid.request.status).toBe('access-active');
    expect(paid.plan).toBeNull();
    expect(paid.planEffect).toEqual({ kind: 'policy-open', decision: 'OD-B3-09' });
  });

  it('a paused institution’s request cannot be decided (REQ-23); a classified route is locked (REQ-24); a new one needs it (REQ-12)', () => {
    const paused = institution({ pause: { since: T.oct12, by: who.superAdmin, reason: 'x' } });
    const fromPaused = request({ institutionId: ids.godavari });
    for (const decision of [
      approveRequest({
        request: fromPaused,
        institution: paused,
        route: null,
        actor: who.superAdmin,
        now: T.oct14,
        ids: freshIds(),
      }),
      requestMoreInformation({
        request: fromPaused,
        institution: paused,
        reason: 'x',
        actor: who.superAdmin,
        now: T.oct14,
        ids: freshIds(),
      }),
    ]) {
      expect(refusalOf(decision)).toEqual({ kind: 'refused', code: 'institution-paused' });
    }
    expect(
      refusalOf(
        approveRequest({
          request: fromPaused,
          institution: institution(),
          route: 'internal',
          actor: who.superAdmin,
          now: T.oct14,
          ids: freshIds(),
        }),
      ),
    ).toEqual({ kind: 'refused', code: 'route-locked' });
    expect(
      refusalOf(
        approveRequest({
          request: request(),
          institution: null,
          route: null,
          actor: who.superAdmin,
          now: T.oct14,
          ids: freshIds(),
        }),
      ),
    ).toEqual({ kind: 'validation-failed', issues: [{ field: 'route', rule: 'required' }] });
  });
});

describe('Approve a smaller scope (REQ-15; REQ-16 renewal; REQ-19 multi-experiment narrowing OPEN)', () => {
  const base = {
    institution: null,
    route: 'external' as const,
    actor: who.superAdmin,
    now: T.oct14,
  };
  it('fewer formats and licences, with the reason shown to the requester', () => {
    const outcome = expectOk(
      approveSmallerScope({
        ...base,
        ids: freshIds(),
        request: request(),
        items: [{ experimentId: ids.shell, formats: ['web'] }],
        licences: 100,
        term: { kind: 'yearly' },
        reason: 'Licences: 120 → 100',
      }),
    );
    expect(outcome.request.decision).toMatchObject({
      kind: 'approved-smaller-scope',
      approvedLicences: 100,
      reason: 'Licences: 120 → 100',
    });
    expect(outcome.request.history.at(-1)).toMatchObject({
      event: 'approved-with-changes',
      visibleTo: ['public', 'tenant_admin', 'super_admin'],
    });
  });

  it('the drawn rules', () => {
    const issues = (changes: object) =>
      refusalOf(
        approveSmallerScope({
          ...base,
          ids: freshIds(),
          request: request(),
          items: [{ experimentId: ids.shell, formats: ['web', 'vr'] }],
          licences: 120,
          term: { kind: 'yearly' },
          reason: 'x',
          ...changes,
        }),
      );
    expect(issues({})).toEqual({
      kind: 'validation-failed',
      issues: [{ field: 'decision', rule: 'change-something' }],
    });
    expect(issues({ items: [{ experimentId: ids.shell, formats: [] }] })).toMatchObject({
      issues: [{ field: 'items', rule: 'keep-one-format' }],
    });
    expect(issues({ licences: 50.5 })).toMatchObject({
      issues: [{ field: 'licences', rule: 'whole-number' }],
    });
    expect(issues({ licences: 100, reason: ' ' })).toMatchObject({
      issues: [{ field: 'reason', rule: 'required' }],
    });
  });

  it('not on a renewal; narrowing a multi-experiment request is not drawn', () => {
    expect(
      refusalOf(
        approveSmallerScope({
          ...base,
          ids: freshIds(),
          request: request({ type: 'renewal' }),
          items: [],
          licences: 1,
          term: { kind: 'yearly' },
          reason: 'x',
        }),
      ),
    ).toEqual({ kind: 'refused', code: 'renewal-scope-not-adjustable' });
    const two = request({
      items: [
        { experimentId: ids.shell, formats: ['web', 'vr'] },
        { experimentId: ids.wallA, formats: ['web'] },
      ],
    });
    expect(
      refusalOf(
        approveSmallerScope({
          ...base,
          ids: freshIds(),
          request: two,
          items: [{ experimentId: ids.shell, formats: ['web'] }],
          licences: 100,
          term: { kind: 'yearly' },
          reason: 'x',
        }),
      ),
    ).toEqual({ kind: 'policy-open', decision: 'REQ-19' });
  });
});

describe('the public request form (REQ-01; B1-07 reqValidate) and the Institute Admin requests (REQ-25, REQ-26)', () => {
  const selection = expectOk(
    addToSelection({
      selection: EMPTY_SELECTION,
      experimentId: ids.shell,
      published: [...PUBLISHED()],
      formats: ['vr', 'web'],
      now: T.oct2,
    }),
  );
  const form = {
    institutionName: 'Godavari Institute of Technology',
    contactPerson: 'Meera Iyer',
    contactEmail: 'meera.iyer@godavari.edu.in',
    contactPhone: null,
    licences: 120,
    term: { kind: 'yearly' as const },
    message: null,
  };

  it('sends with a reference and an opaque status token; the selection is empty again', () => {
    const sent = expectOk(
      submitPublicRequest({
        selection,
        form,
        publishedFormatsOf: () => [...PUBLISHED()],
        now: T.oct2,
        ids: freshIds(),
      }),
    );
    expect(sent.request).toMatchObject({
      id: 'REQ-1001',
      status: 'under-review',
      origin: 'public',
      type: 'new-access',
      institutionId: null,
      route: null,
    });
    expect(sent.request.statusToken).not.toBe(sent.request.id); // the reference is not a key (B1-08)
    expect(sent.request.items[0]!.formats).toEqual(['web', 'vr']); // WEB · AR · VR · MR
    expect(sent.selection).toEqual(EMPTY_SELECTION);
  });

  it('the drawn rules; never asked: route, prices, payment (REQ-02, REQ-03)', () => {
    expect(
      refusalOf(
        submitPublicRequest({
          selection: EMPTY_SELECTION,
          form,
          publishedFormatsOf: () => [],
          now: T.oct2,
          ids: freshIds(),
        }),
      ),
    ).toEqual({ kind: 'refused', code: 'selection-empty' });
    expect(
      refusalOf(
        submitPublicRequest({
          selection,
          form: {
            ...form,
            institutionName: '',
            contactEmail: 'meera@godavari',
            licences: 50.5,
            term: null,
          },
          publishedFormatsOf: () => [...PUBLISHED()],
          now: T.oct2,
          ids: freshIds(),
        }),
      ),
    ).toEqual({
      kind: 'validation-failed',
      issues: [
        { field: 'institutionName', rule: 'required' },
        { field: 'contactEmail', rule: 'email-format' },
        { field: 'licences', rule: 'whole-number' },
        { field: 'term', rule: 'required' },
      ],
    });
    expect(Object.keys(form)).not.toEqual(expect.arrayContaining(['route', 'price', 'amount']));
  });

  it('a renewal mirrors the plan — nothing can change (T-07; REQ-29); refused while paused', () => {
    const renewal = expectOk(
      submitRenewalRequest({
        institution: institution(),
        plan: plan(),
        message: 'Sem II',
        actor: who.instituteAdmin,
        now: T.sep2027,
        ids: freshIds(),
      }),
    );
    expect(renewal.request).toMatchObject({
      type: 'renewal',
      items: plan().items,
      licencesRequested: 120,
      term: { kind: 'yearly' },
      sourcePlanId: ids.plan,
      route: 'external',
    });
    expect(renewal.institution.history.at(-1)?.event).toBe('renewal-requested');
    const paused = institution({ pause: { since: T.oct12, by: who.superAdmin, reason: 'x' } });
    expect(
      refusalOf(
        submitRenewalRequest({
          institution: paused,
          plan: plan(),
          message: null,
          actor: who.instituteAdmin,
          now: T.oct14,
          ids: freshIds(),
        }),
      ),
    ).toEqual({ kind: 'refused', code: 'institution-paused' });
    expect(
      refusalOf(
        submitRenewalRequest({
          institution: institution(),
          plan: plan({ term: 'until-date', endsOn: calendarDate('2027-06-30') }),
          message: null,
          actor: who.instituteAdmin,
          now: T.oct14,
          ids: freshIds(),
        }),
      ),
    ).toEqual({ kind: 'policy-open', decision: 'T-07' });
  });

  it('more licences: experiments already in the plan, a whole number, "Current term" (REQ-26, REQ-30)', () => {
    const more = expectOk(
      submitAdditionalLicencesRequest({
        institution: institution(),
        plan: plan(),
        experimentIds: [ids.shell],
        licences: 60,
        message: null,
        actor: who.instituteAdmin,
        now: T.oct14,
        ids: freshIds(),
      }),
    );
    expect(more.request).toMatchObject({
      type: 'additional-licences',
      licencesRequested: 60,
      term: { kind: 'current-plan' },
    });
    expect(
      refusalOf(
        submitAdditionalLicencesRequest({
          institution: institution(),
          plan: plan(),
          experimentIds: [ids.wallA],
          licences: 0,
          message: null,
          actor: who.instituteAdmin,
          now: T.oct14,
          ids: freshIds(),
        }),
      ),
    ).toEqual({
      kind: 'validation-failed',
      issues: [
        { field: 'experimentIds', rule: 'not-in-plan' },
        { field: 'licences', rule: 'whole-number' },
      ],
    });
  });
});

describe('the selection (SEL-01; SEL-03 published formats only; last format locked)', () => {
  it('add, change formats, remove, undo — a request preparation, never a checkout', () => {
    const one = expectOk(
      addToSelection({
        selection: EMPTY_SELECTION,
        experimentId: ids.shell,
        published: ['web', 'vr'],
        formats: ['web'],
        now: T.oct2,
      }),
    );
    expect(
      refusalOf(
        addToSelection({
          selection: one,
          experimentId: ids.wallA,
          published: ['web'],
          formats: ['vr'],
          now: T.oct2,
        }),
      ),
    ).toEqual({ kind: 'refused', code: 'format-not-published' });
    const both = expectOk(setSelectionFormats(one, ids.shell, ['web', 'vr'], ['vr', 'web']));
    expect(selectionSummary(both)).toEqual({
      experiments: 1,
      formats: 2,
      formatList: ['web', 'vr'],
    });
    expect(refusalOf(setSelectionFormats(both, ids.shell, ['web', 'vr'], []))).toEqual({
      kind: 'refused',
      code: 'last-format-locked',
    });
    const removed = expectOk(removeFromSelection(both, ids.shell));
    expect(removed.items).toEqual([]);
    expect(expectOk(undoRemove(removed)).items).toHaveLength(1);
  });
});
