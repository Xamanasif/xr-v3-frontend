import { expect, type Page, test } from '@playwright/test';

import {
  actAs,
  BOOT_DESCRIPTOR_GLOBAL,
  bootWorld,
  expectNoDeveloperSurfaces,
  HarnessUnavailableError,
  signInAs,
  TEST_HOOKS_GLOBAL,
} from '../support';

/**
 * Self-tests of the app-specific session and world helpers (WP-0.4). Protocol checks run
 * on isolated fixture pages at a reserved `.test` origin (route-fulfilled, never a product
 * route); product checks run against the built app. No test chooses an identity through UI.
 */
const FIXTURE = 'http://harness.xr.test';

async function openFixture(page: Page, body: string): Promise<void> {
  await page.route(`${FIXTURE}/**`, (route) =>
    route.fulfill({
      contentType: 'text/html; charset=utf-8',
      body: `<!doctype html><html lang="en"><head><title>Fixture</title></head><body>${body}</body></html>`,
    }),
  );
  await page.goto(`${FIXTURE}/page.html`);
}

async function failureOf(work: Promise<unknown>): Promise<Error> {
  try {
    await work;
  } catch (error) {
    if (error instanceof Error) return error;
  }
  throw new Error('Expected the helper to fail, but it passed.');
}

test.describe('bootWorld (CI-only boot descriptor)', () => {
  test('installs a frozen descriptor before page scripts run, on every document load', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'spine-start', session: { personId: 'PER-0001' } });
    await page.route(`${FIXTURE}/**`, (route) =>
      route.fulfill({
        contentType: 'text/html; charset=utf-8',
        body: `<!doctype html><html lang="en"><head><title>Fixture</title><script>
          window.__seenAtFirstScript = JSON.stringify(window['${BOOT_DESCRIPTOR_GLOBAL}']);
        </script></head><body><main><h1>Fixture</h1></main></body></html>`,
      }),
    );

    for (const path of ['/one.html', '/two.html']) {
      await page.goto(`${FIXTURE}${path}`);
      for (let load = 0; load < 2; load += 1) {
        if (load === 1) await page.reload();
        const seen = await page.evaluate(
          () => (window as unknown as { __seenAtFirstScript: string }).__seenAtFirstScript,
        );
        expect(JSON.parse(seen)).toEqual({
          fixture: 'spine-start',
          session: { personId: 'PER-0001' },
        });
      }
    }
    const tamper = await page.evaluate((key) => {
      const descriptor = (window as unknown as Record<string, { session: { personId: string } }>)[
        key
      ];
      try {
        (window as unknown as Record<string, unknown>)[key] = { fixture: 'other', session: null };
      } catch {
        // strict-mode assignment to a read-only global throws; sloppy mode ignores it
      }
      try {
        descriptor!.session.personId = 'PER-9999';
      } catch {
        // frozen
      }
      return JSON.stringify((window as unknown as Record<string, unknown>)[key]);
    }, BOOT_DESCRIPTOR_GLOBAL);
    expect(JSON.parse(tamper)).toEqual({
      fixture: 'spine-start',
      session: { personId: 'PER-0001' },
    });
    // The descriptor renders nothing.
    await expect(page.locator('body')).toHaveText('Fixture');
  });

  test('accepts a signed-out start and rejects malformed descriptors', async ({
    page,
    context,
  }) => {
    await bootWorld(page, { fixture: 'spine-start', session: null });
    await openFixture(page, '<main><h1>Fixture</h1></main>');
    expect(
      await page.evaluate(
        (key) => JSON.stringify((window as unknown as Record<string, unknown>)[key]),
        BOOT_DESCRIPTOR_GLOBAL,
      ),
    ).toBe('{"fixture":"spine-start","session":null}');

    const other = await context.newPage();
    await expect(bootWorld(other, { fixture: 'Spine Start', session: null })).rejects.toThrow(
      /lower-case slug/,
    );
    await expect(
      bootWorld(other, { fixture: 'spine-start', session: { personId: ' ' } }),
    ).rejects.toThrow(/non-empty id/);
  });

  test('refuses a second world on the same page', async ({ page }) => {
    await bootWorld(page, { fixture: 'spine-start', session: null });
    await expect(bootWorld(page, { fixture: 'state-coverage', session: null })).rejects.toThrow(
      /one world per page/,
    );
  });
});

test.describe('actAs (port command as another actor, no UI)', () => {
  test('fails clearly when the page has no test-hook bridge', async ({ page }) => {
    await openFixture(page, '<main><h1>Fixture</h1></main>');
    const error = await failureOf(
      actAs(page, { personId: 'PER-0001' }, { port: 'operations', method: 'listReports' }),
    );
    expect(error).toBeInstanceOf(HarnessUnavailableError);
    expect(error.message).toContain(
      'actAs is not available yet: this page has no test-hook bridge',
    );
  });

  test('forwards the person id and the command to the bridge and returns its result', async ({
    page,
  }) => {
    await page.addInitScript((key) => {
      const calls: unknown[] = [];
      (window as unknown as Record<string, unknown>)[key] = {
        calls,
        actAs: async (personId: string, command: unknown) => {
          calls.push({ personId, command });
          return { ok: true, changed: [] };
        },
      };
    }, TEST_HOOKS_GLOBAL);
    await openFixture(page, '<main><h1>Fixture</h1></main>');

    const result = await actAs(
      page,
      { personId: 'PER-0002' },
      { port: 'operations', method: 'resolveReport', input: { reportId: 'SUP-0213' } },
    );

    expect(result).toEqual({ ok: true, changed: [] });
    const calls = await page.evaluate(
      (key) => (window as unknown as Record<string, { calls: unknown[] }>)[key]!.calls,
      TEST_HOOKS_GLOBAL,
    );
    expect(calls).toEqual([
      {
        personId: 'PER-0002',
        command: { port: 'operations', method: 'resolveReport', input: { reportId: 'SUP-0213' } },
      },
    ]);
    await expect(page.locator('body')).toHaveText('Fixture');
  });
});

test.describe('signInAs (XS-01 is a Phase-1 screen)', () => {
  test('refuses in Phase 0 without touching the page or offering any fallback', async ({
    page,
  }) => {
    await openFixture(page, '<main><h1>Fixture</h1></main>');
    const requests: string[] = [];
    page.on('request', (request) => requests.push(request.url()));
    const before = page.url();

    const error = await failureOf(signInAs(page, { personId: 'PER-0001' }));

    expect(error).toBeInstanceOf(HarnessUnavailableError);
    expect(error.message).toContain('signInAs is not available yet');
    expect(error.message).toContain('Phase 1 (owner decision G-8; ADR-0003)');
    expect(page.url()).toBe(before);
    expect(requests).toEqual([]);
  });
});

test.describe('the product build ignores the test seam', () => {
  test('a boot descriptor changes nothing in a build without the test-hook bridge', async ({
    page,
  }) => {
    await bootWorld(page, { fixture: 'spine-start', session: { personId: 'PER-0001' } });
    const response = await page.goto('/');
    expect(response?.status()).toBe(404);
    expect(await page.evaluate((key) => key in window, TEST_HOOKS_GLOBAL)).toBe(false);
    await expectNoDeveloperSurfaces(page);
  });
});
