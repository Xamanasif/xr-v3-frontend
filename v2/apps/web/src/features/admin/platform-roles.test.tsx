/**
 * The Super Admin's Platform roles in the owner-approved V3 design (design/v3-refined-b/roles/SA-v1,
 * `sa-views-d.js` `V.roles`, `V.holder`): SA-16 Platform roles and SA-17 Role holder, on the real
 * composition root and the sample world after Flow E (23 Oct 2026: Dr K. Iyer registered with no
 * scope, SUB-0085 stuck). The lists and the holder are the service's answers; Register, Assign,
 * Withdraw and Restore are its commands, each with its revision; field errors are the contract's
 * words; a refusal writes nothing. A scope change reaches the holder's own workspace at once (the
 * reviewer's queue), and nothing is sent (T-11). No internal reference is shown.
 */
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { PlatformRoleHolder } from '@xr/domain';
import { asPersonId, faults, fixtureWorld, worldOf } from '@xr/sample-platform/testing';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it, onTestFinished, vi } from 'vitest';

import { expandTarget } from '@/nav/link-targets';
import { P6_PLATFORM_ROLES_LINK_TARGETS } from '@/nav/link-targets-p6/platform-roles';
import { resolveAddress } from '@/nav/routes';
import type { PlatformRuntime } from '@/platform/runtime';
import type { HolderView } from '@/queries/platform-roles-forms';
import {
  renderInTab,
  SUPER_ADMIN,
  tabPlatform,
  TestNotFoundBoundary,
  testNavigation,
  worldPlatform,
} from '@/test-support/workspace';

import { WorkspaceNotFound } from '../shared/pu-15-not-found/not-found';
import { forgetLastAddress } from '../shared/workspace-frame/route-focus';
import { WorkspaceLayout } from '../shared/workspace-frame/workspace-frame';
import { PlatformRoles } from './sa-16-roles/platform-roles';
import { arrivalFor, forgetArrival, noteArrival } from './sa-17-role-holder/arrival';
import { effectWords, historyLines, scopeNamings } from './sa-17-role-holder/holder-view';
import { RoleHolder } from './sa-17-role-holder/role-holder';

afterEach(() => {
  forgetLastAddress();
});

const ROLES = '/admin/roles';
const IYER = 'role-0001';
const MENON = 'role-a-menon';
const ANIL = 'role-anil-shetty';
const RITU = 'role-ritu-sharma';
const KAVYA = 'role-kavya-nair';
const MENON_PERSON = 'per-a-menon';

function inAdmin(runtime: PlatformRuntime, path: string, page: ReactNode, search = '') {
  const navigation = testNavigation(path, search);
  renderInTab(
    <WorkspaceLayout workspace="admin">
      <TestNotFoundBoundary fallback={<WorkspaceNotFound />}>{page}</TestNotFoundBoundary>
    </WorkspaceLayout>,
    { runtime, navigation },
  );
  return navigation;
}

const showRoles = (runtime: PlatformRuntime, search = '') =>
  inAdmin(runtime, ROLES, <PlatformRoles />, search);
const showHolder = (runtime: PlatformRuntime, id: string) =>
  inAdmin(runtime, `${ROLES}/${id}`, <RoleHolder holderId={id} />);

const main = () => screen.getByRole('main');
const heading = (name: string) =>
  screen.findByRole('heading', { level: 1, name }, { timeout: 5000 });
const flash = () => text(main().querySelector('#role-holder-flash'));
const panel = () => screen.getByRole('complementary', { name: 'Assign scope' });
const region = (name: string) => screen.getByRole('region', { name });
const assignButton = () => within(panel()).getByRole('button', { name: 'Assign scope' });

/** An element's words, its text nodes joined by spaces (as a screen reader reads them). */
function text(element: Element | null): string {
  if (!element) return '';
  const parts: string[] = [];
  const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    parts.push(node.textContent ?? '');
  }
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}

const rows = () =>
  [...main().querySelectorAll('table.rk-table tbody tr')].map((row) =>
    [...row.querySelectorAll('td')].map((cell) => text(cell)),
  );
/** The scope rows of a section (“Can act on”, “Withdrawn”): their words, without the action. */
const scopeRows = (section: 'Can act on' | 'Withdrawn') =>
  [...region(section).querySelectorAll('ul.sa-scopes > li > .sa-scope-row > div')].map((row) =>
    text(row),
  );
const historyWhat = () =>
  [...main().querySelectorAll('ol.rk-tl > li .rk-tl-w')].map((node) => text(node));
const historyNotes = () =>
  [...main().querySelectorAll('ol.rk-tl > li')].map((node) => text(node.querySelector('.rk-tl-n')));
const effect = () => text(region('Can act on').querySelector('p.rk-next'));

/** The Super Admin rule: no internal reference in the page's words or accessible names. */
function expectNoInternalReferences() {
  const INTERNAL = /\b(REQ|ACC|UPD|DTR|SUP|SUB)-\d/;
  expect(main().textContent).not.toMatch(INTERNAL);
  for (const element of main().querySelectorAll('[aria-label], [title]')) {
    expect(element.getAttribute('aria-label') ?? '').not.toMatch(INTERNAL);
    expect(element.getAttribute('title') ?? '').not.toMatch(INTERNAL);
  }
}

async function holderOf(sample: unknown, id: string): Promise<HolderView> {
  const answer = await asPersonId(sample as never, SUPER_ADMIN).platformRoles.getHolder(
    id as never,
  );
  if (!answer.ok) throw new Error(answer.error.kind);
  return answer.value;
}

async function queueOf(sample: unknown, personId: string): Promise<string[]> {
  const answer = await asPersonId(sample as never, personId).production.getReviewQueue({});
  if (!answer.ok) throw new Error(answer.error.kind);
  return answer.value.map((item) => `${item.ref.id} ${item.courseCode ?? ''}`.trim());
}

describe('SA-16 Platform roles (SA-v1 `V.roles`)', () => {
  it('Vendors is the bare address: the head, the page tabs with counts, the rows, the foot note', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    const navigation = showRoles(runtime);
    const title = await heading('Platform roles');
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(title).toHaveAttribute('tabindex', '-1');
    expect(text(main().querySelector('.rk-head .rk-sub'))).toBe(
      'Who can produce, review and publish content, and for what.',
    );
    expect(screen.getByRole('button', { name: 'Register a Vendor' })).toHaveClass(
      'rb-btn',
      'rb-btn--navy',
    );
    const tabs = screen.getByRole('navigation', { name: 'Platform roles' });
    expect(tabs).toHaveClass('rk-tabs', 'sa-tabs');
    await waitFor(() =>
      expect(
        within(tabs)
          .getAllByRole('link')
          .map((tab) => [text(tab), tab.getAttribute('href'), tab.getAttribute('aria-current')]),
      ).toEqual([
        ['Vendors 2', ROLES, 'page'],
        ['Reviewers 2', `${ROLES}?tab=reviewers`, null],
        ['Content Managers 1', `${ROLES}?tab=content-managers`, null],
      ]),
    );
    expect(tabs.querySelectorAll('.sa-tabn')).toHaveLength(3);
    const surface = region('Vendors');
    expect(surface).toHaveClass('rk-surface');
    await waitFor(() => expect(rows()).toHaveLength(2));
    expect(rows()).toEqual([
      [
        'Anil Shetty Northline Simulation Studio',
        'ME ZG523 1 scope withdrawn',
        'anil.shetty@northline.example',
        'Registered 4 Jul 2026',
        'Has scope',
      ],
      [
        'Ritu Sharma Meridian Virtual Labs',
        'CHE ZG513 EEE ZC341',
        'ritu.sharma@meridian.example',
        'Registered 1 Aug 2026',
        'Has scope',
      ],
    ]);
    expect([...surface.querySelectorAll('thead th')].map((cell) => text(cell))).toEqual([
      'Role holder',
      'Can act on',
      'Work e-mail',
      'Registered',
      'Scope',
    ]);
    expect(text(surface.querySelector('caption'))).toBe('Vendors and what they can act on');
    // Course scopes are code chips; each row opens its holder, named by content.
    expect(surface.querySelectorAll('tbody tr:nth-child(2) .rk-code')).toHaveLength(2);
    expect(screen.getByRole('link', { name: 'Anil Shetty, Vendor. Open' })).toHaveAttribute(
      'href',
      `${ROLES}/${ANIL}`,
    );
    // Nobody without a scope on this tab: no notice.
    expect(main().querySelector('.rk-notice--warn')).toBeNull();
    expect(text(surface.querySelector('p.rk-ca-foot'))).toBe(
      'Registering doesn’t send an invitation. How a registered person first signs in is still open.',
    );
    expect(main().textContent).not.toMatch(/T-11/);
    expectNoInternalReferences();
    expect(navigation.replace).not.toHaveBeenCalled();
  });

  it('Reviewers: the no-scope notice names the holder and opens them; the row is flagged No scope', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    showRoles(runtime, '?tab=reviewers');
    await heading('Platform roles');
    const tabs = screen.getByRole('navigation', { name: 'Platform roles' });
    expect(within(tabs).getByRole('link', { name: /^Reviewers/ })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(region('Reviewers')).toBeVisible();
    await waitFor(() => expect(rows()).toHaveLength(2));
    expect(rows()).toEqual([
      [
        'Prof. A. Menon BITS Pilani · WILP',
        'ME ZG523 MEL ZG512 CHE ZG513 1 scope withdrawn',
        'a.menon@wilp.example',
        'Registered 2 Jun 2026',
        'Has scope',
      ],
      [
        'Dr K. Iyer BITS Pilani · WILP',
        'Nothing yet',
        'k.iyer@wilp.example',
        'Registered 20 Oct 2026',
        'No scope',
      ],
    ]);
    expect(main().querySelector('tbody tr:nth-child(2) .xr-st.xr-st--warn')).toHaveTextContent(
      'No scope',
    );
    expect(
      screen.getByRole('link', { name: 'Dr K. Iyer, Academic Reviewer, no scope. Open' }),
    ).toHaveAttribute('href', `${ROLES}/${IYER}`);
    const notice = main().querySelector('.rk-notice.rk-notice--warn');
    expect(text(notice)).toBe(
      'Dr K. Iyer has no scope yet Their review queue is empty. Nothing is in scope, and submissions for courses nobody reviews get stuck. Assign scope',
    );
    expect(
      within(notice as HTMLElement).getByRole('link', { name: 'Assign scope' }),
    ).toHaveAttribute('href', `${ROLES}/${IYER}`);
    expect(screen.getByRole('button', { name: 'Register a Reviewer' })).toBeVisible();
  });

  it('Content Managers: one holder with All experiments', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    showRoles(runtime, '?tab=content-managers');
    await heading('Platform roles');
    expect(region('Content Managers')).toBeVisible();
    await waitFor(() =>
      expect(rows()).toEqual([
        [
          'Kavya Nair BITS Pilani · WILP',
          'All experiments',
          'kavya.nair@wilp.example',
          'Registered 2 Jun 2026',
          'Has scope',
        ],
      ]),
    );
    expect(screen.getByRole('button', { name: 'Register a Content Manager' })).toBeVisible();
  });

  it('`?tab=vendors` and an unknown tab are replaced by the bare address (D-11)', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    const navigation = showRoles(runtime, '?tab=vendors');
    await heading('Platform roles');
    await waitFor(() => expect(navigation.replace).toHaveBeenCalledWith(ROLES));
    expect(region('Vendors')).toBeVisible();
  });

  it('an unknown tab shows Vendors and is replaced too', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    const navigation = showRoles(runtime, '?tab=institute-admins');
    await heading('Platform roles');
    await waitFor(() => expect(navigation.replace).toHaveBeenCalledWith(ROLES));
    expect(region('Vendors')).toBeVisible();
  });

  it('loading: the loading line over skeleton rows; then the rows', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    // The service answers only when the test lets it.
    let release: () => void = () => undefined;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const roles = runtime.ports.platformRoles;
    const listHolders = roles.listHolders.bind(roles);
    const spy = vi.spyOn(roles, 'listHolders').mockImplementation(async (filter) => {
      await gate;
      return listHolders(filter);
    });
    showRoles(runtime);
    expect(await screen.findByText('Loading role holders…')).toHaveClass('rk-loading-msg');
    expect(region('Vendors')).toHaveAttribute('aria-busy', 'true');
    expect(main().querySelectorAll('.rk-skel-row')).toHaveLength(3);
    release();
    await waitFor(() => expect(rows()).toHaveLength(2));
    expect(screen.queryByText('Loading role holders…')).toBeNull();
    expect(region('Vendors')).not.toHaveAttribute('aria-busy');
    spy.mockRestore();
  });

  it('failed for now: the failed state; Try again reads again', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    faults(sample).failNext('PlatformRoleService.listHolders' as never);
    showRoles(runtime);
    const failed = await screen.findByText('We couldn’t load the role holders');
    expect(failed.closest('.rk-state')).toHaveAttribute('role', 'alert');
    expect(screen.getByText('Nothing has changed. Try again.')).toBeVisible();
    // The foot note stays.
    expect(main().querySelector('p.rk-ca-foot')).not.toBeNull();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(rows()).toHaveLength(2));
  });

  it('a tab with nobody in it: the empty state, Register stays', async () => {
    // A world with no Content Manager registered (the fixture after Flow E, without Kavya Nair).
    const world = await fixtureWorld('after-flow-e');
    const { runtime } = await worldPlatform(SUPER_ADMIN, {
      ...world,
      records: {
        ...world.records,
        holders: Object.fromEntries(
          Object.entries(world.records.holders).filter(
            ([, holder]) => (holder as PlatformRoleHolder).role !== 'content_manager',
          ),
        ),
      },
    });
    showRoles(runtime, '?tab=content-managers');
    await heading('Platform roles');
    const empty = await screen.findByText('Nobody is registered in this role yet');
    expect(empty.closest('.rk-state')).not.toBeNull();
    expect(screen.getByText('Register someone, then assign what they can act on.')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Register a Content Manager' })).toBeVisible();
    expect(main().querySelector('.rk-notice--warn')).toBeNull();
    expect(main().querySelector('table')).toBeNull();
    const tabs = screen.getByRole('navigation', { name: 'Platform roles' });
    await waitFor(() =>
      expect(within(tabs).getByRole('link', { name: /^Content Managers/ })).toHaveTextContent(
        'Content Managers 0',
      ),
    );
  });
});

describe('SA-16 Register a <role> (SA-v1 `SA.DLG.register`)', () => {
  it('all three required at once; the e-mail format; an e-mail already in use is refused with SA-16’s words (PC-49)', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    showRoles(runtime);
    await heading('Platform roles');
    await user.click(await screen.findByRole('button', { name: 'Register a Vendor' }));
    const dialog = await screen.findByRole('dialog', { name: 'Register a Vendor' });
    expect(dialog).toHaveClass('rk-dialog');
    expect(dialog).toHaveAccessibleDescription(
      'Registering doesn’t send an invitation. You assign what they can act on next.',
    );
    expect(within(dialog).getByRole('textbox', { name: 'Name' })).toHaveFocus();
    await user.click(within(dialog).getByRole('button', { name: 'Register' }));
    expect([...dialog.querySelectorAll('.rk-ferr')].map((error) => text(error))).toEqual([
      'Enter the person’s name',
      'Enter a work e-mail address',
      'Enter the organisation',
    ]);
    expect(within(dialog).getByRole('textbox', { name: 'Name' })).toHaveFocus();
    expect(within(dialog).getByRole('textbox', { name: 'Name' })).toHaveAttribute(
      'aria-invalid',
      'true',
    );
    // Editing a field clears its error.
    await user.type(within(dialog).getByRole('textbox', { name: 'Name' }), 'Kavya Nair');
    expect(dialog.querySelectorAll('.rk-ferr')).toHaveLength(2);
    await user.type(within(dialog).getByRole('textbox', { name: 'Work e-mail' }), 'kavya.nair');
    await user.type(
      within(dialog).getByRole('textbox', { name: 'Organisation' }),
      'BITS Pilani · WILP',
    );
    await user.click(within(dialog).getByRole('button', { name: 'Register' }));
    expect(text(dialog.querySelector('.rk-ferr'))).toBe(
      'Enter an e-mail address like name@organisation.com',
    );
    await user.clear(within(dialog).getByRole('textbox', { name: 'Work e-mail' }));
    await user.type(
      within(dialog).getByRole('textbox', { name: 'Work e-mail' }),
      'kavya.nair@wilp.example',
    );
    await user.click(within(dialog).getByRole('button', { name: 'Register' }));
    await waitFor(() =>
      expect(text(dialog.querySelector('.rk-ferr'))).toBe(
        'Someone is already registered with this e-mail address',
      ),
    );
    await waitFor(() =>
      expect(within(dialog).getByRole('textbox', { name: 'Work e-mail' })).toHaveFocus(),
    );
    // The Institute Admin's sample e-mail (another identity, not a holder) is refused the same
    // way: nobody's sign-in is taken over or hidden, and nobody is named (PC-49).
    const email = within(dialog).getByRole('textbox', { name: 'Work e-mail' });
    await user.clear(email);
    expect(dialog.querySelector('.rk-ferr')).toBeNull();
    await user.type(email, 'meera.iyer@godavari.edu.in');
    await user.click(within(dialog).getByRole('button', { name: 'Register' }));
    await waitFor(() =>
      expect(text(dialog.querySelector('.rk-ferr'))).toBe(
        'Someone is already registered with this e-mail address',
      ),
    );
    const vendors = await asPersonId(sample, SUPER_ADMIN).platformRoles.listHolders({
      tab: 'vendors',
    });
    expect(vendors.ok && vendors.value).toHaveLength(2);
    // Cancel: nothing registered, focus back on the head's button.
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(screen.getByRole('button', { name: 'Register a Vendor' })).toHaveFocus();
  });

  it('registered: the new holder opens on SA-17 with the flash; nothing is sent', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    const navigation = showRoles(runtime);
    await heading('Platform roles');
    await user.click(await screen.findByRole('button', { name: 'Register a Vendor' }));
    const dialog = await screen.findByRole('dialog', { name: 'Register a Vendor' });
    // What they can submit to (owner decision PD-3): “Any course” is chosen when it opens.
    const start = within(dialog).getByRole('group', { name: 'What can they submit to?' });
    expect(within(start).getByRole('radio', { name: 'Any course' })).toBeChecked();
    expect(within(start).getByRole('radio', { name: 'Any course' })).toHaveAccessibleDescription(
      'They can submit experiments to every course, including courses added later. They see only their own experiments.',
    );
    await user.click(within(start).getByRole('radio', { name: 'Assign courses next' }));
    await user.type(within(dialog).getByRole('textbox', { name: 'Name' }), '  Neha Kapoor ');
    await user.type(
      within(dialog).getByRole('textbox', { name: 'Work e-mail' }),
      'neha.kapoor@vertexsim.example',
    );
    await user.type(
      within(dialog).getByRole('textbox', { name: 'Organisation' }),
      'Vertex Simulations',
    );
    await user.click(within(dialog).getByRole('button', { name: 'Register' }));
    await waitFor(() => expect(navigation.navigate).toHaveBeenCalledTimes(1));
    const address = navigation.navigate.mock.calls[0]![0];
    const holderId = address.replace(`${ROLES}/`, '');
    expect(resolveAddress(address).kind).not.toBe('workspace-not-found');
    expect(arrivalFor(holderId)).toEqual({
      title: 'Neha Kapoor is registered as Vendor.',
      line: 'Assign what they can act on. Nothing was sent to them.',
    });
    const holder = await holderOf(sample, holderId);
    expect(holder.holder).toMatchObject({
      role: 'vendor',
      name: 'Neha Kapoor',
      workEmail: 'neha.kapoor@vertexsim.example',
      organisation: 'Vertex Simulations',
      scopes: [],
    });
    forgetArrival(holderId);
  });

  it('a Vendor registered with “Any course” starts with All experiments, written with the registration (PD-3)', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    const navigation = showRoles(runtime);
    await heading('Platform roles');
    await user.click(await screen.findByRole('button', { name: 'Register a Vendor' }));
    const dialog = await screen.findByRole('dialog', { name: 'Register a Vendor' });
    await user.type(within(dialog).getByRole('textbox', { name: 'Name' }), 'Sana Rao');
    await user.type(
      within(dialog).getByRole('textbox', { name: 'Work e-mail' }),
      'sana.rao@northline.example',
    );
    await user.type(
      within(dialog).getByRole('textbox', { name: 'Organisation' }),
      'Northline Simulation Studio',
    );
    await user.click(within(dialog).getByRole('button', { name: 'Register' }));
    await waitFor(() => expect(navigation.navigate).toHaveBeenCalledTimes(1));
    const holderId = navigation.navigate.mock.calls[0]![0].replace(`${ROLES}/`, '');
    expect(arrivalFor(holderId)).toEqual({
      title: 'Sana Rao is registered as Vendor.',
      line: 'They can submit to any course. Nothing was sent to them.',
    });
    const holder = await holderOf(sample, holderId);
    expect(holder.holder.scopes.map((scope) => scope.target)).toEqual([{ kind: 'all' }]);
    expect(holder.holder.history.map((entry) => entry.event)).toEqual([
      'registered',
      'scope-assigned',
    ]);
    forgetArrival(holderId);
  });

  it('Reviewers and Content Managers are registered as drawn: no starting scope is asked', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    showRoles(runtime, '?tab=reviewers');
    await heading('Platform roles');
    await user.click(await screen.findByRole('button', { name: 'Register a Reviewer' }));
    const dialog = await screen.findByRole('dialog', { name: 'Register a Reviewer' });
    expect(within(dialog).queryByRole('radio')).toBeNull();
  });

  it('failed for now: the dialog stays open with what was typed and says nothing was lost', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    const navigation = showRoles(runtime, '?tab=reviewers');
    await heading('Platform roles');
    await user.click(await screen.findByRole('button', { name: 'Register a Reviewer' }));
    const dialog = await screen.findByRole('dialog', { name: 'Register a Reviewer' });
    await user.type(within(dialog).getByRole('textbox', { name: 'Name' }), 'Dr S. Rao');
    await user.type(
      within(dialog).getByRole('textbox', { name: 'Work e-mail' }),
      's.rao@wilp.example',
    );
    await user.type(
      within(dialog).getByRole('textbox', { name: 'Organisation' }),
      'BITS Pilani · WILP',
    );
    faults(sample).failNext('PlatformRoleService.registerHolder' as never);
    await user.click(within(dialog).getByRole('button', { name: 'Register' }));
    expect(
      await within(dialog).findByText('They weren’t registered. Nothing was lost — try again.'),
    ).toBeVisible();
    expect(within(dialog).getByRole('textbox', { name: 'Name' })).toHaveValue('Dr S. Rao');
    expect(navigation.navigate).not.toHaveBeenCalled();
    const reviewers = await asPersonId(sample, SUPER_ADMIN).platformRoles.listHolders({
      tab: 'reviewers',
    });
    expect(reviewers.ok && reviewers.value).toHaveLength(2);
  });
});

describe('SA-17 Role holder (SA-v1 `V.holder`)', () => {
  it('no scope: the crumbs, the head, the notice, the role’s line, the facts, the sign-in note, the history and the panel', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    showHolder(runtime, IYER);
    const title = await heading('Dr K. Iyer');
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(title).toHaveAttribute('id', 'role-holder-title');
    expect(title).toHaveAttribute('tabindex', '-1');
    expect(title).toHaveClass('rk-title');
    const crumbs = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(
      within(crumbs)
        .getAllByRole('link')
        .map((link) => [text(link), link.getAttribute('href')]),
    ).toEqual([
      ['Platform roles', ROLES],
      ['Reviewers', `${ROLES}?tab=reviewers`],
    ]);
    expect(crumbs.querySelector('[aria-current="page"]')).toHaveTextContent('Dr K. Iyer');
    expect(text(main().querySelector('.rk-head .rk-eyebrow'))).toBe('Academic Reviewer');
    expect(text(main().querySelector('.rk-head .rk-meta'))).toBe(
      'No scope BITS Pilani · WILP Registered 20 Oct 2026',
    );
    expect(main().querySelector('.rk-meta .xr-st.xr-st--warn.rk-st-lg')).not.toBeNull();
    expect(screen.getByRole('link', { name: 'Go to assign scope' })).toHaveAttribute(
      'href',
      '#assign-scope',
    );
    expect(text(main().querySelector('.rk-notice--warn'))).toBe(
      'No scope — can’t act on anything yet Assign a scope so they can act: all experiments, a course, or one experiment.',
    );
    expect(effect()).toBe(
      'Their review queue is empty. Nothing is in scope, and submissions for courses nobody reviews get stuck.',
    );
    expect(within(region('Can act on')).queryByRole('list')).toBeNull();
    expect(screen.queryByRole('region', { name: 'Withdrawn' })).toBeNull();
    const facts = region('Role holder');
    expect(text(facts.querySelector('dl.rk-dl'))).toBe(
      'Role Academic Reviewer Organisation BITS Pilani · WILP Work e-mail k.iyer@wilp.example Registered 20 Oct 2026',
    );
    expect(text(facts.querySelector('p.rk-hint'))).toBe(
      'How they first sign in is still open. Nothing is sent from here.',
    );
    const history = region('History');
    expect(text(history.querySelector('.rk-sec-h p'))).toBe('Newest first');
    expect(historyWhat()).toEqual(['Registered as Academic Reviewer']);
    expect(historyNotes()).toEqual(['Arjun Mehta · no scope yet']);
    expect(text(history.querySelector('.rk-tl-t'))).toBe('20 Oct 2026');
    // The Assign scope panel beside the record.
    const aside = panel();
    expect(aside).toHaveAttribute('id', 'assign-scope');
    const group = within(aside).getByRole('group', { name: 'What can they act on?' });
    expect(
      within(group)
        .getAllByRole('radio')
        .map((radio) => [
          radio.getAttribute('aria-describedby') && radio.id,
          text(radio.closest('label')),
        ]),
    ).toEqual([
      ['assign-kind-all', 'All experiments Everything on the platform, now and later.'],
      ['assign-kind-course', 'A course Every experiment in one course.'],
      ['assign-kind-experiment', 'One experiment Only the experiment you choose.'],
    ]);
    expect(assignButton()).toHaveClass('rb-btn', 'rb-btn--primary', 'rk-go');
    expect(text(aside.querySelector('.rk-panel-body > p.rk-hint'))).toBe(
      'Scope decides what appears in their workspace. It doesn’t change their role.',
    );
    expect(main().querySelector('#role-holder-flash')).toBeNull();
    expect(main().textContent).not.toMatch(/T-11/);
    expectNoInternalReferences();
  });

  it('opened straight after Register: the flash, and focus on the name', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    noteArrival(IYER, {
      title: 'Dr K. Iyer is registered as Academic Reviewer.',
      line: 'Assign what they can act on. Nothing was sent to them.',
    });
    showHolder(runtime, IYER);
    const title = await heading('Dr K. Iyer');
    expect(flash()).toBe(
      'Dr K. Iyer is registered as Academic Reviewer. Assign what they can act on. Nothing was sent to them.',
    );
    expect(main().querySelector('#role-holder-flash')).toHaveClass('rk-notice', 'rk-notice--ok');
    await waitFor(() => expect(title).toHaveFocus());
    // Shown once: a later visit has no flash.
    expect(arrivalFor(IYER)).toBeNull();
  });

  it('an address that names no holder is the GL-04 message in place', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    showHolder(runtime, 'role-nobody');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'This page isn’t available' }),
    ).toBeVisible();
    expect(screen.getByRole('link', { name: 'Back to Overview' })).toHaveAttribute(
      'href',
      '/admin',
    );
    expect(main().textContent).not.toMatch(/role-nobody/);
  });

  it('loading, then failed for now: Try again reads again', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    faults(sample).failNext('PlatformRoleService.getHolder' as never);
    showHolder(runtime, IYER);
    expect(await screen.findByText('Loading the role holder')).toHaveClass('rk-loading-msg');
    expect(await screen.findByText('We couldn’t load this role holder')).toBeVisible();
    expect(screen.getByText('Nothing has changed. Try again.')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await heading('Dr K. Iyer')).toBeVisible();
  });
});

describe('SA-17 Assign scope (the panel)', () => {
  it('what, then the course; the summary and the fields; assigned: the flash, the scope and history — SUB-0085 is no longer stuck and is in his queue', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    showHolder(runtime, IYER);
    await heading('Dr K. Iyer');
    const before = await asPersonId(sample, SUPER_ADMIN).production.getContentRecord({
      kind: 'SUB',
      id: 'SUB-0085',
    } as never);
    expect(before.ok && before.value.stuck).toBe(true);

    // Nothing chosen: “Choose what they can act on”, in the summary (which takes focus) and under
    // the choices.
    await user.click(assignButton());
    const summary = await within(panel()).findByRole('alert');
    expect(summary).toHaveClass('rk-errsum');
    expect(text(summary)).toBe('Check the scope Choose what they can act on');
    await waitFor(() => expect(summary).toHaveFocus());
    const group = within(panel()).getByRole('group', { name: 'What can they act on?' });
    expect(group).toHaveClass('rk-fieldset', 'is-invalid');
    expect(text(group.querySelector('.rk-ferr'))).toBe('Choose what they can act on');
    // The summary's link takes focus to the choices.
    await user.click(within(summary).getByRole('link', { name: 'Choose what they can act on' }));
    expect(within(group).getByRole('radio', { name: 'All experiments' })).toHaveFocus();

    // A course, but none picked.
    await user.click(within(group).getByRole('radio', { name: 'A course' }));
    expect(group.querySelector('.rk-ferr')).toBeNull();
    expect(within(panel()).queryByRole('alert')).toBeNull();
    const course = within(panel()).getByRole('combobox', { name: 'Course' });
    expect([...course.querySelectorAll('option')].map((option) => option.textContent)).toEqual([
      'Choose a course',
      'ME ZG523 · Thermodynamics & Heat Transfer',
      'MEL ZG512 · Manufacturing Processes',
      'Fluid Mechanics',
      'EEE ZC341 · Electrical Machines',
      'EEE ZG512 · Power Electronics',
      'CHE ZG513 · Process Instrumentation & Control',
    ]);
    await user.click(assignButton());
    expect(text(within(panel()).getByRole('alert'))).toBe('Check the scope Choose a course');
    expect(text(course.closest('.rk-field')!.querySelector('.rk-ferr'))).toBe('Choose a course');
    expect(course).toHaveAttribute('aria-invalid', 'true');
    await user.click(within(panel()).getByRole('link', { name: 'Choose a course' }));
    expect(course).toHaveFocus();
    await user.selectOptions(course, 'EEE ZC341 · Electrical Machines');
    await user.click(assignButton());

    await waitFor(() =>
      expect(flash()).toBe('Scope assigned: EEE ZC341. It now appears in their workspace.'),
    );
    await waitFor(() => expect(main().querySelector('#role-holder-flash')).toHaveFocus());
    expect(main().querySelector('.rk-notice--warn')).toBeNull();
    await waitFor(() =>
      expect(scopeRows('Can act on')).toEqual([
        'EEE ZC341 Electrical Machines Assigned 23 Oct 2026',
      ]),
    );
    expect(region('Can act on').querySelector('.sa-scope-t .rk-code')).toHaveTextContent(
      'EEE ZC341',
    );
    expect(effect()).toBe('Sees submissions and updates for these in the review queue: EEE ZC341.');
    expect(text(main().querySelector('.rk-head .rk-meta'))).toMatch(/^Has scope /);
    expect(historyWhat()).toEqual(['Scope assigned: EEE ZC341', 'Registered as Academic Reviewer']);
    expect(historyNotes()).toEqual(['Arjun Mehta', 'Arjun Mehta · no scope yet']);
    // The panel starts again.
    expect(within(panel()).queryByRole('combobox')).toBeNull();
    expect(within(panel()).getByRole('radio', { name: 'A course' })).not.toBeChecked();
    // Straight away, in the same world: not stuck, and in Dr K. Iyer's queue.
    const after = await asPersonId(sample, SUPER_ADMIN).production.getContentRecord({
      kind: 'SUB',
      id: 'SUB-0085',
    } as never);
    expect(after.ok && after.value.stuck).toBe(false);
    const iyer = await holderOf(sample, IYER);
    expect(await queueOf(sample, iyer.holder.personId)).toEqual(['SUB-0085 EEE ZC341']);
  });

  it('one experiment by name; “… is already in scope” is the service’s answer', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    showHolder(runtime, MENON);
    await heading('Prof. A. Menon');
    await user.click(within(panel()).getByRole('radio', { name: 'A course' }));
    const course = within(panel()).getByRole('combobox', { name: 'Course' });
    // (by value: user-event compares an option's `innerHTML`, where “&” is “&amp;”).
    await user.selectOptions(course, 'thermodynamics-heat-transfer');
    await user.click(assignButton());
    await waitFor(() =>
      expect(text(course.closest('.rk-field')!.querySelector('.rk-ferr'))).toBe(
        'ME ZG523 is already in scope',
      ),
    );
    expect(text(within(panel()).getByRole('alert'))).toBe(
      'Check the scope ME ZG523 is already in scope',
    );
    // One experiment: the published catalogue, “<name> · <code>”.
    await user.click(within(panel()).getByRole('radio', { name: 'One experiment' }));
    const experiment = within(panel()).getByRole('combobox', { name: 'Experiment' });
    expect(experiment.querySelectorAll('option')).toHaveLength(14);
    expect(experiment.querySelectorAll('option')[10]).toHaveTextContent(
      'Distillation Column · CHE ZG513',
    );
    await user.click(assignButton());
    expect(text(experiment.closest('.rk-field')!.querySelector('.rk-ferr'))).toBe(
      'Choose an experiment',
    );
    await user.selectOptions(experiment, 'Synchronous Generator · EEE ZC341');
    await user.click(assignButton());
    await waitFor(() =>
      expect(flash()).toBe(
        'Scope assigned: Synchronous Generator. It now appears in their workspace.',
      ),
    );
    await waitFor(() =>
      expect(scopeRows('Can act on').at(-1)).toBe('Synchronous Generator Assigned 23 Oct 2026'),
    );
  });

  it('for a Vendor the panel offers All experiments (any course) and A course — never One experiment (PD-4)', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    showHolder(runtime, ANIL);
    await heading('Anil Shetty');
    expect(within(panel()).getAllByRole('radio')).toHaveLength(2);
    expect(within(panel()).getByRole('radio', { name: 'A course' })).toBeVisible();
    expect(within(panel()).queryByRole('radio', { name: 'One experiment' })).toBeNull();
    expect(
      within(panel()).getByRole('radio', { name: 'All experiments' }),
    ).toHaveAccessibleDescription(
      'Any course, now and later. They see only their own experiments.',
    );
  });

  it('a one-experiment scope a Vendor already holds gives nothing: listed, withdrawable, never restored (PD-4)', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    // As an earlier build saved it, before PD-4: a Vendor holding one experiment.
    // The fixture's records are shared with later tests: put Anil back afterwards.
    const records = worldOf(sample).records as { holders: Record<string, PlatformRoleHolder> };
    const anil = records.holders[ANIL]!;
    onTestFinished(() => {
      records.holders[ANIL] = anil;
    });
    records.holders[ANIL] = {
      ...anil,
      scopes: [
        {
          id: 'scope-old-experiment' as never,
          target: { kind: 'experiment', experimentId: 'synchronous-generator' as never },
          assignedAt: anil.registeredAt,
          assignedBy: anil.registeredBy,
          withdrawal: null,
          supersededAt: null,
        },
      ],
    };
    showHolder(runtime, ANIL);
    await heading('Anil Shetty');
    expect(effect()).toBe(
      'Can’t create or submit experiments yet. Nothing is in scope. One experiment gives a Vendor nothing — withdraw it.',
    );
    expect(text(main().querySelector('.rk-head .rk-meta'))).toMatch(/^No scope /);
    expect(scopeRows('Can act on')).toHaveLength(1);
    await user.click(within(region('Can act on')).getByRole('button', { name: /Withdraw/ }));
    await user.type(within(region('Can act on')).getByRole('textbox'), 'Not used by a Vendor');
    await user.click(within(region('Can act on')).getByRole('button', { name: 'Withdraw scope' }));
    await waitFor(() => expect(scopeRows('Withdrawn')).toHaveLength(1));
    expect(within(region('Withdrawn')).queryByRole('button', { name: /Restore/ })).toBeNull();
  });

  it('a Vendor given All experiments: any course, now and later (PD-2)', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    showHolder(runtime, ANIL);
    await heading('Anil Shetty');
    await user.click(within(panel()).getByRole('radio', { name: 'All experiments' }));
    await user.click(assignButton());
    await waitFor(() =>
      expect(flash()).toBe('Scope assigned: All experiments. It now appears in their workspace.'),
    );
    await waitFor(() =>
      expect(scopeRows('Can act on')).toEqual([
        'ME ZG523 Thermodynamics & Heat Transfer Assigned 4 Jul 2026',
        'All experiments Assigned 23 Oct 2026',
      ]),
    );
    expect(effect()).toBe('Can create experiments and submit them for any course, now and later.');
  });

  it('failed for now: the panel keeps the choice and says nothing was changed', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    showHolder(runtime, IYER);
    await heading('Dr K. Iyer');
    await user.click(within(panel()).getByRole('radio', { name: 'All experiments' }));
    faults(sample).failNext('PlatformRoleService.assignScope' as never);
    await user.click(assignButton());
    expect(await within(panel()).findByText('Nothing was changed. Try again.')).toBeVisible();
    expect(within(panel()).getByRole('radio', { name: 'All experiments' })).toBeChecked();
    expect((await holderOf(sample, IYER)).scopes).toEqual([]);
  });

  it('changed since the page read it: nothing is assigned, the holder is read again, the refusal in the panel takes focus', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    showHolder(runtime, IYER);
    await heading('Dr K. Iyer');
    await user.click(within(panel()).getByRole('radio', { name: 'All experiments' }));
    // Meanwhile, in another tab, the Super Admin assigned him a course (the revision moved on).
    const iyer = await holderOf(sample, IYER);
    const assigned = await asPersonId(sample, SUPER_ADMIN).platformRoles.assignScope({
      holderId: IYER as never,
      target: { kind: 'course', courseId: 'electrical-machines' as never },
      expectedRev: iyer.holder.rev,
    });
    expect(assigned.ok).toBe(true);
    await user.click(assignButton());
    const notice = await within(panel()).findByRole('alert');
    expect(text(notice)).toBe(
      'This role holder changed since you opened it It has been read again. Check it, then try again.',
    );
    await waitFor(() => expect(notice).toHaveFocus());
    await waitFor(() =>
      expect(scopeRows('Can act on')).toEqual([
        'EEE ZC341 Electrical Machines Assigned 23 Oct 2026',
      ]),
    );
    const after = await holderOf(sample, IYER);
    expect(after.scopes).toHaveLength(1);
  });
});

describe('SA-17 Withdraw (inline, a reason required) and Restore (a confirmation)', () => {
  it('a reason is required, inline below the scope; withdrawn, it moves to Withdrawn, newest first', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    showHolder(runtime, ANIL);
    await heading('Anil Shetty');
    expect(effect()).toBe('Can create experiments and submit them for: ME ZG523.');
    expect(scopeRows('Can act on')).toEqual([
      'ME ZG523 Thermodynamics & Heat Transfer Assigned 4 Jul 2026',
    ]);
    expect(scopeRows('Withdrawn')).toEqual([
      'MEL ZG512 Manufacturing Processes Withdrawn 15 Aug 2026 · “Manufacturing Processes content is being produced in-house this term.”',
    ]);
    expect(historyWhat()).toEqual(['Scope withdrawn: MEL ZG512', 'Registered as Vendor']);
    expect(historyNotes()).toEqual([
      '“Manufacturing Processes content is being produced in-house this term.” · Arjun Mehta',
      'Arjun Mehta · scope ME ZG523, MEL ZG512',
    ]);
    const withdraw = screen.getByRole('button', {
      name: 'Withdraw scope ME ZG523 · Thermodynamics & Heat Transfer',
    });
    expect(withdraw).toHaveClass('rb-btn', 'rb-btn--ghost');
    expect(withdraw).toHaveTextContent('Withdraw');
    await user.click(withdraw);
    const reason = await screen.findByRole('textbox', {
      name: 'Reason for withdrawing ME ZG523',
    });
    await waitFor(() => expect(reason).toHaveFocus());
    expect(reason.closest('.sa-inline')?.parentElement?.tagName).toBe('LI');
    expect(reason).toHaveAccessibleDescription('Kept with the scope in the history.');
    // The row's own button is gone while the form is open.
    expect(
      screen.queryByRole('button', {
        name: 'Withdraw scope ME ZG523 · Thermodynamics & Heat Transfer',
      }),
    ).toBeNull();
    const confirm = screen.getByRole('button', { name: 'Withdraw scope' });
    expect(confirm).toHaveClass('rb-btn--navy');
    await user.click(confirm);
    expect(text(reason.closest('.rk-field')!.querySelector('.rk-ferr'))).toBe(
      'Add a reason — it is kept in the history',
    );
    expect(reason).toHaveAttribute('aria-invalid', 'true');
    await waitFor(() => expect(reason).toHaveFocus());
    // Cancel: focus back on Withdraw.
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() =>
      expect(
        screen.getByRole('button', {
          name: 'Withdraw scope ME ZG523 · Thermodynamics & Heat Transfer',
        }),
      ).toHaveFocus(),
    );
    await user.click(
      screen.getByRole('button', {
        name: 'Withdraw scope ME ZG523 · Thermodynamics & Heat Transfer',
      }),
    );
    await user.type(
      await screen.findByRole('textbox', { name: /Reason for withdrawing/ }),
      'Thermodynamics content moves to the in-house team.',
    );
    await user.click(screen.getByRole('button', { name: 'Withdraw scope' }));
    await waitFor(() =>
      expect(flash()).toBe('Scope withdrawn: ME ZG523. The reason is kept with the scope.'),
    );
    await waitFor(() => expect(main().querySelector('#role-holder-flash')).toHaveFocus());
    await waitFor(() => expect(within(region('Can act on')).queryByRole('list')).toBeNull());
    expect(text(main().querySelector('.rk-notice--warn'))).toMatch(
      /^No scope — can’t act on anything yet/,
    );
    expect(effect()).toBe('Can’t create or submit experiments yet. Nothing is in scope.');
    expect(scopeRows('Withdrawn')).toEqual([
      'ME ZG523 Thermodynamics & Heat Transfer Withdrawn 23 Oct 2026 · “Thermodynamics content moves to the in-house team.”',
      'MEL ZG512 Manufacturing Processes Withdrawn 15 Aug 2026 · “Manufacturing Processes content is being produced in-house this term.”',
    ]);
    expect(historyWhat()[0]).toBe('Scope withdrawn: ME ZG523');
    expect(historyNotes()[0]).toBe(
      '“Thermodynamics content moves to the in-house team.” · Arjun Mehta',
    );
    expectNoInternalReferences();
  });

  it('withdrawn, the reviewer stops seeing it straight away; restored (no reason asked), it is back', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    showHolder(runtime, MENON);
    await heading('Prof. A. Menon');
    expect(await queueOf(sample, MENON_PERSON)).toEqual([
      'SUB-0086 CHE ZG513',
      'SUB-0071 CHE ZG513',
    ]);
    await user.click(
      screen.getByRole('button', {
        name: 'Withdraw scope CHE ZG513 · Process Instrumentation & Control',
      }),
    );
    await user.type(
      await screen.findByRole('textbox', { name: 'Reason for withdrawing CHE ZG513' }),
      'Process control reviews move to the chemical faculty.',
    );
    await user.click(screen.getByRole('button', { name: 'Withdraw scope' }));
    await waitFor(() =>
      expect(flash()).toBe('Scope withdrawn: CHE ZG513. The reason is kept with the scope.'),
    );
    expect(await queueOf(sample, MENON_PERSON)).toEqual([]);

    // Restore asks no reason — one confirmation, focus on its button.
    const restore = await screen.findByRole('button', {
      name: 'Restore scope CHE ZG513 · Process Instrumentation & Control',
    });
    expect(restore).toHaveClass('rb-btn');
    expect(restore).toHaveTextContent('Restore');
    await user.click(restore);
    const dialog = await screen.findByRole('dialog', {
      name: 'Restore CHE ZG513 for Prof. A. Menon?',
    });
    expect(dialog).toHaveAccessibleDescription(
      'The same scope comes back. No reason is asked; the earlier withdrawal stays in the history.',
    );
    const confirm = within(dialog).getByRole('button', { name: 'Restore scope' });
    await waitFor(() => expect(confirm).toHaveFocus());
    expect(confirm).toHaveClass('rb-btn--primary', 'rb-btn--lg');
    expect(dialog.querySelector('textarea')).toBeNull();
    await user.click(confirm);
    await waitFor(() => expect(flash()).toBe('Scope restored: CHE ZG513.'));
    await waitFor(() => expect(main().querySelector('#role-holder-flash')).toHaveFocus());
    expect(await queueOf(sample, MENON_PERSON)).toEqual([
      'SUB-0086 CHE ZG513',
      'SUB-0071 CHE ZG513',
    ]);
    await waitFor(() =>
      expect(scopeRows('Can act on')).toEqual([
        'ME ZG523 Thermodynamics & Heat Transfer Assigned 2 Jun 2026',
        'MEL ZG512 Manufacturing Processes Assigned 2 Jun 2026',
        'CHE ZG513 Process Instrumentation & Control Assigned 23 Oct 2026',
      ]),
    );
    expect(scopeRows('Withdrawn')).toEqual([
      'EEE ZC341 Electrical Machines Withdrawn 1 Oct 2026 · “Electrical Machines reviews move to a reviewer from the electrical faculty.”',
    ]);
    expect(historyWhat()).toEqual([
      'Scope restored: CHE ZG513',
      'Scope withdrawn: CHE ZG513',
      'Scope withdrawn: EEE ZC341',
      'Registered as Academic Reviewer',
    ]);
  });

  it('EEE ZC341 restored for Prof. A. Menon: SUB-0085 can be reviewed again; Cancel restores nothing', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    showHolder(runtime, MENON);
    await heading('Prof. A. Menon');
    const restore = screen.getByRole('button', {
      name: 'Restore scope EEE ZC341 · Electrical Machines',
    });
    await user.click(restore);
    let dialog = await screen.findByRole('dialog', {
      name: 'Restore EEE ZC341 for Prof. A. Menon?',
    });
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(restore).toHaveFocus();
    expect(await queueOf(sample, MENON_PERSON)).not.toContain('SUB-0085 EEE ZC341');
    await user.click(restore);
    dialog = await screen.findByRole('dialog', { name: 'Restore EEE ZC341 for Prof. A. Menon?' });
    await user.click(within(dialog).getByRole('button', { name: 'Restore scope' }));
    await waitFor(() => expect(flash()).toBe('Scope restored: EEE ZC341.'));
    expect(await queueOf(sample, MENON_PERSON)).toContain('SUB-0085 EEE ZC341');
    await waitFor(() => expect(screen.queryByRole('region', { name: 'Withdrawn' })).toBeNull());
  });

  it('restore failed for now: the confirmation stays open and says nothing was changed', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    showHolder(runtime, MENON);
    await heading('Prof. A. Menon');
    await user.click(
      screen.getByRole('button', { name: 'Restore scope EEE ZC341 · Electrical Machines' }),
    );
    const dialog = await screen.findByRole('dialog', {
      name: 'Restore EEE ZC341 for Prof. A. Menon?',
    });
    faults(sample).failNext('PlatformRoleService.restoreScope' as never);
    await user.click(within(dialog).getByRole('button', { name: 'Restore scope' }));
    expect(await within(dialog).findByText('Nothing was changed. Try again.')).toBeVisible();
    expect(await queueOf(sample, MENON_PERSON)).not.toContain('SUB-0085 EEE ZC341');
  });

  it('changed since the form opened: nothing is withdrawn, the holder is read again, the refusal in the panel takes focus', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    showHolder(runtime, RITU);
    await heading('Ritu Sharma');
    await user.click(
      screen.getByRole('button', { name: 'Withdraw scope EEE ZC341 · Electrical Machines' }),
    );
    await user.type(
      await screen.findByRole('textbox', { name: 'Reason for withdrawing EEE ZC341' }),
      'Electrical content is paused this term.',
    );
    // Meanwhile, in another tab, the Super Admin assigned her a course (the revision moved on).
    const other = asPersonId(sample, SUPER_ADMIN).platformRoles;
    const ritu = await holderOf(sample, RITU);
    const assigned = await other.assignScope({
      holderId: RITU as never,
      target: { kind: 'course', courseId: 'power-electronics' as never },
      expectedRev: ritu.holder.rev,
    });
    expect(assigned.ok).toBe(true);
    await user.click(screen.getByRole('button', { name: 'Withdraw scope' }));
    const notice = await within(panel()).findByRole('alert');
    expect(text(notice)).toBe(
      'This role holder changed since you opened it It has been read again. Check it, then try again.',
    );
    await waitFor(() => expect(notice).toHaveFocus());
    expect(main().querySelector('.sa-inline')).toBeNull();
    await waitFor(() =>
      expect(scopeRows('Can act on')).toEqual([
        'CHE ZG513 Process Instrumentation & Control Assigned 1 Aug 2026',
        'EEE ZC341 Electrical Machines Assigned 20 Sep 2026',
        'EEE ZG512 Power Electronics Assigned 23 Oct 2026',
      ]),
    );
    const after = await holderOf(sample, RITU);
    expect(after.scopes.every((scope) => scope.status === 'active')).toBe(true);
  });

  it('failed for now: the form stays open with the reason and says nothing was changed', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    showHolder(runtime, KAVYA);
    await heading('Kavya Nair');
    expect(scopeRows('Can act on')).toEqual(['All experiments Assigned 2 Jun 2026']);
    expect(effect()).toBe('Decides publication and raises corrections for: All experiments.');
    await user.click(screen.getByRole('button', { name: 'Withdraw scope All experiments' }));
    const reason = await screen.findByRole('textbox', {
      name: 'Reason for withdrawing All experiments',
    });
    await user.type(reason, 'Testing a failure.');
    faults(sample).failNext('PlatformRoleService.withdrawScope' as never);
    await user.click(screen.getByRole('button', { name: 'Withdraw scope' }));
    const failed = await screen.findByText('Nothing was changed. Try again.');
    expect(failed.closest('.sa-inline')).not.toBeNull();
    expect(reason).toHaveValue('Testing a failure.');
    expect((await holderOf(sample, KAVYA)).scopes[0]!.status).toBe('active');
  });
});

describe('the holder view (pure)', () => {
  it('pairs each later scope with its history entry, even at one instant', async () => {
    const { sample } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    const ports = asPersonId(sample, SUPER_ADMIN).platformRoles;
    let view = await holderOf(sample, IYER);
    const steps: (() => Promise<unknown>)[] = [
      () =>
        ports.assignScope({
          holderId: IYER as never,
          target: { kind: 'course', courseId: 'electrical-machines' as never },
          expectedRev: view.holder.rev,
        }),
      () =>
        ports.assignScope({
          holderId: IYER as never,
          target: { kind: 'all' },
          expectedRev: view.holder.rev,
        }),
    ];
    for (const step of steps) {
      await step();
      view = await holderOf(sample, IYER);
    }
    const machines = view.scopes.find((scope) => scope.courseCode === 'EEE ZC341')!;
    const withdrawn = await ports.withdrawScope({
      holderId: IYER as never,
      scopeId: machines.scope.id,
      reason: 'Moved.',
      expectedRev: view.holder.rev,
    });
    if (!withdrawn.ok) throw new Error(withdrawn.error.kind);
    const restored = await ports.restoreScope({
      holderId: IYER as never,
      scopeId: machines.scope.id,
      expectedRev: (withdrawn.value as PlatformRoleHolder).rev,
    });
    if (!restored.ok) throw new Error(restored.error.kind);
    view = await holderOf(sample, IYER);
    const lines = historyLines(view.holder, scopeNamings(view));
    expect(lines.map((line) => line.what)).toEqual([
      'Scope restored: EEE ZC341',
      'Scope withdrawn: EEE ZC341',
      'Scope assigned: All experiments',
      'Scope assigned: EEE ZC341',
      'Registered as Academic Reviewer',
    ]);
    expect(lines[1]!.note).toBe('“Moved.” · Arjun Mehta');
    expect(effectWords(view)).toBe(
      'Sees submissions and updates for these in the review queue: All experiments, EEE ZC341.',
    );
  });
});

describe('the link targets (SA-v1 LINK-MAP)', () => {
  it('every built link reaches SA-16 or SA-17; each page has one primary', () => {
    for (const entry of P6_PLATFORM_ROLES_LINK_TARGETS) {
      if (entry.outcome !== 'built') continue;
      const resolved = resolveAddress(expandTarget(entry.target!, '/admin'));
      expect(resolved.kind, entry.action).not.toMatch(/not-found/);
    }
    const primaries = P6_PLATFORM_ROLES_LINK_TARGETS.filter((entry) => entry.role === 'primary');
    expect(primaries.map((entry) => `${entry.screen}: ${entry.action}`)).toEqual([
      'SA-16: Register',
      'SA-17: Assign scope',
    ]);
  });
});
