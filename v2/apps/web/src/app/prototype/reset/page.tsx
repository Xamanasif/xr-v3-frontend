import { notFound } from 'next/navigation';

import { LOCAL_PROTOTYPE_BUILD } from '@/platform/local-prototype';

import { ResetRoute } from '../../_prototype/prototype-routes';

/** TE-6 "Reset demo data" — a local prototype build's support page, not a designed screen. */
export default function ResetPrototypePage() {
  if (!LOCAL_PROTOTYPE_BUILD) notFound();
  return <ResetRoute />;
}
