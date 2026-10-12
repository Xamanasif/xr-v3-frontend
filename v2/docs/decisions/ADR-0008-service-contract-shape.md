# ADR-0008 — Typed service-contract boundaries

|                    |                                                                                                                                                           |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**         | Accepted — engineering decision under the owner-approved Phase-0 plan                                                                                     |
| **Date**           | 12 Oct 2026                                                                                                                                               |
| **Audit ids**      | X-1, X-2, X-7, X-9                                                                                                                                        |
| **Implemented in** | WP-0.9 (record kinds), WP-0.10 (ports, DTOs, contract suite)                                                                                              |
| **Owner sign-off** | Supports G-2 "one connected frontend service/data layer" (approved 12 Oct 2026). **Owner acknowledgement of this ADR is requested at the WP-0.2 review.** |

## Context

The handoff has no field-level schemas and no service contracts. The audit's parallel deliverables disagreed on four contract points (`v2/docs/v46/audit/Appendix-F-Phase0-Plan.md` §0.2):

- **X-1, the port set:** 18 ports in the architecture against 22 product ports plus 6 stand-ins in the schemas.
- **X-2, the result and error shape:** a `Refusal` union against a `ServiceError` union.
- **X-7, who writes completion.**
- **X-9, the record-kind names:** FCM/COMP against FMAP and no COMP.

One connected data layer (ADR-0002) needs one contract.

## Decision

1. **Port set (X-1).** The schemas set is the contract: **22 product ports with 183 methods**, plus **6 test/seed-only stand-in ports** (`ClockPort`, `PaymentOutcomePort`, `RuntimeReportPort`, `WorkflowRoutingPolicy`, `LicenceAvailabilityOracle`, `OverlapGrantPolicy`) with 8 methods. The architecture's names are aliases (identity = `SessionService`; runtime ingestion = `RuntimeReportPort`). Ports live in `@xr/contracts/draft`, and a method ledger assigns each method to the phase that builds its screen. Ports grow by **addition only**, each new method with contract-suite cases.
2. **One result type and one error union (X-2).** Every command returns `Result<T, ServiceError>`: either `{ ok: true, value, changed: RecordRef[] }` or `{ ok: false, error }`. A refusal writes nothing. `ServiceError` has these kinds:
   - `not-signed-in`
   - `not-permitted` (wrong workspace · out of scope · not own record)
   - `not-found`
   - `invalid-state`
   - `refused` (drawn refusal codes with drawn copy)
   - `validation-failed` (field errors plus an error-summary title)
   - `stale-version`
   - `conflict`
   - **`policy-open`** (an undecided rule was reached; it names the decision, for example `OD-B2-01`)
   - `unavailable`

   "Read-only" and "not available" are view-model modes plus `refused` codes, not separate errors. Callers never pass their own role: the actor is resolved from the session and the records.

3. **HTTP mapping for the later adapter** (RFC 9457, `1b090c9:v2/packages/contracts/src/problem.ts`):

   | `ServiceError` kind                                                    | HTTP status                         |
   | ---------------------------------------------------------------------- | ----------------------------------- |
   | `not-signed-in`                                                        | 401                                 |
   | `not-permitted`                                                        | 403                                 |
   | `not-found`                                                            | 404                                 |
   | `invalid-state`, `refused`, `conflict`, `stale-version`, `policy-open` | 409, each with a typed `type` URI   |
   | `validation-failed`                                                    | 422, with `errors[{path, message}]` |
   | `unavailable`                                                          | 503                                 |

4. **Completion writer (X-7).** One record kind, `COMP` (`FormatCompletion`), written only by the system completion handler (ADR-0006).
5. **One `RecordKind` union in `@xr/domain` (X-9).** It uses board naming (`FMAP` for the Faculty-course mapping, B2-09 "FMAP-0021"; matrix rows keyed `FCM` refer to it), and `COMP` is a separate kind. Query invalidation uses the record kinds in `changed`.
6. **Validation.** zod lives only in `@xr/validation` and `@xr/contracts/draft`; `@xr/domain` stays zod-free. Forms use React Hook Form with the same schemas. Every drawn message is held once in a copy catalogue keyed by rule, and status words come from state × viewer-role copy tables, not from `entities.json`.
7. **Undecided product rules are typed, not defaulted.** A policy whose answer is open has no default. Reaching it returns `policy-open`, and its actions are never offered.

## Consequences

- One framework-free contract suite runs against the mock now and the HTTP adapter later.
- The UI maps each error kind to a drawn state: `not-permitted` → XS-06 or the action is absent; `not-found` → the board-08 pattern; `unavailable` → the drawn "failed, try again" state with nothing lost; `validation-failed` → the error summary takes focus and links to the fields.
- Stale and concurrent changes render the record's current drawn state. Any extra explanation needs owner approval (AD-20, open).

## Removal trigger

`apps/api` begins serving ports (DTOs become wire contracts and must pass `assertRepresentable`), or an owner decision changes a record's lifecycle.

## Evidence

- `v2/docs/v46/audit/Appendix-C-Schemas-and-Contracts.md` §1 (branded ids, labels, provided values), §3 (22 ports, 6 stand-ins, error model), §5 (validation).
- `v2/docs/v46/audit/Appendix-D-Architecture.md` §4.1, §7.1–§7.3.
- `v2/docs/v46/audit/Appendix-F-Phase0-Plan.md` §0.2 (X-1, X-2, X-7, X-9), §4.1, §6.1–§6.7.
- `1b090c9:v2/packages/contracts/src/problem.ts`, `1b090c9:v2/packages/config/eslint/boundary-matrix.mjs`.
