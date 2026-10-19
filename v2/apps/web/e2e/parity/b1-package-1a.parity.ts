import type { BrowserContext, Locator, Page, TestInfo } from '@playwright/test';

import { compareAll } from '../../../../tools/board-capture/src/parity.mjs';
import { bootWorld, type SamplePerson } from '../support';
import { type CompareItem, expect, recordSuperseded, test } from './support';

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
 *
 * Since the V3 integrations the B1-09 comparisons are retired by name for the Entry & shared
 * sign-in (XS-v6), and B1-10 and B1-11 are superseded entirely by the Super Admin screens (SA-v1):
 * see docs/v3/V3-COMPARISON-MAP.json.
 */
const SPINE_START = 'spine-start';
const FROZEN = new Date('2026-10-02T10:00:00+05:30');

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
  await expect(page.locator('.xs-card h1')).toHaveText('Sign in');
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
        reference: frame.locator('.xs-card > button.xr-btn--secondary'),
        product: ours.locator('.xs-card > button.xr-btn--secondary'),
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
        // Package 1C: the card foot's "Request institutional access" leads to the built Selection.
        name: 'b1-09-f0-card',
        reference: frame.locator('.xs-card'),
        product: ours.locator('.xs-card'),
      },
      {
        // Package 1B: the top row's "Back to experiments" renders (the Landing is built), with
        // board 02's back icon (DEV-23); Package 1C: the card foot's line renders too.
        name: 'b1-09-f0-whole-frame',
        reference: frame.locator('.xp'),
        product: ours.locator('div.xp'),
        kind: 'screen',
        frame: true,
        deviation: ['DEV-23', 'DEV-24'],
      },
    ]);
    expect(failures).toEqual([]);
  });

  test('f3 · Wrong details · f4 · Missing fields (640)', async ({ context }, testInfo) => {
    const { run, failures } = collector(testInfo);
    const ours = await open(context, 640, null, '/sign-in', signInReady);
    const card = ours.locator('.xs-card');
    await card.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(card.locator('.rk-ferr', { hasText: 'Enter your password' })).toBeVisible();
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
    const card = ours.locator('.xs-card');
    await card.getByRole('button', { name: 'Sign in with your institution' }).click();
    await expect(card.getByText('Institution sign-in isn’t available right now')).toBeVisible();
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
        product: expired.locator('.xs-card .xr-notice').first(),
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
        reference: frame.locator('.xs-card'),
        product: ours.locator('.xs-card'),
      },
    ]);
    expect(failures).toEqual([]);
  });
});

/*
 * B1-10 (SA-02 Requests) and B1-11 (SA-03 Request decision) are superseded by the owner-approved
 * V3 Super Admin screens (design/v3-refined-b/roles/SA-v1; docs/v3/V3-COMPARISON-MAP.json): every
 * comparison of these boards is retired by name and recorded as such, nothing of them is captured,
 * and the screens' behaviour is checked by the browser suites at the four widths. The pins and the
 * register keep the v46 measurements as history.
 */
test('B1-10 · SA-02 Requests — superseded by the V3 Super Admin screen (SA-v1)', async () => {
  await recordSuperseded(test.info(), 'b1-10-');
});

test('B1-11 · SA-03 Request decision — superseded by the V3 Super Admin screen (SA-v1)', async () => {
  await recordSuperseded(test.info(), 'b1-11-');
});
