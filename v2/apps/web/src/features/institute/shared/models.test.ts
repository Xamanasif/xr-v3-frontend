/**
 * The shared Institute Admin presentation models on the records the sample world answers (the
 * later sample: Meera Iyer's Godavari, access plan with Shell-and-Tube Heat Exchanger, Rahul's
 * individual grant "Also in" the group grant of ME ZG523 — Sem II, Arun waiting for a licence,
 * Sneha inactive), and their tones and words against the export's own tables (`instSt`, `planSt`,
 * `RST`, `PST`). No word they produce names a record by its internal reference.
 */
import type { ContentAccessRow, GrantRow } from '@xr/contracts/draft';
import { describe, expect, it, vi } from 'vitest';

import { iaExport } from '@/test-support/boards';
import { PERSON_OF_ROLE, tabPlatform } from '@/test-support/workspace';

import { actorName } from './actor-name';
import { formatCellsView } from './format-cells';
import { formatCodes } from './format-codes';
import { grantFormats, grantRowView, planGrantRowView } from './grant-view';
import {
  directoryStatusView,
  grantStatusView,
  institutionStatusView,
  planStatusView,
} from './status-model';
import { countBy, filterChip, visibleSegments } from './toolbar-model';

const SCRIPT = (() => {
  const main = iaExport('Main.dc.html');
  return main.slice(main.indexOf('<script type="text/x-dc"'));
})();
const INTERNAL_REFERENCE = /\b(?:REQ|ACC|UPD|DTR|SUP|SUB|SACC|GRP|FMAP)-\d+/;

/** A status table of the export's script (`{ key: ['tone', 'Words'], … }`), read as JSON. */
function exportTable(source: string): Record<string, readonly [string, string]> {
  return JSON.parse(source.replace(/(\w+):/g, '"$1":').replace(/'/g, '"'));
}

function scriptTable(pattern: RegExp): Record<string, readonly [string, string]> {
  const match = pattern.exec(SCRIPT);
  if (!match) throw new Error(`the export has no ${pattern}`);
  return exportTable(match[1]!);
}

/** The export's `plain` is the kit's `neutral` (`stCls`: no tone class). */
const tone = (exported: string) => (exported === 'plain' ? 'neutral' : exported);

async function later() {
  const { runtime } = await tabPlatform(PERSON_OF_ROLE.tenant_admin, 'later-sample');
  const value = async <T>(
    answer: Promise<{ ok: true; value: T } | { ok: false; error: unknown }>,
  ) => {
    const result = await answer;
    if (!result.ok) throw new Error(JSON.stringify(result.error));
    return result.value;
  };
  const grants = await value(runtime.ports.studentAccess.listGrants({ showWithdrawn: true }));
  const groups = await value(runtime.ports.groups.listGroups());
  const content = await value(runtime.ports.institutions.listContentAccess());
  const planId = content[0]!.plans[0]!.plan.id;
  const plan = await value(runtime.ports.institutions.getAccessPlan(planId as never));
  return { grants, groups, content, plan };
}

describe('the status models are the export’s tones and the role’s words', () => {
  it('a grant (`RST`): every status the reads answer', () => {
    const RST = scriptTable(/static get RST\(\) \{\s*return (\{[^;]*\});/);
    const keyOf = {
      active: 'active',
      'waiting-for-a-licence': 'waiting',
      'student-inactive': 'inactive',
      withdrawn: 'withdrawn',
      'individual-grant-withdrawn': 'indwd',
      'access-ended': 'ended',
      paused: 'paused',
    } as const;
    for (const [display, key] of Object.entries(keyOf)) {
      const [exportedTone, words] = RST[key]!;
      expect(grantStatusView(display as keyof typeof keyOf)).toEqual({
        tone: tone(exportedTone),
        words,
      });
    }
    // "Removed from the group" is the export's; no read answers it, so no status is modelled for it.
    expect(Object.keys(RST).filter((key) => !Object.values(keyOf).includes(key as never))).toEqual([
      'removed',
    ]);
  });

  it('a student in People (`PST`): the three statuses the directory answers', () => {
    const PST = scriptTable(/static get PST\(\) \{\s*return (\{[^;]*\});/);
    expect(directoryStatusView('access-active')).toEqual({ tone: 'ok', words: PST.access![1] });
    expect(directoryStatusView('no-access-yet')).toEqual({
      tone: tone(PST.none![0]),
      words: PST.none![1],
    });
    expect(directoryStatusView('inactive')).toEqual({
      tone: tone(PST.inactive![0]),
      words: PST.inactive![1],
    });
  });

  it('a plan (`planSt`) and the institution (`instSt`)', () => {
    const plan = scriptTable(/planSt\(pst\) \{ return (\{[^}]*\})\[pst\]/);
    expect(planStatusView('access-active')).toEqual({ tone: 'ok', words: plan.active![1] });
    expect(planStatusView('ending-soon')).toEqual({ tone: 'warn', words: plan.ending![1] });
    expect(planStatusView('paused')).toEqual({ tone: 'paused', words: plan.paused![1] });
    expect(planStatusView('access-ended')).toEqual({ tone: 'ended', words: plan.ended![1] });
    const inst = scriptTable(/instSt\(pst\) \{ return (\{[^}]*\})\[pst\]/);
    expect(institutionStatusView('access-active')).toEqual({ tone: 'ok', words: inst.active![1] });
    expect(institutionStatusView('ending-soon')).toEqual({ tone: 'warn', words: inst.ending![1] });
    expect(institutionStatusView('access-paused')).toEqual({
      tone: 'paused',
      words: inst.paused![1],
    });
    expect(institutionStatusView('access-ended')).toEqual({ tone: 'ended', words: inst.ended![1] });
    expect(SCRIPT).toContain(
      `|| ['warn', '${institutionStatusView('approved-payment-required').words}']`,
    );
  });
});

describe('grant rows (`saRow`) on the sample world’s records', () => {
  it('Student access (`listGrants`): individually or through the named group, the date, the status', async () => {
    const { grants, groups } = await later();
    const names = new Map(groups.map((entry) => [entry.group.id as string, entry.group.name]));
    const views = grants.map((row: GrantRow) => grantRowView(row, names));
    const rahul = views.filter((view) => view.studentName === 'Rahul Verma');
    expect(rahul.map((view) => [view.how, view.date, view.status, view.muted])).toEqual([
      [
        { kind: 'individual', words: 'Individually' },
        '9 Oct 2026',
        { tone: 'ok', words: 'Active' },
        false,
      ],
      [
        {
          kind: 'group',
          words: 'Group: ME ZG523 — Sem II',
          href: '/institute/people/groups/GRP-0012',
        },
        '12 Oct 2026',
        { tone: 'ok', words: 'Active' },
        false,
      ],
    ]);
    expect(rahul[0]).toMatchObject({
      studentHref: '/institute/people/students/per-0002',
      institutionStudentId: expect.stringMatching(/^[A-Z]+-\d{4}-\d{4}$/),
    });
    const statuses = new Map(views.map((view) => [view.studentName, view.status.words]));
    expect(statuses.get('Arun Kumar')).toBe('Waiting for a licence');
    expect(statuses.get('Sneha Reddy')).toBe('Student inactive');
    for (const view of views) {
      expect(INTERNAL_REFERENCE.test(`${view.how.words} ${view.date} ${view.status.words}`)).toBe(
        false,
      );
    }
  });

  it('a group it cannot name reads “Group: ” as the export does, never the reference', async () => {
    const { grants } = await later();
    const group = grants.find((row) => row.grant.target.kind === 'group')!;
    expect(grantRowView(group, new Map()).how).toMatchObject({ kind: 'group', words: 'Group: ' });
  });

  it('the access plan’s “Students you’ve given access” (`getAccessPlan` `givenTo`)', async () => {
    const { plan } = await later();
    const views = plan.givenTo.map(planGrantRowView);
    expect(views.length).toBeGreaterThan(0);
    const rahul = views.filter((view) => view.studentName === 'Rahul Verma');
    expect(rahul.map((view) => view.how.words).sort()).toEqual([
      'Group: ME ZG523 — Sem II',
      'Individually',
    ]);
    for (const view of views) {
      expect(view.studentHref).toBe(`/institute/people/students/${view.studentId}`);
      expect(view.date).toMatch(/^\d{1,2} [A-Z][a-z]{2} \d{4}$/);
      expect(INTERNAL_REFERENCE.test(`${view.how.words} ${view.status.words}`)).toBe(false);
    }
  });

  it('a row’s formats from the plan, WEB · AR · VR · MR, and their name', async () => {
    const { grants } = await later();
    expect(grantFormats(grants[0]!.formats)).toEqual({
      codes: ['WEB', 'VR'],
      label: 'Formats from your plan: WEB, VR',
    });
    expect(formatCodes(['mr', 'web', 'ar'])).toEqual(['WEB', 'AR', 'MR']);
  });
});

describe('format cells (`fmCells`, `fmBadges`) on Content access', () => {
  it('in the plan, published but not in it, not published — with the words and the key line', async () => {
    const { content } = await later();
    const row: ContentAccessRow = content[0]!;
    const item = row.items[0]!;
    const view = formatCellsView(
      'Shell-and-Tube Heat Exchanger',
      item.formats,
      row.publishedNotInPlan,
    );
    expect(view.label).toBe('Formats of Shell-and-Tube Heat Exchanger');
    expect(view.cells).toEqual([
      { format: 'WEB', state: 'on', words: 'WEB, Browser: In your plan' },
      { format: 'AR', state: 'pub', words: 'AR, Augmented reality: Published, not in your plan' },
      { format: 'VR', state: 'on', words: 'VR, Virtual reality: In your plan' },
      { format: 'MR', state: 'none', words: 'MR, Mixed reality: Not published' },
    ]);
    expect(view.key).toBe(
      'WEB and VR in your plan · AR published, not in your plan · MR not published',
    );
  });

  it('a student’s grant words its formats as given', () => {
    const view = formatCellsView('Venturi Meter', ['web'], [], { given: true });
    expect(view.cells.map((cell) => cell.words)).toEqual([
      'WEB, Browser: Given with this grant',
      'AR, Augmented reality: Not published',
      'VR, Virtual reality: Not published',
      'MR, Mixed reality: Not published',
    ]);
    expect(view.key).toBe('WEB in your plan · AR, VR and MR not published');
  });
});

describe('the toolbar rules (`vm04`, `vm06`)', () => {
  it('the first segment always, then the statuses with rows or the chosen one, in order', async () => {
    const { grants } = await later();
    const counts = countBy(grants, (row) => row.display);
    const rest = [
      { key: 'active', label: 'Active' },
      { key: 'waiting-for-a-licence', label: 'Waiting for a licence' },
      { key: 'paused', label: 'Paused' },
      { key: 'student-inactive', label: 'Student inactive' },
    ] as const;
    const first = { key: 'current', label: 'Current', count: grants.length } as const;
    const shown = visibleSegments<string>(first, rest, counts, 'current');
    expect(shown.map((segment) => segment.key)).toEqual([
      'current',
      'active',
      'waiting-for-a-licence',
      'student-inactive',
    ]);
    expect(shown.find((segment) => segment.key === 'waiting-for-a-licence')!.count).toBe(
      grants.filter((row) => row.display === 'waiting-for-a-licence').length,
    );
    // A status chosen before its last row went still shows, with 0.
    expect(
      visibleSegments<string>(first, rest, counts, 'paused').find(
        (segment) => segment.key === 'paused',
      ),
    ).toEqual({ key: 'paused', label: 'Paused', count: 0 });
    expect(SCRIPT).toContain('.filter(k => cnt[k] || seg === k)');
  });

  it('a chip carries its remove button’s name and where focus returns', () => {
    const onRemove = vi.fn();
    expect(filterChip('q', 'Search: “rahul”', onRemove, 'pp-q')).toEqual({
      key: 'q',
      label: 'Search: “rahul”',
      removeLabel: 'Remove filter Search: “rahul”',
      onRemove,
      focusId: 'pp-q',
    });
  });
});

describe('the frozen helpers', () => {
  it('names the actor of a record’s history', async () => {
    const { plan } = await later();
    const activated = plan.plan.history.find((entry) => entry.event === 'activated')!;
    expect(actorName(activated.actor)).toBeNull();
    const given = plan.plan.history.find((entry) => entry.event === 'access-given')!;
    expect(actorName(given.actor)).toBe('Meera Iyer');
  });
});
