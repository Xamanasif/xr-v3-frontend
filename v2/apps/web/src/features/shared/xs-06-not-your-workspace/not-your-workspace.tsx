'use client';

import { ROLE_LABEL } from '@xr/domain';
import { MessagePage } from '@xr/ui';

import { stateWords } from '@/copy/state-copy';

import { useShellPage, useWorkspaceIdentity } from '../workspace-frame/shell-page';

/**
 * XS-06 "Not your workspace" (board 08 "This page isn’t part of your workspace", the XS-06 card
 * and "At 375 px"; Appendix A XS-06; ADR-0005 §5). Not a route: the workspace frame renders it in
 * place of another role's page, inside the person's OWN shell — the address stays, nothing in the
 * sidebar is current, the top bar reads "Not your workspace". The lock icon, one H1, one sentence
 * naming the person's own workspace, "Back to Home" to their own home and Help to their own Help.
 * No route, role code or status code is shown (board 08 "Rules").
 */
export function NotYourWorkspace() {
  const { role, home, help } = useWorkspaceIdentity();
  useShellPage({ screen: 'XS-06', title: stateWords('XS-06.top-title') });
  return (
    <MessagePage
      icon="readOnly"
      placement="shell"
      title="This page isn’t part of your workspace"
      action={{ href: home, label: 'Back to Home' }}
      secondary={{ href: help, label: 'Help' }}
    >
      You’re signed in to the {ROLE_LABEL[role]} workspace. This address belongs to a different
      workspace.
    </MessagePage>
  );
}
