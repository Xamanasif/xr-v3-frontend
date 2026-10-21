# Faculty: shared helpers (frozen APIs)

What more than one Faculty screen group (FA-ANALYSIS §5.1: teaching FA-01 … FA-05, assessments
FA-06 … FA-12, bank FA-14 … FA-17, marking FA-18 … FA-21) imports. These APIs are **frozen** for the
V3 migration: the screen groups import them and do not change them; a group that needs different
behaviour writes its own helper in its own folder (or asks the shared-pieces owner). Where words
moved, the old module re-exports them under the same name, so every importer still compiles.

## Cross-group helpers (frozen)

| Module            | Frozen API                                                                                                                                                                                  | Used by                                             |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| `download-csv.ts` | `downloadCsv(fileName, csv)` — the service's CSV as a file of the name the service gives (FA-22)                                                                                            | FA-12 (assessments), FA-20 (marking)                |
| `mark-oldest.ts`  | `useOldestWaiting(assessmentId \| null, waiting): { address, attemptId, pending }` — "Mark" → FA-19 of the oldest submission waiting (MarkingService `listQueue`, oldest first), else FA-18 | FA-01, FA-03, FA-05 (teaching); FA-08 (assessments) |

Words two groups share are in `src/copy/fa-shared.ts` (frozen): `FACULTY_FAILED_WORDS` (re-exported
by `faculty-overview.ts`), `QUESTION_SOURCE_WORDS` (spread into `question-tools.ts` `BANK_TOOLS`),
`UNTITLED_DRAFT` / `assessmentName(name)` (every page that names an assessment — never its id).

## Group-owned files in this folder

| Module                 | Owner       | Why here                                                               |
| ---------------------- | ----------- | ---------------------------------------------------------------------- |
| `assessment-frame.tsx` | assessments | Only FA-08 … FA-12 import it (the record's header, tabs and refusals). |
| `rules-fields.tsx`     | assessments | Only FA-07 and FA-10 import it (the rules form).                       |

Their APIs may change inside the assessments group; other groups must not import them (they draw
the record band and form sections with the shared kit pieces in `packages/ui/src/v3/fa.tsx`).

## Shared V3 presentation models

Pure (or a one-line hook) over what the existing reads answer; words from `copy/fa-shared.ts` and
the role's existing copy; tested on the sample world's records in `models.test.ts` and
`hooks.test.ts`.

| Module                | API                                                                                                                                         | For                                                      |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| `progress-model.ts`   | `progressUnits(counts)`, `formatProgressRows(perFormatCounts)` → `FaProgressRow[]` (WEB · AR · VR · MR), `submittedUnits(submitted, reach)` | `FaProgress`, `FaUnits` on FA-01/03/04/05/06/08/20       |
| `assessment-state.ts` | `assessmentStateView(readiness \| null)`, `assessmentStateLongView(…)` → `{ tone, words }` (the export's `asmState`, `stLabelOf`)           | `StatusPill` on FA-01 … FA-06, FA-08 … FA-12             |
| `deadline-model.ts`   | `deadlineView(deadline, now)` → `{ days, passed }` (calendar days, Indian time), `deadlineWords(deadline, now, 'due' \| 'short')`           | days left on FA-01/03/05/06 and the record band          |
| `csv-preview.ts`      | `csvTable(csv)` → `{ columns, rows }` (RFC 4180, the service's own file)                                                                    | `FaExportBand` on FA-12 and FA-20 (FA-22)                |
| `use-today.ts`        | `useFacultyToday()` → `{ now, line, day }` on the session's clock                                                                           | the date line, "As of …", days left on every page        |
| `mark-oldest.ts`      | `useOldestWaiting(assessmentId \| null, waiting)` (see above)                                                                               | "Mark" / "Mark now" on FA-01/03/05, "Mark next" on FA-08 |
