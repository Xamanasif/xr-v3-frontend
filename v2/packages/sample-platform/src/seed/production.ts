/**
 * Background production records (B5-02, B6-01 … B6-11, B7-05, B7-06): the submissions in every
 * Vendor / Reviewer / Content Manager state the boards draw, and the corrections UPD-0001 …
 * UPD-0004 and UPD-0006. SUB-0077 and UPD-0005 are not here — Flows E and F create them.
 *
 * SUB-0085 "DC Motor Speed Control" is "Stuck — nobody can act" (B7-06 f4): with the Academic
 * Reviewer since 2 Oct 2026 while no reviewer's scope covers EEE ZC341 (Prof. A. Menon's was
 * withdrawn on 1 Oct, S-7; Dr K. Iyer has none). It is derived from the scopes (`isStuck`), never
 * stored.
 *
 * Fills where no board draws a value (sample only): the submission and send dates before a drawn
 * decision, SUB-0070's three outcome texts (B6-06 draws only "3"), the summaries of SUB-0081 and
 * SUB-0085, package labels / install notes of submitted AR and VR formats, the release and review dates of
 * UPD-0001 / UPD-0002 before their drawn release day, and UPD-0004's hold reason. B6-06's
 * "SUB-0070 shows 1 to resolve" is not reproduced: which conditions block publication is open
 * (OD-B6-03), and a submitted record already passed the checklist the publication check repeats.
 */
import {
  type AcademicReviewDecision,
  type ContentManagerDecision,
  type CorrectionFields,
  type CorrectionUpdate,
  type HistoryEntry,
  type IsoInstant,
  type LearningOutcome,
  type ReturnReference,
  type Submission,
  type SubmissionContent,
  type SubmissionEvent,
  type SubmissionStatus,
  type Technology,
  unsafeBrand,
  type UpdateEvent,
  type UpdateId,
} from '@xr/domain';

import { ARJUN, ist, meta, note, personRef, type SeedBook } from './book.js';
import { COURSE, EXPERIMENT, KAVYA_PERSON } from './catalogue.js';
import { HOLDER } from './roles.js';

const ANIL = personRef('per-anil-shetty', 'vendor', 'Anil Shetty');
const RITU = personRef('per-ritu-sharma', 'vendor', 'Ritu Sharma');
const MENON = personRef('per-a-menon', 'academic_reviewer', 'Prof. A. Menon');
const KAVYA = personRef(KAVYA_PERSON, 'content_manager', 'Kavya Nair');

const STAFF = ['vendor', 'academic_reviewer', 'content_manager', 'super_admin'] as const;

interface ContentSeed {
  readonly courseId: string;
  readonly name: string;
  readonly summary: string | null;
  readonly description: string | null;
  readonly formats: readonly Technology[];
  readonly webLink?: string;
  readonly documents?: readonly string[];
}

function contentOf(seed: ContentSeed): SubmissionContent {
  const delivery: SubmissionContent['delivery'] = {};
  const writable = delivery as Record<Technology, SubmissionContent['delivery'][Technology]>;
  for (const format of seed.formats) {
    writable[format] =
      format === 'web'
        ? {
            format: 'web',
            webLink: seed.webLink ?? null,
            browserAndComputer: 'A current browser on a laptop or desktop',
            notes: null,
          }
        : {
            format,
            packageLabel: `${seed.name} — ${format.toUpperCase()} build 1.0`,
            packageReference: null,
            packageFileName: `${seed.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${format}-1.0.zip`,
            deviceNeeded:
              format === 'ar'
                ? 'Supported phone or tablet'
                : `Supported ${format.toUpperCase()} headset`,
            installNotes: 'Install the build named above.',
            notes: null,
          };
  }
  return {
    courseId: unsafeBrand(seed.courseId),
    name: seed.name,
    summary: seed.summary,
    description: seed.description,
    version: '1.0',
    formats: seed.formats,
    delivery,
    preview: { label: null, link: null },
    documents: (seed.documents ?? []).map((fileName) => ({ fileName })),
  };
}

interface SubmissionSeed {
  readonly id: string;
  readonly vendor: 'anil' | 'ritu';
  readonly content: ContentSeed;
  readonly created: IsoInstant;
  readonly submitted?: IsoInstant;
  readonly outcomes?: readonly string[];
  readonly approved?: IsoInstant;
  readonly returned?: {
    readonly at: IsoInstant;
    readonly reason: string;
    readonly references: readonly ReturnReference[];
  };
  readonly recheck?: { readonly at: IsoInstant; readonly reason: string };
  readonly published?: { readonly at: IsoInstant; readonly experimentId: string };
  readonly evidence: string;
}

function addSubmission(book: SeedBook, seed: SubmissionSeed): void {
  const vendor = seed.vendor === 'anil' ? ANIL : RITU;
  const holderId = seed.vendor === 'anil' ? HOLDER.anil : HOLDER.ritu;
  const organisation =
    seed.vendor === 'anil' ? 'Northline Simulation Studio' : 'Meridian Virtual Labs';
  const outcomes: LearningOutcome[] = (seed.outcomes ?? []).map((text) => ({
    id: book.ids.next('learningOutcome'),
    text,
  }));
  const history: HistoryEntry<SubmissionEvent>[] = [
    book.entry({ event: 'draft-saved', at: seed.created, actor: vendor, visibleTo: ['vendor'] }),
  ];
  const reviewDecisions: AcademicReviewDecision[] = [];
  const cmDecisions: ContentManagerDecision[] = [];
  let status: SubmissionStatus = { state: 'draft' };
  if (seed.submitted) {
    history.push(
      book.entry({ event: 'submitted', at: seed.submitted, actor: vendor, visibleTo: STAFF }),
    );
    status = { state: 'with-academic-reviewer', since: seed.submitted, reason: 'first-review' };
  }
  if (seed.returned) {
    reviewDecisions.push({
      revision: 1,
      decision: 'return-to-vendor',
      reason: seed.returned.reason,
      references: seed.returned.references,
      outcomesAtDecision: outcomes,
      wasRecheck: false,
      decidedAt: seed.returned.at,
      decidedBy: MENON,
    });
    history.push(
      book.entry({
        event: 'returned-by-reviewer',
        at: seed.returned.at,
        actor: MENON,
        note: seed.returned.reason,
        visibleTo: STAFF,
      }),
    );
    status = { state: 'returned', since: seed.returned.at, by: 'academic-reviewer' };
  }
  if (seed.approved) {
    reviewDecisions.push({
      revision: 1,
      decision: 'approve',
      reason: null,
      references: [],
      outcomesAtDecision: outcomes,
      wasRecheck: false,
      decidedAt: seed.approved,
      decidedBy: MENON,
    });
    history.push(
      book.entry({
        event: 'approved-by-reviewer',
        at: seed.approved,
        actor: MENON,
        visibleTo: STAFF,
      }),
    );
    status = { state: 'with-content-manager', since: seed.approved };
  }
  if (seed.recheck) {
    cmDecisions.push({
      kind: 'send-back-to-reviewer',
      reason: seed.recheck.reason,
      at: seed.recheck.at,
      by: KAVYA,
    });
    history.push(
      book.entry({
        event: 'sent-back-for-recheck',
        at: seed.recheck.at,
        actor: KAVYA,
        note: seed.recheck.reason,
        visibleTo: STAFF,
      }),
    );
    status = { state: 'with-academic-reviewer', since: seed.recheck.at, reason: 'recheck' };
  }
  if (seed.published) {
    cmDecisions.push({ kind: 'publish', at: seed.published.at, by: KAVYA });
    history.push(
      book.entry({ event: 'published', at: seed.published.at, actor: KAVYA, visibleTo: STAFF }),
    );
    status = {
      state: 'published',
      at: seed.published.at,
      experimentId: unsafeBrand(seed.published.experimentId),
    };
  }
  const updated = history.at(-1)!.at;
  const submission: Submission = {
    ...meta(seed.created, updated, history.length),
    id: unsafeBrand(seed.id),
    vendorHolderId: unsafeBrand(holderId),
    vendorOrganisation: organisation,
    status,
    revision: 1,
    content: contentOf(seed.content),
    learningOutcomes: outcomes,
    lastStepReached: seed.submitted ? 'submit' : 'course',
    reviewDecisions,
    contentManagerDecisions: cmDecisions,
    overrides: [],
    firstSubmittedAt: seed.submitted ?? null,
    lastResubmittedAt: null,
    history,
  };
  book.put(
    'submissions',
    seed.id,
    submission,
    note(seed.evidence, `${seed.id} · ${seed.content.name}`),
  );
}

interface UpdateSeed {
  readonly id: string;
  readonly experimentId: string;
  readonly base: string;
  readonly versionLabel: string;
  readonly started: IsoInstant;
  readonly sent: IsoInstant;
  readonly whatChangesAndWhy: string;
  readonly returned?: { readonly at: IsoInstant; readonly reason: string };
  readonly approved?: IsoInstant;
  readonly hold?: { readonly at: IsoInstant; readonly reason: string };
  readonly released?: IsoInstant;
  readonly evidence: string;
}

function liveFieldsOf(book: SeedBook, experimentId: string): CorrectionFields {
  const experiment = book.get('experiments', experimentId);
  let webLink: string | null = null;
  const packageReferences: Partial<Record<'ar' | 'vr' | 'mr', string>> = {};
  for (const entry of experiment.live.formats) {
    if (entry.delivery.format === 'web') webLink = entry.delivery.webLink;
    else if (entry.delivery.packageReference)
      packageReferences[entry.delivery.format] = entry.delivery.packageReference;
  }
  return { ...experiment.live.catalogue, webLink, packageReferences };
}

function addUpdate(book: SeedBook, seed: UpdateSeed): void {
  const chain = ['content_manager', 'academic_reviewer', 'super_admin'] as const;
  const history: HistoryEntry<UpdateEvent>[] = [
    book.entry({
      event: 'started',
      at: seed.started,
      actor: KAVYA,
      note: 'start-a-correction',
      visibleTo: ['content_manager'],
    }),
    book.entry({
      event: 'sent-for-academic-review',
      at: seed.sent,
      actor: KAVYA,
      visibleTo: ['content_manager', 'academic_reviewer'],
    }),
  ];
  const reviewDecisions: CorrectionUpdate['reviewDecisions'][number][] = [];
  let state: CorrectionUpdate['state'] = 'in-academic-review';
  if (seed.returned) {
    reviewDecisions.push({
      decision: 'return-to-content-manager',
      reason: seed.returned.reason,
      at: seed.returned.at,
      by: MENON,
    });
    history.push(
      book.entry({
        event: 'returned-by-reviewer',
        at: seed.returned.at,
        actor: MENON,
        note: seed.returned.reason,
        visibleTo: ['content_manager', 'academic_reviewer'],
      }),
    );
    state = 'returned';
  }
  if (seed.approved) {
    reviewDecisions.push({ decision: 'approve', reason: null, at: seed.approved, by: MENON });
    history.push(
      book.entry({
        event: 'approved-by-reviewer',
        at: seed.approved,
        actor: MENON,
        visibleTo: chain,
      }),
    );
    state = 'awaiting-release-decision';
  }
  if (seed.hold) {
    history.push(
      book.entry({
        event: 'put-on-hold',
        at: seed.hold.at,
        actor: ARJUN,
        note: seed.hold.reason,
        visibleTo: ['content_manager', 'super_admin'],
      }),
    );
    state = 'on-hold';
  }
  if (seed.released) {
    history.push(
      book.entry({ event: 'released', at: seed.released, actor: ARJUN, visibleTo: chain }),
    );
    state = 'released';
  }
  const updated = history.at(-1)!.at;
  const update: CorrectionUpdate = {
    ...meta(seed.started, updated, history.length),
    id: unsafeBrand(seed.id),
    experimentId: unsafeBrand(seed.experimentId),
    baseVersionLabel: seed.base,
    state,
    entry: 'start-a-correction',
    proposed: liveFieldsOf(book, seed.experimentId),
    whatChangesAndWhy: seed.whatChangesAndWhy,
    versionLabel: seed.versionLabel,
    startedAt: seed.started,
    startedBy: KAVYA,
    sentForReviewAt: seed.sent,
    reviewDecisions,
    hold: seed.hold ? { at: seed.hold.at, by: ARJUN, reason: seed.hold.reason } : null,
    holdLifts: [],
    release: seed.released ? { at: seed.released, by: ARJUN } : null,
    withdrawal: null,
    history,
  };
  book.put(
    'updates',
    seed.id,
    update,
    note(seed.evidence, `${seed.id} · ${seed.base} → ${seed.versionLabel}`),
  );
}

/** An open correction is the experiment's one open update (B6-08; On hold counts). */
function linkOpenUpdate(
  book: SeedBook,
  experimentId: string,
  updateId: string,
  at: IsoInstant,
): void {
  const experiment = book.get('experiments', experimentId);
  book.replace('experiments', experimentId, {
    ...experiment,
    rev: experiment.rev + 1,
    updatedAt: at,
    openUpdateId: unsafeBrand<UpdateId>(updateId),
  });
}

/** SUB-0052 published Fin-Tube Bundle (B5-02; B6-02 "Approved — published · 24 Jul"). */
function linkFirstPublication(book: SeedBook, experimentId: string, submissionId: string): void {
  const experiment = book.get('experiments', experimentId);
  const versions = experiment.versions.map((version, index) =>
    index === 0
      ? {
          ...version,
          source: {
            kind: 'first-publication' as const,
            submissionId: unsafeBrand<Submission['id']>(submissionId),
            revision: 1,
          },
        }
      : version,
  );
  book.replace('experiments', experimentId, {
    ...experiment,
    originSubmissionId: unsafeBrand<Submission['id']>(submissionId),
    versions,
    live: versions.at(-1)!,
  });
}

export function addProduction(book: SeedBook): void {
  addSubmission(book, {
    id: 'SUB-0052',
    vendor: 'anil',
    content: {
      courseId: COURSE.thermo,
      name: 'Fin-Tube Bundle',
      summary:
        'Introduce progressive fouling on the tube side and measure its effect on the overall heat transfer coefficient.',
      description:
        'Introduce progressive fouling on the tube side and measure its effect on the overall heat transfer coefficient.',
      formats: ['web', 'vr'],
      webLink: 'https://labs.northline.example/fin-tube-bundle',
    },
    created: ist('2026-07-15 10:00'),
    submitted: ist('2026-07-17 10:00'),
    outcomes: [
      'Quantify the effect of fouling on the overall heat transfer coefficient',
      'Distinguish degradation from measurement drift',
    ],
    approved: ist('2026-07-24 10:00'),
    published: { at: ist('2026-07-30 10:00'), experimentId: EXPERIMENT.finTube },
    evidence: 'B5-02 SUB-0052 published 30 Jul; B6-02 approved 24 Jul',
  });
  linkFirstPublication(book, EXPERIMENT.finTube, 'SUB-0052');

  addSubmission(book, {
    id: 'SUB-0074',
    vendor: 'anil',
    content: {
      courseId: COURSE.thermo,
      name: 'Transient Cooling',
      summary:
        'Cool a heated cylinder in still air and water, and test when the lumped-capacitance model holds.',
      description:
        'Learners heat aluminium and steel cylinders, log their cooling in air and in water, and compare the curves with the lumped model using the Biot number.',
      formats: ['web'],
      webLink: 'https://labs.northline.example/transient-cooling',
    },
    created: ist('2026-08-01 10:00'),
    submitted: ist('2026-08-06 12:02'),
    outcomes: [
      'Decide when the lumped-capacitance model applies, using the Biot number.',
      'Estimate a heat transfer coefficient from a measured cooling curve.',
    ],
    approved: ist('2026-08-14 15:10'),
    evidence: 'B5-06 / B6-06 SUB-0074 — with the Content Manager since 14 Aug',
  });

  addSubmission(book, {
    id: 'SUB-0070',
    vendor: 'ritu',
    content: {
      courseId: COURSE.process,
      name: 'Packed Bed Pressure Drop',
      summary:
        'Push air through a packed bed and compare the pressure drop you measure with the Ergun equation.',
      description:
        'Learners change the air flow through beds of glass beads and Raschig rings, read the pressure drop, and fit the Ergun constants from their own data.',
      formats: ['web', 'ar'],
      webLink: 'https://labs.meridian.example/packed-bed',
    },
    created: ist('2026-08-12 10:00'),
    submitted: ist('2026-08-14 10:00'),
    outcomes: [
      'Measure the pressure drop across a packed bed at several air flows.',
      'Compare the measured pressure drop with the Ergun equation.',
      'Fit the Ergun constants from your own readings.',
    ],
    approved: ist('2026-08-21 10:00'),
    evidence: 'B6-06 SUB-0070 — approved 21 Aug, with the Content Manager (3 outcomes)',
  });

  addSubmission(book, {
    id: 'SUB-0071',
    vendor: 'ritu',
    content: {
      courseId: COURSE.process,
      name: 'Venturi Meter Calibration',
      summary: 'Calibrate a Venturi meter against a weigh tank and find its discharge coefficient.',
      description:
        'Learners vary the flow, read the throat and inlet pressures and the collected mass, and plot the discharge coefficient against the Reynolds number.',
      formats: ['web', 'ar'],
      webLink: 'https://labs.meridian.example/venturi',
    },
    created: ist('2026-08-10 10:00'),
    submitted: ist('2026-08-12 10:00'),
    outcomes: [
      'Calibrate a Venturi meter against a weigh tank.',
      'Compare the discharge coefficient with a Pitot tube reading.',
      'Explain where the pressure is recovered downstream of the throat.',
    ],
    approved: ist('2026-08-18 10:00'),
    recheck: {
      at: ist('2026-08-25 10:00'),
      reason:
        'The second learning outcome mentions a Pitot tube, which this experiment does not use. Please check the outcomes.',
    },
    evidence: 'B6-02 SUB-0071 — back from the Content Manager for a re-check since 25 Aug',
  });

  addSubmission(book, {
    id: 'SUB-0079',
    vendor: 'anil',
    content: {
      courseId: COURSE.thermo,
      name: 'Pin Fin Efficiency',
      summary: null,
      description: null,
      formats: ['web'],
    },
    created: ist('2026-08-25 10:00'),
    evidence: 'B5-02 SUB-0079 — draft, saved 25 Aug (only the Vendor sees it)',
  });

  addSubmission(book, {
    id: 'SUB-0081',
    vendor: 'anil',
    content: {
      courseId: COURSE.thermo,
      name: 'Forced Convection',
      summary: 'Measure the heat transfer from a heated plate as the air speed over it rises.',
      description: 'Measure the heat transfer from a heated plate as the air speed over it rises.',
      formats: ['web', 'ar'],
      webLink: 'https://labs.northline.example/forced-convection',
    },
    created: ist('2026-08-17 10:00'),
    submitted: ist('2026-08-18 10:00'),
    returned: {
      at: ist('2026-08-24 10:00'),
      reason:
        'The AR install notes don’t say which phones and tablets it runs on. Add the supported devices and the install steps.',
      references: [
        { step: 'formats-and-delivery', format: 'ar', field: 'device-need' },
        { step: 'formats-and-delivery', format: 'ar', field: 'install-notes' },
      ],
    },
    evidence: 'B5-02 / B6-02 SUB-0081 — returned by the Academic Reviewer on 24 Aug',
  });

  addSubmission(book, {
    id: 'SUB-0083',
    vendor: 'anil',
    content: {
      courseId: COURSE.manufacturing,
      name: 'Surface Roughness in Turning',
      summary: null,
      description: null,
      formats: ['web'],
      webLink: 'https://labs.northline.example/surface-roughness',
    },
    created: ist('2026-08-14 10:00'),
    evidence:
      'B5-02 SUB-0083 — "Draft · read-only": MEL ZG512 withdrawn from Anil Shetty on 15 Aug',
  });

  addSubmission(book, {
    id: 'SUB-0086',
    vendor: 'ritu',
    content: {
      courseId: COURSE.process,
      name: 'Flash Distillation',
      summary:
        'Flash a hot binary feed across a valve into a drum and find the vapour fraction from your own readings.',
      description:
        'Learners set the feed temperature and the drum pressure, read the vapour and liquid flows, and compare the vapour fraction with an equilibrium calculation.',
      formats: ['web'],
      webLink: 'https://labs.meridian.example/flash-distillation',
      documents: ['Flash drum handout.pdf'],
    },
    created: ist('2026-08-22 10:00'),
    submitted: ist('2026-08-24 10:00'),
    evidence: 'B6-02 SUB-0086 — new submission with the Academic Reviewer since 24 Aug',
  });

  addSubmission(book, {
    id: 'SUB-0085',
    vendor: 'ritu',
    content: {
      courseId: COURSE.machines,
      name: 'DC Motor Speed Control',
      summary: 'Control the speed of a DC motor under load and compare armature and field control.',
      description:
        'Control the speed of a DC motor under load and compare armature and field control.',
      formats: ['web'],
    },
    created: ist('2026-10-01 15:00'),
    submitted: ist('2026-10-02 09:30'),
    evidence:
      'B7-06 s85 / B7-10 — "Stuck — nobody can act": with the Academic Reviewer since 2 Oct, no reviewer has EEE ZC341 in scope',
  });

  addUpdate(book, {
    id: 'UPD-0001',
    experimentId: EXPERIMENT.distillation,
    base: '1.0',
    versionLabel: '1.1',
    started: ist('2026-06-15 10:00'),
    sent: ist('2026-06-15 11:00'),
    whatChangesAndWhy: 'Correction UPD-0001.',
    approved: ist('2026-06-17 10:00'),
    released: ist('2026-06-19 10:00'),
    evidence: 'B6-09 history — "Version 1.1 released · 19 Jun 2026 · Correction UPD-0001."',
  });
  addUpdate(book, {
    id: 'UPD-0002',
    experimentId: EXPERIMENT.distillation,
    base: '1.1',
    versionLabel: '1.2',
    started: ist('2026-06-29 10:00'),
    sent: ist('2026-06-29 11:00'),
    whatChangesAndWhy: 'Correction UPD-0002.',
    approved: ist('2026-07-01 10:00'),
    released: ist('2026-07-03 10:00'),
    evidence:
      'B7-05 others — "UPD-0002 · Distillation Column · 1.1 → 1.2 · Released on 3 Jul 2026"',
  });
  addUpdate(book, {
    id: 'UPD-0003',
    experimentId: EXPERIMENT.orifice,
    base: '1.0',
    versionLabel: '1.1',
    started: ist('2026-07-27 10:00'),
    sent: ist('2026-07-27 11:00'),
    whatChangesAndWhy: 'Correction UPD-0003.',
    approved: ist('2026-07-30 10:00'),
    released: ist('2026-08-05 10:00'),
    evidence: 'B6-02 approved 30 Jul; B7-05 "Released on 5 Aug 2026"',
  });
  addUpdate(book, {
    id: 'UPD-0004',
    experimentId: EXPERIMENT.boiler,
    base: '2.0',
    versionLabel: '2.1',
    started: ist('2026-08-10 10:00'),
    sent: ist('2026-08-10 11:00'),
    whatChangesAndWhy: 'Correction UPD-0004.',
    approved: ist('2026-08-14 10:00'),
    hold: {
      at: ist('2026-08-20 10:00'),
      reason: 'Version 2.0 stays live while the 2.1 build is checked.',
    },
    evidence: 'B6-02 approved 14 Aug; B7-05 "On hold since 20 Aug 2026"',
  });
  linkOpenUpdate(book, EXPERIMENT.boiler, 'UPD-0004', ist('2026-08-10 10:00'));
  addUpdate(book, {
    id: 'UPD-0006',
    experimentId: EXPERIMENT.induction,
    base: '1.0',
    versionLabel: '1.1',
    started: ist('2026-08-24 10:00'),
    sent: ist('2026-08-24 11:00'),
    whatChangesAndWhy: 'Correction UPD-0006.',
    returned: {
      at: ist('2026-08-26 10:00'),
      reason:
        'The proposed description says slip falls as the load rises. It rises. Please correct it before I approve.',
    },
    evidence: 'B6-09 others / B6-02 — UPD-0006 returned to the Content Manager on 26 Aug',
  });
  linkOpenUpdate(book, EXPERIMENT.induction, 'UPD-0006', ist('2026-08-24 10:00'));
}
