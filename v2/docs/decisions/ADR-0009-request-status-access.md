# ADR-0009 — Request status access: an opaque address, and tickets held by the browser session

|                    |                                                                                                                                                                                                                                                                                                                                          |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**         | Accepted (engineering), within the owner decision below; acknowledgement requested for the two implementation readings marked **(reading)**                                                                                                                                                                                              |
| **Date**           | 14 Oct 2026                                                                                                                                                                                                                                                                                                                              |
| **Audit ids**      | DV-5, O-05 (P1-02), T-01 / R01, V-17, REQ-04, REQ-05, REQ-07, REQ-28, AD-07 (ADR-0004)                                                                                                                                                                                                                                                   |
| **Implemented in** | Phase-1 Package 1C (`docs/phase-1/PACKAGE-1C-RECORD.md`)                                                                                                                                                                                                                                                                                 |
| **Owner sign-off** | **14 Oct 2026 (Package-1C authorisation, DV-5 / P1-02 O-05):** `/requests/[requestId]`; the status and payment pages open only for the submitting browser session using its authorised session-held ticket, or the authenticated Institute Admin authorised for that institution. "The request reference alone must never grant access." |

## Context

B1-08 says the request status page "shows private details (institution, contact person, history)" and that how the requester is identified before seeing it is open (T-01 / R01): "The reference number identifies the request — it does not open the page on its own. No reference lookup, OTP, magic link or account registration is designed." B1-07 says Check request status "continues from this session". Appendix D V-17: no URL may work as a bearer link.

ADR-0004 (option A) builds a new world from the deterministic seed at every page load: the same ids — and the same status tokens — are minted again in each world.

## Decision

1. **Three different values.** A request has a reference (`REQ-0042`: identifies it, quoted to people), an opaque route id (`rq-0011`: names its pages, `/requests/[requestId]` and `/payment`, opens nothing) and a status token (the ticket: never in an address, never answered by any port). `submitPublicRequest` answers the reference and the route id; the ticket goes straight into the sending browser session. The Super Admin's decision page and every decision receipt carry the request without it (`requestForDecision`, PC-34).
2. **Who may read or pay — decided by the service, never by hiding links.** `getRequestStatus` and `startPayment` take the route id and answer:
   - the browser session holding the request's ticket for the user session it is asking in (REQ-04, REQ-07), or
   - the signed-in Institute Admin of the requesting institution (REQ-28; `canSee` on the request);
   - anyone else — another browser or tab, a reloaded tab, a cold visit, another person signed in to the same tab, another role or institution — exactly as an address that names nothing: `not-found`, for a read (REQ-05; the owner's not-found treatment) and a payment alike, so no one learns even that a request exists at an address. Nothing is written by a refusal.
3. **The pages show the public not-found page** (PU-15, its words, title and links), without reading or rendering any detail of the request.
4. **Tickets live in the browser session's `sessionStorage`** (`xr.request-tickets.v2`; ADR-0004 decision 2 already lists the request-status ticket as one of the two board-drawn session items). Each entry names:
   - **the world that issued it** — a random name per page load (`newWorldInstance()`): a ticket of an earlier world has expired and is dropped when the browser session starts, so a reload's new world, which mints the same token again, never honours it;
   - **(reading) the user session that sent the request** — `visitor` (signed out) or `sign-in:<nonce>` (one sign-in): a person who signs in to the tab holds none of the visitor's tickets, and signing out gives the tab's visitor its own back. This reads "the submitting browser session" together with "no sensitive data across user-session changes".
     Entries read back from storage are checked one by one; anything malformed or foreign is left out.
5. **(reading) The pages render on the client** like the Package-1B public pages (TE-8 mechanism): every `/requests/…` address answers HTTP 200 and the server HTML holds nothing of any request; an unknown or unauthorised request shows the not-found page from the client.

## Consequences

- No address, reference or copied value opens a request: tested with the reference, the token and a forged route as addresses, a planted copy of the ticket in another tab, a tab opened from the sending one (which copies its session storage but starts its own world), a reload, another person signed in to the tab, another institution's Institute Admin (`e2e/package-1c/access.spec.ts`; `packages/sample-platform/src/handlers/access-request.test.ts`; contract cases `request-access:*`).
- In this prototype the requester can return to the status page only in the same tab, without reloading (ADR-0004 option A); the page is not reachable from any product link except PU-09's "Check request status".
- A requester who later becomes the institution's Institute Admin reads the request through the Institute Admin path.

## Open (not decided here)

- T-01 / R01: how a requester is identified beyond the browser session (account, link, OTP) — open.
- **(reading)** whether signing in should end the visitor's tickets instead of setting them aside (a one-line change in `browser-session.ts`).
- **(reading)** HTTP 404 for an unknown or unauthorised request needs a server-side reader (TE-8 removal trigger).

## Removal trigger

A requester identity decided under T-01 / R01 with a server-side session, behind the same `AccessRequestService` methods.

## Evidence

- Boards B1-07 ("continues from this session"), B1-08 ("Who can open this page"), B3-08 (the Institute Admin's requests).
- `v2/docs/v46/audit/Appendix-A-Routes.md` PU-10, PU-12; Appendix D V-17; Appendix G DV-5, O-05 (P1-02); Appendix B (policy matrix) REQ-04, REQ-05, REQ-07, REQ-28.
- `v2/packages/sample-platform/src/session/browser-session.ts`, `handlers/access-request.ts`, `pipeline/runner.ts` (`visitor()`).

## Amendment — browser-local ticket persistence in the local prototype build, owner decision 24 Oct 2026

|                 |                                                                                                                                                                                                                                                                                                                                    |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Status**      | Accepted — owner decision, 24 Oct 2026 (binding), P0 fix "external payment request recovery"                                                                                                                                                                                                                                       |
| **Audit ids**   | CB-1, F-01, G-1 (`XR-V3-E2E-Connections-Audit-2026-10-22`: `E2E-CONNECTION-MATRIX.md`; `appendix/B-access-entitlement.md` rows 5.5–5.8, 6.9–6.10)                                                                                                                                                                                  |
| **Applies to**  | The local prototype build only — sample data, `development` environment, the TE-6 browser snapshot (ADR-0004, Phase-7 amendment). Test-hook builds and every other build keep decision 4 above unchanged.                                                                                                                          |
| **Owner words** | "Recovery reaches the SAME BROWSER. The requester's own ticket is kept in this browser — beside, NEVER inside, the saved world snapshot; never in an address; bound to the world LINEAGE so a Reset … or a rejected/other-build save invalidates it." "Another browser or device cannot recover (production needs real accounts)." |

### Context — the defect (CB-1)

Since Phase 7 (TE-6) the local prototype build keeps the world in `localStorage`, but the ticket
stayed in the tab's `sessionStorage`, named after a per-page-load world (`newWorldInstance()`), and
the snapshot withholds every status token (`sanitised`); only a tab still holding its in-memory
world got its own tokens back (`adoptedWorld`). So once the requester reloaded the status page,
navigated away and back, or closed the tab, the page answered "We can't find that page" — while the
request was still Submitted as much as after the Super Admin's External approval. After an
External approval nobody could ever pay: the requester held no ticket, the Institute Admin cannot be
assigned before access is active (INST-05), and no one may mark a payment paid (BR-036). Reproduced
on the product build of `2762031`: the session ticket `[{ world: "world-…", token: "tok-0011",
holder: "visitor" }]` became `[]` on the reload and the status page showed PU-15.

### Decision

1. **Where the ticket is kept.** The signed-out visitor's ticket of a request sent in this browser
   is kept in its own `localStorage` value, `xr.request-tickets.kept`, next to `xr.sample-world` —
   never inside it. The snapshot is unchanged: every request's status token is still withheld on
   every save (so its format number did not change and earlier saves stay readable). The value is
   `{ format: 1, lineage, tickets: [{ request, routeId, createdAt, token }] }`: the world lineage it
   belongs to, and per request its reference, its address, its creation time and its token. No
   address ever carries the token; nothing else is kept (no session, sign-in name or password).
2. **Bound to the lineage.** A ticket opens nothing in another lineage. "Reset demo data" removes
   the value with the save (and a reset page load keeps nothing again); a save the build rejects —
   damaged, another format, another build — starts a clean world in a new lineage, and the old value
   is removed at that page load. A value of another lineage is never read and is replaced by the
   next ticket kept.
3. **Bound to one request — how a restored world gets the token back.** When a page load restores
   the saved world, and whenever a tab adopts a newer save of the lineage, the platform puts each
   kept token back on exactly the request it was issued for (`withKeptTokens`,
   `persistence/snapshot.ts`): the same reference, the same address and the same creation time —
   the identity `adoptedWorld` already uses for a tab's own requests — and only where the restored
   request still carries the withheld placeholder, so a token a tab holds is never replaced. A
   token goes to one request at most, never to a request whose token another request already has,
   and a withheld placeholder is never a ticket (in this value and in the session tickets alike: in
   a restored world every request carries one). The restored world is not written back on the way
   in; the token is withheld again on the next save. A tab that is already open takes up a ticket
   another tab of the browser kept on its next adoption or on the `storage` event of the value.
   Why this and not another way:
   - the token inside the snapshot (even as a hash) is what the owner excluded — and the sample
     tokens are deterministic (`tok-0011`), so a hash would hide nothing;
   - minting a new token on restore would need a random source the package does not draw, or a
     deterministic one anybody could guess — and the ticket would still have to name its request;
   - the deterministic seed mints the same reference, address and token again after a reset
     (REQ-0042, `rq-0011`, `tok-0011`): the lineage, not the request's identity, is what tells the
     two worlds apart, so both are required.
4. **Holders.** Only the signed-out visitor's tickets are kept (`visitor`). The visitor holds them in
   every page load of the lineage and in every tab of the browser. A person who signs in holds none
   of them (`sign-in:<nonce>` reads only its own); signing out gives the visitor its tickets back,
   as before. A request sent while a person is signed in stays that sign-in's ticket and is not
   kept: sessions are never saved (ADR-0003), a sign-in ends with the page, and a sign-in's name is
   not unique across page loads (the session counter starts again), so keeping it would hand it to
   whoever signs in first after a reload. That requester can still reach the request through the
   Institute Admin path once they are its institution's Institute Admin.
5. **Who may read or pay — unchanged.** The service read policy is untouched: `getRequestStatus` and
   `startPayment` answer the session holding the request's ticket (now also a kept one) or the
   requesting institution's signed-in Institute Admin; anyone else is `not-found`. The payer is the
   ticket holder or that Institute Admin; the Internal zero-price route, the separation of approval,
   payment confirmation (TE-4 stand-in only) and activation, and every transition stay as they are.
   No real payment is processed.
6. **PU-07 leads back.** Your selection shows a small quiet note — "You have a request in progress
   for <institution>." with "Check request status" to that request's status page — for each request
   still in progress (Submitted or Under review, Information requested, Approved — payment required,
   Payment not confirmed, Payment failed) whose ticket this browser session holds for the user
   session asking; nothing once access is active. It uses the existing v46 quiet notice and link
   (state-copy `PU-07.request-in-progress`; no redesign). It is read through one added method,
   `AccessRequestService.listRequestsInProgress()`, which lists only what the status page's read
   policy shows the visitor — the held tickets' requests, as address and institution name — and
   never looks anything up by reference or institution (`CONTRACT_ADDITIONS`,
   `PACKAGE_DELIVERIES`; provisional register PC-73; contract case `request-access:in-progress`).
   Appendix C is frozen and is not edited: the ledger records the addition beside it.

### Consequences

- In the local prototype build a reload, navigating away and back, or closing the tab and opening
  the site again in the same browser returns to the same request and its next step — the payment
  included. No duplicate request or institution is made: nothing is sent again.
- **Another browser or device cannot recover** — not even one holding a copy of the saved world.
  That needs a requester identity (T-01 / R01 stay open; production needs real accounts). The pages
  add no words for it; the state-copy register says it (`PU-10.same-browser`, `PU-10.not-found`).
- **The browser is the boundary.** Anyone using this browser profile counts as the requester, and a
  person who edits this browser's storage by hand could write a ticket for a request of the saved
  world — which sits in the same storage in plain JSON, so this gives that person nothing they do
  not already have. The same was true of the session tickets (their world name is readable). It is
  a local prototype, not a security boundary; the guards keep a malformed or placeholder value from
  reaching a rule.
- If the browser refuses the write (a full quota, a storage that refuses), the ticket is held for
  this page load only, as before.
- Decision 4 and the Consequences above stand for test-hook builds and every other build; in the
  local prototype build the requester is no longer limited to "the same tab, without reloading".
- Tests: `packages/sample-platform/src/kept-tickets.test.ts`, `snapshot.test.ts`,
  `handlers/access-request.test.ts`, the contract case `request-access:in-progress`;
  `apps/web/src/features/public/request.test.tsx`; product-build browser tests
  `e2e/phase-7/request-recovery.spec.ts` (a reload while Submitted; External approval → reload →
  payment → Access active; navigating away and back; a tab closed and reopened → PU-07 → status →
  payment; the Internal route; another browser; Reset; nobody else's request) and
  `e2e/phase-7/prototype.spec.ts` (the reload keeps the ticket beside the save, never in it).

### Removal trigger

Unchanged: a requester identity decided under T-01 / R01 with a server-side session behind the same
`AccessRequestService` methods; the kept value, `listRequestsInProgress` and PU-07's line then go.
