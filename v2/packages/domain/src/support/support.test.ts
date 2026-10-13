/**
 * Support reports (Appendix C M24; matrix SUP-*): any signed-in person reports; the Super Admin
 * resolves and reopens. The reporter has no Reopen (SUP-04 OPEN), no edit, no delete; the My
 * reports row title is an excerpt of "What happened" (P0-31) — there is no title field.
 */
import { describe, expect, it } from 'vitest';

import { counterIds, expectOk, ids, refusalOf, report, T, who } from '../testing/fixtures.js';
import {
  reopenReport,
  reportProblem,
  reportTitleExcerpt,
  resolveReport,
  SUPPORT_STATES,
  SUPPORT_TRANSITIONS,
} from './support.js';

describe('the support machine (acceptance 2)', () => {
  for (const from of SUPPORT_STATES) {
    it(`${from}: resolve ${SUPPORT_TRANSITIONS.some((row) => row.from === from && row.command === 'resolveReport') ? 'drawn' : 'refused'}, reopen ${SUPPORT_TRANSITIONS.some((row) => row.from === from && row.command === 'reopenReport') ? 'drawn' : 'refused'}`, () => {
      const resolved = resolveReport({
        report: report(from),
        note: 'Fixed in build 1.0.3',
        actor: who.superAdmin,
        now: T.oct14,
        ids: counterIds(),
      });
      const reopened = reopenReport({
        report: report(from),
        actor: who.superAdmin,
        now: T.oct14,
        ids: counterIds(),
      });
      expect(resolved.ok).toBe(
        SUPPORT_TRANSITIONS.some((row) => row.from === from && row.command === 'resolveReport'),
      );
      expect(reopened.ok).toBe(
        SUPPORT_TRANSITIONS.some((row) => row.from === from && row.command === 'reopenReport'),
      );
    });
  }

  it('Resolve and Reopen are the Super Admin’s alone; every signed-in role reports', () => {
    expect(
      SUPPORT_TRANSITIONS.filter((row) => row.from !== null).every(
        (row) => row.actors.join() === 'super_admin',
      ),
    ).toBe(true);
    expect(SUPPORT_TRANSITIONS.find((row) => row.command === 'reportProblem')?.actors).toHaveLength(
      7,
    );
  });
});

describe('report, resolve, reopen', () => {
  it('"What happened" is required; the reference is SUP-nnnn; no title field', () => {
    const sent = expectOk(
      reportProblem({
        whatHappened: ' VR simulation stopped loading at step 2 ',
        where: 'My courses',
        screenshotFileName: '',
        institutionId: ids.godavari,
        organisation: null,
        actor: who.student,
        now: T.oct2,
        ids: counterIds(),
      }),
    );
    expect(sent).toMatchObject({
      id: 'SUP-1001',
      state: 'open',
      whatHappened: 'VR simulation stopped loading at step 2',
      screenshotFileName: null,
    });
    expect(Object.keys(sent)).not.toContain('title');
    expect(sent.history[0]).toMatchObject({ event: 'sent', visibleTo: ['student', 'super_admin'] });
    expect(
      refusalOf(
        reportProblem({
          whatHappened: '',
          where: null,
          screenshotFileName: null,
          institutionId: null,
          organisation: 'Northline',
          actor: who.vendor,
          now: T.oct2,
          ids: counterIds(),
        }),
      ),
    ).toEqual({ kind: 'validation-failed', issues: [{ field: 'whatHappened', rule: 'required' }] });
  });

  it('the note on Resolve is required and the reporter sees it; Reopen keeps every resolution', () => {
    expect(
      refusalOf(
        resolveReport({
          report: report('open'),
          note: ' ',
          actor: who.superAdmin,
          now: T.oct14,
          ids: counterIds(),
        }),
      ),
    ).toEqual({ kind: 'validation-failed', issues: [{ field: 'note', rule: 'required' }] });
    const resolved = expectOk(
      resolveReport({
        report: report('open'),
        note: 'Fixed in build 1.0.3',
        actor: who.superAdmin,
        now: T.oct14,
        ids: counterIds(),
      }),
    );
    expect(resolved.history.at(-1)).toMatchObject({
      event: 'resolved',
      note: 'Fixed in build 1.0.3',
      visibleTo: ['student', 'super_admin'],
    });
    const reopened = expectOk(
      reopenReport({ report: resolved, actor: who.superAdmin, now: T.oct20, ids: counterIds() }),
    );
    expect(reopened).toMatchObject({
      state: 'reopened',
      resolutions: [{ note: 'Fixed in build 1.0.3' }],
      reopenings: [{ at: T.oct20 }],
    });
  });

  it('the row title is a display excerpt (P0-31)', () => {
    expect(reportTitleExcerpt(report('open'))).toBe('VR simulation stopped loading at step 2');
    const long = report('open', {
      whatHappened: `${'The headset lost tracking '.repeat(4)}and the lab stopped.`,
    });
    expect(reportTitleExcerpt(long, 30)).toBe('The headset lost tracking The…');
  });
});
