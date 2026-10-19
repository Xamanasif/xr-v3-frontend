'use client';

import { ROLE_LABEL } from '@xr/domain';
import { MessagePage, V3Region } from '@xr/ui/v3';

import { stateWords } from '@/copy/state-copy';
import { NOT_YOUR_WORKSPACE } from '@/copy/xs';
import { homeLabelOf } from '@/nav/nav-config';

import { useShellPage, useWorkspaceIdentity } from '../workspace-frame/shell-page';

/**
 * XS-06 "Not your workspace", in the owner-approved Entry & shared design
 * (design/v3-refined-b/roles/XS-v6, `XsMessage` kind `notallowed`; ADR-0005 §5). Not a route: the
 * workspace frame renders it in place of another role's page, inside the person's OWN shell — the
 * address stays, nothing in the sidebar is current, the top bar reads "Not your workspace". The
 * lock disc, the page's only H1 (focused on arrival), one sentence naming the person's own
 * workspace, the way back named by their home ("Back to Home", "Back to Overview") and their own
 * Help. No route, role code, status code or anything of the protected page is shown.
 */
export function NotYourWorkspace() {
  const { role, home, help } = useWorkspaceIdentity();
  useShellPage({ screen: 'XS-06', title: stateWords('XS-06.top-title') });
  return (
    <V3Region>
      <MessagePage
        kind="not-allowed"
        title={NOT_YOUR_WORKSPACE.title}
        titleId="xs-msg-title"
        primary={{ href: home, label: NOT_YOUR_WORKSPACE.back(homeLabelOf(role)) }}
        secondary={{ href: help, label: NOT_YOUR_WORKSPACE.help }}
      >
        {NOT_YOUR_WORKSPACE.line(ROLE_LABEL[role])}
      </MessagePage>
    </V3Region>
  );
}
