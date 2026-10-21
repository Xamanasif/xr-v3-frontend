'use client';

import type { GroupDirectoryRow, ServiceError } from '@xr/contracts/draft';
import {
  Button,
  ButtonLink,
  ConfirmDialog,
  Field,
  IaCellLine,
  IaCellText,
  IaFormatBadges,
  IaGroupsTable,
  IaManageFoot,
  IaManageSurface,
  ListState,
  LoadingRows,
  TextInput,
} from '@xr/ui/v3';
import { useEffect, useRef, useState } from 'react';

import {
  CREATE_DIALOG,
  createdFlash,
  GROUPS_TAB,
  memberCountWords,
  openGroupLabel,
} from '@/copy/groups';
import { GROUPS_V3, PEOPLE_V3, planFormatsLabel } from '@/copy/ia-people';
import { STUDENTS_TAB } from '@/copy/institute-people';
import { stateWords } from '@/copy/state-copy';
import { groupAddress } from '@/nav/institute';
import { useGroupList } from '@/queries/people';
import { useCurrentSession } from '@/queries/session';
import { useCommand } from '@/queries/use-command';

import { PeopleFlash, PeoplePausedNotice } from '../ia-06-people/people-parts';
import { formatCodes } from '../shared/format-codes';

/** The People page's "Create group" header button, where DL-3 returns focus (B2-08 `focus(pid + '-create')`). */
export const CREATE_GROUP_ID = 'groups-create';

/** The empty state's "Create group" (the export's `pg-create-empty`). */
const CREATE_EMPTY_ID = 'pg-create-empty';
const NAME_ID = 'groups-create-name';
const FLASH_ID = 'groups-flash';
const TITLE_ID = 'pg-h';

/** One skeleton row: the name, the members, the experiments given. */
const SKELETON = [1, 1, 2] as const;

/**
 * IA-13 People › Groups — the V3 export's Groups tab (IA-v1 `Main.dc.html` IA-13): every group of
 * the institution as `GroupService.listGroups` answers it, in the role's list table — its name
 * (opening IA-14; the whole row a link), its members ("7 members", "No members yet") and the
 * experiments its active grants give it now, each with the plan's formats ("None yet"). The tab's
 * count names how many groups there are; no group is named by its internal reference.
 *
 * - **Create group** (DL-3): the People page owns the header's button (`id="groups-create"`), the
 *   empty state draws its own; `creating` opens the dialog here, its name field focused (Enter
 *   confirms). The name goes to `createGroup` as typed; the service answers "Enter a name for the
 *   group" or "A group called “…” already exists" on the field, which takes focus. Created: the
 *   dialog closes and the flash "Saved — Group “…” created. Add students to it next." with "Open the
 *   group" takes focus. Cancel and Esc give focus back to the button that opened it. A failure for
 *   now keeps the dialog and the name; any other refusal closes it and reads the list and the
 *   session again.
 * - **Paused institution**: the list only — the read-only notice, no "Create group", no dialog.
 */
export function GroupsTab({
  paused,
  creating,
  onCreatingChange,
}: {
  readonly paused: boolean;
  readonly creating: boolean;
  readonly onCreatingChange: (creating: boolean) => void;
}) {
  const read = useGroupList();
  const session = useCurrentSession();
  const create = useCommand((ports) => ports.groups.createGroup);
  const [name, setName] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [flash, setFlash] = useState<{ readonly words: string; readonly id: string } | null>(null);
  const [focusRequest, setFocusRequest] = useState<{ readonly id: string; readonly n: number }>({
    id: '',
    n: 0,
  });
  // Where focus goes when the button that opened the dialog is gone (paused meanwhile): the H1.
  const fallback = useRef<HTMLElement | null>(null);
  useEffect(() => {
    fallback.current = document.getElementById('ia-h1');
  });

  // Focus moves after the commit that shows its target (B2-08 `focus(id)`): the flash after
  // creating, the name after its error. The dialog has given focus back to its trigger in the same
  // commit (a child's effect runs first), so this request wins.
  useEffect(() => {
    if (focusRequest.n === 0) return;
    document.getElementById(focusRequest.id)?.focus();
  }, [focusRequest]);
  const focus = (id: string) => setFocusRequest((current) => ({ id, n: current.n + 1 }));

  const close = () => {
    onCreatingChange(false);
    setName('');
    setNameError(null);
  };

  /** A refusal other than the name's: nothing was written; read again (state-copy `IA-13.refused`). */
  const refused = (error: ServiceError) => {
    close();
    void read.refetch();
    if (error.kind === 'refused' || error.kind === 'not-permitted') void session.refetch();
  };

  const confirm = () => {
    create.run({ name }).then(
      (answer) => {
        if (answer.ok) {
          close();
          setFlash({ words: createdFlash(answer.value.name), id: answer.value.id });
          focus(FLASH_ID);
        } else if (answer.error.kind === 'validation-failed') {
          const field = answer.error.fieldErrors.find((error) => error.field === 'name');
          setNameError(field?.message ?? null);
          focus(NAME_ID);
        } else refused(answer.error);
      },
      // Failed for now: the dialog and the name stay (state-copy `IA-13.unavailable`).
      () => undefined,
    );
  };

  const failed = read.isError || (read.data !== undefined && !read.data.ok);
  const loading = !failed && read.isPending;
  const groups: readonly GroupDirectoryRow[] = read.data?.ok ? read.data.value : [];

  let body;
  if (failed) {
    // B2-06 f5's line and button: the Groups tab's failure shares them (state-copy `IA-13.failed`).
    body = (
      <ListState
        kind="failed"
        title={stateWords('IA-13.failed')}
        action={<Button onClick={() => void read.refetch()}>{STUDENTS_TAB.tryAgain}</Button>}
      >
        {STUDENTS_TAB.failedLine}
      </ListState>
    );
  } else if (loading) {
    body = <LoadingRows message={stateWords('IA-13.loading')} rows={1} cells={SKELETON} />;
  } else if (groups.length === 0) {
    body = (
      <ListState
        kind="empty"
        roomy
        titleAs="h2"
        icon="people"
        title={stateWords('IA-13.empty')}
        action={
          paused ? null : (
            <Button id={CREATE_EMPTY_ID} onClick={() => onCreatingChange(true)}>
              {GROUPS_TAB.createGroup}
            </Button>
          )
        }
      >
        {GROUPS_V3.emptyLine}
      </ListState>
    );
  } else {
    const { columns } = GROUPS_TAB;
    body = (
      <IaGroupsTable
        caption={GROUPS_V3.caption}
        headers={{ group: columns.group, members: columns.members, given: columns.given }}
        givenLabel={GROUPS_V3.givenLabel}
        rows={groups.map((row) => ({
          key: row.group.id,
          name: row.group.name,
          href: groupAddress(row.group.id),
          accessibleName: openGroupLabel(row.group.name),
          members: row.memberCount === 0 ? GROUPS_V3.noMembers : memberCountWords(row.memberCount),
          given:
            row.given.length > 0 ? (
              // Several experiments: one line each (state-copy `IA-13.several`).
              row.given.map((given) => {
                const codes = formatCodes(given.formats);
                return (
                  <IaCellLine key={given.experimentId} kind="exp">
                    <IaCellText kind="text">{given.name}</IaCellText>
                    <IaFormatBadges formats={codes} label={planFormatsLabel(codes)} />
                  </IaCellLine>
                );
              })
            ) : (
              <IaCellText kind="muted">{GROUPS_TAB.noneYet}</IaCellText>
            ),
        }))}
      />
    );
  }

  return (
    <>
      {paused ? <PeoplePausedNotice line={PEOPLE_V3.paused.groups} /> : null}
      {flash ? (
        <PeopleFlash
          id={FLASH_ID}
          action={<ButtonLink href={groupAddress(flash.id)}>{GROUPS_V3.openGroup}</ButtonLink>}
        >
          {flash.words}
        </PeopleFlash>
      ) : null}
      <IaManageSurface labelledBy={TITLE_ID} hiddenTitle={GROUPS_V3.sectionTitle}>
        {body}
        <IaManageFoot>{GROUPS_V3.foot}</IaManageFoot>
      </IaManageSurface>
      <ConfirmDialog
        open={creating && !paused}
        idPrefix="groups-create-dialog"
        title={CREATE_DIALOG.title}
        initialFocus="field"
        submitOnEnter
        confirmLabel={CREATE_DIALOG.confirm}
        cancelLabel={PEOPLE_V3.cancel}
        busyLook
        busy={create.busy}
        returnFocusFallback={fallback}
        onConfirm={confirm}
        onCancel={close}
      >
        <Field
          id={NAME_ID}
          label={CREATE_DIALOG.nameLabel}
          hint={CREATE_DIALOG.nameHint}
          error={nameError ?? undefined}
        >
          <TextInput
            autoComplete="off"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setNameError(null);
            }}
          />
        </Field>
      </ConfirmDialog>
    </>
  );
}
