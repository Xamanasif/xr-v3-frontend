/**
 * Deterministic ids (Appendix F §3.7 `ids/`, §4.3; Appendix D §3.3–§3.4). One source per
 * prefix:
 *  1. ids the walk or a fixture has reserved for the next records of a kind (the board
 *     references REQ-0042, ACC-0107, SACC-0310 …), handed out in order;
 *  2. otherwise the next free id above the per-prefix floor — the highest id drawn on any board
 *     (REQ-0058, ACC-0107, SACC-0314 …) — so a live walk never reuses a board reference.
 *
 * A plain counter would be wrong: the boards draw background records above the flow ids, so a
 * counter starting at 0042 would give the IA-17 request REQ-0043, not REQ-0058. Nothing here reads
 * a clock or a random source; the state lives in the world and moves only when a command commits.
 */
import { DRAWN_ID_PREFIX, type IdSource, type MintedIds, RESERVED_ID_SLUGS } from '@xr/domain';

export type MintedKind = keyof MintedIds;
type DrawnKind = keyof typeof DRAWN_ID_PREFIX & MintedKind;

/**
 * The highest drawn id per prefix (Appendix C §4.1 [P]; Appendix F §4.3): the next id minted
 * outside a reservation is one above it.
 */
export const DRAWN_FLOORS: Readonly<Record<DrawnKind, number>> = {
  request: 58,
  accessPlan: 107,
  studentAccessGrant: 314,
  assessment: 9,
  attempt: 451,
  submission: 86,
  update: 7,
  deviceTransfer: 19,
  supportReport: 213,
  question: 117,
  group: 13,
  facultyCourseMapping: 21,
};

/** Opaque ids: never shown in product copy (Appendix C §1.1); routes use them where no prefix is drawn. */
const OPAQUE_PREFIX: Readonly<Record<Exclude<MintedKind, DrawnKind>, string>> = {
  statusToken: 'tok',
  requestRoute: 'rq',
  paymentAttempt: 'pay',
  institution: 'inst',
  instituteAdminAssignment: 'iaa',
  person: 'per',
  area: 'area',
  course: 'crs',
  experiment: 'exp',
  learningOutcome: 'lo',
  questionDraft: 'qd',
  importBatch: 'imp',
  feedback: 'fb',
  roleHolder: 'role',
  scope: 'scope',
  history: 'h',
};

export interface IdSourceState {
  /** The last number minted per kind (drawn kinds start at their floor). */
  readonly counters: Readonly<Partial<Record<MintedKind, number>>>;
  /** Reserved ids per kind, handed out before the counter. */
  readonly reserved: Readonly<Partial<Record<MintedKind, readonly string[]>>>;
}

export const EMPTY_ID_STATE: IdSourceState = { counters: {}, reserved: {} };

function isDrawn(kind: MintedKind): kind is DrawnKind {
  return Object.hasOwn(DRAWN_FLOORS, kind);
}

function format(kind: MintedKind, value: number): string {
  if (isDrawn(kind)) return `${DRAWN_ID_PREFIX[kind]}-${String(value).padStart(4, '0')}`;
  const prefix = OPAQUE_PREFIX[kind];
  return `${prefix}-${String(value).padStart(kind === 'history' ? 6 : 4, '0')}`;
}

/** Does an id already name a record of this kind? (supplied by the world) */
export type IdExists = (kind: MintedKind, id: string) => boolean;

/** Adds ids to the reservation queue of a kind (the walk's board references). */
export function reserve(
  state: IdSourceState,
  kind: MintedKind,
  ids: readonly string[],
): IdSourceState {
  for (const id of ids) {
    if ((RESERVED_ID_SLUGS as readonly string[]).includes(id))
      throw new Error(`${id} is a reserved route slug and is never minted.`);
  }
  return {
    ...state,
    reserved: { ...state.reserved, [kind]: [...(state.reserved[kind] ?? []), ...ids] },
  };
}

/** The ids still reserved and not yet handed out. */
export function pendingReservations(state: IdSourceState): readonly string[] {
  return Object.values(state.reserved).flatMap((ids) => ids ?? []);
}

/**
 * An id source over a working copy of the state: a command mints from it, and only a committed
 * command keeps what it minted (a refusal writes nothing — not even an id).
 */
export class StagedIds implements IdSource {
  #state: IdSourceState;
  readonly #exists: IdExists;

  constructor(state: IdSourceState, exists: IdExists) {
    this.#state = state;
    this.#exists = exists;
  }

  get state(): IdSourceState {
    return this.#state;
  }

  next<K extends MintedKind>(kind: K): MintedIds[K] {
    const queue = this.#state.reserved[kind] ?? [];
    if (queue.length > 0) {
      const [id, ...rest] = queue as [string, ...string[]];
      if (this.#exists(kind, id)) throw new Error(`The reserved id ${id} is already in use.`);
      this.#state = { ...this.#state, reserved: { ...this.#state.reserved, [kind]: rest } };
      return id as MintedIds[K];
    }
    let value = this.#state.counters[kind] ?? (isDrawn(kind) ? DRAWN_FLOORS[kind] : 0);
    let id: string;
    do {
      value += 1;
      id = format(kind, value);
    } while (this.#exists(kind, id));
    this.#state = { ...this.#state, counters: { ...this.#state.counters, [kind]: value } };
    return id as MintedIds[K];
  }
}

/**
 * An experiment's id (Appendix C §1.1 [P]): the lower-case slug of its catalogue name, so the two
 * Composite Wall records are `composite-wall-conduction` and `conduction-through-a-composite-wall`
 * (BC11). A slug already taken, or a reserved route slug, takes the next free `-2`, `-3` … suffix.
 */
export function experimentSlug(name: string, taken: (id: string) => boolean): string {
  const base =
    name
      .normalize('NFKD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'experiment';
  let id = base;
  for (
    let suffix = 2;
    taken(id) || (RESERVED_ID_SLUGS as readonly string[]).includes(id);
    suffix += 1
  ) {
    id = `${base}-${suffix}`;
  }
  return id;
}
