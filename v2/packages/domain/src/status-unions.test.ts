/**
 * WP-0.9 acceptance (1): every model M01–M28 has a type, and every status-bearing record's union
 * equals the "Status → labels" list of its model. `APPENDIX_C` below is the enumerated fixture,
 * transcribed by hand from v2/docs/v46/audit/Appendix-C-Schemas-and-Contracts.md §2 (the canonical
 * column of each "Status → labels" table) — it is never read from the domain code.
 */
import { describe, expect, it } from 'vitest';

import type * as Domain from './index.js';
import {
  ACCESS_PLAN_STATUSES,
  ACCOUNT_STATUSES,
  ASSESSMENT_READINESS,
  ATTEMPT_RESULT_KINDS,
  ATTEMPT_STATES,
  DEVICE_TRANSFER_STATES,
  FORMAT_PROGRESS_STATUSES,
  GRANT_DISPLAY_STATUSES,
  GRANT_STATES,
  GROUP_MEMBER_STANDINGS,
  INSTITUTION_CODE_STATUSES,
  INSTITUTION_STATUSES,
  QUESTION_STATUSES,
  REQUEST_STATUSES,
  RETURNED_BY,
  REVIEW_REASONS,
  SCOPE_STATUSES,
  SHELL_BANNERS,
  STUDENT_DIRECTORY_STATUSES,
  SUBMISSION_STATES,
  SUPPORT_STATES,
  UPDATE_STATES,
  feedbackEntry,
  openResource,
  requesterSeesSubmitted,
} from './index.js';
import { experiment, ids, request, system, T } from './testing/fixtures.js';

/** One type per Appendix C model (a missing export fails the typecheck). */
type ModelTypes = {
  M01: Domain.Institution;
  M02: Domain.InstituteAdminAssignment;
  M03: Domain.AccessRequest & { payments: readonly Domain.PaymentAttempt[] };
  M04: Domain.Selection;
  M05: Domain.AccessPlan;
  M06: Domain.EngineeringArea;
  M07: Domain.Course;
  M08: Domain.InstitutionCourseCode;
  M09: Domain.Experiment;
  M10: Domain.Submission;
  M11: Domain.CorrectionUpdate;
  M12: Domain.Person;
  M13: Domain.Group;
  M14: Domain.FacultyCourseMapping;
  M15: Domain.StudentAccessGrant;
  M16: Domain.RuntimeActivity;
  M17: Domain.FormatCompletion | Domain.FormatProgressView;
  M18: Domain.ResourceOpened;
  M19: Domain.FormatFeedback;
  M20: Domain.Assessment;
  M21: Domain.Question | Domain.QuestionDraft;
  M22: Domain.Attempt;
  M23: Domain.DeviceTransfer;
  M24: Domain.SupportReport;
  M25: Domain.PlatformRoleHolder;
  M26: Domain.MockSession;
  M27: Domain.UsageRow | Domain.AccessEndingRow;
  M28: Domain.HistoryEntry<string>;
};

const MODELS = {
  M01: 'Institution',
  M02: 'Institute Admin assignment',
  M03: 'Access request + payment attempt',
  M04: 'Selection',
  M05: 'Access plan',
  M06: 'Engineering area',
  M07: 'Course + platform course code',
  M08: 'Institution course code',
  M09: 'Experiment',
  M10: 'Submission',
  M11: 'Correction',
  M12: 'Person',
  M13: 'Group + membership',
  M14: 'Faculty course mapping',
  M15: 'Student access grant',
  M16: 'Runtime activity',
  M17: 'Format completion + progress view',
  M18: 'Resource opened',
  M19: 'Format feedback',
  M20: 'Assessment',
  M21: 'Question bank item, draft, import',
  M22: 'Attempt, marking and result',
  M23: 'Device transfer',
  M24: 'Support report',
  M25: 'Platform role holder + scopes',
  M26: 'Mock session',
  M27: 'Derived read models',
  M28: 'History / audit',
} as const satisfies Record<keyof ModelTypes, string>;

/** The canonical column of each "Status → labels" table (Appendix C §2). */
const APPENDIX_C = {
  M01: [
    'approved-payment-required',
    'access-active',
    'ending-soon',
    'access-paused',
    'access-ended',
  ],
  M03: [
    'under-review',
    'information-requested',
    'approved-payment-required',
    'payment-not-confirmed',
    'payment-failed',
    'access-active',
  ],
  M05: ['access-active', 'ending-soon', 'paused', 'access-ended'],
  M08: ['missing', 'added'],
  M10: [
    'draft',
    'with-academic-reviewer',
    'returned',
    'resubmitted',
    'with-content-manager',
    'published',
  ],
  'M10 with-AR ·': ['first-review', 'resubmission', 'recheck'],
  'M10 returned ·': ['academic-reviewer', 'content-manager', 'super-admin-override'],
  M11: [
    'draft',
    'in-academic-review',
    'returned',
    'awaiting-release-decision',
    'on-hold',
    'released',
    'withdrawn',
  ],
  M12: ['active', 'inactive'],
  'M12 IA directory': ['access-active', 'no-access-yet', 'inactive'],
  'M13 member standing': [
    'can-open-it',
    'has-it-individually',
    'waiting-for-a-licence',
    'inactive',
    'added-after-the-group-grant',
  ],
  'M15 stored': ['active', 'withdrawn'],
  'M15 canonical / derived': [
    'active',
    'waiting-for-a-licence',
    'student-inactive',
    'access-ended',
    'paused',
    'withdrawn',
    'individual-grant-withdrawn',
  ],
  M17: ['not-started', 'in-progress', 'completed'],
  M20: ['draft-not-ready', 'ready'],
  'M21 question': ['active', 'deleted'],
  'M22 stored': ['in-progress', 'submitted'],
  'M22 canonical / derived': ['in-progress', 'waiting-for-marking', 'not-released-yet', 'released'],
  M23: ['with-institute-admin', 'forwarded', 'approved'],
  M24: ['open', 'resolved', 'reopened'],
  'M25 scope': ['active', 'withdrawn'],
  'M26 banner': ['institution-paused', 'account-inactive'],
} as const;

/** Models whose Appendix C table says no status is drawn. */
const NO_STATUS = ['M02', 'M04', 'M06', 'M07', 'M14', 'M16', 'M27', 'M28'] as const;

describe('acceptance (1): a type for every model M01–M28', () => {
  it('28 models, M01 … M28', () => {
    expect(Object.keys(MODELS)).toEqual(
      Array.from({ length: 28 }, (_, index) => `M${String(index + 1).padStart(2, '0')}`),
    );
  });

  it('the models with no drawn status carry no status field (checked by the typecheck)', () => {
    // Distributed over a union: true when any member carries a status or state field.
    type Each<T> = T extends unknown
      ? 'status' extends keyof T
        ? true
        : 'state' extends keyof T
          ? true
          : false
      : never;
    type HasStatus<T> = true extends Each<T> ? true : false;
    // The check can fail: the M17 progress view carries a status.
    const progressView: HasStatus<ModelTypes['M17']> = true;
    expect(progressView).toBe(true);
    const statusField: { readonly [K in (typeof NO_STATUS)[number]]: HasStatus<ModelTypes[K]> } = {
      M02: false,
      M04: false,
      M06: false,
      M07: false,
      M14: false,
      M16: false,
      M27: false,
      M28: false,
    };
    expect(Object.keys(statusField)).toEqual([...NO_STATUS]);
  });
});

describe('acceptance (1): every status union equals its "Status → labels" list (enumerated fixture)', () => {
  const unions: Record<keyof typeof APPENDIX_C, readonly string[]> = {
    M01: INSTITUTION_STATUSES,
    M03: REQUEST_STATUSES,
    M05: ACCESS_PLAN_STATUSES,
    M08: INSTITUTION_CODE_STATUSES,
    M10: SUBMISSION_STATES,
    'M10 with-AR ·': REVIEW_REASONS,
    'M10 returned ·': RETURNED_BY,
    M11: UPDATE_STATES,
    M12: ACCOUNT_STATUSES,
    'M12 IA directory': STUDENT_DIRECTORY_STATUSES,
    'M13 member standing': GROUP_MEMBER_STANDINGS,
    'M15 stored': GRANT_STATES,
    'M15 canonical / derived': GRANT_DISPLAY_STATUSES,
    M17: FORMAT_PROGRESS_STATUSES,
    M20: ASSESSMENT_READINESS,
    'M21 question': QUESTION_STATUSES,
    'M22 stored': ATTEMPT_STATES,
    'M22 canonical / derived': ATTEMPT_RESULT_KINDS,
    M23: DEVICE_TRANSFER_STATES,
    M24: SUPPORT_STATES,
    'M25 scope': SCOPE_STATUSES,
    'M26 banner': SHELL_BANNERS,
  };
  for (const [model, canonical] of Object.entries(APPENDIX_C)) {
    it(`${model}: ${canonical.join(' · ')}`, () => {
      expect(unions[model as keyof typeof APPENDIX_C]).toEqual(canonical);
    });
  }

  it('M03: the requester reads "Submitted" for an under-review request whose review has not started (AD-14)', () => {
    expect(requesterSeesSubmitted(request())).toBe(true);
    expect(requesterSeesSubmitted(request({ reviewStartedAt: T.oct9 }))).toBe(false);
  });

  it('M09: an experiment exists only once published — no status field, a publication date always', () => {
    expect(Object.keys(experiment())).not.toContain('status');
    expect(experiment().publishedAt).toBe(T.aug28);
  });

  it('M18: "Not opened yet" → "Opened <date>" is the presence of the record', () => {
    const opened = openResource({
      existing: null,
      studentId: ids.rahul,
      resourceId: 'res-1' as never,
      experiment: experiment(),
      gate: { canOpen: true, viaGrantIds: [] },
      now: T.oct12,
    });
    expect(opened.ok && opened.value.opened.firstOpenedAt).toBe(T.oct12);
  });

  it('M19: not eligible (nothing shown) · eligible · sent', () => {
    const gate = { canOpen: true as const, viaGrantIds: [] };
    const completion = {
      studentId: ids.rahul,
      experimentId: ids.shell,
      format: 'web' as const,
      completedAt: T.oct14,
      reportedFrom: 'simulation' as const,
      recordedBy: system('system:runtime-report'),
    };
    expect(feedbackEntry({ completion: null, feedback: null, gate })).toBe('not-offered');
    expect(feedbackEntry({ completion, feedback: null, gate })).toBe('offered');
    expect(
      feedbackEntry({
        completion,
        feedback: {
          id: 'fb-1' as never,
          studentId: ids.rahul,
          experimentId: ids.shell,
          format: 'web',
          statementSet: 1,
          ratings: [4, 4, 4, 4, 4],
          comments: null,
          sentAt: T.oct14,
        },
        gate,
      }),
    ).toEqual({ sentAt: T.oct14 });
  });
});
