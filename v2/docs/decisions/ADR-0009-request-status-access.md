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
