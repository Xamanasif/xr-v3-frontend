/**
 * Phase 6 · the Super Admin's Platform roles: SA-16 Platform roles (B7-08 f0, f3, f6) and SA-17
 * Role holder (B7-08 f1, f2, f4, f5, f7, f8; B7-10 f10, f11), on the real composition root and the
 * sample world after Flow E (23 Oct 2026: Dr K. Iyer registered with no scope, SUB-0085 stuck).
 * The lists and the holder are the service's answers; Register, Assign, Withdraw and Restore are
 * its commands, each with the revision its dialog or panel opened on; field errors are the
 * contract's drawn words; a refusal writes nothing. A scope change reaches the holder's own
 * workspace at once (the reviewer's queue), and nothing is sent (T-11).
 */
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { PlatformRoleHolder } from '@xr/domain';
import { asPersonId, faults } from '@xr/sample-platform/testing';
import type { ReactNode } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

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
const topTitle = () => document.querySelector('.xr-top-title')?.textContent;
const crumbs = () => text(screen.getByRole('list', { name: 'You are here' }));
const heading = (name: string) =>
  screen.findByRole('heading', { level: 1, name }, { timeout: 5000 });
const flash = () => text(main().querySelector('p.xa-save'));

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
  [...main().querySelectorAll('table.xr-table tbody tr')].map((row) =>
    [...row.querySelectorAll('td')].map((cell) => text(cell)),
  );
const scopeRows = (label: string) =>
  [...within(main()).getByRole('list', { name: label }).querySelectorAll(':scope > li')].map(
    (row) => text(row.querySelector('.xg-lo-main')),
  );
const historyWhat = () =>
  [...main().querySelectorAll('ol.xr-timeline .xr-tl-what')].map((node) => text(node));
const historyNotes = () =>
  [...main().querySelectorAll('ol.xr-timeline li')].map((node) =>
    text(node.querySelector('.xr-tl-note')),
  );

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

describe('SA-16 Platform roles (B7-08 f0, f3)', () => {
  it('Vendors is the bare address (f3): the counts, the rows, the foot note without “(T-11)”', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    const navigation = showRoles(runtime);
    await heading('Platform roles');
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(text(main().querySelector('.xr-phead-meta'))).toBe(
      'Who can produce, review and publish content — and for what',
    );
    expect(topTitle()).toBe('Platform roles');
    const tabs = screen.getByRole('tablist', { name: 'Role' });
    await waitFor(() =>
      expect(
        within(tabs)
          .getAllByRole('tab')
          .map((tab) => text(tab)),
      ).toEqual(['Vendors 2', 'Reviewers 2', 'Content Managers 1']),
    );
    expect(within(tabs).getByRole('tab', { name: /^Vendors/ })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(screen.getByRole('heading', { level: 2, name: 'Vendors' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Register a Vendor' })).toHaveClass(
      'xr-btn--secondary',
      'xr-btn--sm',
    );
    await waitFor(() => expect(rows()).toHaveLength(2));
    expect(rows()).toEqual([
      [
        'Anil Shetty Northline Simulation Studio · Registered 4 Jul 2026',
        'ME ZG523 1 scope withdrawn',
        'Open',
      ],
      ['Ritu Sharma Meridian Virtual Labs · Registered 1 Aug 2026', 'CHE ZG513, EEE ZC341', 'Open'],
    ]);
    expect(screen.getByRole('link', { name: 'Open Anil Shetty' })).toHaveAttribute(
      'href',
      `${ROLES}/${ANIL}`,
    );
    // Nobody without a scope on this tab: no notice.
    expect(main().querySelector('.xr-notice--warn')).toBeNull();
    expect(text(main().querySelector('p.xl-open'))).toBe(
      'Registering doesn’t send an invitation. How a registered person first signs in is still open.',
    );
    expect(main().textContent).not.toMatch(/T-11/);
    expect(navigation.replace).not.toHaveBeenCalled();
  });

  it('Reviewers (f0): the no-scope notice and tag; choosing a tab replaces the address', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    const navigation = showRoles(runtime, '?tab=reviewers');
    await heading('Platform roles');
    expect(screen.getByRole('heading', { level: 2, name: 'Reviewers' })).toBeVisible();
    await waitFor(() => expect(rows()).toHaveLength(2));
    expect(rows()).toEqual([
      [
        'Prof. A. Menon BITS Pilani · WILP · Registered 2 Jun 2026',
        'ME ZG523, MEL ZG512, CHE ZG513 1 scope withdrawn',
        'Open',
      ],
      ['Dr K. Iyer BITS Pilani · WILP · Registered 20 Oct 2026', 'Nothing — no scope yet', 'Open'],
    ]);
    expect(main().querySelector('tbody .xw-tag.xw-tag--warn')).toHaveTextContent(
      'Nothing — no scope yet',
    );
    const notice = main().querySelector('.xr-notice.xr-notice--warn');
    expect(text(notice)).toBe(
      '1 holder with no scope — they can’t act on anything yet Open the holder and assign a scope.',
    );
    expect(screen.getByRole('button', { name: 'Register a Reviewer' })).toBeVisible();

    await user.click(screen.getByRole('tab', { name: /^Content Managers/ }));
    expect(navigation.replace).toHaveBeenLastCalledWith(`${ROLES}?tab=content-managers`);
    expect(
      await screen.findByRole('heading', { level: 2, name: 'Content Managers' }),
    ).toBeVisible();
    await waitFor(() =>
      expect(rows()).toEqual([
        ['Kavya Nair BITS Pilani · WILP · Registered 2 Jun 2026', 'All experiments', 'Open'],
      ]),
    );
    expect(screen.getByRole('button', { name: 'Register a Content Manager' })).toBeVisible();
    await user.click(screen.getByRole('tab', { name: /^Vendors/ }));
    expect(navigation.replace).toHaveBeenLastCalledWith(ROLES);
  });

  it('`?tab=vendors` and an unknown tab are replaced by the bare address (D-11)', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    const navigation = showRoles(runtime, '?tab=vendors');
    await heading('Platform roles');
    await waitFor(() => expect(navigation.replace).toHaveBeenCalledWith(ROLES));
    expect(screen.getByRole('heading', { level: 2, name: 'Vendors' })).toBeVisible();
  });

  it('an unknown tab shows Vendors and is replaced too', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    const navigation = showRoles(runtime, '?tab=institute-admins');
    await heading('Platform roles');
    await waitFor(() => expect(navigation.replace).toHaveBeenCalledWith(ROLES));
    expect(screen.getByRole('heading', { level: 2, name: 'Vendors' })).toBeVisible();
  });

  it('failed for now: the drawn failed state; Try again reads again', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    faults(sample).failNext('PlatformRoleService.listHolders' as never);
    showRoles(runtime);
    expect(await screen.findByText('We couldn’t load the role holders')).toBeVisible();
    expect(screen.getByText('Nothing has changed. Try again.')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Try again' }));
    await waitFor(() => expect(rows()).toHaveLength(2));
  });
});

describe('SA-16 Register a <role> (B7-08 f6)', () => {
  it('all three required at once; the e-mail format; an e-mail already in use is refused with SA-16’s words (PC-49)', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    showRoles(runtime);
    await heading('Platform roles');
    await user.click(await screen.findByRole('button', { name: 'Register a Vendor' }));
    const dialog = await screen.findByRole('dialog', { name: 'Register a Vendor' });
    expect(dialog.querySelector('.xr-dialog-body p')?.textContent).toBe(
      'Role: Vendor. They start with no scope — you assign it next. Nothing is sent from here.',
    );
    expect(within(dialog).getByRole('textbox', { name: 'Name' })).toHaveFocus();
    await user.click(within(dialog).getByRole('button', { name: 'Register' }));
    expect([...dialog.querySelectorAll('.xr-error')].map((error) => text(error))).toEqual([
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
    expect(dialog.querySelectorAll('.xr-error')).toHaveLength(2);
    await user.type(within(dialog).getByRole('textbox', { name: 'Work e-mail' }), 'kavya.nair');
    await user.type(
      within(dialog).getByRole('textbox', { name: 'Organisation' }),
      'BITS Pilani · WILP',
    );
    await user.click(within(dialog).getByRole('button', { name: 'Register' }));
    expect(text(dialog.querySelector('.xr-error'))).toBe(
      'Enter an e-mail address like name@organisation.com',
    );
    await user.clear(within(dialog).getByRole('textbox', { name: 'Work e-mail' }));
    await user.type(
      within(dialog).getByRole('textbox', { name: 'Work e-mail' }),
      'kavya.nair@wilp.example',
    );
    await user.click(within(dialog).getByRole('button', { name: 'Register' }));
    await waitFor(() =>
      expect(text(dialog.querySelector('.xr-error'))).toBe(
        'Someone is already registered with this e-mail address',
      ),
    );
    await waitFor(() =>
      expect(within(dialog).getByRole('textbox', { name: 'Work e-mail' })).toHaveFocus(),
    );
    // The Institute Admin's sample e-mail (another identity, not a holder) is refused the same
    // way: nobody's sign-in is taken over or hidden (PC-49).
    const email = within(dialog).getByRole('textbox', { name: 'Work e-mail' });
    await user.clear(email);
    expect(dialog.querySelector('.xr-error')).toBeNull();
    await user.type(email, 'meera.iyer@godavari.edu.in');
    await user.click(within(dialog).getByRole('button', { name: 'Register' }));
    await waitFor(() =>
      expect(text(dialog.querySelector('.xr-error'))).toBe(
        'Someone is already registered with this e-mail address',
      ),
    );
    const vendors = await asPersonId(sample, SUPER_ADMIN).platformRoles.listHolders({
      tab: 'vendors',
    });
    expect(vendors.ok && vendors.value).toHaveLength(2);
    // Cancel: nothing registered, focus back on the header's button.
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(screen.getByRole('button', { name: 'Register a Vendor' })).toHaveFocus();
  });

  it('registered: the new holder opens on SA-17 with B7-08’s flash; nothing is sent', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    const navigation = showRoles(runtime);
    await heading('Platform roles');
    await user.click(await screen.findByRole('button', { name: 'Register a Vendor' }));
    const dialog = await screen.findByRole('dialog', { name: 'Register a Vendor' });
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
    expect(arrivalFor(holderId)).toBe(
      'Neha Kapoor is registered as Vendor. They have no scope yet — assign one so they can act. Nothing is sent from here.',
    );
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

describe('SA-17 Role holder (B7-08 f1, f2; B7-10 f10)', () => {
  it('no scope: the notice, the role’s line, the facts, the sign-in note and the history', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    showHolder(runtime, IYER);
    const title = await heading('Dr K. Iyer');
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1);
    expect(title).toHaveAttribute('id', 'role-holder-title');
    expect(main().querySelector('a.xr-back')).toHaveAttribute('href', ROLES);
    expect(text(main().querySelector('.xr-overline'))).toBe(
      'Academic Reviewer · BITS Pilani · WILP',
    );
    expect(topTitle()).toBe('Platform roles');
    expect(crumbs()).toMatch(/Platform roles\s*\/\s*Dr K\. Iyer/);
    expect(screen.getByRole('button', { name: 'Assign scope' })).toHaveClass('xr-btn--primary');
    expect(text(main().querySelector('.xr-notice--warn'))).toBe(
      'No scope — can’t act on anything yet Assign a scope so they can act: all experiments, a course, or one experiment.',
    );
    const canActOn = screen.getByRole('region', { name: 'Can act on' });
    expect(text(canActOn.querySelector('p.xr-body'))).toBe(
      'Their review queue is empty — nothing is in scope. Submissions for courses nobody reviews get stuck.',
    );
    expect(within(canActOn).queryByRole('list')).toBeNull();
    const facts = screen.getByRole('region', { name: 'Role holder' });
    expect(text(facts.querySelector('dl.xl-kv.xv-kv'))).toBe(
      'Role Academic Reviewer Organisation BITS Pilani · WILP Work e-mail k.iyer@wilp.example Registered 20 Oct 2026 · by Arjun Mehta',
    );
    expect(text(facts.querySelector('p.xl-meta'))).toBe(
      'How they first sign in is still open — nothing is sent from here.',
    );
    const history = screen.getByRole('region', { name: 'History' });
    expect(text(history.querySelector('.xr-section-head .xr-meta'))).toBe('Newest first');
    expect(historyWhat()).toEqual(['Registered as Academic Reviewer']);
    expect(historyNotes()).toEqual(['Arjun Mehta · no scope yet']);
    expect(text(history.querySelector('.xr-tl-when'))).toBe('20 Oct 2026');
    expect(flash()).toBe('');
    expect(main().textContent).not.toMatch(/T-11/);
  });

  it('opened straight after Register: the flash, and focus on the name', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    noteArrival(
      IYER,
      'Dr K. Iyer is registered as Academic Reviewer. They have no scope yet — assign one so they can act. Nothing is sent from here.',
    );
    showHolder(runtime, IYER);
    const title = await heading('Dr K. Iyer');
    expect(flash()).toBe(
      'Dr K. Iyer is registered as Academic Reviewer. They have no scope yet — assign one so they can act. Nothing is sent from here.',
    );
    await waitFor(() => expect(title).toHaveFocus());
    // Shown once: a later visit has no flash.
    expect(arrivalFor(IYER)).toBeNull();
  });

  it('an address that names no holder is the in-shell not-found page', async () => {
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    showHolder(runtime, 'role-nobody');
    expect(
      await screen.findByRole('heading', { level: 1, name: 'We can’t find that page' }),
    ).toBeVisible();
    expect(topTitle()).not.toBe('role-nobody');
  });
});

describe('SA-17 Assign scope (B7-08 f5)', () => {
  it('what, then the course; assigned: the flash, the scope and history — SUB-0085 is no longer stuck and is in his queue', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    showHolder(runtime, IYER);
    await heading('Dr K. Iyer');
    const before = await asPersonId(sample, SUPER_ADMIN).production.getContentRecord({
      kind: 'SUB',
      id: 'SUB-0085',
    } as never);
    expect(before.ok && before.value.stuck).toBe(true);

    await user.click(screen.getByRole('button', { name: 'Assign scope' }));
    const dialog = await screen.findByRole('dialog', { name: 'Assign scope to Dr K. Iyer' });
    expect(text(dialog.querySelector('.xr-dialog-body > p'))).toBe(
      'Scope decides what Dr K. Iyer sees and can act on. Sees submissions and updates for these in the review queue the scope you choose.',
    );
    const group = within(dialog).getByRole('group', { name: 'What can they act on?' });
    expect(
      within(group)
        .getAllByRole('radio')
        .map((radio) => radio.closest('label')?.querySelector('.xr-choice-title')?.textContent),
    ).toEqual(['All experiments', 'A course', 'One experiment']);
    expect(within(group).getByRole('radio', { name: /All experiments/ })).toHaveFocus();
    // Nothing chosen: “Choose what they can act on”.
    await user.click(within(dialog).getByRole('button', { name: 'Assign scope' }));
    expect(text(group.querySelector('.xr-error'))).toBe('Choose what they can act on');
    // A course, but none picked (f5).
    await user.click(within(group).getByRole('radio', { name: /A course/ }));
    expect(group.querySelector('.xr-error')).toBeNull();
    const course = within(dialog).getByRole('combobox', { name: 'Course' });
    expect([...course.querySelectorAll('option')].map((option) => option.textContent)).toEqual([
      'Choose a course',
      'ME ZG523 · Thermodynamics & Heat Transfer',
      'MEL ZG512 · Manufacturing Processes',
      'Fluid Mechanics',
      'EEE ZC341 · Electrical Machines',
      'EEE ZG512 · Power Electronics',
      'CHE ZG513 · Process Instrumentation & Control',
    ]);
    await user.click(within(dialog).getByRole('button', { name: 'Assign scope' }));
    expect(text(dialog.querySelector('.xr-field .xr-error'))).toBe('Choose a course');
    await waitFor(() => expect(course).toHaveFocus());
    expect(course).toHaveAttribute('aria-invalid', 'true');
    await user.selectOptions(course, 'EEE ZC341 · Electrical Machines');
    await user.click(within(dialog).getByRole('button', { name: 'Assign scope' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(flash()).toBe('Dr K. Iyer can now act on EEE ZC341.');
    await waitFor(() => expect(main().querySelector('p.xa-save')).toHaveFocus());
    expect(main().querySelector('.xr-notice--warn')).toBeNull();
    expect(scopeRows('Scope')).toEqual(['EEE ZC341 · Electrical Machines Since 23 Oct 2026']);
    expect(
      text(screen.getByRole('region', { name: 'Can act on' }).querySelector('p.xr-body')),
    ).toBe('Sees submissions and updates for these in the review queue: EEE ZC341.');
    expect(historyWhat()).toEqual([
      'Scope assigned — EEE ZC341',
      'Registered as Academic Reviewer',
    ]);
    expect(historyNotes()).toEqual(['Arjun Mehta', 'Arjun Mehta · no scope yet']);
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
    await user.click(screen.getByRole('button', { name: 'Assign scope' }));
    let dialog = await screen.findByRole('dialog', { name: 'Assign scope to Prof. A. Menon' });
    await user.click(within(dialog).getByRole('radio', { name: /A course/ }));
    const course = within(dialog).getByRole('combobox', { name: 'Course' });
    // (by value: user-event compares an option's `innerHTML`, where “&” is “&amp;”).
    await user.selectOptions(course, 'thermodynamics-heat-transfer');
    await user.click(within(dialog).getByRole('button', { name: 'Assign scope' }));
    await waitFor(() =>
      expect(text(dialog.querySelector('.xr-field .xr-error'))).toBe(
        'ME ZG523 is already in scope',
      ),
    );
    // One experiment: the published catalogue, “<name> · <code>”.
    await user.click(within(dialog).getByRole('radio', { name: /One experiment/ }));
    const experiment = within(dialog).getByRole('combobox', { name: 'Experiment' });
    expect(experiment.querySelectorAll('option')).toHaveLength(14);
    expect(experiment.querySelectorAll('option')[10]).toHaveTextContent(
      'Distillation Column · CHE ZG513',
    );
    await user.click(within(dialog).getByRole('button', { name: 'Assign scope' }));
    expect(text(dialog.querySelector('.xr-field .xr-error'))).toBe('Choose an experiment');
    await user.selectOptions(experiment, 'Synchronous Generator · EEE ZC341');
    await user.click(within(dialog).getByRole('button', { name: 'Assign scope' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(flash()).toBe('Prof. A. Menon can now act on Synchronous Generator.');
    expect(scopeRows('Scope').at(-1)).toBe('Synchronous Generator (experiment) Since 23 Oct 2026');
    // Cancel closes and assigns nothing.
    await user.click(screen.getByRole('button', { name: 'Assign scope' }));
    dialog = await screen.findByRole('dialog', { name: 'Assign scope to Prof. A. Menon' });
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(screen.getByRole('button', { name: 'Assign scope' })).toHaveFocus();
  });

  it('a Vendor given All experiments: shown as held, its meaning for a Vendor open (ROLE-11)', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    showHolder(runtime, ANIL);
    await heading('Anil Shetty');
    await user.click(screen.getByRole('button', { name: 'Assign scope' }));
    const dialog = await screen.findByRole('dialog', { name: 'Assign scope to Anil Shetty' });
    expect(text(dialog.querySelector('.xr-dialog-body > p'))).toBe(
      'Scope decides what Anil Shetty sees and can act on. Can create experiments and submit them for the scope you choose.',
    );
    await user.click(within(dialog).getByRole('radio', { name: /All experiments/ }));
    await user.click(within(dialog).getByRole('button', { name: 'Assign scope' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(flash()).toBe('Anil Shetty can now act on All experiments.');
    expect(scopeRows('Scope')).toEqual([
      'ME ZG523 · Thermodynamics & Heat Transfer Since 4 Jul 2026',
      'All experiments Since 23 Oct 2026',
    ]);
    expect(
      text(screen.getByRole('region', { name: 'Can act on' }).querySelector('p.xr-body')),
    ).toBe(
      'Can create experiments and submit them for: ME ZG523. What “All experiments” or one experiment lets a Vendor do isn’t decided yet.',
    );
  });
});

describe('SA-17 Withdraw (B7-08 f4; B7-10 f11) and Restore (f8)', () => {
  it('a reason is required, inline beside the scope; withdrawn, it moves to Withdrawn, newest first', async () => {
    const user = userEvent.setup();
    const { runtime } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    showHolder(runtime, ANIL);
    await heading('Anil Shetty');
    expect(
      text(screen.getByRole('region', { name: 'Can act on' }).querySelector('p.xr-body')),
    ).toBe('Can create experiments and submit them for: ME ZG523.');
    expect(scopeRows('Scope')).toEqual([
      'ME ZG523 · Thermodynamics & Heat Transfer Since 4 Jul 2026',
    ]);
    expect(scopeRows('Withdrawn scope')).toEqual([
      'MEL ZG512 · Manufacturing Processes Withdrawn 15 Aug 2026 · “Manufacturing Processes content is being produced in-house this term.”',
    ]);
    expect(historyWhat()).toEqual(['Scope withdrawn — MEL ZG512', 'Registered as Vendor']);
    expect(historyNotes()).toEqual([
      '“Manufacturing Processes content is being produced in-house this term.” · Arjun Mehta',
      'Arjun Mehta · scope ME ZG523, MEL ZG512',
    ]);
    const withdraw = screen.getByRole('button', {
      name: 'Withdraw ME ZG523 · Thermodynamics & Heat Transfer',
    });
    expect(withdraw).toHaveClass('xr-btn--text', 'xg-del');
    await user.click(withdraw);
    const reason = await screen.findByRole('textbox', {
      name: 'Reason for withdrawing ME ZG523 · Thermodynamics & Heat Transfer',
    });
    await waitFor(() => expect(reason).toHaveFocus());
    expect(reason.closest('.xw-inline-panel')).not.toBeNull();
    expect(
      screen.getByText('Kept in the history. They stop seeing it straight away.'),
    ).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Withdraw scope' }));
    expect(text(reason.closest('.xr-field')!.querySelector('.xr-error'))).toBe(
      'Add a reason — it is kept in the history',
    );
    expect(reason).toHaveAttribute('aria-invalid', 'true');
    await waitFor(() => expect(reason).toHaveFocus());
    // Cancel: focus back on Withdraw.
    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Withdraw ME ZG523 · Thermodynamics & Heat Transfer' }),
      ).toHaveFocus(),
    );
    await user.click(
      screen.getByRole('button', { name: 'Withdraw ME ZG523 · Thermodynamics & Heat Transfer' }),
    );
    await user.type(
      await screen.findByRole('textbox', { name: /Reason for withdrawing/ }),
      'Thermodynamics content moves to the in-house team.',
    );
    await user.click(screen.getByRole('button', { name: 'Withdraw scope' }));
    await waitFor(() =>
      expect(flash()).toBe('ME ZG523 withdrawn. Anil Shetty can no longer act on it.'),
    );
    expect(within(main()).queryByRole('list', { name: 'Scope' })).toBeNull();
    expect(text(main().querySelector('.xr-notice--warn'))).toMatch(
      /^No scope — can’t act on anything yet/,
    );
    expect(
      text(screen.getByRole('region', { name: 'Can act on' }).querySelector('p.xr-body')),
    ).toBe('Can’t create or submit experiments yet — nothing is in scope.');
    expect(scopeRows('Withdrawn scope')).toEqual([
      'ME ZG523 · Thermodynamics & Heat Transfer Withdrawn 23 Oct 2026 · “Thermodynamics content moves to the in-house team.”',
      'MEL ZG512 · Manufacturing Processes Withdrawn 15 Aug 2026 · “Manufacturing Processes content is being produced in-house this term.”',
    ]);
    expect(historyWhat()[0]).toBe('Scope withdrawn — ME ZG523');
    expect(historyNotes()[0]).toBe(
      '“Thermodynamics content moves to the in-house team.” · Arjun Mehta',
    );
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
        name: 'Withdraw CHE ZG513 · Process Instrumentation & Control',
      }),
    );
    await user.type(
      await screen.findByRole('textbox', { name: /Reason for withdrawing CHE ZG513/ }),
      'Process control reviews move to the chemical faculty.',
    );
    await user.click(screen.getByRole('button', { name: 'Withdraw scope' }));
    await waitFor(() =>
      expect(flash()).toBe('CHE ZG513 withdrawn. Prof. A. Menon can no longer act on it.'),
    );
    expect(await queueOf(sample, MENON_PERSON)).toEqual([]);

    // f8: Restore asks no reason — one confirmation, inline.
    await user.click(
      screen.getByRole('button', { name: 'Restore CHE ZG513 · Process Instrumentation & Control' }),
    );
    const confirm = await screen.findByRole('button', { name: 'Restore scope' });
    await waitFor(() => expect(confirm).toHaveFocus());
    expect(confirm).toHaveClass('xr-btn--primary', 'xr-btn--sm');
    expect(text(confirm.closest('.xw-inline-panel')!.querySelector('p'))).toBe(
      'Restore CHE ZG513 · Process Instrumentation & Control? They can act on it again straight away.',
    );
    expect(confirm.closest('.xw-inline-panel')!.querySelector('textarea')).toBeNull();
    await user.click(confirm);
    await waitFor(() =>
      expect(flash()).toBe('CHE ZG513 restored. Prof. A. Menon can act on it again.'),
    );
    expect(await queueOf(sample, MENON_PERSON)).toEqual([
      'SUB-0086 CHE ZG513',
      'SUB-0071 CHE ZG513',
    ]);
    expect(scopeRows('Scope')).toEqual([
      'ME ZG523 · Thermodynamics & Heat Transfer Since 2 Jun 2026',
      'MEL ZG512 · Manufacturing Processes Since 2 Jun 2026',
      'CHE ZG513 · Process Instrumentation & Control Since 23 Oct 2026',
    ]);
    expect(scopeRows('Withdrawn scope')).toEqual([
      'EEE ZC341 · Electrical Machines Withdrawn 1 Oct 2026 · “Electrical Machines reviews move to a reviewer from the electrical faculty.”',
    ]);
    expect(historyWhat()).toEqual([
      'Scope restored — CHE ZG513',
      'Scope withdrawn — CHE ZG513',
      'Scope withdrawn — EEE ZC341',
      'Registered as Academic Reviewer',
    ]);
  });

  it('EEE ZC341 restored for Prof. A. Menon (f8): SUB-0085 can be reviewed again', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    showHolder(runtime, MENON);
    await heading('Prof. A. Menon');
    await user.click(
      screen.getByRole('button', { name: 'Restore EEE ZC341 · Electrical Machines' }),
    );
    await user.click(await screen.findByRole('button', { name: 'Restore scope' }));
    await waitFor(() =>
      expect(flash()).toBe('EEE ZC341 restored. Prof. A. Menon can act on it again.'),
    );
    expect(await queueOf(sample, MENON_PERSON)).toContain('SUB-0085 EEE ZC341');
    expect(within(main()).queryByRole('heading', { level: 3, name: 'Withdrawn' })).toBeNull();
  });

  it('changed since the panel opened: nothing is withdrawn, the holder is read again, the notice takes focus', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    showHolder(runtime, RITU);
    await heading('Ritu Sharma');
    await user.click(
      screen.getByRole('button', { name: 'Withdraw EEE ZC341 · Electrical Machines' }),
    );
    await user.type(
      await screen.findByRole('textbox', { name: /Reason for withdrawing EEE ZC341/ }),
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
    const notice = await screen.findByRole('alert');
    expect(text(notice)).toBe(
      'This role holder changed since you opened it It has been read again. Check it, then try again.',
    );
    await waitFor(() => expect(notice).toHaveFocus());
    expect(main().querySelector('.xw-inline-panel')).toBeNull();
    await waitFor(() =>
      expect(scopeRows('Scope')).toEqual([
        'CHE ZG513 · Process Instrumentation & Control Since 1 Aug 2026',
        'EEE ZC341 · Electrical Machines Since 20 Sep 2026',
        'EEE ZG512 · Power Electronics Since 23 Oct 2026',
      ]),
    );
    const after = await holderOf(sample, RITU);
    expect(after.scopes.every((scope) => scope.status === 'active')).toBe(true);
  });

  it('failed for now: the panel stays open with the reason and says nothing was changed', async () => {
    const user = userEvent.setup();
    const { runtime, sample } = await tabPlatform(SUPER_ADMIN, 'after-flow-e');
    showHolder(runtime, KAVYA);
    await heading('Kavya Nair');
    expect(scopeRows('Scope')).toEqual(['All experiments Since 2 Jun 2026']);
    expect(
      text(screen.getByRole('region', { name: 'Can act on' }).querySelector('p.xr-body')),
    ).toBe('Decides publication and raises corrections for: All experiments.');
    await user.click(screen.getByRole('button', { name: 'Withdraw All experiments' }));
    const reason = await screen.findByRole('textbox', {
      name: 'Reason for withdrawing All experiments',
    });
    await user.type(reason, 'Testing a failure.');
    faults(sample).failNext('PlatformRoleService.withdrawScope' as never);
    await user.click(screen.getByRole('button', { name: 'Withdraw scope' }));
    expect(await screen.findByText('Nothing was changed. Try again.')).toBeVisible();
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
      'Scope restored — EEE ZC341',
      'Scope withdrawn — EEE ZC341',
      'Scope assigned — All experiments',
      'Scope assigned — EEE ZC341',
      'Registered as Academic Reviewer',
    ]);
    expect(lines[1]!.note).toBe('“Moved.” · Arjun Mehta');
    expect(effectWords(view)).toBe(
      'Sees submissions and updates for these in the review queue: All experiments, EEE ZC341.',
    );
  });
});

describe('the link targets (B7-08)', () => {
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
