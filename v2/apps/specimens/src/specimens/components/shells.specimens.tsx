import type { Specimen } from '../types';
import {
  HelpDetailReopenedSpecimen,
  HelpDetailSpecimen,
  HelpEmptySpecimen,
  HelpHomeSpecimen,
  HelpReportSpecimen,
  SidebarSpecimen,
  WorkspaceShellBannerSpecimen,
  WorkspaceShellSpecimen,
} from './shells';

export const SHELL_SPECIMENS: Readonly<Record<string, Specimen>> = {
  'c-workspace-shell': {
    title:
      'WorkspaceShell: skip link, sidebar (full · rail · drawer), top bar, main — Institute Admin',
    source:
      '05 "05 · GL-01 Workspace Shell"; 06 "Collapsed rail and mobile drawer", "Behaviour"; 11 "1024 · Super Admin · Request decision"; 12 "Shell tab order", "Patterns"',
    render: () => <WorkspaceShellSpecimen />,
  },
  'c-workspace-shell-banner': {
    title: 'WorkspaceShell with the XS-08 banner slot (institution paused) — Faculty',
    source: '05 "05 · GL-01 Workspace Shell" (banner "Institution paused"); 12 "Shell tab order"',
    render: () => <WorkspaceShellBannerSpecimen />,
  },
  'c-sidebar': {
    title: 'Sidebar + NavItem standalone: full (institution, platform role with a count) and rail',
    source:
      '06 "The seven sidebars · full width (≥ 1280 px)", "Rail · Institute Admin · tooltip on hover and focus"; B1-10 "SA-02 Requests · 1440 · interactive"',
    render: () => <SidebarSpecimen />,
  },
  'c-help-home': {
    title: 'HelpSupport: My reports (open, reopened, resolved) — Institute Admin',
    source: '07 "State 2 · My reports · open / reopened / resolved · Institute Admin"',
    render: () => <HelpHomeSpecimen />,
  },
  'c-help-empty': {
    title: 'HelpSupport: My reports, empty — Vendor',
    source: '07 "State 2a · My reports · empty · Vendor"',
    render: () => <HelpEmptySpecimen />,
  },
  'c-help-report': {
    title: 'HelpSupport: Report a problem → validation → sending → sent — Student',
    source:
      '07 "State 1 · Report a problem · Student", "State 1a · Validation", "State 1b · Sending", "State 1c · Sent · reference"; 11 "375 · AR-8 form"',
    render: () => <HelpReportSpecimen />,
  },
  'c-help-detail': {
    title: 'HelpSupport: report detail, resolved with note — Faculty',
    source: '07 "State 3 · Report detail · resolved with note · Faculty"',
    render: () => <HelpDetailSpecimen />,
  },
  'c-help-detail-reopened': {
    title: 'HelpSupport: report detail, reopened — Content Manager',
    source: '07 "State 3a · Report detail · reopened · Content Manager"',
    render: () => <HelpDetailReopenedSpecimen />,
  },
};
