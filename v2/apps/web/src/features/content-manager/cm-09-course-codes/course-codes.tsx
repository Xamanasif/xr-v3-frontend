'use client';

import type { Out, platformCodesOutput } from '@xr/contracts/draft';
import { Button, ErrorSummary, Icon, Notice, PageContent, PageHeader } from '@xr/ui';
import { useId, useLayoutEffect, useRef, useState } from 'react';

import {
  changedCountWords,
  codeFieldLabel,
  codesSavedWords,
  COURSE_CODES,
  courseMeta,
} from '@/copy/cm-lists';
import { stateWords } from '@/copy/state-copy';
import { COURSE_CODES_TITLE, courseCodesPlacement } from '@/nav/content-manager';
import { usePlatformCourseCodes } from '@/queries/production';
import { courseCodeErrors, courseCodesSummaryTitle } from '@/queries/production-cm-lists';
import { useCommand } from '@/queries/use-command';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { LoadFailed, LoadingRows, useRetryFocus } from '../cm-02-ready/list-parts';
import { clearCodeEdits, type CodeEdits, useCodeEdits } from './code-edits';

type CourseRow = Out<typeof platformCodesOutput>[number];

/** One course row’s error: the words under its field and in the summary. */
interface CodeError {
  readonly message: string;
  readonly summaryText: string;
}

/** A refusal other than the drawn field errors (state-copy `CM-09.stale` / `.policy-open` / `.unavailable`). */
type SaveNotice = 'stale' | 'policy-open' | 'unavailable';

const NOTICE_WORDS = {
  stale: { title: 'CM-09.stale.title', line: 'CM-09.stale.line' },
  'policy-open': { title: 'CM-09.policy-open.title', line: 'CM-09.policy-open.line' },
  unavailable: { title: 'CM-09.unavailable.title', line: 'CM-09.unavailable.line' },
} as const;

/** The code a row shows: what was typed, else the saved code, else blank. */
export function shownCode(row: CourseRow, edits: CodeEdits): string {
  return edits[row.course.id] ?? row.course.platformCode ?? '';
}

/** Whether the row’s typed code differs from its saved one (B6-10 `changed`: both trimmed). */
export function isChanged(row: CourseRow, edits: CodeEdits): boolean {
  return shownCode(row, edits).trim() !== (row.course.platformCode ?? '').trim();
}

/**
 * CM-09 Course codes — board B6-10 f0 … f2 (and B6-11 f12), at `/content-manager/course-codes`:
 * “The official platform code of each course — shown in the public catalogue”.
 *
 * - **Read**: `PlatformCourseCodeService.list` — every course from Academic structure with its
 *   area, its published experiments and its platform code, in the service’s order.
 * - **Save**: `PlatformCourseCodeService.save` with the changed rows only, each with the course’s
 *   `expectedRev`. Blank is allowed (“No code yet — the catalogue shows the course name only.”); a
 *   duplicate is refused by the service with B6-11 f12’s words under the row that repeats it and
 *   in “Check the codes”, which takes focus; nothing is saved until every code is unique or blank.
 *   Saved: “Codes saved · <time> · the catalogue shows them from now on” takes focus, and the
 *   public catalogue reads the new codes (one world). The Content Manager is the only writer
 *   (M-2); a code of a course with published experiments is saved directly (OD-B6-13).
 * - **As B6-10 draws it**: each row “Changed — not saved yet” while its code differs from the saved
 *   one; the footer “No unsaved changes” or “<n> changes not saved” with “Undo changes”; “Save
 *   codes” the one primary; the note on who edits the codes. Below 760 px of content the rows
 *   become labelled blocks (f1, f2).
 * - Typed codes stay in memory for the session while she moves around (state-copy `CM-09.kept`).
 *   A stale revision, an open policy (CC-06) or a failed save keep every typed code and say so
 *   (state-copy `CM-09.stale.*`, `CM-09.policy-open.*`, `CM-09.unavailable.*`).
 * - Undrawn: loading and failed + Try again (state-copy `CM-09.loading`, `CM-09.failed`).
 */
export function CourseCodes() {
  useShellPage(courseCodesPlacement());
  const headingId = useId();
  const read = usePlatformCourseCodes();
  const rows = read.data?.ok ? read.data.value : null;
  const failed = read.isError || (read.data !== undefined && !read.data.ok);
  const retried = useRetryFocus(rows !== null);
  const [edits, edit] = useCodeEdits();
  const [errors, setErrors] = useState<Readonly<Record<string, CodeError>>>({});
  const [summaryTitle, setSummaryTitle] = useState('');
  const [saved, setSaved] = useState<string | null>(null);
  const [notice, setNotice] = useState<SaveNotice | null>(null);
  const save = useCommand((ports) => ports.platformCourseCodes.save);
  const summary = useRef<HTMLDivElement>(null);
  const savedLine = useRef<HTMLParagraphElement>(null);
  const noticeBox = useRef<HTMLDivElement>(null);
  const firstInput = useRef<HTMLInputElement>(null);
  const focusTarget = useRef<'summary' | 'saved' | 'notice' | 'first' | null>(null);
  const setFocusTarget = (target: 'summary' | 'saved' | 'notice' | 'first') => {
    focusTarget.current = target;
  };

  // Focus moves once the element it goes to is on the page (B6-10 `focus(pid + '-err' | '-saved')`):
  // every outcome also changes state, so a render follows the request.
  useLayoutEffect(() => {
    if (focusTarget.current === null) return;
    const target = {
      summary: summary.current,
      saved: savedLine.current,
      notice: noticeBox.current,
      first: firstInput.current,
    }[focusTarget.current];
    if (!target) return;
    focusTarget.current = null;
    target.focus();
  });

  const retry = () => {
    retried();
    void read.refetch();
  };

  const change = (courseId: string, value: string) => {
    edit((current) => ({ ...current, [courseId]: value }));
    setErrors((current) => {
      if (!(courseId in current)) return current;
      const next = { ...current };
      delete next[courseId];
      return next;
    });
    setSaved(null);
  };

  const changedRows = rows ? rows.filter((row) => isChanged(row, edits)) : [];

  const submit = async () => {
    if (!rows || save.busy) return;
    // Nothing changed: nothing to send (the footer reads “No unsaved changes”; `CM-09.kept`).
    if (changedRows.length === 0) return;
    const changes = changedRows.map((row) => ({
      courseId: row.course.id,
      code: shownCode(row, edits),
      expectedRev: row.course.rev,
    }));
    setNotice(null);
    setSaved(null);
    try {
      const answer = await save.run({ changes });
      if (answer.ok) {
        clearCodeEdits();
        setErrors({});
        const at = answer.value
          .map((course) => course.updatedAt)
          .reduce((latest, instant) => (instant > latest ? instant : latest), '');
        setSaved(at ? codesSavedWords(at) : null);
        setFocusTarget('saved');
        return;
      }
      const { error } = answer;
      if (error.kind === 'validation-failed') {
        const found = courseCodeErrors(error, changes);
        setErrors(
          Object.fromEntries(
            found.map((entry) => [
              entry.field,
              { message: entry.message, summaryText: entry.summaryText },
            ]),
          ),
        );
        setSummaryTitle(courseCodesSummaryTitle(error, found.length));
        setFocusTarget('summary');
        return;
      }
      if (error.kind === 'stale-version' || error.kind === 'not-found') {
        setNotice('stale');
        void read.refetch();
      } else {
        setNotice(error.kind === 'policy-open' ? 'policy-open' : 'unavailable');
      }
      setFocusTarget('notice');
    } catch {
      setNotice('unavailable');
      setFocusTarget('notice');
    }
  };

  const undo = () => {
    clearCodeEdits();
    setErrors({});
    setSaved(null);
    setNotice(null);
    setFocusTarget('first');
  };

  const fieldId = (index: number) => `cc-code-${index}`;
  const summaryItems = rows
    ? rows.flatMap((row, index) => {
        const error = errors[row.course.id];
        return error ? [{ fieldId: fieldId(index), summaryText: error.summaryText }] : [];
      })
    : [];

  return (
    <PageContent wrap="wide">
      <PageHeader
        className="mb-6"
        title={COURSE_CODES_TITLE}
        meta={<span className="xl-meta">{COURSE_CODES.meta}</span>}
      />
      <section
        className="xr-section"
        aria-labelledby={headingId}
        aria-busy={rows === null && !failed ? true : undefined}
      >
        <div className="xr-section-head">
          <h2 id={headingId} className="xr-h2">
            {COURSE_CODES.sectionTitle}
          </h2>
          <span className="xr-meta">{COURSE_CODES.sectionMeta}</span>
        </div>
        {failed ? (
          <LoadFailed title={stateWords('CM-09.failed')} onRetry={retry} />
        ) : rows === null ? (
          <LoadingRows
            label={stateWords('CM-09.loading')}
            grid="grid-cols-[1.4fr_1fr]"
            cells={2}
            rows={6}
          />
        ) : (
          <>
            <div className="[padding:0_24px_12px]">
              <ErrorSummary
                ref={summary}
                id="cc-err"
                title={summaryTitle}
                items={summaryItems}
                autoFocus={false}
              />
              {notice ? (
                <Notice
                  ref={noticeBox}
                  tone="err"
                  role="alert"
                  tabIndex={-1}
                  title={stateWords(NOTICE_WORDS[notice].title)}
                  className="mb-3"
                >
                  {stateWords(NOTICE_WORDS[notice].line)}
                </Notice>
              ) : null}
              <p className="xr-hint m-0" id="cc-hint">
                {COURSE_CODES.hint}
              </p>
            </div>
            {saved ? (
              <p
                ref={savedLine}
                className="xa-save is-ok [margin:0_24px_12px]"
                role="status"
                id="cc-saved"
                tabIndex={-1}
              >
                <Icon name="done" />
                {saved}
              </p>
            ) : null}
            <div className="xr-table-wrap rounded-none border-x-0 border-b-0">
              <table className="xr-table xg-codes">
                <thead>
                  <tr>
                    <th scope="col">{COURSE_CODES.columns.course}</th>
                    <th scope="col">{COURSE_CODES.columns.code}</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, index) => {
                    const id = fieldId(index);
                    const value = shownCode(row, edits);
                    const error = errors[row.course.id];
                    return (
                      <tr key={row.course.id}>
                        <td className="is-primary">
                          <strong>{row.course.name}</strong>
                          <span className="xr-meta block">
                            {courseMeta(row.areaName, row.publishedExperiments)}
                          </span>
                        </td>
                        <td data-label={COURSE_CODES.columns.code}>
                          <label className="xr-sr" htmlFor={id}>
                            {codeFieldLabel(row.course.name)}
                          </label>
                          <input
                            ref={index === 0 ? firstInput : undefined}
                            id={id}
                            className="xr-input"
                            value={value}
                            onChange={(event) => change(row.course.id, event.target.value)}
                            aria-invalid={error ? true : undefined}
                            aria-describedby={error ? `cc-hint ${id}-e` : 'cc-hint'}
                          />
                          {error ? (
                            <span className="xr-error" id={`${id}-e`}>
                              <Icon name="failed" />
                              {error.message}
                            </span>
                          ) : null}
                          {isChanged(row, edits) ? (
                            <span className="xg-changed-mark">
                              <Icon name="marking" size={16} />
                              {COURSE_CODES.changed}
                            </span>
                          ) : null}
                          {value.trim() === '' ? (
                            <span className="xr-meta mt-[6px] block">{COURSE_CODES.blank}</span>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="xw-flow-foot [padding:16px_24px]">
              <span className="xr-meta" role="status">
                {changedRows.length > 0
                  ? changedCountWords(changedRows.length)
                  : COURSE_CODES.clean}
              </span>
              <div className="xw-actions">
                {changedRows.length > 0 ? (
                  <Button variant="text" onClick={undo}>
                    {COURSE_CODES.undo}
                  </Button>
                ) : null}
                <Button
                  variant="primary"
                  busy={save.busy}
                  busyLabel={COURSE_CODES.saving}
                  onClick={() => void submit()}
                >
                  {COURSE_CODES.save}
                </Button>
              </div>
            </div>
          </>
        )}
      </section>
      <p className="xl-open mt-4 mb-0">
        <Icon name="info" size={16} />
        <span>{COURSE_CODES.note}</span>
      </p>
    </PageContent>
  );
}
