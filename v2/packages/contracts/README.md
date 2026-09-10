# @xr/contracts

Zod schemas for API request and response payloads, with their inferred TypeScript types.

**OpenAPI is the language-neutral external contract.** These schemas feed the OpenAPI document
(`toOpenApiSchema`) and give TypeScript clients typed helpers; a Unity, Android or Swift client
codes against `/api/docs-json`, never against this package (`docs/ARCHITECTURE.md` §3).

Phase 0 contents: API path constants, the health response, the RFC 9457 problem-details
envelope, and a **draft** of the runtime-event ingestion payload transcribed from
`RUNTIME_INTEGRATION_CONTRACT.md` §4 — no endpoint serves it yet.
