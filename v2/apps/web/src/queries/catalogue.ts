'use client';

/**
 * The published catalogue as names for other screens (Appendix F §3.2 `queries/<port>.ts`),
 * through `CatalogueService.searchCatalogue` — the public read every session may make. Requests
 * name experiments by id only (`@xr/contracts/draft` `requestedItem`); SA-02 and SA-03 write each
 * one's title and course as B1-10 and B1-11 do ("Shell-and-Tube Heat Exchanger", "ME ZG523 ·
 * Thermodynamics & Heat Transfer"). A release or a publication changes what it returns, so it
 * depends on the experiments and courses.
 */
import type { ProductPorts } from '@xr/contracts/draft';

import { defineQuery, useXrQuery } from './use-xr-query';

export const publishedCatalogue = defineQuery({
  family: 'EXP',
  view: 'catalogue-names',
  deps: ['EXP', 'CRS'],
  read: (ports: ProductPorts) => ports.catalogue.searchCatalogue({ sort: 'default' }),
});

export function usePublishedCatalogue() {
  return useXrQuery(publishedCatalogue, null);
}
