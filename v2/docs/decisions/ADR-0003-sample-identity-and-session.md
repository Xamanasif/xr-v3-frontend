# ADR-0003 — Controlled sample identity and session

|                        |                                                                                                                                                                                                                              |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**             | Accepted                                                                                                                                                                                                                     |
| **Date**               | 12 Oct 2026                                                                                                                                                                                                                  |
| **Exception recorded** | TE-1 (`OPEN_DECISIONS.md` Part E) against `ARCHITECTURE.md` §10 ("No authentication is implemented and none is faked")                                                                                                       |
| **Audit ids**          | TE-1, AD-03, AD-29, gate G-2, gate G-8, register A4 (c), A7                                                                                                                                                                  |
| **Implemented in**     | WP-0.12 (session store), WP-0.13 (guards); the XS-01 sign-in form in Phase 1                                                                                                                                                 |
| **Owner sign-off**     | **Approved 12 Oct 2026 — G-2:** "Controlled sample identity." **G-8:** "Keep approved sign-in implementation in Phase 1. Phase 0 uses the authorized test-only access mechanism, never a developer-facing account switcher." |

## Context

The v46 boards draw a real-looking sign-in (XS-01, B1-09), an account menu (XS-05, boards 05/06), sign-out and session-expiry notices on the sign-in card (XS-03), paused and inactive banners (XS-08), and "Not your workspace" for another role's address (XS-06, board 08).

Real authentication is out of scope (BC10). The identity provider (A-01) and the web session strategy (E-02) are open. Phase 0 still needs a session, because the role shells, the account menu, Help & support and the workspace guard depend on who is signed in.

The owner forbids a developer-only account selector and a generic DEMO banner. That outranks board B8-03's note that "the developer switcher stays outside the product" (register HB-20).

## Decision

1. **A session port over sample-world people.** A session stores only the signed-in person's id (plus a nonce and the sign-in time). Role, institution and scope are resolved from the sample world's records, never from the client. There are no tokens and no secrets.
2. **One role per signed-in person** (P0-10; XS-02 "choose workspace" is not designed). Another role's workspace address renders XS-06 "Not your workspace" in place, inside the person's own shell (board 08; ADR-0005).
3. **Phase 0 (G-8): no product sign-in screen.** Tests reach the shells through a **CI-only boot descriptor** read by the test-hook bridge (ADR-0007). It is compiled out of every non-CI build.
4. **Phase 1: the designed XS-01 form** signs in against sample-world accounts with the drawn states ("Wrong details", inactive, paused). The exact sample credential rule (audit interim: a typed sample e-mail plus any non-empty password) is confirmed with the TE-1 details before Phase 1 (register P1-01). No credential value appears in product copy.
5. **Never, anywhere,** in product UI or developer tooling: an account or role switcher, a sample-account chooser, a "Viewing as" control or a DEMO banner. A reviewer moves between roles only by signing out and signing in as another sample person.
6. Sign-out clears the session and the query cache. Under ADR-0004 option A the sample world itself is kept until the tab reloads.

## Consequences

- The workspace guard and the record guards can be built and tested in Phase 0 without inventing a login UI.
- A person cannot walk a Phase-0 build through the UI. Phase-0 builds are engineering builds, reviewed through CI captures (G-8).
- Tests may never use a UI to choose an identity. Static scans fail on "DEMO", "Viewing as", a sample-account list or a workspace chooser in product code.
- `ARCHITECTURE.md` §10 stays true for production. TE-1 applies only to sample mode.

## Removal trigger

The identity provider is decided (T-10 / A-01) and the OIDC relying party is built (E-02).

## Evidence

- `v2/docs/v46/audit/Appendix-D-Architecture.md` §2.1–§2.6 (session port, sign-in mapped to B1-09, storage and moving between roles, test identity, TE-1).
- `v2/docs/v46/audit/Appendix-F-Phase0-Plan.md` §7.2 (CI-only boot descriptor); `v2/docs/v46/audit/Appendix-G-Owner-Decisions.md` A4 (c), A7, HB-20, P0-10, P1-01.
- Boards: B1-09 (XS-01/03/04), 05 and 06 (XS-05), 08 (XS-06), B7-04 (XS-08), B8-03.
- `1b090c9:v2/docs/ARCHITECTURE.md` §10.
