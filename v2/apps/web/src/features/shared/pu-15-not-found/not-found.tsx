'use client';

import { MessagePage } from '@xr/ui';

import { stateWords } from '@/copy/state-copy';

import { DocumentTitle } from '../document-title';
import { useShellPage, useWorkspaceIdentity } from '../workspace-frame/shell-page';

/** Board 08 "The family": the not-found title and sentence, the same in both variants. */
const NOT_FOUND_TITLE = 'We can’t find that page';
const NOT_FOUND_SENTENCE = 'The address may be wrong, or the page may have moved.';

/**
 * PU-15, workspace variant (board 08 "Page not found · workspace", "PU-15 pattern · XS"): in the
 * person's own shell with nothing current (top bar "Not found"), "Back to Home" (the interim
 * landing, which reaches Help in Phase 0 — ADR-0005 §8) and Help. Shown for any address under the
 * workspace that names no built page — unknown, or designed but not built yet — and for a record
 * the person cannot open (the record guard; existence is not revealed).
 *
 * HTTP status: 200 (WP-0.13 spikes S1/S1b). The workspace layout waits for the tab's session
 * before it renders its pages, so the not-found boundary renders in the browser after the status
 * line has gone; recorded as a sample-mode limitation (Appendix F §3.3).
 */
export function WorkspaceNotFound() {
  const { home, help } = useWorkspaceIdentity();
  useShellPage({ screen: 'PU-15', title: stateWords('PU-15.top-title') });
  return (
    <MessagePage
      icon="search"
      placement="shell"
      title={NOT_FOUND_TITLE}
      action={{ href: home, label: 'Back to Home' }}
      secondary={{ href: help, label: 'Help' }}
    >
      {NOT_FOUND_SENTENCE}
    </MessagePage>
  );
}

/**
 * PU-15, public variant (board 08 "Page not found · public"): "Browse experiments" and no Help,
 * placed as the public boards place their message pages (B1-03, B1-05: `div.xp > main.xp-page >
 * div.xp-in`). Since Package 1B the public frame (header, footer, `div.xp`) surrounds it, and
 * "Browse experiments" opens the built catalogue (PU-04, `/experiments`) — the documented Phase-0
 * dead link is gone. `main#main` is the skip link's and route focus's target.
 */
export function PublicNotFound() {
  return (
    <>
      <DocumentTitle title={NOT_FOUND_TITLE} />
      <main id="main" tabIndex={-1} className="xp-page">
        <div className="xp-in">
          <MessagePage
            icon="search"
            placement="public"
            title={NOT_FOUND_TITLE}
            action={{ href: '/experiments', label: 'Browse experiments' }}
          >
            {NOT_FOUND_SENTENCE} Published experiments are all in the catalogue.
          </MessagePage>
        </div>
      </main>
    </>
  );
}
