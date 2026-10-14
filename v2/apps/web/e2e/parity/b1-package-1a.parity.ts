import type { BrowserContext, Locator, Page, TestInfo } from '@playwright/test';

import { compareAll } from '../../../../tools/board-capture/src/parity.mjs';
import { bootWorld, type SamplePerson } from '../support';
import { type CompareItem, expect, test } from './support';

/**
 * Phase-1 Package 1A: boards B1-09 (XS-01/03/04 Sign in), B1-10 (SA-02 Requests) and B1-11
 * (SA-03 Request decision) against the built screens of the test-hook build, each frame at its
 * drawn width × 900, on the spine-start sample world (the Super Admin through the CI-only boot
 * descriptor; sign-in pages signed out).
 *
 * Where the world holds the board's state the part is compared at the component tolerance; where
 * the world's sample data differs from the B1 boards' (S-1/S-2 B7 reading, REQ-0042 not created
 * before Package 1C), or a drawn link leads to a page not built yet (P0-35), the comparison names
 * its Package-1A register entry — measured, pinned, and reported for the owner's review, never
 * approved here. Panel-only frames of B1-11 drawn at their own widths (f1 … f8, f10 … f14) are
 * not compared: the product panel takes its width from the page layout.
 */
const SPINE_START = 'spine-start';
const FROZEN = new Date('2026-10-02T10:00:00+05:30');
const ARJUN: SamplePerson = { personId: 'sa-arjun-mehta' };

async function open(
  context: BrowserContext,
  width: number,
  person: SamplePerson | null,
  path: string,
  ready: (page: Page) => Promise<void>,
): Promise<Page> {
  const page = await context.newPage();
  await page.setViewportSize({ width, height: 900 });
  await page.clock.setFixedTime(FROZEN);
  await bootWorld(page, { fixture: SPINE_START, session: person });
  await page.goto(path);
  await ready(page);
  await page.evaluate(() => document.fonts.ready);
  return page;
}

/** Nothing focused or hovered: the frames are drawn at rest. */
async function rest(page: Page): Promise<void> {
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.mouse.move(0, 0);
}

const signInReady = async (page: Page) => {
  await expect(page.locator('.xp-auth-card h1')).toHaveText('Sign in');
};
const requestsReady = async (page: Page) => {
  await expect(page.locator('table.xr-table tbody td.is-primary a').first()).toBeVisible();
};
const decisionReady = async (page: Page) => {
  await expect(page.getByRole('complementary', { name: 'Your decision' })).toBeVisible();
};

function collector(testInfo: TestInfo) {
  const failures: string[] = [];
  return {
    failures,
    run: async (items: CompareItem[]) => {
      try {
        await compareAll({ expect, testInfo, kind: 'specimen', items });
      } catch (error) {
        failures.push(String((error as Error).message).split('\n')[0]!);
      }
    },
  };
}

test.describe('B1-09 · XS-01 Sign in, XS-03, XS-04 on the built card', () => {
  let frames: Locator;

  test.beforeEach(async ({ openBoardPage }) => {
    const { page: board } = await openBoardPage('B1-09-Sign-In.dc.html', { uncrop: true });
    frames = board.locator('.b1-frame');
    await expect(frames).toHaveCount(13);
  });

  test('f0 · Sign in · 1440', async ({ context }, testInfo) => {
    const { run, failures } = collector(testInfo);
    const ours = await open(context, 1440, null, '/sign-in', signInReady);
    await rest(ours);
    const frame = frames.nth(0);
    await run([
      {
        name: 'b1-09-f0-brand',
        reference: frame.locator('.xp-auth-brand'),
        product: ours.locator('.xp-auth-brand'),
      },
      {
        name: 'b1-09-f0-heading',
        reference: frame.locator('h1.xp-auth-h'),
        product: ours.locator('h1.xp-auth-h'),
      },
      {
        name: 'b1-09-f0-single-sign-on',
        reference: frame.locator('.xp-auth-card > button.xr-btn--secondary'),
        product: ours.locator('.xp-auth-card > button.xr-btn--secondary'),
      },
      {
        name: 'b1-09-f0-or',
        reference: frame.locator('p.xp-or'),
        product: ours.locator('p.xp-or'),
      },
      {
        name: 'b1-09-f0-form',
        reference: frame.locator('form'),
        product: ours.locator('form'),
      },
      {
        name: 'b1-09-f0-card',
        reference: frame.locator('.xp-auth-card'),
        product: ours.locator('.xp-auth-card'),
        deviation: 'DEV-21',
      },
      {
        name: 'b1-09-f0-whole-frame',
        reference: frame.locator('.xp'),
        product: ours.locator('div.xp'),
        kind: 'screen',
        frame: true,
        deviation: ['DEV-21', 'DEV-24'],
      },
    ]);
    expect(failures).toEqual([]);
  });

  test('f3 · Wrong details · f4 · Missing fields (640)', async ({ context }, testInfo) => {
    const { run, failures } = collector(testInfo);
    const ours = await open(context, 640, null, '/sign-in', signInReady);
    const card = ours.locator('.xp-auth-card');
    await card.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(card.getByText('Enter your password')).toBeVisible();
    await rest(ours);
    await run([
      {
        name: 'b1-09-f4-missing-fields-form',
        reference: frames.nth(4).locator('form'),
        product: card.locator('form'),
      },
    ]);
    await card.getByLabel('E-mail', { exact: true }).fill('meera.iyer@godavari.edu.in');
    await card.locator('#sign-in-password').fill('xxxxxxxxxx');
    await card.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(card.getByRole('alert')).toBeVisible();
    await rest(ours);
    await run([
      {
        name: 'b1-09-f3-wrong-details-alert',
        reference: frames.nth(3).locator('.xr-notice--err'),
        product: card.getByRole('alert'),
      },
      {
        name: 'b1-09-f3-wrong-details-form',
        reference: frames.nth(3).locator('form'),
        product: card.locator('form'),
      },
    ]);
    expect(failures).toEqual([]);
  });

  test('f6 · Institution sign-in unavailable · f10 · Signed out · f9 · Session expired (640)', async ({
    context,
  }, testInfo) => {
    const { run, failures } = collector(testInfo);
    const ours = await open(context, 640, null, '/sign-in?reason=signed-out', signInReady);
    const card = ours.locator('.xp-auth-card');
    await card.getByRole('button', { name: 'Sign in with your institution' }).click();
    await expect(card.locator('.xr-notice--quiet')).toBeVisible();
    await rest(ours);
    await run([
      {
        name: 'b1-09-f6-unavailable-notice',
        reference: frames.nth(6).locator('.xr-notice--quiet'),
        product: card.locator('.xr-notice--quiet'),
      },
      {
        name: 'b1-09-f10-signed-out-notice',
        reference: frames.nth(10).locator('.xr-notice--ok'),
        product: card.locator('.xr-notice--ok'),
      },
    ]);
    const expired = await open(
      context,
      640,
      null,
      '/sign-in?reason=expired&returnTo=%2Fadmin%2Frequests%2FREQ-0038',
      signInReady,
    );
    await rest(expired);
    await run([
      {
        // B1-09 f9 names "My courses › Shell-and-Tube Heat Exchanger" (a Phase-2 page).
        name: 'b1-09-f9-expired-notice',
        reference: frames.nth(9).locator('.xr-notice').first(),
        product: expired.locator('.xp-auth-card .xr-notice').first(),
        deviation: 'DEV-22',
      },
    ]);
    expect(failures).toEqual([]);
  });

  test('f11 · Mobile 375', async ({ context }, testInfo) => {
    const { run, failures } = collector(testInfo);
    const ours = await open(context, 375, null, '/sign-in', signInReady);
    await rest(ours);
    const frame = frames.nth(11);
    await run([
      {
        name: 'b1-09-f11-mobile-form',
        reference: frame.locator('form'),
        product: ours.locator('form'),
      },
      {
        name: 'b1-09-f11-mobile-card',
        reference: frame.locator('.xp-auth-card'),
        product: ours.locator('.xp-auth-card'),
        deviation: 'DEV-21',
      },
    ]);
    expect(failures).toEqual([]);
  });
});

test.describe('B1-10 · SA-02 Requests on the built screen', () => {
  let frames: Locator;

  test.beforeEach(async ({ openBoardPage }) => {
    const { page: board } = await openBoardPage('B1-10-SA-Requests.dc.html', {
      uncrop: true,
      frameMinHeight: 900,
    });
    frames = board.locator('.b1-frame');
    await expect(frames).toHaveCount(10);
  });

  test('f0 · Requests · 1440', async ({ context }, testInfo) => {
    const { run, failures } = collector(testInfo);
    const ours = await open(context, 1440, ARJUN, '/admin/requests', requestsReady);
    await rest(ours);
    const frame = frames.nth(0);
    await run([
      {
        name: 'b1-10-f0-top-bar',
        reference: frame.locator('header.xr-top'),
        product: ours.locator('header.xr-top'),
      },
      {
        name: 'b1-10-f0-sidebar-head',
        reference: frame.locator('aside.xr-side .xr-side-head'),
        product: ours.locator('aside.xr-side .xr-side-head'),
      },
      {
        name: 'b1-10-f0-sidebar-help',
        reference: frame.locator('aside.xr-side .xr-side-foot'),
        product: ours.locator('aside.xr-side .xr-side-foot'),
      },
      {
        name: 'b1-10-f0-sidebar',
        reference: frame.locator('aside.xr-side'),
        product: ours.locator('aside.xr-side'),
        deviation: ['DEV-21', 'DEV-22'],
      },
      {
        name: 'b1-10-f0-header',
        reference: frame.locator('main .xr-phead'),
        product: ours.locator('main .xr-phead'),
      },
      {
        name: 'b1-10-f0-toolbar',
        reference: frame.locator('main .xr-toolbar'),
        product: ours.locator('main .xr-toolbar'),
      },
      {
        name: 'b1-10-f0-count',
        reference: frame.locator('main .xr-toolbar-status'),
        product: ours.locator('main .xr-toolbar-status'),
        deviation: 'DEV-22',
      },
      {
        // Auto table layout: the columns take their widths from the rows' words (DEV-22).
        name: 'b1-10-f0-table-head',
        reference: frame.locator('main table.xr-table thead'),
        product: ours.locator('main table.xr-table thead'),
        deviation: 'DEV-22',
      },
      {
        // REQ-0040's row holds the same words on the board and in the world: its reference link
        // and its status are compared as elements (the columns' widths follow the other rows).
        name: 'b1-10-f0-req-0040-reference',
        reference: frame.locator('td.is-primary a', { hasText: 'REQ-0040' }),
        product: ours.locator('td.is-primary a', { hasText: 'REQ-0040' }),
      },
      {
        name: 'b1-10-f0-req-0040-status',
        reference: frame.locator('tr', { hasText: 'REQ-0040' }).locator('.xr-status'),
        product: ours.locator('tr', { hasText: 'REQ-0040' }).locator('.xr-status'),
      },
      {
        name: 'b1-10-f0-table',
        reference: frame.locator('main .xr-table-wrap'),
        product: ours.locator('main .xr-table-wrap'),
        deviation: 'DEV-22',
      },
      {
        name: 'b1-10-f0-whole-frame',
        reference: frame.locator('.xr-app'),
        product: ours.locator('div.xr-app'),
        kind: 'screen',
        frame: true,
        deviation: ['DEV-21', 'DEV-22'],
      },
    ]);
    expect(failures).toEqual([]);
  });

  test('f1 · More filters open · External (1080)', async ({ context }, testInfo) => {
    const { run, failures } = collector(testInfo);
    const ours = await open(context, 1080, ARJUN, '/admin/requests', requestsReady);
    await ours.getByRole('button', { name: 'More filters' }).click();
    await ours
      .getByRole('group', { name: 'More filters' })
      .getByLabel('Internal or external')
      .selectOption({ label: 'External' });
    await expect(ours.getByRole('button', { name: 'More filters (1)' })).toBeVisible();
    await rest(ours);
    const frame = frames.nth(1);
    await run([
      {
        name: 'b1-10-f1-more-filters-toolbar',
        reference: frame.locator('main .xr-toolbar'),
        product: ours.locator('main .xr-toolbar'),
      },
      {
        name: 'b1-10-f1-more-filters-panel',
        reference: frame.locator('main .xp-morefilters'),
        product: ours.locator('main .xp-morefilters'),
      },
    ]);
    expect(failures).toEqual([]);
  });

  test('f4 · No match (720)', async ({ context }, testInfo) => {
    const { run, failures } = collector(testInfo);
    const ours = await open(context, 720, ARJUN, '/admin/requests', requestsReady);
    await ours.getByRole('searchbox', { name: 'Search' }).fill('Narmada');
    await expect(
      ours.getByRole('heading', { name: 'No requests match these filters' }),
    ).toBeVisible();
    await rest(ours);
    const frame = frames.nth(4);
    await run([
      {
        name: 'b1-10-f4-no-match',
        reference: frame.locator('main .xr-section'),
        product: ours.locator('main .xr-section'),
      },
    ]);
    expect(failures).toEqual([]);
  });

  test('f8 · Mobile 375', async ({ context }, testInfo) => {
    const { run, failures } = collector(testInfo);
    const ours = await open(context, 375, ARJUN, '/admin/requests', requestsReady);
    await rest(ours);
    const frame = frames.nth(8);
    await run([
      {
        name: 'b1-10-f8-mobile-top-bar',
        reference: frame.locator('header.xr-top'),
        product: ours.locator('header.xr-top'),
      },
      {
        name: 'b1-10-f8-mobile-header',
        reference: frame.locator('main .xr-phead'),
        product: ours.locator('main .xr-phead'),
      },
      {
        name: 'b1-10-f8-mobile-toolbar',
        reference: frame.locator('main .xr-toolbar'),
        product: ours.locator('main .xr-toolbar'),
      },
    ]);
    expect(failures).toEqual([]);
  });
});

test.describe('B1-11 · SA-03 Request decision on the built screen', () => {
  let frames: Locator;

  test.beforeEach(async ({ openBoardPage }) => {
    const { page: board } = await openBoardPage('B1-11-SA-Decision.dc.html', {
      uncrop: true,
      frameMinHeight: 900,
    });
    frames = board.locator('.b1-frame');
    await expect(frames).toHaveCount(17);
  });

  test('f16 · Renewal · 1060 (REQ-0038)', async ({ context }, testInfo) => {
    const { run, failures } = collector(testInfo);
    const ours = await open(context, 1060, ARJUN, '/admin/requests/REQ-0038', decisionReady);
    await rest(ours);
    const frame = frames.nth(16);
    // Each section is a region named by its H2, on the board and in the product.
    const section = (page: Page | Locator, name: string) =>
      page.locator('main').getByRole('region', { name, exact: true });
    await run([
      {
        name: 'b1-11-f16-top-bar',
        reference: frame.locator('header.xr-top'),
        product: ours.locator('header.xr-top'),
        deviation: 'DEV-25',
      },
      {
        name: 'b1-11-f16-back-link',
        reference: frame.locator('main a.xr-back'),
        product: ours.locator('main a.xr-back'),
        deviation: 'DEV-23',
      },
      {
        // "Received 26 Sep 2026, 16:02" against the drawn 24 Sep (DEV-22's text): inside the
        // component tolerance, so compared unregistered.
        name: 'b1-11-f16-header',
        reference: frame.locator('main .xr-phead'),
        product: ours.locator('main .xr-phead'),
      },
      {
        name: 'b1-11-f16-summary',
        reference: frame.locator('main section[aria-label="Summary"]'),
        product: ours.locator('main section[aria-label="Summary"]'),
        deviation: 'DEV-22',
      },
      {
        name: 'b1-11-f16-organisation',
        reference: section(frame, 'Organisation and contact person'),
        product: section(ours, 'Organisation and contact person'),
      },
      {
        name: 'b1-11-f16-message',
        reference: section(frame, 'Message from the requester'),
        product: section(ours, 'Message from the requester'),
      },
      {
        name: 'b1-11-f16-four-events',
        reference: frame.locator('main details.xr-section'),
        product: ours.locator('main details.xr-section'),
      },
      {
        name: 'b1-11-f16-panel',
        reference: frame.locator('aside.xr-dpanel'),
        product: ours.locator('aside.xr-dpanel'),
      },
    ]);
    expect(failures).toEqual([]);
  });

  test('f3 · Confirm · internal — the effects (REQ-0038, 520)', async ({ context }, testInfo) => {
    const { run, failures } = collector(testInfo);
    // B1-11 f3 draws the dialog in a 520 px frame inside the canvas scrim's 16 px gutter (488 px);
    // the product dialog has the same gutter (PF-04) at a 520 px viewport. Only the effect lines
    // are compared: below 600 px the product draws the dialog as board 10's bottom sheet, while
    // the canvas frame keeps the centred box (board 10's dialog is compared in Phase 0).
    const ours = await open(context, 520, ARJUN, '/admin/requests/REQ-0038', decisionReady);
    const panel = ours.getByRole('complementary', { name: 'Your decision' });
    await panel.locator('label[for="decision-approve"]').click();
    await panel.getByRole('button', { name: 'Approve request' }).click();
    const dialog = ours.getByRole('dialog', { name: 'Approve REQ-0038?' });
    await expect(dialog).toBeVisible();
    await rest(ours);
    const drawn = frames.nth(3).locator('.xr-dialog');
    // B1-11 f3 confirms REQ-0042, a new institution: its first line creates the record; the
    // renewal's three other lines are the same words.
    await run(
      [1, 2, 3].map((index) => ({
        name: `b1-11-f3-confirm-internal-line-${index}`,
        reference: drawn.locator('.xr-dialog-body li').nth(index),
        product: dialog.locator('.xr-dialog-body li').nth(index - 1),
      })),
    );
    expect(failures).toEqual([]);
  });

  test('f15 · Mobile 375 — the jump link and the open panel (REQ-0040)', async ({
    context,
  }, testInfo) => {
    const { run, failures } = collector(testInfo);
    const ours = await open(context, 375, ARJUN, '/admin/requests/REQ-0040', decisionReady);
    await rest(ours);
    const frame = frames.nth(15);
    await run([
      {
        name: 'b1-11-f15-mobile-jump',
        reference: frame.locator('main a.xr-jump'),
        product: ours.locator('main a.xr-jump'),
      },
      {
        name: 'b1-11-f15-mobile-panel',
        reference: frame.locator('aside.xr-dpanel'),
        product: ours.locator('aside.xr-dpanel'),
      },
    ]);
    expect(failures).toEqual([]);
  });
});
