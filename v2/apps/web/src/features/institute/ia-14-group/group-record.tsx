'use client';

import type {
  GrantRow,
  GroupRecordView,
  ServiceError,
  StudentDirectoryRow,
} from '@xr/contracts/draft';
import {
  BackLink,
  Button,
  ConfirmDialog,
  EditDialog,
  EmptyState,
  Field,
  FormatSet,
  Link,
  Notice,
  PageContent,
  PageHeader,
  Section,
  StatusPill,
  TextInput,
} from '@xr/ui';
import { useEffect, useRef, useState } from 'react';

import { dayMonthYear } from '@/copy/dates';
import {
  addedFlash,
  addLabel,
  candidateLine,
  givenOnWords,
  GROUP_PAGE,
  memberCountWords,
  REMOVE_DIALOG,
  removeBody,
  removedFlash,
  removeLabel,
  removeTitle,
  RENAME_DIALOG,
  standingLinePrefix,
} from '@/copy/groups';
import { fromPlanWords, OTHER_GRANT_WORDS, PEOPLE_PAGE } from '@/copy/institute-people';
import { stateWords } from '@/copy/state-copy';
import {
  giveAccessAddress,
  GROUPS_ADDRESS,
  INSTITUTE_HELP_ADDRESS,
  studentRecordAddress,
  underPlacement,
} from '@/nav/institute';
import { useGroupRecord } from '@/queries/institute-records';
import { useAllStudents } from '@/queries/people';
import { useStudentAccessRows } from '@/queries/student-access';
import { useCommand } from '@/queries/use-command';

import { type RecordRead, RecordGuard } from '../../shared/record-guard/record-guard';
import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { PausedNotice, useInstitutionPaused } from '../ia-06-people/paused';
import { formatCodes } from '../ia-06-people/students';
import {
  type GroupGrantLine,
  type GroupMember,
  liveGrants,
  memberStatus,
  type MemberStatus,
} from './group-view';

const RENAME_ID = 'group-rename';
const NAME_ID = 'group-rename-name';
const ADD_ID = 'group-add';
const ADD_HEADING_ID = 'group-add-heading';

/** What the page shows: the group, and the reads its words need beside it. */
interface GroupPage {
  readonly view: GroupRecordView;
  /** Student access (IA-04) rows: the ID "Has it individually · SACC-0310" names. */
  readonly accessRows: readonly GrantRow[];
  /** Every student of the institution: the "Add students" candidates. */
  readonly students: readonly StudentDirectoryRow[];
}

/**
 * IA-14 Group — board B2-08 f3 … f10, at `/institute/people/groups/[groupId]`.
 *
 * - **Read**: `GroupService.getGroup` — the group, its current members with their standing per live
 *   group grant and its grants as the page names them — with the Student access rows (the member's
 *   own grant ID) and every student (the candidates). An address naming no group of the admin's
 *   institution — unknown or another institution's — shows the in-shell not-found page.
 * - **Members**: each student (opening their record) and their status in words: "Inactive" with
 *   "Can’t open experiments while inactive"; "Active" while the group has no live grant; else per
 *   live grant the service's standing — "Can open it", "Has it individually · SACC-…", "Waiting for a
 *   licence" (a supplied wait, D7), "Added after the group grant" (OD-B2-02: no promise either way)
 *   or, for the undecided overlap, words that state no can / can't (OD-B2-01).
 * - **Act** (each sent with the group's revision as the page showed it): "Add students" opens the
 *   inline panel (institution students not in the group; "Add 2 students" → `addMembers`);
 *   "Remove…" opens DL-1 (`removeMember` — only the membership changes, never a grant; GRP-05:
 *   nothing is said about access); "Rename" opens DL-3 (`renameGroup`, the service's words on the
 *   field). "Give this group access" opens IA-05 with the group chosen. Each result is said in the
 *   flash. A refusal because the group moved on writes nothing: the dialog or panel closes, the
 *   page reads again and focus goes to the title; a failure for now keeps the dialog or panel.
 * - **Paused institution**: read-only — no write is offered and the paused notice shows.
 */
export function GroupRecord({ groupId }: { readonly groupId: string }) {
  const group = useGroupRecord(groupId);
  const access = useStudentAccessRows();
  const students = useAllStudents();
  useShellPage(
    underPlacement('IA-14', group.data?.ok ? group.data.value.group.name : null, [
      { label: PEOPLE_PAGE.tabs.groups, href: GROUPS_ADDRESS },
    ]),
  );

  const refetch = () => {
    void group.refetch();
    void access.refetch();
    void students.refetch();
  };

  // One read for the guard: the group decides found or not; the page waits for all three.
  const answer = group.data;
  const settled = access.data !== undefined && students.data !== undefined;
  const read: RecordRead<GroupPage> = {
    data:
      answer === undefined || !answer.ok
        ? answer
        : settled
          ? {
              ...answer,
              value: {
                view: answer.value,
                accessRows: access.data?.ok ? access.data.value : [],
                students: students.data?.ok ? students.data.value : [],
              },
            }
          : undefined,
    isPending: group.isPending || (answer?.ok === true && !settled),
    isError: group.isError || access.isError || students.isError,
    refetch,
  };

  return (
    <PageContent wrap="read">
      <RecordGuard
        read={read}
        loadingLabel={stateWords('IA-14.loading')}
        failed={{
          title: stateWords('IA-14.failed'),
          line: stateWords('IA-14.failed.line'),
          reportHref: `${INSTITUTE_HELP_ADDRESS}/report`,
        }}
      >
        {(page) => <GroupContent page={page} refetch={refetch} />}
      </RecordGuard>
    </PageContent>
  );
}

/** A student's id, as the records type it. */
type StudentId = StudentDirectoryRow['student']['id'];

/** An open dialog, with the group's revision as the page showed it when it opened. */
type Dialog =
  | {
      readonly kind: 'remove';
      readonly studentId: StudentId;
      readonly fullName: string;
      readonly expectedRev: number;
    }
  | { readonly kind: 'rename'; readonly name: string; readonly expectedRev: number };

/** The open "Add students" panel: who is picked, and the revision when it opened. */
interface Adding {
  readonly picked: readonly StudentId[];
  readonly expectedRev: number;
}

function GroupContent({
  page,
  refetch,
}: {
  readonly page: GroupPage;
  readonly refetch: () => void;
}) {
  const { view, accessRows, students } = page;
  const { group } = view;
  const sessionPaused = useInstitutionPaused();
  const [refusedPaused, setRefusedPaused] = useState(false);
  const paused = sessionPaused || refusedPaused;
  const [dialog, setDialog] = useState<Dialog | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [adding, setAdding] = useState<Adding | null>(null);
  const [flash, setFlash] = useState<string | null>(null);
  const [focusRequest, setFocusRequest] = useState<{ readonly id: string; readonly n: number }>({
    id: '',
    n: 0,
  });
  const titleRef = useRef<HTMLHeadingElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const rename = useCommand((ports) => ports.groups.renameGroup);
  const remove = useCommand((ports) => ports.groups.removeMember);
  const add = useCommand((ports) => ports.groups.addMembers);

  // Focus moves after the commit that shows its target (B2-08 `focus(id)`): the panel's heading
  // when it opens and "Add students" when it closes, the flash after adding or removing, "Rename"
  // after renaming, the name after its error, the page title after a refusal that re-reads the page
  // (and wherever a target is gone). A dialog has given focus back to its trigger in the same
  // commit (a child's effect runs first), so this request wins.
  useEffect(() => {
    if (focusRequest.n === 0) return;
    const target =
      focusRequest.id === 'flash'
        ? flashRef.current
        : focusRequest.id === 'title'
          ? titleRef.current
          : (document.getElementById(focusRequest.id) ?? titleRef.current);
    target?.focus();
  }, [focusRequest]);
  const focus = (id: string) => setFocusRequest((current) => ({ id, n: current.n + 1 }));

  const closeDialog = () => {
    setDialog(null);
    setNameError(null);
  };

  const done = (words: string, then: string) => {
    closeDialog();
    setAdding(null);
    setFlash(words);
    focus(then);
  };

  /** Nothing was written: close, read again, focus the title (state-copy `IA-14.moved-on`). */
  const refused = (error: ServiceError) => {
    closeDialog();
    setAdding(null);
    if (error.kind === 'refused' && error.code === 'institution-paused') setRefusedPaused(true);
    refetch();
    focus('title');
  };

  const confirmDialog = () => {
    if (!dialog) return;
    if (dialog.kind === 'rename') {
      rename.run({ id: group.id, name: dialog.name, expectedRev: dialog.expectedRev }).then(
        (answer) => {
          if (answer.ok) done(GROUP_PAGE.renamedFlash, RENAME_ID);
          else if (answer.error.kind === 'validation-failed') {
            const field = answer.error.fieldErrors.find((error) => error.field === 'name');
            if (!field) {
              refused(answer.error);
              return;
            }
            setNameError(field.message);
            focus(NAME_ID);
          } else refused(answer.error);
        },
        // Failed for now: the dialog and the name stay (state-copy `IA-14.unavailable`).
        () => undefined,
      );
      return;
    }
    const { studentId, fullName, expectedRev } = dialog;
    remove.run({ id: group.id, studentId, expectedRev }).then(
      (answer) => {
        if (answer.ok) done(removedFlash(fullName), 'flash');
        else refused(answer.error);
      },
      () => undefined,
    );
  };

  const confirmAdd = () => {
    if (!adding || adding.picked.length === 0) return;
    const studentIds = [...adding.picked];
    add.run({ id: group.id, studentIds, expectedRev: adding.expectedRev }).then(
      (answer) => {
        if (answer.ok) done(addedFlash(studentIds.length), 'flash');
        else refused(answer.error);
      },
      // Failed for now: the panel and the picks stay (state-copy `IA-14.unavailable`).
      () => undefined,
    );
  };

  const startAdd = () => {
    setAdding({ picked: [], expectedRev: group.rev });
    focus(ADD_HEADING_ID);
  };
  const cancelAdd = () => {
    setAdding(null);
    focus(ADD_ID);
  };

  const members = view.members;
  const live = liveGrants(view);
  const memberIds = new Set(members.map((member) => member.student.id));
  const candidates = students.filter((row) => !memberIds.has(row.student.id));
  const count = memberCountWords(members.length);
  const panelOpen = adding !== null && !paused;

  return (
    <>
      <PageHeader
        className="mt-2 mb-6"
        back={<BackLink href={GROUPS_ADDRESS}>{GROUP_PAGE.back}</BackLink>}
        overline={
          <>
            {GROUP_PAGE.overline} · <span className="xr-id">{group.id}</span>
          </>
        }
        title={group.name}
        titleFocusTarget
        titleRef={titleRef}
        meta={
          <>
            <span>{count}</span>
            {paused ? null : (
              <Button
                variant="text"
                id={RENAME_ID}
                className="min-h-8"
                onClick={() => {
                  setNameError(null);
                  setDialog({ kind: 'rename', name: group.name, expectedRev: group.rev });
                }}
              >
                {GROUP_PAGE.rename}
              </Button>
            )}
          </>
        }
        actions={
          paused ? null : (
            <>
              <Link
                className="xr-btn xr-btn--secondary"
                href={giveAccessAddress({ group: group.id })}
              >
                {GROUP_PAGE.giveAccess}
              </Link>
              {panelOpen ? null : (
                <Button variant="primary" id={ADD_ID} onClick={startAdd}>
                  {GROUP_PAGE.addStudents}
                </Button>
              )}
            </>
          )
        }
      />
      <div className="xw-stack">
        {flash ? (
          <div ref={flashRef} id="group-flash" tabIndex={-1}>
            <Notice tone="ok">{flash}</Notice>
          </div>
        ) : null}
        {paused ? <PausedNotice /> : null}
        <Section title={GROUP_PAGE.members} headingId="group-members" meta={count}>
          {members.length > 0 ? (
            <MemberTable
              members={members}
              live={live}
              accessRows={accessRows}
              paused={paused}
              onRemove={(member) =>
                setDialog({
                  kind: 'remove',
                  studentId: member.student.id,
                  fullName: member.student.fullName,
                  expectedRev: group.rev,
                })
              }
            />
          ) : panelOpen ? null : (
            <EmptyState icon="studentsPeople" headingLevel={3} title={GROUP_PAGE.noMembersTitle}>
              {GROUP_PAGE.noMembersLine}
            </EmptyState>
          )}
          {panelOpen ? (
            <div className="xw-inline-panel">
              <h3 className="xr-h3 m-0" id={ADD_HEADING_ID} tabIndex={-1}>
                {GROUP_PAGE.addPanelTitle}
              </h3>
              {candidates.length > 0 ? (
                <ul className="xw-pick" aria-labelledby={ADD_HEADING_ID}>
                  {candidates.map((row) => {
                    const id = `group-add-${row.student.id}`;
                    const checked = adding.picked.includes(row.student.id);
                    return (
                      <li key={row.student.id}>
                        <div className="xw-pick-row">
                          <label htmlFor={id}>
                            <input
                              type="checkbox"
                              id={id}
                              checked={checked}
                              onChange={() =>
                                setAdding((current) =>
                                  current
                                    ? {
                                        ...current,
                                        picked: checked
                                          ? current.picked.filter((pick) => pick !== row.student.id)
                                          : [...current.picked, row.student.id],
                                      }
                                    : current,
                                )
                              }
                            />
                            <span className="xw-pick-name">
                              <span className="font-[600]">{row.student.fullName}</span>
                              <span className="xr-meta">
                                {candidateLine(
                                  row.student.institutionStudentId,
                                  row.student.accountStatus === 'inactive',
                                )}
                              </span>
                            </span>
                          </label>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="xr-body m-0 text-ink-2">{stateWords('IA-14.add.none')}</p>
              )}
              <div className="xw-actions xw-actions--end">
                <Button variant="text" onClick={cancelAdd}>
                  {GROUP_PAGE.cancel}
                </Button>
                <Button
                  variant="primary"
                  disabled={adding.picked.length === 0}
                  busy={add.busy}
                  onClick={confirmAdd}
                >
                  {addLabel(adding.picked.length)}
                </Button>
              </div>
            </div>
          ) : null}
        </Section>
        <Section title={GROUP_PAGE.given} headingId="group-given">
          {view.grantRows.length > 0 ? (
            <GrantTable rows={view.grantRows} />
          ) : (
            <EmptyState
              icon="studentAccess"
              headingLevel={3}
              title={GROUP_PAGE.nothingGivenTitle}
              actions={
                paused ? null : (
                  <div className="flex flex-wrap gap-3">
                    <Link
                      className="xr-btn xr-btn--secondary"
                      href={giveAccessAddress({ group: group.id })}
                    >
                      {GROUP_PAGE.giveAccess}
                    </Link>
                  </div>
                )
              }
            >
              {GROUP_PAGE.nothingGivenLine}
            </EmptyState>
          )}
        </Section>
      </div>
      <ConfirmDialog
        open={dialog?.kind === 'remove' && !paused}
        align="start"
        returnFocusFallback={flashRef}
        idPrefix="group-remove-dialog"
        destructive
        title={dialog?.kind === 'remove' ? removeTitle(dialog.fullName) : ''}
        effect={dialog?.kind === 'remove' ? <RemoveEffect dialog={dialog} name={group.name} /> : ''}
        confirmLabel={REMOVE_DIALOG.confirm}
        busy={remove.busy}
        onConfirm={confirmDialog}
        onCancel={closeDialog}
      />
      <EditDialog
        open={dialog?.kind === 'rename' && !paused}
        align="start"
        returnFocusFallback={titleRef}
        idPrefix="group-rename-dialog"
        title={RENAME_DIALOG.title}
        confirmLabel={RENAME_DIALOG.confirm}
        busy={rename.busy}
        onConfirm={confirmDialog}
        onCancel={closeDialog}
      >
        <Field
          id={NAME_ID}
          label={RENAME_DIALOG.nameLabel}
          errorClass="xw-ferr"
          error={nameError ?? undefined}
        >
          <TextInput
            value={dialog?.kind === 'rename' ? dialog.name : ''}
            onChange={(event) => {
              const name = event.target.value;
              setDialog((current) => (current?.kind === 'rename' ? { ...current, name } : current));
              setNameError(null);
            }}
          />
        </Field>
      </EditDialog>
    </>
  );
}

/** B2-08 DL-1 body: only what is certain — they leave the group, their record stays (GRP-05). */
function RemoveEffect({
  dialog,
  name,
}: {
  readonly dialog: { readonly fullName: string };
  readonly name: string;
}) {
  const words = removeBody(dialog.fullName);
  return (
    <>
      {words.before}
      <strong className="text-ink">{name}</strong>
      {words.after}
    </>
  );
}

/** B2-08 "Members" (`xr-table-wrap.xw-table-flush`): Student · Status · (Action). */
function MemberTable({
  members,
  live,
  accessRows,
  paused,
  onRemove,
}: {
  readonly members: readonly GroupMember[];
  readonly live: readonly GroupGrantLine[];
  readonly accessRows: readonly GrantRow[];
  readonly paused: boolean;
  readonly onRemove: (member: GroupMember) => void;
}) {
  const { memberColumns } = GROUP_PAGE;
  return (
    <div className="xr-table-wrap xw-table-flush">
      <table className="xr-table">
        <caption className="xr-sr">{GROUP_PAGE.membersCaption}</caption>
        <thead>
          <tr>
            <th scope="col">{memberColumns.student}</th>
            <th scope="col">{memberColumns.status}</th>
            {paused ? null : (
              <th scope="col">
                <span className="xr-sr">{memberColumns.action}</span>
              </th>
            )}
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={member.student.id}>
              <td className="is-primary">
                <Link href={studentRecordAddress(member.student.id)}>
                  <strong>{member.student.fullName}</strong>
                </Link>
                <span className="xr-sub xr-id">{member.student.institutionStudentId}</span>
              </td>
              <td data-label={memberColumns.status}>
                <MemberStatusCell status={memberStatus(member, live, accessRows)} />
              </td>
              {paused ? null : (
                <td>
                  <Button
                    variant="text"
                    id={`group-remove-${member.student.id}`}
                    className="min-h-9"
                    aria-label={removeLabel(member.student.fullName)}
                    onClick={() => onRemove(member)}
                  >
                    {GROUP_PAGE.remove}
                  </Button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** B2-08 `isOff` / `isWait` / `plain`: the pill and its line, or the plain words. */
function MemberStatusCell({ status }: { readonly status: MemberStatus }) {
  if (status.kind === 'inactive') {
    return (
      <>
        <StatusPill tone="off">{GROUP_PAGE.inactive}</StatusPill>
        <span className="xr-sub">{GROUP_PAGE.inactiveLine}</span>
      </>
    );
  }
  if (status.kind === 'active') {
    return <span className="xr-small text-ink-2">{GROUP_PAGE.active}</span>;
  }
  const [only] = status.lines;
  if (status.lines.length === 1 && only) {
    return only.pill ? (
      <StatusPill tone="wait">{only.words}</StatusPill>
    ) : (
      <span className="xr-small text-ink-2">{only.words}</span>
    );
  }
  // Several live grants: one line per experiment (state-copy `IA-14.several`).
  return (
    <>
      {status.lines.map((line) => (
        <span key={line.grantId} className="xr-small block text-ink-2">
          {standingLinePrefix(line.experimentName)}
          {line.pill ? <StatusPill tone="wait">{line.words}</StatusPill> : line.words}
        </span>
      ))}
    </>
  );
}

/** B2-08 f4 "Experiments given to this group": one row per grant of the group. */
function GrantTable({ rows }: { readonly rows: readonly GroupGrantLine[] }) {
  const { givenColumns } = GROUP_PAGE;
  return (
    <div className="xr-table-wrap xw-table-flush">
      <table className="xr-table">
        <caption className="xr-sr">{GROUP_PAGE.givenCaption}</caption>
        <thead>
          <tr>
            <th scope="col">{givenColumns.experiment}</th>
            <th scope="col">{givenColumns.formats}</th>
            <th scope="col">{givenColumns.given}</th>
            <th scope="col">{givenColumns.status}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.grant.id}>
              <td className="is-primary">
                <strong>{row.experimentName}</strong>
                {row.courseCode ? <span className="xr-sub">{row.courseCode}</span> : null}
              </td>
              <td data-label={givenColumns.formats}>
                <FormatSet compact formats={formatCodes(row.formats)} />
                <span className="xr-sub">{fromPlanWords(row.grant.accessPlanId)}</span>
              </td>
              <td data-label={givenColumns.given}>
                {givenOnWords(dayMonthYear(row.grant.givenAt))}
                <span className="xr-id">{row.grant.id}</span>
              </td>
              <td data-label={givenColumns.status}>
                {row.status === 'active' ? (
                  <StatusPill tone="ok">{GROUP_PAGE.grantActive}</StatusPill>
                ) : (
                  // Undrawn on B2-08 (state-copy `IA-14.grant-words`).
                  <StatusPill tone="off">{OTHER_GRANT_WORDS[row.status]}</StatusPill>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
