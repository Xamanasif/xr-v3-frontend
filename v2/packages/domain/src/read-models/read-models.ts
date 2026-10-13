/**
 * M27 derived read models (Appendix C §2; Appendix D §5.3) — computed on every read from the
 * records, never stored, so every role sees the same figure after any command. Each column reads
 * its own state: access from grants (③), started and sessions from activity (④), completed from
 * completion records (⑤). No licence usage, no percentage, no feedback column, no chart or export
 * (B3-10 'Not designed'; RUN-13). These are counts of people and records — never licence
 * arithmetic (T-06; WP-0.9 acceptance 6).
 */
import type { Technology } from '../technology.js';
import type { AccessPlanId, ExperimentId, InstitutionId, RequestId } from '../kernel/ids.js';
import type { CalendarDate, IsoInstant } from '../kernel/time.js';
import { type Experiment, publishedFormats } from '../catalogue/model.js';
import { experimentGate } from '../access/gate.js';
import type {
  OverlapGrantPolicy,
  ProvidedLicenceWait,
  StudentAccessGrant,
} from '../access/model.js';
import type { FormatCompletion } from '../completion/record.js';
import type { RuntimeActivity } from '../runtime/activity.js';
import type { AccessPlan, AccessPlanItem, Institution } from '../institution/model.js';
import { daysLeft, ENDING_SOON_DAYS, endedDaysAgo, planTermState } from '../institution/term.js';
import type { Group, StudentPerson } from '../people/model.js';
import type { AccessRequest } from '../request/model.js';
import type { Submission } from '../submission/model.js';
import type { CorrectionUpdate } from '../correction/correction.js';
import type { DeviceTransfer } from '../device/device.js';
import type { Assessment, Attempt, Question } from '../assessment/model.js';
import { assessmentVersion } from '../assessment/assessment.js';
import { pinnedQuestions } from '../assessment/attempt.js';

export interface UsageRow {
  readonly experimentId: ExperimentId;
  /** "Students who can open the experiment today. Each student counts once, however they were
   *  given it." A student whose case is undecided (policy-open) is not counted as able to open. */
  readonly studentsWithAccess: number;
  readonly perFormat: readonly {
    readonly format: Technology;
    /** "Students who have opened this format at least once." */
    readonly started: number;
    /** "Students whose format was reported completed by the simulation or the headset." */
    readonly completed: number;
    /** "Times the format was opened in the browser (WEB) or a session was reported from a headset". */
    readonly sessions: number;
  }[];
}

/** IA-20 Usage (B3-10; RUN-12): per experiment held × its plan formats. */
export function usage(input: {
  readonly institution: Institution;
  readonly plans: readonly AccessPlan[];
  readonly experiments: readonly Experiment[];
  readonly students: readonly StudentPerson[];
  readonly grants: readonly StudentAccessGrant[];
  readonly groups: readonly Group[];
  readonly waits: readonly ProvidedLicenceWait[];
  readonly overlap: OverlapGrantPolicy;
  readonly activities: readonly RuntimeActivity[];
  readonly completions: readonly FormatCompletion[];
  readonly now: IsoInstant;
}): readonly UsageRow[] {
  const items = new Map<ExperimentId, Set<Technology>>();
  for (const plan of input.plans.filter(
    (candidate) => candidate.institutionId === input.institution.id,
  )) {
    for (const item of plan.items) {
      const formats = items.get(item.experimentId) ?? new Set<Technology>();
      item.formats.forEach((format) => formats.add(format));
      items.set(item.experimentId, formats);
    }
  }
  const own = new Set(
    input.students
      .filter((student) => student.institutionId === input.institution.id)
      .map((student) => student.id),
  );
  return [...items].map(([experimentId, formats]) => {
    const experiment = input.experiments.find((candidate) => candidate.id === experimentId) ?? null;
    const withAccess = input.students.filter(
      (student) =>
        own.has(student.id) &&
        experimentGate({
          student,
          experiment,
          institution: input.institution,
          plans: input.plans,
          grants: input.grants,
          groups: input.groups,
          waits: input.waits,
          overlap: input.overlap,
          now: input.now,
        }).canOpen,
    ).length;
    return {
      experimentId,
      studentsWithAccess: withAccess,
      perFormat: [...formats].map((format) => {
        const activity = input.activities.filter(
          (row) =>
            own.has(row.studentId) && row.experimentId === experimentId && row.format === format,
        );
        return {
          format,
          started: activity.filter((row) => row.firstOpenedAt !== null).length,
          completed: input.completions.filter(
            (row) =>
              own.has(row.studentId) && row.experimentId === experimentId && row.format === format,
          ).length,
          sessions: activity.reduce((sum, row) => sum + row.sessions, 0),
        };
      }),
    };
  });
}

/** IA-02 / IA-03 / IA-05 (`iaContentAccess`): the plan's experiments × formats, and the published
 *  formats not in the plan — "AR is published but not in your plan" (B2-02, B2-03; ACC-10). */
export function iaContentAccess(
  plan: AccessPlan,
  experiments: readonly Experiment[],
): readonly {
  readonly item: AccessPlanItem;
  readonly publishedNotInPlan: readonly Technology[];
}[] {
  return plan.items.map((item) => {
    const experiment = experiments.find((candidate) => candidate.id === item.experimentId);
    const published = experiment ? publishedFormats(experiment) : [];
    return {
      item,
      publishedNotInPlan: published.filter((format) => !item.formats.includes(format)),
    };
  });
}

export interface AccessEndingRow {
  readonly institutionId: InstitutionId;
  readonly planId: AccessPlanId;
  readonly endsOn: CalendarDate;
  readonly daysLeft: number | null;
  readonly endedDaysAgo: number | null;
  readonly standing:
    | { readonly kind: 'renewal-in-progress'; readonly requestId: RequestId }
    /** "Reminder due · Nothing is sent from here" — a status only (T-31; ACC-07). */
    | { readonly kind: 'reminder-due' }
    | { readonly kind: 'ended-no-renewal' };
}

/** SA-22 Access ending (B7-09 f4; ACC-11): plans ending within the window, and ended plans. */
export function accessEndingRows(input: {
  readonly plans: readonly AccessPlan[];
  readonly requests: readonly AccessRequest[];
  readonly now: IsoInstant;
}): readonly AccessEndingRow[] {
  return input.plans.flatMap((plan) => {
    const term = planTermState(plan, input.now);
    if (term === 'active') return [];
    const renewal = input.requests.find(
      (request) =>
        request.type === 'renewal' &&
        request.sourcePlanId === plan.id &&
        request.status !== 'access-active',
    );
    const left = daysLeft(plan, input.now);
    return [
      {
        institutionId: plan.institutionId,
        planId: plan.id,
        endsOn: plan.endsOn,
        daysLeft: left >= 0 && left <= ENDING_SOON_DAYS ? left : null,
        endedDaysAgo: endedDaysAgo(plan, input.now),
        standing: renewal
          ? { kind: 'renewal-in-progress', requestId: renewal.id }
          : term === 'ended'
            ? { kind: 'ended-no-renewal' }
            : { kind: 'reminder-due' },
      },
    ];
  });
}

/** Sidebar counts (`navCounts`; board 06 sample figures; B1-10 f0 "Nav count 3 = requests under
 *  review"). Each is a count of records in the reader's scope; zero shows no count. */
export const navCounts = {
  /** Super Admin › Requests: requests under review. */
  superAdminRequests(requests: readonly AccessRequest[]): number {
    return requests.filter((request) => request.status === 'under-review').length;
  },
  /** Institute Admin › Requests: device requests waiting to be forwarded (board 06; whether this
   *  count belongs on Requests is open — see apps/web nav README). */
  instituteAdminDeviceRequests(
    transfers: readonly DeviceTransfer[],
    institutionId: InstitutionId,
  ): number {
    return transfers.filter(
      (transfer) =>
        transfer.institutionId === institutionId && transfer.state === 'with-institute-admin',
    ).length;
  },
  /** Academic Reviewer › Review queue: submissions and updates waiting for them, in scope. */
  reviewerQueue(
    submissions: readonly Submission[],
    updates: readonly CorrectionUpdate[],
    inScope: (subject: {
      readonly submission?: Submission;
      readonly update?: CorrectionUpdate;
    }) => boolean,
  ): number {
    return (
      submissions.filter(
        (submission) =>
          submission.status.state === 'with-academic-reviewer' && inScope({ submission }),
      ).length +
      updates.filter((update) => update.state === 'in-academic-review' && inScope({ update }))
        .length
    );
  },
  /** Content Manager › Ready to publish: approved submissions with them, in scope. */
  contentManagerReady(
    submissions: readonly Submission[],
    inScope: (submission: Submission) => boolean,
  ): number {
    return submissions.filter(
      (submission) => submission.status.state === 'with-content-manager' && inScope(submission),
    ).length;
  },
  /** Faculty › Marking: written answers waiting for marking in assessments they teach. */
  facultyMarking(
    attempts: readonly Attempt[],
    assessments: readonly Assessment[],
    questions: readonly Question[],
    taughtExperiments: readonly ExperimentId[],
  ): number {
    return attempts.reduce((sum, attempt) => {
      const assessment = assessments.find((candidate) => candidate.id === attempt.assessmentId);
      if (!assessment || !taughtExperiments.includes(assessment.experimentId)) return sum;
      if (attempt.state !== 'submitted' || attempt.marking.confirmed) return sum;
      const snapshot = assessmentVersion(assessment, attempt.assessmentVersion);
      const written = snapshot
        ? pinnedQuestions(snapshot, questions).filter(
            (entry) => entry.version.body.type === 'written',
          )
        : [];
      return sum + written.length;
    }, 0);
  },
} as const;

/** FA-20 "Inactive for N days" (OD-B4-10 sample): days since the last activity, or null. */
export function inactiveDays(lastActivityAt: IsoInstant | null, now: IsoInstant): number | null {
  if (!lastActivityAt) return null;
  return Math.floor((Date.parse(now) - Date.parse(lastActivityAt)) / 86_400_000);
}
