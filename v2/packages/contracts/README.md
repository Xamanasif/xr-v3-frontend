# @xr/contracts

Zod schemas for API request and response payloads, with their inferred TypeScript types.

**OpenAPI is the language-neutral external contract.** These schemas feed the OpenAPI document
(`toOpenApiSchema`) and give TypeScript clients typed helpers; a Unity, Android or Swift client
codes against `/api/docs-json`, never against this package (`docs/ARCHITECTURE.md` §3).

Phase 0 contents: API path constants, the health response, the RFC 9457 problem-details
envelope, and a **draft** of the runtime-event ingestion payload transcribed from
`RUNTIME_INTEGRATION_CONTRACT.md` §4 — no endpoint serves it yet.

## The draft service contracts of the v46 frontend (`./draft`, WP-0.10)

The frontend's typed service contracts (ADR-0008, acknowledged 13 Oct 2026 as the provisional
contract architecture). **Draft** means: not in `WIRE_CONTRACTS`, not published as OpenAPI,
served by no endpoint. They depend only on `@xr/domain` (the authority for every record shape,
vocabulary and rule) and `@xr/validation`.

| Entry point                          | Holds                                                                                                                                                                                                                                          | Who may import it                                             |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `@xr/contracts/draft`                | The 22 product ports (183 methods) and their zod DTO schemas; `Result` / `ServiceError` (10 kinds); the copy catalogue keys; the refusal registry; the ProblemDetails mapping (a definition only); the method ledger; the provisional register | Adapters; screens import **types only** (Appendix F §3.8)     |
| `@xr/contracts/draft/standins`       | The six test- and seed-only stand-in ports (8 methods, Appendix C §3.18)                                                                                                                                                                       | Seed loaders and test harnesses only (fenced out of apps/web) |
| `@xr/contracts/draft/contract-suite` | `runContractSuite(factory)`: framework-free cases for the mock now and the HTTP adapter later                                                                                                                                                  | Tests only (fenced out of apps/web; a bundle sentinel)        |

How the contracts stay faithful:

- **Schemas ↔ domain.** Every record schema is `typedAs` its `@xr/domain` type and every list a
  `vocabulary` of its domain union: a drift fails the build. Input schemas are the ACCEPTED forms
  (they trim and parse, and never choose for the person); they report catalogue **keys**, and the
  words come from the catalogue, each checked verbatim against its frozen board.
- **Ledger ↔ ports.** Each method's entry (input, output, error kinds, refusal codes) is checked
  against its signature at compile time; `ledger.test.ts` checks the 183 methods against Appendix
  C §3, the Phase-0 set against Appendix F §4.1, and every calling screen against B8-06.
- **Undecided rules stay open.** A method that can reach an open decision declares `policy-open`
  with the decision id; read models carry the open decision as a value. Nothing defaults to allow
  or deny. `provisional.ts` lists every field, code or rule that is not an owner-approved
  requirement, with its trace and how to reverse it.
- **No false passes.** A suite case the adapter cannot run yet (no world, a later-phase method, a
  missing seam) reports `not-run`. The world-dependent proofs are WP-0.11 obligations
  (`DEFERRED_OBLIGATIONS`).
