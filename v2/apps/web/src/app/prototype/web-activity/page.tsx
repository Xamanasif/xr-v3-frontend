import { notFound } from 'next/navigation';

import { LOCAL_PROTOTYPE_BUILD } from '@/platform/local-prototype';

import { WebActivityRoute } from '../../_prototype/prototype-routes';

/** TE-3 — the sample WEB activity "Launch WEB" opens; a local prototype build's page, simulated. */
export default function WebActivityPrototypePage() {
  if (!LOCAL_PROTOTYPE_BUILD) notFound();
  return <WebActivityRoute />;
}
