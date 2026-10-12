import type { ReactNode } from 'react';

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
