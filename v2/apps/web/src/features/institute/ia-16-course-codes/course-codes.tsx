'use client';

import type { InstitutionCourseCodeRow, ServiceError } from '@xr/contracts/draft';
import {
  Button,
  FieldError,
  Icon,
  Notice,
  Skeleton,
  StatusPill,
  TextInput,
  VisuallyHidden,
} from '@xr/ui';
import { useId, useState } from 'react';

import {
  COURSE_CODES_TAB,
  missingCountWords,
  savedLine,
  semesterLabel,
  yourCodeLabel,
} from '@/copy/course-codes';
import { stateWords } from '@/copy/state-copy';
import { checkCourseCode, useCourseCodeList } from '@/queries/institute-records';
import { useCommand } from '@/queries/use-command';

import { LoadFailed } from '../ia-02-content-access/institute-parts';

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

/**
 * IA-16 Content access › Course codes — board B2-03 f6 … f10, the Content access page's
 * `?tab=course-codes` (Appendix A rule T2).
 *
 * - **Read**: `InstitutionCourseCodeService.list` — each course in the institution's content
 *   access, its BITS course code (set by BITS — the Content Manager — and read-only here, M-2) and
 *   the institution's own code and optional semester, with its status ("Missing" / "Added", from
 *   the saved code). Which code the Student and Faculty workspaces show stays T-17: Package 2A
 *   shows the institution's code once it is set.
 * - **As drawn**: the intro, the count ("1 of 1 course has no code from your institution" / "Every
 *   course has a code from your institution") with "Show missing codes only", the editable table
 *   (the BITS code with its lock; "Your course code" and "Semester (optional)" inputs; the status),
 *   "Undo changes" while anything is changed and "Save course codes".
 * - **Saving**: every changed row is checked first by the contract's own schema — the one designed
 *   rule, "Add your course code, or clear the semester" (no code format is invented) — then sent
 *   one by one with the revision the page read (`institutionCourseCodes.set`). "Course codes saved"
 *   names the codes saved (f7) until something changes again. A row refused as stale is read again
 *   and shows its current code (state-copy `IA-16.stale`).
 * - **Paused** (f9): read-only — the notice and a plain table, no inputs, no Save; the service
 *   refuses `institution-paused` all the same.
 */
export function CourseCodesTab({ paused }: { readonly paused: boolean }) {
  const read = useCourseCodeList();
  const [refusedPaused, setRefusedPaused] = useState(false);
  const failed = read.isError || (read.data !== undefined && !read.data.ok);
  const rows = read.data?.ok ? read.data.value : null;

  if (failed) {
    return (
      <LoadFailed
        title={stateWords('IA-16.failed')}
        onRetry={() => {
          void read.refetch();
        }}
      />
    );
  }
  if (rows === null) return <LoadingCodes />;
  return (
    <>
      <p className="xr-body m-0 mb-4 max-w-[760px] text-ink-2">{COURSE_CODES_TAB.intro}</p>
      {paused || refusedPaused ? (
        <ReadOnlyCodes rows={rows} />
      ) : (
        <EditableCodes rows={rows} onPaused={() => setRefusedPaused(true)} refetch={read.refetch} />
      )}
    </>
  );
}

function EditableCodes({
  rows,
  onPaused,
  refetch,
}: {
  readonly rows: readonly InstitutionCourseCodeRow[];
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

  const valueOf = (row: InstitutionCourseCodeRow): Draft => drafts[row.course.id] ?? savedOf(row);
  const dirtyRows = rows.filter((row) => changed(valueOf(row), savedOf(row)));
  const dirty = dirtyRows.length > 0;
  const missing = rows.filter((row) => row.status === 'missing').length;
  const listed = missingOnly ? rows.filter((row) => row.status === 'missing') : rows;

  const edit = (row: InstitutionCourseCodeRow, patch: Partial<Draft>) => {
    setDrafts((current) => ({ ...current, [row.course.id]: { ...valueOf(row), ...patch } }));
    // Any change to the row clears its error (B2-03 `onCode`; the semester takes part in the rule).
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
    // B2-03 `save`: the designed rule first, for every changed row; nothing is sent while one fails.
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
    if (!dirty) return;
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
    if (savedIds.length > 0) setSaved(done);
    setSaving(false);
  };

  const undo = () => {
    setDrafts({});
    setErrors({});
  };

  const { columns } = COURSE_CODES_TAB;
  return (
    <>
      {saved !== null && !dirty ? (
        <div className="mb-4">
          <Notice tone="ok" title={COURSE_CODES_TAB.savedTitle}>
            {saved.length > 0 ? savedLine(saved) : null}
          </Notice>
        </div>
      ) : null}
      <div className="xr-toolbar-status">
        <span className="xr-meta" role="status">
          {missingCountWords(missing, rows.length)}
        </span>
        <label className="xr-check min-h-[32px] p-0 text-[15px]">
          <input
            type="checkbox"
            checked={missingOnly}
            onChange={() => setMissingOnly((current) => !current)}
          />
          {COURSE_CODES_TAB.showMissingOnly}
        </label>
      </div>
      <div className="xr-table-wrap xw-edit">
        <table className="xr-table">
          <caption className="xr-sr">{COURSE_CODES_TAB.caption}</caption>
          <thead>
            <tr>
              <th scope="col">{columns.course}</th>
              <th scope="col">{columns.bitsCode}</th>
              <th scope="col" className="w-[30%]">
                {columns.yourCode}
              </th>
              <th scope="col" className="w-[20%]">
                {columns.semester} <span className="xr-opt">{columns.optional}</span>
              </th>
              <th scope="col">{columns.status}</th>
            </tr>
          </thead>
          <tbody>
            {listed.length > 0 ? (
              listed.map((row) => {
                const draft = valueOf(row);
                const error = errors[row.course.id];
                const codeId = codeInputId(base, row.course.id);
                return (
                  <tr key={row.course.id}>
                    <td className="is-primary font-[700]">{row.course.name}</td>
                    <td data-label={columns.bitsCode}>
                      <BitsCode code={row.course.platformCode} />
                    </td>
                    <td data-label={columns.yourCode}>
                      <label className="xr-sr" htmlFor={codeId}>
                        {yourCodeLabel(row.course.name)}
                      </label>
                      <TextInput
                        id={codeId}
                        value={draft.code}
                        placeholder={COURSE_CODES_TAB.codePlaceholder}
                        invalid={error !== undefined}
                        aria-describedby={error ? `${codeId}-e` : `${codeId}-h`}
                        onChange={(event) => edit(row, { code: event.target.value })}
                      />
                      {error ? (
                        <FieldError id={`${codeId}-e`} className="mt-[6px]">
                          {error}
                        </FieldError>
                      ) : null}
                      <span className="xr-sr" id={`${codeId}-h`}>
                        {COURSE_CODES_TAB.codeHint}
                      </span>
                    </td>
                    <td data-label={`${columns.semester} ${columns.optional}`}>
                      <label className="xr-sr" htmlFor={`${base}-sem-${row.course.id}`}>
                        {semesterLabel(row.course.name)}
                      </label>
                      <TextInput
                        id={`${base}-sem-${row.course.id}`}
                        value={draft.semester}
                        placeholder={COURSE_CODES_TAB.semesterPlaceholder}
                        onChange={(event) => edit(row, { semester: event.target.value })}
                      />
                    </td>
                    <td data-label={columns.status}>
                      <CodeStatus row={row} />
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} className="text-ink-2">
                  {COURSE_CODES_TAB.noneMissing}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="xw-actions xw-actions--end mt-4">
        {dirty ? (
          <Button variant="text" onClick={undo}>
            {COURSE_CODES_TAB.undo}
          </Button>
        ) : null}
        <Button
          variant="primary"
          busy={saving}
          busyLabel={stateWords('IA-16.saving')}
          onClick={() => void save()}
        >
          {COURSE_CODES_TAB.save}
        </Button>
      </div>
    </>
  );
}

/** B2-03 f9: read-only while paused — the notice, then the codes as text. */
function ReadOnlyCodes({ rows }: { readonly rows: readonly InstitutionCourseCodeRow[] }) {
  const { columns } = COURSE_CODES_TAB;
  return (
    <>
      <Notice tone="warn" icon="readOnly" title={COURSE_CODES_TAB.pausedTitle}>
        {COURSE_CODES_TAB.pausedLine}
      </Notice>
      <div className="h-4" />
      <div className="xr-table-wrap">
        <table className="xr-table">
          <caption className="xr-sr">{COURSE_CODES_TAB.caption}</caption>
          <thead>
            <tr>
              <th scope="col">{columns.course}</th>
              <th scope="col">{columns.bitsCode}</th>
              <th scope="col">{columns.yourCode}</th>
              <th scope="col">
                {columns.semester} <span className="xr-opt">{columns.optional}</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.course.id}>
                <td className="is-primary font-[700]">{row.course.name}</td>
                <td data-label={columns.bitsCode}>
                  <BitsCode code={row.course.platformCode} withSuffix={false} />
                </td>
                <td data-label={columns.yourCode}>
                  {row.code?.code ? row.code.code : <MissingTag />}
                </td>
                <td data-label={`${columns.semester} ${columns.optional}`}>
                  {row.code?.semester ?? COURSE_CODES_TAB.none}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/** The BITS course code with its lock (`span.xw-ro`): read-only here (M-2). */
function BitsCode({
  code,
  withSuffix = true,
}: {
  readonly code: string | null;
  readonly withSuffix?: boolean;
}) {
  if (code === null) return <>{COURSE_CODES_TAB.none}</>;
  return (
    <span className="xw-ro">
      <Icon name="readOnly" />
      {code}
      {withSuffix ? <VisuallyHidden>{COURSE_CODES_TAB.readOnlySuffix}</VisuallyHidden> : null}
    </span>
  );
}

function MissingTag() {
  return (
    <span className="xw-tag xw-tag--warn">
      <Icon name="warning" />
      {COURSE_CODES_TAB.missing}
    </span>
  );
}

/** "Missing" / "Added" — from the saved code, as B2-03's `isMissing` reads it. */
function CodeStatus({ row }: { readonly row: InstitutionCourseCodeRow }) {
  return row.status === 'missing' ? (
    <MissingTag />
  ) : (
    <StatusPill tone="ok">{COURSE_CODES_TAB.added}</StatusPill>
  );
}

/** Loading (undrawn on B2-03): skeleton rows, announced (`IA-16.loading`). */
function LoadingCodes() {
  return (
    <div className="xr-table-wrap" aria-busy="true">
      <span className="xr-sr" role="status">
        {stateWords('IA-16.loading')}
      </span>
      {[0, 1, 2].map((line) => (
        <div
          key={line}
          className="grid grid-cols-[1.4fr_1fr_1.2fr_1fr_120px] gap-5 px-4 py-[18px] [border-block-start:1px_solid_var(--xr-line)]"
        >
          <Skeleton />
          <Skeleton />
          <Skeleton />
          <Skeleton />
          <Skeleton />
        </div>
      ))}
    </div>
  );
}
