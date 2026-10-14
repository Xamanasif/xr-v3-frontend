import { COMPONENT_SPECIMENS } from './components';
import { HarnessProbe } from './harness-probe';
import { PARITY_SPECIMENS } from './parity';
import type { Specimen } from './types';
import { V46FocusedTask } from './v46/assess';
import { V46Dialog, type DialogAlign } from './v46/dialogs';
import { V46Foundation } from './v46/foundation';
import { V46PublicFilters, V46PublicMenu, V46PublicPage } from './v46/public';
import { V46DrawerShell } from './v46/shell';
import { V46TableGuards, V46Tables } from './v46/tables';

export type { Specimen } from './types';

/**
 * Every specimen the harness can render, by id (a lower-case slug used in the address).
 * Component specimens from @xr/ui are added by the work packages that build the components
 * (WP-0.6 components, WP-0.7 DataTable). The `v46-*` specimens (WP-0.5) are static excerpts of
 * board markup that check the stylesheets themselves: computed styles, the cascade layers, the
 * product layer (PF-01 … PF-13) and container-query behaviour.
 */
export const SPECIMENS: Readonly<Record<string, Specimen>> = {
  ...COMPONENT_SPECIMENS,
  ...PARITY_SPECIMENS,
  'harness-probe': {
    title: 'Harness probe',
    source: 'harness',
    render: () => <HarnessProbe />,
  },
  'v46-foundation': {
    title: 'v46 body, type scale and single-layer cascade',
    source: 'B6-09 delete buttons; xr-foundation.css body, .xr-h1',
    render: () => <V46Foundation />,
  },
  'v46-drawer-shell': {
    title: 'v46 workspace shell, drawer open (PF-02, PF-03, PF-07)',
    source: '06 "Drawer · Student · 375 px"',
    render: () => <V46DrawerShell />,
  },
  'v46-tables': {
    title: 'v46 tables with clipped headers (PF-01 guards)',
    source: 'B1-10 requests table; B1-05 formats table; B1-08 comparison',
    render: () => <V46Tables />,
  },
  'v46-table-guards': {
    title: 'v46 clipped table heads with every control kind the PF-01 guard names (WP-0.7)',
    source: 'B1-10 requests table; B1-05 formats table; B1-08 comparison; Appendix E §7.1',
    render: () => <V46TableGuards />,
  },
  'v46-public-page': {
    title: 'v46 public root with the bottom bar (PF-02, PF-06)',
    source: 'B1-06 "Mobile 375"',
    render: () => <V46PublicPage />,
  },
  'v46-public-menu': {
    title: 'v46 public menu open (PF-05 scrim)',
    source: 'B1-01 "Mobile 375 · menu open"',
    render: () => <V46PublicMenu />,
  },
  'v46-public-filters': {
    title: 'v46 catalogue filter sheet (PF-05)',
    source: 'B1-04 "Mobile 375 · filter sheet"',
    render: () => <V46PublicFilters />,
  },
  'v46-focused-task': {
    title: 'v46 focused task with its sticky bar (PF-11)',
    source: 'B4-12 "Assessment attempt"',
    render: () => <V46FocusedTask />,
  },
  'v46-focused-task-drawn-bar': {
    title: 'v46 focused task with B4-12’s bar as drawn (PF-11 long-title verification, WP-0.8)',
    source: 'B4-12 "Assessment attempt" (bar: back link, save error state, avatar)',
    render: () => <V46FocusedTask bar="drawn" />,
  },
  ...Object.fromEntries(
    (['centre', 'start', 'end', 'decision', 'marks'] as const satisfies readonly DialogAlign[]).map(
      (align) => [
        `v46-dialog-${align}`,
        {
          title: `v46 native dialog, ${align} (PF-04)`,
          source: '10 "Keyboard path and phone layout"; canvas scrim classes per PF-04',
          render: () => <V46Dialog align={align} />,
        },
      ],
    ),
  ),
};

export function specimenFor(id: string): Specimen | null {
  return Object.hasOwn(SPECIMENS, id) ? (SPECIMENS[id] ?? null) : null;
}
