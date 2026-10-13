/**
 * First publication (M10 Submission; BC7) and the corrected-version chain (M11 Correction; BC8):
 * two separate machines. Publishing creates the experiment; Release replaces its live version.
 * Neither writes an institution plan, a Student grant, a licence or a mapping (BC9; invariant 1).
 */
import { describe, expect, it } from 'vitest';

import {
  content,
  counterIds,
  experiment,
  expectOk,
  holder,
  ids,
  refusalOf,
  submission,
  system,
  T,
  update,
  who,
} from '../testing/fixtures.js';
import {
  approveUpdate,
  changedFields,
  holdUpdate,
  liftHold,
  liveFields,
  openCorrection,
  OPEN_UPDATE_STATES,
  releaseUpdate,
  returnUpdate,
  saveCorrection,
  sendForAcademicReview,
  UPDATE_STATES,
  UPDATE_TRANSITIONS,
  type UpdateCommand,
  type UpdateState,
  withdrawUpdate,
} from '../correction/correction.js';
import {
  approveSubmission,
  checklistComplete,
  courseNoLongerAssigned,
  isStuck,
  overrideStatus,
  publicationCheck,
  publish,
  resubmit,
  returnSubmission,
  routeResubmission,
  saveDraft,
  saveRevision,
  sendBackToReviewer,
  sendBackToVendor,
  submitChecklist,
  submitForReview,
} from './decide.js';
import {
  DRAWN_WORKFLOW_ROUTING,
  SUBMISSION_STATES,
  SUBMISSION_TRANSITIONS,
  type SubmissionCommand,
  type SubmissionState,
  type SubmissionStatus,
} from './model.js';

const STATUS: Record<SubmissionState, SubmissionStatus> = {
  draft: { state: 'draft' },
  'with-academic-reviewer': {
    state: 'with-academic-reviewer',
    since: T.aug14,
    reason: 'first-review',
  },
  returned: { state: 'returned', since: T.aug14, by: 'academic-reviewer' },
  resubmitted: { state: 'resubmitted', since: T.aug14 },
  'with-content-manager': { state: 'with-content-manager', since: T.aug14 },
  published: { state: 'published', at: T.aug28, experimentId: ids.wallA },
};
const outcomes = [{ id: 'lo-9' as never, text: 'Explain conduction.' }];
const vendorWrite = () => ({
  actor: who.vendor,
  vendor: holder('vendor'),
  assignedCourses: [ids.course],
  now: T.oct14,
  ids: counterIds(),
});

function runSubmission(
  from: SubmissionState,
  command: Exclude<SubmissionCommand, never>,
): SubmissionState | null {
  const current = submission(STATUS[from]);
  const base = { actor: who.contentManager, now: T.oct14, ids: counterIds() };
  const decision = (() => {
    switch (command) {
      case 'saveDraft':
        return saveDraft({ ...vendorWrite(), submission: current, content: content() });
      case 'submitForReview':
        return submitForReview({
          ...vendorWrite(),
          submission: current,
          content: content(),
          otherNames: [],
        });
      case 'approveSubmission':
        return approveSubmission({
          submission: current,
          outcomes,
          actor: who.reviewer,
          now: T.oct14,
          ids: counterIds(),
        });
      case 'returnSubmission':
        return returnSubmission({
          submission: current,
          outcomes,
          reason: 'Fix the link',
          references: [],
          actor: who.reviewer,
          now: T.oct14,
          ids: counterIds(),
        });
      case 'saveRevision':
        return saveRevision({ ...vendorWrite(), submission: current, content: content() });
      case 'resubmit':
        return resubmit({
          ...vendorWrite(),
          submission: current,
          content: content(),
          otherNames: [],
        });
      case 'routeResubmission':
        return routeResubmission({
          submission: current,
          routing: DRAWN_WORKFLOW_ROUTING,
          actor: system('system:workflow-routing'),
          now: T.oct14,
          ids: counterIds(),
        });
      case 'publish': {
        const published = publish({ ...base, submission: current, experimentId: ids.wallB });
        return published.ok ? { ok: true as const, value: published.value.submission } : published;
      }
      case 'sendBackToReviewer':
        return sendBackToReviewer({ ...base, submission: current, reason: 'Recheck the outcomes' });
      case 'sendBackToVendor':
        return sendBackToVendor({
          ...base,
          submission: current,
          reason: 'Fix the package',
          references: [],
        });
      case 'overrideStatus':
        return overrideStatus({
          submission: current,
          holders: [],
          reason: 'Nobody can act',
          actor: who.superAdmin,
          now: T.oct14,
          ids: counterIds(),
        });
    }
  })();
  return decision.ok ? decision.value.status.state : null;
}

describe('the submission machine (acceptance 2): every drawn transition allowed, every other refused', () => {
  const commands = [...new Set(SUBMISSION_TRANSITIONS.map((row) => row.command))];
  for (const from of SUBMISSION_STATES) {
    for (const command of commands) {
      const drawn = SUBMISSION_TRANSITIONS.filter(
        (row) => row.from === from && row.command === command,
      );
      it(`${from} · ${command}: ${drawn.length ? `→ ${drawn.map((row) => row.to).join(' | ')}` : 'refused'}`, () => {
        const to = runSubmission(from, command);
        if (drawn.length === 0) expect(to).toBeNull();
        else expect(drawn.map((row) => row.to)).toContain(to);
      });
    }
  }

  it('nothing leaves Published, and nothing un-publishes (EXP-12; SUB-06)', () => {
    expect(SUBMISSION_TRANSITIONS.some((row) => row.from === 'published')).toBe(false);
    expect(SUBMISSION_TRANSITIONS.map((row) => row.command).join(' ')).not.toMatch(
      /unpublish|withdraw|recall/i,
    );
  });

  it('only the Content Manager publishes; routing is the system’s (BC7)', () => {
    expect(
      SUBMISSION_TRANSITIONS.filter((row) => row.to === 'published').map((row) => row.actors),
    ).toEqual([['content_manager']]);
    expect(
      SUBMISSION_TRANSITIONS.find((row) => row.command === 'routeResubmission')?.actors,
    ).toEqual(['system:workflow-routing']);
  });
});

describe('the Vendor editor (SUB-02 … SUB-11)', () => {
  it('a name is all a draft needs; the first save gives the id and the only history entry', () => {
    const first = expectOk(
      saveDraft({
        ...vendorWrite(),
        submission: null,
        content: content({ summary: null, formats: [], delivery: {} }),
      }),
    );
    expect(first).toMatchObject({ id: 'SUB-1001', status: { state: 'draft' } });
    expect(first.history.map((entry) => [entry.event, entry.visibleTo])).toEqual([
      ['draft-saved', ['vendor']],
    ]);
    const later = expectOk(saveDraft({ ...vendorWrite(), submission: first, content: content() }));
    expect(later.history).toHaveLength(1);
    expect(
      refusalOf(saveDraft({ ...vendorWrite(), submission: null, content: content({ name: ' ' }) })),
    ).toEqual({
      kind: 'validation-failed',
      issues: [{ field: 'name', rule: 'required-for-draft' }],
    });
  });

  it('submit lists what is missing and sends nothing; a duplicate name is refused (EXP-11 keeps the two walls separate)', () => {
    const incomplete = content({
      version: null,
      delivery: {
        web: {
          format: 'web',
          webLink: 'http://insecure.example.org',
          browserAndComputer: null,
          notes: null,
        },
      },
    });
    expect(checklistComplete(incomplete)).toBe(false);
    expect(submitChecklist(incomplete).map((item) => item.missing)).toEqual([
      ['version'],
      [
        'web:web-link',
        'web:browser-and-computer',
        'vr:package-label',
        'vr:package',
        'vr:device-need',
        'vr:install-notes',
      ],
      [],
    ]);
    expect(
      refusalOf(
        submitForReview({
          ...vendorWrite(),
          submission: null,
          content: incomplete,
          otherNames: [],
        }),
      ),
    ).toEqual({ kind: 'refused', code: 'submit-checklist-incomplete' });
    expect(
      refusalOf(
        submitForReview({
          ...vendorWrite(),
          submission: null,
          content: content(),
          otherNames: ['conduction through a composite wall'],
        }),
      ),
    ).toEqual({ kind: 'validation-failed', issues: [{ field: 'name', rule: 'taken' }] });
    expect(
      expectOk(
        submitForReview({
          ...vendorWrite(),
          submission: null,
          content: content(),
          otherNames: ['Composite Wall Conduction'],
        }),
      ).status.state,
    ).toBe('with-academic-reviewer');
  });

  it('a draft whose course is no longer assigned is read-only (SUB-11)', () => {
    const draft = submission({ state: 'draft' });
    expect(courseNoLongerAssigned(draft, [ids.course2])).toBe(true);
    expect(
      refusalOf(
        saveDraft({
          ...vendorWrite(),
          assignedCourses: [ids.course2],
          submission: draft,
          content: content(),
        }),
      ),
    ).toEqual({ kind: 'refused', code: 'course-not-assigned' });
  });

  it('resubmit reads "Submitted" (revision n+1) until the workflow routes it back to the reviewer (M-3)', () => {
    const back = expectOk(
      resubmit({
        ...vendorWrite(),
        submission: submission(STATUS.returned),
        content: content(),
        otherNames: [],
      }),
    );
    expect(back).toMatchObject({ status: { state: 'resubmitted' }, revision: 2 });
    const routed = expectOk(
      routeResubmission({
        submission: back,
        routing: DRAWN_WORKFLOW_ROUTING,
        actor: system('system:workflow-routing'),
        now: T.oct14,
        ids: counterIds(),
      }),
    );
    expect(routed.status).toEqual({
      state: 'with-academic-reviewer',
      since: T.oct14,
      reason: 'resubmission',
    });
    expect(
      routeResubmission({
        submission: back,
        routing: DRAWN_WORKFLOW_ROUTING,
        actor: system('system:runtime-report') as never,
        now: T.oct14,
        ids: counterIds(),
      }).ok,
    ).toBe(false);
  });
});

describe('review and publication (SUB-17 … SUB-33)', () => {
  it('approval needs a learning outcome and does not publish', () => {
    const current = submission(STATUS['with-academic-reviewer']);
    expect(
      refusalOf(
        approveSubmission({
          submission: current,
          outcomes: [],
          actor: who.reviewer,
          now: T.oct14,
          ids: counterIds(),
        }),
      ),
    ).toEqual({ kind: 'validation-failed', issues: [{ field: 'outcomes', rule: 'at-least-one' }] });
    expect(
      expectOk(
        approveSubmission({
          submission: current,
          outcomes,
          actor: who.reviewer,
          now: T.oct14,
          ids: counterIds(),
        }),
      ).status.state,
    ).toBe('with-content-manager');
  });

  it('first publication creates the experiment (live = the Vendor’s label) and writes no access (SUB-30)', () => {
    const outcome = expectOk(
      publish({
        submission: submission(STATUS['with-content-manager']),
        experimentId: ids.wallB,
        actor: who.contentManager,
        now: T.oct14,
        ids: counterIds(),
      }),
    );
    expect(Object.keys(outcome).sort()).toEqual(['experiment', 'submission']);
    expect(outcome.experiment).toMatchObject({
      id: ids.wallB,
      courseId: ids.course,
      originSubmissionId: ids.sub77,
      openUpdateId: null,
      publishedBy: who.contentManager,
    });
    expect(outcome.experiment.live).toMatchObject({
      label: '1.0',
      source: { kind: 'first-publication', submissionId: ids.sub77, revision: 1 },
    });
    expect(outcome.experiment.live.formats.map((entry) => entry.format)).toEqual(['web', 'vr']);
  });

  it('the publication check blocks a stale approval (SUB-25)', () => {
    const stale = submission(STATUS['with-content-manager'], { revision: 2 });
    expect(publicationCheck(stale).find((item) => item.check === 'approved-by-reviewer')).toEqual({
      check: 'approved-by-reviewer',
      ok: false,
      fixHint: 'send-back-to-reviewer',
    });
    expect(
      refusalOf(
        publish({
          submission: stale,
          experimentId: ids.wallB,
          actor: who.contentManager,
          now: T.oct14,
          ids: counterIds(),
        }),
      ),
    ).toEqual({ kind: 'refused', code: 'publication-blocked' });
  });

  it('the override moves only a stuck record (SUB-33, SUB-34)', () => {
    const waiting = submission(STATUS['with-academic-reviewer']);
    expect(isStuck(waiting, [holder('academic_reviewer')])).toBe(false);
    expect(
      refusalOf(
        overrideStatus({
          submission: waiting,
          holders: [holder('academic_reviewer')],
          reason: 'x',
          actor: who.superAdmin,
          now: T.oct14,
          ids: counterIds(),
        }),
      ),
    ).toEqual({ kind: 'refused', code: 'override-not-stuck' });
    const moved = expectOk(
      overrideStatus({
        submission: waiting,
        holders: [],
        reason: 'Nobody has EEE ZC341',
        actor: who.superAdmin,
        now: T.oct14,
        ids: counterIds(),
      }),
    );
    expect(moved.status).toEqual({ state: 'returned', since: T.oct14, by: 'super-admin-override' });
    expect(moved.history.at(-1)).toMatchObject({
      event: 'status-overridden',
      visibleTo: ['super_admin'],
    });
  });
});

function runUpdate(
  from: UpdateState,
  command: Exclude<UpdateCommand, 'openCorrection'>,
): UpdateState | null {
  const exp = experiment({ openUpdateId: ids.upd5 });
  const current = update(from, {}, exp);
  const base = { now: T.oct20, ids: counterIds() };
  const edit = {
    proposed: current.proposed,
    whatChangesAndWhy: 'Corrects the reflux statement.',
    versionLabel: '1.1',
  };
  const decision = (() => {
    switch (command) {
      case 'saveCorrection':
        return saveCorrection({ ...base, actor: who.contentManager, update: current, edit });
      case 'sendForAcademicReview':
        return sendForAcademicReview({
          ...base,
          actor: who.contentManager,
          update: current,
          experiment: exp,
          edit,
        });
      case 'withdrawUpdate': {
        const done = withdrawUpdate({
          ...base,
          actor: who.contentManager,
          update: current,
          experiment: exp,
          reason: 'Not needed',
        });
        return done.ok ? { ok: true as const, value: done.value.update } : done;
      }
      case 'approveUpdate':
        return approveUpdate({ ...base, actor: who.reviewer, update: current });
      case 'returnUpdate':
        return returnUpdate({
          ...base,
          actor: who.reviewer,
          update: current,
          reason: 'Say which statement',
        });
      case 'releaseUpdate': {
        const done = releaseUpdate({
          ...base,
          actor: who.superAdmin,
          update: current,
          experiment: exp,
        });
        return done.ok ? { ok: true as const, value: done.value.update } : done;
      }
      case 'holdUpdate':
        return holdUpdate({
          ...base,
          actor: who.superAdmin,
          update: current,
          reason: 'Wait for the term to end.',
        });
      case 'liftHold':
        return liftHold({ ...base, actor: who.superAdmin, update: current });
    }
  })();
  return decision.ok ? decision.value.state : null;
}

describe('the correction machine (acceptance 2): every drawn transition allowed, every other refused', () => {
  const commands = [...new Set(UPDATE_TRANSITIONS.map((row) => row.command))].filter(
    (command): command is Exclude<UpdateCommand, 'openCorrection'> => command !== 'openCorrection',
  );
  for (const from of UPDATE_STATES) {
    for (const command of commands) {
      const drawn = UPDATE_TRANSITIONS.filter(
        (row) => row.from === from && row.command === command,
      );
      it(`${from} · ${command}: ${drawn.length ? `→ ${drawn.map((row) => row.to).join(' | ')}` : 'refused'}`, () => {
        const to = runUpdate(from, command);
        if (drawn.length === 0) expect(to).toBeNull();
        else expect(drawn.map((row) => row.to)).toContain(to);
      });
    }
  }

  it('Release is the Super Admin’s and is never called Publish; no release straight from On hold (UPD-23)', () => {
    expect(UPDATE_TRANSITIONS.map((row) => row.command)).not.toContain('publish');
    expect(UPDATE_TRANSITIONS.filter((row) => row.to === 'released')).toEqual([
      {
        from: 'awaiting-release-decision',
        to: 'released',
        command: 'releaseUpdate',
        actors: ['super_admin'],
      },
    ]);
    expect(
      refusalOf(
        releaseUpdate({
          update: update('on-hold'),
          experiment: experiment(),
          actor: who.superAdmin,
          now: T.oct20,
          ids: counterIds(),
        }),
      ),
    ).toEqual({ kind: 'refused', code: 'hold-must-be-lifted' });
  });
});

describe('corrections (UPD-01 … UPD-25): one open update, pre-filled from live; Release replaces live for everyone', () => {
  it('opens one draft pre-filled from live; a Draft or Returned update is joined; any other open update blocks', () => {
    const opened = expectOk(
      openCorrection({
        experiment: experiment(),
        openUpdate: null,
        entry: 'edit-delivery-link',
        actor: who.contentManager,
        now: T.oct12,
        ids: counterIds(),
      }),
    );
    expect(opened.joined).toBe(false);
    expect(opened.update.proposed).toEqual(liveFields(experiment()));
    expect(opened.experiment.openUpdateId).toBe(opened.update.id);
    expect(OPEN_UPDATE_STATES).toContain('on-hold');
    for (const state of OPEN_UPDATE_STATES) {
      const decision = openCorrection({
        experiment: experiment({ openUpdateId: ids.upd5 }),
        openUpdate: update(state),
        entry: 'start-a-correction',
        actor: who.contentManager,
        now: T.oct12,
        ids: counterIds(),
      });
      if (state === 'draft' || state === 'returned') expect(expectOk(decision).joined).toBe(true);
      else expect(refusalOf(decision)).toEqual({ kind: 'refused', code: 'update-already-open' });
    }
  });

  it('sending needs a reason, a new label and a change (OD-B6-08, OD-B6-09)', () => {
    const exp = experiment();
    expect(
      refusalOf(
        sendForAcademicReview({
          update: update('draft'),
          experiment: exp,
          edit: { proposed: liveFields(exp), whatChangesAndWhy: ' ', versionLabel: '1.0' },
          actor: who.contentManager,
          now: T.oct12,
          ids: counterIds(),
        }),
      ),
    ).toEqual({
      kind: 'validation-failed',
      issues: [
        { field: 'whatChangesAndWhy', rule: 'required' },
        { field: 'versionLabel', rule: 'same-as-live' },
        { field: 'summary', rule: 'change-something' },
      ],
    });
    expect(changedFields(liveFields(exp), update('draft').proposed)).toEqual(['description']);
  });

  it('Release closes the previous version by its identity, also on a copied record (a store’s copy)', () => {
    const exp = JSON.parse(JSON.stringify(experiment({ openUpdateId: ids.upd5 }))) as ReturnType<
      typeof experiment
    >;
    expect(exp.live).not.toBe(exp.versions[0]);
    const outcome = expectOk(
      releaseUpdate({
        update: update('awaiting-release-decision', {}, exp),
        experiment: exp,
        actor: who.superAdmin,
        now: T.oct20,
        ids: counterIds(),
      }),
    );
    expect(
      outcome.experiment.versions.map((version) => [version.label, version.liveUntil]),
    ).toEqual([
      ['1.0', T.oct20],
      ['1.1', null],
    ]);
  });

  it('Release: a new live version; the previous one is kept; formats and outcomes unchanged; no access written', () => {
    const exp = experiment({ openUpdateId: ids.upd5 });
    const outcome = expectOk(
      releaseUpdate({
        update: update('awaiting-release-decision', {}, exp),
        experiment: exp,
        actor: who.superAdmin,
        now: T.oct20,
        ids: counterIds(),
      }),
    );
    expect(Object.keys(outcome).sort()).toEqual(['experiment', 'update']);
    expect(outcome.experiment.live).toMatchObject({
      label: '1.1',
      liveFrom: T.oct20,
      source: { kind: 'correction-release', updateId: ids.upd5 },
    });
    expect(
      outcome.experiment.versions.map((version) => [version.label, version.liveUntil]),
    ).toEqual([
      ['1.0', T.oct20],
      ['1.1', null],
    ]);
    expect(outcome.experiment.live.formats.map((entry) => entry.format)).toEqual(
      exp.live.formats.map((entry) => entry.format),
    );
    expect(outcome.experiment.learningOutcomes).toBe(exp.learningOutcomes);
    expect(outcome.experiment.openUpdateId).toBeNull();
    expect(outcome.experiment.publishedAt).toBe(exp.publishedAt); // release is not a publication
  });

  it('a hold keeps the live version and still counts as the open update; lifting returns to the decision', () => {
    const held = expectOk(
      holdUpdate({
        update: update('awaiting-release-decision'),
        reason: 'Wait for the term to end.',
        actor: who.superAdmin,
        now: T.oct20,
        ids: counterIds(),
      }),
    );
    expect(held).toMatchObject({ state: 'on-hold', hold: { reason: 'Wait for the term to end.' } });
    expect(
      refusalOf(
        holdUpdate({
          update: update('awaiting-release-decision'),
          reason: '',
          actor: who.superAdmin,
          now: T.oct20,
          ids: counterIds(),
        }),
      ),
    ).toEqual({ kind: 'validation-failed', issues: [{ field: 'reason', rule: 'required' }] });
    const lifted = expectOk(
      liftHold({ update: held, actor: who.superAdmin, now: T.nov5, ids: counterIds() }),
    );
    expect(lifted).toMatchObject({
      state: 'awaiting-release-decision',
      hold: null,
      holdLifts: [{ at: T.nov5 }],
    });
  });
});
