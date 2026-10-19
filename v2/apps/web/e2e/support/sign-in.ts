import { expect, type Page } from '@playwright/test';

/** A sample person's sign-in e-mail (the sample world's records; never shown in product copy). */
export interface SampleCredential {
  readonly email: string;
}

/** Any non-empty password signs a known sample e-mail in (P1-01 / DV-3, local sample mode only). */
export const SAMPLE_PASSWORD = 'sample-password';

/**
 * Signs a sample person in through the designed sign-in form, as a person would (Appendix F §7.2:
 * "drives it for real at least once per role"; XS-01, board B1-09, built in Phase-1 Package 1A).
 *
 * It types the e-mail and a non-empty password into the card and presses "Sign in" — the session
 * port decides (ADR-0003). There is no other way in: no URL, query parameter, cookie or identity
 * UI. On a page that is not the sign-in card it first opens `/sign-in` — a document load, which
 * starts the tab's sample world afresh (ADR-0004); to keep a world, call it where the session
 * gate has already brought the page (`/sign-in?returnTo=…`, a client-side move). It resolves once
 * the card has handed over to the person's workspace.
 */
export async function signInAs(page: Page, person: SampleCredential): Promise<void> {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(person.email)) {
    throw new TypeError(`A sample person signs in with an e-mail address (got "${person.email}").`);
  }
  if (new URL(page.url(), 'http://x.invalid').pathname !== '/sign-in') {
    await page.goto('/sign-in');
  }
  const card = page.locator('.xs-card');
  await expect(card.getByRole('heading', { level: 1, name: 'Sign in' })).toBeVisible();
  await card.getByLabel('E-mail', { exact: true }).fill(person.email);
  await card.locator('#sign-in-password').fill(SAMPLE_PASSWORD);
  await card.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL((url) => url.pathname !== '/sign-in');
}
