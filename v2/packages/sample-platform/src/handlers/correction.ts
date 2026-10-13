/**
 * §3.13 CorrectionService — the corrected-version chain (BC8): Content Manager → Academic Reviewer
 * → Super Admin Release / Hold (CM-05 … CM-08, RV-04, SA-11; Flow F).
 *
 * Three entries, one draft pre-filled from the live version (M-1); the live version is unchanged
 * until Release; never a second, conflicting update (B6-08). Release is never "Publish" and writes
 * the update and the experiment only — it grants or changes no institution's access (BC9;
 * invariant 1). No Release straight from On hold (UPD-23).
 */
import {
  type CorrectionService,
  holdUpdateInput,
  openCorrectionInput,
  returnUpdateInput,
  saveCorrectionInput,
  updateCommandInput,
  withdrawUpdateInput,
} from '@xr/contracts/draft';
import {
  approveUpdate,
  changedFields,
  type CorrectionUpdate,
  type Experiment,
  holdUpdate,
  inDisplayOrder,
  liftHold,
  liveFields,
  openCorrection,
  planTermState,
  releaseUpdate,
  returnUpdate,
  saveCorrection,
  sendForAcademicReview,
  withdrawUpdate,
} from '@xr/domain';

import type { Call } from '../platform/core.js';
import type { ResolvedPerson } from '../pipeline/actor.js';
import { command, type Op, read } from '../pipeline/runner.js';
import { openUpdateOf } from '../world/queries.js';
import { values } from '../world/records.js';
import { deferred } from './deferred.js';
import { usageOf } from './institution.js';

function field(input: unknown, name: string): unknown {
  return typeof input === 'object' && input !== null
    ? (input as Record<string, unknown>)[name]
    : undefined;
}

/** The update a call names, its experiment, and the reader's scope over both (`canRead`). */
function updateOf(op: Op, person: ResolvedPerson, rawId: unknown) {
  const update = op.found(op.records.updates[op.idText(rawId)]);
  const experiment = op.found(op.records.experiments[update.experimentId]);
  op.see(person, { kind: 'update', update, experiment });
  return { update, experiment, subject: { kind: 'update' as const, update, experiment } };
}

/** "Description · Live now … · Proposed …" — only the fields the update changes (CM-08, RV-04, SA-11). */
function comparisonOf(update: CorrectionUpdate, experiment: Experiment) {
  const live = liveFields(experiment);
  const proposed = update.proposed;
  const rows = changedFields(live, proposed).map((changed) => {
    if (changed.startsWith('package:')) {
      const format = changed.slice('package:'.length) as 'ar' | 'vr' | 'mr';
      return {
        field: 'packageReferences' as const,
        liveNow: live.packageReferences[format] ?? null,
        proposed: proposed.packageReferences[format] ?? null,
      };
    }
    const key = changed as 'name' | 'summary' | 'description' | 'webLink';
    return { field: key, liveNow: live[key], proposed: proposed[key] };
  });
  const label = update.versionLabel?.trim() ?? '';
  return label !== '' && label !== experiment.live.label
    ? [...rows, { field: 'version' as const, liveNow: experiment.live.label, proposed: label }]
    : rows;
}

export function correctionPort(call: Call): CorrectionService {
  return {
    listUpdates: deferred('CorrectionService.listUpdates'),
    listUpdatesForRelease: deferred('CorrectionService.listUpdatesForRelease'),

    getPublishedExperiment: (id) =>
      read(call, 'CorrectionService.getPublishedExperiment', (op) => {
        const person = op.person();
        const experiment = op.found(op.records.experiments[op.idText(id)]);
        op.see(person, { kind: 'published-experiment', experiment });
        const openUpdate = openUpdateOf(op.records, experiment.id);
        return {
          experiment,
          openUpdate,
          canJoin: op.canDo(person, 'correction.join', {
            kind: 'experiment',
            experiment,
            openUpdate,
          }),
        };
      }),

    openCorrection: (input) =>
      command(call, 'CorrectionService.openCorrection', (op) => {
        const person = op.person();
        const experiment = op.found(
          op.records.experiments[op.idText(field(input, 'experimentId'))],
        );
        op.see(person, { kind: 'published-experiment', experiment });
        const openUpdate = openUpdateOf(op.records, experiment.id);
        const joinable =
          openUpdate !== null && (openUpdate.state === 'draft' || openUpdate.state === 'returned');
        op.allow(person, joinable ? 'correction.join' : 'correction.open', {
          kind: 'experiment',
          experiment,
          openUpdate,
        });
        const accepted = op.parse(openCorrectionInput, input);
        const outcome = op.decide(
          openCorrection({
            experiment,
            openUpdate,
            entry: accepted.entry,
            actor: person.ref,
            now: op.now,
            ids: op.ids,
          }),
          input,
        );
        // Joining the one draft writes nothing (UPD-02); a new draft writes the update and the
        // experiment's open-update link — the live version is unchanged.
        if (!outcome.joined) {
          op.tx.put('updates', outcome.update.id, outcome.update);
          op.tx.put('experiments', outcome.experiment.id, outcome.experiment);
        }
        return {
          value: { update: outcome.update, joined: outcome.joined },
          decision: 'openCorrection',
          actor: person.ref,
        };
      }),

    saveCorrection: (input) =>
      command(call, 'CorrectionService.saveCorrection', (op) => {
        const person = op.person();
        const { update, subject } = updateOf(op, person, field(input, 'id'));
        op.allow(person, 'correction.save', subject);
        const accepted = op.parse(saveCorrectionInput, input);
        op.rev(update, accepted.expectedRev);
        const next = op.decide(
          saveCorrection({
            update,
            edit: {
              proposed: accepted.proposed,
              whatChangesAndWhy: accepted.whatChangesAndWhy,
              versionLabel: accepted.versionLabel,
            },
            actor: person.ref,
            now: op.now,
            ids: op.ids,
          }),
          input,
        );
        op.tx.put('updates', next.id, next);
        return { value: next, decision: 'saveCorrection', actor: person.ref };
      }),

    sendForAcademicReview: (input) =>
      command(call, 'CorrectionService.sendForAcademicReview', (op) => {
        const person = op.person();
        const { update, experiment, subject } = updateOf(op, person, field(input, 'id'));
        op.allow(person, 'correction.send-for-review', subject);
        const accepted = op.parse(updateCommandInput, input);
        op.rev(update, accepted.expectedRev);
        const next = op.decide(
          sendForAcademicReview({
            update,
            experiment,
            edit: {
              proposed: update.proposed,
              whatChangesAndWhy: update.whatChangesAndWhy,
              versionLabel: update.versionLabel,
            },
            actor: person.ref,
            now: op.now,
            ids: op.ids,
          }),
          input,
          () => ({ live: experiment.live.label }),
        );
        op.tx.put('updates', next.id, next);
        return { value: next, decision: 'sendForAcademicReview', actor: person.ref };
      }),

    withdrawUpdate: (input) =>
      command(call, 'CorrectionService.withdrawUpdate', (op) => {
        const person = op.person();
        const { update, experiment, subject } = updateOf(op, person, field(input, 'id'));
        op.allow(person, 'correction.withdraw', subject);
        const accepted = op.parse(withdrawUpdateInput, input);
        op.rev(update, accepted.expectedRev);
        const outcome = op.decide(
          withdrawUpdate({
            update,
            experiment,
            reason: accepted.reason,
            actor: person.ref,
            now: op.now,
            ids: op.ids,
          }),
          input,
        );
        op.tx.put('updates', outcome.update.id, outcome.update);
        op.tx.put('experiments', outcome.experiment.id, outcome.experiment);
        return { value: outcome.update, decision: 'withdrawUpdate', actor: person.ref };
      }),

    getUpdate: (id) =>
      read(call, 'CorrectionService.getUpdate', (op) => {
        const person = op.person();
        const { update, experiment } = updateOf(op, person, id);
        return { update, comparison: comparisonOf(update, experiment) };
      }),

    getUpdateForReview: (id) =>
      read(call, 'CorrectionService.getUpdateForReview', (op) => {
        const person = op.person();
        const { update, experiment } = updateOf(op, person, id);
        return {
          update,
          comparison: comparisonOf(update, experiment),
          live: experiment.live,
          decided: update.state !== 'in-academic-review',
        };
      }),

    approveUpdate: (input) =>
      command(call, 'CorrectionService.approveUpdate', (op) => {
        const person = op.person();
        const { update, subject } = updateOf(op, person, field(input, 'id'));
        op.allow(person, 'correction.approve', subject);
        const accepted = op.parse(updateCommandInput, input);
        op.rev(update, accepted.expectedRev);
        const next = op.decide(
          approveUpdate({ update, actor: person.ref, now: op.now, ids: op.ids }),
          input,
        );
        // The live version does not change.
        op.tx.put('updates', next.id, next);
        return { value: next, decision: 'approveUpdate', actor: person.ref };
      }),

    returnUpdate: (input) =>
      command(call, 'CorrectionService.returnUpdate', (op) => {
        const person = op.person();
        const { update, subject } = updateOf(op, person, field(input, 'id'));
        op.allow(person, 'correction.return', subject);
        const accepted = op.parse(returnUpdateInput, input);
        op.rev(update, accepted.expectedRev);
        const next = op.decide(
          returnUpdate({
            update,
            reason: accepted.reason,
            actor: person.ref,
            now: op.now,
            ids: op.ids,
          }),
          input,
        );
        op.tx.put('updates', next.id, next);
        return { value: next, decision: 'returnUpdate', actor: person.ref };
      }),

    getUpdateDecision: (id) =>
      read(call, 'CorrectionService.getUpdateDecision', (op) => {
        const person = op.person();
        const { update, experiment } = updateOf(op, person, id);
        const institutionsUsingIt = values(op.records.plans)
          .filter((plan) => planTermState(plan, op.now) !== 'ended')
          .flatMap((plan) => {
            const item = plan.items.find((entry) => entry.experimentId === experiment.id);
            const institution = op.records.institutions[plan.institutionId];
            if (!item || !institution) return [];
            const usage = usageOf(op, institution).find(
              (row) => row.experimentId === experiment.id,
            );
            return [
              {
                institutionId: institution.id,
                planId: plan.id,
                formats: inDisplayOrder(item.formats),
                studentsWithAccess: usage?.studentsWithAccess ?? 0,
                // Pre-rendered words (PC-13) are not invented: the facts are the plan's own.
                note: null,
              },
            ];
          });
        return {
          update,
          comparison: comparisonOf(update, experiment),
          liveLine: { label: experiment.live.label, since: experiment.live.liveFrom },
          institutionsUsingIt,
        };
      }),

    releaseUpdate: (input) =>
      command(call, 'CorrectionService.releaseUpdate', (op) => {
        const person = op.person();
        const { update, experiment, subject } = updateOf(op, person, field(input, 'id'));
        op.allow(person, 'correction.release', subject);
        const accepted = op.parse(updateCommandInput, input);
        op.rev(update, accepted.expectedRev);
        const outcome = op.decide(
          releaseUpdate({ update, experiment, actor: person.ref, now: op.now, ids: op.ids }),
          input,
        );
        // The update and the experiment's live version only — no plan, grant or mapping (BC9).
        op.tx.put('updates', outcome.update.id, outcome.update);
        op.tx.put('experiments', outcome.experiment.id, outcome.experiment);
        return { value: outcome, decision: 'releaseUpdate', actor: person.ref };
      }),

    holdUpdate: (input) =>
      command(call, 'CorrectionService.holdUpdate', (op) => {
        const person = op.person();
        const { update, subject } = updateOf(op, person, field(input, 'id'));
        op.allow(person, 'correction.hold', subject);
        const accepted = op.parse(holdUpdateInput, input);
        op.rev(update, accepted.expectedRev);
        const next = op.decide(
          holdUpdate({
            update,
            reason: accepted.reason,
            actor: person.ref,
            now: op.now,
            ids: op.ids,
          }),
          input,
        );
        op.tx.put('updates', next.id, next);
        return { value: next, decision: 'holdUpdate', actor: person.ref };
      }),

    liftHold: (input) =>
      command(call, 'CorrectionService.liftHold', (op) => {
        const person = op.person();
        const { update, subject } = updateOf(op, person, field(input, 'id'));
        op.allow(person, 'correction.lift-hold', subject);
        const accepted = op.parse(updateCommandInput, input);
        op.rev(update, accepted.expectedRev);
        const next = op.decide(
          liftHold({ update, actor: person.ref, now: op.now, ids: op.ids }),
          input,
        );
        // Never releases: back to "Waiting for your decision".
        op.tx.put('updates', next.id, next);
        return { value: next, decision: 'liftHold', actor: person.ref };
      }),
  };
}
