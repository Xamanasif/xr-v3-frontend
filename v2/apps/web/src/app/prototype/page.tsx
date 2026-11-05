import { notFound } from 'next/navigation';

import { LOCAL_PROTOTYPE_BUILD } from '@/platform/local-prototype';

import { ToolsRoute } from '../_prototype/prototype-routes';

/** The prototype tools (B2B milestones I2 and I3) — a support page, not a designed screen. */
export default function PrototypeToolsRoutePage() {
  if (!LOCAL_PROTOTYPE_BUILD) notFound();
  return <ToolsRoute />;
}
