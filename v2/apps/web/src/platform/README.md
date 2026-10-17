# Platform: composition root, session and test hooks (WP-0.12)

How the web app reaches its data (Appendix F §3.2, §4.6, §7.2; Appendix D §1.2, §1.5, §2.3–§2.6;
ADR-0002, ADR-0003, ADR-0004, ADR-0007). Screens never import this folder: they read through
`@/queries/*` (import fences, Appendix F §3.8).

| Module                  | What it holds                                                                                                                                                                                                       |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `composition.ts`        | Selects the adapter from `NEXT_PUBLIC_XR_DATA_SOURCE` (`sample`; `api` is refused — no HTTP adapter yet, and never answered by the sample world) and the query defaults. The only importer of `@xr/sample-platform` |
| `runtime.ts`            | The tab's platform: one world, one QueryClient, one session store, booted once per page (module state, so re-renders, Strict Mode, remounts and client-side navigation reuse it). Nothing exists on the server      |
| `session-store.ts`      | The tab's session in memory (person id, nonce, sign-in time), `useSyncExternalStore`-shaped. Every identity change clears the whole query cache, then publishes the new session key. No storage, no expiry          |
| `platform-provider.tsx` | `PlatformProvider` (boots and supplies the runtime and the QueryClient), `usePlatform`, `useSession`                                                                                                                |
| `link.tsx`              | `next/link` injected into the `@xr/ui` `LinkProvider`                                                                                                                                                               |
| `test-hooks.ts`         | The empty stub every product build compiles in place of the bridge                                                                                                                                                  |
| `test-hook-bridge.ts`   | The CI-only bridge (boot descriptor, `actAs`, `inspect`); the only importer of `@xr/sample-platform/testing`                                                                                                        |
| `test-hook-contract.ts` | The types the stub and the bridge share                                                                                                                                                                             |

## Query layer (`src/queries/`)

- **Keys** `['xr', sessionKey, family, view, params]`; `sessionKey` is `person:<id>#<nonce>` or
  `public:<browser-session-id>`. Every read is declared once with `defineQuery` and its
  `meta.deps` (record kinds), and run with `useXrQuery`.
- **One invalidation function** (`invalidation.ts`): a receipt's `changed` kinds invalidate exactly
  the queries whose deps include one of them. No per-command lists.
- **`useCommand(ports => ports.<port>.<method>)`**: refusals are values, only `unavailable` throws;
  one client-minted command id per run, sent once while busy; no optimistic writes; busy until the
  receipt's dependent queries have refetched. Sign-in and sign-out are commands too: the session
  port the app sees adopts their answers, so the cache is always cleared.
- Sample-mode defaults: `staleTime: Infinity`, no refetch on focus or reconnect, no retries, no
  network wait.

## World lifetime (ADR-0004 option A)

One world per tab, shared by everyone signed in there: signing out and in as another person keeps
it. A reload — or any navigation that loads a new document — rebuilds it from the seed, signed
out. Next.js performs a document load for a client-side navigation whose server answer is not OK,
so a link to an address that answers 404 restarts the world too: product links must target built
screens only (ADR-0005 link-target ledger, `src/nav/link-targets.ts`). Since WP-0.13 every
workspace address answers 200 (an unknown one renders the in-shell not-found in the browser), and
since Package 1A `/sign-in` does too, so only the unbuilt public addresses load a new document.

Phase 7 (owner authorisation, 17 Oct 2026; a local prototype build only): TE-6 keeps the world as a
versioned `localStorage` snapshot shared by the browser's tabs (`@xr/sample-platform`
`persistence/snapshot.ts`; the runtime injects the storage and Web Locks and adopts another tab's
save on the `storage` event), so a reload or a full navigation keeps the world — signed out, with
no session, receipt or request ticket saved. `/prototype/reset` ("Reset demo data") starts every tab
again. TE-3's sample WEB activity (`/prototype/web-activity`) reports to the tab that launched it
over a `BroadcastChannel` (`sample-web-relay.ts`). A test-hook build keeps neither.

## Test hooks (CI/Playwright builds only)

`next.config.ts` aliases `@/platform/test-hooks` to the empty stub unless the build is made with
the test-hook flag (`pnpm --filter @xr/web build:test-hooks`, output `.next-test-hooks`, served on
port 3200 by the Playwright config). Then it resolves the bridge, which reads the boot descriptor
installed by `bootWorld` (fixture world + signed-in person, without the sign-in form)
and exposes `actAs` and `inspect` (the world's identity, the session, and the session keys of the
cached answers) to `e2e/support`. `pnpm verify` proves the product build holds
none of the bridge's names or code and that the test build does (positive control). No hosted
build — owner and reviewer builds included — is made with the flag.

### Same-tab identity switch (WP-0.14, CI/Playwright builds only)

`switchSession(personId)` on the bridge handle (Playwright: `switchIdentity(page, person)`) signs the
tab's own session in as another sample person through the product's session port —
`SessionService.signIn` with that person's sample e-mail and a non-empty password (AD-03 interim) —
so the sign-in policy applies (an inactive Faculty member is refused, SES-09), and the session store
adopts the answer as it adopts every sign-in: the whole query cache is cleared, a new session key
is published, and the shell re-renders from the person's stored role. The world, the QueryClient
and the document are the same; `inspect()` reports the tab's world `instance` so tests can prove
it. It stands in for typing on XS-01 (built in Package 1A; `e2e/support/sign-in.ts` drives the card itself): it chooses the person and decides nothing
else. No UI reaches it. `pnpm verify` requires its marker (`xr-web-test-session-switch`) and
`switchSession` in the test-hook build and in no product bundle.

The request seams (Phase-1 Package 1C; ADR-0007 amendment) are non-human writers of the tab's own
world, never product controls: `startReview(reference)` records the AD-14 review-start fact;
`planPayment(outcome)` sets what the TE-4 sample provider reports for the next payment the page
starts (`pending`, `failed`, `confirmed`); `reportPayment(reference, outcome)` is the provider's
later report. They name a request by its reference only, and their writes invalidate the page's
reads like `actAs` receipts (Playwright: `startReview`, `planPayment`, `reportPayment` in
`e2e/support/act-as.ts`). `pnpm verify` requires their marker (`xr-web-test-request-seams`) in the
test-hook build and in no product bundle.
