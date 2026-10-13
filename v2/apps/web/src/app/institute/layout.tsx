import type { ReactNode } from 'react';

import { WorkspaceRoute } from '../_workspace/workspace-route';

/** The institute workspace (ADR-0005 §1): session gate, then the workspace frame (Appendix F §3.3). */
export default function InstituteLayout({ children }: { readonly children: ReactNode }) {
  return <WorkspaceRoute workspace="institute">{children}</WorkspaceRoute>;
}
