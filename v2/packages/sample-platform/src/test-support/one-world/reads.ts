/**
 * Small reads the one-world proof steps share. Every call goes through the proof context's
 * recorded, conformance-checked ports, so a read that wrote anything fails where it was made.
 */
import type { ProductPorts, Result, ServiceError } from '@xr/contracts/draft';
import {
  type ExperimentId,
  type FormatProgressStatus,
  type Technology,
  unsafeBrand,
} from '@xr/domain';

import { EXPERIMENT } from '../../seed/catalogue.js';
import type { ProofContext } from './harness.js';
import { ProofViolation } from './harness.js';

export const SHELL = unsafeBrand<ExperimentId>(EXPERIMENT.shellAndTube);
export const DISTILLATION = unsafeBrand<ExperimentId>(EXPERIMENT.distillation);
export const COMPOSITE_WALL = 'Composite Wall Conduction';
export const COMPOSITE_WALL_NEW = 'Conduction Through a Composite Wall';

/** The success value of an answer, or a violation naming the step and the read. */
export async function must<T>(
  answer: Promise<Result<T, ServiceError>> | Result<T, ServiceError>,
  what: string,
): Promise<T> {
  const result = await answer;
  if (!result.ok)
    throw new ProofViolation(`${what}: expected a success, got ${JSON.stringify(result.error)}`);
  return result.value;
}

/** The person's banners, from their own session (XS-08). */
export async function bannersOf(ports: ProductPorts, who: string): Promise<readonly string[]> {
  const session = await must(ports.session.getSession(), `${who}'s session`);
  if (!session) throw new ProofViolation(`${who} is not signed in`);
  return session.banners;
}

/** What the Student reads for one format of Shell-and-Tube (ST-08 / ST-09). */
export async function formatPage(proof: ProofContext, format: Technology, who = 'Rahul Verma') {
  return must(
    proof.as(who).learning.getFormatPage({ experimentId: SHELL, format }),
    `${who}'s ${format.toUpperCase()} page`,
  );
}

/** Rahul's per-format progress words for Shell-and-Tube, as his hub row carries them (ST-05). */
export async function hubFormats(
  proof: ProofContext,
  who = 'Rahul Verma',
): Promise<ReadonlyMap<Technology, { availability: unknown; progress: FormatProgressStatus }>> {
  const hub = await must(proof.as(who).studentAccess.getExperimentHub(SHELL), `${who}'s hub`);
  return new Map(hub.row.formats.map((entry) => [entry.format, entry]));
}

/** The published experiments whose names contain `text` (public catalogue, PU-04). */
export async function catalogueNamed(ports: ProductPorts, text: string) {
  return (
    await must(ports.catalogue.searchCatalogue({ text, sort: 'default' }), `catalogue "${text}"`)
  ).entries;
}

/** The record of a world table, read directly (assertions only — never a product read). */
export function recordOf<T>(proof: ProofContext, table: string, id: string): T {
  const record = (proof.world().records as unknown as Record<string, Record<string, unknown>>)[
    table
  ]?.[id];
  if (!record) throw new ProofViolation(`no ${table} record ${id}`);
  return record as T;
}
