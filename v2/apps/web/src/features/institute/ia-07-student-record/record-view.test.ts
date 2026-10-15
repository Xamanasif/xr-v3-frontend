/**
 * IA-07's view helpers on records the sample world answers, and on B2-06 f17's state — Rahul's
 * individual grant withdrawn while his group's grant stands — which no command reaches (withdrawing
 * an individual grant a group grant overlaps is policy-open, OD-B2-01): it is derived here from the
 * later sample's record, as the service would answer it, to prove the drawn words.
 */
import type { StudentRecordView } from '@xr/contracts/draft';
import { asPersonId, fixtureWorld } from '@xr/sample-platform/testing';
import { describe, expect, it } from 'vitest';

import { composePlatform } from '@/platform/composition';

import { addedWords, grantLines, historyLines } from './record-view';

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
    const lines = grantLines(await recordAt('later-sample', 'per-0002'));
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({
      grantId: 'SACC-0310',
      how: { kind: 'individual', date: '9 Oct 2026' },
      also: { groupName: 'ME ZG523 — Sem II', grantId: 'SACC-0311', notChanged: false },
      status: { words: 'Active', tone: 'ok', line: null },
    });
  });

  it('B2-06 f17: the withdrawn individual grant keeps its line; the group grant is “not changed”', async () => {
    const record = withdrawnOverlap(await recordAt('later-sample', 'per-0002'));
    const [line] = grantLines(record);
    expect(line).toMatchObject({
      also: { grantId: 'SACC-0311', notChanged: true },
      status: {
        words: 'Individual grant withdrawn',
        tone: 'off',
        line: 'Withdrawn 12 Oct 2026 · “Given individually by mistake.”',
      },
    });
    const [latest] = historyLines(record);
    expect(latest).toMatchObject({
      what: 'Individual grant SACC-0310 withdrawn',
      when: '12 Oct 2026, 15:40 · Meera Iyer',
      note: '“Given individually by mistake.” · group grant SACC-0311 not changed',
    });
  });

  it('later sample, Nikhil: a withdrawn grant with no group grant (state-copy IA-07.grant-words)', async () => {
    const record = await recordAt('later-sample', 'per-0012');
    expect(grantLines(record)[0]!.status).toEqual({
      words: 'Withdrawn',
      tone: 'off',
      line: 'Withdrawn 12 Oct 2026 · “Given by mistake — Nikhil is not in ME ZG523 this semester.”',
    });
    expect(historyLines(record).map((line) => line.what)).toEqual([
      'Individual grant SACC-0312 withdrawn',
      'Given Shell-and-Tube Heat Exchanger',
      'Added to People',
    ]);
  });

  it('“Added”: imported by whom, as B2-06 f8 draws it', async () => {
    expect(addedWords(await recordAt('after-setup', 'per-0002'))).toBe(
      '8 Oct 2026 · imported by Meera Iyer',
    );
  });
});
