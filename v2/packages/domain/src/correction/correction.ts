/**
 * M11 Correction (UPD) — the corrected-version chain (BC8): Content Manager → Academic Reviewer →
 * Super Admin Release / Hold → live version (Appendix C §2; matrix UPD-*; B6-04, B6-08, B6-09,
 * B6-11, B7-05, B7-10, B7-11). Separate from first publication (M10): a correction never
 * publishes, and Release is never called "Publish" (UPD-10, UPD-19).
 *
 * - Three entries, one draft, pre-filled from the live version (M-1); the live version is unchanged
 *   until Release. "Never a second, conflicting update." (B6-08; UPD-03).
 * - Release replaces the live version for everyone and grants or changes no institution's access
 *   (B7-05; invariant 1). No release straight from On hold (UPD-23; OD-B7-03).
 * - The effects of a Hold beyond the live version are not decided (UPD-21; OD-B7-04): only the
 *   drawn behaviour is applied — an update on hold is still the experiment's open update.
 * - A correction changes catalogue details and delivery links only — never formats or learning
 *   outcomes (UPD-07, LO-06; OD-B6-09).
 */
import type { Audience, PersonActorRef } from '../roles.js';
import type { ActorRef } from '../roles.js';
import {
  type Decision,
  invalidInput,
  invalidState,
  isBlank,
  ok,
  refused,
} from '../kernel/decision.js';
import { type HistoryEntry, historyEntry } from '../kernel/history.js';
import type { IdSource } from '../kernel/id-source.js';
import type { ExperimentId, UpdateId } from '../kernel/ids.js';
import { isDrawnTransition, type TransitionTable } from '../kernel/machine.js';
import { newMeta, nextMeta, type RecordMeta } from '../kernel/record.js';
import type { IsoInstant } from '../kernel/time.js';
import type { Experiment, ExperimentVersion } from '../catalogue/model.js';

export const UPDATE_STATES = [
  'draft',
  'in-academic-review',
  'returned',
  'awaiting-release-decision',
  'on-hold',
  'released',
  'withdrawn',
] as const;

export type UpdateState = (typeof UPDATE_STATES)[number];

/** An update in one of these states is the experiment's one open update (B6-08; On hold counts). */
export const OPEN_UPDATE_STATES: readonly UpdateState[] = [
  'draft',
  'in-academic-review',
  'returned',
  'awaiting-release-decision',
  'on-hold',
];

export interface CorrectionFields {
  readonly name: string;
  readonly summary: string;
  readonly description: string;
  /** WEB only. */
  readonly webLink: string | null;
  /** VR drawn; AR / MR not drawn [U]. */
  readonly packageReferences: Readonly<Partial<Record<'ar' | 'vr' | 'mr', string>>>;
}

export interface UpdateReviewDecision {
  readonly decision: 'approve' | 'return-to-content-manager';
  /** Required for a return; no references (T-28). */
  readonly reason: string | null;
  readonly at: IsoInstant;
  readonly by: ActorRef;
}

export type UpdateEvent =
  | 'started'
  | 'saved'
  | 'sent-for-academic-review'
  | 'approved-by-reviewer'
  | 'returned-by-reviewer'
  | 'put-on-hold'
  | 'hold-lifted'
  | 'released'
  | 'withdrawn';

export type CorrectionEntry =
  'start-a-correction' | 'edit-catalogue-details' | 'edit-delivery-link';

export interface CorrectionUpdate extends RecordMeta {
  /** UPD-0005. */
  readonly id: UpdateId;
  readonly experimentId: ExperimentId;
  /** The live label when started ('The live version 1.2 is unchanged.'). */
  readonly baseVersionLabel: string;
  readonly state: UpdateState;
  readonly entry: CorrectionEntry;
  readonly proposed: CorrectionFields;
  /** Required to send: "Say what changes and why". */
  readonly whatChangesAndWhy: string | null;
  /** Required to send; must differ from the live label. */
  readonly versionLabel: string | null;
  readonly startedAt: IsoInstant;
  readonly startedBy: ActorRef;
  readonly sentForReviewAt: IsoInstant | null;
  readonly reviewDecisions: readonly UpdateReviewDecision[];
  readonly hold: { readonly at: IsoInstant; readonly by: ActorRef; readonly reason: string } | null;
  readonly holdLifts: readonly { readonly at: IsoInstant; readonly by: ActorRef }[];
  readonly release: { readonly at: IsoInstant; readonly by: ActorRef } | null;
  readonly withdrawal: {
    readonly at: IsoInstant;
    readonly by: ActorRef;
    readonly reason: string;
  } | null;
  readonly history: readonly HistoryEntry<UpdateEvent>[];
}

export type UpdateCommand =
  | 'openCorrection'
  | 'saveCorrection'
  | 'sendForAcademicReview'
  | 'withdrawUpdate'
  | 'approveUpdate'
  | 'returnUpdate'
  | 'releaseUpdate'
  | 'holdUpdate'
  | 'liftHold';

/** Appendix C M11 "Transitions". Not offered: release from On hold (OD-B7-03); withdraw or edit
 *  after approval (OD-B6-06). */
export const UPDATE_TRANSITIONS: TransitionTable<UpdateState, UpdateCommand> = [
  { from: null, to: 'draft', command: 'openCorrection', actors: ['content_manager'] },
  { from: 'draft', to: 'draft', command: 'saveCorrection', actors: ['content_manager'] },
  { from: 'returned', to: 'returned', command: 'saveCorrection', actors: ['content_manager'] },
  {
    from: 'draft',
    to: 'in-academic-review',
    command: 'sendForAcademicReview',
    actors: ['content_manager'],
  },
  {
    from: 'returned',
    to: 'in-academic-review',
    command: 'sendForAcademicReview',
    actors: ['content_manager'],
  },
  { from: 'draft', to: 'withdrawn', command: 'withdrawUpdate', actors: ['content_manager'] },
  { from: 'returned', to: 'withdrawn', command: 'withdrawUpdate', actors: ['content_manager'] },
  {
    from: 'in-academic-review',
    to: 'withdrawn',
    command: 'withdrawUpdate',
    actors: ['content_manager'],
  },
  {
    from: 'in-academic-review',
    to: 'awaiting-release-decision',
    command: 'approveUpdate',
    actors: ['academic_reviewer'],
  },
  {
    from: 'in-academic-review',
    to: 'returned',
    command: 'returnUpdate',
    actors: ['academic_reviewer'],
  },
  {
    from: 'awaiting-release-decision',
    to: 'released',
    command: 'releaseUpdate',
    actors: ['super_admin'],
  },
  {
    from: 'awaiting-release-decision',
    to: 'on-hold',
    command: 'holdUpdate',
    actors: ['super_admin'],
  },
  {
    from: 'on-hold',
    to: 'awaiting-release-decision',
    command: 'liftHold',
    actors: ['super_admin'],
  },
];

const CHAIN: readonly Audience[] = ['content_manager', 'academic_reviewer', 'super_admin'];

function can(update: CorrectionUpdate | null, to: UpdateState, command: UpdateCommand): boolean {
  return isDrawnTransition(UPDATE_TRANSITIONS, update?.state ?? null, to, command);
}

function entry(
  input: { readonly ids: IdSource; readonly now: IsoInstant; readonly actor: PersonActorRef },
  event: UpdateEvent,
  note: string | null,
  visibleTo: readonly Audience[],
): HistoryEntry<UpdateEvent> {
  return historyEntry({
    id: input.ids.next('history'),
    event,
    at: input.now,
    actor: input.actor,
    note,
    visibleTo,
  });
}

/**
 * An update as one audience may read it: the history entries written for that audience
 * (`visibleTo`), and the facts those entries carry only where the audience may read the entry —
 * the hold and its lifts (Content Manager and Super Admin, UPD-21), the withdrawal (the Content
 * Manager, UPD-17) and a return's reason (Content Manager and Academic Reviewer). The state is
 * everyone's: a reader still knows an update is on hold or withdrawn.
 */
export function updateForAudience(update: CorrectionUpdate, audience: Audience): CorrectionUpdate {
  const reads = (event: UpdateEvent) =>
    update.history.some((item) => item.event === event && item.visibleTo.includes(audience));
  const returns = reads('returned-by-reviewer');
  return {
    ...update,
    history: update.history.filter((item) => item.visibleTo.includes(audience)),
    hold: update.hold && reads('put-on-hold') ? update.hold : null,
    holdLifts: reads('hold-lifted') ? update.holdLifts : [],
    withdrawal: update.withdrawal && reads('withdrawn') ? update.withdrawal : null,
    reviewDecisions: update.reviewDecisions.map((decision) =>
      decision.decision === 'return-to-content-manager' && !returns
        ? { ...decision, reason: null }
        : decision,
    ),
  };
}

/** The live version's correctable fields — the draft is pre-filled with them (M-1). */
export function liveFields(experiment: Experiment): CorrectionFields {
  const live = experiment.live;
  const packageReferences: Partial<Record<'ar' | 'vr' | 'mr', string>> = {};
  let webLink: string | null = null;
  for (const entry of live.formats) {
    const delivery = entry.delivery;
    if (delivery.format === 'web') webLink = delivery.webLink;
    else if (delivery.packageReference)
      packageReferences[delivery.format] = delivery.packageReference;
  }
  return { ...live.catalogue, webLink, packageReferences };
}

/** The fields that differ from live ("n fields changed"; CM-08, RV-04, SA-11). */
export function changedFields(
  live: CorrectionFields,
  proposed: CorrectionFields,
): readonly string[] {
  const changed: string[] = [];
  for (const field of ['name', 'summary', 'description', 'webLink'] as const) {
    if ((live[field] ?? '').trim() !== (proposed[field] ?? '').trim()) changed.push(field);
  }
  for (const format of ['ar', 'vr', 'mr'] as const) {
    if (
      (live.packageReferences[format] ?? '').trim() !==
      (proposed.packageReferences[format] ?? '').trim()
    ) {
      changed.push(`package:${format}`);
    }
  }
  return changed;
}

interface CmWrite {
  readonly actor: PersonActorRef;
  readonly now: IsoInstant;
  readonly ids: IdSource;
}

/**
 * Start a correction / Edit catalogue details / Edit delivery link (UPD-01): one draft, pre-filled
 * from live. With an open Draft or Returned update the entry joins it (UPD-02; no history entry);
 * with any other open update only "Open update" is offered (UPD-03).
 */
export function openCorrection(
  input: CmWrite & {
    readonly experiment: Experiment;
    readonly openUpdate: CorrectionUpdate | null;
    readonly entry: CorrectionEntry;
  },
): Decision<{
  readonly update: CorrectionUpdate;
  readonly experiment: Experiment;
  readonly joined: boolean;
}> {
  const open = input.openUpdate;
  if (
    open &&
    open.experimentId === input.experiment.id &&
    OPEN_UPDATE_STATES.includes(open.state)
  ) {
    if (open.state === 'draft' || open.state === 'returned') {
      return ok({ update: open, experiment: input.experiment, joined: true });
    }
    return refused('update-already-open');
  }
  if (input.experiment.openUpdateId !== null) return refused('update-already-open');
  if (!can(null, 'draft', 'openCorrection')) return invalidState('none');
  const id = input.ids.next('update');
  const update: CorrectionUpdate = {
    ...newMeta(input.now),
    id,
    experimentId: input.experiment.id,
    baseVersionLabel: input.experiment.live.label,
    state: 'draft',
    entry: input.entry,
    proposed: liveFields(input.experiment),
    whatChangesAndWhy: null,
    versionLabel: null,
    startedAt: input.now,
    startedBy: input.actor,
    sentForReviewAt: null,
    reviewDecisions: [],
    hold: null,
    holdLifts: [],
    release: null,
    withdrawal: null,
    // B6-04 and B7-05 draw "Correction started from the published experiment" in the reviewer's and
    // the Super Admin's history: the entry is the chain's (each sees the update only from its gate).
    history: [entry(input, 'started', input.entry, CHAIN)],
  };
  return ok({
    update,
    experiment: { ...input.experiment, ...nextMeta(input.experiment, input.now), openUpdateId: id },
    joined: false,
  });
}

export interface CorrectionEdit {
  readonly proposed: CorrectionFields;
  readonly whatChangesAndWhy: string | null;
  readonly versionLabel: string | null;
}

/** Save draft / edit proposed fields (UPD-04): "Draft saved · <time> · the live version is
 *  unchanged" — no history entry (M28). */
export function saveCorrection(
  input: CmWrite & { readonly update: CorrectionUpdate; readonly edit: CorrectionEdit },
): Decision<CorrectionUpdate> {
  if (!can(input.update, input.update.state, 'saveCorrection'))
    return invalidState(input.update.state);
  return ok({
    ...input.update,
    ...nextMeta(input.update, input.now),
    proposed: input.edit.proposed,
    whatChangesAndWhy: input.edit.whatChangesAndWhy,
    versionLabel: input.edit.versionLabel,
  });
}

/**
 * Send for academic review (UPD-05; DL-1): "Say what changes and why"; "Enter the version label,
 * for example 1.3" — equal to live: "Use a new version label — 1.2 is live" (OD-B6-08); "Change at
 * least one catalogue detail or delivery link" (OD-B6-09). No skipping review (UPD-06).
 */
export function sendForAcademicReview(
  input: CmWrite & {
    readonly update: CorrectionUpdate;
    readonly experiment: Experiment;
    readonly edit: CorrectionEdit;
  },
): Decision<CorrectionUpdate> {
  if (!can(input.update, 'in-academic-review', 'sendForAcademicReview'))
    return invalidState(input.update.state);
  const edit = input.edit;
  const issues = [
    ...(isBlank(edit.whatChangesAndWhy) ? [{ field: 'whatChangesAndWhy', rule: 'required' }] : []),
    ...(isBlank(edit.versionLabel)
      ? [{ field: 'versionLabel', rule: 'required' }]
      : edit.versionLabel!.trim() === input.experiment.live.label
        ? [{ field: 'versionLabel', rule: 'same-as-live' }]
        : []),
    ...(changedFields(liveFields(input.experiment), edit.proposed).length === 0
      ? [{ field: 'summary', rule: 'change-something' }]
      : []),
  ];
  if (issues.length > 0) return invalidInput(...issues);
  return ok({
    ...input.update,
    ...nextMeta(input.update, input.now),
    state: 'in-academic-review',
    proposed: edit.proposed,
    whatChangesAndWhy: edit.whatChangesAndWhy!.trim(),
    versionLabel: edit.versionLabel!.trim(),
    sentForReviewAt: input.now,
    history: [
      ...input.update.history,
      // B7-05 f1 draws "Sent for academic review" in the Super Admin's history too.
      entry(input, 'sent-for-academic-review', null, CHAIN),
    ],
  });
}

/** Withdraw update (UPD-08; DL-2 "Add a reason for withdrawing this update") — while Draft,
 *  Returned or In academic review (OD-B6-06). Whether the reviewer sees the reason is open
 *  (UPD-17): the reason is kept for the Content Manager. */
export function withdrawUpdate(
  input: CmWrite & {
    readonly update: CorrectionUpdate;
    readonly experiment: Experiment;
    readonly reason: string;
  },
): Decision<{ readonly update: CorrectionUpdate; readonly experiment: Experiment }> {
  if (!can(input.update, 'withdrawn', 'withdrawUpdate')) return invalidState(input.update.state);
  if (isBlank(input.reason)) return invalidInput({ field: 'reason', rule: 'required' });
  const reason = input.reason.trim();
  return ok({
    update: {
      ...input.update,
      ...nextMeta(input.update, input.now),
      state: 'withdrawn',
      withdrawal: { at: input.now, by: input.actor, reason },
      history: [...input.update.history, entry(input, 'withdrawn', reason, ['content_manager'])],
    },
    experiment: closed(input.experiment, input.update, input.now),
  });
}

function closed(experiment: Experiment, update: CorrectionUpdate, now: IsoInstant): Experiment {
  return experiment.openUpdateId === update.id
    ? { ...experiment, ...nextMeta(experiment, now), openUpdateId: null }
    : experiment;
}

/** Approve update (UPD-13; DL-1 "It goes to the Super Admin, who decides when to release it.
 *  Version 1.2 stays live until then."). */
export function approveUpdate(
  input: CmWrite & { readonly update: CorrectionUpdate },
): Decision<CorrectionUpdate> {
  if (!can(input.update, 'awaiting-release-decision', 'approveUpdate'))
    return invalidState(input.update.state);
  return ok({
    ...input.update,
    ...nextMeta(input.update, input.now),
    state: 'awaiting-release-decision',
    reviewDecisions: [
      ...input.update.reviewDecisions,
      { decision: 'approve', reason: null, at: input.now, by: input.actor },
    ],
    history: [...input.update.history, entry(input, 'approved-by-reviewer', null, CHAIN)],
  });
}

/** Return to the Content Manager (UPD-14; DL-2, reason only — no references, T-28). */
export function returnUpdate(
  input: CmWrite & { readonly update: CorrectionUpdate; readonly reason: string },
): Decision<CorrectionUpdate> {
  if (!can(input.update, 'returned', 'returnUpdate')) return invalidState(input.update.state);
  if (isBlank(input.reason)) return invalidInput({ field: 'reason', rule: 'required' });
  const reason = input.reason.trim();
  return ok({
    ...input.update,
    ...nextMeta(input.update, input.now),
    state: 'returned',
    reviewDecisions: [
      ...input.update.reviewDecisions,
      { decision: 'return-to-content-manager', reason, at: input.now, by: input.actor },
    ],
    history: [
      ...input.update.history,
      entry(input, 'returned-by-reviewer', reason, ['content_manager', 'academic_reviewer']),
    ],
  });
}

/**
 * Release update (UPD-19; DL-1 "Version 1.3 replaces 1.2 for everyone — the public catalogue and
 * every institution using it. History keeps 1.2 and every decision."). Writes the update and the
 * experiment's live version only — no plan, grant or mapping (BC9). Not from On hold (UPD-23).
 */
export function releaseUpdate(
  input: CmWrite & { readonly update: CorrectionUpdate; readonly experiment: Experiment },
): Decision<{ readonly update: CorrectionUpdate; readonly experiment: Experiment }> {
  if (input.update.state === 'on-hold') return refused('hold-must-be-lifted');
  if (!can(input.update, 'released', 'releaseUpdate')) return invalidState(input.update.state);
  if (input.update.experimentId !== input.experiment.id)
    return invalidState('different-experiment');
  const proposed = input.update.proposed;
  const previous = input.experiment.live;
  const next: ExperimentVersion = {
    label: input.update.versionLabel!,
    liveFrom: input.now,
    liveUntil: null,
    source: { kind: 'correction-release', updateId: input.update.id },
    catalogue: {
      name: proposed.name,
      summary: proposed.summary,
      description: proposed.description,
    },
    formats: previous.formats.map((entry) => {
      const delivery = entry.delivery;
      if (delivery.format === 'web') {
        return proposed.webLink
          ? { ...entry, delivery: { ...delivery, webLink: proposed.webLink } }
          : entry;
      }
      const reference = proposed.packageReferences[delivery.format];
      return reference
        ? { ...entry, delivery: { ...delivery, packageReference: reference } }
        : entry;
    }),
    preview: previous.preview,
    documents: previous.documents,
  };
  const ended = { ...previous, liveUntil: input.now };
  return ok({
    update: {
      ...input.update,
      ...nextMeta(input.update, input.now),
      state: 'released',
      release: { at: input.now, by: input.actor },
      history: [...input.update.history, entry(input, 'released', null, CHAIN)],
    },
    experiment: {
      ...input.experiment,
      ...nextMeta(input.experiment, input.now),
      live: next,
      versions: [
        ...input.experiment.versions.map((version) =>
          version.label === previous.label &&
          version.liveFrom === previous.liveFrom &&
          version.liveUntil === null
            ? ended
            : version,
        ),
        next,
      ],
      openUpdateId: null,
    },
  });
}

/** Hold (UPD-20, UPD-25; DL-2): "Add a reason — the Content Manager sees it"; "Version 1.2 stays
 *  live". */
export function holdUpdate(
  input: CmWrite & { readonly update: CorrectionUpdate; readonly reason: string },
): Decision<CorrectionUpdate> {
  if (!can(input.update, 'on-hold', 'holdUpdate')) return invalidState(input.update.state);
  if (isBlank(input.reason)) return invalidInput({ field: 'reason', rule: 'required' });
  const reason = input.reason.trim();
  return ok({
    ...input.update,
    ...nextMeta(input.update, input.now),
    state: 'on-hold',
    hold: { at: input.now, by: input.actor, reason },
    history: [
      ...input.update.history,
      entry(input, 'put-on-hold', reason, ['content_manager', 'super_admin']),
    ],
  });
}

/** Lift hold (UPD-22; DL-1, no reason): back to "Waiting for your decision", never live. */
export function liftHold(
  input: CmWrite & { readonly update: CorrectionUpdate },
): Decision<CorrectionUpdate> {
  if (!can(input.update, 'awaiting-release-decision', 'liftHold'))
    return invalidState(input.update.state);
  return ok({
    ...input.update,
    ...nextMeta(input.update, input.now),
    state: 'awaiting-release-decision',
    hold: null,
    holdLifts: [...input.update.holdLifts, { at: input.now, by: input.actor }],
    history: [
      ...input.update.history,
      entry(input, 'hold-lifted', null, ['content_manager', 'super_admin']),
    ],
  });
}
