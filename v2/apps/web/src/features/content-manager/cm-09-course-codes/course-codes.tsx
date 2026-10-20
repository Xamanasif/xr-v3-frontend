'use client';

import type { Out, platformCodesOutput } from '@xr/contracts/draft';
import {
  Button,
  type CmCodeRow,
  CmCodesFailed,
  CmCodesFoot,
  CmCodesSurface,
  CmCodesTable,
  CmColumns,
  type CmCourseGroup,
  CmPageHead,
  CmSays,
  CmSide,
  CmSideCard,
  CmSideText,
  ErrorSummary,
  type Figure,
  ListState,
  LoadingRows,
  Notice,
} from '@xr/ui/v3';
import { useLayoutEffect, useRef, useState } from 'react';

import {
  areaCount,
  changedCountWords,
  codedDetail,
  codeFieldLabel,
  codesSavedWords,
  COURSE_CODES,
  LIST_FAILED,
  liveUnderCourse,
} from '@/copy/cm-lists';
import { stateWords } from '@/copy/state-copy';
import { COURSE_CODES_TITLE, courseCodesPlacement } from '@/nav/content-manager';
import { usePlatformCourseCodes } from '@/queries/production';
import { courseCodeErrors, courseCodesSummaryTitle } from '@/queries/production-cm-lists';
import { useCommand } from '@/queries/use-command';

import { useShellPage } from '../../shared/workspace-frame/shell-page';
import { useToday } from '../cm-02-ready/list-facts';
import { clearCodeEdits, type CodeEdits, useCodeEdits } from './code-edits';

type CourseRow = Out<typeof platformCodesOutput>[number];

/** One course row’s error: the words under its field and in the summary. */
interface CodeError {
  readonly message: string;
  readonly summaryText: string;
}

/**
 * A save that did not go through: `failed` (the export's save failure, with Try again) or a
 * refusal the export does not draw, in the same place (state-copy `CM-09.stale.*`,
 * `CM-09.policy-open.*`).
 */
type SaveNotice = 'failed' | 'stale' | 'policy-open';

const TITLE_ID = 'cm-h-codes';
const SECTION_ID = 'cm-k-h';
const HINT_ID = 'cc-hint';
const WHERE_ID = 'cm-k-where';
const RULES_ID = 'cm-k-rules';
const SAYS_ICONS = {
  catalogue: 'contentLibrary',
  workspace: 'readyToPublish',
  blank: 'courseCodes',
} as const;

/** The code a row shows: what was typed, else the saved code, else blank. */
export function shownCode(row: CourseRow, edits: CodeEdits): string {
  return edits[row.course.id] ?? row.course.platformCode ?? '';
}

/** Whether the row’s typed code differs from its saved one (both trimmed). */
export function isChanged(row: CourseRow, edits: CodeEdits): boolean {
  return shownCode(row, edits).trim() !== (row.course.platformCode ?? '').trim();
}

/**
 * CM-09 Platform course codes — the V3 Refined B design (the owner-approved export
 * design/v3-refined-b/roles/CM-v1, `Main.dc.html` CM-09 and `codesVM`), at
 * `/content-manager/course-codes`.
 *
 * - **Read**: `PlatformCourseCodeService.list` — every course from Academic structure with its
 *   area, its published experiments and its platform code, in the service’s order; grouped here by
 *   engineering area in the order the areas first appear (read-only: the Super Admin keeps the
 *   structure), each course with its live experiments.
 * - **Save**: `PlatformCourseCodeService.save` with the changed rows only, each with the course’s
 *   `expectedRev` (the repeat-press protection of `useCommand`). Blank is allowed; a duplicate is
 *   refused by the service with its words under the row and in "Check the codes", which takes
 *   focus; nothing is saved until every code is unique or blank. Saved: "Codes saved" with the time
 *   takes focus. A failed save keeps every typed code and says so with Try again; a stale revision
 *   or an open policy (CC-06) are said in the same place (state-copy `CM-09.stale.*`,
 *   `CM-09.policy-open.*`).
 * - **As the export draws it**: the head with its figures; each row "Changed — not saved yet" while
 *   its code differs from the saved one; the foot "No unsaved changes" / "<n> changes not saved" /
 *   "Saving…", Undo changes (shown when something changed; it waits while the codes save) and Save
 *   codes; beside it where a code appears, and platform versus institution codes.
 * - Typed codes stay in memory for the session while she moves around (state-copy `CM-09.kept`).
 * - **States**: loading (no figures), couldn't load (Try again reads again and moves focus to the
 *   title).
 */
export function CourseCodes() {
  useShellPage(courseCodesPlacement());
  const today = useToday();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const read = usePlatformCourseCodes();
  const rows = read.data?.ok ? read.data.value : null;
  const failed = read.isError || (read.data !== undefined && !read.data.ok);
  const [edits, edit] = useCodeEdits();
  const [errors, setErrors] = useState<Readonly<Record<string, CodeError>>>({});
  const [summaryTitle, setSummaryTitle] = useState('');
  const [saved, setSaved] = useState<string | null>(null);
  const [notice, setNotice] = useState<SaveNotice | null>(null);
  const save = useCommand((ports) => ports.platformCourseCodes.save);
  const summary = useRef<HTMLDivElement>(null);
  const savedBox = useRef<HTMLDivElement>(null);
  const noticeBox = useRef<HTMLDivElement>(null);
  const firstInput = useRef<HTMLInputElement>(null);
  const focusTarget = useRef<'summary' | 'saved' | 'notice' | 'first' | null>(null);
  const setFocusTarget = (target: 'summary' | 'saved' | 'notice' | 'first') => {
    focusTarget.current = target;
  };

  // Focus moves once the element it goes to is on the page (the export's `focus('cm-k-errs' |
  // 'cm-k-saved' | 'cm-k-fail')`): every outcome also changes state, so a render follows.
  useLayoutEffect(() => {
    if (focusTarget.current === null) return;
    const target = {
      summary: summary.current,
      saved: savedBox.current,
      notice: noticeBox.current,
      first: firstInput.current,
    }[focusTarget.current];
    if (!target) return;
    focusTarget.current = null;
    target.focus();
  });

  const retryRead = () => {
    void read.refetch();
    titleRef.current?.focus();
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
    setNotice(null);
  };

  const changedRows = rows ? rows.filter((row) => isChanged(row, edits)) : [];

  const submit = async () => {
    if (!rows || save.busy) return;
    // Nothing changed: nothing to send (the foot reads “No unsaved changes”; `CM-09.kept`).
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
        setNotice(error.kind === 'policy-open' ? 'policy-open' : 'failed');
      }
      setFocusTarget('notice');
    } catch {
      setNotice('failed');
      setFocusTarget('notice');
    }
  };

  const undo = () => {
    if (save.busy) return;
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

  const areas: CmCourseGroup<CmCodeRow>[] = [];
  if (rows) {
    const areaNames: string[] = [];
    for (const row of rows) if (!areaNames.includes(row.areaName)) areaNames.push(row.areaName);
    for (const area of areaNames) {
      const inArea = rows
        .map((row, index) => ({ row, index }))
        .filter(({ row }) => row.areaName === area);
      areas.push({
        key: area || 'other',
        name: area || COURSE_CODES.otherArea,
        count: areaCount(inArea.length),
        rows: inArea.map(({ row, index }) => {
          const id = fieldId(index);
          const value = shownCode(row, edits);
          const error = errors[row.course.id];
          const changed = isChanged(row, edits);
          const blank = value.trim() === '';
          return {
            key: row.course.id,
            name: row.course.name,
            liveText: liveUnderCourse(row.publishedExperiments),
            live: row.publishedExperiments,
            field: {
              id,
              value,
              label: codeFieldLabel(row.course.name),
              inlineLabel: COURSE_CODES.inlineLabel,
              onChange: (next) => change(row.course.id, next),
              invalid: Boolean(error),
              describedBy: [
                HINT_ID,
                changed ? `${id}-c` : null,
                blank ? `${id}-b` : null,
                error ? `${id}-e` : null,
              ]
                .filter(Boolean)
                .join(' '),
              ...(index === 0 ? { ref: firstInput } : {}),
            },
            ...(changed ? { changed: { id: `${id}-c`, text: COURSE_CODES.changed } } : {}),
            ...(blank ? { blank: { id: `${id}-b`, text: COURSE_CODES.blank } } : {}),
            ...(error ? { error: { id: `${id}-e`, text: error.message } } : {}),
          };
        }),
      });
    }
  }

  const coded = rows
    ? rows.filter((row) => (row.course.platformCode ?? '').trim() !== '').length
    : 0;
  const figures: Figure[] = rows
    ? [
        {
          title: COURSE_CODES.withCode,
          value: coded,
          details: [codedDetail(rows.length, rows.length - coded)],
        },
        {
          title: COURSE_CODES.liveExperiments,
          value: rows.reduce((sum, row) => sum + row.publishedExperiments, 0),
          details: [COURSE_CODES.listed],
        },
      ]
    : [];

  const noticeWords =
    notice === 'stale'
      ? { title: stateWords('CM-09.stale.title'), line: stateWords('CM-09.stale.line') }
      : notice === 'policy-open'
        ? {
            title: stateWords('CM-09.policy-open.title'),
            line: stateWords('CM-09.policy-open.line'),
          }
        : { title: COURSE_CODES.saveFailed, line: COURSE_CODES.saveFailedLine };

  return (
    <>
      <CmPageHead
        title={COURSE_CODES_TITLE}
        titleId={TITLE_ID}
        titleRef={titleRef}
        date={today.line}
        lead={COURSE_CODES.lead}
        figures={figures}
        figuresLabel={COURSE_CODES.figuresLabel}
      />
      <CmColumns>
        <CmCodesSurface
          title={COURSE_CODES.sectionTitle}
          titleId={SECTION_ID}
          note={COURSE_CODES.sectionNote}
          hint={COURSE_CODES.hint}
          hintId={HINT_ID}
          messages={
            rows ? (
              <>
                <ErrorSummary
                  ref={summary}
                  id="cc-err"
                  title={summaryTitle}
                  items={summaryItems}
                  autoFocus={false}
                />
                {notice ? (
                  <CmCodesFailed
                    ref={noticeBox}
                    id="cc-fail"
                    title={noticeWords.title}
                    {...(notice === 'failed'
                      ? { retry: { label: LIST_FAILED.retry, onRetry: () => void submit() } }
                      : {})}
                  >
                    {noticeWords.line}
                  </CmCodesFailed>
                ) : null}
                {saved ? (
                  <Notice
                    ref={savedBox}
                    id="cc-saved"
                    tone="ok"
                    role="status"
                    title={COURSE_CODES.saved}
                  >
                    {saved}
                  </Notice>
                ) : null}
              </>
            ) : null
          }
        >
          {failed ? (
            <ListState
              kind="failed"
              titleAs="h2"
              title={COURSE_CODES.failed}
              action={<Button onClick={retryRead}>{LIST_FAILED.retry}</Button>}
            >
              {LIST_FAILED.line}
            </ListState>
          ) : rows === null ? (
            <LoadingRows message={COURSE_CODES.loading} cells={[2, 1, 1]} rows={4} />
          ) : (
            <>
              <CmCodesTable
                caption={COURSE_CODES.caption}
                headers={COURSE_CODES.headers}
                areas={areas}
              />
              <CmCodesFoot
                state={
                  save.busy
                    ? COURSE_CODES.saving
                    : changedRows.length > 0
                      ? changedCountWords(changedRows.length)
                      : COURSE_CODES.clean
                }
              >
                {changedRows.length > 0 ? (
                  <Button busy={save.busy} onClick={undo}>
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
              </CmCodesFoot>
            </>
          )}
        </CmCodesSurface>
        <CmSide label={COURSE_CODES.side.label}>
          <CmSideCard titleId={WHERE_ID} title={COURSE_CODES.side.where}>
            <CmSays
              items={COURSE_CODES.side.says.map((point) => ({
                key: point.key,
                icon: SAYS_ICONS[point.key],
                title: point.title,
                children: point.line,
              }))}
            />
          </CmSideCard>
          <CmSideCard ivory titleId={RULES_ID} title={COURSE_CODES.side.rules}>
            <CmSideText flush>{COURSE_CODES.side.rulesLine}</CmSideText>
          </CmSideCard>
        </CmSide>
      </CmColumns>
    </>
  );
}
