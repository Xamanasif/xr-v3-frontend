# ADR-0004 — Sample-world persistence: in memory, one world per tab

|                    |                                                                                                                                         |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**         | Accepted — option A. Option B (browser persistence, exception TE-6) is **not authorised**.                                              |
| **Date**           | 12 Oct 2026                                                                                                                             |
| **Audit ids**      | AD-07, TE-6, register P0-02, DV-7, HB-21                                                                                                |
| **Implemented in** | WP-0.11 (persistence driver: `memory`)                                                                                                  |
| **Owner sign-off** | **12 Oct 2026:** "Browser persistence remains deferred." Option A needs no authorisation; it was acknowledged with the plan, not gated. |

## Context

BC14 asks for one connected application state for every shared record. BC10 excludes _backend_ persistence. Board B8-06 says "Real auth, payment, XR runtimes, grading automation and persistence stay out until decided" (register HB-21). `FUNCTIONAL_PARITY_MATRIX.md` §G excludes the prototype's `localStorage` namespace and schema-version chain.

The audit compared four options (`v2/docs/v46/audit/Appendix-D-Architecture.md` §3.1):

- **A:** in memory, one world per browser tab.
- **B:** a versioned `localStorage` snapshot with BroadcastChannel and Web Locks.
- **C:** a server-side world in Next route handlers.
- **D:** Mock Service Worker over an HTTP adapter.

## Decision

1. **Option A.** The sample world is built from the deterministic seed when a tab starts. It lives only in that tab's memory and is shared by every role signed in within that tab (sign out, then sign in as another person). The `@xr/sample-platform` persistence driver is `memory`.
2. Nothing is written to `localStorage` or IndexedDB. Only the two board-drawn browser-session items go to `sessionStorage`: the public selection basket (B1-06 "lives in the visitor's browser session") and the request-status ticket (B1-07 "continues from this session").
3. The rail expand/collapse preference (board 13 Q7) stays in memory per tab until VD-20 is decided (DV-7).
4. **Option B stays behind the pluggable driver and is not built** until the owner authorises TE-6. If authorised, it would be a versioned snapshot with integrity checks, reseed on unreadable data, cross-tab updates and serialised writers, with no product notice and no "demo" wording.
5. **Option C is rejected:** it would make `apps/web` the business backend (ARCHITECTURE §3) and invent API paths. **Option D is deferred:** it would invent endpoints before `apps/api` exists.

## Consequences

- Fits BC10 and B8-06 as written. Every load starts from the same seed, so tests and captures are deterministic.
- BC14 holds **within one tab**. A reload returns the tab to the seed's starting world, signed out. A second tab gets its own world, and a deep link opened in a new tab asks for sign-in again.
- Hosted reviewer walk-throughs of cross-role flows must re-walk from the start after a refresh. Authorising option B before hosted Phase-1 reviews is an owner decision (P0-02). It would only swap the persistence driver, with no change to screens, ports or domain.

## Removal trigger

`apps/api` persistence serves every port. Or the owner authorises TE-6, which supersedes this ADR's option choice.

## Evidence

- `v2/docs/v46/audit/Appendix-D-Architecture.md` §3.1–§3.6 (options, mechanics, seed, determinism, clock, reset) and §2.6 (TE-6).
- `v2/docs/v46/audit/OWNER-REVIEW.md` §6; `v2/docs/v46/audit/Appendix-G-Owner-Decisions.md` P0-02, DV-7, HB-21.
- Boards B1-06 and B1-07 (browser-session selection and ticket), B8-06 "Mock services".
- `1b090c9:v2/docs/FUNCTIONAL_PARITY_MATRIX.md` §G.
