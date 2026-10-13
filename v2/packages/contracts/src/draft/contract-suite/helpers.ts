/** Small reads the flow cases share. Every call goes through the conformance proxy. */
import type { InstitutionId, PersonId } from '@xr/domain';

import type { ValidationFailed } from '../errors/service-error.js';
import type { CatalogueEntry, ProductPorts } from '../ports/index.js';
import { check, valueOf } from './assert.js';

/** The published experiment with exactly this name, found through the public catalogue. */
export async function experimentNamed(ports: ProductPorts, name: string): Promise<CatalogueEntry> {
  const found = valueOf(
    await ports.catalogue.searchCatalogue({ text: name, sort: 'default' }),
    `find "${name}" in the catalogue`,
  );
  const entry = found.entries.find((candidate) => candidate.name === name);
  check(entry, `"${name}" is not in the public catalogue`);
  return entry;
}

/** Every published experiment with this exact name (the Composite Wall checks). */
export async function experimentsNamed(
  ports: ProductPorts,
  text: string,
): Promise<readonly CatalogueEntry[]> {
  return valueOf(
    await ports.catalogue.searchCatalogue({ text, sort: 'default' }),
    `search the catalogue for "${text}"`,
  ).entries;
}

/** The signed-in person's id, from their own session. */
export async function personIdOf(ports: ProductPorts, who: string): Promise<PersonId> {
  const session = valueOf(await ports.session.getSession(), `${who}'s session`);
  check(session, `${who} is not signed in`);
  return session.session.personId;
}

/** The signed-in person's institution, from their own session. */
export async function institutionIdOf(ports: ProductPorts, who: string): Promise<InstitutionId> {
  const session = valueOf(await ports.session.getSession(), `${who}'s session`);
  check(session?.session.institutionId, `${who} has no institution`);
  return session.session.institutionId;
}

/** The keys of a `validation-failed`, in order. */
export function keysOf(error: ValidationFailed): readonly string[] {
  return error.fieldErrors.map((item) => item.key);
}
