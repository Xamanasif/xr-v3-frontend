// Captures the migrated V3 screens of the NORMAL product build (`next start`) at 1440, 1024, 768
// and 375 px, through the real UI (sign-in form, links, the account menu), and measures each
// capture: page size, horizontal overflow, clipped text, the V3 font weights, console errors.
// Local developer tooling only (ADR-0010): not part of `pnpm verify`, never imported by product
// code, never deployed. Run artefacts go to `.runs/<stamp>-product/` (git- and prettier-ignored)
// and are evidence for `docs/v3/V3-COMPARISON-MAP.json`, never baselines.
//
//   pnpm --dir apps/web build && pnpm --dir apps/web exec next start -p 3300
//   node tools/v3-reference/capture-product.mjs --product http://localhost:3300
//
// The product's data is the sample world of a fresh tab (a document load starts it anew,
// ADR-0004); a capture that needs a state the walk does not hold creates it through the UI first
// (the Super Admin pauses an institution) and says so in its notes. `--only` takes case names,
// or a prefix ending in `*` (`--only 'sa*'`).
import { mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { parseArgs } from 'node:util';

const here = import.meta.dirname;
const v2 = join(here, '..', '..');
const require = createRequire(join(v2, 'apps', 'web', 'package.json'));
const { chromium } = require('@playwright/test');

const { values } = parseArgs({
  options: {
    product: { type: 'string', default: 'http://localhost:3300' },
    widths: { type: 'string', default: '1440,1024,768,375' },
    only: { type: 'string' },
  },
});
const WIDTHS = values.widths.split(',').map(Number);
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const out = join(here, '.runs', `${stamp}-product`);
mkdirSync(out, { recursive: true });

const ARJUN = 'arjun.mehta@wilp.example';
const KULKARNI = 's.kulkarni@deccan.example';

async function signIn(page, email) {
  if (!page.url().includes('/sign-in')) await page.goto(`${values.product}/sign-in`);
  const card = page.locator('.xs-card');
  await card.getByLabel('E-mail', { exact: true }).fill(email);
  await card.locator('#sign-in-password').fill('sample-password');
  await card.getByRole('button', { name: 'Sign in', exact: true }).click();
  await page.waitForURL((url) => url.pathname !== '/sign-in');
}

/** Client-side navigation (a document load would start the tab's world anew). */
async function go(page, path) {
  await page.evaluate((href) => window.next.router.push(href), path);
  await page.waitForURL((url) => url.pathname === path.split('?')[0]);
}

/** The account button: the v46 shells' `.xr-acct-btn`, the V3 role shell's `.rb-acct`. */
const ACCOUNT = '.xr-acct-btn, .rb-acct';

async function signOut(page) {
  await page.locator(ACCOUNT).click();
  await page.locator('.xs-menu').getByRole('button', { name: 'Sign out' }).click();
  await page.waitForURL('**/sign-in?reason=signed-out');
}

/** A Super Admin page once its read has settled: its H1, no loading line or skeleton rows. */
async function settledPage(page) {
  await page.locator('main#main h1').first().waitFor();
  await page.waitForFunction(
    () =>
      !document.querySelector('main [aria-busy="true"], main .rk-skel-row, main .rk-loading-msg'),
  );
}

/** Arjun Mehta (Super Admin) at a page of his workspace, reached client-side after sign-in. */
async function admin(page, path) {
  await signIn(page, ARJUN);
  if (path !== '/admin') await go(page, path);
  await settledPage(page);
}

/** One Super Admin page in its first state (the fresh sample world). */
const saPage = (name, id, state, path) => ({
  name,
  id,
  state,
  reach: async (page) => admin(page, path),
});

/** The Super Admin cases (SA-v1): every screen, its no-match / unknown / dialog states. */
const SA_CASES = [
  saPage('sa01-overview', 'SA-01', 'Overview, All', '/admin'),
  {
    name: 'sa01-category',
    id: 'SA-01',
    state: 'Overview, the Corrections category',
    reach: async (page) => {
      await admin(page, '/admin');
      await page.locator('main [role=group] button', { hasText: 'Corrections' }).first().click();
    },
  },
  saPage('sa02-requests', 'SA-02', 'Requests, default filters', '/admin/requests'),
  {
    name: 'sa02-no-match',
    id: 'SA-02',
    state: 'Requests, a search with no match',
    reach: async (page) => {
      await admin(page, '/admin/requests');
      await page.locator('main').getByRole('searchbox').first().fill('zzqx');
      await page.locator('main .rk-state').first().waitFor();
    },
  },
  saPage(
    'sa03-new-access',
    'SA-03',
    'Request decision, a new access request (information requested)',
    '/admin/requests/REQ-0041',
  ),
  saPage('sa03-renewal', 'SA-03', 'Request decision, another request', '/admin/requests/REQ-0038'),
  saPage(
    'sa03-unknown',
    'SA-03',
    'An unknown request: the GL-04 message',
    '/admin/requests/REQ-9999',
  ),
  saPage('sa06-institutions', 'SA-06', 'Institutions', '/admin/institutions'),
  {
    name: 'sa06-no-match',
    id: 'SA-06',
    state: 'Institutions, a search with no match',
    reach: async (page) => {
      await admin(page, '/admin/institutions');
      await page.locator('main').getByRole('searchbox').first().fill('zzqx');
      await page.locator('main .rk-state').first().waitFor();
    },
  },
  saPage(
    'sa07-malnad',
    'SA-07',
    'Institution detail, Malnad (ending soon)',
    '/admin/institutions/malnad',
  ),
  saPage(
    'sa07-vizag',
    'SA-07',
    'Institution detail, Vizag (awaiting payment)',
    '/admin/institutions/vizag',
  ),
  saPage('sa07-deccan', 'SA-07', 'Institution detail, Deccan', '/admin/institutions/deccan'),
  saPage('sa07-konark', 'SA-07', 'Institution detail, Konark', '/admin/institutions/konark'),
  saPage('sa07-sahyadri', 'SA-07', 'Institution detail, Sahyadri', '/admin/institutions/sahyadri'),
  {
    name: 'sa07-pause-dialog',
    id: 'SA-07',
    state: 'Pause access confirmation (Deccan)',
    reach: async (page) => {
      await admin(page, '/admin/institutions/deccan');
      await page.locator('main').getByRole('button', { name: 'Pause access' }).first().click();
      await page.getByRole('dialog').waitFor();
    },
  },
  saPage(
    'sa10-updates',
    'SA-10',
    'Content updates, waiting for a decision',
    '/admin/content/updates',
  ),
  saPage(
    'sa11-update-0005',
    'SA-11',
    'An update waiting for release',
    '/admin/content/updates/UPD-0005',
  ),
  saPage('sa11-update-0004', 'SA-11', 'Another update', '/admin/content/updates/UPD-0004'),
  saPage('sa12-all-content', 'SA-12', 'All content', '/admin/content/all'),
  saPage('sa13-stuck', 'SA-13', 'Content record (SUB-0085)', '/admin/content/records/SUB-0085'),
  saPage(
    'sa13-published',
    'SA-13',
    'Content record, published',
    '/admin/content/records/distillation-column',
  ),
  saPage('sa14-structure', 'SA-14', 'Academic structure', '/admin/structure'),
  {
    name: 'sa14-add-area',
    id: 'SA-14',
    state: 'Add area dialog',
    reach: async (page) => {
      await admin(page, '/admin/structure');
      await page.locator('main').getByRole('button', { name: 'Add area' }).first().click();
      await page.getByRole('dialog').waitFor();
    },
  },
  saPage('sa15-area', 'SA-15', 'Area record', '/admin/structure/areas/chemical-process'),
  saPage('sa15-course', 'SA-15', 'Course record', '/admin/structure/courses/fluid-mechanics'),
  saPage('sa16-roles', 'SA-16', 'Platform roles, Vendors', '/admin/roles'),
  saPage('sa16-reviewers', 'SA-16', 'Platform roles, Reviewers', '/admin/roles?tab=reviewers'),
  saPage('sa17-holder', 'SA-17', 'Role holder (Prof. A. Menon)', '/admin/roles/role-a-menon'),
  saPage('sa18-transfers', 'SA-18', 'Device transfers', '/admin/operations/device-transfers'),
  saPage(
    'sa19-transfer',
    'SA-19',
    'Device transfer decision',
    '/admin/operations/device-transfers/DTR-0018',
  ),
  saPage('sa20-support', 'SA-20', 'Support reports', '/admin/operations/support'),
  saPage('sa21-report', 'SA-21', 'Support report', '/admin/operations/support/SUP-0213'),
  saPage('sa22-access-ending', 'SA-22', 'Access ending', '/admin/operations/access-ending'),
  {
    name: 'sa-shell-drawer',
    id: 'SA-shell',
    state: 'the Menu drawer open (below 1024 px; the rail above)',
    reach: async (page) => {
      await admin(page, '/admin');
      const menu = page.getByRole('button', { name: /^(Open menu|Menu)$/ });
      if (await menu.isVisible()) {
        await menu.click();
        await page.locator('.rb-drawer').waitFor();
      }
    },
  },
  {
    name: 'sa-shell-not-found',
    id: 'SA-shell',
    state: 'an unknown /admin address: PU-15 in the V3 shell',
    reach: async (page) => {
      await signIn(page, ARJUN);
      await go(page, '/admin/nothing-here');
      await page.locator('main#main h1').first().waitFor();
    },
  },
];

const ANIL = 'anil.shetty@northline.example';

/** Anil Shetty (Vendor) at a page of his workspace, reached client-side after sign-in. */
async function vendor(page, path) {
  await signIn(page, ANIL);
  if (path !== '/vendor') await go(page, path);
  await settledPage(page);
}

/** One Vendor page in its first state (the fresh sample world). */
const vePage = (name, id, state, path) => ({
  name,
  id,
  state,
  tall: true,
  reach: async (page) => vendor(page, path),
});

/** The Vendor cases (VE-v1): every screen, its list, editor, record and refusal states. */
const VE_CASES = [
  vePage(
    've01-overview',
    'VE-01',
    'Overview: studio band, returned lead, drafts, recent activity',
    '/vendor',
  ),
  vePage('ve02-list', 'VE-02', 'My experiments, All', '/vendor/experiments'),
  vePage(
    've02-returned',
    'VE-02',
    'My experiments, the Returned tab',
    '/vendor/experiments?status=returned',
  ),
  vePage(
    've02-recent',
    'VE-02',
    'My experiments, Changed in the last 7 days',
    '/vendor/experiments?changed=last-7-days',
  ),
  {
    name: 've02-no-match',
    id: 'VE-02',
    state: 'My experiments, a search with no match',
    tall: true,
    reach: async (page) => {
      await vendor(page, '/vendor/experiments');
      await page.locator('main').getByRole('searchbox').first().fill('zzqx');
      await page.locator('main .rk-state').first().waitFor();
    },
  },
  vePage('ve03-new', 'VE-03', 'Create: Course and description, empty', '/vendor/experiments/new'),
  {
    name: 've03-validation',
    id: 'VE-03',
    state: 'Create: Continue with nothing filled (error summary)',
    tall: true,
    reach: async (page) => {
      await vendor(page, '/vendor/experiments/new');
      await page.locator('main').getByRole('button', { name: 'Continue', exact: true }).click();
      await page.locator('main .rk-errsum').waitFor();
    },
  },
  vePage(
    've04-formats',
    'VE-04',
    'Edit draft at the saved step: Formats and delivery (Pin Fin Efficiency)',
    '/vendor/experiments/SUB-0079/edit?step=formats',
  ),
  {
    name: 've04-leave-guard',
    id: 'VE-04',
    state: 'Leave without saving? after a change, from the rail',
    tall: true,
    reach: async (page) => {
      await vendor(page, '/vendor/experiments/SUB-0079/edit');
      await page.locator('main').getByRole('textbox').first().fill('A change not saved yet');
      const narrow = (page.viewportSize()?.width ?? 1440) < 1024;
      if (narrow) {
        await page.getByRole('button', { name: /^(Open menu|Menu)$/ }).click();
        await page.locator('.rb-drawer .rb-nav a[href="/vendor/experiments"]').click();
      } else {
        await page.locator('aside.rb-rail .rb-nav a[href="/vendor/experiments"]').click();
      }
      await page.getByRole('dialog').waitFor();
    },
  },
  vePage(
    've05-preview',
    'VE-05',
    'Preview and documents',
    '/vendor/experiments/SUB-0079/edit?step=preview',
  ),
  vePage(
    've06-check',
    'VE-06',
    'Check and submit (items still missing)',
    '/vendor/experiments/SUB-0079/edit?step=submit',
  ),
  vePage(
    've07-returned',
    'VE-07',
    'Record, returned by the Academic Reviewer (Forced Convection)',
    '/vendor/experiments/SUB-0081',
  ),
  vePage('ve07-draft', 'VE-07', 'Record, draft', '/vendor/experiments/SUB-0079'),
  vePage(
    've07-with-cm',
    'VE-07',
    'Record, with the Content Manager',
    '/vendor/experiments/SUB-0074',
  ),
  vePage(
    've07-published',
    'VE-07',
    'Record, published (read-only)',
    '/vendor/experiments/SUB-0052',
  ),
  vePage(
    've07-read-only',
    'VE-07',
    'Record, course no longer assigned (read-only)',
    '/vendor/experiments/SUB-0083',
  ),
  vePage(
    've13-history',
    'VE-13',
    'Submission and version history (Forced Convection)',
    '/vendor/experiments/SUB-0081?tab=history',
  ),
  vePage(
    've13-history-published',
    'VE-13',
    'Submission and version history, published',
    '/vendor/experiments/SUB-0052?tab=history',
  ),
  vePage(
    've08-revise',
    'VE-08',
    'Revise and resubmit: the returned-reason panel above step 1',
    '/vendor/experiments/SUB-0081/revise',
  ),
  vePage(
    've08-ref-jump',
    'VE-08',
    'Revise: a reference opens its field (AR · Device need)',
    '/vendor/experiments/SUB-0081/revise?step=formats&field=ar.device-need',
  ),
  vePage(
    've09-read-only',
    'VE-09',
    'Edit draft, course no longer assigned: What you entered',
    '/vendor/experiments/SUB-0083/edit',
  ),
  {
    name: 've-shell-drawer',
    id: 'VE-shell',
    state: 'the Menu drawer open (below 1024 px; the rail above)',
    tall: true,
    reach: async (page) => {
      await vendor(page, '/vendor');
      const menu = page.getByRole('button', { name: /^(Open menu|Menu)$/ });
      if (await menu.isVisible()) {
        await menu.click();
        await page.locator('.rb-drawer').waitFor();
      }
    },
  },
  {
    name: 've-shell-not-found',
    id: 'VE-shell',
    state: 'an unknown /vendor address: PU-15 in the V3 shell',
    tall: true,
    reach: async (page) => {
      await signIn(page, ANIL);
      await go(page, '/vendor/nothing-here');
      await page.locator('main#main h1').first().waitFor();
    },
  },
];

/** The cases: a name, the XS id and state, and how to reach it from a fresh tab. */
const CASES = [
  {
    name: 'xs01-sign-in',
    id: 'XS-01',
    state: 'default',
    reach: async (page) => page.goto(`${values.product}/sign-in`),
  },
  {
    name: 'xs01-missing-details',
    id: 'XS-01',
    state: 'missing details (summary + field errors)',
    reach: async (page) => {
      await page.goto(`${values.product}/sign-in`);
      await page.locator('.xs-card').getByRole('button', { name: 'Sign in', exact: true }).click();
      await page.locator('.xs-card .rk-errsum').waitFor();
    },
  },
  {
    name: 'xs01-wrong-details',
    id: 'XS-01',
    state: 'wrong details',
    reach: async (page) => {
      await page.goto(`${values.product}/sign-in`);
      const card = page.locator('.xs-card');
      await card.getByLabel('E-mail', { exact: true }).fill('meera.iyer@godavari.edu');
      await card.locator('#sign-in-password').fill('x');
      await card.getByRole('button', { name: 'Sign in', exact: true }).click();
      await card.getByRole('alert').waitFor();
    },
  },
  {
    name: 'xs04-disclosures-sso-off',
    id: 'XS-04',
    state: 'both disclosures open, institution sign-in unavailable',
    reach: async (page) => {
      await page.goto(`${values.product}/sign-in`);
      const card = page.locator('.xs-card');
      await card.getByRole('button', { name: 'Sign in with your institution' }).click();
      await card.getByText('Institution sign-in isn’t available right now').waitFor();
      await card.getByRole('button', { name: 'Forgot your password?' }).click();
      await card.getByRole('button', { name: 'First time signing in?' }).click();
    },
  },
  {
    name: 'xs03-signed-out',
    id: 'XS-03',
    state: 'signed out',
    reach: async (page) => page.goto(`${values.product}/sign-in?reason=signed-out`),
  },
  {
    name: 'xs03-session-ended',
    id: 'XS-03',
    state: 'session ended with the return address',
    reach: async (page) =>
      page.goto(`${values.product}/sign-in?reason=expired&returnTo=%2Fadmin%2Finstitutions`),
  },
  {
    name: 'xs05-menu-super-admin',
    id: 'XS-05',
    state: 'open, Super Admin (no organisation line)',
    reach: async (page) => {
      await signIn(page, ARJUN);
      await page.locator(ACCOUNT).click();
      await page.locator('.xs-menu').waitFor();
    },
  },
  {
    name: 'xs05-menu-institute-admin',
    id: 'XS-05',
    state: 'open, Institute Admin (institution line)',
    reach: async (page) => {
      await signIn(page, KULKARNI);
      await page.locator(ACCOUNT).click();
      await page.locator('.xs-menu').waitFor();
    },
  },
  {
    name: 'xs06-not-your-workspace',
    id: 'XS-06',
    state: 'Super Admin at a Student address',
    reach: async (page) => {
      await signIn(page, ARJUN);
      await go(page, '/student/courses');
      await page.locator('main .xs-msg').waitFor();
    },
  },
  {
    name: 'xs07-my-reports-empty',
    id: 'XS-07',
    state: 'My reports, empty (Super Admin, fresh world)',
    reach: async (page) => {
      await signIn(page, ARJUN);
      await go(page, '/admin/help');
      await page.locator('main .rk-state').waitFor();
    },
  },
  {
    name: 'xs07-report-errors',
    id: 'XS-07',
    state: 'Report a problem with the error summary',
    reach: async (page) => {
      await signIn(page, ARJUN);
      await go(page, '/admin/help/report');
      await page.getByRole('button', { name: 'Send report' }).click();
      await page.locator('main .rk-errsum').waitFor();
    },
  },
  {
    name: 'xs07-report-sent',
    id: 'XS-07',
    state: 'Report sent (Super Admin: no reference)',
    reach: async (page) => {
      await signIn(page, ARJUN);
      await go(page, '/admin/help/report');
      await page
        .getByLabel('What happened?')
        .fill('The renewal list stopped loading after a filter change.');
      await page.getByRole('button', { name: 'Send report' }).click();
      await page.getByRole('heading', { level: 1, name: 'Report sent' }).waitFor();
    },
  },
  {
    name: 'xs07-my-reports-and-detail',
    id: 'XS-07',
    state: 'My reports with a report, then its detail',
    reach: async (page, capture) => {
      await signIn(page, ARJUN);
      await go(page, '/admin/help/report');
      await page
        .getByLabel('What happened?')
        .fill('The renewal list stopped loading after a filter change.');
      await page.getByRole('button', { name: 'Send report' }).click();
      await page.getByRole('link', { name: 'View my reports' }).click();
      await page.locator('main ul.xs-reports').waitFor();
      await capture('list');
      await page.locator('main a.xs-report').first().click();
      await page.locator('main .rk-sec').first().waitFor();
    },
  },
  {
    name: 'xs08-paused-banner',
    id: 'XS-08',
    state: 'paused banner (the Super Admin pauses Deccan through SA-07 first)',
    reach: async (page) => {
      await signIn(page, ARJUN);
      await go(page, '/admin/institutions/deccan');
      await page.getByRole('button', { name: 'Pause access' }).first().click();
      const dialog = page.getByRole('dialog', { name: /^Pause access for / });
      await dialog
        .getByRole('textbox', { name: 'Reason, kept in the history' })
        .fill('Licence review.');
      await dialog.getByRole('button', { name: 'Pause access' }).click();
      await page.getByText('Access paused').first().waitFor();
      await signOut(page);
      await signIn(page, KULKARNI);
      await page.locator('main .rk-banner').waitFor();
    },
  },
];

async function measure(page) {
  return page.evaluate(async () => {
    // No internal reference in the words or the accessible names (SA-v1 rule).
    const internal = /\b(?:REQ|ACC|UPD|DTR|SUP|SUB)-\d+/;
    const named = [...document.querySelectorAll('[aria-label], [title], img[alt]')].map(
      (element) =>
        `${element.getAttribute('aria-label') ?? ''} ${element.getAttribute('title') ?? ''} ${element.getAttribute('alt') ?? ''}`,
    );
    const references = [document.body.innerText, ...named].filter((text) =>
      internal.test(text),
    ).length;
    await document.fonts.ready;
    const doc = document.documentElement;
    // Text cut off by its box; visually hidden words (`.xr-sr`, 1 px by design) are not.
    const clipped = [...document.querySelectorAll('.xr *')].filter((element) => {
      const style = getComputedStyle(element);
      if (!['hidden', 'clip'].includes(style.overflowX) || element.matches('input, textarea'))
        return false;
      if (element.clientWidth <= 1) return false;
      return element.scrollWidth > element.clientWidth + 1;
    }).length;
    return {
      references,
      pageSize: [doc.scrollWidth, doc.scrollHeight],
      horizontalOverflow: doc.scrollWidth > window.innerWidth,
      clippedText: clipped,
      weights: ['400', '600', '650', '700', '800'].map((weight) =>
        document.fonts.check(`${weight} 16px "Public Sans"`),
      ),
    };
  });
}

const browser = await chromium.launch();
const results = [];
for (const testCase of [...CASES, ...SA_CASES, ...VE_CASES].filter(
  (c) =>
    !values.only ||
    values.only
      .split(',')
      .some((only) =>
        only.endsWith('*') ? c.name.startsWith(only.slice(0, -1)) : c.name === only,
      ),
)) {
  for (const width of WIDTHS) {
    const context = await browser.newContext({
      viewport: { width, height: 900 },
      deviceScaleFactor: 1,
      reducedMotion: 'reduce',
      locale: 'en-GB',
      timezoneId: 'Asia/Kolkata',
    });
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', (error) => errors.push(String(error)));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    const shots = [];
    const capture = async (suffix) => {
      const file = `${testCase.name}${suffix ? `-${suffix}` : ''}-${width}.png`;
      // The pointer rests where the last click was (a row's hover tint); move it off the page.
      await page.mouse.move(0, 899);
      // The Vendor export's renders are taken with the window as tall as the page (its sticky
      // action bars and the rail then sit where the page ends): the same here.
      const measured = testCase.tall ? await measure(page) : null;
      if (testCase.tall) {
        const height = await page.evaluate(() => document.documentElement.scrollHeight);
        await page.setViewportSize({ width, height: Math.max(900, height) });
        await page.waitForTimeout(150);
      }
      await page.waitForTimeout(150);
      await page.screenshot({ path: join(out, file), fullPage: true });
      shots.push({ file, ...(measured ?? (await measure(page))) });
      if (testCase.tall) await page.setViewportSize({ width, height: 900 });
    };
    try {
      await testCase.reach(page, capture);
      await capture('');
    } catch (error) {
      shots.push({ error: String(error?.message ?? error).split('\n')[0] });
    }
    results.push({
      case: testCase.name,
      id: testCase.id,
      state: testCase.state,
      width,
      shots,
      errors,
    });
    const line = shots
      .map((shot) =>
        shot.error
          ? `ERROR ${shot.error}`
          : `${shot.file} ${shot.pageSize.join('×')} overflow:${shot.horizontalOverflow} clipped:${shot.clippedText} refs:${shot.references} weights:${shot.weights.map(Number).join('')}`,
      )
      .join(' | ');
    process.stdout.write(
      `${testCase.name} @${width}: ${line}${errors.length ? ` · console errors ${errors.length}` : ''}\n`,
    );
    await context.close();
  }
}
await browser.close();
writeFileSync(
  join(out, 'results.json'),
  `${JSON.stringify({ product: values.product, results }, null, 2)}\n`,
);
process.stdout.write(`wrote ${out}\n`);
