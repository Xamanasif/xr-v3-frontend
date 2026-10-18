'use client';

/*
 * The V3 scope boundary (ADR-0010): the same v46 components rendered outside any V3 root and
 * inside a v46 island in a V3 page, beside the V3 components that share class names with them
 * (`xr-fmt`, `xr-sr`, `xr-ico`, `xr-avatar`). The browser suite compares computed styles: the
 * island copy must equal the outside copy, and the V3 copies must carry the Refined B look.
 */
import {
  Button as V46Button,
  FormatBadge as V46FormatBadge,
  Link as V46Link,
  Notice as V46Notice,
  StatusPill as V46StatusPill,
} from '@xr/ui';
import { FormatBadges, StatusPill, V46Island } from '@xr/ui/v3';

import { SuperAdminShell } from './shells';

function V46Sample() {
  return (
    <div data-scope-sample="">
      <V46Button variant="primary">Give access</V46Button>
      <V46StatusPill tone="info">Under review</V46StatusPill>
      <V46FormatBadge format="VR" variant="yours" />
      <V46Notice tone="warn" title="Renewal due">
        Ask BITS for a renewal.
      </V46Notice>
      <V46Link href="#scope">Open Requests</V46Link>
      <ul>
        <li>First point</li>
        <li>Second point</li>
      </ul>
    </div>
  );
}

export function ScopeBoundarySpecimen() {
  return (
    <>
      <section data-scope="outside" aria-label="v46 outside any V3 root">
        <V46Sample />
      </section>
      <SuperAdminShell current="overview" date="Friday 23 October 2026">
        <section data-scope="island" aria-label="v46 inside a V3 island">
          <V46Island>
            <V46Sample />
          </V46Island>
        </section>
        <section data-scope="v3" aria-label="V3 components">
          <StatusPill tone="info">Under review</StatusPill>
          <FormatBadges formats={['VR']} label="Formats requested: VR" />
        </section>
      </SuperAdminShell>
    </>
  );
}
