import type { ReactNode } from 'react';

import { WorkspaceRoute } from '../_workspace/workspace-route';

/** The reviewer workspace (ADR-0005 §1): session gate, then the workspace frame (Appendix F §3.3). */
export default function ReviewerLayout({ children }: { readonly children: ReactNode }) {
  return <WorkspaceRoute workspace="reviewer">{children}</WorkspaceRoute>;
}
