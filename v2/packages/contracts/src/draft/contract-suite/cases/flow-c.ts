/**
 * Flow C — learning → runtime activity → per-format progress → system Completed → feedback
 * (flows.json C1–C3; Appendix D §4.4; B3-01 … B3-06; B3-12). Five states never collapse (BC3):
 * a resource opening is not progress (T-13); a launch stores nothing (AD-16); only the runtime
 * report writes activity and only the completion report writes a completion; one format never
 * completes another; feedback is per format and only after that format is Completed (BC5).
 */
import { changedKinds, check, deepEqual, errorOf, valueOf } from '../assert.js';
import { experimentNamed, keysOf, personIdOf } from '../helpers.js';
import type { ContractCase } from '../run.js';
import { SAMPLE } from '../sample.js';

const flowC: ContractCase = {
  id: 'flow:C',
  title: 'Flow C — resources, WEB launch, system completion, feedback on WEB (C1–C3)',
  group: 'flow',
  evidence: 'flows.json C1–C3; Appendix D §4.4; B3-01 … B3-06; B3-12; BC3, BC4, BC5; T-13; AD-16',
  requires: {
    fixture: { kind: 'after-flow', flow: 'B' },
    methods: [
      'CatalogueService.searchCatalogue',
      'SessionService.getSession',
      'LearningService.listResources',
      'LearningService.openResource',
      'LearningService.launchWebFormat',
      'LearningService.getFormatPage',
      'FeedbackService.getFeedbackState',
      'FeedbackService.sendFeedback',
    ],
  },
  run: async (context) => {
    const student = context.as('Rahul Verma');
    const rahul = await personIdOf(student, 'Rahul Verma');
    const shell = await experimentNamed(context.publicPorts, SAMPLE.experiments.shellAndTube);
    const experimentId = shell.experimentId;

    // C1 — resources: "Opened" and nothing else (T-13).
    const resources = valueOf(await student.learning.listResources(experimentId), 'C1 ST-06');
    check(resources.length > 0, 'C1: the experiment lists its resources');
    const opened = await student.learning.openResource({ resourceId: resources[0]!.resource.id });
    valueOf(opened, 'C1 open a resource');
    check(
      !changedKinds(opened).some((kind) => kind === 'RUN' || kind === 'COMP'),
      'C1: opening a resource is never progress or completion (T-13)',
    );

    // C2 — a launch stores nothing; activity and completion come from the runtime reports.
    const launch = await student.learning.launchWebFormat({ experimentId });
    valueOf(launch, 'C2 Launch WEB');
    deepEqual(changedKinds(launch), [], 'C2: the portal launch stores nothing (AD-16)');
    const web = async (step: string) =>
      valueOf(await student.learning.getFormatPage({ experimentId, format: 'web' }), step);
    check(
      (await web('C2 after the launch')).progress.status === 'not-started',
      'C2: a launch is not progress (BC3)',
    );
    const { runtimeReport, clock } = context.standins;
    check(
      runtimeReport.reportActivity({
        studentId: rahul,
        experimentId,
        format: 'web',
        kind: 'opened',
        at: clock.now(),
      }).ok,
      'C2: the runtime reports WEB opened',
    );
    const started = await web('C2 after activity');
    check(
      started.progress.status === 'in-progress',
      'C2: WEB In progress — from runtime activity only',
    );
    check(started.progress.feedback === 'not-offered', 'C2: no feedback before Completed (BC5)');
    check(
      runtimeReport.reportCompletion({
        studentId: rahul,
        experimentId,
        format: 'web',
        at: clock.now(),
        from: 'simulation',
      }).ok,
      'C2: the simulation reports completion (the only route, T-12 open)',
    );
    const done = await web('C2 after the completion report');
    check(done.progress.status === 'completed', 'C2: WEB Completed — written by the system');
    check(
      done.progress.completion?.reportedFrom === 'simulation',
      'C2: "Reported by the simulation"',
    );
    check(done.progress.feedback === 'offered', 'C3: "Give feedback on WEB" appears');
    const vr = valueOf(
      await student.learning.getFormatPage({ experimentId, format: 'vr' }),
      'C2 VR page',
    );
    check(vr.progress.status === 'not-started', 'C2: WEB never completes VR (per format, BC4)');
    check(vr.progress.feedback === 'not-offered', 'C3: VR not started offers nothing');

    // C3 — feedback, one record per format.
    const state = valueOf(
      await student.feedback.getFeedbackState({ experimentId, format: 'web' }),
      'C3 entry',
    );
    check(state.state === 'eligible', 'C3: WEB feedback is offered');
    const missing = await student.feedback.sendFeedback({
      experimentId,
      format: 'web',
      ratings: [5, null, 4, null, 4],
      comments: null,
    });
    const ratingError = errorOf(missing, 'validation-failed', 'C3 with two ratings missing');
    deepEqual(
      keysOf(ratingError),
      ['ST-16.rating.required', 'ST-16.rating.required'],
      'C3: "Choose a rating" for each',
    );
    check(ratingError.summaryTitle === '2 ratings are missing', 'C3: the drawn summary title');
    const sent = await student.feedback.sendFeedback({
      experimentId,
      format: 'web',
      ratings: [5, 4, 4, 5, 4],
      comments: null,
    });
    valueOf(sent, 'C3 send WEB feedback');
    deepEqual(changedKinds(sent), ['FB'], 'C3: feedback writes only the feedback record');
    const twice = await student.feedback.sendFeedback({
      experimentId,
      format: 'web',
      ratings: [5, 4, 4, 5, 4],
      comments: null,
    });
    check(
      errorOf(twice, 'conflict', 'C3 send twice').code === 'already-sent',
      'C3: sent once, no edit',
    );
    const vrFeedback = await student.feedback.sendFeedback({
      experimentId,
      format: 'vr',
      ratings: [5, 4, 4, 5, 4],
      comments: null,
    });
    check(
      errorOf(vrFeedback, 'refused', 'C3 feedback on VR').code === 'format-not-completed',
      'C3: no feedback for a format that is not Completed (BC5)',
    );
  },
};

export const FLOW_C_CASES: readonly ContractCase[] = [flowC];
