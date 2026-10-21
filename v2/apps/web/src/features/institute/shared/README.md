# Institute Admin: shared helpers (frozen APIs)

What more than one Institute Admin screen group (IA-ANALYSIS §5: plan, access, people, requests)
imports. These APIs are **frozen** for the V3 migration: the screen groups import them and do not
change them; a group that needs different behaviour writes its own helper in its own folder (or
asks the shared-pieces owner). The old paths re-export these names so that every importer still
compiles; new code imports from `features/institute/shared/…` directly.

| Module                 | Frozen API                                                                                                                                                                                                  | Moved from                                                                                                | Used by                          |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- | -------------------------------- |
| `institute-parts.tsx`  | `InstituteStatusPill({status})`, `PlanStatusPill({status})`, `GrantStatusPill({display})`, `isGivable(status)`, `LoadFailed({title, onRetry})` (v46 markup)                                                 | `ia-02-content-access/institute-parts.tsx`                                                                | IA-01/02/03/16/17/18/19/20       |
| `paused.tsx`           | `useInstitutionPaused(): boolean`, `PausedNotice({className?})` (v46 markup)                                                                                                                                | `ia-06-people/paused.tsx`                                                                                 | IA-02/06/07/09/10/11/14/15/17/19 |
| `list-parts.tsx`       | `PeopleToolbar({search, filters?, status, chips, onClearFilters?, clearLabel})`, `PeopleFilter`, `ListLoading({label, columns, cells})`, `ListFailed({title, line, retryLabel, onRetry})` (v46 markup)      | `ia-06-people/list-parts.tsx`                                                                             | IA-06/08/13/15                   |
| `format-codes.ts`      | `formatCodes(formats): FormatCode[]` (WEB · AR · VR · MR order)                                                                                                                                             | `ia-06-people/students.tsx` (that file keeps `StudentsTab` and re-exports `formatCodes`)                  | IA-06/07/13/14                   |
| `transfer-view.ts`     | `TRANSFER_TONE`, `transferStatusWords(state)`, `StudentNaming`, `StudentNames`, `studentOf(transfer, students)`, `newestFirst(transfers)`, `TransferHistoryLine`, `transferHistoryLines(transfer, student)` | `ia-18-device-requests/transfer-view.ts`                                                                  | IA-01, IA-18, IA-19              |
| `use-student-names.ts` | `useStudentNames(): {byId, pending}`                                                                                                                                                                        | `ia-18-device-requests/use-student-names.ts`                                                              | IA-01, IA-18, IA-19              |
| `actor-name.ts`        | `actorName(actor): string \| null`                                                                                                                                                                          | `ia-07-student-record/record-view.ts` (that file keeps its IA-07 view helpers and re-exports `actorName`) | IA-07, IA-09                     |

The v46-markup parts (`LoadFailed`, `PausedNotice`, `PeopleToolbar`, `ListLoading`, `ListFailed`,
the status pills) stay as they are until no screen imports them; V3 screens draw their states with
`@xr/ui/v3` (`ListState`, `LoadingRows`, `Notice`, `StatusPill`) and the shared IA kit pieces in
`packages/ui/src/v3/ia.tsx`, fed by the shared presentation models in this folder.

## Shared V3 presentation models

Pure (or a one-line hook) over what the existing reads answer; words from `copy/ia-shared.ts` and
the role's existing copy; tested on the sample world's records in `models.test.ts`.

| Module              | API                                                                                                                                                                              | For                                            |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `status-model.ts`   | `institutionStatusView`, `planStatusView`, `grantStatusView`, `directoryStatusView` → `{ tone, words }` (the export's `instSt`, `planSt`, `RST`, `PST`); the tone tables         | `StatusPill` on IA-01/02/03/04/06/07/14        |
| `grant-view.ts`     | `grantRowView(row, groupNames)` (`listGrants`, `getStudent`), `planGrantRowView(row)` (`getAccessPlan` `givenTo`) → who, how given, date, status, muted; `grantFormats(formats)` | `IaGroupedTable` / `IaGrantHow` on IA-03/04/07 |
| `format-cells.ts`   | `formatCellsView(experiment, inPlan, published, { given })` → `{ label, cells, key }`                                                                                            | `IaFormatList` on IA-01/02/03                  |
| `toolbar-model.ts`  | `visibleSegments(first, rest, counts, current)`, `countBy(rows, keyOf)`, `filterChip(key, label, onRemove, focusId)`                                                             | `IaSegments` / `IaManageStatus` on IA-04/06    |
| `use-today-line.ts` | `useInstituteTodayLine()`: "Thursday 22 October 2026" on the session's clock                                                                                                     | every page head's date line                    |

The Institute Admin's link-target ledger entries are split the same way, per group, in
`src/nav/link-targets-ia/{plan,access,people,requests}.ts` (spread by `link-targets.ts` and
`link-targets-p3/institute-requests.ts` in the ledger's order).
