'use client';

import { useMemo } from 'react';

import { usePublishedCatalogue } from '@/queries/catalogue';

import type { ExperimentNames } from './request-view';

/**
 * Experiments as the published catalogue names them — the public read every session may make
 * (`CatalogueService.searchCatalogue`): requests and device transfers name experiments by id only
 * (B3-08 "Shell-and-Tube Heat Exchanger · ME ZG523"; B3-09 "VR for Shell-and-Tube Heat
 * Exchanger"). An experiment no longer published keeps its reference (state-copy
 * `IA-17.unnamed-experiment`); a failed read names none rather than blocking the page.
 */
export function useExperimentNames(): {
  readonly byId: ExperimentNames;
  readonly pending: boolean;
} {
  const catalogue = usePublishedCatalogue();
  const answer = catalogue.data;
  const byId = useMemo<ExperimentNames>(
    () =>
      answer?.ok
        ? new Map(
            answer.value.entries.map((entry) => [
              entry.experimentId as string,
              { name: entry.name, platformCode: entry.platformCode },
            ]),
          )
        : new Map(),
    [answer],
  );
  return { byId, pending: catalogue.isPending && !catalogue.isError };
}
