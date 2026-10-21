'use client';

import type { InstitutionCourseCodeRow, ServiceError } from '@xr/contracts/draft';
import {
  Button,
  ButtonLink,
  Field,
  IaCourseCodeItem,
  IaCourseCodeList,
  IaCourseCodes,
  IaCourseCodeSave,
  IaCourseCodesHead,
  IaCourseCodesHelp,
  IaCourseCodeValue,
  IaLines,
  IaOptional,
  ListState,
  LoadingRows,
  Notice,
  StatusPill,
  Surface,
  TextInput,
  VisuallyHidden,
} from '@xr/ui/v3';
import { type RefObject, useEffect, useId, useRef, useState } from 'react';

import {
  COURSE_CODES_TAB,
  missingCountWords,
  savedLine,
  saveWords,
  fieldNameEnd,
} from '@/copy/course-codes';
import { CONTENT_ACCESS_WORDS } from '@/copy/institute-home';
import { stateWords } from '@/copy/state-copy';
import { CONTENT_ACCESS_ADDRESS } from '@/nav/institute';
import { checkCourseCode, useCourseCodeList } from '@/queries/institute-records';
import { useCommand } from '@/queries/use-command';

interface Draft {
  readonly code: string;
  readonly semester: string;
}

/** The saved values of a row (`''` where none is set). */
function savedOf(row: InstitutionCourseCodeRow): Draft {
  return { code: row.code?.code ?? '', semester: row.code?.semester ?? '' };
}

function changed(draft: Draft, saved: Draft): boolean {
  return draft.code.trim() !== saved.code || draft.semester.trim() !== saved.semester;
}

const codeInputId = (base: string, courseId: string) => `${base}-code-${courseId}`;

const TITLE_ID = 'cc-h';
const HELP_ID = 'cc-how-h';
const FLASH_ID = 'ia-flash';
const NO_COURSES_ID = 'cc-none-t';
const FAILED_ID = 'cc-fail-t';

/**
 * IA-16 Content access › Course codes — the V3 Refined B design (the owner-approved export
 * design/v3-refined-b/roles/IA-v1, `Main.dc.html` IA-16, `vm16core` and `vm16`), the Content access
 * page's `?tab=course-codes` (Appendix A rule T2).
 *
 * - **Read**: `InstitutionCourseCodeService.list` — each course in the institution's content
 *   access, its BITS course code (set by BITS — the Content Manager — and read-only here, M-2) and
 *   the institution's own code and optional semester, with its status ("Missing" / "Added", from
 *   the saved code).
 * - **As the export draws it**: one block per course — the locked BITS code beside "Your course
 *   code" and "Semester (optional)", the live "Students and faculty see …" line — the count with
 *   "Show missing codes only" (more than one course), the save bar ("You have unsaved changes",
 *   Undo changes, Save course code(s)) and "How course codes work" beside it; "Saved" with the
 *   codes saved, focused; "No course is missing a code" with "Show all courses"; "No courses yet".
 * - **Saving**: every changed row is checked first by the contract's own schema — the one designed
 *   rule, "Add your course code, or clear the semester" (no code format is invented) — then sent
 *   one by one with the revision the page read (`institutionCourseCodes.set`, repeat-press
 *   protected). A row refused as stale is read again and shows its current code (state-copy
 *   `IA-16.stale`).
 * - **Paused**: read-only — the notice and the values, no inputs, no save bar; the service refuses
 *   `institution-paused` all the same.
 * - **Loading and failed** (the export draws neither): the application's loading and its failed
 *   state with Try again (state-copy `IA-16.loading`, `IA-16.failed`).
 */
export function CourseCodesTab({
  paused,
  titleRef,
}: {
  readonly paused: boolean;
  /** The page's H1, focused after Try again. */
  readonly titleRef: RefObject<HTMLHeadingElement | null>;
}) {
  const read = useCourseCodeList();
  const [refusedPaused, setRefusedPaused] = useState(false);
  const failed = read.isError || (read.data !== undefined && !read.data.ok);
  const rows = read.data?.ok ? read.data.value : null;

  if (failed) {
    return (
      <Surface labelledBy={FAILED_ID}>
        <ListState
          kind="failed"
          titleAs="h2"
          titleId={FAILED_ID}
          title={stateWords('IA-16.failed')}
          action={
            <Button
              onClick={() => {
                void read.refetch();
                titleRef.current?.focus();
              }}
            >
              {CONTENT_ACCESS_WORDS.tryAgain}
            </Button>
          }
        >
          {CONTENT_ACCESS_WORDS.failedLine}
        </ListState>
      </Surface>
    );
  }
  if (rows === null) {
    return (
      <Surface label={COURSE_CODES_TAB.title} busy>
        <LoadingRows message={stateWords('IA-16.loading')} rows={2} cells={[2, 1, 1, 1]} />
      </Surface>
    );
  }
  if (rows.length === 0) {
    return (
      <Surface labelledBy={NO_COURSES_ID}>
        <ListState
          kind="none"
          roomy
          titleAs="h2"
          titleId={NO_COURSES_ID}
          title={COURSE_CODES_TAB.noCoursesTitle}
          action={
            <ButtonLink href={CONTENT_ACCESS_ADDRESS}>{COURSE_CODES_TAB.contentAccess}</ButtonLink>
          }
        >
          {COURSE_CODES_TAB.noCoursesLine}
        </ListState>
      </Surface>
    );
  }
  return (
    <CourseCodes
      rows={rows}
      readOnly={paused || refusedPaused}
      onPaused={() => setRefusedPaused(true)}
      refetch={read.refetch}
    />
  );
}

function CourseCodes({
  rows,
  readOnly,
  onPaused,
  refetch,
}: {
  readonly rows: readonly InstitutionCourseCodeRow[];
  readonly readOnly: boolean;
  readonly onPaused: () => void;
  readonly refetch: () => Promise<unknown>;
}) {
  const base = useId();
  const [drafts, setDrafts] = useState<Readonly<Record<string, Draft>>>({});
  const [errors, setErrors] = useState<Readonly<Record<string, string>>>({});
  const [missingOnly, setMissingOnly] = useState(false);
  const [saved, setSaved] = useState<readonly { code: string; course: string }[] | null>(null);
  const [saving, setSaving] = useState(false);
  const set = useCommand((ports) => ports.institutionCourseCodes.set);
  const flashRef = useRef<HTMLDivElement>(null);
  const focusFlash = useRef(false);

  const valueOf = (row: InstitutionCourseCodeRow): Draft => drafts[row.course.id] ?? savedOf(row);
  const dirtyRows = rows.filter((row) => changed(valueOf(row), savedOf(row)));
  const dirty = !readOnly && dirtyRows.length > 0;
  const missing = rows.filter((row) => row.status === 'missing').length;
  const listed = missingOnly ? rows.filter((row) => row.status === 'missing') : rows;

  // The flash takes focus once it shows after a save (the export's `focusLater('ia-flash')`).
  useEffect(() => {
    if (!focusFlash.current || !flashRef.current) return;
    focusFlash.current = false;
    flashRef.current.focus();
  });

  const edit = (row: InstitutionCourseCodeRow, patch: Partial<Draft>) => {
    setDrafts((current) => ({ ...current, [row.course.id]: { ...valueOf(row), ...patch } }));
    // Any change to the row clears its error (the semester takes part in the rule).
    setErrors((current) =>
      Object.fromEntries(Object.entries(current).filter(([id]) => id !== row.course.id)),
    );
  };
  const focusCode = (courseId: string) =>
    window.setTimeout(() => document.getElementById(codeInputId(base, courseId))?.focus(), 0);

  const refused = (row: InstitutionCourseCodeRow, error: ServiceError) => {
    if (error.kind === 'validation-failed') {
      const message = error.fieldErrors[0]?.message;
      if (message) setErrors((current) => ({ ...current, [row.course.id]: message }));
      focusCode(row.course.id);
    } else if (error.kind === 'refused' && error.code === 'institution-paused') {
      onPaused();
    } else {
      // Stale or no longer in content access: the current code is read again (`IA-16.stale`).
      setDrafts((current) =>
        Object.fromEntries(Object.entries(current).filter(([id]) => id !== row.course.id)),
      );
      void refetch();
    }
  };

  const save = async () => {
    if (saving) return;
    // The designed rule first, for every changed row; nothing is sent while one fails.
    const found: Record<string, string> = {};
    for (const row of dirtyRows) {
      const draft = valueOf(row);
      const message = checkCourseCode(
        row.course.id,
        draft.code,
        draft.semester,
        row.code?.rev ?? null,
      );
      if (message) found[row.course.id] = message;
    }
    const first = dirtyRows.find((row) => found[row.course.id] !== undefined);
    if (first) {
      setErrors(found);
      focusCode(first.course.id);
      return;
    }
    setErrors({});
    if (dirtyRows.length === 0) return;
    setSaving(true);
    const done: { code: string; course: string }[] = [];
    const savedIds: string[] = [];
    try {
      for (const row of dirtyRows) {
        const draft = valueOf(row);
        const answer = await set.run({
          courseId: row.course.id,
          code: draft.code,
          semester: draft.semester,
          expectedRev: row.code?.rev ?? null,
        });
        if (!answer.ok) {
          refused(row, answer.error);
          break;
        }
        savedIds.push(row.course.id);
        if (answer.value.code) done.push({ code: answer.value.code, course: row.course.name });
      }
    } catch {
      // Failed for now: nothing more is sent and every change stays (`IA-16.unavailable`).
    }
    setDrafts((current) =>
      Object.fromEntries(Object.entries(current).filter(([id]) => !savedIds.includes(id))),
    );
    if (savedIds.length > 0) {
      setSaved(done);
      focusFlash.current = true;
    }
    setSaving(false);
  };

  const undo = () => {
    setDrafts({});
    setErrors({});
    const first = listed[0];
    if (first) focusCode(first.course.id);
  };

  return (
    <>
      {readOnly ? (
        <Notice tone="paused" icon="lock" role="status" title={COURSE_CODES_TAB.pausedTitle}>
          {COURSE_CODES_TAB.pausedLine}
        </Notice>
      ) : null}
      {saved !== null && !dirty && !readOnly ? (
        <Notice
          ref={flashRef}
          id={FLASH_ID}
          tone="ok"
          role="status"
          title={COURSE_CODES_TAB.savedTitle}
        >
          {savedLine(saved)}
        </Notice>
      ) : null}
      <IaCourseCodes
        titleId={TITLE_ID}
        helpTitleId={HELP_ID}
        help={
          <IaCourseCodesHelp title={COURSE_CODES_TAB.helpTitle} titleId={HELP_ID}>
            <IaLines
              lines={[
                { key: 'bits', tone: 'off', icon: 'lock', children: COURSE_CODES_TAB.help[0] },
                { key: 'see', tone: 'info', icon: 'people', children: COURSE_CODES_TAB.help[1] },
                {
                  key: 'csv',
                  tone: 'info',
                  icon: 'documentText',
                  children: COURSE_CODES_TAB.help[2],
                },
              ]}
            />
          </IaCourseCodesHelp>
        }
      >
        <IaCourseCodesHead
          title={COURSE_CODES_TAB.title}
          titleId={TITLE_ID}
          count={missingCountWords(missing, rows.length)}
          {...(rows.length > 1
            ? {
                missingOnly: {
                  id: `${base}-missing`,
                  label: COURSE_CODES_TAB.showMissingOnly,
                  checked: missingOnly,
                  onChange: () => setMissingOnly((current) => !current),
                },
              }
            : {})}
        />
        {listed.length === 0 ? (
          <ListState
            kind="none"
            icon="check"
            title={COURSE_CODES_TAB.noneMissingTitle}
            action={
              <Button onClick={() => setMissingOnly(false)}>
                {COURSE_CODES_TAB.showAllCourses}
              </Button>
            }
          >
            {COURSE_CODES_TAB.noneMissingLine}
          </ListState>
        ) : null}
        <IaCourseCodeList>
          {listed.map((row) => {
            const draft = valueOf(row);
            const shown = (readOnly ? savedOf(row) : draft).code.trim();
            const codeId = codeInputId(base, row.course.id);
            return (
              <IaCourseCodeItem
                key={row.course.id}
                name={row.course.name}
                status={
                  row.status === 'missing' ? (
                    <StatusPill tone="warn">{COURSE_CODES_TAB.missing}</StatusPill>
                  ) : (
                    <StatusPill tone="ok">{COURSE_CODES_TAB.added}</StatusPill>
                  )
                }
                bits={{
                  label: COURSE_CODES_TAB.bitsCode,
                  code: row.course.platformCode ?? COURSE_CODES_TAB.none,
                  note: COURSE_CODES_TAB.bitsNote,
                }}
                code={
                  readOnly ? (
                    <IaCourseCodeValue
                      label={COURSE_CODES_TAB.yourCode}
                      value={row.code?.code ? row.code.code : COURSE_CODES_TAB.notAdded}
                    />
                  ) : (
                    <Field
                      id={codeId}
                      label={
                        <>
                          {COURSE_CODES_TAB.yourCode}{' '}
                          <VisuallyHidden>{fieldNameEnd(row.course.name)}</VisuallyHidden>
                        </>
                      }
                      error={errors[row.course.id]}
                    >
                      <TextInput
                        autoComplete="off"
                        placeholder={COURSE_CODES_TAB.codePlaceholder}
                        value={draft.code}
                        onChange={(event) => edit(row, { code: event.target.value })}
                      />
                    </Field>
                  )
                }
                semester={
                  readOnly ? (
                    <IaCourseCodeValue
                      label={COURSE_CODES_TAB.semester}
                      value={row.code?.semester ?? COURSE_CODES_TAB.none}
                    />
                  ) : (
                    <Field
                      id={`${base}-sem-${row.course.id}`}
                      label={
                        <>
                          {COURSE_CODES_TAB.semester}{' '}
                          <VisuallyHidden>{fieldNameEnd(row.course.name)}</VisuallyHidden>{' '}
                          <IaOptional>{COURSE_CODES_TAB.optional}</IaOptional>
                        </>
                      }
                    >
                      <TextInput
                        autoComplete="off"
                        placeholder={COURSE_CODES_TAB.semesterPlaceholder}
                        value={draft.semester}
                        onChange={(event) => edit(row, { semester: event.target.value })}
                      />
                    </Field>
                  )
                }
                preview={
                  shown
                    ? { lead: COURSE_CODES_TAB.previewLead, code: shown, course: row.course.name }
                    : { empty: COURSE_CODES_TAB.previewEmpty }
                }
              />
            );
          })}
        </IaCourseCodeList>
        {readOnly ? null : (
          <IaCourseCodeSave
            state={dirty ? COURSE_CODES_TAB.unsaved : COURSE_CODES_TAB.noUnsaved}
            dirty={dirty}
            undo={
              <Button size="lg" onClick={undo}>
                {COURSE_CODES_TAB.undo}
              </Button>
            }
            save={
              <Button
                variant="primary"
                size="lg"
                busy={saving}
                busyLabel={stateWords('IA-16.saving')}
                onClick={() => void save()}
              >
                {saveWords(rows.length)}
              </Button>
            }
          />
        )}
      </IaCourseCodes>
    </>
  );
}
