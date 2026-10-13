import type { ReactNode } from 'react';

import { WorkspaceRoute } from '../_workspace/workspace-route';

/** The content-manager workspace (ADR-0005 §1): session gate, then the workspace frame (Appendix F §3.3). */
export default function ContentManagerLayout({ children }: { readonly children: ReactNode }) {
  return <WorkspaceRoute workspace="content-manager">{children}</WorkspaceRoute>;
}
