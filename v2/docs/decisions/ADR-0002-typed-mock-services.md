# ADR-0002 — Typed frontend mock services and one connected data layer

|                        |                                                                                                                                                                                        |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**             | Accepted                                                                                                                                                                               |
| **Date**               | 12 Oct 2026                                                                                                                                                                            |
| **Exception recorded** | TE-2 (`OPEN_DECISIONS.md` Part E) against `ARCHITECTURE.md` §3/§4 and §14                                                                                                              |
| **Audit ids**          | TE-2, AD-01, AD-02, gate G-2, register A4 (a)                                                                                                                                          |
| **Implemented in**     | WP-0.9 (domain), WP-0.10 (ports), WP-0.11 (mock adapter), WP-0.12 (composition root and queries)                                                                                       |
| **Owner sign-off**     | **Approved 12 Oct 2026 — G-2:** "Typed frontend mock services." "One connected frontend service/data layer." "No real authentication, payment processing or XR runtime is authorised." |

## Context

Owner binding constraint BC10 puts real authentication, payment processing, XR runtimes, grading automation and backend persistence out of scope. The build uses typed mock services that return the sample world. BC14 requires one connected application state for every shared record, so that a decision in one role's screen is what every other role sees.

The committed architecture forbids this without a recorded exception:

- `ARCHITECTURE.md` §3: "no business rule in `apps/web`".
- §4: "entitlement derivation, licence arithmetic, authorization decisions" are not web responsibilities.
- §14: "no scenario selector, no demo clock, no stand-in controls in V2".

The committed boundary matrix (`1b090c9:v2/packages/config/eslint/boundary-matrix.mjs`) allows:

- `@xr/domain: []`, with `zod` forbidden;
- `@xr/contracts: [@xr/domain, @xr/validation]`;
- `@xr/web: [@xr/config, @xr/contracts, @xr/domain, @xr/ui, @xr/validation]`.

## Decision

1. **Rules stay in `@xr/domain`**: record types, status unions, transition tables, per-command decision functions, policies and invariants. It remains zero-dependency and zod-free, as the matrix requires.
2. **Service ports and DTOs go in `@xr/contracts` under a new `./draft` subpath export** (AD-02). There is one TypeScript interface per port, zod schemas for view models and command inputs, and a framework-free contract suite. Like `runtime-events.ts` they are marked draft and stay out of `WIRE_CONTRACTS`. Ports live here because `@xr/domain` cannot hold zod, and because no package may depend on `apps/web`.
3. **The mock adapter is a new workspace package `@xr/sample-platform`** (AD-01). It holds the in-memory sample world, the command pipeline, the seed, the stand-in system writers and the test fixtures. It may depend only on `@xr/contracts`, `@xr/domain` and `@xr/validation`, and it forbids framework-server, framework-web and data-layer packages.
   - The boundary-matrix row, the `WorkspacePackage` union, tsconfig and ESLint edits are made in the implementing work package, enforced by `boundaries.test.ts`.
   - The cheaper alternative, `apps/web/src/sample/` behind an import fence, is recorded as rejected: it would leave rules inside `apps/web` as a standing exception.
4. **One connected data layer.** One sample world serves every role. Every write goes through one pipeline: resolve the actor, then policy, validation, a pure decision, apply, check invariants, commit and publish `{worldVersion, changed}`. Then one TanStack Query invalidation predicate refreshes every query that depends on a changed record kind.
5. **Only the composition root (`apps/web/src/platform/composition.ts`) imports `@xr/sample-platform`.** Screens receive ports through a provider. They render the `availableActions` a port returns and decide nothing themselves.
6. **Stand-in system writers have no UI.** These are the clock, payment outcome, runtime report, routing policy, licence-wait oracle and overlap policy. They are driven only by the seed and by CI tests (ADR-0007). Nothing in the product lets a person drive a system transition.

## Consequences

- The same ports are later served by an HTTP adapter over `apps/api`. The contract suite runs against both adapters, so moving off mocks needs no screen rewrite.
- `@xr/sample-platform` can be deleted as one unit when the removal trigger fires.
- This ADR grants no permission and adds no workflow rule. Policies encode only the candidate matrix rows the owner has not left open. UNRESOLVED and OPEN rows are never offered, and undecided rules return `policy-open` (ADR-0008).
- "Draft with assistance" (FA-16) returns canned sample drafts, tagged for Faculty review, with no provider named (AD-41 stays open).

## Removal trigger

`apps/api` serves every port and the contract suite is green against the HTTP adapter (TE-2).

## Evidence

- `v2/docs/v46/audit/Appendix-D-Architecture.md` §1.1–§1.5 (layers, package placement, command pipeline, query layer) and §2.6 (TE-2).
- `v2/docs/v46/audit/Appendix-F-Phase0-Plan.md` §3.1, §3.6–§3.7, §4; `v2/docs/v46/audit/Appendix-G-Owner-Decisions.md` A4 (a).
- `v2/docs/v46/audit/Appendix-C-Schemas-and-Contracts.md` §3 (22 ports, 6 stand-ins).
- `design/handoff-v46/START-HERE.md` binding constraints 10 and 14; board B8-06 "Mock services".
- `1b090c9:v2/docs/ARCHITECTURE.md` §3, §4, §14; `1b090c9:v2/packages/config/eslint/boundary-matrix.mjs`.
