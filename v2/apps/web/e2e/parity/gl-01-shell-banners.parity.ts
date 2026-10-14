import type { BrowserContext, Page } from '@playwright/test';

import { setBoardProps } from '../../../../tools/board-capture/src/boards.mjs';
import { compareAll, pointerAway } from '../../../../tools/board-capture/src/parity.mjs';
import { actAs, bootWorld, type SamplePerson } from '../support';
import { type CompareItem, expect, test } from './support';

/**
 * Board 05 (GL-01 Workspace Shell, XS-08 banners) against the built shell on each workspace's
 * Help page (WP-0.15), for the seven roles at 1440 × 900: the top bar, the sidebar's head,
 * workspace label and Help (Help current), the whole sidebar against DEV-10 (no destination built
 * in Phase 0), the Help & support header, and the banners where they apply — Godavari paused by
 * the Super Admin through the bridge (Student, Faculty, Institute Admin) and the inactive Student
 * of the sample world. The board is driven by its own canvas props and its own sidebar (Help).
 */
const FIXTURE = 'after-flow-d';
const FROZEN = new Date('2026-10-14T09:00:00+05:30');
const SUPER_ADMIN: SamplePerson = { personId: 'sa-arjun-mehta' };

const ROLES = [
  { label: 'Student', base: '/student', person: { personId: 'per-0002' } },
  { label: 'Faculty', base: '/faculty', person: { personId: 'per-0014' } },
  { label: 'Institute Admin', base: '/institute', person: { personId: 'per-0001' } },
  { label: 'Vendor', base: '/vendor', person: { personId: 'per-anil-shetty' } },
  { label: 'Academic Reviewer', base: '/reviewer', person: { personId: 'per-a-menon' } },
  { label: 'Content Manager', base: '/content-manager', person: { personId: 'per-kavya-nair' } },
  { label: 'Super Admin', base: '/admin', person: { personId: 'sa-arjun-mehta' } },
] as const;

const slug = (text: string) => text.toLowerCase().replace(/[^a-z]+/g, '-');

async function open(context: BrowserContext, person: SamplePerson, path: string): Promise<Page> {
  const page = await context.newPage();
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.clock.setFixedTime(FROZEN);
  await bootWorld(page, { fixture: FIXTURE, session: person });
  await page.goto(path);
  await expect(page.getByRole('heading', { level: 1, name: 'Help & support' })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  return page;
}

async function pauseGodavari(page: Page) {
  const found = await actAs<{ value: { institution: { id: string; rev: number } } }>(
    page,
    SUPER_ADMIN,
    {
      port: 'institutions',
      method: 'getInstitution',
      input: 'godavari',
    },
  );
  const { id, rev } = found.value.institution;
  await actAs(page, SUPER_ADMIN, {
    port: 'institutions',
    method: 'pauseInstitution',
    input: { institutionId: id, reason: 'Checking the student list.', expectedRev: rev },
  });
  await expect(page.locator('.xr-banner--paused')).toBeVisible();
}

test('board 05 · the built shell on Help for 7 roles, with the applicable banners', async ({
  context,
  openBoardPage,
}, testInfo) => {
  const { page: board } = await openBoardPage('05-Workspace-Shell.dc.html');
  const failures: string[] = [];
  const run = async (items: CompareItem[]) => {
    try {
      await compareAll({ expect, testInfo, kind: 'specimen', items });
    } catch (error) {
      failures.push(String((error as Error).message).split('\n')[0]!);
    }
  };
  const boardHelp = async (label: string, banner: string) => {
    await setBoardProps(board, { role: label, banner, startWithMenuOpen: false });
    await board.locator('aside.xr-side .xr-side-foot a').click();
    await expect(board.locator('header.xr-top .xr-top-title')).toHaveText('Help & support');
    await pointerAway(board);
    await board.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  };
  for (const role of ROLES) {
    await boardHelp(role.label, 'None');
    const ours = await open(context, role.person, `${role.base}/help`);
    const name = `05-${slug(role.label)}-help-built`;
    await run([
      {
        name: `${name}-top-bar`,
        reference: board.locator('header.xr-top'),
        product: ours.locator('header.xr-top'),
      },
      {
        name: `${name}-sidebar-head`,
        reference: board.locator('aside.xr-side .xr-side-head'),
        product: ours.locator('aside.xr-side .xr-side-head'),
      },
      {
        name: `${name}-sidebar-workspace`,
        reference: board.locator('aside.xr-side .xr-ws'),
        product: ours.locator('aside.xr-side .xr-ws'),
      },
      {
        name: `${name}-sidebar-help`,
        reference: board.locator('aside.xr-side .xr-side-foot'),
        product: ours.locator('aside.xr-side .xr-side-foot'),
      },
      role.label === 'Super Admin'
        ? {
            // Package 1A builds the Super Admin's Requests (SA-02), so this sidebar now lists it
            // with its count: measured under its own name and DEV-21 (owner review). The Phase-0
            // pin `05-super-admin-help-built-sidebar` (DEV-10, Help only) is kept unchanged in
            // pinned.json as the record of the Phase-0 state; it is no longer observed.
            name: `${name}-sidebar-package-1a`,
            reference: board.locator('aside.xr-side'),
            product: ours.locator('aside.xr-side'),
            kind: 'specimen',
            deviation: 'DEV-21',
          }
        : {
            name: `${name}-sidebar`,
            reference: board.locator('aside.xr-side'),
            product: ours.locator('aside.xr-side'),
            kind: 'specimen',
            deviation: 'DEV-10',
          },
      {
        name: `${name}-help-header`,
        reference: board.locator('main .xr-phead'),
        product: ours.locator('main .xr-phead'),
        // DEV-15: board 05's lead words. DEV-11: only Rahul and Kavya hold reports in the world, so for
        // the others the header has no action (it moves into the empty state, board 07 "Rules").
        deviation: ['Student', 'Content Manager'].includes(role.label)
          ? 'DEV-15'
          : ['DEV-15', 'DEV-11'],
      },
    ]);
    if (['Student', 'Faculty', 'Institute Admin'].includes(role.label)) {
      await boardHelp(role.label, 'Institution paused');
      await pauseGodavari(ours);
      await run([
        {
          name: `05-${slug(role.label)}-paused-built-banner`,
          reference: board.locator('.xr-banner'),
          product: ours.locator('.xr-banner'),
        },
      ]);
    }
    await ours.close();
  }
  // The inactive Student of the sample world (per-0005).
  await boardHelp('Student', 'Account inactive');
  const inactive = await open(context, { personId: 'per-0005' }, '/student/help');
  await run([
    {
      name: '05-student-inactive-built-banner',
      reference: board.locator('.xr-banner'),
      product: inactive.locator('.xr-banner'),
    },
  ]);
  expect(failures).toEqual([]);
});
