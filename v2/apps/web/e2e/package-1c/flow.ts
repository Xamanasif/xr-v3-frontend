import { expect, type Locator, type Page } from '@playwright/test';

import { reachAndClick } from '../support';
import { landingCatalogue, landingSignIn, onLanding } from '../support/landing';

/**
 * The public request through its screens (Phase-1 Package 1C; B1-05 → B1-06 → B1-07 → B1-08), as a
 * person does it: pointer clicks reached by scrolling (`reachAndClick`), typing into the drawn
 * fields. Nothing here sends a command any other way: the tab's own browser session sends the
 * request and keeps its ticket (O-05).
 */

/** The public header's row from 1024 px; the menu sheet below it (B1-01). */
export const wide = (page: Page) => (page.viewportSize()?.width ?? 0) >= 1024;

/**
 * A public header destination, by its link name. On the landing (its own header, owner decision
 * D-3) “Browse experiments” is its gold catalogue button and “Sign in” its Sign in; it has no
 * Areas or Selection link — those are reached from the catalogue's header.
 */
export async function headerLink(page: Page, name: string): Promise<void> {
  if (await onLanding(page)) {
    if (name === 'Browse experiments') return landingCatalogue(page);
    if (name === 'Sign in') return landingSignIn(page);
    throw new Error(`The landing's header has no “${name}”: open the catalogue first.`);
  }
  if (wide(page)) {
    await reachAndClick(
      page,
      page.locator('header .xp-nav').getByRole('link', { name, exact: true }),
    );
    return;
  }
  await reachAndClick(page, page.getByRole('button', { name: 'Menu' }));
  await reachAndClick(page, page.locator('#public-menu').getByRole('link', { name, exact: true }));
}

/** B1-07's continuity record (B1-13: Godavari Institute of Technology · Meera Iyer · 120 · Yearly). */
export const RECORD = {
  institution: 'Godavari Institute of Technology',
  contact: 'Meera Iyer',
  email: 'meera.iyer@godavari.edu.in',
  licences: '120',
  message:
    'We would like to start with the heat exchanger lab for our ME ZG523 cohort this term, in the browser and in VR.',
} as const;

export const SHELL_AND_TUBE = '/experiments/shell-and-tube-heat-exchanger';

/** The PU-06 panel (B1-05 "Get this for your institution"). */
export const panelOf = (page: Page) =>
  page.getByRole('complementary', { name: 'Get this for your institution' });

/** The visible one of a link drawn twice (PU-07's summary card ≥ 1024 px, its bottom bar below). */
export const shown = (locator: Locator) => locator.filter({ visible: true });

/** On PU-06: WEB + VR into the selection (B1-05; B1-13's record). */
export async function addShellAndTube(page: Page): Promise<void> {
  const panel = panelOf(page);
  await reachAndClick(page, panel.getByText('Browser'));
  await reachAndClick(page, panel.getByText('Virtual reality'));
  await reachAndClick(page, panel.getByRole('button', { name: 'Add to selection' }));
  await expect(panel.getByRole('status')).toContainText('Formats: WEB · VR');
}

/** On PU-08's details step: the record typed in, Yearly chosen. */
export async function fillDetails(page: Page): Promise<void> {
  await page.getByLabel('Institution name', { exact: true }).fill(RECORD.institution);
  await page.getByLabel('Contact person', { exact: true }).fill(RECORD.contact);
  await page.getByLabel('E-mail', { exact: true }).fill(RECORD.email);
  await page.getByLabel('Licences requested', { exact: true }).fill(RECORD.licences);
  await page.getByLabel(/^Message to BITS/).fill(RECORD.message);
  await reachAndClick(page, page.locator('label[for="request-term-2"]'));
  await expect(page.getByRole('radio', { name: /Yearly/ })).toBeChecked();
}

/**
 * From a page with the public header: the catalogue → Shell-and-Tube (WEB + VR) → Your selection →
 * the details → Review → Submit → Request sent. Resolves with the request's status address
 * (`/requests/rq-…`), read from PU-09's "Check request status" (never built from the reference).
 */
export async function sendRequest(page: Page): Promise<string> {
  await headerLink(page, 'Browse experiments');
  await page.waitForURL('**/experiments');
  await reachAndClick(page, page.getByRole('link', { name: 'Shell-and-Tube Heat Exchanger' }));
  await page.waitForURL(`**${SHELL_AND_TUBE}`);
  await addShellAndTube(page);
  await reachAndClick(page, panelOf(page).getByRole('link', { name: 'Go to selection' }));
  await page.waitForURL('**/selection');
  await reachAndClick(page, shown(page.getByRole('link', { name: 'Continue to request' })));
  await page.waitForURL('**/request-access');
  await fillDetails(page);
  await reachAndClick(page, page.getByRole('button', { name: 'Review request' }));
  await page.waitForURL('**/request-access?step=review');
  await reachAndClick(page, page.getByRole('button', { name: 'Submit request' }));
  await page.waitForURL('**/request-access/sent');
  const check = page.getByRole('link', { name: 'Check request status' });
  const address = await check.getAttribute('href');
  expect(address).toMatch(/^\/requests\/rq-\d{4}$/);
  return address!;
}

/** The status head of PU-10 (`div.xp-statushead`). */
export const statusHead = (page: Page) => page.locator('.xp-statushead');

/**
 * Opens an address in this tab through the app router, as a link would — keeping the document and
 * its sample world (ADR-0004 option A: an address typed into the bar starts a fresh world). The
 * requester keeps their request's address themselves: no product page lists it (R01 open: no
 * reference lookup, account or link is designed).
 */
export async function openInTab(page: Page, address: string): Promise<void> {
  await page.evaluate((href) => {
    (window as unknown as { next: { router: { push(href: string): void } } }).next.router.push(
      href,
    );
  }, address);
  await page.waitForURL(`**${address}`);
}

/** The public not-found page (PU-15), with nothing of any request on it. */
export async function expectHidden(page: Page): Promise<void> {
  await expect(
    page.getByRole('heading', { level: 1, name: 'We can’t find that page' }),
  ).toBeVisible();
  await expect(page.locator('main')).not.toContainText(/REQ-\d|Godavari|Meera|Konark|Bhatt/);
}
