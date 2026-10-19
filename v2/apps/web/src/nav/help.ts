import type { Role } from '@xr/domain';
import type { BreadcrumbLevel } from '@xr/ui';

import { WORKSPACE_NAV } from './nav-config';

/**
 * The Help & support template's place in every workspace shell (XS-07; the owner-approved Entry &
 * shared export, `XsHelp`, keeps board 07's "One template, one location … in all seven
 * workspaces"). The same four views at the same addresses under each workspace base, with Help
 * current in the sidebar foot. The views draw their own breadcrumb ("Help & support › Report a
 * problem"), so the shell's top bar names only the view.
 */
export type HelpView =
  | { readonly kind: 'reports' }
  | { readonly kind: 'report' }
  | { readonly kind: 'sent' }
  /** A report's detail, named by its title (never its reference: owner decision 6, XS). */
  | { readonly kind: 'detail'; readonly reportId: string; readonly title: string | null };

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

/** Where a Help view sits in the shell: the top-bar words. */
export interface HelpPlacement {
  readonly screen: 'XS-07';
  /** The top-bar title below 1024 px and the current crumb from 1024 px. */
  readonly title: string;
  /** No crumbs in the top bar: the view draws its own breadcrumb (XS). */
  readonly trail: readonly BreadcrumbLevel[];
}

/** The title of the Help landing and the first crumb of its deep views. */
export const HELP_TITLE = 'Help & support';

export function helpPlacement(_role: Role, view: HelpView): HelpPlacement {
  switch (view.kind) {
    case 'reports':
      return { screen: 'XS-07', title: HELP_TITLE, trail: [] };
    case 'report':
      return { screen: 'XS-07', title: 'Report a problem', trail: [] };
    case 'sent':
      return { screen: 'XS-07', title: 'Report sent', trail: [] };
    case 'detail':
      return { screen: 'XS-07', title: view.title ?? HELP_TITLE, trail: [] };
  }
}
