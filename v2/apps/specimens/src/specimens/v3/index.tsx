import type { Specimen } from '../types';
import { IaContentAccessSpecimen, IaOverviewSpecimen } from './ia';
import { SaOverviewSpecimen, SaRequestsSpecimen } from './sa';
import { SaDecisionSpecimen } from './sa-decision';
import { ScopeBoundarySpecimen } from './scope';

/**
 * The V3 foundation specimens (XR-V3-RB-1.0; ADR-0010): the five supplied Refined B screens built
 * from @xr/ui/v3 in the states their boards draw, and the scope-boundary check. Harness pages for
 * the browser suite (`e2e/v3-foundation.spec.ts`), never product routes; the product's SA and IA
 * routes keep their current presentation until a complete approved role export is integrated.
 */
export const V3_SPECIMENS: Readonly<Record<string, Specimen>> = {
  'v3-sa-01': {
    title: 'V3 SA-01 Overview (All)',
    source: 'V3 SA01.dc.html (Fri 23 Oct 2026)',
    render: () => <SaOverviewSpecimen />,
  },
  'v3-sa-02': {
    title: 'V3 SA-02 Requests',
    source: 'V3 SA02.dc.html view=list (oct23)',
    render: () => <SaRequestsSpecimen />,
  },
  'v3-sa-02-nomatch': {
    title: 'V3 SA-02 Requests · no match',
    source: 'V3 SA02.dc.html listPreset=nomatch',
    render: () => <SaRequestsSpecimen query="Narmada" />,
  },
  'v3-sa-02-loading': {
    title: 'V3 SA-02 Requests · loading',
    source: 'V3 SA02.dc.html listPreset=loading',
    render: () => <SaRequestsSpecimen mode="loading" />,
  },
  'v3-sa-02-failed': {
    title: 'V3 SA-02 Requests · failed',
    source: 'V3 SA02.dc.html listPreset=failed',
    render: () => <SaRequestsSpecimen mode="failed" />,
  },
  'v3-sa-02-empty': {
    title: 'V3 SA-02 Requests · no requests yet',
    source: 'V3 SA02.dc.html listPreset=empty',
    render: () => <SaRequestsSpecimen mode="empty" />,
  },
  'v3-sa-03': {
    title: 'V3 SA-03 Request decision · new institution',
    source: 'V3 SA02.dc.html view=decision record=gdv asOf=oct08',
    render: () => <SaDecisionSpecimen recordKey="gdv" />,
  },
  'v3-sa-03-renewal': {
    title: 'V3 SA-03 Request decision · renewal',
    source: 'V3 SA02.dc.html view=decision record=ren',
    render: () => <SaDecisionSpecimen recordKey="ren" />,
  },
  'v3-sa-03-paused': {
    title: 'V3 SA-03 Request decision · paused institution',
    source: 'V3 SA02.dc.html view=decision record=kon',
    render: () => <SaDecisionSpecimen recordKey="kon" />,
  },
  'v3-sa-03-decided': {
    title: 'V3 SA-03 Request decision · approved, payment required',
    source: 'V3 SA02.dc.html view=decision record=viz',
    render: () => <SaDecisionSpecimen recordKey="viz" />,
  },
  'v3-ia-01': {
    title: 'V3 IA-01 Overview · ending soon',
    source: 'V3 IA01.dc.html (Wed 22 Sep 2027)',
    render: () => <IaOverviewSpecimen />,
  },
  ...Object.fromEntries(
    (['ending', 'active', 'activated', 'paused', 'ended', 'none'] as const).map((scenario) => [
      scenario === 'ending' ? 'v3-ia-02' : `v3-ia-02-${scenario}`,
      {
        title: `V3 IA-02 Content access · ${scenario}`,
        source: `V3 IA02.dc.html scenario=${scenario}`,
        render: () => <IaContentAccessSpecimen scenario={scenario} />,
      },
    ]),
  ),
  'v3-ia-02-nomatch': {
    title: 'V3 IA-02 Content access · no match',
    source: 'V3 IA02.dc.html listPreset=nomatch',
    render: () => <IaContentAccessSpecimen scenario="ending" query="Distillation" />,
  },
  'v3-ia-02-loading': {
    title: 'V3 IA-02 Content access · loading',
    source: 'V3 IA02.dc.html listPreset=loading',
    render: () => <IaContentAccessSpecimen scenario="ending" mode="loading" />,
  },
  'v3-ia-02-failed': {
    title: 'V3 IA-02 Content access · failed',
    source: 'V3 IA02.dc.html listPreset=failed',
    render: () => <IaContentAccessSpecimen scenario="ending" mode="failed" />,
  },
  'v3-scope': {
    title: 'V3 scope boundary: v46 outside, v46 island inside, V3 beside',
    source: 'ADR-0010 (rb-scoped.css, patch.css V3P-05)',
    render: () => <ScopeBoundarySpecimen />,
  },
};
