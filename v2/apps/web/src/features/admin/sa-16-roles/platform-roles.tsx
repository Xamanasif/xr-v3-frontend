'use client';

import type { PlatformRole } from '@xr/domain';
import {
  Button,
  ButtonLink,
  CellLines,
  ConfirmDialog,
  CourseCode,
  Field,
  LinkTabs,
  ListFoot,
  ListState,
  LoadingRows,
  Notice,
  PageHead,
  QuietLine,
  RecordTable,
  type RecordTableRow,
  StatusPill,
  Surface,
  TextInput,
} from '@xr/ui/v3';
import { Fragment, useEffect, useState } from 'react';

import { dayMonthYear, weekdayDate } from '@/copy/dates';
import {
  holderRowLabel,
  holdersCaption,
  noScopeLine,
  noScopeTitle,
  REGISTER_DIALOG,
  registeredFlash,
  ROLE_TAB_WORDS,
  ROLES_PAGE,
  withdrawnCountWords,
} from '@/copy/platform-roles';
import { SA_FAILED } from '@/copy/sa-shared';
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
import { useSession } from '@/queries/session';
import { useCommand } from '@/queries/use-command';

import { noteRouteFocus } from '../../shared/workspace-frame/route-focus';
import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { HOLDER_TITLE_ID, noteArrival } from '../sa-17-role-holder/arrival';
import { rowFacts } from '../sa-17-role-holder/holder-view';

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
 * SA-16 Platform roles — the owner-approved V3 design (design/v3-refined-b/roles/SA-v1,
 * `sa-views-d.js` `V.roles`, `SA.DLG.register`) at `/admin/roles` (`?tab=reviewers |
 * content-managers`; Vendors is the bare address): “Who can produce, review and publish content,
 * and for what.”
 *
 * - **Read**: `PlatformRoleService.listHolders({ tab })` for each tab — the shown tab's rows and
 *   every tab's count (`useRoleHolders`), first registered first. The holders' scopes are facts
 *   (PC-70); the row writes them (state-copy `SA-16.can-act-on`).
 * - **As the export draws it**: the page head with “Register a <role>” (navy), the page tabs
 *   Vendors · Reviewers · Content Managers with their counts (links: each tab is an address), the
 *   warn notice for the tab's holders with no scope (“Assign scope” opens the first of them), the
 *   holders' table (Role holder and organisation · Can act on: the course code chips, “All
 *   experiments” or the experiment, “N scope(s) withdrawn” · Work e-mail · Registered · Scope:
 *   Has scope / No scope; the whole row opens SA-17) and the foot note in the surface.
 * - **Address**: the tab is the address; `?tab=vendors` and an unknown tab are replaced by the
 *   bare address (state-copy `SA-16.tab-address`).
 * - **Register a <role>** (`SA.DLG.register`): name, work e-mail and organisation, all required and
 *   checked at once with the contract's rules; nothing is sent (T-11). The service refuses an
 *   e-mail already registered or used by another sample identity with SA-16's words (PC-49).
 *   Registered: the new holder opens on SA-17 with the flash, focus on their name (state-copy
 *   `SA-16.register-result`). Failed for now: the dialog stays open with what was typed.
 * - Loading, failed + Try again, and a tab with nobody in it, as the export's list states.
 */
export function PlatformRoles() {
  useShellPage(rolesPlacement());
  const navigation = useAppNavigation();
  const session = useSession();
  const asked = roleTabOf(navigation.search);
  // `?tab=vendors` and a tab that does not exist are the bare address (D-11).
  const normalise =
    asked === null || new URLSearchParams(navigation.search).get('tab') === 'vendors';
  useEffect(() => {
    if (normalise) navigation.replace(ROLES_ADDRESS);
  }, [normalise, navigation]);
  const tab: RoleTab = asked ?? 'vendors';

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

  const words = ROLE_TAB_WORDS[tab];
  const [form, setForm] = useState<RegisterForm | null>(null);
  const register = useCommand((ports) => ports.platformRoles.registerHolder);
  // Focus after a refusal the service answered: its first field in error.
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
            // Editing a field clears its error.
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
      // The dialog moves focus to the first invalid field itself.
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

  const withoutScope = rows
    ? rows.filter((row) => rowFacts(row).inScope.length === 0).map((row) => row.holder)
    : [];
  const first = withoutScope[0];

  let body;
  if (failed) {
    body = (
      <ListState
        kind="failed"
        title={stateWords('SA-16.failed')}
        action={<Button onClick={() => void shown.refetch()}>{SA_FAILED.retry}</Button>}
      >
        {SA_FAILED.line}
      </ListState>
    );
  } else if (rows === null) {
    body = <LoadingRows message={stateWords('SA-16.loading')} />;
  } else if (rows.length === 0) {
    body = (
      <ListState kind="empty" icon="person" title={stateWords('SA-16.empty')}>
        {stateWords('SA-16.empty.line')}
      </ListState>
    );
  } else {
    body = (
      <RecordTable
        caption={holdersCaption(words.label)}
        headers={{
          who: ROLES_PAGE.columns.holder,
          what: ROLES_PAGE.columns.canActOn,
          kind: ROLES_PAGE.columns.workEmail,
          when: ROLES_PAGE.columns.registered,
          status: ROLES_PAGE.columns.scope,
        }}
        whenLabel={ROLES_PAGE.columns.registered}
        rows={rows.map(holderRow)}
      />
    );
  }

  return (
    <>
      <PageHead
        title={ROLES_PAGE.title}
        titleFocusTarget
        date={session.status === 'signed-in' ? weekdayDate(session.signedInAt) : undefined}
        lead={ROLES_PAGE.lead}
        actions={
          <Button variant="navy" icon="add" onClick={openRegister}>
            {words.register}
          </Button>
        }
      />
      <LinkTabs
        pageTabs
        label={ROLES_PAGE.tabsLabel}
        tabs={ROLE_TABS.map((id) => {
          const count = countOf(id);
          return {
            label: ROLE_TAB_WORDS[id].label,
            href: rolesAddress(id),
            current: id === tab,
            ...(count !== undefined ? { count } : {}),
          };
        })}
      />
      {first ? (
        <Notice
          tone="warn"
          icon="userQuestion"
          title={noScopeTitle(withoutScope.map((holder) => holder.name))}
          actions={<ButtonLink href={holderAddress(first.id)}>{ROLES_PAGE.assignScope}</ButtonLink>}
        >
          {noScopeLine(words.role)}
        </Notice>
      ) : null}
      <Surface label={words.label} busy={rows === null && !failed}>
        {body}
        <ListFoot>{ROLES_PAGE.footNote}</ListFoot>
      </Surface>
      <ConfirmDialog
        initialFocus="field"
        submitOnEnter
        open={form !== null}
        idPrefix="roles-register"
        title={form?.title ?? words.register}
        description={REGISTER_DIALOG.description}
        confirmLabel={REGISTER_DIALOG.confirm}
        cancelLabel={REGISTER_DIALOG.cancel}
        busy={register.busy}
        busyLabel={REGISTER_DIALOG.busy}
        onConfirm={confirm}
        onCancel={() => setForm(null)}
      >
        <Field id={FIELD_IDS.name} label={REGISTER_DIALOG.name} error={form?.errors.name}>
          <TextInput
            autoComplete="off"
            value={form?.name ?? ''}
            onChange={(event) => edit('name', event.target.value)}
          />
        </Field>
        <Field
          id={FIELD_IDS.workEmail}
          label={REGISTER_DIALOG.workEmail}
          error={form?.errors.workEmail}
        >
          <TextInput
            type="email"
            autoComplete="off"
            value={form?.workEmail ?? ''}
            onChange={(event) => edit('workEmail', event.target.value)}
          />
        </Field>
        <Field
          id={FIELD_IDS.organisation}
          label={REGISTER_DIALOG.organisation}
          error={form?.errors.organisation}
        >
          <TextInput
            autoComplete="off"
            value={form?.organisation ?? ''}
            onChange={(event) => edit('organisation', event.target.value)}
          />
        </Field>
        {form?.unavailable ? (
          <Notice
            tone="warn"
            icon="alertCircle"
            role="status"
            title={stateWords('SA-16.register.unavailable')}
          />
        ) : null}
      </ConfirmDialog>
    </>
  );
}

/** One row of the holders' table (the export's `V.roles` row). */
function holderRow(row: HolderView): RecordTableRow {
  const { holder } = row;
  const { inScope, withdrawn } = rowFacts(row);
  const hasScope = inScope.length > 0;
  return {
    key: holder.id,
    href: holderAddress(holder.id),
    title: holder.name,
    linkLabel: holderRowLabel(holder.name, holder.role, hasScope),
    titleDetail: holder.organisation,
    what: (
      <CellLines
        strong={
          hasScope
            ? inScope.map((scope, index) => (
                <Fragment key={index}>
                  {index > 0 ? ' ' : null}
                  {scope.code ? <CourseCode code={scope.code} /> : scope.short}
                </Fragment>
              ))
            : ROLES_PAGE.nothing
        }
        small={withdrawn > 0 ? withdrawnCountWords(withdrawn) : undefined}
      />
    ),
    kind: <QuietLine flush>{holder.workEmail}</QuietLine>,
    when: dayMonthYear(holder.registeredAt),
    status: (
      <StatusPill tone={hasScope ? 'ok' : 'warn'}>
        {hasScope ? ROLES_PAGE.hasScope : ROLES_PAGE.noScope}
      </StatusPill>
    ),
  };
}
