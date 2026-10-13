import type { ReactNode } from 'react';

import { WorkspaceRoute } from '../_workspace/workspace-route';

/** The vendor workspace (ADR-0005 §1): session gate, then the workspace frame (Appendix F §3.3). */
export default function VendorLayout({ children }: { readonly children: ReactNode }) {
  return <WorkspaceRoute workspace="vendor">{children}</WorkspaceRoute>;
}
