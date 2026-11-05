import { notFound } from 'next/navigation';

import { LOCAL_PROTOTYPE_BUILD } from '@/platform/local-prototype';

import { SamplePaymentRoute } from '../../_prototype/prototype-routes';

/**
 * The simulated payment provider's page (DP-05, DP-06; B2B milestone I3) — a support page of a build
 * that runs the sample stand-ins, never of staging or production; not a designed screen.
 */
export default function SamplePaymentRoutePage() {
  if (!LOCAL_PROTOTYPE_BUILD) notFound();
  return <SamplePaymentRoute />;
}
