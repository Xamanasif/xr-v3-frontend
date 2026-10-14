'use client';

import type { CatalogueEntry } from '@xr/contracts/draft';
import { Stepper } from '@xr/ui';
import { useMemo } from 'react';

import { REQUEST_STEPS } from '@/copy/request-access';
import { usePublishedCatalogue } from '@/queries/catalogue';

/**
 * Pieces the public request's pages share (Phase-1 Package 1C; B1-06, B1-07).
 */

/**
 * The request stepper (B1-06, B1-07: `div.xp-flow.xr-content > ol.xr-steps` "Request institutional
 * access"): Selection · Request details · Review · Sent. The Batch-1 boards write a done step as
 * "Step 1" without "· Done"; the navy bar and its place before the current step mark it done.
 */
export function RequestStepper({ current }: { readonly current: 1 | 2 | 3 | 4 }) {
  return (
    <div className="xp-flow xr-content">
      <Stepper
        label={REQUEST_STEPS.label}
        steps={REQUEST_STEPS.steps}
        current={current}
        doneWords={false}
      />
    </div>
  );
}

/** The published catalogue by experiment id, for naming the experiments of a selection or request. */
export interface CatalogueNames {
  /** `null` while the catalogue is read; a failed read is `failed`. */
  readonly byId: ReadonlyMap<string, CatalogueEntry> | null;
  readonly failed: boolean;
  readonly retry: () => void;
}

export function useCatalogueNames(): CatalogueNames {
  const catalogue = usePublishedCatalogue();
  const answer = catalogue.data;
  const byId = useMemo(
    () =>
      answer?.ok
        ? new Map(answer.value.entries.map((entry) => [entry.experimentId as string, entry]))
        : null,
    [answer],
  );
  return {
    byId,
    failed: catalogue.isError || (answer !== undefined && !answer.ok),
    retry: () => void catalogue.refetch(),
  };
}

/** An experiment's name for the request's lines; its reference where the catalogue no longer names it. */
export function nameOf(names: ReadonlyMap<string, CatalogueEntry> | null, experimentId: string) {
  return names?.get(experimentId)?.name ?? experimentId;
}
