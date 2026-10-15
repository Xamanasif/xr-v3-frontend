'use client';

import type { GroupDirectoryRow, ServiceError } from '@xr/contracts/draft';
import { EditDialog, EmptyState, Field, FormatSet, Link, Notice, TextInput } from '@xr/ui';
import { Fragment, useEffect, useRef, useState } from 'react';

import {
  CREATE_DIALOG,
  createdFlash,
  groupCountWords,
  GROUPS_TAB,
  memberCountWords,
  openGroupLabel,
} from '@/copy/groups';
import { STUDENTS_TAB } from '@/copy/institute-people';
import { stateWords } from '@/copy/state-copy';
import { groupAddress } from '@/nav/institute';
import { useGroupList } from '@/queries/people';
import { useCurrentSession } from '@/queries/session';
import { useCommand } from '@/queries/use-command';

import { ListFailed, ListLoading } from '../ia-06-people/list-parts';
import { formatCodes } from '../ia-06-people/students';

/** The People page's "Create group" header button, where DL-3 returns focus (B2-08 `focus(pid + '-create')`). */
export const CREATE_GROUP_ID = 'groups-create';

const NAME_ID = 'groups-create-name';

/**
 * IA-13 People › Groups — board B2-08 f0 … f2, the People page's `?tab=groups`: every group of the
 * institution as `GroupService.listGroups` answers it — its name (opening IA-14) and ID, its member
 * count and the experiments its active grants give it now, each with the plan's formats ("None
 * yet"). The count "2 groups" is announced.
 *
 * - **Create group** (DL-3, f1): the People page owns the header's button (`id="groups-create"`);
 *   `creating` opens the dialog here. The name goes to `createGroup` as typed; the service answers
 *   "Enter a name for the group" or "A group called “…” already exists" on the field, which takes
 *   focus. Created: the dialog closes and the flash "Group “…” created. Add students to it next."
 *   takes focus. Cancel and Close give focus back to "Create group". A failure for now keeps the
 *   dialog and the name; any other refusal closes it and reads the list and the session again.
 * - **Paused institution**: the list only — the People page shows the read-only notice and no
 *   "Create group"; no dialog opens.
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
  const [flash, setFlash] = useState<string | null>(null);
  const [focusRequest, setFocusRequest] = useState<{ readonly id: string; readonly n: number }>({
    id: '',
    n: 0,
  });
  const flashRef = useRef<HTMLDivElement>(null);

  // Focus moves after the commit that shows its target (B2-08 `focus(id)`): the flash after
  // creating, the name after its error. The dialog has given focus back to its trigger in the same
  // commit (a child's effect runs first), so this request wins.
  useEffect(() => {
    if (focusRequest.n === 0) return;
    const target =
      focusRequest.id === 'flash' ? flashRef.current : document.getElementById(focusRequest.id);
    target?.focus();
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
          setFlash(createdFlash(answer.value.name));
          focus('flash');
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

  let list;
  if (failed) {
    // B2-06 f5's line and button: the Groups tab's failure shares them (state-copy `IA-13.failed`).
    list = (
      <ListFailed
        title={stateWords('IA-13.failed')}
        line={STUDENTS_TAB.failedLine}
        retryLabel={STUDENTS_TAB.tryAgain}
        onRetry={() => void read.refetch()}
      />
    );
  } else if (loading) {
    list = (
      <ListLoading
        label={stateWords('IA-13.loading')}
        columns="grid-cols-[1.4fr_120px_1.6fr]"
        cells={3}
      />
    );
  } else {
    list = (
      <>
        <p className="xr-meta mt-0 mb-3" role="status">
          {groupCountWords(groups.length)}
        </p>
        <div ref={flashRef} id="groups-flash" tabIndex={-1} className={flash ? 'mb-4' : undefined}>
          {flash ? <Notice tone="ok">{flash}</Notice> : null}
        </div>
        {groups.length > 0 ? (
          <GroupTable rows={groups} />
        ) : (
          <div className="xr-section">
            <EmptyState icon="studentsPeople" title={stateWords('IA-13.empty')} />
          </div>
        )}
      </>
    );
  }

  return (
    <>
      {list}
      <EditDialog
        open={creating && !paused}
        align="start"
        returnFocusFallback={flashRef}
        idPrefix="groups-create-dialog"
        title={CREATE_DIALOG.title}
        confirmLabel={CREATE_DIALOG.confirm}
        busy={create.busy}
        onConfirm={confirm}
        onCancel={close}
      >
        <Field
          id={NAME_ID}
          label={CREATE_DIALOG.nameLabel}
          hint={CREATE_DIALOG.nameHint}
          errorClass="xw-ferr"
          error={nameError ?? undefined}
        >
          <TextInput
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              setNameError(null);
            }}
          />
        </Field>
      </EditDialog>
    </>
  );
}

/** B2-08 f0 table: "Group · Members · Experiments given to the group". */
function GroupTable({ rows }: { readonly rows: readonly GroupDirectoryRow[] }) {
  const { columns } = GROUPS_TAB;
  return (
    <div className="xr-table-wrap">
      <table className="xr-table">
        <caption className="xr-sr">{GROUPS_TAB.caption}</caption>
        <thead>
          <tr>
            <th scope="col">{columns.group}</th>
            <th scope="col">{columns.members}</th>
            <th scope="col">{columns.given}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.group.id}>
              <td className="is-primary">
                <Link href={groupAddress(row.group.id)} aria-label={openGroupLabel(row.group.name)}>
                  <strong>{row.group.name}</strong>
                </Link>
                <span className="xr-sub xr-id">{row.group.id}</span>
              </td>
              <td data-label={columns.members}>{memberCountWords(row.memberCount)}</td>
              <td data-label={columns.given}>
                {row.given.length > 0 ? (
                  // Several experiments: one name and its formats each (state-copy `IA-13.several`).
                  row.given.map((given) => (
                    <Fragment key={given.experimentId}>
                      {given.name}
                      <span className="xr-sub">
                        <FormatSet compact formats={formatCodes(given.formats)} />
                      </span>
                    </Fragment>
                  ))
                ) : (
                  <span className="text-ink-3">{GROUPS_TAB.noneYet}</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
