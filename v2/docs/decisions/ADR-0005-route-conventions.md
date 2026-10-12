# ADR-0005 — Route conventions for the v46 App Router

|                    |                                                                                                                                                                                                                                                                                                                        |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**         | Accepted — engineering decision under the owner-approved Phase-0 plan                                                                                                                                                                                                                                                  |
| **Date**           | 12 Oct 2026                                                                                                                                                                                                                                                                                                            |
| **Audit ids**      | routes rules S1–S4 and T1–T4, X-3, X-4, register P0-35, O-01…O-12                                                                                                                                                                                                                                                      |
| **Implemented in** | WP-0.13 (Phase-0 screens and guards); every later phase follows it                                                                                                                                                                                                                                                     |
| **Owner sign-off** | Routes are the implementer's choice (START-HERE known exception 5: "the screen, its type and navigation place are fixed, the URL is the implementer's choice"). **Owner acknowledgement of this ADR is requested at the WP-0.2 review.** The route-level owner questions O-01…O-12 stay open and are not decided here. |

## Context

`design/handoff-v46/canvas-v46/project/handoff/screens.json` proposes routes for the 123 designed screen IDs. The audit found three kinds of problem:

- 19 proposed values are not literal routes, for example SA-15 packing two routes and SA-16 using "|".
- Tabs are modelled two ways.
- Some proposals contradict their boards: IA-14 `/new` vs the B2-08 dialog, VE-13 tab vs the B5-06 section, and PU-05 keyed by a course code that may be blank.

The 24 not-designed IDs must get no route, link or menu item.

## Decision

1. **Static workspace bases** with one layout each (guard plus shell): `/student`, `/faculty`, `/institute`, `/vendor`, `/reviewer`, `/content-manager`, `/admin`. The public pages sit in a `(public)` route group and sign-in in `(auth)`. Help is a static `help/` folder per workspace. There is no dynamic `[workspace]` segment.
2. **One canonical dynamic-param name per record kind** (`courseId`, `experimentId`, `submissionId`, `updateId`, `requestId` …), so no level has two dynamic segments with different names. The access-request id is **opaque**: the REQ reference is display data, never a key (B1-07, B1-08).
3. **Tabs.**
   - **T1, path segment:** link tabs with their own screen IDs under a persistent record header.
   - **T2, `?tab=` query:** link tabs on a collection page that has a dynamic child. The default tab carries no parameter.
   - **T3, optional view query:** filters and toggles of one list.
   - **T4, no tab URL:** where the board draws a section or anchor rather than a tab control. VE-13 is `#history`.
4. **Steps.**
   - **S1:** named step slugs in `?step=`.
   - **S2:** a creating wizard lives at `/new?step=` until first save, then replaces to `/[id]/edit?step=`. Revision uses `/[id]/revise?step=`.
   - **S3:** in-page steps for flows that cannot be rebuilt from a URL (imports, drafting).
   - **S4:** a step URL with missing earlier data falls back to the first incomplete step.
5. **Guards are runtime components, not redirects.**
   - The workspace guard renders XS-06 "Not your workspace" in place, keeping the URL.
   - Record guards render drawn refusals (for example ST-19 "not available").
   - The session gate is a **client `SessionGate`** (X-3). Under ADR-0004 the session exists only in the tab's memory, so a server `proxy.ts` cannot see it. `proxy.ts` becomes possible only with a cookie or BFF session (E-02).
   - `returnTo` after sign-in is honoured only as a same-origin relative path inside the signed-in role's own base.
6. **Board-forced corrections** (the board wins over the index): PU-05 `/courses/[courseId]`; IA-14 has no `/new` (Create group is a dialog); VE-03…VE-06 use the S2 pre-save form; VE-13 is a section; XS-03 is a notice on `/sign-in?reason=`.
7. **Intermediate paths** with no screen of their own (26 in the route plan) redirect to their default child, or to the not-found pattern.
8. **Unbuilt destinations** (Phase-0 interim, P0-35):
   - Navigation items render only for built screens, and unbuilt URLs show the not-found pattern.
   - `/<base>` redirects to `/<base>/help` until that workspace's home screen exists.
   - A link-target ledger records every drawn link whose target is not built yet.
   - The 24 excluded IDs get no route, link or navigation item.
9. The sidebar's current item comes from an explicit map, not from URL prefixes.

## Consequences

- URLs are stable across phases. Each phase adds route files under these rules without moving existing ones.
- Twelve route questions remain the owner's (O-01…O-12). Examples: registering the Student hub Assessment tab and the Institute Admin request detail, the PU-10 gate, and the header "Request access" target (the board sends it to PU-07). Each has a recorded interim, and none is decided by this ADR.
- A reviewer cannot browse to an unbuilt screen through navigation during Phase 0.

## Removal trigger

A new owner-approved canvas version that changes navigation, an owner answer to any of O-01…O-12, or a cookie or BFF session (E-02) that makes server-side session redirects possible.

## Evidence

- `v2/docs/v46/audit/Appendix-A-Routes.md` §1 (147-row table), §3.2–§3.8 (tree, params, tabs, steps, active map, redirects, guards), §5 (route defects), §6 (O-01…O-12).
- `v2/docs/v46/routes.json`; `v2/docs/v46/audit/Appendix-F-Phase0-Plan.md` §0.2 (X-3, X-4), §3.3; `v2/docs/v46/audit/Appendix-G-Owner-Decisions.md` HB-08…HB-16, P0-35.
- `design/handoff-v46/canvas-v46/project/handoff/screens.json`, `navigation.json`; boards B1-03, B1-07, B1-08, B1-09, B2-08, B5-03, B5-06, 08; `design/handoff-v46/START-HERE.md` known exception 5.
