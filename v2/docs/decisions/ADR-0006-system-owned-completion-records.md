# ADR-0006 — Learning completion is a system-owned record behind `CompletionPolicy`

|                    |                                                                                                                                           |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**         | Accepted. The completing event itself stays **open** (T-12 / `OPEN_DECISIONS.md` A-06).                                                   |
| **Date**           | 12 Oct 2026                                                                                                                               |
| **Amends**         | `ARCHITECTURE.md` §8 (progress "Derived, never stored as truth") and the reading of §11                                                   |
| **Audit ids**      | AD-39, X-7, register P3-01 (a)/(d), gate G-2, register A4 (e)                                                                             |
| **Implemented in** | WP-0.9 (domain record, policy seam, invariants), WP-0.11 (system handler in the mock), WP-0.3 (moving the committed rule behind the seam) |
| **Owner sign-off** | **Approved 12 Oct 2026 — G-2:** "Separate system-owned completion records behind a `CompletionPolicy`."                                   |

## Context

Owner binding constraint BC3 says that published, institution access, Student entitlement, runtime activity and learning completion are five different states, and one is never derived from another. "Completed" is set by the system, never by the Student, and never inferred from a launch. The event that marks a format Completed is still open (T-12). BC4 keeps progress per technology format with no aggregate verdict. BC5 offers feedback only after that format is Completed.

The boards agree:

- B3-03: "Completed means The simulation reports that you finished. You can't mark it yourself." and "No 'I have finished' button."
- B3-04 f2: "Completion reported from the headset (T-12)".
- B3-12 C3: the completion actor is "System".

The committed foundation conflicts in two places:

- `1b090c9:v2/packages/domain/src/runtime/utilisation.ts` (lines 183–193, 238–242) treats a `SIMULATION_COMPLETED` event on a launched or started session as COMPLETED. Used as _the_ rule, that would silently close T-12.
- `ARCHITECTURE.md` §8 says progress is "derived, never stored as truth".

## Decision

1. **Completion is its own record** (`FormatCompletion`, record kind `COMP`): Student × Experiment × technology format, with the completion time, the reporting source ("simulation" or "headset") and `recordedBy: system`. It is separate from runtime activity. No code path can set it from an activity record.
2. **Only the system completion handler writes it.** In sample mode the only source is the test/seed-only `RuntimeReportPort.reportCompletion`, which has no UI.
   - No Student command, launch, session, elapsed time, resource opening, assessment result or other format can create it.
   - A second completion never moves the first date.
   - Matrix rows: CMP-01 SYSTEM (allowed), CMP-02 DENY ("I have finished"), CMP-03 DENY (inferring completion from a launch, resource or assessment).
3. **`CompletionPolicy` is the replaceable seam where the T-12 answer will live.** The committed `utilisation.ts` `SIMULATION_COMPLETED` rule becomes one **labelled interim implementation** of it, meant for a future runtime adapter. It decides nothing about T-12, and the mock does not derive completion from `deriveSimulationUtilisation(...).status`. Whether the stand-in's report also passes through the interim policy (audit X-7) is an implementation detail; either way the source is the stand-in, never a launch.
4. **Read models never derive one state from another.**
   - `formatProgress` shows Completed only when a completion record exists.
   - `feedbackEntry` requires a completion for that format and no earlier feedback (one per Student × Experiment × format).
   - `canOpenFormat` reads publication, institution access and entitlement only, never activity or completion.
   - `FormatProgressStatus` (`not-started` · `in-progress` · `completed`) is the one status any screen uses. There is no percentage and no experiment-level verdict.
5. **Invariants checked after every command in tests:**
   - Only runtime ingestion changes activity, and only the completion handler writes completion.
   - Completion is never written from a launch, resource, assessment, time or another format.
   - `canOpenFormat` is unchanged by runtime events.
   - "Completed" is read only from the completion record.
6. Whether a portal "Launch WEB" alone may set "In progress" is a separate, open activity question (P3-01 (c), Phase 3). It never affects completion.

## Consequences

- The ARCHITECTURE §8 principle is amended for exactly one record: completion is stored as a system fact. Progress views stay derived per format.
- When T-12 is answered, only the `CompletionPolicy` implementation changes. Screens, ports and read models do not.
- Stored completion records survive a pause or withdrawal ("Completed 14 Oct 2026 before the pause", B3-01/B3-05). Progress does not change when access changes.
- Usage and Faculty counts read completion records ("reported completed by the simulation or the headset", B3-10), never launches.

## Removal trigger

None as an exception. The completion record is the target design. The **interim policy** is replaced when T-12 / A-06 is decided and a real runtime adapter posts to the ingestion API.

## Evidence

- `v2/docs/v46/audit/Appendix-C-Schemas-and-Contracts.md` M16 (runtime activity), M17 (`FormatCompletion`, `FormatProgressView`, `CompletionPolicy`), §1.9 (required edits to `utilisation.ts`).
- `v2/docs/v46/audit/Appendix-D-Architecture.md` §5.1–§5.5 (five states, writers, read models, invariants).
- `v2/docs/v46/audit/Appendix-F-Phase0-Plan.md` §0.2 X-7; `v2/docs/v46/audit/Appendix-G-Owner-Decisions.md` A4 (e), P3-01; `v2/docs/v46/audit/OWNER-REVIEW.md` §5.
- `v2/docs/v46/permission-matrix.json` rows CMP-01, CMP-02, CMP-03, FB-01.
- Boards B3-03, B3-04, B3-05, B3-06, B3-10, B3-12; `design/handoff-v46/START-HERE.md` binding constraints 3–5.
- `1b090c9:v2/packages/domain/src/runtime/utilisation.ts`; `1b090c9:v2/docs/ARCHITECTURE.md` §8, §11.
