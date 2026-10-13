/**
 * `xr/import-fence` (Appendix F §3.8): positive and negative cases for every fence the web
 * app uses — features, route files, composition root, test-hook bridge, application code.
 * The options come from the real presets, so the cases test the shipped configuration.
 */
import type { Linter } from 'eslint';
import { describe, expect, it } from 'vitest';

import { DOMAIN_VOCABULARY, webFences } from '../../eslint/fences.mjs';
import { importFenceRule } from '../../eslint/rules/index.mjs';
import { fixtureApp, fixturePath, ruleTester } from './rule-tester.js';

/** The `xr/import-fence` options a preset gives a file group. */
function fenceOptions(groupName: string): unknown {
  const config = webFences(fixtureApp).find((item: Linter.Config) => item.name === groupName);
  const rule = config?.rules?.['xr/import-fence'];
  if (!Array.isArray(rule)) throw new Error(`No import fence in ${groupName}`);
  return rule[1];
}

const features = [fenceOptions('xr/fence: features')];
const routes = [fenceOptions('xr/fence: app routes')];
const composition = [fenceOptions('xr/fence: composition root')];
const bridge = [fenceOptions('xr/fence: test-hook bridge')];
const application = [fenceOptions('xr/fence: application code')];
const providersException = [
  fenceOptions('xr/fence: recorded exception — apps/web/src/app/providers.tsx'),
];

const featureFile = fixturePath('src/features/shared/xs-07-help/view.tsx');
const routeFile = fixturePath('src/app/student/help/page.tsx');

describe('the presets behind these cases', () => {
  it('limit @xr/domain to vocabulary: no decision, policy or derive function', () => {
    expect(DOMAIN_VOCABULARY).not.toContain('interimCompletionPolicy');
    expect(DOMAIN_VOCABULARY).not.toContain('foldSessions');
    expect(DOMAIN_VOCABULARY).not.toContain('sortTechnologies');
    expect(DOMAIN_VOCABULARY).toContain('ROLE_LABEL');
  });
});

ruleTester().run('xr/import-fence — features', importFenceRule, {
  valid: [
    "import { Button } from '@xr/ui';",
    "import { useSupportReports } from '@/queries/operations';",
    "import { helpCopy } from '@/copy/help';",
    "import { navFor } from '@/nav/nav-config';",
    "import { MessagePage } from '@/features/shared/pu-15-not-found/view';",
    "import { useState } from 'react';",
    "import type { SupportReport } from '@xr/contracts/draft';",
    "import { type SupportReport } from '@xr/contracts/draft';",
    "type Report = import('@xr/contracts/draft').SupportReport;",
    "import { ROLE_LABEL, FORMAT_META, type Role } from '@xr/domain';",
    "import type { CompletionPolicy } from '@xr/domain';",
    "export { ROLE_LABEL } from '@xr/domain';",
    "import { ReportRow } from './report-row';",
    "import { Shared } from '../../shared/notice';",
  ].map((code) => ({ code, filename: featureFile, options: features })),
  invalid: [
    ["import { compose } from '@/platform/composition';", 'notAllowed'],
    ["import { fetchApi } from '@/lib/api-client';", 'notAllowed'],
    ["import { HEALTH_PATH } from '@xr/contracts';", 'notAllowed'],
    ["import { supportReportSchema } from '@xr/contracts/draft';", 'typeOnly'],
    ["import { interimCompletionPolicy } from '@xr/domain';", 'vocabulary'],
    ["import { foldSessions, ROLE_LABEL } from '@xr/domain';", 'vocabulary'],
    ["import { sortTechnologies } from '@xr/domain';", 'vocabulary'],
    ["import * as domain from '@xr/domain';", 'vocabularyWhole'],
    ["export * from '@xr/domain';", 'vocabularyWhole'],
    ["const domain = await import('@xr/domain');", 'vocabularyWhole'],
    ["import { createSamplePlatform } from '@xr/sample-platform';", 'denied'],
    ["import { buildWorld } from '@xr/sample-platform/testing';", 'denied'],
    ["import { runContractSuite } from '@xr/contracts/draft/contract-suite';", 'denied'],
    ["import type { ClockPort } from '@xr/contracts/draft/standins';", 'denied'],
    ["import { useQuery } from '@tanstack/react-query';", 'denied'],
    ["import Link from 'next/link';", 'denied'],
    ["import type { Metadata } from 'next';", 'denied'],
    ["import { compose } from '../../../platform/composition';", 'escapes'],
  ].map(([code, messageId]) => ({
    code: code as string,
    filename: featureFile,
    options: features,
    errors: [{ messageId: messageId as string }],
  })),
});

ruleTester().run('xr/import-fence — app routes', importFenceRule, {
  valid: [
    "import { HelpPage } from '@/features/shared/xs-07-help/view';",
    "import { PlatformProvider } from '@/platform/platform-provider';",
    "import { Button } from '@xr/ui';",
    "import '@xr/ui/styles.css';",
    "import type { Metadata } from 'next';",
    "import { notFound } from 'next/navigation';",
    "import type { ReactNode } from 'react';",
    "import './globals.css';",
    "import { Providers } from '../../providers';",
  ].map((code) => ({ code, filename: routeFile, options: routes })),
  invalid: [
    ["import { ROLE_LABEL } from '@xr/domain';", 'notAllowed'],
    ["import { useSupportReports } from '@/queries/operations';", 'notAllowed'],
    ["import { useQuery } from '@tanstack/react-query';", 'notAllowed'],
    ["import { z } from 'zod';", 'notAllowed'],
    ["import { compose } from '@/platform/composition';", 'denied'],
    ["import { installTestHooks } from '@/platform/test-hook-bridge';", 'denied'],
    ["import { expectNoAxeViolations } from '@xr/testing/browser';", 'denied'],
    ["import { createSamplePlatform } from '@xr/sample-platform';", 'denied'],
    ["import { STANDIN_LEDGER } from '@xr/contracts/draft/standins';", 'denied'],
    ["import { publicEnv } from '../../../lib/env';", 'escapes'],
  ].map(([code, messageId]) => ({
    code: code as string,
    filename: routeFile,
    options: routes,
    errors: [{ messageId: messageId as string }],
  })),
});

ruleTester().run('xr/import-fence — recorded exception (providers.tsx)', importFenceRule, {
  valid: [
    {
      code: "import { QueryClient } from '@tanstack/react-query';",
      filename: fixturePath('src/app/providers.tsx'),
      options: providersException,
    },
  ],
  invalid: [
    {
      code: "import { ROLE_LABEL } from '@xr/domain';",
      filename: fixturePath('src/app/providers.tsx'),
      options: providersException,
      errors: [{ messageId: 'notAllowed' }],
    },
  ],
});

ruleTester().run('xr/import-fence — composition root', importFenceRule, {
  valid: [
    {
      code: "import { createSamplePlatform } from '@xr/sample-platform';",
      filename: fixturePath('src/platform/composition.ts'),
      options: composition,
    },
  ],
  invalid: [
    {
      code: "import { buildWorld } from '@xr/sample-platform/testing';",
      filename: fixturePath('src/platform/composition.ts'),
      options: composition,
      errors: [{ messageId: 'denied' }],
    },
    {
      code: "import { runContractSuite } from '@xr/contracts/draft/contract-suite';",
      filename: fixturePath('src/platform/composition.ts'),
      options: composition,
      errors: [{ messageId: 'denied' }],
    },
    {
      code: "import type { StandinPorts } from '@xr/contracts/draft/standins';",
      filename: fixturePath('src/platform/composition.ts'),
      options: composition,
      errors: [{ messageId: 'denied' }],
    },
  ],
});

ruleTester().run('xr/import-fence — test-hook bridge', importFenceRule, {
  valid: [
    {
      code: "import { buildWorld, setSampleNow } from '@xr/sample-platform/testing';",
      filename: fixturePath('src/platform/test-hook-bridge.ts'),
      options: bridge,
    },
  ],
  invalid: [
    {
      code: "import { createSamplePlatform } from '@xr/sample-platform';",
      filename: fixturePath('src/platform/test-hook-bridge.ts'),
      options: bridge,
      errors: [{ messageId: 'denied' }],
    },
    {
      code: "import { world } from '@xr/sample-platform/world';",
      filename: fixturePath('src/platform/test-hook-bridge.ts'),
      options: bridge,
      errors: [{ messageId: 'denied' }],
    },
    {
      code: "import { STANDINS_MARKER } from '@xr/contracts/draft/standins';",
      filename: fixturePath('src/platform/test-hook-bridge.ts'),
      options: bridge,
      errors: [{ messageId: 'denied' }],
    },
  ],
});

ruleTester().run('xr/import-fence — application code', importFenceRule, {
  valid: [
    "import { healthResponseSchema } from '@xr/contracts';",
    "import type { ProductPorts } from '@xr/contracts/draft';",
    "import { z } from 'zod';",
    "import { publicEnv } from '@/lib/env';",
  ].map((code) => ({ code, filename: fixturePath('src/lib/api-client.ts'), options: application })),
  invalid: [
    ["import { createSamplePlatform } from '@xr/sample-platform';", 'denied'],
    ["const seams = await import('@xr/sample-platform/testing');", 'denied'],
    ["import { reachAndClick } from '@xr/testing/browser';", 'denied'],
    ["import { renderScreen } from '@/test-support/render-screen';", 'denied'],
    ["export { runContractSuite } from '@xr/contracts/draft/contract-suite';", 'denied'],
    ["import { STANDIN_LEDGER } from '@xr/contracts/draft/standins';", 'denied'],
    ["export type * from '@xr/contracts/draft/standins';", 'denied'],
  ].map(([code, messageId]) => ({
    code: code as string,
    filename: fixturePath('src/queries/operations.ts'),
    options: application,
    errors: [{ messageId: messageId as string }],
  })),
});
