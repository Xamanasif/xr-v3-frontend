import type { ReactNode } from 'react';

import { HarnessProbe } from './harness-probe';

export interface Specimen {
  /** What the specimen shows. */
  readonly title: string;
  /**
   * Where its markup contract comes from: a v46 board and frame (e.g. "B1-10 f2"), or
   * "harness" for the harness's own self-check.
   */
  readonly source: string;
  readonly render: () => ReactNode;
}

/**
 * Every specimen the harness can render, by id (a lower-case slug used in the address).
 * Component specimens from @xr/ui are added by the work packages that build the components
 * (WP-0.5 styles, WP-0.6 components, WP-0.7 DataTable).
 */
export const SPECIMENS: Readonly<Record<string, Specimen>> = {
  'harness-probe': {
    title: 'Harness probe',
    source: 'harness',
    render: () => <HarnessProbe />,
  },
};

export function specimenFor(id: string): Specimen | null {
  return Object.hasOwn(SPECIMENS, id) ? (SPECIMENS[id] ?? null) : null;
}
