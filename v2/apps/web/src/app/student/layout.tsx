import type { ReactNode } from 'react';

import { WorkspaceRoute } from '../_workspace/workspace-route';

/** The student workspace (ADR-0005 §1): session gate, then the workspace frame (Appendix F §3.3). */
export default function StudentLayout({ children }: { readonly children: ReactNode }) {
  return <WorkspaceRoute workspace="student">{children}</WorkspaceRoute>;
}
