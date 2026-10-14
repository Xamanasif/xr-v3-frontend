/**
 * `seed(anchor)` — the spine-start world (Appendix F §4.3): the platform people and the background
 * records in steady state on the sample "today", 2 Oct 2026 10:00 (Indian time), fourteen minutes
 * before REQ-0042 arrives (B1-11 "received 2 Oct 2026, 10:14"). Nothing Flows A–F create is here:
 * no Godavari Institute of Technology or its people, no REQ-0042 / REQ-0058, no ACC-0107, no
 * SUB-0077, no UPD-0005 (WP-0.9 acceptance 5; invariant 10).
 *
 * Pure and deterministic: the same anchor always gives a deep-equal world. The board references
 * the walk creates are reserved in the id source, in walk order, so the walk — and a live walk-
 * through from this world — mints REQ-0042, ACC-0107, SACC-0310 … rather than the next free id
 * above each floor (Appendix F §4.3, X-14).
 */
import { type IsoInstant, type SupportReport, unsafeBrand } from '@xr/domain';

import { EMPTY_ID_STATE, type IdSourceState, reserve } from '../ids/id-source.js';
import { WORLD_SCHEMA, WORLD_VERSION, type World } from '../world/types.js';
import { ARJUN, ist, meta, note, personRef, SeedBook } from './book.js';
import { addCatalogue, FEATURED, KAVYA_PERSON } from './catalogue.js';
import { addInstitutionsAndRequests } from './institutions.js';
import { addProduction } from './production.js';
import { addPlatformRoles, SUPER_ADMIN } from './roles.js';

/** The provisional sample "today" of the spine-start world (OD-B6-12 / OD-B7-08: owner to confirm). */
export const SPINE_ANCHOR: IsoInstant = ist('2026-10-02 10:00');

/**
 * The ids the walk and the fixtures create, in the order they create them (Appendix F §4.3). A
 * reservation is handed out before the counter; an id nobody reserved continues above the floor.
 */
export const WALK_RESERVATIONS = {
  request: ['REQ-0042', 'REQ-0058'],
  institution: ['godavari'],
  accessPlan: ['ACC-0107'],
  studentAccessGrant: ['SACC-0310', 'SACC-0311', 'SACC-0312', 'SACC-0313', 'SACC-0314'],
  group: ['GRP-0012', 'GRP-0013'],
  facultyCourseMapping: ['FMAP-0021'],
  question: ['Q-0101', 'Q-0102', 'Q-0103', 'Q-0104', 'Q-0105', 'Q-0106'],
  assessment: ['ASMT-0009'],
  attempt: ['ATT-0450'],
  submission: ['SUB-0077'],
  update: ['UPD-0005'],
  deviceTransfer: ['DTR-0018'],
  supportReport: ['SUP-0213'],
} as const;

function reserved(state: IdSourceState): IdSourceState {
  let next = state;
  for (const [kind, ids] of Object.entries(WALK_RESERVATIONS)) {
    next = reserve(next, kind as keyof typeof WALK_RESERVATIONS, ids);
  }
  return next;
}

/** SUP-0207 (board 07 frame s8; B7-09): sent 28 Sep, resolved 30 Sep; reopened on 6 Oct by the walk. */
function addSupport(book: SeedBook): void {
  const sent = ist('2026-09-28 10:00');
  const resolved = ist('2026-09-30 10:00');
  const kavya = personRef(KAVYA_PERSON, 'content_manager', 'Kavya Nair');
  const resolution = 'The preview now loads. Please try again.';
  const report: SupportReport = {
    ...meta(sent, resolved, 2),
    id: unsafeBrand('SUP-0207'),
    reporter: {
      personId: unsafeBrand(KAVYA_PERSON),
      role: 'content_manager',
      displayName: 'Kavya Nair',
      institutionId: null,
      organisation: 'BITS Pilani · WILP',
    },
    whatHappened: 'The preview of the WEB delivery link showed an empty frame.',
    where: 'Content library · Forced Convection',
    screenshotFileName: null,
    state: 'resolved',
    sentAt: sent,
    resolutions: [{ at: resolved, by: ARJUN, note: resolution }],
    reopenings: [],
    history: [
      book.entry({
        event: 'sent',
        at: sent,
        actor: kavya,
        visibleTo: ['content_manager', 'super_admin'],
      }),
      book.entry({
        event: 'resolved',
        at: resolved,
        actor: ARJUN,
        note: resolution,
        visibleTo: ['content_manager', 'super_admin'],
      }),
    ],
  };
  book.put('reports', 'SUP-0207', report, note('Board 07 s8; B7-09', 'SUP-0207 · resolved 30 Sep'));
}

/** The spine-start world on `anchor` (its records keep their drawn dates; the clock starts here). */
export function seed(anchor: IsoInstant = SPINE_ANCHOR): World {
  const book = new SeedBook(EMPTY_ID_STATE);
  addCatalogue(book);
  addPlatformRoles(book);
  addInstitutionsAndRequests(book);
  addProduction(book);
  addSupport(book);
  return {
    schema: WORLD_SCHEMA,
    version: WORLD_VERSION,
    seedId: 'spine-start',
    worldVersion: 0,
    anchor,
    seededAtReal: null,
    records: book.records,
    identities: { superAdmins: [SUPER_ADMIN] },
    seeded: { licenceWaits: [], unavailableRightNow: {}, featuredExperiments: FEATURED },
    history: [],
    idSource: reserved(book.ids.state),
    runtimeEvents: [],
    processedCommandIds: {},
    seedNotes: book.notes,
    sentContent: {},
  };
}
