/**
 * Phase-2 Package 2B, Groups, on the real composition root and the sample world: IA-13 People ›
 * Groups and IA-14 Group (B2-08). Every group, count, member standing, grant word and refusal is the
 * ports' answer; the commands go out with the revision the page read and their refusals write
 * nothing. Fixtures: `after-setup` (twelve students, Sneha Reddy inactive, GRP-0012 "ME ZG523 — Sem
 * II" with seven members, nothing given), `after-flow-b` (SACC-0310 to Rahul Verma), `later-sample`
 * (the group grant SACC-0311 on 12 Oct; Rahul also has it individually, Arun Kumar waiting).
 */
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { asPersonId, faults } from '@xr/sample-platform/testing';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import { stateWords } from '@/copy/state-copy';
import type { PlatformRuntime } from '@/platform/runtime';
import {
  PAUSED_INSTITUTE_ADMIN,
  PERSON_OF_ROLE,
  renderInTab,
  SUPER_ADMIN,
  tabPlatform,
  TestNotFoundBoundary,
  testNavigation,
} from '@/test-support/workspace';

import { WorkspaceNotFound } from '../shared/pu-15-not-found/not-found';
import { forgetLastAddress } from '../shared/workspace-frame/route-focus';
import { WorkspaceLayout } from '../shared/workspace-frame/workspace-frame';
import { People } from './ia-06-people/people';
import { GroupRecord } from './ia-14-group/group-record';

afterEach(() => {
  forgetLastAddress();
});

const MEERA = PERSON_OF_ROLE.tenant_admin;
const GRP = 'GRP-0012';
const GROUP_NAME = 'ME ZG523 — Sem II';
const RAHUL = 'per-0002';
const PRIYA = 'per-0003';

function inInstitute(runtime: PlatformRuntime, path: string, page: ReactNode, search = '') {
  const navigation = testNavigation(path, search);
  const view = renderInTab(
    <WorkspaceLayout workspace="institute">
      <TestNotFoundBoundary fallback={<WorkspaceNotFound />}>{page}</TestNotFoundBoundary>
    </WorkspaceLayout>,
    { runtime, navigation },
  );
  return { navigation, view };
}

const main = () => screen.getByRole('main');
const region = (name: string) => screen.getByRole('region', { name });
const cellsOf = (row: HTMLTableRowElement) =>
  [...row.querySelectorAll('td')].map((cell) => cell.textContent);
const bodyRows = (table: HTMLElement) => [
  ...table.querySelectorAll<HTMLTableRowElement>('tbody tr'),
];

async function groupOf(runtime: PlatformRuntime, id = GRP) {
  const answer = await runtime.ports.groups.getGroup(id as never);
  if (!answer.ok) throw new Error(answer.error.kind);
  return answer.value;
}

async function groupsOf(runtime: PlatformRuntime) {
  const answer = await runtime.ports.groups.listGroups();
  if (!answer.ok) throw new Error(answer.error.kind);
  return answer.value;
}

async function studentsOf(runtime: PlatformRuntime) {
  const answer = await runtime.ports.people.listStudents({});
  if (!answer.ok) throw new Error(answer.error.kind);
  return answer.value;
}

/** The institution's grant records (each once: IA-04 lists a group grant per member). */
async function grantsOf(runtime: PlatformRuntime) {
  const answer = await runtime.ports.studentAccess.listGrants({ showWithdrawn: true });
  if (!answer.ok) throw new Error(answer.error.kind);
  const records = new Map(answer.value.map((row) => [row.grant.id, row.grant]));
  return [...records.values()].map((grant) => [grant.id, grant.state, grant.rev]);
}

/** Pauses Godavari as the Super Admin would (B7-04), from another session. */
async function pauseGodavari(sample: Parameters<typeof asPersonId>[0]) {
  const admin = asPersonId(sample, SUPER_ADMIN);
  const detail = await admin.institutions.getInstitution('godavari' as never);
  if (!detail.ok) throw new Error('godavari');
  const paused = await admin.institutions.pauseInstitution({
    institutionId: 'godavari' as never,
    reason: 'Licence review.',
    expectedRev: detail.value.institution.rev,
  });
  if (!paused.ok) throw new Error('pause');
}

// ---- IA-13 People › Groups (V3 IA-v1 IA-13; B2-08 f0 … f2) ------------------------------------

function openGroupsTab(runtime: PlatformRuntime) {
  return inInstitute(runtime, '/institute/people', <People />, '?tab=groups');
}

/** The Groups tab's count, as the People tabs say it to screen readers (", 2 groups"). */
const groupCount = () =>
  within(screen.getByRole('navigation', { name: 'People' }))
    .getByRole('link', { name: /^Groups/ })
    .querySelector('.xr-sr');

/** A record's internal reference: none in any People word (the identifier rule). */
const PEOPLE_REFERENCE = /\b(?:REQ|ACC|UPD|DTR|SUP|SUB|SACC|GRP|FMAP)-\d+/;

/**
 * No internal reference in the document's words (hidden and screen-reader-only words and the
 * announcements included), in any `aria-label`, `title` or `placeholder`, or in the tab's title.
 */
function expectNoPeopleReferences(): void {
  expect(document.body.textContent ?? '').not.toMatch(PEOPLE_REFERENCE);
  for (const element of document.body.querySelectorAll('[aria-label], [title], [placeholder]')) {
    for (const name of ['aria-label', 'title', 'placeholder']) {
      expect(element.getAttribute(name) ?? '', `${name} of ${element.tagName}`).not.toMatch(
        PEOPLE_REFERENCE,
      );
    }
  }
  expect(document.title).not.toMatch(PEOPLE_REFERENCE);
}

const GROUPS_TABLE = 'Groups at your institution';

describe('IA-13 — the groups are the port’s answer (B2-08 f0, f2)', () => {
  it('after setup: one group, its members and nothing given yet, opening IA-14', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-setup');
    openGroupsTab(runtime);
    const table = await screen.findByRole('table', { name: GROUPS_TABLE });
    expect(
      within(table)
        .getAllByRole('columnheader')
        .map((cell) => cell.textContent),
    ).toEqual(['Group', 'Members', 'Experiments given to the group']);
    const rows = bodyRows(table);
    expect(rows).toHaveLength(1);
    // Named by its name, never by its reference (the identifier rule); the third cell carries its
    // label for the phone rows.
    expect(cellsOf(rows[0]!)).toEqual([GROUP_NAME, '7 members', 'Experiments givenNone yet']);
    expect(screen.getByRole('link', { name: `Open group ${GROUP_NAME}` })).toHaveAttribute(
      'href',
      `/institute/people/groups/${GRP}`,
    );
    // The whole row is a link.
    expect(rows[0]).toHaveClass('is-link');
    // The count is the tab's, singular as the register writes it (state-copy IA-13.count-one).
    await waitFor(() => expect(groupCount()).toHaveTextContent(/^, 1 group$/));
    expect(screen.getByRole('button', { name: 'Create group' })).toHaveAttribute(
      'id',
      'groups-create',
    );
    expect(main()).toHaveTextContent(
      'Giving a group access gives it to the group’s current members, through the same Give students access steps.',
    );
    await waitFor(() => expect(document.title).toMatch(/^Groups · /));
    expectNoPeopleReferences();
  });

  it('later sample: the experiment the group grant gives, with its formats (f2)', async () => {
    const { runtime } = await tabPlatform(MEERA, 'later-sample');
    openGroupsTab(runtime);
    const table = await screen.findByRole('table', { name: GROUPS_TABLE });
    const [row] = bodyRows(table);
    expect(cellsOf(row!)[2]).toBe('Experiments givenShell-and-Tube Heat ExchangerWEBVR');
    const badges = row!.querySelector('.rk-fmts')!;
    expect(badges).toHaveAttribute('role', 'img');
    expect(badges).toHaveAccessibleName('Formats from your plan: WEB, VR');
    expect([...badges.querySelectorAll('.xr-fmt')].map((chip) => chip.textContent)).toEqual([
      'WEB',
      'VR',
    ]);
    expectNoPeopleReferences();
  });

  it('no groups yet: the count says so; “Create group” in the head and in the empty state', async () => {
    const { runtime } = await tabPlatform(PAUSED_INSTITUTE_ADMIN, 'after-setup');
    const user = userEvent.setup();
    openGroupsTab(runtime);
    expect(await screen.findByRole('heading', { level: 2, name: 'No groups yet' })).toBeVisible();
    expect(main()).toHaveTextContent(
      'A group is another way to choose who gets an experiment, for example a section or a lab batch.',
    );
    await waitFor(() => expect(groupCount()).toHaveTextContent(', 0 groups'));
    expect(screen.queryByRole('table', { name: GROUPS_TABLE })).toBeNull();
    const creates = screen.getAllByRole('button', { name: 'Create group' });
    expect(creates.map((button) => button.id)).toEqual(['groups-create', 'pg-create-empty']);
    // The empty state's button opens the same dialog, and Cancel gives focus back to it.
    await user.click(creates[1]!);
    const dialog = await screen.findByRole('dialog', { name: 'Create group' });
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(creates[1]).toHaveFocus();
  });

  it('loading is announced; a failure has “Try again”', async () => {
    const { runtime, sample } = await tabPlatform(MEERA, 'after-setup');
    const user = userEvent.setup();
    faults(sample).failNext('GroupService.listGroups');
    openGroupsTab(runtime);
    expect(await screen.findByText('Loading groups')).toHaveAttribute('role', 'status');
    const failed = await screen.findByRole('alert');
    expect(failed).toHaveTextContent('We couldn’t load the groups');
    expect(failed).toHaveTextContent('Nothing has changed. Try again.');
    await user.click(within(failed).getByRole('button', { name: 'Try again' }));
    expect(bodyRows(await screen.findByRole('table', { name: GROUPS_TABLE }))).toHaveLength(1);
  });
});

describe('IA-13 — Create group (B2-08 f1, DL-3)', () => {
  it('empty and duplicate names are refused in words; created, the flash takes focus and the list has it', async () => {
    const { runtime, sample } = await tabPlatform(MEERA, 'after-setup');
    const user = userEvent.setup();
    openGroupsTab(runtime);
    await screen.findByRole('table', { name: GROUPS_TABLE });
    const version = sample.worldVersion();

    await user.click(screen.getByRole('button', { name: 'Create group' }));
    const dialog = await screen.findByRole('dialog', { name: 'Create group' });
    const field = within(dialog).getByRole('textbox', { name: 'Group name' });
    await waitFor(() => expect(field).toHaveFocus());
    expect(field).toHaveAccessibleDescription(
      'For example a section or lab batch. You add students next.',
    );

    await user.click(within(dialog).getByRole('button', { name: 'Create group' }));
    await waitFor(() => expect(dialog).toHaveTextContent('Enter a name for the group'));
    expect(dialog.querySelector('.rk-ferr')).not.toBeNull();
    expect(field).toHaveAttribute('aria-invalid', 'true');
    await waitFor(() => expect(field).toHaveFocus());

    await user.type(field, 'me zg523 — sem ii');
    expect(field).not.toHaveAttribute('aria-invalid');
    // Enter in the name confirms.
    await user.keyboard('{Enter}');
    await waitFor(() => expect(dialog).toHaveTextContent(/A group called “.+” already exists/));
    await waitFor(() => expect(field).toHaveFocus());
    expect(sample.worldVersion()).toBe(version);
    expect(await groupsOf(runtime)).toHaveLength(1);
    expectNoPeopleReferences();

    await user.clear(field);
    await user.type(field, 'Lab batch B');
    await user.click(within(dialog).getByRole('button', { name: 'Create group' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    const flash = document.getElementById('groups-flash')!;
    expect(flash).toHaveClass('rk-notice', 'rk-notice--ok');
    expect(flash).toHaveAttribute('role', 'status');
    expect(flash).toHaveTextContent('SavedGroup “Lab batch B” created. Add students to it next.');
    await waitFor(() => expect(flash).toHaveFocus());
    await waitFor(() => expect(groupCount()).toHaveTextContent(', 2 groups'));
    const created = (await groupsOf(runtime)).find((entry) => entry.group.name === 'Lab batch B')!;
    // The flash's way on: the new group's page.
    expect(within(flash).getByRole('link', { name: 'Open the group' })).toHaveAttribute(
      'href',
      `/institute/people/groups/${created.group.id}`,
    );
    const row = bodyRows(screen.getByRole('table', { name: GROUPS_TABLE })).find((candidate) =>
      candidate.textContent?.startsWith('Lab batch B'),
    )!;
    expect(cellsOf(row)).toEqual(['Lab batch B', 'No members yet', 'Experiments givenNone yet']);
    expectNoPeopleReferences();
  });

  it('Cancel and Esc change nothing and give focus back to “Create group”', async () => {
    const { runtime, sample } = await tabPlatform(MEERA, 'after-setup');
    const user = userEvent.setup();
    openGroupsTab(runtime);
    await screen.findByRole('table', { name: GROUPS_TABLE });
    const version = sample.worldVersion();
    const open = screen.getByRole('button', { name: 'Create group' });

    await user.click(open);
    let dialog = await screen.findByRole('dialog', { name: 'Create group' });
    await user.type(within(dialog).getByRole('textbox'), 'Not now');
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(open).toHaveFocus();

    await user.click(open);
    dialog = await screen.findByRole('dialog', { name: 'Create group' });
    expect(within(dialog).getByRole('textbox')).toHaveValue('');
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(open).toHaveFocus();
    expect(sample.worldVersion()).toBe(version);
  });

  it('failed for now: the dialog and the name stay; nothing is created', async () => {
    const { runtime, sample } = await tabPlatform(MEERA, 'after-setup');
    const user = userEvent.setup();
    openGroupsTab(runtime);
    await screen.findByRole('table', { name: GROUPS_TABLE });
    await user.click(screen.getByRole('button', { name: 'Create group' }));
    const dialog = await screen.findByRole('dialog', { name: 'Create group' });
    await user.type(within(dialog).getByRole('textbox'), 'Lab batch B');
    faults(sample).failNext('GroupService.createGroup');
    await user.click(within(dialog).getByRole('button', { name: 'Create group' }));
    await waitFor(() =>
      expect(within(dialog).getByRole('button', { name: 'Create group' })).not.toHaveAttribute(
        'aria-disabled',
      ),
    );
    expect(screen.getByRole('dialog')).toBeVisible();
    expect(within(dialog).getByRole('textbox')).toHaveValue('Lab batch B');
    expect(await groupsOf(runtime)).toHaveLength(1);
  });

  it('paused meanwhile in another session: refused, nothing created, the page turns read-only', async () => {
    const { runtime, sample } = await tabPlatform(MEERA, 'after-setup');
    const user = userEvent.setup();
    openGroupsTab(runtime);
    await screen.findByRole('table', { name: GROUPS_TABLE });
    await user.click(screen.getByRole('button', { name: 'Create group' }));
    const dialog = await screen.findByRole('dialog', { name: 'Create group' });
    await user.type(within(dialog).getByRole('textbox'), 'Lab batch B');
    await pauseGodavari(sample);
    const version = sample.worldVersion();
    await user.click(within(dialog).getByRole('button', { name: 'Create group' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(sample.worldVersion()).toBe(version);
    await waitFor(() =>
      expect(main()).toHaveTextContent('Read-only while your institution’s access is paused'),
    );
    expect(screen.queryByRole('button', { name: 'Create group' })).toBeNull();
    expect(main().querySelector('.rk-notice--ok')).toBeNull();
  });

  it('paused: the list only — no “Create group”, and the read-only notice', async () => {
    const { runtime, sample } = await tabPlatform(MEERA, 'after-setup');
    await pauseGodavari(sample);
    await runtime.session.refresh();
    openGroupsTab(runtime);
    await screen.findByRole('table', { name: GROUPS_TABLE });
    await waitFor(() =>
      expect(main()).toHaveTextContent(
        'Read-only while your institution’s access is pausedYou can create and change groups again when BITS lifts the pause.',
      ),
    );
    expect(screen.queryByRole('button', { name: 'Create group' })).toBeNull();
    expect(screen.queryByRole('dialog')).toBeNull();
    expectNoPeopleReferences();
  });
});

// ---- IA-14 Group (V3 IA-v1 IA-14; B2-08 f3 … f10) ----------------------------------------------

async function openGroup(runtime: PlatformRuntime, id = GRP) {
  const rendered = inInstitute(
    runtime,
    `/institute/people/groups/${id}`,
    <GroupRecord groupId={id} />,
  );
  await screen.findByRole('heading', { level: 1, name: (await groupOf(runtime, id)).group.name });
  return rendered;
}

/** Every internal record reference the Institute Admin's pages keep out of their words. */
const GROUP_REFERENCE = /\b(?:REQ|ACC|SACC|GRP|FMAP|UPD|DTR|SUP|SUB)-\d+/;

function expectNoGroupReferences() {
  expect(main().textContent).not.toMatch(GROUP_REFERENCE);
  for (const element of main().querySelectorAll('[aria-label], [title], [placeholder]')) {
    for (const name of ['aria-label', 'title', 'placeholder']) {
      expect(element.getAttribute(name) ?? '').not.toMatch(GROUP_REFERENCE);
    }
  }
}

const membersTable = () => within(region('Members')).getByRole('table', { name: /^Members of / });

function memberRow(name: string): HTMLTableRowElement {
  const row = bodyRows(membersTable()).find((candidate) =>
    candidate.querySelector('td.ia-lt-main')?.textContent?.startsWith(name),
  );
  if (!row) throw new Error(`No member row for ${name}`);
  return row;
}

const statusOf = (name: string) => memberRow(name).cells[1]!.textContent;
const meta = () => main().querySelector('.rk-meta');
const okFlash = () => main().querySelector('.rk-notice--ok');
/** The head's "Add students", which opens and closes the panel (`#gd-add`). */
const addToggle = () => main().querySelector<HTMLButtonElement>('#gd-add')!;
const addPanel = () => screen.getByRole('region', { name: 'Add students to this group' });

describe('IA-14 — the group as it is (V3 IA-v1 IA-14)', () => {
  it('after setup: who is in it, each Active or Inactive, nothing given yet', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-setup');
    await openGroup(runtime);
    expect(main().querySelector('.rk-eyebrow')).toHaveTextContent(/^Group$/);
    const crumbs = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(crumbs).toHaveTextContent(`Groups${GROUP_NAME}`);
    expect(within(crumbs).getByRole('link', { name: 'Groups' })).toHaveAttribute(
      'href',
      '/institute/people?tab=groups',
    );
    expect(meta()).toHaveTextContent('7 membersRename');
    const give = screen.getAllByRole('link', { name: 'Give this group access' });
    expect(give).toHaveLength(2);
    for (const link of give)
      expect(link).toHaveAttribute('href', `/institute/student-access/give?group=${GRP}`);
    expect(give[0]).toHaveClass('rb-btn--primary');
    expect(addToggle()).toHaveTextContent('Add students');
    expect(addToggle()).toHaveAttribute('aria-expanded', 'false');
    expect(addToggle()).toHaveAttribute('aria-controls', 'gd-addpanel');

    const view = await groupOf(runtime);
    const rows = bodyRows(membersTable());
    expect(rows.map((row) => row.querySelector('td.ia-lt-main a')!.textContent)).toEqual(
      view.members.map((member) => member.student.fullName),
    );
    expect(cellsOf(memberRow('Rahul Verma'))).toEqual([
      'Rahul VermaGIT-2026-0418',
      'Active',
      'Remove…',
    ]);
    expect(within(memberRow('Rahul Verma')).getByRole('link')).toHaveAttribute(
      'href',
      `/institute/people/students/${RAHUL}`,
    );
    const sneha = memberRow('Sneha Reddy');
    expect(sneha.querySelector('.xr-st.rk-st-ended')).toHaveTextContent('Inactive');
    // Nothing is given yet, so the inactive line has nothing to say.
    expect(statusOf('Sneha Reddy')).toBe('Inactive');
    expect(
      screen.getByRole('button', { name: 'Remove Priya Natarajan from this group' }),
    ).toHaveTextContent('Remove…');

    const given = region('Experiments given to this group');
    expect(given).toHaveTextContent('Nothing given to this group yet');
    expect(given).toHaveTextContent(
      'Give this group an experiment, and its current members get it.',
    );
    expectNoGroupReferences();
  });

  it('later sample: each member’s standing in words, and the group’s grant', async () => {
    const { runtime } = await tabPlatform(MEERA, 'later-sample');
    await openGroup(runtime);
    expect(statusOf('Rahul Verma')).toBe('Has it individuallyGiven 9 Oct 2026');
    expect(memberRow('Arun Kumar').querySelector('.xr-st.xr-st--warn')).toHaveTextContent(
      'Waiting for a licence',
    );
    expect(statusOf('Sneha Reddy')).toBe('InactiveCan’t open experiments while inactive');
    expect(statusOf('Priya Natarajan')).toBe('Can open it');

    const given = region('Experiments given to this group');
    const list = within(given).getByRole('list', { name: `Experiments given to ${GROUP_NAME}` });
    const items = within(list).getAllByRole('listitem');
    expect(items.map((item) => item.textContent)).toEqual([
      'Shell-and-Tube Heat ExchangerME ZG523WEBVRActiveGiven 12 Oct 2026',
    ]);
    expect(
      within(items[0]!).getByRole('img', { name: 'Formats from your plan: WEB, VR' }),
    ).toBeVisible();
    expect(items[0]!.querySelector('.xr-st--ok')).toHaveTextContent('Active');
    expect(given).toHaveTextContent(
      'A group grant is recorded for the members the group has when access is given. Each member’s status is shown in Members, in words.',
    );
    // Only one “Give this group access” now: the head's.
    expect(screen.getAllByRole('link', { name: 'Give this group access' })).toHaveLength(1);
    expectNoGroupReferences();
  });

  it('the undecided overlap: Rahul’s own grant withdrawn — no can / can’t-open words (OD-B2-01)', async () => {
    const { runtime } = await tabPlatform(MEERA, 'later-sample');
    const rows = await runtime.ports.studentAccess.listGrants({ showWithdrawn: false });
    if (!rows.ok) throw new Error('grants');
    const own = rows.value.find((row) => row.grant.id === 'SACC-0310')!;
    const withdrawn = await runtime.ports.studentAccess.withdrawGrant({
      grantId: own.grant.id,
      reason: 'Given individually by mistake.',
      expectedRev: own.grant.rev,
    });
    expect(withdrawn.ok).toBe(true);
    await openGroup(runtime);
    expect(statusOf('Rahul Verma')).toBe(
      `Individual grant withdrawn${stateWords('IA-14.policy-open')}`,
    );
    expect(statusOf('Rahul Verma')).not.toMatch(/Can open it|Has it individually|Can’t open/);
    expect(statusOf('Priya Natarajan')).toBe('Can open it');
    expectNoGroupReferences();
  });

  it('an unknown group, or another institution’s, is the in-shell not-found page', async () => {
    const unknown = await tabPlatform(MEERA, 'after-setup');
    const first = inInstitute(
      unknown.runtime,
      '/institute/people/groups/GRP-9999',
      <GroupRecord groupId="GRP-9999" />,
    );
    expect(
      await screen.findByRole('heading', { level: 1, name: 'We can’t find that page' }),
    ).toBeVisible();
    first.view.unmount();

    const other = await tabPlatform(PAUSED_INSTITUTE_ADMIN, 'after-setup');
    inInstitute(other.runtime, `/institute/people/groups/${GRP}`, <GroupRecord groupId={GRP} />);
    expect(
      await screen.findByRole('heading', { level: 1, name: 'We can’t find that page' }),
    ).toBeVisible();
    expect(main()).not.toHaveTextContent(GROUP_NAME);
  });
});

describe('IA-14 — Add students (V3 IA-v1 IA-14 add panel)', () => {
  it('the panel offers the students not in the group; picked, added, the flash takes focus', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-setup');
    const user = userEvent.setup();
    await openGroup(runtime);
    const memberIds = new Set((await groupOf(runtime)).members.map((member) => member.student.id));
    const offered = (await studentsOf(runtime)).filter((row) => !memberIds.has(row.student.id));
    expect(offered).toHaveLength(5);

    await user.click(addToggle());
    expect(addToggle()).toHaveAttribute('aria-expanded', 'true');
    const heading = screen.getByRole('heading', { level: 2, name: 'Add students to this group' });
    await waitFor(() => expect(heading).toHaveFocus());
    const panel = addPanel();
    expect(panel).toHaveAttribute('id', 'gd-addpanel');
    expect(panel).toHaveTextContent(
      'Choose the students to add. Being in a group doesn’t give anyone experiments by itself.',
    );
    // Five to choose from: no search (the export offers one from nine).
    expect(within(panel).queryByRole('searchbox')).toBeNull();
    const boxes = within(panel).getAllByRole('checkbox');
    expect(boxes.map((box) => box.closest('label')!.textContent)).toEqual(
      offered.map((row) => `${row.student.fullName}${row.student.institutionStudentId}`),
    );
    expect(within(panel).queryByRole('checkbox', { name: /Rahul Verma/ })).toBeNull();
    const add = within(panel).getByRole('button', { name: 'Add students' });
    expect(add).toBeDisabled();

    await user.click(within(panel).getByRole('checkbox', { name: /Lakshmi Prasad/ }));
    expect(within(panel).getByRole('button', { name: 'Add 1 student' })).toBeEnabled();
    await user.click(within(panel).getByRole('checkbox', { name: /Vikram Joshi/ }));
    await user.click(within(panel).getByRole('button', { name: 'Add 2 students' }));

    await waitFor(() =>
      expect(okFlash()).toHaveTextContent('Saved2 students were added to the group.'),
    );
    await waitFor(() => expect(document.getElementById('ia-flash')).toHaveFocus());
    expect(screen.queryByRole('region', { name: 'Add students to this group' })).toBeNull();
    expect(meta()).toHaveTextContent('9 members');
    expect(statusOf('Vikram Joshi')).toBe('Active');
    expect((await groupOf(runtime)).members).toHaveLength(9);
  });

  it('Cancel closes the panel, gives focus back to “Add students” and adds no one', async () => {
    const { runtime, sample } = await tabPlatform(MEERA, 'after-setup');
    const user = userEvent.setup();
    await openGroup(runtime);
    const version = sample.worldVersion();
    await user.click(addToggle());
    const panel = addPanel();
    await user.click(within(panel).getByRole('checkbox', { name: /Ananya Das/ }));
    await user.click(within(panel).getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('region', { name: 'Add students to this group' })).toBeNull();
    await waitFor(() => expect(addToggle()).toHaveFocus());
    expect(addToggle()).toHaveAttribute('aria-expanded', 'false');
    expect(sample.worldVersion()).toBe(version);
  });

  it('an inactive student is offered with “Inactive”; an empty group says so; nine or more come with a search', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-setup');
    const user = userEvent.setup();
    const created = await runtime.ports.groups.createGroup({ name: 'Lab batch B' });
    if (!created.ok) throw new Error('create');
    await openGroup(runtime, created.value.id);
    expect(meta()).toHaveTextContent('No members yet');
    const members = region('Members');
    expect(
      within(members).getByRole('heading', { level: 3, name: 'No members yet' }),
    ).toBeVisible();
    expect(members).toHaveTextContent(
      'Add students to this group. Nothing is given to them until the group has experiments.',
    );
    expect(within(members).queryByRole('table')).toBeNull();
    // No members: nothing to give the group yet.
    expect(screen.queryByRole('link', { name: 'Give this group access' })).toBeNull();

    await user.click(within(members).getByRole('button', { name: 'Add students' }));
    const panel = addPanel();
    const search = within(panel).getByRole('searchbox', { name: 'Search students' });
    await waitFor(() => expect(search).toHaveFocus());
    const sneha = within(panel).getByRole('checkbox', { name: /Sneha Reddy/ });
    expect(sneha.closest('label')).toHaveTextContent(
      'Sneha ReddyGIT-2026-0352 · ME ZG523 — Sem IIInactive',
    );
    expect(within(panel).getAllByRole('checkbox')).toHaveLength(12);
    await user.type(search, 'GIT-2026-0352');
    expect(within(panel).getAllByRole('checkbox')).toHaveLength(1);
    await user.clear(search);
    await user.type(search, 'Nobody by that name');
    expect(panel).toHaveTextContent('No student matches that search.');
    await user.clear(search);
    await user.click(within(panel).getByRole('checkbox', { name: /Sneha Reddy/ }));
    await user.click(within(panel).getByRole('button', { name: 'Add 1 student' }));
    await waitFor(() =>
      expect(okFlash()).toHaveTextContent('SavedSneha Reddy was added to the group.'),
    );
    expect(statusOf('Sneha Reddy')).toBe('Inactive');
  });

  it('later sample: a student added after the group grant is only that — no promise (OD-B2-02)', async () => {
    const { runtime } = await tabPlatform(MEERA, 'later-sample');
    const user = userEvent.setup();
    await openGroup(runtime);
    await user.click(addToggle());
    expect(addPanel()).toHaveTextContent(
      'This group already has Shell-and-Tube Heat Exchanger. Students you add now are shown as “Added after the group grant”; whether that grant reaches them isn’t decided yet.',
    );
    await user.click(screen.getByRole('checkbox', { name: /Vikram Joshi/ }));
    await user.click(screen.getByRole('button', { name: 'Add 1 student' }));
    await waitFor(() =>
      expect(okFlash()).toHaveTextContent(/^SavedVikram Joshi was added to the group\.$/),
    );
    expect(statusOf('Vikram Joshi')).toBe('Added after the group grantGiven 12 Oct 2026');
    expect(meta()).toHaveTextContent('8 members');
  });
});

describe('IA-14 — Remove a member (DL-1, destructive)', () => {
  it('says only what is certain; the member leaves, every grant stays, their record stays', async () => {
    const { runtime } = await tabPlatform(MEERA, 'later-sample');
    const user = userEvent.setup();
    await openGroup(runtime);
    const grants = await grantsOf(runtime);

    await user.click(
      screen.getByRole('button', { name: 'Remove Priya Natarajan from this group' }),
    );
    const dialog = await screen.findByRole('alertdialog', {
      name: 'Remove Priya Natarajan from this group?',
    });
    expect(dialog).toHaveTextContent(
      `Priya will no longer be a member of ${GROUP_NAME}. Their student record stays in People.`,
    );
    // A destructive DL-1 opens with focus on Cancel.
    await waitFor(() =>
      expect(within(dialog).getByRole('button', { name: 'Cancel' })).toHaveFocus(),
    );
    const confirm = within(dialog).getByRole('button', { name: 'Remove from group' });
    expect(confirm).toHaveClass('ia-btn--danger');

    await user.click(confirm);
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    expect(okFlash()).toHaveTextContent(
      'Priya Natarajan was removed from the group. Their student record stays in People.',
    );
    await waitFor(() => expect(document.getElementById('ia-flash')).toHaveFocus());
    expect(meta()).toHaveTextContent('6 members');
    expect(() => memberRow('Priya Natarajan')).toThrow();
    expect(await grantsOf(runtime)).toEqual(grants);
    const record = await runtime.ports.people.getStudent(PRIYA as never);
    expect(record.ok).toBe(true);
  });

  it('Cancel changes nothing and gives focus back to the row’s “Remove…”', async () => {
    const { runtime, sample } = await tabPlatform(MEERA, 'after-setup');
    const user = userEvent.setup();
    await openGroup(runtime);
    const version = sample.worldVersion();
    const open = screen.getByRole('button', { name: 'Remove Priya Natarajan from this group' });
    await user.click(open);
    const dialog = await screen.findByRole('alertdialog');
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    expect(open).toHaveFocus();
    expect(sample.worldVersion()).toBe(version);
  });

  it('the group changed meanwhile in another session: refused as stale, nothing written, the group as it is', async () => {
    const { runtime, sample } = await tabPlatform(MEERA, 'after-setup');
    const user = userEvent.setup();
    await openGroup(runtime);
    await user.click(
      screen.getByRole('button', { name: 'Remove Priya Natarajan from this group' }),
    );
    const dialog = await screen.findByRole('alertdialog');
    const lakshmi = (await studentsOf(runtime)).find(
      (row) => row.student.fullName === 'Lakshmi Prasad',
    )!;
    const elsewhere = asPersonId(sample, MEERA);
    const before = await groupOf(runtime);
    const added = await elsewhere.groups.addMembers({
      id: before.group.id,
      studentIds: [lakshmi.student.id],
      expectedRev: before.group.rev,
    });
    expect(added.ok).toBe(true);
    const version = sample.worldVersion();
    await user.click(within(dialog).getByRole('button', { name: 'Remove from group' }));
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull());
    expect(sample.worldVersion()).toBe(version);
    expect(okFlash()).toBeNull();
    await waitFor(() => expect(meta()).toHaveTextContent('8 members'));
    expect(statusOf('Priya Natarajan')).toBe('Active');
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1, name: GROUP_NAME })).toHaveFocus(),
    );
  });
});

describe('IA-14 — Rename (DL-3)', () => {
  it('the name as it is; empty refused in words; renamed, said in the flash', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-setup');
    const user = userEvent.setup();
    await openGroup(runtime);
    const rename = screen.getByRole('button', { name: 'Rename' });
    expect(rename).toHaveClass('rb-btn--ghost');
    await user.click(rename);
    const dialog = await screen.findByRole('dialog', { name: 'Rename group' });
    const field = within(dialog).getByRole('textbox', { name: 'Group name' });
    expect(field).toHaveValue(GROUP_NAME);
    await waitFor(() => expect(field).toHaveFocus());

    await user.clear(field);
    await user.click(within(dialog).getByRole('button', { name: 'Save name' }));
    await waitFor(() => expect(dialog).toHaveTextContent('Enter a name for the group'));
    expect(field).toHaveAttribute('aria-invalid', 'true');
    await waitFor(() => expect(field).toHaveFocus());
    expect((await groupOf(runtime)).group.name).toBe(GROUP_NAME);

    await user.type(field, 'ME ZG523 — Sem II (A)');
    await user.click(within(dialog).getByRole('button', { name: 'Save name' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(okFlash()).toHaveTextContent('SavedGroup renamed.');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'ME ZG523 — Sem II (A)' }),
    ).toBeVisible();
    await waitFor(() => expect(screen.getByRole('button', { name: 'Rename' })).toHaveFocus());
    expect((await groupOf(runtime)).group.name).toBe('ME ZG523 — Sem II (A)');
  });

  it('failed for now: the dialog and the name stay; nothing changes', async () => {
    const { runtime, sample } = await tabPlatform(MEERA, 'after-setup');
    const user = userEvent.setup();
    await openGroup(runtime);
    await user.click(screen.getByRole('button', { name: 'Rename' }));
    const dialog = await screen.findByRole('dialog', { name: 'Rename group' });
    const field = within(dialog).getByRole('textbox');
    await user.clear(field);
    await user.type(field, 'Section A');
    faults(sample).failNext('GroupService.renameGroup');
    await user.click(within(dialog).getByRole('button', { name: 'Save name' }));
    await waitFor(() =>
      expect(within(dialog).getByRole('button', { name: 'Save name' })).not.toHaveAttribute(
        'aria-disabled',
      ),
    );
    expect(screen.getByRole('dialog')).toBeVisible();
    expect(field).toHaveValue('Section A');
    expect((await groupOf(runtime)).group.name).toBe(GROUP_NAME);
  });
});

describe('IA-14 while the institution is paused: read-only', () => {
  it('no Rename, no Give this group access, no Add students, no Remove…; the reads stay', async () => {
    const { runtime, sample } = await tabPlatform(MEERA, 'later-sample');
    await pauseGodavari(sample);
    await runtime.session.refresh();
    await openGroup(runtime);
    await waitFor(() =>
      expect(main()).toHaveTextContent(
        'Read-only while your institution’s access is pausedYou can change this group again when BITS lifts the pause.',
      ),
    );
    expect(screen.queryByRole('button', { name: 'Rename' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Give this group access' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Add students' })).toBeNull();
    expect(screen.queryByRole('button', { name: /^Remove / })).toBeNull();
    expect(within(membersTable()).queryAllByRole('button')).toHaveLength(0);
    // While paused members read “Paused” (an inactive member stays Inactive).
    expect(statusOf('Priya Natarajan')).toBe('Paused');
    expect(statusOf('Sneha Reddy')).toBe('InactiveCan’t open experiments while inactive');
    const given = region('Experiments given to this group');
    expect(given).toHaveTextContent('Shell-and-Tube Heat Exchanger');
    expect(given.querySelector('.xr-st--paused')).toHaveTextContent('Paused');
  });

  it('paused meanwhile in another session: Rename is refused, nothing written, the page turns read-only', async () => {
    const { runtime, sample } = await tabPlatform(MEERA, 'after-setup');
    const user = userEvent.setup();
    await openGroup(runtime);
    await user.click(screen.getByRole('button', { name: 'Rename' }));
    const dialog = await screen.findByRole('dialog', { name: 'Rename group' });
    const field = within(dialog).getByRole('textbox');
    await user.clear(field);
    await user.type(field, 'Section A');
    await pauseGodavari(sample);
    const version = sample.worldVersion();
    await user.click(within(dialog).getByRole('button', { name: 'Save name' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(sample.worldVersion()).toBe(version);
    await waitFor(() =>
      expect(main()).toHaveTextContent('Read-only while your institution’s access is paused'),
    );
    expect(screen.queryByRole('button', { name: 'Rename' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Add students' })).toBeNull();
    expect(okFlash()).toBeNull();
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1, name: GROUP_NAME })).toHaveFocus(),
    );
  });
});

describe('IA-14 — every student already in the group', () => {
  it('the panel says so and “Add students” stays disabled (state-copy IA-14.add.none)', async () => {
    const { runtime } = await tabPlatform(MEERA, 'after-setup');
    const user = userEvent.setup();
    const created = await runtime.ports.groups.createGroup({ name: 'Everyone' });
    if (!created.ok) throw new Error('create');
    const added = await runtime.ports.groups.addMembers({
      id: created.value.id,
      studentIds: (await studentsOf(runtime)).map((row) => row.student.id),
      expectedRev: created.value.rev,
    });
    expect(added.ok).toBe(true);
    await openGroup(runtime, created.value.id);
    await user.click(addToggle());
    const panel = addPanel();
    expect(panel).toHaveTextContent(stateWords('IA-14.add.none'));
    expect(panel).toHaveTextContent('Everyone in People is already in this group.');
    expect(within(panel).queryByRole('checkbox')).toBeNull();
    expect(within(panel).getByRole('button', { name: 'Add students' })).toBeDisabled();
  });
});
