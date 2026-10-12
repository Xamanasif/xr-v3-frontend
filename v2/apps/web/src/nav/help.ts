import type { Role } from '@xr/domain';
import type { BreadcrumbLevel, PageWrap } from '@xr/ui';

import { WORKSPACE_NAV } from './nav-config';

/**
 * The Help & support template's place in every workspace shell (GL-03, XS-07; board 07 "One
 * template, one location … in all seven workspaces"; Appendix A XS-07 and §4.2 "Help
 * sub-pages"). The same four views at the same addresses under each workspace base, with Help
 * current in the sidebar foot. The views' content (reports, the form and its sending, the detail)
 * comes from the HelpSupport components and the XS-07 screen (WP-0.13).
 */
export type HelpView =
  | { readonly kind: 'reports' }
  | { readonly kind: 'report' }
  | { readonly kind: 'sent' }
  | { readonly kind: 'detail'; readonly reportId: string; readonly reference: string };

export interface HelpAddresses {
  /** My reports, the Help landing (`/<base>/help`). */
  readonly reports: string;
  /** Report a problem, and Report sent after it (`/<base>/help/report`). */
  readonly report: string;
  /** A report's detail (`/<base>/help/reports/[reportId]`). */
  readonly detail: (reportId: string) => string;
}

export function helpAddresses(role: Role): HelpAddresses {
  const reports = WORKSPACE_NAV[role].help.href;
  return {
    reports,
    report: `${reports}/report`,
    detail: (reportId) => `${reports}/reports/${encodeURIComponent(reportId)}`,
  };
}

/** Where a Help view sits in the shell: the top-bar words and the page width board 07 draws. */
export interface HelpPlacement {
  readonly screen: 'XS-07';
  /** The top-bar title below 1024 px and the current crumb from 1024 px. */
  readonly title: string;
  /** The crumbs above it: "Help & support" on the deep views (board 07). */
  readonly trail: readonly BreadcrumbLevel[];
  /** `read` (1040) for the list and the detail, `form` (720) for the form, `none` when sent. */
  readonly wrap: PageWrap;
}

/** The title of the Help landing and the first crumb of its deep views (board 07). */
export const HELP_TITLE = 'Help & support';

export function helpPlacement(role: Role, view: HelpView): HelpPlacement {
  const trail = [{ label: HELP_TITLE, href: helpAddresses(role).reports }];
  switch (view.kind) {
    case 'reports':
      return { screen: 'XS-07', title: HELP_TITLE, trail: [], wrap: 'read' };
    case 'report':
      return { screen: 'XS-07', title: 'Report a problem', trail, wrap: 'form' };
    case 'sent':
      return { screen: 'XS-07', title: 'Report sent', trail, wrap: 'none' };
    case 'detail':
      return { screen: 'XS-07', title: view.reference, trail, wrap: 'read' };
  }
}
