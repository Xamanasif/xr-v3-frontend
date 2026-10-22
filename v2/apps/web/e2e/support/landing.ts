import { expect, type Page } from '@playwright/test';
import { reachAndClick } from '@xr/testing/browser';

import { checkState } from './screen-checks';

/**
 * The public landing at `/` — the V1 Direction B2 landing (owner-authorised prompt 13) — draws its
 * own header and footer, outside the v46 public shell (owner decision D-13). Its header keeps the
 * frozen layout plus “Sign in” (D-3): Featured · Formats · For institutions · Sign in and the gold
 * “Browse the catalogue” (“Catalogue” on a phone) at ≥ 1024 px; Sign in and the gold button below.
 * Areas, Selection and Request access stay reachable from the catalogue pages' v46 header.
 */
export async function onLanding(page: Page): Promise<boolean> {
  return (await page.locator('[data-landing="v1"]').count()) > 0;
}

const landingHeader = (page: Page) => page.locator('header.pl1-hdr');

/** From the landing: its header's Sign in, to the sign-in card. */
export async function landingSignIn(page: Page): Promise<void> {
  await reachAndClick(
    page,
    landingHeader(page).getByRole('link', { name: 'Sign in', exact: true }),
  );
  await page.waitForURL('**/sign-in');
}

/** From the landing: its header's gold catalogue button, to PU-04. */
export async function landingCatalogue(page: Page): Promise<void> {
  await reachAndClick(
    page,
    landingHeader(page).getByRole('link', { name: /^(Browse the catalogue|Catalogue)$/ }),
  );
  await page.waitForURL((url) => url.pathname === '/experiments');
}

/**
 * The checks every built state passes (`checkState`), on the landing, with the story's stage
 * pinned. The frozen story fades its step index in from 25 % opacity while the stage enters
 * (21 FROZEN 1347 `ixo`, 659 `--sxo`), where axe reads its words at 1.5:1: that entry fade is the
 * frozen design's own, recorded as an open conflict for the owner (prompt 13 §5: not changed
 * without asking), so the page is checked with the index at full strength, as it is whenever the
 * stage can be used. Phones and reduced motion have no fade (tap and static modes).
 */
export async function checkLanding(page: Page, heading = 'Set the conditions.'): Promise<void> {
  if ((await page.locator('.pl1-root').getAttribute('data-smode')) === 'scroll') {
    await page.evaluate(() => {
      const track = document.querySelector<HTMLElement>('.pl1-track')!;
      const stage = document.querySelector<HTMLElement>('.pl1-stage')!;
      const top = track.getBoundingClientRect().top + scrollY;
      window.scrollTo(0, Math.round(top - parseFloat(getComputedStyle(stage).top) + 140));
    });
    await expect(page.locator('.pl1-idx')).toHaveCSS('opacity', '1');
  }
  await checkState(page, heading);
}
