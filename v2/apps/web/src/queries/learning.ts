'use client';

/**
 * The Student's own learning (Phase 3: ST-06 … ST-10, ST-15, ST-16 / ST-17; boards B3-01 … B3-06),
 * through `LearningService` and `FeedbackService`. The ports resolve the Student from the session
 * and answer from the records, side by side and never one derived from another (BC3): what is given
 * (SACC, ACC, the institution's pause, the account), what the experiment publishes (EXP), what the
 * runtime reported (RUN) and the system completion handler recorded (COMP), the resources opened
 * (RES) and the feedback sent (FB). Nothing here decides access, progress or eligibility.
 *
 * Commands are `useCommand(ports => ports.learning.openResource | launchWebFormat)` and
 * `useCommand(ports => ports.feedback.sendFeedback)`; their receipts refresh these reads.
 */
import type { ProductPorts } from '@xr/contracts/draft';
import type { ExperimentId, Technology } from '@xr/domain';

import { defineQuery, useXrQuery } from './use-xr-query';

/** What a Student's learning reads depend on: access, the catalogue, activity, completion. */
const LEARNING_DEPS = [
  'SACC',
  'ACC',
  'INST',
  'PER',
  'GRP',
  'EXP',
  'CRS',
  'RUN',
  'COMP',
  'FB',
] as const;

/** ST-06: the experiment's resources and when the Student first opened each (`listResources`). */
export const experimentResources = defineQuery({
  family: 'RES',
  view: 'experiment-resources',
  deps: [...LEARNING_DEPS, 'RES'],
  // The address is untrusted text: existence is the adapter's answer (lenient ids).
  read: (ports: ProductPorts, experimentId: string) =>
    ports.learning.listResources(experimentId as ExperimentId),
});

export function useExperimentResources(experimentId: string, enabled = true) {
  return useXrQuery(experimentResources, experimentId, { enabled });
}

/** ST-07: one progress view per format the experiment publishes (`getSimulationChooser`). */
export const simulationChooser = defineQuery({
  family: 'RUN',
  view: 'simulation-chooser',
  deps: LEARNING_DEPS,
  read: (ports: ProductPorts, experimentId: string) =>
    ports.learning.getSimulationChooser(experimentId as ExperimentId),
});

export function useSimulationChooser(experimentId: string, enabled = true) {
  return useXrQuery(simulationChooser, experimentId, { enabled });
}

/**
 * ST-08 / ST-09: one format's page — its progress, its delivery (the WEB link, or the setup steps
 * and the device needed), the gate and the Student's authorised device for it (`getFormatPage`).
 * The format is the address's text: a format the experiment does not publish is not found.
 */
export const formatPage = defineQuery({
  family: 'RUN',
  view: 'format-page',
  deps: [...LEARNING_DEPS, 'DTR'],
  read: (ports: ProductPorts, params: { readonly experimentId: string; readonly format: string }) =>
    ports.learning.getFormatPage({
      experimentId: params.experimentId as ExperimentId,
      format: params.format as Technology,
    }),
});

export function useFormatPage(experimentId: string, format: string, enabled = true) {
  return useXrQuery(formatPage, { experimentId, format }, { enabled });
}

/** ST-10 / ST-15: every visible experiment's per-format progress (`getMyProgress`; no aggregate). */
export const myProgress = defineQuery({
  family: 'RUN',
  view: 'my-progress',
  deps: [...LEARNING_DEPS, 'ASMT', 'ATT', 'Q'],
  read: (ports: ProductPorts) => ports.learning.getMyProgress(),
});

export function useMyProgress(enabled = true) {
  return useXrQuery(myProgress, null, { enabled });
}

/**
 * ST-08 / ST-09 / ST-10 / ST-15 / ST-16: whether feedback on one format may be given, or the
 * feedback already sent (`getFeedbackState`) — eligibility is the format's own recorded completion
 * (BC5), never the experiment's.
 */
export const feedbackState = defineQuery({
  family: 'FB',
  view: 'feedback-state',
  deps: LEARNING_DEPS,
  read: (ports: ProductPorts, params: { readonly experimentId: string; readonly format: string }) =>
    ports.feedback.getFeedbackState({
      experimentId: params.experimentId as ExperimentId,
      format: params.format as Technology,
    }),
});

export function useFeedbackState(experimentId: string, format: string, enabled = true) {
  return useXrQuery(feedbackState, { experimentId, format }, { enabled });
}
