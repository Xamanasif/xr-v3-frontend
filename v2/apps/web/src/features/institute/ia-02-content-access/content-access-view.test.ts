/**
 * IA-02's view rules (IA-v1 `vm02core`) on the port's own answers: one strip per plan, then the
 * course groups and rows, the Search (experiment, course code, course name, your code) and Status
 * filters (the plan's status; a paused plan shows under "All statuses" only), and whether "Give
 * students access" is drawn.
 */
import type { ContentAccessRow } from '@xr/contracts/draft';
import { describe, expect, it } from 'vitest';

import { PAUSED_INSTITUTE_ADMIN, PERSON_OF_ROLE, tabPlatform } from '@/test-support/workspace';

import { contentAccessView } from './content-access-view';

async function rowsOf(
  person: string,
  fixture: Parameters<typeof tabPlatform>[1],
): Promise<readonly ContentAccessRow[]> {
  const { runtime } = await tabPlatform(person, fixture);
  const answer = await runtime.ports.institutions.listContentAccess();
  if (!answer.ok) throw new Error(answer.error.kind);
  return answer.value;
}

describe('contentAccessView', () => {
  it('lists the plans newest first, then groups the experiments by course', async () => {
    const rows = await rowsOf(PERSON_OF_ROLE.tenant_admin, 'after-flow-b');
    const view = contentAccessView(rows, { search: '', status: 'all' });
    expect(view.plans.map((standing) => standing.plan.id)).toEqual(['ACC-0107']);
    expect(view.groups.map((group) => group.course.platformCode)).toEqual(['ME ZG523']);
    expect(
      view.groups[0]!.rows.map((row) => [row.name, row.status, row.givable, row.studentsGiven]),
    ).toEqual([['Shell-and-Tube Heat Exchanger', 'access-active', true, 1]]);
    expect(view).toMatchObject({ total: 1, shown: 1, courses: 1, anyGivable: true });
  });

  it('searches the experiment, the course code, the course name and your code, ignoring case', async () => {
    const rows = await rowsOf(PERSON_OF_ROLE.tenant_admin, 'after-flow-b');
    for (const search of ['shell', 'ZG523', 'thermodynamics', '  HEAT  ', 'mec-523']) {
      expect(contentAccessView(rows, { search, status: 'all' }).shown).toBe(1);
    }
    const none = contentAccessView(rows, { search: 'Distillation', status: 'all' });
    expect(none).toMatchObject({ groups: [], shown: 0, total: 1 });
    // The strips stay whatever the filters.
    expect(none.plans).toHaveLength(1);
    expect(contentAccessView(rows, { search: '', status: 'active' }).shown).toBe(1);
    expect(contentAccessView(rows, { search: '', status: 'ending' }).shown).toBe(0);
    expect(contentAccessView(rows, { search: '', status: 'ended' }).shown).toBe(0);
  });

  it('a paused plan: no Give access, and only under “All statuses”', async () => {
    const rows = await rowsOf(PAUSED_INSTITUTE_ADMIN, 'after-flow-b');
    const all = contentAccessView(rows, { search: '', status: 'all' });
    expect(all.plans[0]!.status).toBe('paused');
    expect(all.anyGivable).toBe(false);
    expect(all.groups[0]!.rows.every((row) => !row.givable)).toBe(true);
    expect(contentAccessView(rows, { search: '', status: 'active' }).shown).toBe(0);
  });
});
