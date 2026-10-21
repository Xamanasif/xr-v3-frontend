import { mkdirSync } from 'node:fs';
import { join } from 'node:path';

import { expect, type Locator, type Page, test } from '@playwright/test';

import { actAs, bootWorld, reachAndClick, switchIdentity, TEST_HOOKS_URL } from '../support';
import { checkState } from '../support/screen-checks';
import { currentSidebarItem, expectSameDocument, markDocument } from '../support/workspace';

/**
 * RV-04 Review an update (V3: the owner-approved Academic Reviewer export RV-v1, `RV.dc.html` item
 * view for an update; boards RV04, RV04-1024/768/375, -return-errors, -confirm, -approved,
 * -returned, -stale; RV06-update) and CM-08 Updates (V3: the Content Manager's correction tracker,
 * CM-v1; was B6-09 f0, B6-13 f2, B7-11 f2), with the update rows of RV-01, RV-02, RV-05 and CM-01
 * (V3: its desk's corrections) they open, on the test-hook build at 1440, 1024, 768 and 375, on
 * spine-start. Each drawn state passes `checkState` (axe WCAG A/AA, one h1, visible focus targets,
 * 24 × 24 targets, no developer surface, no sideways scroll) and shows no internal reference (the
 * owner's identifier rule; the reference stays in the address).
 *
 * The CI seam only SETS UP the world (Kavya Nair opens, saves and sends a correction; later
 * withdraws one). Everything the screens do is done by real clicks and typing; the identity
 * changes in the same tab and the same world (`switchIdentity`) for the cross-role proof:
 *
 * - (a) Flow 6 step 2: Prof. A. Menon finds the Distillation Column update in the Review queue →
 *   RV-04 → Approve update through its confirmation (“Approve the update to Distillation
 *   Column?”) → the public experiment page still shows the live version 1.2 (approval releases
 *   nothing) → Kavya Nair’s Updates list shows “Awaiting release decision” (V3: With others, the
 *   Super Admin's step now).
 * - (b) A second correction returned with a reason in the panel (the reason first required),
 *   reached from the Overview’s “Review the update to …” and again from Reviewed by me (RV-06, under
 *   Reviewed by me) → Kavya Nair’s list shows it returned (V3: Need you, her step now), and her
 *   Overview’s correction (V3: its “Continue”) opens it.
 * - (c) The list at spine-start (B6-13 f2), a draft not shown to the reviewer (the XS message), and
 *   an update withdrawn while the reviewer has it open.
 */
test.use({ baseURL: TEST_HOOKS_URL });
// The test-hook build is a dev server shared by parallel suites: pages compile on first hit.
test.describe.configure({ timeout: 180_000 });

const MENON = { personId: 'per-a-menon' };
const KAVYA = { personId: 'per-kavya-nair' };

const LIVE_DESCRIPTION =
  'Learners start a binary column from cold and bring it to steady state. They then change the reflux ratio and watch the overhead purity respond with realistic lag. Lowering the reflux ratio raises the overhead purity, at the cost of more reboiler heat.';
const CORRECTED_DESCRIPTION =
  'Learners start a binary column from cold and bring it to steady state. They then change the reflux ratio and watch the overhead purity respond with realistic lag. Raising the reflux ratio raises the overhead purity, at the cost of more reboiler heat.';
const NEW_LINK = 'https://labs.meridian.example/distillation-column-1-3';
const WHY =
  'Corrects the reflux statement in the description: raising the reflux ratio raises overhead purity — v1.2 says the opposite. The web link moves to build 1.3, which carries the same correction in its on-screen notes.';
const RETURN_REASON =
  'The corrected sentence is right. Please also say that the measured flow uses the 1.2 discharge coefficient.';
const DISTILLATION_TITLE = 'Distillation Column';
const ORIFICE_TITLE = 'Orifice Plate Metering';
/** The owner's identifier rule: no internal reference anywhere a reviewer reads or hears. */
const REFERENCE = /\b(?:REQ|ACC|UPD|DTR|SUP|SUB)-\d+/;

/** Where the product screenshots for the visual comparison go (the session scratchpad). */
const SHOTS =
  process.env['XR_PRODUCT_SHOTS'] ??
  '/private/tmp/claude-501/-Users-mymac-Desktop-AR-VR-frontend-v46/fca2accf-8a10-47fc-bc4c-75960334d92a/scratchpad/shots-product/review-update';

type PortAnswer<T> = { readonly ok: true; readonly value: T } | { readonly ok: false };
interface UpdateRef {
  readonly id: string;
  readonly rev: number;
  readonly proposed: Record<string, unknown>;
}

/** One port command as a sample person through the CI seam (set-up only), which must succeed. */
async function port<T>(
  page: Page,
  person: { readonly personId: string },
  portKey: string,
  method: string,
  input?: unknown,
): Promise<T> {
  const answer = await actAs<PortAnswer<T>>(page, person, { port: portKey, method, input });
  expect(answer.ok, `${portKey}.${method} ${JSON.stringify(answer)}`).toBe(true);
  return (answer as { readonly value: T }).value;
}

/**
 * Kavya Nair opens a correction (Edit catalogue details), changes it, labels it and — unless
 * `send` is false — sends it for academic review (set-up through the seam).
 */
async function propose(
  page: Page,
  experimentId: string,
  change: Record<string, unknown>,
  versionLabel: string,
  why: string,
  send = true,
): Promise<UpdateRef> {
  const opened = await port<{ readonly update: UpdateRef }>(
    page,
    KAVYA,
    'corrections',
    'openCorrection',
    { experimentId, entry: 'edit-catalogue-details' },
  );
  const saved = await port<UpdateRef>(page, KAVYA, 'corrections', 'saveCorrection', {
    id: opened.update.id,
    proposed: { ...opened.update.proposed, ...change },
    whatChangesAndWhy: why,
    versionLabel,
    expectedRev: opened.update.rev,
  });
  if (!send) return saved;
  return port<UpdateRef>(page, KAVYA, 'corrections', 'sendForAcademicReview', {
    id: saved.id,
    expectedRev: saved.rev,
  });
}

/** B6-04’s correction: the reflux sentence and the web link, version 1.3 (UPD-0005). */
function proposeDistillation(page: Page, send = true): Promise<UpdateRef> {
  return propose(
    page,
    'distillation-column',
    { description: CORRECTED_DESCRIPTION, webLink: NEW_LINK },
    '1.3',
    WHY,
    send,
  );
}

const main = (page: Page) => page.locator('main');
const heading = (page: Page, name: string) => page.getByRole('heading', { level: 1, name });
const width = (page: Page) => page.viewportSize()?.width ?? 1440;
const panel = (page: Page) => page.getByRole('complementary', { name: 'Your decision' });
const decided = (page: Page) => page.locator('#rv-done');
const refusal = (page: Page) => page.locator('#rv-refusal');
/** The identity card's status (`header.rv-idcard span.rv-meta-main .xr-st`). */
const chip = (page: Page) => main(page).locator('header.rv-idcard .rv-meta-main .xr-st');
const historyWhat = (page: Page) =>
  page.getByRole('region', { name: 'Update history' }).locator('ol.rk-tl > li .rk-tl-w');

/**
 * No internal reference in the page's words, its names and descriptions, an open dialog or the
 * tab's title; `except` leaves out the named exception (the seeded reason quoted as written).
 */
async function expectNoReference(page: Page, except?: string): Promise<void> {
  const found = await page.evaluate(
    ({ pattern, skip }) => {
      const reference = new RegExp(pattern);
      const words: string[] = [document.title];
      for (const root of [
        document.querySelector('main'),
        ...document.querySelectorAll('dialog[open]'),
      ]) {
        if (!root) continue;
        const text = (root as HTMLElement).innerText;
        words.push(skip ? text.split(skip).join('') : text);
        for (const element of root.querySelectorAll('*')) {
          for (const name of ['aria-label', 'title', 'placeholder', 'alt', 'value']) {
            words.push(element.getAttribute(name) ?? '');
          }
        }
      }
      return words.filter((word) => reference.test(word));
    },
    { pattern: REFERENCE.source, skip: except ?? null },
  );
  expect(found).toEqual([]);
}
/** CM-08's V3 tracker (CM-v1): every card in page order — Need you, With others, Closed. */
const trackerCards = (page: Page) => main(page).locator('section.cm-trksec li.cm-trk');
/**
 * The tracker's card of one correction: its link opens the update's address (no page shows the
 * reference itself — the owner's 20 Oct 2026 correction, SA-v1 rule).
 */
const trackerCard = (page: Page, id: string) =>
  trackerCards(page).filter({
    has: page.locator(`a[href="/content-manager/updates/${id}"]`),
  });
/** Who has a correction now: its card's mini track's current step (none once closed). */
const holder = (card: Locator) => card.locator('[aria-current="step"]');
/** The tracker group (`section.cm-trksec`) a card is in, by its heading. */
const trackerGroup = (page: Page, name: string) =>
  main(page)
    .locator('section.cm-trksec')
    .filter({ has: page.getByRole('heading', { level: 2, name: new RegExp(`^${name}`) }) });

async function shot(page: Page, name: string): Promise<void> {
  mkdirSync(SHOTS, { recursive: true });
  await page.screenshot({ path: join(SHOTS, `${name}-${width(page)}.png`), fullPage: true });
}

/** A board frame drawn at 720: the 768 run takes it at 720 too. */
async function shotAt720(page: Page, name: string): Promise<void> {
  if (width(page) !== 768) return;
  await page.setViewportSize({ width: 720, height: 1024 });
  await shot(page, name);
  await page.setViewportSize({ width: 768, height: 1024 });
}

/** Client-side navigation (the world lives in the tab: a full load would start it again). */
async function softNavigate(page: Page, href: string): Promise<void> {
  await page.evaluate((target) => {
    (window as unknown as { next: { router: { push(href: string): void } } }).next.router.push(
      target,
    );
  }, href);
}

/** A link reached and pressed: Enter after focus (a wrapped inline link at 375), else a click. */
async function follow(page: Page, link: Locator): Promise<void> {
  if (width(page) <= 375) {
    await link.focus();
    await page.keyboard.press('Enter');
  } else {
    await reachAndClick(page, link);
  }
}

/**
 * The item page (`div.rk-detail.rv-detail`): the panel beside the content on wide pages (1440),
 * under it on one column with “Go to decision” in the identity card (RV04-1024, -768, -375).
 */
async function expectDecisionLayout(page: Page): Promise<void> {
  const content = await main(page).locator('.rk-detail.rv-detail > .rv-main').boundingBox();
  const aside = await panel(page).boundingBox();
  if (!content || !aside) throw new Error('not laid out');
  const goTo = main(page).locator('header.rv-idcard a.rk-goto');
  if (aside.x >= content.x + content.width - 1) {
    await expect(goTo).toBeHidden();
  } else {
    expect(aside.y).toBeGreaterThan(content.y + content.height - 1);
    await expect(goTo).toBeVisible();
  }
  if (width(page) === 1440) expect(aside.x).toBeGreaterThan(content.x + content.width - 1);
}

/** On one column, “Go to decision” moves focus to the panel's heading. */
async function goToDecision(page: Page): Promise<void> {
  const goTo = main(page).locator('header.rv-idcard a.rk-goto');
  if (!(await goTo.isVisible())) return;
  await goTo.focus();
  await page.keyboard.press('Enter');
  await expect(panel(page).getByRole('heading', { name: 'Your decision' })).toBeFocused();
}

/**
 * CM-08's tracker cards (V3, CM-v1 `cm.css`): below 700 px of the tracker (its container query) a
 * card stacks — the status first, the action last at the card's full width; wider, the status and
 * the action sit to the right of the card's name.
 */
async function expectTrackerLayout(page: Page): Promise<void> {
  const list = main(page).locator('ul.cm-trklist').first();
  const card = list.locator('li.cm-trk').first();
  const name = await card.locator('.cm-trk-id').boundingBox();
  const status = await card.locator('.cm-trk-st').boundingBox();
  const action = await card.locator('.cm-trk-act a').boundingBox();
  const listWidth = await list.evaluate((element) => element.getBoundingClientRect().width);
  if (!name || !status || !action) throw new Error('not laid out');
  if (listWidth < 700) {
    expect(status.y + status.height).toBeLessThanOrEqual(name.y + 1);
    expect(action.y).toBeGreaterThanOrEqual(name.y + name.height - 1);
    expect(action.width).toBeGreaterThan(name.width - 2);
  } else {
    expect(status.x).toBeGreaterThanOrEqual(name.x + name.width - 1);
    expect(action.x).toBeGreaterThanOrEqual(name.x + name.width - 1);
  }
}

/** The breadcrumb names the experiment under its list; the rail keeps the Review queue current. */
async function expectReviewShell(
  page: Page,
  parent: 'Review queue' | 'Reviewed by me',
  name: string,
): Promise<void> {
  if (parent === 'Review queue') {
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/reviewer/queue');
  }
  const crumbs = main(page).getByRole('navigation', { name: 'Breadcrumb' });
  await expect(crumbs.getByRole('link')).toHaveText([parent]);
  await expect(crumbs.locator('[aria-current="page"]')).toHaveText(name);
  await expect(page).toHaveTitle(new RegExp(`^${name} · ${parent}`));
}

test.describe('RV-04 Review an update and CM-08 Updates', () => {
  test('(a) Flow 6 step 2: queue → RV-04 (RV04) → Approve update through its confirmation (RV04-approved); nothing is released; her list says “Awaiting release decision · Super Admin”', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'spine-start', session: MENON });
    await page.goto('/reviewer/queue');
    await expect(heading(page, 'Review queue')).toBeVisible({ timeout: 90_000 });
    const mark = await markDocument(page);
    // Set-up through the seam: Kavya Nair sends the correction for academic review.
    const sent = await proposeDistillation(page);
    expect(sent.id).toBe('UPD-0005');

    // The Review queue lists it, named by the experiment (never its reference): the row opens RV-04.
    const rowLink = main(page).getByRole('link', {
      name: /^Distillation Column, update 1\.2 → 1\.3, waiting since .+\. Review it$/,
    });
    await expect(rowLink).toHaveCount(1);
    await follow(page, rowLink);
    await expect(page).toHaveURL(/\/reviewer\/updates\/UPD-0005$/, { timeout: 60_000 });
    await expect(heading(page, DISTILLATION_TITLE)).toBeVisible({ timeout: 90_000 });
    await expectSameDocument(page, mark);

    // RV04: the identity card, why, what changes, the live experiment, the history, the open panel.
    const card = main(page).locator('header.rv-idcard');
    await expect(card.locator('.rv-kind.rv-kind--update .rv-kind-t')).toHaveText('Update');
    await expect(card.locator('.rv-kind-d')).toHaveText('1.2 → 1.3');
    await expect(chip(page)).toHaveText('Waiting for your decision');
    await expect(card.locator('.rv-meta-course')).toHaveText(
      /^CHE ZG513\s*Process Instrumentation & Control$/,
    );
    await expect(card.locator('.rv-meta-who')).toHaveText('From Kavya Nair, Content Manager');
    await expect(card.locator('.rv-id-fact dt')).toHaveText([
      'Live version',
      'Proposed version',
      'Waiting',
      'Formats',
    ]);
    await expect(card.locator('.rv-id-fact dd').last()).toHaveText('WEB · VR');
    await expect(
      page.getByRole('navigation', { name: 'On this page' }).getByRole('link'),
    ).toHaveText([
      'Why this correction',
      /^What changes\s*3$/,
      'Live experiment',
      'Update history',
    ]);
    await expect(
      page.getByRole('region', { name: 'Why this correction' }).locator('blockquote > p').first(),
    ).toHaveText(WHY);
    const changes = page.getByRole('table', { name: 'What changes, live now against proposed' });
    await expect(changes.locator('.rv-cmp-f')).toHaveText([
      'Description',
      'WEB · web link',
      'Version',
    ]);
    await expect(changes.locator('.rv-cmp-v--was').first()).toContainText(LIVE_DESCRIPTION);
    await expect(changes.locator('.rv-cmp-v:not(.rv-cmp-v--was)').first()).toContainText(
      CORRECTED_DESCRIPTION,
    );
    await expect(changes.locator('del')).toHaveText(['Lowering', '1.2']);
    await expect(changes.locator('ins')).toHaveText(['Raising', '-1-3', '1.3']);
    const live = page.getByRole('region', { name: 'The live experiment' });
    await expect(live.locator('ol.rv-lo-ro li')).toHaveText([
      'Bring a column to steady state from cold start',
      'Tune reflux ratio against an overhead purity target',
    ]);
    await expect(historyWhat(page)).toHaveText([
      'Sent for academic review',
      'Correction started from the published experiment',
    ]);
    await expect(panel(page).getByRole('radio', { name: 'Approve update' })).not.toBeChecked();
    await expectReviewShell(page, 'Review queue', DISTILLATION_TITLE);
    await expectDecisionLayout(page);
    await checkState(page, DISTILLATION_TITLE);
    await expectNoReference(page);
    await shot(page, 'rv04-review');
    await goToDecision(page);

    // The confirmation: approval goes to the Super Admin; the live version stays.
    await reachAndClick(page, panel(page).getByRole('radio', { name: 'Approve update' }));
    await reachAndClick(page, panel(page).getByRole('button', { name: 'Approve update' }));
    const dialog = page.getByRole('dialog', { name: 'Approve the update to Distillation Column?' });
    await expect(dialog).toBeVisible();
    await expect(dialog.locator('.rk-dlg-now li')).toHaveText([
      'It goes to the Super Admin for a release decision.',
      'It leaves your review queue and is listed in Reviewed by me.',
    ]);
    await expect(dialog.locator('.rk-dlg-later li')).toHaveText([
      'Version 1.3 goes live only if the Super Admin releases it. Version 1.2 stays live until then.',
      'Releasing changes no one’s access.',
    ]);
    await expect(
      dialog.getByRole('heading', { name: 'Approve the update to Distillation Column?' }),
    ).toBeFocused();
    await checkState(page, DISTILLATION_TITLE);
    await expectNoReference(page);
    await shot(page, 'rv04-confirm');
    await reachAndClick(page, dialog.getByRole('button', { name: 'Approve update' }));
    await expect(dialog).toBeHidden();

    // Approved — with the Super Admin; the outcome is focused.
    await expect(decided(page).locator('.xr-st.xr-st--ok')).toHaveText(
      'Approved — with the Super Admin',
    );
    await expect(decided(page)).toBeFocused();
    await expect(decided(page)).toContainText(
      'Version 1.2 stays live. Release or hold is the Super Admin’s decision.',
    );
    await expect(chip(page)).toHaveText('Approved — with the Super Admin');
    await expect(historyWhat(page)).toHaveText([
      'Approved by Prof. A. Menon',
      'Sent for academic review',
      'Correction started from the published experiment',
    ]);
    await expect(
      decided(page).getByRole('link', { name: 'Back to the review queue' }),
    ).toHaveAttribute('href', '/reviewer/queue');
    await checkState(page, DISTILLATION_TITLE);
    await expectNoReference(page);
    await shot(page, 'rv04-approved');

    // Approval releases nothing: the public experiment page still reads the live version 1.2.
    await softNavigate(page, '/experiments/distillation-column');
    await expect(heading(page, 'Distillation Column')).toBeVisible({ timeout: 90_000 });
    await expect(page.locator('main')).toContainText('Lowering the reflux ratio raises');
    await expect(page.locator('main')).not.toContainText('Raising the reflux ratio raises');
    await expectSameDocument(page, mark);

    // Kavya Nair’s Updates (same tab, same world): awaiting the Super Admin’s release decision —
    // V3 (CM-v1): with others, the Super Admin's step now.
    await switchIdentity(page, KAVYA);
    await softNavigate(page, '/content-manager/updates');
    await expect(heading(page, 'Updates')).toBeVisible({ timeout: 90_000 });
    const mine = trackerCard(page, 'UPD-0005');
    await expect(mine.locator('.cm-qname')).toHaveText('Distillation Column');
    await expect(mine.locator('.cm-trk-meta > span:first-child')).toHaveText(
      /^CHE ZG513 · .* · last change \d{1,2} [A-Z][a-z]{2}$/,
    );
    await expect(mine.locator('.cm-ver')).toHaveText(/^1\.2 live\s*1\.3 proposed$/);
    await expect(mine.locator('.cm-trk-st .xr-st')).toHaveText('Awaiting release decision');
    await expect(mine.locator('.cm-trk-st .xr-st')).toHaveClass(/xr-st--info/);
    await expect(holder(mine)).toHaveText(/^Now: Super Admin\s*Release decision/);
    await expect(
      trackerGroup(page, 'With others')
        .locator('li.cm-trk')
        .filter({ has: page.locator('a[href="/content-manager/updates/UPD-0005"]') }),
    ).toHaveCount(1);
    await expect(mine.locator('.cm-trk-act a')).toHaveText('Open');
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/content-manager/updates');
    await expectTrackerLayout(page);
    await checkState(page, 'Updates');
    if (width(page) === 1440) await shot(page, 'b7-11-f2-updates');
    await follow(
      page,
      mine.getByRole('link', {
        name: 'Open the update to Distillation Column, version 1.3, awaiting release decision',
      }),
    );
    await expect(page).toHaveURL(/\/content-manager\/updates\/UPD-0005$/, { timeout: 60_000 });
    await expectSameDocument(page, mark);
  });

  test('(b) Return to the Content Manager in the panel (reason required; RV04-return-errors, RV04-returned) from the Overview; Reviewed by me opens it (RV06-update); her list: “Returned · You · Continue”', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'spine-start', session: MENON });
    await page.goto('/reviewer');
    await expect(heading(page, 'Overview')).toBeVisible({ timeout: 90_000 });
    const mark = await markDocument(page);
    // Set-up: a correction to Orifice Plate Metering (1.1 → 1.2), sent for academic review.
    const sent = await propose(
      page,
      'orifice-plate-metering',
      {
        summary:
          'Calibrate against a reference meter and propagate the instrument uncertainty into the reported flow and its interval.',
      },
      '1.2',
      'Names the reported interval in the summary, as the lab handout does.',
    );

    // RV-01: the update's “Review the update to …” opens RV-04 (named by the experiment).
    await follow(
      page,
      main(page).getByRole('link', { name: 'Review the update to Orifice Plate Metering' }),
    );
    await expect(page).toHaveURL(new RegExp(`/reviewer/updates/${sent.id}$`), { timeout: 60_000 });
    await expect(heading(page, ORIFICE_TITLE)).toBeVisible({ timeout: 90_000 });
    await expectSameDocument(page, mark);
    await goToDecision(page);

    // Return to the Content Manager: the reason, in the panel, first required.
    await reachAndClick(
      page,
      panel(page).getByRole('radio', { name: 'Return to the Content Manager' }),
    );
    const reason = panel(page).getByRole('textbox', {
      name: 'Reason the Content Manager will see (required)',
    });
    await expect(reason).toBeVisible();
    await expect(panel(page).getByRole('checkbox')).toHaveCount(0);
    await expect(panel(page).locator('p.rk-pending')).toHaveText(
      'Add the reason before you return it.',
    );
    const go = panel(page).getByRole('button', { name: 'Return to the Content Manager' });
    await reachAndClick(page, go);
    const summary = panel(page).locator('#rv-errs');
    await expect(summary).toBeFocused();
    await expect(summary.getByRole('link')).toHaveText([
      'Add a reason so the Content Manager knows what to change',
    ]);
    await expect(panel(page).locator('.rk-field .rk-ferr')).toHaveText(
      'Add a reason so the Content Manager knows what to change',
    );
    await expect(reason).toHaveAttribute('aria-invalid', 'true');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await checkState(page, ORIFICE_TITLE);
    await expectNoReference(page);
    await shot(page, 'rv04-return-errors');
    await reason.fill(RETURN_REASON);
    await reachAndClick(page, go);

    // Returned to the Content Manager, read-only for the reviewer.
    await expect(decided(page).locator('.xr-st.xr-st--err')).toHaveText(
      'Returned to the Content Manager',
    );
    await expect(decided(page)).toBeFocused();
    await expect(decided(page).locator('.rv-done-q')).toContainText(`“${RETURN_REASON}”`);
    await expect(decided(page)).toContainText(
      'The Content Manager can change it and send it again.',
    );
    await expect(chip(page)).toHaveText('Returned to the Content Manager');
    await expect(historyWhat(page).first()).toHaveText('Returned by Prof. A. Menon');
    await checkState(page, ORIFICE_TITLE);
    await expectNoReference(page);
    await shot(page, 'rv04-returned');

    // RV-05 Reviewed by me: the decided update's row opens it read-only (RV-06), under Reviewed by me.
    await softNavigate(page, '/reviewer/reviewed');
    await expect(heading(page, 'Reviewed by me')).toBeVisible({ timeout: 90_000 });
    await follow(
      page,
      main(page).getByRole('link', {
        name: /^Orifice Plate Metering, returned to the content manager on .+\. Open it$/,
      }),
    );
    await expect(heading(page, ORIFICE_TITLE)).toBeVisible({ timeout: 90_000 });
    await expect(decided(page).locator('.xr-st.xr-st--err')).toHaveText(
      'Returned to the Content Manager',
    );
    await expect(
      decided(page).getByRole('link', { name: 'Back to Reviewed by me' }),
    ).toHaveAttribute('href', '/reviewer/reviewed');
    await expectReviewShell(page, 'Reviewed by me', ORIFICE_TITLE);
    await expect(page.getByRole('region', { name: 'Update history' })).toHaveClass(/rv-hist--card/);
    await checkState(page, ORIFICE_TITLE);
    await expectNoReference(page);
    await shot(page, 'rv06-update');
    await expectSameDocument(page, mark);

    // Kavya Nair: “Returned · You · Continue” — V3 (CM-v1): Need you, her step now, Continue; her
    // Overview's correction opens it.
    await switchIdentity(page, KAVYA);
    await softNavigate(page, '/content-manager/updates');
    await expect(heading(page, 'Updates')).toBeVisible({ timeout: 90_000 });
    const mine = trackerCard(page, sent.id);
    await expect(mine.locator('.cm-qname')).toHaveText('Orifice Plate Metering');
    await expect(mine.locator('.cm-trk-meta > span:first-child')).toHaveText(
      /^CHE ZG513 · .* · last change \d{1,2} [A-Z][a-z]{2}$/,
    );
    await expect(mine.locator('.cm-ver')).toHaveText(/^1\.1 live\s*1\.2 proposed$/);
    await expect(mine.locator('.cm-trk-st .xr-st')).toHaveText('Returned');
    await expect(mine.locator('.cm-trk-st .xr-st')).toHaveClass(/xr-st--err/);
    await expect(mine).toHaveClass(/\bis-you\b/);
    await expect(
      trackerGroup(page, 'Need you')
        .locator('li.cm-trk')
        .filter({ has: page.locator(`a[href="/content-manager/updates/${sent.id}"]`) }),
    ).toHaveCount(1);
    await expect(holder(mine)).toHaveText(/^Your step, now: You/);
    await expect(mine.locator('blockquote.cm-trk-note')).toContainText(RETURN_REASON);
    await expect(
      mine.getByRole('link', {
        name: 'Continue the update to Orifice Plate Metering, version 1.2, returned',
      }),
    ).toHaveAttribute('href', `/content-manager/updates/${sent.id}`);
    await checkState(page, 'Updates');
    await softNavigate(page, '/content-manager');
    await expect(heading(page, 'Overview')).toBeVisible({ timeout: 90_000 });
    const needs = page.getByRole('region', { name: 'Needs your decision' });
    // CM-01 (V3, CM-v1): the desk's “Corrections that need you” row.
    const returned = needs
      .getByRole('region', { name: 'Corrections that need you' })
      .locator('li.cm-orow')
      .filter({ hasText: 'Orifice Plate Metering' });
    await expect(returned.locator('.rb-row-t')).toHaveText('Orifice Plate Metering');
    await expect(returned.locator('.cm-orow-x')).toHaveText(
      /^Returned to you\s*1\.1 live\s*1\.2 proposed$/,
    );
    await follow(
      page,
      returned.getByRole('link', {
        name: 'Continue the update to Orifice Plate Metering',
      }),
    );
    await expect(page).toHaveURL(new RegExp(`/content-manager/updates/${sent.id}$`), {
      timeout: 60_000,
    });
    await expectSameDocument(page, mark);
  });

  test('(c) the list at spine-start (B6-13 f2); a draft is not the reviewer’s (the XS message); withdrawn while open', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'spine-start', session: KAVYA });
    await page.goto('/content-manager/updates');
    await expect(heading(page, 'Updates')).toBeVisible({ timeout: 90_000 });
    const mark = await markDocument(page);
    // V3 (CM-v1): the chain said under the title; the count; the cards grouped by who must act.
    await expect(main(page).locator('.rb-head .rk-sub')).toHaveText(
      'Corrections you raised to published experiments. Live content changes only this way: you, then the Academic Reviewer, then the Super Admin’s release.',
    );
    await expect(main(page).locator('.cm-trkcount')).toHaveText(
      '5 corrections you raised, most recent change first',
    );
    await expect(main(page).locator('section.cm-trksec h2')).toHaveText([
      /^Need you\s*1$/,
      /^With others\s*1$/,
      /^Closed\s*3$/,
    ]);
    await expect(trackerCards(page).locator('.cm-qname')).toHaveText([
      'Induction Motor Loading',
      'Boiler Drum Level',
      'Orifice Plate Metering',
      'Distillation Column',
      'Distillation Column',
    ]);
    // No reference in the meta (the course leads); each card opens its update's address.
    await expect(trackerCards(page).locator('.cm-trk-meta > span:first-child')).toHaveText([
      /^EEE ZC341 · /,
      /^CHE ZG513 · /,
      /^CHE ZG513 · /,
      /^CHE ZG513 · /,
      /^CHE ZG513 · /,
    ]);
    expect(
      await trackerCards(page)
        .getByRole('link')
        .evaluateAll((links) => links.map((link) => link.getAttribute('href'))),
    ).toEqual([
      '/content-manager/updates/UPD-0006',
      '/content-manager/updates/UPD-0004',
      '/content-manager/updates/UPD-0003',
      '/content-manager/updates/UPD-0002',
      '/content-manager/updates/UPD-0001',
    ]);
    await expect(trackerCards(page).locator('.cm-ver')).toHaveText([
      /^1\.0 live\s*1\.1 proposed$/,
      /^2\.0 live\s*2\.1 proposed$/,
      /^1\.0\s*1\.1 live$/,
      /^1\.1\s*1\.2 live$/,
      /^1\.0\s*1\.1 live$/,
    ]);
    await expect(trackerCards(page).locator('.cm-trk-st .xr-st')).toHaveText([
      'Returned',
      'On hold',
      'Released',
      'Released',
      'Released',
    ]);
    // Who has each (v46: You, Super Admin, —): the open cards' current step; the closed have none.
    await expect(trackerCards(page).locator('[aria-current="step"]')).toHaveText([
      /^Your step, now: You/,
      /^On hold: Super Admin/,
    ]);
    await expect(main(page).locator('li.cm-trk.is-closed [aria-current="step"]')).toHaveCount(0);
    await expect(trackerCards(page).locator('.cm-trk-act a')).toHaveText([
      'Continue',
      'Open',
      'Open',
      'Open',
      'Open',
    ]);
    await expect(currentSidebarItem(page)).toHaveAttribute('href', '/content-manager/updates');
    await expectTrackerLayout(page);
    await checkState(page, 'Updates');
    if (width(page) === 1440) await shot(page, 'b6-13-f2-updates');
    if (width(page) === 375) await shot(page, 'b6-09-updates-stacked');
    await shotAt720(page, 'b6-09-updates-720');
    // “Continue” opens the returned correction.
    await follow(
      page,
      trackerCards(page).first().getByRole('link', {
        name: 'Continue the update to Induction Motor Loading, version 1.1, returned',
      }),
    );
    await expect(page).toHaveURL(/\/content-manager\/updates\/UPD-0006$/, { timeout: 60_000 });
    await expectSameDocument(page, mark);
    await softNavigate(page, '/content-manager/updates');
    await expect(heading(page, 'Updates')).toBeVisible({ timeout: 90_000 });

    // A draft (set-up): hers to continue, never shown to the Academic Reviewer.
    const draft = await proposeDistillation(page, false);
    const first = trackerCards(page).first();
    await expect(first.locator('.cm-qname')).toHaveText('Distillation Column');
    await expect(first.locator('.cm-trk-meta > span:first-child')).toHaveText(
      /^CHE ZG513 · .* · last change \d{1,2} [A-Z][a-z]{2}$/,
    );
    await expect(first.locator('.cm-ver')).toHaveText(/^1\.2 live\s*1\.3 proposed$/);
    await expect(first.locator('.cm-trk-st .xr-st')).toHaveText('Draft');
    await expect(holder(first)).toHaveText(/^Your step, now: You/);
    await expect(first.getByRole('link')).toHaveText('Continue');
    await switchIdentity(page, MENON);
    await softNavigate(page, `/reviewer/updates/${draft.id}`);
    // Not sent yet: the XS message page, nothing of the draft.
    await expect(heading(page, 'No update is waiting for your decision')).toBeVisible({
      timeout: 90_000,
    });
    await expect(main(page).locator('section.xs-msg')).toContainText(
      'Corrections from the Content Manager appear in your review queue once they are sent.',
    );
    await expect(main(page)).not.toContainText(CORRECTED_DESCRIPTION);
    await checkState(page, 'No update is waiting for your decision');
    await expectNoReference(page);
    await shot(page, 'rv04-not-sent');
    await follow(page, main(page).getByRole('link', { name: 'Open the review queue' }));
    await expect(page).toHaveURL(/\/reviewer\/queue$/, { timeout: 60_000 });
    await expect(heading(page, 'Review queue')).toBeVisible({ timeout: 90_000 });

    // Sent, then withdrawn by the Content Manager while the reviewer has it open.
    await port(page, KAVYA, 'corrections', 'sendForAcademicReview', {
      id: draft.id,
      expectedRev: draft.rev,
    });
    await softNavigate(page, `/reviewer/updates/${draft.id}`);
    await expect(heading(page, DISTILLATION_TITLE)).toBeVisible({ timeout: 90_000 });
    await expect(chip(page)).toHaveText('Waiting for your decision');
    const current = await port<{ readonly update: UpdateRef }>(
      page,
      KAVYA,
      'corrections',
      'getUpdate',
      draft.id,
    );
    await port(page, KAVYA, 'corrections', 'withdrawUpdate', {
      id: draft.id,
      reason: 'The vendor will fix the build first.',
      expectedRev: current.update.rev,
    });
    await expect(chip(page)).toHaveText('Withdrawn by the Content Manager');
    await expect(decided(page)).toContainText('There is nothing to decide.');
    await expect(decided(page).getByRole('link')).toHaveText('Back to the review queue');
    await expect(main(page)).not.toContainText('The vendor will fix the build first.');
    await expect(panel(page).getByRole('button')).toHaveCount(0);
    await expect(refusal(page)).toHaveCount(0);
    await checkState(page, DISTILLATION_TITLE);
    await expectNoReference(page);
    await expectSameDocument(page, mark);
  });
});
