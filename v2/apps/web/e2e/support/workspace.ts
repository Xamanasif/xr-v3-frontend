import { expect, type Page } from '@playwright/test';

import { bootWorld } from './boot-world';
import type { SamplePerson } from './test-seam';

/**
 * Workspace helpers for the WP-0.13 foundation suites. Every page starts on a fixture world with a
 * person signed in through the CI-only boot descriptor (Appendix F §7.2; ADR-0003 §3: no sign-in
 * UI in Phase 0, G-8), on the dedicated test-hook build.
 */

/** The seven roles' workspace bases (ADR-0005 §1) and their sample people in the full walk. */
export const ROLES = [
  { role: 'student', label: 'Student', base: '/student', person: { personId: 'per-0002' } },
  { role: 'faculty', label: 'Faculty', base: '/faculty', person: { personId: 'per-0014' } },
  {
    role: 'tenant_admin',
    label: 'Institute Admin',
    base: '/institute',
    person: { personId: 'per-0001' },
  },
  { role: 'vendor', label: 'Vendor', base: '/vendor', person: { personId: 'per-anil-shetty' } },
  {
    role: 'academic_reviewer',
    label: 'Academic Reviewer',
    base: '/reviewer',
    person: { personId: 'per-a-menon' },
  },
  {
    role: 'content_manager',
    label: 'Content Manager',
    base: '/content-manager',
    person: { personId: 'per-kavya-nair' },
  },
  {
    role: 'super_admin',
    label: 'Super Admin',
    base: '/admin',
    person: { personId: 'sa-arjun-mehta' },
  },
] as const satisfies readonly {
  readonly role: string;
  readonly label: string;
  readonly base: string;
  readonly person: SamplePerson;
}[];

export type RoleEntry = (typeof ROLES)[number];

export function roleEntry(role: RoleEntry['role']): RoleEntry {
  return ROLES.find((entry) => entry.role === role)!;
}

/** Board 06's account-menu lines, by workspace (the board's table, as the sample world holds them). */
export const ACCOUNT_LINES: Readonly<Record<RoleEntry['role'], string>> = {
  student: 'Account menu, Rahul Verma, Student, Godavari Institute of Technology',
  faculty: 'Account menu, Dr S. Ranganathan, Faculty, Godavari Institute of Technology',
  tenant_admin: 'Account menu, Meera Iyer, Institute Admin, Godavari Institute of Technology',
  vendor: 'Account menu, Anil Shetty, Vendor, Northline Simulation Studio',
  academic_reviewer: 'Account menu, Prof. A. Menon, Academic Reviewer',
  content_manager: 'Account menu, Kavya Nair, Content Manager',
  super_admin: 'Account menu, Arjun Mehta, Super Admin',
};

export const SUPER_ADMIN: SamplePerson = { personId: 'sa-arjun-mehta' };
export const INACTIVE_STUDENT: SamplePerson = { personId: 'per-0005' };
export const PAUSED_INSTITUTE_ADMIN: SamplePerson = { personId: 'per-s-kulkarni' };

/** Boots the page on a fixture world as `person` and opens `path` (a document load). */
export async function openAs(
  page: Page,
  person: SamplePerson | null,
  path: string,
  fixture = 'after-flow-d',
): Promise<void> {
  await bootWorld(page, { fixture, session: person });
  await page.goto(path);
}

/**
 * The workspace shell is on screen (the sidebar landmark of a workspace): a v46 role shell
 * (`div.xr-app` > `aside.xr-side`, `main.xr-page#main`) or a migrated role's V3 shell (`div.rb` >
 * `aside.rb-rail`, `main.rb-page#main`; the Super Admin, SA-v1).
 */
export async function waitForShell(page: Page): Promise<void> {
  await expect(page.locator('div.xr-app aside.xr-side, div.rb aside.rb-rail')).toBeAttached();
  await expect(page.locator('main.xr-page#main, main.rb-page#main')).toBeAttached();
}

/**
 * Marks the current document so a later check can tell a client-side navigation (the mark is
 * still there) from a document load (a new document has none) — a document load would rebuild
 * the tab's sample world (ADR-0004 option A).
 */
export async function markDocument(page: Page): Promise<string> {
  const mark = `doc-${Math.random().toString(36).slice(2)}`;
  await page.evaluate((value) => {
    (window as unknown as { __xrDocumentMark?: string }).__xrDocumentMark = value;
  }, mark);
  return mark;
}

export async function expectSameDocument(page: Page, mark: string): Promise<void> {
  expect(
    await page.evaluate(
      () => (window as unknown as { __xrDocumentMark?: string }).__xrDocumentMark ?? null,
    ),
    'a client-side navigation kept the document (and the tab’s sample world)',
  ).toBe(mark);
}

/**
 * The sidebar link of the current destination, if any (`aria-current="page"` in the v46 sidebar or
 * the V3 rail — or, below 1024 px with the V3 drawer open, in the drawer).
 */
export function currentSidebarItem(page: Page) {
  return page.locator(
    'aside.xr-side a[aria-current="page"], aside.rb-rail .rb-nav a[aria-current="page"]',
  );
}

/** The sidebar's Help, in its foot (v46 "Help"; V3 "Help & support"). */
export function sidebarHelp(page: Page) {
  // The V3 rail is hidden below 1024 px; its drawer (`div.rb-drawer`, drawn only while open, after
  // the rail) has its own foot: the last match is the drawer's link while it is open, else the
  // rail's (or the v46 sidebar's).
  return page
    .locator(
      'aside.xr-side .xr-side-foot a, aside.rb-rail .rb-rail-foot a, div.rb-drawer .rb-rail-foot a',
    )
    .last();
}

/**
 * Opens the drawer below 1024 px so the sidebar can be used; a no-op from 1024, where the sidebar
 * is always shown (board 05 bands; the V3 rail from 1024 px too). The v46 shell's button is
 * "Open menu", the V3 shell's "Menu"; both drawers close with "Close menu".
 */
export async function revealSidebar(page: Page): Promise<void> {
  // Below 1024 px the sidebar is the drawer (board 05). Decide by the width, not by whether the
  // menu button happens to be drawn yet: right after a sign-in the shell may still be arriving.
  if ((page.viewportSize()?.width ?? 1440) >= 1024) return;
  const close = page.getByRole('button', { name: 'Close menu' });
  if (await close.isVisible()) return;
  await page.getByRole('button', { name: /^(Open menu|Menu)$/ }).click();
  await expect(close).toBeFocused();
}

/**
 * A destination link of the workspace's navigation as the person can use it at this width: the v46
 * sidebar, or the V3 rail — below 1024 px, after `revealSidebar`, the drawer's copy (the V3 drawer
 * draws its own navigation, `div.rb-drawer`).
 */
export function sidebarLink(page: Page, href: string) {
  return page.locator(
    `aside.xr-side nav a[href="${href}"], aside.rb-rail:visible .rb-nav a[href="${href}"], div.rb-drawer .rb-nav a[href="${href}"]`,
  );
}
