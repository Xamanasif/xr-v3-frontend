/**
 * §3.8 LearningService (ST-06 … ST-10, ST-15) and §3.9 FeedbackService (ST-16, ST-17); Flow C.
 *
 * Opening a resource marks it "Opened" and nothing else (T-13). "Launch WEB" stores nothing — In
 * progress comes only from runtime reports (AD-16) and Completed only from the system completion
 * handler (BC3, ADR-0006); no user action or launch completes a format. Feedback is one record per
 * Student × Experiment × format, offered only once that format is Completed (BC5), with the
 * WP-0.9 open-gate interim (AD-22).
 */
import {
  type FeedbackService,
  formatPageInput,
  launchWebFormatInput,
  type LearningService,
  openResourceInput,
  sendFeedbackInput,
} from '@xr/contracts/draft';
import {
  canOpenFormat,
  type Experiment,
  isTechnology,
  launchWebFormat,
  openResource,
  publishedFormats,
  resultView,
  sendFeedback,
  type StudentPerson,
  type Technology,
} from '@xr/domain';

import type { Call } from '../platform/core.js';
import { command, type Op, read, refuse } from '../pipeline/runner.js';
import { deviceKey, formatKey, resourceKey, values } from '../world/records.js';
import { deferred } from './deferred.js';
import {
  assessmentOf,
  factsFor,
  gateOf,
  givenExperiments,
  progressView,
  routedGrantIds,
  standingOf,
  studentOf,
} from './learner.js';
import { learningSubject } from './subjects.js';

function field(input: unknown, name: string): unknown {
  return typeof input === 'object' && input !== null
    ? (input as Record<string, unknown>)[name]
    : undefined;
}

/** The Student's experiment and access facts; an unknown experiment reads as not given. */
function learnerContext(op: Op, experimentId: unknown) {
  const person = op.person();
  const student = studentOf(person);
  const experiment = op.records.experiments[op.idText(experimentId)] ?? null;
  const facts = experiment ? factsFor(op, student, experiment.id) : null;
  if (!experiment || !facts) refuse({ kind: 'refused', code: 'not-given' });
  return { person, student, experiment, facts };
}

function feedbackOf(op: Op, student: StudentPerson, experiment: Experiment, format: Technology) {
  return (
    values(op.records.feedback).find(
      (entry) =>
        entry.studentId === student.id &&
        entry.experimentId === experiment.id &&
        entry.format === format,
    ) ?? null
  );
}

export function learningPort(call: Call): LearningService {
  return {
    getSimulationChooser: deferred('LearningService.getSimulationChooser'),

    listResources: (experimentId) =>
      read(call, 'LearningService.listResources', (op) => {
        const { person, student, experiment, facts } = learnerContext(op, experimentId);
        op.see(person, { kind: 'student-learning', experiment, access: facts });
        return experiment.resources.map((resource) => ({
          resource,
          openedAt:
            op.records.resourcesOpened[resourceKey(student.id, resource.id)]?.firstOpenedAt ?? null,
        }));
      }),

    openResource: (input) =>
      command(call, 'LearningService.openResource', (op) => {
        const person = op.person();
        const student = studentOf(person);
        const resourceId = op.idText(field(input, 'resourceId'));
        const experiment = op.found(
          values(op.records.experiments).find((candidate) =>
            candidate.resources.some((resource) => resource.id === resourceId),
          ),
        );
        const subject = learningSubject(
          op.records,
          op.seeded,
          op.core.overlap,
          student,
          experiment,
        );
        if (!subject) refuse({ kind: 'refused', code: 'not-given' });
        op.allow(person, 'resource.open', subject);
        const accepted = op.parse(openResourceInput, input);
        const key = resourceKey(student.id, accepted.resourceId);
        const outcome = op.decide(
          openResource({
            existing: op.records.resourcesOpened[key] ?? null,
            studentId: student.id,
            resourceId: accepted.resourceId,
            experiment,
            gate: gateOf(op, subject.access, experiment),
            now: op.now,
          }),
          input,
        );
        // The first opening is kept; a later opening changes nothing (B3-01).
        op.tx.put('resourcesOpened', key, outcome.opened);
        return {
          value: { href: outcome.href, openedAt: outcome.opened.firstOpenedAt },
          decision: 'openResource',
          actor: person.ref,
        };
      }),

    getFormatPage: (input) =>
      read(call, 'LearningService.getFormatPage', (op) => {
        const { person, student, experiment, facts } = learnerContext(
          op,
          field(input, 'experimentId'),
        );
        op.see(person, { kind: 'student-learning', experiment, access: facts });
        const accepted = op.parse(formatPageInput, input);
        // A format the experiment does not publish has no page.
        const published = op.found(
          experiment.live.formats.find((entry) => entry.format === accepted.format),
        );
        const delivery = published.delivery;
        return {
          progress: progressView(
            op,
            student,
            experiment,
            accepted.format,
            gateOf(op, facts, experiment),
          ),
          delivery:
            delivery.format === 'web'
              ? { webLink: delivery.webLink }
              : { setupSteps: [delivery.installNotes], deviceNeeded: delivery.deviceNeeded },
          gate: canOpenFormat({ ...facts, experiment, now: op.now, format: accepted.format }),
          authorisedDevice:
            accepted.format === 'web'
              ? null
              : (op.records.devices[deviceKey(student.id, accepted.format)] ?? null),
        };
      }),

    launchWebFormat: (input) =>
      command(call, 'LearningService.launchWebFormat', (op) => {
        const { person, student, experiment } = learnerContext(op, field(input, 'experimentId'));
        const subject = op.found(
          learningSubject(op.records, op.seeded, op.core.overlap, student, experiment),
        );
        const started = subject.webActivity !== null && subject.webActivity.firstOpenedAt !== null;
        op.allow(person, started ? 'web.continue' : 'web.launch', subject);
        op.parse(launchWebFormatInput, input);
        const outcome = op.decide(
          launchWebFormat({
            experiment,
            webGate: canOpenFormat({ ...subject.access, experiment, now: op.now, format: 'web' }),
          }),
          input,
        );
        // Stores nothing (AD-16): In progress is written by the runtime report afterwards.
        return { value: { href: outcome.webLink }, decision: 'launchWebFormat', actor: person.ref };
      }),

    getMyProgress: () =>
      read(call, 'LearningService.getMyProgress', (op) => {
        const person = op.person();
        const student = studentOf(person);
        // The experiments the Student may see (`canRead`); undecided and SACC-14 cases have no
        // row here — the progress row has no carrier for an open decision.
        return givenExperiments(op, student).flatMap((experiment) => {
          const standing = standingOf(op, person, student, experiment);
          if (standing.kind !== 'visible') return [];
          // The grant the domain routes the access through (B3-05 "through SACC-…").
          const grantId = routedGrantIds(op, standing.facts, experiment)[0];
          if (!grantId) return [];
          const assessment = assessmentOf(op, student.institutionId, experiment.id);
          const attempts = assessment
            ? values(op.records.attempts)
                .filter((a) => a.assessmentId === assessment.id && a.studentId === student.id)
                .sort((a, b) => a.attemptNumber - b.attemptNumber)
            : [];
          const latest = attempts.at(-1);
          return [
            {
              experimentId: experiment.id,
              name: experiment.live.catalogue.name,
              grantId,
              formats: publishedFormats(experiment).map((format) =>
                progressView(op, student, experiment, format, standing.gate),
              ),
              assessment:
                assessment && latest
                  ? resultView({
                      attempt: latest,
                      assessment,
                      questions: values(op.records.questions),
                      now: op.now,
                    })
                  : { kind: 'none-set' as const },
            },
          ];
        });
      }),
  };
}

export function feedbackPort(call: Call): FeedbackService {
  return {
    getFeedbackState: (input) =>
      read(call, 'FeedbackService.getFeedbackState', (op) => {
        const person = op.person();
        const student = studentOf(person);
        const experiment = op.records.experiments[op.idText(field(input, 'experimentId'))] ?? null;
        const format = field(input, 'format');
        const facts = experiment ? factsFor(op, student, experiment.id) : null;
        // The read answers a state: an unknown experiment or format is not eligible (PC-16).
        if (!experiment || !facts || !isTechnology(format))
          return { state: 'not-eligible' as const };
        const feedback = feedbackOf(op, student, experiment, format);
        if (feedback) return { state: 'sent' as const, feedback };
        const completion =
          op.records.completions[formatKey(student.id, experiment.id, format)] ?? null;
        // FB-01: eligible exactly when the form may open — the rule that also sends it (BC5).
        return op.canDo(person, 'feedback.open-form', {
          kind: 'feedback',
          experiment,
          format,
          completion,
          feedback: null,
          access: facts,
        })
          ? { state: 'eligible' as const }
          : { state: 'not-eligible' as const };
      }),

    sendFeedback: (input) =>
      command(call, 'FeedbackService.sendFeedback', (op) => {
        const { person, student, experiment, facts } = learnerContext(
          op,
          field(input, 'experimentId'),
        );
        const format = field(input, 'format') as Technology;
        const key = formatKey(student.id, experiment.id, format);
        const existing = feedbackOf(op, student, experiment, format);
        const completion = op.records.completions[key] ?? null;
        op.allow(person, 'feedback.send', {
          kind: 'feedback',
          experiment,
          format,
          completion,
          feedback: existing,
          access: facts,
        });
        const accepted = op.parse(sendFeedbackInput, input);
        const feedback = op.decide(
          sendFeedback({
            existing,
            completion,
            gate: gateOf(op, facts, experiment),
            studentId: student.id,
            experimentId: experiment.id,
            format: accepted.format,
            ratings: accepted.ratings,
            comments: accepted.comments,
            now: op.now,
            ids: op.ids,
          }),
          input,
        );
        op.tx.put('feedback', feedback.id, feedback);
        return { value: feedback, decision: 'sendFeedback', actor: person.ref };
      }),
  };
}
