/**
 * IA-14's member status (V3: IA-v1 `Main.dc.html` `memberStatus`) from the service's standing: the
 * export's words for each standing, the most telling one where the group has several live grants
 * (state-copy `IA-14.several`), the account status while nothing is given, "Paused" and "Access
 * ended" from the institution's standing, and no can / can't-open words for the undecided overlap
 * (OD-B2-01). No grant is named by its id.
 */
import type { GrantRow } from '@xr/contracts/draft';
import { describe, expect, it } from 'vitest';

import { stateWords } from '@/copy/state-copy';

import {
  grantStatus,
  type GroupGrantLine,
  type GroupMember,
  individualGrantDate,
  liveGrants,
  memberStatus,
} from './group-view';

type View = Parameters<typeof memberStatus>[1];

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
    grant: { id, experimentId, givenAt: '2026-10-12T05:30:00.000Z' },
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
    display: state === 'active' ? 'active' : 'withdrawn',
  } as unknown as GrantRow;
}

const view = (...grantRows: GroupGrantLine[]): View => ({ grantRows }) as unknown as View;

const SHELL = grantLine('SACC-0311', 'shell', 'Shell-and-Tube Heat Exchanger');
const FIN = grantLine('SACC-0320', 'fin', 'Fin-Tube Bundle');

describe('IA-14 member status', () => {
  it('nothing given: the account status — “Active”, or “Inactive” without its line', () => {
    expect(memberStatus(member([]), view(), [], false)).toEqual({
      words: 'Active',
      tone: 'ok',
      note: null,
    });
    expect(memberStatus(member([], 'inactive'), view(), [], false)).toEqual({
      words: 'Inactive',
      tone: 'ended',
      note: null,
    });
  });

  it('with grants: an inactive member reads “Inactive” with its line', () => {
    expect(memberStatus(member(['inactive'], 'inactive'), view(SHELL), [], false)).toEqual({
      words: 'Inactive',
      tone: 'ended',
      note: 'Can’t open experiments while inactive',
    });
  });

  it('paused, or the plan ended: “Paused” or “Access ended”, never a standing', () => {
    expect(memberStatus(member([]), view(SHELL), [], true)).toMatchObject({
      words: 'Paused',
      tone: 'paused',
    });
    const ended = grantLine('SACC-0311', 'shell', 'Shell-and-Tube Heat Exchanger', 'access-ended');
    expect(memberStatus(member([]), view(ended), [], false)).toMatchObject({
      words: 'Access ended',
      tone: 'ended',
    });
    const withdrawn = grantLine('SACC-0311', 'shell', 'Shell', 'withdrawn');
    expect(memberStatus(member([]), view(withdrawn), [], false)).toMatchObject({
      words: 'Active',
    });
  });

  it('one live grant: the export’s words, the wait in its warn pill, “Given …” where it says when', () => {
    const one = (standing: GroupMember['standing'][number]) =>
      memberStatus(member([standing]), view(SHELL), [], false);
    expect(one('can-open-it')).toEqual({ words: 'Can open it', tone: 'ok', note: null });
    expect(one('waiting-for-a-licence')).toEqual({
      words: 'Waiting for a licence',
      tone: 'warn',
      note: null,
    });
    expect(one('added-after-the-group-grant')).toEqual({
      words: 'Added after the group grant',
      tone: 'neutral',
      note: 'Given 12 Oct 2026',
    });
  });

  it('“Has it individually” says when the member’s own active grant was given, if listed', () => {
    const rows = [
      individual('SACC-0300', 'shell', 'withdrawn', '2026-10-01T05:00:00Z'),
      individual('SACC-0310', 'shell', 'active', '2026-10-09T05:00:00Z'),
      individual('SACC-0330', 'fin', 'active', '2026-10-10T05:00:00Z'),
    ];
    expect(individualGrantDate(rows, 'per-0002', 'shell')).toBe('9 Oct 2026');
    expect(individualGrantDate(rows, 'per-0003', 'shell')).toBeNull();
    expect(memberStatus(member(['has-it-individually']), view(SHELL), rows, false)).toEqual({
      words: 'Has it individually',
      tone: 'neutral',
      note: 'Given 9 Oct 2026',
    });
    expect(memberStatus(member(['has-it-individually']), view(SHELL), [], false)).toEqual({
      words: 'Has it individually',
      tone: 'neutral',
      note: null,
    });
  });

  it('the undecided overlap: “Individual grant withdrawn” with the register’s words (OD-B2-01)', () => {
    const status = memberStatus(
      member([{ kind: 'policy-open', decision: 'OD-B2-01' }]),
      view(SHELL),
      [],
      false,
    );
    expect(status).toEqual({
      words: 'Individual grant withdrawn',
      tone: 'neutral',
      note: stateWords('IA-14.policy-open'),
    });
    expect(`${status.words} ${status.note}`).not.toMatch(/Can open it|Can’t open|SACC-/);
  });

  it('several live grants: the most telling standing (added after, waiting, overlap, has it, can open)', () => {
    expect(
      memberStatus(member(['can-open-it', 'waiting-for-a-licence']), view(SHELL, FIN), [], false),
    ).toMatchObject({ words: 'Waiting for a licence' });
    expect(
      memberStatus(
        member(['waiting-for-a-licence', 'added-after-the-group-grant']),
        view(SHELL, FIN),
        [],
        false,
      ),
    ).toMatchObject({ words: 'Added after the group grant' });
    expect(
      memberStatus(member(['can-open-it', 'has-it-individually']), view(SHELL, FIN), [], false),
    ).toMatchObject({ words: 'Has it individually' });
  });

  it('the standings follow the live grants only (ended and withdrawn grants have none)', () => {
    const ended = grantLine('SACC-0301', 'old', 'Composite Wall Conduction', 'access-ended');
    expect(liveGrants(view(ended, SHELL))).toEqual([SHELL]);
  });

  it('a group grant’s status: Active (Paused while paused), Access ended, Withdrawn', () => {
    expect(grantStatus(SHELL, false)).toEqual({ words: 'Active', tone: 'ok' });
    expect(grantStatus(SHELL, true)).toEqual({ words: 'Paused', tone: 'paused' });
    expect(grantStatus(grantLine('a', 'b', 'c', 'access-ended'), false)).toEqual({
      words: 'Access ended',
      tone: 'ended',
    });
    expect(grantStatus(grantLine('a', 'b', 'c', 'withdrawn'), true)).toEqual({
      words: 'Withdrawn',
      tone: 'ended',
    });
  });
});
