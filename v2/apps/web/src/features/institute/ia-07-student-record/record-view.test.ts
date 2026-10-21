/**
 * IA-07's view helpers (V3 IA-v1 `vm07`, `stuHistory`) on records the sample world answers, and on
 * B2-06 f17's state — Rahul's individual grant withdrawn while his group's grant stands — which no
 * command reaches (withdrawing an individual grant a group grant overlaps is policy-open,
 * OD-B2-01): it is derived here from the later sample's record, as the service would answer it,
 * to prove the words. No line names a grant by its id (identifier rule).
 */
import type { StudentRecordView } from '@xr/contracts/draft';
import { asPersonId, fixtureWorld } from '@xr/sample-platform/testing';
import { describe, expect, it } from 'vitest';

import { composePlatform } from '@/platform/composition';

import { addedLine, grantLines, historyLines, type PlanFacts } from './record-view';

const PLAN: PlanFacts = { endsOn: '2027-10-07', pausedSince: '2026-10-12T05:00:00.000Z' };
const SACC = /SACC-\d+/;

async function recordAt(fixture: 'later-sample' | 'after-setup', id: string) {
  const { sample } = composePlatform({ dataSource: 'sample', world: await fixtureWorld(fixture) });
  const answer = await asPersonId(sample, 'per-0001').people.getStudent(id as never);
  if (!answer.ok) throw new Error(answer.error.kind);
  return answer.value;
}

/** B2-06 f17: SACC-0310 withdrawn on 12 Oct with its reason, SACC-0311 unchanged. */
function withdrawnOverlap(record: StudentRecordView): StudentRecordView {
  const withdrawal = {
    at: '2026-10-12T10:10:00.000Z',
    by: record.grantRows[0]!.grant.givenBy,
    reason: 'Given individually by mistake.',
  };
  return {
    ...record,
    student: {
      ...record.student,
      history: [
        ...record.student.history,
        {
          id: 'his-f17',
          event: 'access-withdrawn',
          at: withdrawal.at,
          actor: withdrawal.by,
          note: withdrawal.reason,
          visibleTo: ['tenant_admin', 'super_admin'],
          refs: [{ kind: 'SACC', id: 'SACC-0310' }],
        },
      ],
    } as StudentRecordView['student'],
    grantRows: record.grantRows.map((row) =>
      row.grant.id === 'SACC-0310'
        ? {
            ...row,
            grant: { ...row.grant, state: 'withdrawn', withdrawal },
            display: 'individual-grant-withdrawn',
          }
        : row,
    ) as StudentRecordView['grantRows'],
  };
}

describe('IA-07 view helpers', () => {
  it('later sample, Rahul: one line, “Also in” the group grant, which has no line of its own', async () => {
    const lines = grantLines(await recordAt('later-sample', 'per-0002'), PLAN);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({
      key: 'SACC-0310',
      group: null,
      date: '9 Oct 2026',
      also: { groupName: 'ME ZG523 — Sem II', notChanged: false },
      status: { words: 'Active', tone: 'ok', notes: [] },
      muted: false,
    });
  });

  it('B2-06 f17: the withdrawn individual grant keeps its line; the group grant is “not changed”', async () => {
    const record = withdrawnOverlap(await recordAt('later-sample', 'per-0002'));
    const [line] = grantLines(record, PLAN);
    expect(line).toMatchObject({
      also: { groupName: 'ME ZG523 — Sem II', notChanged: true },
      status: {
        words: 'Individual grant withdrawn',
        tone: 'neutral',
        notes: ['Withdrawn 12 Oct 2026 · “Given individually by mistake.”'],
      },
    });
    const [latest] = historyLines(record);
    expect(latest).toMatchObject({
      what: 'Individual grant withdrawn',
      when: '12 Oct 2026, 15:40 · Meera Iyer',
      note: '“Given individually by mistake.” · the group’s grant is not changed',
    });
    expect(JSON.stringify(historyLines(record))).not.toMatch(SACC);
  });

  it('later sample, Nikhil: a withdrawn grant with no group grant (state-copy IA-07.grant-words)', async () => {
    const record = await recordAt('later-sample', 'per-0012');
    const [line] = grantLines(record, PLAN);
    expect(line!.status).toEqual({
      words: 'Withdrawn',
      tone: 'ended',
      notes: [
        'Withdrawn 12 Oct 2026 · “Given by mistake — Nikhil is not in ME ZG523 this semester.”',
      ],
    });
    expect(line!.muted).toBe(true);
    expect(historyLines(record).map((entry) => entry.what)).toEqual([
      'Individual grant withdrawn',
      'Given Shell-and-Tube Heat Exchanger',
      'Added to People',
    ]);
  });

  it('later sample, Arun: through the group, with the supplied wait in words', async () => {
    const record = await recordAt('later-sample', 'per-0004');
    const [line] = grantLines(record, PLAN);
    expect(line).toMatchObject({
      group: { id: 'GRP-0012', name: 'ME ZG523 — Sem II' },
      date: '12 Oct 2026',
      status: {
        words: 'Waiting for a licence',
        tone: 'warn',
        notes: ['No licence is available for Arun on your access plan right now.'],
      },
    });
    expect(historyLines(record)[0]).toMatchObject({
      what: 'Given Shell-and-Tube Heat Exchanger through the group ME ZG523 — Sem II',
    });
  });

  it('a grant whose plan ended, or while paused: the note says so from the institution’s standing', async () => {
    const record = await recordAt('later-sample', 'per-0002');
    const as = (display: 'access-ended' | 'paused') =>
      grantLines(
        {
          ...record,
          grantRows: record.grantRows.map((row) => ({ ...row, display })),
        } as typeof record,
        PLAN,
      )[0]!.status;
    expect(as('access-ended')).toEqual({
      words: 'Access ended',
      tone: 'ended',
      notes: ['Your access plan ended on 7 Oct 2027.'],
    });
    expect(as('paused')).toEqual({
      words: 'Paused',
      tone: 'paused',
      notes: ['Paused by BITS on 12 Oct 2026.'],
    });
  });

  it('“Added”: imported by whom', async () => {
    expect(addedLine(await recordAt('after-setup', 'per-0002'))).toBe(
      '8 Oct 2026 · imported by Meera Iyer',
    );
  });
});
