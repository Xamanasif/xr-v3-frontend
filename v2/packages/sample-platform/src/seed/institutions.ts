/**
 * The background institutions and requests (B1-10, B1-11, B7-02, B7-03; Appendix C §4.1). Godavari
 * Institute of Technology, REQ-0042 and REQ-0058 are not here: the walk creates them.
 *
 * Sample-data conflicts (Appendix C §4.2), one answer each because the store can hold only one:
 *  - S-1, S-2: the B7 variant — Konark holds ACC-0091 (Buck Converter Ripple, WEB + AR, 60,
 *    Quarterly 3 Aug – 2 Nov 2026, not paused); BITS Pilani — Hyderabad Campus holds ACC-0098
 *    (Distillation Column + Boiler Drum Level, WEB + VR, 80, Monthly 1–31 Oct 2026, active since
 *    26 Sep), the plan B7-05 lists under "Institutions using it" for UPD-0005.
 *  - REQ-0038 renews ACC-0098, which REQ-0039 activated on 26 Sep; a renewal cannot arrive before
 *    its plan, so its receipt moves from 24 Sep to 26 Sep 2026 (the drawn 16:02 is kept), and it
 *    asks to renew ACC-0098 as it stands (B1-11's three experiments belong to the B1 variant).
 *  - S-3: REQ-0038 / REQ-0039 keep the drawn contact "A. Menon" — a request contact, not a
 *    person record, and not the Academic Reviewer holder.
 *
 * Fills where no board draws a value (sample only): the origin requests REQ-0027 / 0029 / 0031 are
 * received, approved and paid on their plan's activation day; their contact is the institution's
 * Institute Admin; Institute Admin e-mails not drawn use the drawn BITS domain or `.example`;
 * REQ-0036's licence count and REQ-0041's three experiments are not drawn.
 */
import {
  type AccessPlan,
  type AccessPlanTerm,
  type AccessRequest,
  type ActorRef,
  type CalendarDate,
  type HistoryEntry,
  type Institution,
  type InstitutionEvent,
  type InstitutionKind,
  type IsoInstant,
  provided,
  type RequestedItem,
  type RequestedTerm,
  type RequestEvent,
  type RequestStatus,
  type Technology,
  unsafeBrand,
} from '@xr/domain';

import {
  ARJUN,
  day,
  ist,
  meta,
  note,
  personRef,
  refOfKind,
  requesterRef,
  type SeedBook,
  systemRef,
} from './book.js';
import { EXPERIMENT } from './catalogue.js';

export const INSTITUTION = {
  bits: 'bitshyd',
  konark: 'konark',
  sahyadri: 'sahyadri',
  vizag: 'vizag',
  deccan: 'deccan',
  malnad: 'malnad',
} as const;

const item = (experimentId: string, formats: readonly Technology[]): RequestedItem => ({
  experimentId: unsafeBrand(experimentId),
  formats,
});

const PAYMENT = systemRef('system:payment-provider');

interface RequestSeed {
  readonly id: string;
  readonly type: AccessRequest['type'];
  readonly origin: AccessRequest['origin'];
  readonly institutionId: string | null;
  readonly institutionName: string;
  readonly contact: AccessRequest['contact'];
  readonly items: readonly RequestedItem[];
  readonly licences: number;
  readonly term: RequestedTerm;
  readonly message?: string;
  readonly sourcePlanId?: string;
  /** The route of a request from an existing institution: its kind (B1-10 "Route"). */
  readonly route?: InstitutionKind;
  readonly received: IsoInstant;
  /** Who sent it: the requester, or the institution's Institute Admin. */
  readonly sender: ActorRef;
  readonly approved?: { readonly at: IsoInstant; readonly route: InstitutionKind };
  readonly information?: { readonly at: IsoInstant; readonly reason: string };
  readonly paymentStarted?: IsoInstant;
  readonly paymentConfirmed?: IsoInstant;
  readonly activatedPlanId?: string;
  readonly evidence: string;
}

function statusOf(seed: RequestSeed): RequestStatus {
  if (seed.information) return 'information-requested';
  if (!seed.approved) return 'under-review';
  if (seed.approved.route === 'internal' || seed.paymentConfirmed) return 'access-active';
  return seed.paymentStarted ? 'payment-not-confirmed' : 'approved-payment-required';
}

function addRequest(book: SeedBook, seed: RequestSeed): void {
  const status = statusOf(seed);
  const history: HistoryEntry<RequestEvent>[] = [
    book.entry({
      event: 'submitted',
      at: seed.received,
      actor: seed.sender,
      visibleTo: ['public', 'tenant_admin', 'super_admin'],
    }),
  ];
  if (seed.information) {
    history.push(
      book.entry({
        event: 'information-requested',
        at: seed.information.at,
        actor: ARJUN,
        note: seed.information.reason,
        visibleTo: ['public', 'tenant_admin', 'super_admin'],
      }),
    );
  }
  if (seed.approved) {
    history.push(
      book.entry({
        event: 'approved',
        at: seed.approved.at,
        actor: ARJUN,
        note: seed.approved.route,
        visibleTo: ['public', 'tenant_admin', 'super_admin'],
      }),
    );
  }
  if (seed.paymentStarted) {
    history.push(
      book.entry({
        event: 'payment-started',
        at: seed.paymentStarted,
        actor: seed.sender,
        visibleTo: ['public', 'tenant_admin', 'super_admin'],
      }),
    );
  }
  const activatedAt =
    seed.paymentConfirmed ?? (status === 'access-active' ? seed.approved?.at : undefined);
  if (seed.paymentConfirmed) {
    history.push(
      book.entry({
        event: 'payment-confirmed',
        at: seed.paymentConfirmed,
        actor: PAYMENT,
        visibleTo: ['public', 'tenant_admin', 'super_admin'],
      }),
    );
  }
  if (activatedAt && seed.activatedPlanId) {
    history.push(
      book.entry({
        event: 'access-active',
        at: activatedAt,
        actor: seed.paymentConfirmed ? PAYMENT : ARJUN,
        note: seed.activatedPlanId,
        visibleTo: ['public', 'tenant_admin', 'super_admin'],
        refs: [refOfKind('ACC', seed.activatedPlanId)],
      }),
    );
  }
  const updated = history.at(-1)!.at;
  const request: AccessRequest = {
    ...meta(seed.received, updated, history.length),
    id: unsafeBrand(seed.id),
    statusToken: book.ids.next('statusToken'),
    type: seed.type,
    origin: seed.origin,
    institutionId: seed.institutionId ? unsafeBrand(seed.institutionId) : null,
    institutionName: seed.institutionName,
    contact: seed.contact,
    items: seed.items,
    licencesRequested: seed.licences,
    term: seed.term,
    message: seed.message ?? null,
    sourcePlanId: seed.sourcePlanId ? unsafeBrand(seed.sourcePlanId) : null,
    receivedAt: seed.received,
    // "BITS started reviewing" is a seeded or test-only fact (AD-14): set for the requests the
    // boards show past review.
    reviewStartedAt: seed.approved?.at ?? seed.information?.at ?? null,
    status,
    route: seed.approved?.route ?? seed.route ?? null,
    decision: seed.approved
      ? {
          kind: 'approved-as-requested',
          at: seed.approved.at,
          by: ARJUN,
          route: seed.approved.route,
        }
      : null,
    informationRequest: seed.information
      ? { reason: seed.information.reason, at: seed.information.at, by: ARJUN }
      : null,
    payments: seed.paymentStarted
      ? [
          {
            id: book.ids.next('paymentAttempt'),
            startedAt: seed.paymentStarted,
            outcome: seed.paymentConfirmed ? 'confirmed' : 'pending',
            outcomeAt: seed.paymentConfirmed ?? null,
          },
        ]
      : [],
    activatedPlanId: seed.activatedPlanId ? unsafeBrand(seed.activatedPlanId) : null,
    history,
  };
  book.put(
    'requests',
    seed.id,
    request,
    note(seed.evidence, `${seed.id} · ${seed.institutionName}`),
  );
}

interface InstitutionSeed {
  readonly id: string;
  readonly name: string;
  readonly kind: InstitutionKind;
  readonly fromRequest: string;
  readonly created: IsoInstant;
  readonly admin?: {
    readonly personId: string;
    readonly name: string;
    readonly email: string;
    readonly at: IsoInstant;
  };
  readonly plan?: {
    readonly id: string;
    readonly items: readonly RequestedItem[];
    readonly licences: number;
    readonly term: AccessPlanTerm;
    readonly startsOn: CalendarDate;
    readonly endsOn: CalendarDate;
    readonly activated: IsoInstant;
  };
  readonly requested?: readonly {
    readonly requestId: string;
    readonly at: IsoInstant;
    readonly event: 'renewal-requested' | 'licences-requested';
  }[];
  readonly evidence: string;
}

function addInstitution(book: SeedBook, seed: InstitutionSeed): void {
  const history: HistoryEntry<InstitutionEvent>[] = [
    book.entry({
      event: 'record-created',
      at: seed.created,
      actor: ARJUN,
      note: seed.kind,
      visibleTo: ['super_admin'],
      refs: [refOfKind('REQ', seed.fromRequest)],
    }),
  ];
  if (seed.plan) {
    history.push(
      book.entry({
        event: 'access-activated',
        at: seed.plan.activated,
        actor: seed.kind === 'internal' ? ARJUN : PAYMENT,
        visibleTo: ['super_admin'],
        refs: [refOfKind('REQ', seed.fromRequest), refOfKind('ACC', seed.plan.id)],
      }),
    );
  }
  if (seed.admin) {
    history.push(
      book.entry({
        event: 'institute-admin-assigned',
        at: seed.admin.at,
        actor: ARJUN,
        note: seed.admin.name,
        visibleTo: ['super_admin'],
      }),
    );
  }
  for (const request of seed.requested ?? []) {
    history.push(
      book.entry({
        event: request.event,
        at: request.at,
        actor: seed.admin ? personRef(seed.admin.personId, 'tenant_admin', seed.admin.name) : ARJUN,
        visibleTo: ['super_admin'],
        refs: [refOfKind('REQ', request.requestId)],
      }),
    );
  }
  history.sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0));
  const institution: Institution = {
    ...meta(seed.created, history.at(-1)!.at, history.length),
    id: unsafeBrand(seed.id),
    name: seed.name,
    kind: seed.kind,
    createdFromRequestId: unsafeBrand(seed.fromRequest),
    pause: null,
    instituteAdmin: seed.admin
      ? {
          id: book.ids.next('instituteAdminAssignment'),
          institutionId: unsafeBrand(seed.id),
          name: seed.admin.name,
          workEmail: seed.admin.email,
          assignedAt: seed.admin.at,
          assignedBy: ARJUN,
          personId: unsafeBrand(seed.admin.personId),
        }
      : null,
    history,
  };
  book.put('institutions', seed.id, institution, note(seed.evidence, seed.name));
  if (seed.plan) {
    const plan: AccessPlan = {
      ...meta(seed.plan.activated),
      id: unsafeBrand(seed.plan.id),
      institutionId: unsafeBrand(seed.id),
      sourceRequestId: unsafeBrand(seed.fromRequest),
      items: seed.plan.items,
      licences: provided(seed.plan.licences),
      term: seed.plan.term,
      startsOn: seed.plan.startsOn,
      endsOn: seed.plan.endsOn,
      activatedAt: seed.plan.activated,
      history: [
        book.entry({
          event: 'activated',
          at: seed.plan.activated,
          actor: seed.kind === 'internal' ? ARJUN : PAYMENT,
          visibleTo: ['tenant_admin', 'super_admin'],
          refs: [refOfKind('REQ', seed.fromRequest), refOfKind('ACC', seed.plan.id)],
        }),
      ],
    };
    book.put('plans', seed.plan.id, plan, note(seed.evidence, `${seed.plan.id} · ${seed.name}`));
  }
}

const SRINIVAS = {
  personId: 'per-p-srinivas',
  name: 'Dr P. Srinivas',
  email: 'p.srinivas@hyderabad.bits-pilani.ac.in',
};
const BHATT = { personId: 'per-r-bhatt', name: 'R. Bhatt', email: 'r.bhatt@konarkpoly.edu.in' };
const KULKARNI = {
  personId: 'per-s-kulkarni',
  name: 'S. Kulkarni',
  email: 's.kulkarni@deccan.example',
};
const HEGDE = { personId: 'per-v-hegde', name: 'V. Hegde', email: 'v.hegde@malnad.example' };

export function addInstitutionsAndRequests(book: SeedBook): void {
  // Malnad College of Engineering — ACC-0079, Quarterly 15 Jul – 15 Oct 2026 (ends during the walk).
  const malnadOn = ist('2026-07-15 10:30');
  addRequest(book, {
    id: 'REQ-0027',
    type: 'new-access',
    origin: 'public',
    institutionId: INSTITUTION.malnad,
    institutionName: 'Malnad College of Engineering',
    contact: { person: HEGDE.name, email: HEGDE.email, phone: null },
    items: [item(EXPERIMENT.orifice, ['web', 'ar'])],
    licences: 20,
    term: { kind: 'quarterly' },
    received: ist('2026-07-15 09:00'),
    sender: requesterRef(HEGDE.name),
    approved: { at: ist('2026-07-15 09:30'), route: 'external' },
    paymentStarted: ist('2026-07-15 10:00'),
    paymentConfirmed: malnadOn,
    activatedPlanId: 'ACC-0079',
    evidence: 'B7-03 malnad (origin REQ-0027)',
  });
  addInstitution(book, {
    id: INSTITUTION.malnad,
    name: 'Malnad College of Engineering',
    kind: 'external',
    fromRequest: 'REQ-0027',
    created: ist('2026-07-15 09:30'),
    admin: { ...HEGDE, at: ist('2026-07-15 11:00') },
    plan: {
      id: 'ACC-0079',
      items: [item(EXPERIMENT.orifice, ['web', 'ar'])],
      licences: 20,
      term: 'quarterly',
      startsOn: day('2026-07-15'),
      endsOn: day('2026-10-15'),
      activated: malnadOn,
    },
    evidence: 'B7-02, B7-03 malnad — "Access ended · ACC-0079 · 15 Oct 2026"',
  });

  // Deccan Institute of Technology — ACC-0085, Yearly 14 Jul 2026 – 13 Jul 2027.
  const deccanOn = ist('2026-07-14 10:30');
  addRequest(book, {
    id: 'REQ-0029',
    type: 'new-access',
    origin: 'public',
    institutionId: INSTITUTION.deccan,
    institutionName: 'Deccan Institute of Technology',
    contact: { person: KULKARNI.name, email: KULKARNI.email, phone: null },
    items: [item(EXPERIMENT.transformer, ['web'])],
    licences: 30,
    term: { kind: 'yearly' },
    received: ist('2026-07-14 09:00'),
    sender: requesterRef(KULKARNI.name),
    approved: { at: ist('2026-07-14 09:30'), route: 'external' },
    paymentStarted: ist('2026-07-14 10:00'),
    paymentConfirmed: deccanOn,
    activatedPlanId: 'ACC-0085',
    evidence: 'B7-03 deccan (origin REQ-0029)',
  });
  addInstitution(book, {
    id: INSTITUTION.deccan,
    name: 'Deccan Institute of Technology',
    kind: 'external',
    fromRequest: 'REQ-0029',
    created: ist('2026-07-14 09:30'),
    admin: { ...KULKARNI, at: ist('2026-07-14 11:00') },
    plan: {
      id: 'ACC-0085',
      items: [item(EXPERIMENT.transformer, ['web'])],
      licences: 30,
      term: 'yearly',
      startsOn: day('2026-07-14'),
      endsOn: day('2027-07-13'),
      activated: deccanOn,
    },
    evidence: 'B7-02, B7-03 deccan',
  });

  // Konark Polytechnic — ACC-0091 (S-1 B7 variant); REQ-0040 additional licences under review.
  const konarkOn = ist('2026-08-03 10:30');
  addRequest(book, {
    id: 'REQ-0031',
    type: 'new-access',
    origin: 'public',
    institutionId: INSTITUTION.konark,
    institutionName: 'Konark Polytechnic',
    contact: { person: BHATT.name, email: BHATT.email, phone: null },
    items: [item(EXPERIMENT.buck, ['web', 'ar'])],
    licences: 60,
    term: { kind: 'quarterly' },
    received: ist('2026-08-03 09:00'),
    sender: requesterRef(BHATT.name),
    approved: { at: ist('2026-08-03 09:30'), route: 'external' },
    paymentStarted: ist('2026-08-03 10:00'),
    paymentConfirmed: konarkOn,
    activatedPlanId: 'ACC-0091',
    evidence: 'B7-03 konark — "Access active · ACC-0091 · 3 Aug 2026 · Payment confirmed."',
  });
  addInstitution(book, {
    id: INSTITUTION.konark,
    name: 'Konark Polytechnic',
    kind: 'external',
    fromRequest: 'REQ-0031',
    created: ist('2026-08-03 09:30'),
    admin: { ...BHATT, at: ist('2026-08-03 11:00') },
    plan: {
      id: 'ACC-0091',
      items: [item(EXPERIMENT.buck, ['web', 'ar'])],
      licences: 60,
      term: 'quarterly',
      startsOn: day('2026-08-03'),
      endsOn: day('2026-11-02'),
      activated: konarkOn,
    },
    requested: [
      { requestId: 'REQ-0040', at: ist('2026-09-29 12:37'), event: 'licences-requested' },
    ],
    evidence: 'B7-02, B7-03 konark (S-1 B7 variant)',
  });
  addRequest(book, {
    id: 'REQ-0040',
    type: 'additional-licences',
    origin: 'institute-admin',
    institutionId: INSTITUTION.konark,
    institutionName: 'Konark Polytechnic',
    contact: { person: BHATT.name, email: BHATT.email, phone: '+91 674 000 0000' },
    items: [item(EXPERIMENT.buck, ['web', 'ar'])],
    licences: 60,
    term: { kind: 'current-plan' },
    message: 'A second section has joined the course.',
    sourcePlanId: 'ACC-0091',
    route: 'external',
    received: ist('2026-09-29 12:37'),
    sender: personRef(BHATT.personId, 'tenant_admin', BHATT.name),
    evidence: 'B1-10, B1-11 REQ-0040 (under review)',
  });

  // Sahyadri Institute of Engineering — ACC-0102; no Institute Admin (B7-03 "No Institute Admin yet").
  addRequest(book, {
    id: 'REQ-0033',
    type: 'new-access',
    origin: 'public',
    institutionId: INSTITUTION.sahyadri,
    institutionName: 'Sahyadri Institute of Engineering',
    contact: { person: 'N. Joshi', email: 'n.joshi@sahyadri.example', phone: null },
    items: [item(EXPERIMENT.cnc, ['mr'])],
    licences: 40,
    term: { kind: 'yearly' },
    received: ist('2026-09-11 10:00'),
    sender: requesterRef('N. Joshi'),
    approved: { at: ist('2026-09-12 10:00'), route: 'external' },
    paymentStarted: ist('2026-09-29 10:00'),
    paymentConfirmed: ist('2026-09-30 10:00'),
    activatedPlanId: 'ACC-0102',
    evidence: 'B7-03 sahyadri — approved 12 Sep, "Access active · ACC-0102 · 30 Sep 2026"',
  });
  addInstitution(book, {
    id: INSTITUTION.sahyadri,
    name: 'Sahyadri Institute of Engineering',
    kind: 'external',
    fromRequest: 'REQ-0033',
    created: ist('2026-09-12 10:00'),
    plan: {
      id: 'ACC-0102',
      items: [item(EXPERIMENT.cnc, ['mr'])],
      licences: 40,
      term: 'yearly',
      startsOn: day('2026-09-30'),
      endsOn: day('2027-09-29'),
      activated: ist('2026-09-30 10:00'),
    },
    requested: [
      { requestId: 'REQ-0036', at: ist('2026-09-18 10:00'), event: 'licences-requested' },
    ],
    evidence: 'B7-02, B7-03 sahyadri (no Institute Admin)',
  });
  addRequest(book, {
    id: 'REQ-0036',
    type: 'additional-licences',
    origin: 'institute-admin',
    institutionId: INSTITUTION.sahyadri,
    institutionName: 'Sahyadri Institute of Engineering',
    contact: { person: 'N. Joshi', email: 'n.joshi@sahyadri.example', phone: null },
    items: [item(EXPERIMENT.cnc, ['mr'])],
    licences: 20,
    term: { kind: 'current-plan' },
    received: ist('2026-09-18 10:00'),
    sender: requesterRef('N. Joshi'),
    approved: { at: ist('2026-09-22 10:00'), route: 'external' },
    paymentStarted: ist('2026-09-23 10:00'),
    evidence: 'B1-10 REQ-0036 (additional licences, payment not confirmed); B7-03 sahyadri',
  });

  // Vizag Polytechnic — approved, payment required; no plan (B7-02 "payment").
  addRequest(book, {
    id: 'REQ-0037',
    type: 'new-access',
    origin: 'public',
    institutionId: INSTITUTION.vizag,
    institutionName: 'Vizag Polytechnic',
    contact: { person: 'K. Rao', email: 'k.rao@vizagpoly.example', phone: null },
    items: [item(EXPERIMENT.distillation, ['web', 'vr'])],
    licences: 50,
    term: { kind: 'yearly' },
    received: ist('2026-09-22 10:00'),
    sender: requesterRef('K. Rao'),
    approved: { at: ist('2026-09-22 15:00'), route: 'external' },
    evidence: 'B1-10, B7-03 vizag — "Approved — payment required (REQ-0037)"',
  });
  addInstitution(book, {
    id: INSTITUTION.vizag,
    name: 'Vizag Polytechnic',
    kind: 'external',
    fromRequest: 'REQ-0037',
    created: ist('2026-09-22 15:00'),
    evidence: 'B7-02, B7-03 vizag',
  });

  // BITS Pilani — Hyderabad Campus — ACC-0098 (S-2 B7 variant); REQ-0038 renewal under review.
  const bitsOn = ist('2026-09-26 11:00');
  addRequest(book, {
    id: 'REQ-0039',
    type: 'new-access',
    origin: 'public',
    institutionId: INSTITUTION.bits,
    institutionName: 'BITS Pilani — Hyderabad Campus',
    contact: { person: 'A. Menon', email: 'a.menon@hyderabad.bits-pilani.ac.in', phone: null },
    items: [item(EXPERIMENT.distillation, ['web', 'vr']), item(EXPERIMENT.boiler, ['web', 'vr'])],
    licences: 80,
    term: { kind: 'monthly' },
    received: ist('2026-09-26 09:00'),
    sender: requesterRef('A. Menon'),
    approved: { at: bitsOn, route: 'internal' },
    activatedPlanId: 'ACC-0098',
    evidence: 'B1-10 REQ-0039; B7-03 bitshyd — "Request REQ-0039 approved · Internal"',
  });
  addInstitution(book, {
    id: INSTITUTION.bits,
    name: 'BITS Pilani — Hyderabad Campus',
    kind: 'internal',
    fromRequest: 'REQ-0039',
    created: bitsOn,
    admin: { ...SRINIVAS, at: ist('2026-09-26 11:30') },
    plan: {
      id: 'ACC-0098',
      items: [item(EXPERIMENT.distillation, ['web', 'vr']), item(EXPERIMENT.boiler, ['web', 'vr'])],
      licences: 80,
      term: 'monthly',
      startsOn: day('2026-10-01'),
      endsOn: day('2026-10-31'),
      activated: bitsOn,
    },
    requested: [{ requestId: 'REQ-0038', at: ist('2026-09-26 16:02'), event: 'renewal-requested' }],
    evidence: 'B7-02, B7-03 bitshyd (S-2 B7 variant)',
  });
  addRequest(book, {
    id: 'REQ-0038',
    type: 'renewal',
    origin: 'institute-admin',
    institutionId: INSTITUTION.bits,
    institutionName: 'BITS Pilani — Hyderabad Campus',
    contact: { person: 'A. Menon', email: 'a.menon@hyderabad.bits-pilani.ac.in', phone: null },
    items: [item(EXPERIMENT.distillation, ['web', 'vr']), item(EXPERIMENT.boiler, ['web', 'vr'])],
    licences: 80,
    term: { kind: 'monthly' },
    message: 'Renewal for the next academic year, same experiments.',
    sourcePlanId: 'ACC-0098',
    route: 'internal',
    received: ist('2026-09-26 16:02'),
    sender: personRef(SRINIVAS.personId, 'tenant_admin', SRINIVAS.name),
    evidence: 'B1-10, B1-11 REQ-0038 (renewal, under review); re-dated to follow ACC-0098',
  });

  // Krishna College of Engineering — no institution record yet; information requested.
  addRequest(book, {
    id: 'REQ-0041',
    type: 'new-access',
    origin: 'public',
    institutionId: null,
    institutionName: 'Krishna College of Engineering',
    contact: { person: 'S. Pillai', email: 's.pillai@krishna.example', phone: null },
    items: [
      item(EXPERIMENT.shellAndTube, ['web']),
      item(EXPERIMENT.finTube, ['web']),
      item(EXPERIMENT.compositeWall, ['web']),
    ],
    licences: 60,
    term: { kind: 'yearly' },
    received: ist('2026-09-30 10:00'),
    sender: requesterRef('S. Pillai'),
    information: {
      at: ist('2026-10-01 11:00'),
      reason: 'Please confirm how many students will use VR in the first term.',
    },
    evidence: 'B1-10 REQ-0041 (information requested); B1-08 f3 reason',
  });
}
