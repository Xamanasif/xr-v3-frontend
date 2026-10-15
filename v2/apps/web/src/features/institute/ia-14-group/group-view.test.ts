/**
 * IA-14's member status (B2-08 `rows`) from the service's standing: the drawn words for one live
 * group grant, one line per experiment for several (state-copy `IA-14.several`), and no can /
 * can't-open words for the undecided overlap (OD-B2-01).
 */
import type { GrantRow } from '@xr/contracts/draft';
import { describe, expect, it } from 'vitest';

import { stateWords } from '@/copy/state-copy';

import {
  type GroupGrantLine,
  type GroupMember,
  individualGrantId,
  liveGrants,
  memberStatus,
} from './group-view';

function member(
  standing: GroupMember['standing'],
  accountStatus: 'active' | 'inactive' = 'active',
): GroupMember {
  return {
    student: { id: 'per-0002', fullName: 'Rahul Verma', accountStatus },
    standing,
  } as unknown as GroupMember;
}

function grantLine(
  id: string,
  experimentId: string,
  experimentName: string,
  status: GroupGrantLine['status'] = 'active',
): GroupGrantLine {
  return {
    grant: { id, experimentId },
    experimentName,
    courseCode: 'ME ZG523',
    formats: ['web'],
    status,
  } as unknown as GroupGrantLine;
}

function individual(
  id: string,
  experimentId: string,
  state: 'active' | 'withdrawn',
  givenAt: string,
): GrantRow {
  return {
    grant: {
      id,
      experimentId,
      state,
      givenAt,
      target: { kind: 'student', studentId: 'per-0002' },
    },
  } as unknown as GrantRow;
}

const SHELL = grantLine('SACC-0311', 'shell', 'Shell-and-Tube Heat Exchanger');
const FIN = grantLine('SACC-0320', 'fin', 'Fin-Tube Bundle');

describe('IA-14 member status', () => {
  it('no live grant: the account status — “Active”, or the drawn inactive line', () => {
    expect(memberStatus(member([]), [], [])).toEqual({ kind: 'active' });
    expect(memberStatus(member([], 'inactive'), [], [])).toEqual({ kind: 'inactive' });
    expect(memberStatus(member(['inactive'], 'inactive'), [SHELL], [])).toEqual({
      kind: 'inactive',
    });
  });

  it('one live grant: the drawn words, the wait as its pill', () => {
    const one = (standing: GroupMember['standing'][number]) =>
      memberStatus(member([standing]), [SHELL], []);
    expect(one('can-open-it')).toMatchObject({
      kind: 'standing',
      lines: [{ words: 'Can open it', pill: false }],
    });
    expect(one('waiting-for-a-licence')).toMatchObject({
      lines: [{ words: 'Waiting for a licence', pill: true }],
    });
    expect(one('added-after-the-group-grant')).toMatchObject({
      lines: [{ words: 'Added after the group grant', pill: false }],
    });
  });

  it('“Has it individually” names the member’s own active grant for that experiment, if listed', () => {
    const rows = [
      individual('SACC-0300', 'shell', 'withdrawn', '2026-10-01T05:00:00Z'),
      individual('SACC-0310', 'shell', 'active', '2026-10-09T05:00:00Z'),
      individual('SACC-0330', 'fin', 'active', '2026-10-10T05:00:00Z'),
    ];
    expect(individualGrantId(rows, 'per-0002', 'shell')).toBe('SACC-0310');
    expect(individualGrantId(rows, 'per-0003', 'shell')).toBeNull();
    expect(memberStatus(member(['has-it-individually']), [SHELL], rows)).toMatchObject({
      lines: [{ words: 'Has it individually · SACC-0310' }],
    });
    expect(memberStatus(member(['has-it-individually']), [SHELL], [])).toMatchObject({
      lines: [{ words: 'Has it individually' }],
    });
  });

  it('the undecided overlap: the register’s words, never can / can’t (OD-B2-01)', () => {
    const status = memberStatus(
      member([{ kind: 'policy-open', decision: 'OD-B2-01' }]),
      [SHELL],
      [],
    );
    expect(status).toMatchObject({
      lines: [{ words: stateWords('IA-14.policy-open'), pill: false }],
    });
  });

  it('several live grants: one line per experiment, in the grants’ order', () => {
    const status = memberStatus(member(['can-open-it', 'waiting-for-a-licence']), [SHELL, FIN], []);
    expect(status).toEqual({
      kind: 'standing',
      lines: [
        {
          grantId: 'SACC-0311',
          experimentName: 'Shell-and-Tube Heat Exchanger',
          words: 'Can open it',
          pill: false,
        },
        {
          grantId: 'SACC-0320',
          experimentName: 'Fin-Tube Bundle',
          words: 'Waiting for a licence',
          pill: true,
        },
      ],
    });
  });

  it('the standings follow the live grants only (ended and withdrawn grants have none)', () => {
    const ended = grantLine('SACC-0301', 'old', 'Composite Wall Conduction', 'access-ended');
    const view = { grantRows: [ended, SHELL] } as unknown as Parameters<typeof liveGrants>[0];
    expect(liveGrants(view)).toEqual([SHELL]);
  });
});
