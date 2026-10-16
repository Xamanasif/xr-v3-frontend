'use client';

import type { PlatformRole } from '@xr/domain';
import {
  Button,
  EditDialog,
  EmptyState,
  FailedState,
  Field,
  Icon,
  Link,
  LoadingState,
  Notice,
  PageContent,
  PageHeader,
  Section,
  SectionBody,
  Skeleton,
  StatusTabs,
  TextInput,
  VisuallyHidden,
} from '@xr/ui';
import { useEffect, useState } from 'react';

import { dayMonthYear } from '@/copy/dates';
import {
  noScopeTitle,
  openHolderLabel,
  REGISTER_DIALOG,
  registeredFlash,
  registeredLine,
  ROLE_TAB_WORDS,
  ROLE_WORDS,
  ROLES_PAGE,
  withdrawnCountWords,
} from '@/copy/platform-roles';
import { stateWords } from '@/copy/state-copy';
import { useAppNavigation } from '@/nav/navigation';
import {
  holderAddress,
  ROLE_TABS,
  type RoleTab,
  roleTabOf,
  ROLES_ADDRESS,
  rolesAddress,
  rolesPlacement,
} from '@/nav/platform-roles';
import { useRoleHolders } from '@/queries/platform-roles';
import {
  checkRegister,
  type HolderView,
  type RegisterErrors,
  registerErrorsOf,
} from '@/queries/platform-roles-forms';
import { useCommand } from '@/queries/use-command';

import { noteRouteFocus } from '../../shared/workspace-frame/route-focus';
import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { HOLDER_TITLE_ID, noteArrival } from '../sa-17-role-holder/arrival';
import { rowFacts } from '../sa-17-role-holder/holder-view';

/** The board's three columns (B7-08 f0: Role holder · Can act on · Action). */
const COLUMN_COUNT = 3;

/** The open Register dialog: the role it registers (the tab's when it opened) and what is typed. */
interface RegisterForm {
  readonly role: PlatformRole;
  readonly title: string;
  readonly name: string;
  readonly workEmail: string;
  readonly organisation: string;
  readonly errors: RegisterErrors;
  readonly unavailable: boolean;
}

const FIELD_IDS = {
  name: 'roles-register-name',
  workEmail: 'roles-register-work-email',
  organisation: 'roles-register-organisation',
} as const;

/**
 * SA-16 Platform roles — board B7-08 f0 (Reviewers), f3 (Vendors), f6 (Register a Vendor ·
 * validation) and the Content Managers tab (an engine state of f0), at `/admin/roles`
 * (`?tab=reviewers | content-managers`; Vendors is the bare address): “Who can produce, review and
 * publish content — and for what”.
 *
 * - **Read**: `PlatformRoleService.listHolders({ tab })` for each tab — the shown tab's rows and
 *   every tab's count (`useRoleHolders`), first registered first. The holders' scopes are facts
 *   (PC-70); the row writes them (state-copy `SA-16.can-act-on`).
 * - **As B7-08 draws it**: the section titled by the tab, “Register a <role>” in its head, status
 *   tabs Vendors · Reviewers · Content Managers with their counts (`role="tablist"` buttons, rule
 *   T3; ← → between them), the warn notice “N holder(s) with no scope — they can’t act on anything
 *   yet”, the table (Role holder: name, organisation and registration date · Can act on: the
 *   scopes, “Nothing — no scope yet” as a warn tag, “N scope(s) withdrawn” · “Open” to SA-17) and
 *   the foot note, without “(T-11)” (P1-14). Below 760 px of content the rows become labelled
 *   blocks (the v46 table sheet).
 * - **Address**: the tab lives here while the page is on show and the address mirrors it
 *   (replaced, no history entry); `?tab=vendors` and an unknown tab are replaced by the bare
 *   address (state-copy `SA-16.tab-address`).
 * - **Register a <role>** (f6, DL-3): name, work e-mail and organisation, all required and checked
 *   at once with the contract's rules; nothing is sent (T-11). The service refuses an e-mail
 *   already registered or used by another sample identity with SA-16's words (PC-49). Registered:
 *   the new holder opens on SA-17 with B7-08's flash, focus on their name (state-copy
 *   `SA-16.register-result`). Failed for now: the dialog stays open with what was typed.
 * - Undrawn: loading, failed + Try again and a tab with nobody in it (state-copy `SA-16.*`).
 */
export function PlatformRoles() {
  useShellPage(rolesPlacement());
  const navigation = useAppNavigation();
  const asked = roleTabOf(navigation.search);
  // `?tab=vendors` and a tab that does not exist are the bare address (D-11).
  const normalise =
    asked === null || new URLSearchParams(navigation.search).get('tab') === 'vendors';
  useEffect(() => {
    if (normalise) navigation.replace(ROLES_ADDRESS);
  }, [normalise, navigation]);
  const addressed: RoleTab = asked ?? 'vendors';
  const [tab, setTab] = useState<RoleTab>(addressed);
  const [seenSearch, setSeenSearch] = useState(navigation.search);
  if (navigation.search !== seenSearch) {
    setSeenSearch(navigation.search);
    setTab(addressed);
  }

  const reads = {
    vendors: useRoleHolders('vendors'),
    reviewers: useRoleHolders('reviewers'),
    'content-managers': useRoleHolders('content-managers'),
  } satisfies Readonly<Record<RoleTab, ReturnType<typeof useRoleHolders>>>;
  const shown = reads[tab];
  const failed = shown.isError || (shown.data !== undefined && !shown.data.ok);
  const rows: readonly HolderView[] | null = shown.data?.ok ? shown.data.value : null;
  const countOf = (id: RoleTab) => {
    const answer = reads[id].data;
    return answer?.ok ? answer.value.length : undefined;
  };

  const choose = (next: RoleTab) => {
    setTab(next);
    navigation.replace(rolesAddress(next));
  };

  const words = ROLE_TAB_WORDS[tab];
  const [form, setForm] = useState<RegisterForm | null>(null);
  const register = useCommand((ports) => ports.platformRoles.registerHolder);
  // Focus after a refusal the service answered: its first field in error (board 10).
  const [focusRequest, setFocusRequest] = useState<{ readonly id: string; readonly n: number }>({
    id: '',
    n: 0,
  });
  useEffect(() => {
    if (focusRequest.n > 0) document.getElementById(focusRequest.id)?.focus();
  }, [focusRequest]);
  const focusFirstError = (errors: RegisterErrors) => {
    const field = (['name', 'workEmail', 'organisation'] as const).find((key) => errors[key]);
    if (field) setFocusRequest((current) => ({ id: FIELD_IDS[field], n: current.n + 1 }));
  };

  const openRegister = () =>
    setForm({
      role: words.role,
      title: words.register,
      name: '',
      workEmail: '',
      organisation: '',
      errors: {},
      unavailable: false,
    });

  const edit = (field: 'name' | 'workEmail' | 'organisation', value: string) =>
    setForm((current) =>
      current
        ? {
            ...current,
            [field]: value,
            // Editing a field clears its error (B7-08 `onN`, `onE`, `onO`).
            errors: Object.fromEntries(
              Object.entries(current.errors).filter(([key]) => key !== field),
            ),
            unavailable: false,
          }
        : current,
    );

  const confirm = () => {
    if (!form || register.busy) return;
    const draft = {
      role: form.role,
      name: form.name,
      workEmail: form.workEmail,
      organisation: form.organisation,
    };
    const errors = checkRegister(draft);
    if (errors) {
      // The dialog moves focus to the first invalid field itself (board 10).
      setForm({ ...form, errors, unavailable: false });
      return;
    }
    register.run(draft).then(
      (answer) => {
        if (answer.ok) {
          const holder = answer.value;
          const address = holderAddress(holder.id);
          noteArrival(holder.id, registeredFlash(holder.name, holder.role));
          noteRouteFocus(address, HOLDER_TITLE_ID);
          setForm(null);
          navigation.navigate(address);
          return;
        }
        if (answer.error.kind === 'validation-failed') {
          const refused = registerErrorsOf(answer.error);
          setForm((current) => (current ? { ...current, errors: refused } : current));
          focusFirstError(refused);
          return;
        }
        // Not permitted any more (signed out, another workspace): nothing was written.
        setForm(null);
      },
      () => setForm((current) => (current ? { ...current, unavailable: true } : current)),
    );
  };

  return (
    <PageContent wrap="wide">
      <PageHeader
        className="mb-4"
        title={ROLES_PAGE.title}
        meta={<span className="xl-meta">{ROLES_PAGE.meta}</span>}
      />
      <Section
        title={words.label}
        headingId="roles-list"
        headEnd={
          <Button variant="secondary" size="sm" icon="add" onClick={openRegister}>
            {words.register}
          </Button>
        }
      >
        <StatusTabs
          label={ROLES_PAGE.tabsLabel}
          idPrefix="roles"
          className="px-4"
          tabs={ROLE_TABS.map((id) => {
            const count = countOf(id);
            return {
              id,
              label: ROLE_TAB_WORDS[id].label,
              ...(count !== undefined ? { count } : {}),
            };
          })}
          selected={tab}
          onSelect={(id) => choose(id as RoleTab)}
        >
          {failed ? (
            <SectionBody className="pt-4">
              <FailedState title={stateWords('SA-16.failed')} onRetry={() => void shown.refetch()}>
                {stateWords('SA-16.failed.line')}
              </FailedState>
            </SectionBody>
          ) : (
            <HolderTable rows={rows} tabLabel={words.label} />
          )}
        </StatusTabs>
      </Section>
      <p className="xl-open mt-4 mb-0">
        <Icon name="info" size={16} />
        <span>{ROLES_PAGE.footNote}</span>
      </p>
      <EditDialog
        open={form !== null}
        align="start"
        idPrefix="roles-register"
        title={form?.title ?? words.register}
        effect={
          <>
            {REGISTER_DIALOG.rolePrefix}
            <strong>{ROLE_WORDS[form?.role ?? words.role]}</strong>
            {REGISTER_DIALOG.roleTail}
          </>
        }
        confirmLabel={REGISTER_DIALOG.confirm}
        cancelLabel={REGISTER_DIALOG.cancel}
        busy={register.busy}
        busyLabel={REGISTER_DIALOG.busy}
        onConfirm={confirm}
        onCancel={() => setForm(null)}
      >
        {/* B7-08 draws the sentence as `p style="margin:0 0 14px"` and 12 px between the fields. */}
        <Field
          id={FIELD_IDS.name}
          className="mt-[14px]"
          label={REGISTER_DIALOG.name}
          error={form?.errors.name}
        >
          <TextInput
            value={form?.name ?? ''}
            onChange={(event) => edit('name', event.target.value)}
          />
        </Field>
        <div className="h-3" />
        <Field
          id={FIELD_IDS.workEmail}
          label={REGISTER_DIALOG.workEmail}
          error={form?.errors.workEmail}
        >
          <TextInput
            type="email"
            value={form?.workEmail ?? ''}
            onChange={(event) => edit('workEmail', event.target.value)}
          />
        </Field>
        <div className="h-3" />
        <Field
          id={FIELD_IDS.organisation}
          label={REGISTER_DIALOG.organisation}
          error={form?.errors.organisation}
        >
          <TextInput
            value={form?.organisation ?? ''}
            onChange={(event) => edit('organisation', event.target.value)}
          />
        </Field>
        <div className="h-3" />
        {form?.unavailable ? (
          <Notice tone="err">{stateWords('SA-16.register.unavailable')}</Notice>
        ) : null}
      </EditDialog>
    </PageContent>
  );
}

/**
 * The tab's panel (f0, f3): the no-scope notice and the table, or the loading rows, or nobody
 * registered yet. The table wrap stays mounted while a tab loads, so its status is announced.
 */
function HolderTable({
  rows,
  tabLabel,
}: {
  readonly rows: readonly HolderView[] | null;
  readonly tabLabel: string;
}) {
  const withoutScope = rows ? rows.filter((row) => rowFacts(row).inScope.length === 0).length : 0;
  if (rows !== null && rows.length === 0) {
    return (
      <SectionBody className="pt-3">
        <EmptyState
          icon="platformRoles"
          headingLevel={3}
          title={stateWords('SA-16.empty').replace('{roles}', tabLabel)}
        >
          {stateWords('SA-16.empty.line')}
        </EmptyState>
      </SectionBody>
    );
  }
  return (
    <>
      {withoutScope > 0 ? (
        <div className="px-6 pt-3">
          <Notice tone="warn" title={noScopeTitle(withoutScope)}>
            {ROLES_PAGE.noScopeLine}
          </Notice>
        </div>
      ) : null}
      <LoadingState
        label={stateWords('SA-16.loading')}
        loading={rows === null}
        skeleton={<SkeletonRows />}
        className="mt-3 rounded-none border-x-0 border-b-0"
      >
        <table className="xr-table">
          <thead>
            <tr>
              <th scope="col">{ROLES_PAGE.columns.holder}</th>
              <th scope="col">{ROLES_PAGE.columns.canActOn}</th>
              <th scope="col">
                <VisuallyHidden>{ROLES_PAGE.columns.action}</VisuallyHidden>
              </th>
            </tr>
          </thead>
          <tbody>
            {(rows ?? []).map((row) => (
              <HolderRow key={row.holder.id} row={row} />
            ))}
          </tbody>
        </table>
      </LoadingState>
    </>
  );
}

/** One row as B7-08 draws it (f0, f3). */
function HolderRow({ row }: { readonly row: HolderView }) {
  const { holder } = row;
  const { inScope, withdrawn } = rowFacts(row);
  return (
    <tr>
      <td className="is-primary">
        <strong>{holder.name}</strong>
        <span className="xr-meta block">
          {registeredLine(holder.organisation, dayMonthYear(holder.registeredAt))}
        </span>
      </td>
      <td data-label={ROLES_PAGE.columns.canActOn}>
        {inScope.length > 0 ? (
          inScope.join(', ')
        ) : (
          <span className="xw-tag xw-tag--warn">{ROLES_PAGE.nothing}</span>
        )}
        {withdrawn > 0 ? (
          <span className="xr-meta mt-1 block">{withdrawnCountWords(withdrawn)}</span>
        ) : null}
      </td>
      <td>
        <Link
          className="xr-btn xr-btn--secondary xr-btn--sm"
          href={holderAddress(holder.id)}
          aria-label={openHolderLabel(holder.name)}
        >
          {ROLES_PAGE.open}
        </Link>
      </td>
    </tr>
  );
}

/** Skeleton rows in the table's shape (board 04 "Skeleton in the shape of the content"). */
function SkeletonRows() {
  return (
    <table className="xr-table" aria-hidden="true">
      <tbody>
        {Array.from({ length: 2 }, (_, row) => (
          <tr key={row}>
            {Array.from({ length: COLUMN_COUNT }, (_, column) => (
              <td key={column}>
                <Skeleton />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
