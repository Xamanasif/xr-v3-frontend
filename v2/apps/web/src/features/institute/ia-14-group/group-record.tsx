'use client';

import type {
  GrantRow,
  GroupRecordView,
  ServiceError,
  StudentDirectoryRow,
} from '@xr/contracts/draft';
import {
  Breadcrumbs,
  Button,
  ButtonLink,
  ConfirmDialog,
  Field,
  IaActions,
  IaAddPanel,
  IaBusyButton,
  IaCellText,
  IaEmptyTitle,
  IaFormatBadges,
  IaGrantItems,
  IaListTable,
  IaPickList,
  IaPickSearch,
  IaRecordGrid,
  IaRowLink,
  IaSectionBody,
  IaSectionFoot,
  IaSectionHead,
  IaStatusNotes,
  ListState,
  Notice,
  PageHead,
  RecordLine,
  StatusPill,
  Surface,
  TextInput,
  V46Island,
} from '@xr/ui/v3';
import { useEffect, useRef, useState } from 'react';

import { dayMonthYear } from '@/copy/dates';
import {
  addedFlash,
  addLabel,
  addNoteWithGrants,
  givenOnWords,
  grantsListLabel,
  IA14,
  memberCountWords,
  membersCaption,
  removeAria,
  removeBody,
  removedFlash,
  removeTitle,
} from '@/copy/ia-access';
import { formatsFromPlanLabel, IA_PAUSED_READ_ONLY } from '@/copy/ia-shared';
import { PEOPLE_PAGE } from '@/copy/institute-people';
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
import { formatCodes } from '../shared/format-codes';
import { useInstitutionPaused } from '../shared/paused';
import { grantStatus, liveGrants, memberStatus } from './group-view';

const TITLE_ID = 'ia-h1';
const RENAME_ID = 'ia-rename';
const NAME_ID = 'ia-dlg-n';
const ADD_ID = 'gd-add';
const PANEL_ID = 'gd-addpanel';
const PANEL_TITLE_ID = 'gd-add-h';
const SEARCH_ID = 'gd-q';
const FLASH_ID = 'ia-flash';

/** The export offers the panel's search once there are more than eight students to choose from. */
const SEARCH_FROM = 9;

/** What the page shows: the group, and the reads its words need beside it. */
interface GroupPage {
  readonly view: GroupRecordView;
  /** Student access (IA-04) rows: when a member's own grant was given ("Has it individually"). */
  readonly accessRows: readonly GrantRow[];
  /** Every student of the institution: the "Add students" candidates. */
  readonly students: readonly StudentDirectoryRow[];
}

/**
 * IA-14 Group — the owner-approved V3 design (design/v3-refined-b/roles/IA-v1, `Main.dc.html`
 * `R.rIA14`, `vm14`), at `/institute/people/groups/[groupId]`.
 *
 * - **Read**: `GroupService.getGroup` — the group, its current members with their standing per live
 *   group grant and its grants as the page names them — with the Student access rows (when a
 *   member's own grant was given) and every student (the candidates). An address naming no group of
 *   the admin's institution — unknown or another institution's — shows the in-shell not-found page.
 * - **Layout**: the head (the group's name, its member count once, Rename; Add students and Give
 *   this group access); the add panel under it; Members (student, status in words, quiet Remove…)
 *   with "Experiments given to this group" beside it (first on phones). No grant or group is named
 *   by its id.
 * - **Act** (each sent with the group's revision as the page showed it): "Add students" opens the
 *   panel (institution students not in the group; "Add 2 students" → `addMembers`); "Remove…" opens
 *   the destructive DL-1 (`removeMember` — only the membership changes, never a grant; GRP-05:
 *   nothing is said about access); "Rename" opens DL-3 (`renameGroup`, the service's words on the
 *   field). "Give this group access" (shown once the group has members) opens IA-05 with the group
 *   chosen. Each result is said in the flash. A refusal because the group moved on writes nothing:
 *   the dialog or panel closes, the page reads again and focus goes to the title; a failure for now
 *   keeps the dialog or panel.
 * - **Paused institution**: read-only — no write is offered and the read-only notice shows.
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

  const guard = (
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
  );
  // The application's existing loading and failed states keep their look (IA-v1 draws none).
  return read.data?.ok && !read.isError ? guard : <V46Island>{guard}</V46Island>;
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

/** The open "Add students" panel: who is picked, the search, and the revision when it opened. */
interface Adding {
  readonly picked: readonly StudentId[];
  readonly search: string;
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
  const rename = useCommand((ports) => ports.groups.renameGroup);
  const remove = useCommand((ports) => ports.groups.removeMember);
  const add = useCommand((ports) => ports.groups.addMembers);

  // Focus moves after the commit that shows its target (the export's `focusLater`): the panel's
  // heading (or its search) when it opens and "Add students" when it closes, the flash after adding
  // or removing, "Rename" after renaming, the name after its error, the page title after a refusal
  // that re-reads the page (and wherever a target is gone). A dialog has given focus back to its
  // trigger in the same commit (a child's effect runs first), so this request wins.
  useEffect(() => {
    if (focusRequest.n === 0) return;
    const target =
      focusRequest.id === 'title'
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
          if (answer.ok) done(IA14.renamedFlash, RENAME_ID);
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
        if (answer.ok) done(removedFlash(fullName), FLASH_ID);
        else refused(answer.error);
      },
      () => undefined,
    );
  };

  const members = view.members;
  const memberIds = new Set(members.map((member) => member.student.id));
  const candidates = students.filter((row) => !memberIds.has(row.student.id));

  const confirmAdd = () => {
    if (!adding || adding.picked.length === 0) return;
    const studentIds = [...adding.picked];
    const names = candidates
      .filter((row) => studentIds.includes(row.student.id))
      .map((row) => row.student.fullName);
    add.run({ id: group.id, studentIds, expectedRev: adding.expectedRev }).then(
      (answer) => {
        if (answer.ok) done(addedFlash(names), FLASH_ID);
        else refused(answer.error);
      },
      // Failed for now: the panel and the picks stay (state-copy `IA-14.unavailable`).
      () => undefined,
    );
  };

  const toggleAdd = () => {
    if (adding) {
      setAdding(null);
      focus(ADD_ID);
      return;
    }
    setAdding({ picked: [], search: '', expectedRev: group.rev });
    focus(candidates.length >= SEARCH_FROM ? SEARCH_ID : PANEL_TITLE_ID);
  };
  const cancelAdd = () => {
    setAdding(null);
    focus(ADD_ID);
  };

  const live = liveGrants(view);
  const panelOpen = adding !== null && !paused;
  const canGive = !paused && members.length > 0;
  const giveHref = giveAccessAddress({ group: group.id });
  const search = adding?.search.trim().toLowerCase() ?? '';
  const shownCandidates = candidates.filter(
    (row) =>
      search === '' ||
      `${row.student.fullName} ${row.student.institutionStudentId}`.toLowerCase().includes(search),
  );

  return (
    <>
      <PageHead
        breadcrumbs={
          <Breadcrumbs
            levels={[{ label: IA14.crumb, href: GROUPS_ADDRESS }]}
            current={group.name}
          />
        }
        variant="record"
        eyebrow={IA14.eyebrow}
        title={group.name}
        titleId={TITLE_ID}
        titleRef={titleRef}
        titleFocusTarget
        meta={
          <>
            <span>{memberCountWords(members.length)}</span>
            {paused ? null : (
              <Button
                variant="ghost"
                id={RENAME_ID}
                onClick={() => {
                  setNameError(null);
                  setDialog({ kind: 'rename', name: group.name, expectedRev: group.rev });
                }}
              >
                {IA14.rename}
              </Button>
            )}
          </>
        }
        actions={
          paused ? null : (
            <>
              <Button
                size="lg"
                id={ADD_ID}
                aria-expanded={panelOpen}
                aria-controls={PANEL_ID}
                onClick={toggleAdd}
              >
                {IA14.addStudents}
              </Button>
              {canGive ? (
                <ButtonLink variant="primary" size="lg" href={giveHref}>
                  {IA14.give}
                </ButtonLink>
              ) : null}
            </>
          )
        }
      />
      {paused ? (
        <Notice tone="paused" icon="lock" role="status" title={IA_PAUSED_READ_ONLY}>
          {IA14.pausedLine}
        </Notice>
      ) : null}
      {flash ? (
        <Notice tone="ok" id={FLASH_ID} role="status" title={IA14.flashTitle}>
          {flash}
        </Notice>
      ) : null}
      {panelOpen ? (
        <IaAddPanel
          id={PANEL_ID}
          titleId={PANEL_TITLE_ID}
          title={IA14.addPanelTitle}
          actions={
            <IaActions>
              <Button size="lg" onClick={cancelAdd}>
                {IA14.cancel}
              </Button>
              <IaBusyButton
                variant="primary"
                size="lg"
                disabled={adding.picked.length === 0}
                busy={add.busy}
                onClick={confirmAdd}
              >
                {addLabel(adding.picked.length)}
              </IaBusyButton>
            </IaActions>
          }
        >
          <RecordLine>
            {live.length > 0
              ? addNoteWithGrants(live.map((row) => row.experimentName))
              : IA14.addNoteNone}
          </RecordLine>
          {candidates.length >= SEARCH_FROM ? (
            <IaPickSearch
              id={SEARCH_ID}
              label={IA14.searchStudents}
              placeholder={IA14.searchPlaceholder}
              value={adding.search}
              onChange={(value) =>
                setAdding((current) => (current ? { ...current, search: value } : current))
              }
            />
          ) : null}
          {shownCandidates.length > 0 ? (
            <IaPickList
              label={IA14.candidatesList}
              items={shownCandidates.map((row) => {
                const checked = adding.picked.includes(row.student.id);
                return {
                  key: row.student.id,
                  inputId: `gd-c-${row.student.id}`,
                  name: row.student.fullName,
                  detail: [
                    row.student.institutionStudentId,
                    ...row.groups.map((entry) => entry.name),
                  ].join(' · '),
                  why: row.student.accountStatus === 'inactive' ? IA14.inactive : null,
                  checked,
                  onChange: () =>
                    setAdding((current) =>
                      current
                        ? {
                            ...current,
                            picked: checked
                              ? current.picked.filter((pick) => pick !== row.student.id)
                              : [...current.picked, row.student.id],
                          }
                        : current,
                    ),
                };
              })}
            />
          ) : candidates.length > 0 ? (
            <RecordLine>{IA14.noCandidateMatch}</RecordLine>
          ) : (
            <RecordLine>{stateWords('IA-14.add.none')}</RecordLine>
          )}
        </IaAddPanel>
      ) : null}
      <IaRecordGrid
        variant="sidefirst"
        main={
          <Surface labelledBy="gd-m-h">
            <IaSectionHead title={IA14.members} titleId="gd-m-h" />
            {members.length > 0 ? (
              <IaListTable
                variant="gm"
                caption={membersCaption(group.name)}
                columns={[
                  { key: 'student', header: IA14.columns.student },
                  { key: 'status', header: IA14.columns.status },
                  { key: 'action', header: IA14.columns.action, hidden: true },
                ]}
                rows={members.map((member) => {
                  const status = memberStatus(member, view, accessRows, paused);
                  return {
                    key: member.student.id,
                    cells: [
                      {
                        key: 'student',
                        role: 'main',
                        className: 'ia-gm-who',
                        children: (
                          <>
                            <IaRowLink href={studentRecordAddress(member.student.id)}>
                              {member.student.fullName}
                            </IaRowLink>
                            <IaCellText kind="sub" nowrap>
                              {member.student.institutionStudentId}
                            </IaCellText>
                          </>
                        ),
                      },
                      {
                        key: 'status',
                        children: (
                          <IaStatusNotes
                            status={<StatusPill tone={status.tone}>{status.words}</StatusPill>}
                            notes={status.note ? [status.note] : []}
                          />
                        ),
                      },
                      {
                        key: 'action',
                        role: 'act',
                        children: paused ? null : (
                          <Button
                            variant="ghost"
                            id={`gd-rm-${member.student.id}`}
                            aria-label={removeAria(member.student.fullName)}
                            onClick={() =>
                              setDialog({
                                kind: 'remove',
                                studentId: member.student.id,
                                fullName: member.student.fullName,
                                expectedRev: group.rev,
                              })
                            }
                          >
                            {IA14.remove}
                          </Button>
                        ),
                      },
                    ],
                  };
                })}
              />
            ) : (
              <ListState
                kind="none"
                icon="people"
                titleAs="h3"
                title={IA14.noMembersTitle}
                action={paused ? null : <Button onClick={toggleAdd}>{IA14.addStudents}</Button>}
              >
                {IA14.noMembersLine}
              </ListState>
            )}
          </Surface>
        }
        side={
          <Surface labelledBy="gd-e-h">
            <IaSectionHead title={IA14.given} titleId="gd-e-h" size="minor" />
            {view.grantRows.length > 0 ? (
              <>
                <IaGrantItems
                  label={grantsListLabel(group.name)}
                  items={view.grantRows.map((row) => {
                    const codes = formatCodes(row.formats);
                    return {
                      key: row.grant.id,
                      name: row.experimentName,
                      courseCode: row.courseCode,
                      formats: (
                        <IaFormatBadges formats={codes} label={formatsFromPlanLabel(codes)} />
                      ),
                      status: grantStatus(row, paused),
                      given: givenOnWords(dayMonthYear(row.grant.givenAt)),
                    };
                  })}
                />
                <IaSectionFoot>{IA14.grantNote}</IaSectionFoot>
              </>
            ) : (
              <IaSectionBody>
                <IaEmptyTitle>{IA14.nothingGivenTitle}</IaEmptyTitle>
                <RecordLine>{IA14.nothingGivenLine}</RecordLine>
                {canGive ? (
                  <p>
                    <ButtonLink href={giveHref}>{IA14.give}</ButtonLink>
                  </p>
                ) : null}
              </IaSectionBody>
            )}
          </Surface>
        }
      />
      <ConfirmDialog
        open={dialog?.kind === 'remove' && !paused}
        destructive
        initialFocus="cancel"
        idPrefix="group-remove-dialog"
        title={dialog?.kind === 'remove' ? removeTitle(dialog.fullName) : ''}
        description={
          dialog?.kind === 'remove' ? removeBody(dialog.fullName, group.name) : undefined
        }
        confirmLabel={IA14.removeConfirm}
        cancelLabel={IA14.cancel}
        busyLook
        busy={remove.busy}
        onConfirm={confirmDialog}
        onCancel={closeDialog}
      />
      <ConfirmDialog
        open={dialog?.kind === 'rename' && !paused}
        initialFocus="field"
        submitOnEnter
        returnFocusFallback={titleRef}
        idPrefix="group-rename-dialog"
        title={IA14.renameTitle}
        confirmLabel={IA14.saveName}
        cancelLabel={IA14.cancel}
        busyLook
        busy={rename.busy}
        onConfirm={confirmDialog}
        onCancel={closeDialog}
      >
        <Field id={NAME_ID} label={IA14.nameLabel} error={nameError ?? undefined}>
          <TextInput
            autoComplete="off"
            value={dialog?.kind === 'rename' ? dialog.name : ''}
            onChange={(event) => {
              const name = event.target.value;
              setDialog((current) => (current?.kind === 'rename' ? { ...current, name } : current));
              setNameError(null);
            }}
          />
        </Field>
      </ConfirmDialog>
    </>
  );
}
