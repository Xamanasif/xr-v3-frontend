import type { Page } from '@playwright/test';

import { assertSamplePerson, BOOT_DESCRIPTOR_GLOBAL, type SamplePerson } from './test-seam';

/**
 * The CI-only boot descriptor (Appendix F §7.2; ADR-0003 §3; ADR-0007 §3): the sample world
 * and the session a page starts with.
 */
export interface BootDescriptor {
  /** A named fixture world of `@xr/sample-platform/testing` (WP-0.11), e.g. `spine-start`. */
  readonly fixture: string;
  /** Who is signed in when the page loads; `null` = signed out. */
  readonly session: SamplePerson | null;
}

const booted = new WeakSet<Page>();

/**
 * Installs the boot descriptor before any page script runs, on every document load of this
 * page (sample worlds live in memory per tab and are rebuilt on full navigation, ADR-0004;
 * multi-step tests navigate client-side). The descriptor is frozen and read-only in the page.
 *
 * In a test-hook build (`TEST_HOOKS_URL`) the bridge (`src/platform/test-hook-bridge.ts`,
 * WP-0.12) reads it before the tab's platform is composed: the page starts on that fixture
 * world, signed in as that person, with no sign-in form. Product builds do not contain the
 * bridge, so there the descriptor is inert. One world per page: boot another page (or context)
 * for another world.
 */
export async function bootWorld(page: Page, descriptor: BootDescriptor): Promise<void> {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(descriptor.fixture)) {
    throw new TypeError(`A fixture name is a lower-case slug (got "${descriptor.fixture}").`);
  }
  if (descriptor.session) assertSamplePerson(descriptor.session);
  if (booted.has(page)) {
    throw new Error('bootWorld was already called for this page: one world per page (ADR-0004).');
  }
  booted.add(page);

  const frozen: BootDescriptor = {
    fixture: descriptor.fixture,
    session: descriptor.session ? { personId: descriptor.session.personId } : null,
  };
  await page.addInitScript(
    ({ key, value }) => {
      const deepFreeze = <T>(object: T): T => {
        if (object && typeof object === 'object') {
          for (const nested of Object.values(object)) deepFreeze(nested);
          Object.freeze(object);
        }
        return object;
      };
      Object.defineProperty(window, key, {
        value: deepFreeze(value),
        writable: false,
        configurable: false,
        enumerable: false,
      });
    },
    { key: BOOT_DESCRIPTOR_GLOBAL, value: frozen },
  );
}
