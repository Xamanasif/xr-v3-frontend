/**
 * The platform people (B7-08 "Platform roles"; Appendix C §4.1): the two Vendors, the Academic
 * Reviewer and the Content Manager, with the scopes and withdrawals the board draws, and the Super
 * Admin as a sample identity (no Super Admin record is drawn, AD-29). Dr K. Iyer is registered on
 * 20 Oct 2026 — after the anchor — so the state-coverage builder registers him by command.
 *
 * Sample credentials (AD-03): a known sample e-mail plus any non-empty password signs in. The
 * Super Admin's e-mail is not drawn; `arjun.mehta@wilp.example` follows the drawn platform-staff
 * domain. It lives here and in the package README, never in product copy (Appendix C §4.1 [P]).
 */
import {
  type CourseId,
  type HistoryEntry,
  type PlatformRoleHolder,
  type RoleHolderEvent,
  type RoleScope,
  type ScopeTarget,
  unsafeBrand,
} from '@xr/domain';

import type { SuperAdminIdentity } from '../world/types.js';
import { ARJUN, ist, meta, note, SUPER_ADMIN_ID, type SeedBook } from './book.js';
import { COURSE, KAVYA_PERSON } from './catalogue.js';

export const HOLDER = {
  anil: 'role-anil-shetty',
  ritu: 'role-ritu-sharma',
  menon: 'role-a-menon',
  kavya: 'role-kavya-nair',
} as const;

export const SUPER_ADMIN: SuperAdminIdentity = {
  personId: SUPER_ADMIN_ID,
  displayName: 'Arjun Mehta',
  email: 'arjun.mehta@wilp.example',
};

interface ScopeSeed {
  readonly target: ScopeTarget;
  readonly at: string;
  readonly withdrawn?: { readonly at: string; readonly reason: string };
}

interface HolderSeed {
  readonly id: string;
  readonly personId: string;
  readonly role: PlatformRoleHolder['role'];
  readonly name: string;
  readonly email: string;
  readonly organisation: string;
  readonly registered: string;
  readonly scopes: readonly ScopeSeed[];
}

const course = (id: string): ScopeTarget => ({ kind: 'course', courseId: id as CourseId });

const HOLDERS: readonly HolderSeed[] = [
  {
    id: HOLDER.anil,
    personId: 'per-anil-shetty',
    role: 'vendor',
    name: 'Anil Shetty',
    email: 'anil.shetty@northline.example',
    organisation: 'Northline Simulation Studio',
    registered: '2026-07-04 10:00',
    scopes: [
      { target: course(COURSE.thermo), at: '2026-07-04 10:00' },
      {
        target: course(COURSE.manufacturing),
        at: '2026-07-04 10:00',
        withdrawn: {
          at: '2026-08-15 10:00',
          reason: 'Manufacturing Processes content is being produced in-house this term.',
        },
      },
    ],
  },
  {
    id: HOLDER.ritu,
    personId: 'per-ritu-sharma',
    role: 'vendor',
    name: 'Ritu Sharma',
    email: 'ritu.sharma@meridian.example',
    organisation: 'Meridian Virtual Labs',
    registered: '2026-08-01 10:00',
    scopes: [
      { target: course(COURSE.process), at: '2026-08-01 10:00' },
      { target: course(COURSE.machines), at: '2026-09-20 10:00' },
    ],
  },
  {
    id: HOLDER.menon,
    personId: 'per-a-menon',
    role: 'academic_reviewer',
    name: 'Prof. A. Menon',
    email: 'a.menon@wilp.example',
    organisation: 'BITS Pilani · WILP',
    registered: '2026-06-02 10:00',
    scopes: [
      { target: course(COURSE.thermo), at: '2026-06-02 10:00' },
      { target: course(COURSE.manufacturing), at: '2026-06-02 10:00' },
      { target: course(COURSE.process), at: '2026-06-02 10:00' },
      {
        target: course(COURSE.machines),
        at: '2026-06-02 10:00',
        withdrawn: {
          at: '2026-10-01 10:00',
          reason: 'Electrical Machines reviews move to a reviewer from the electrical faculty.',
        },
      },
    ],
  },
  {
    id: HOLDER.kavya,
    personId: KAVYA_PERSON,
    role: 'content_manager',
    name: 'Kavya Nair',
    email: 'kavya.nair@wilp.example',
    organisation: 'BITS Pilani · WILP',
    registered: '2026-06-02 10:00',
    scopes: [{ target: { kind: 'all' }, at: '2026-06-02 10:00' }],
  },
];

function addHolder(book: SeedBook, seed: HolderSeed): void {
  const registered = ist(seed.registered);
  const history: HistoryEntry<RoleHolderEvent>[] = [
    book.entry({
      event: 'registered',
      at: registered,
      actor: ARJUN,
      note: seed.role,
      visibleTo: ['super_admin'],
    }),
  ];
  let updated = registered;
  let rev = 1;
  const scopes: RoleScope[] = seed.scopes.map((scope) => {
    const at = ist(scope.at);
    if (at > registered) {
      history.push(
        book.entry({ event: 'scope-assigned', at, actor: ARJUN, visibleTo: ['super_admin'] }),
      );
      rev += 1;
    }
    updated = at > updated ? at : updated;
    return {
      id: book.ids.next('scope'),
      target: scope.target,
      assignedAt: at,
      assignedBy: ARJUN,
      withdrawal: null,
      supersededAt: null,
    };
  });
  seed.scopes.forEach((scope, index) => {
    if (!scope.withdrawn) return;
    const at = ist(scope.withdrawn.at);
    scopes[index] = {
      ...scopes[index]!,
      withdrawal: { at, by: ARJUN, reason: scope.withdrawn.reason },
    };
    history.push(
      book.entry({
        event: 'scope-withdrawn',
        at,
        actor: ARJUN,
        note: scope.withdrawn.reason,
        visibleTo: ['super_admin'],
      }),
    );
    rev += 1;
    updated = at > updated ? at : updated;
  });
  const holder: PlatformRoleHolder = {
    ...meta(registered, updated, rev),
    id: unsafeBrand(seed.id),
    role: seed.role,
    name: seed.name,
    workEmail: seed.email,
    organisation: seed.organisation,
    registeredAt: registered,
    registeredBy: ARJUN,
    scopes,
    personId: unsafeBrand(seed.personId),
    history: history.sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0)),
  };
  book.put('holders', seed.id, holder, note('B7-08', `${seed.name} · ${seed.organisation}`));
}

export function addPlatformRoles(book: SeedBook): void {
  for (const seed of HOLDERS) addHolder(book, seed);
}
