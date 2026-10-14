# App routes, guards and the Phase-0 screens (WP-0.13)

The App Router tree of Phase 0 — exactly Appendix F §3.3 — and the guards and foundation screens
it renders (ADR-0003, ADR-0004, ADR-0005, ADR-0007; boards 05, 06, 07, 08, 10, 11, 12). Route files
only resolve params and render a feature (import fences, Appendix F §3.8); the screens live in
`src/features/shared/`, the route data in `src/nav/`.

## The tree

| Path                                 | File(s)                                                   | Shows                                                             |
| ------------------------------------ | --------------------------------------------------------- | ----------------------------------------------------------------- |
| every address outside the workspaces | `not-found.tsx` (root)                                    | PU-15 public variant, HTTP 404                                    |
| `/<base>` × 7                        | `<base>/layout.tsx`                                       | SessionGate → WorkspaceFrame (session-role shell; XS-06 in place) |
| `/<base>`                            | `<base>/page.tsx`                                         | interim landing → `/<base>/help` (ADR-0005 §8), after the guard   |
| `/<base>/help`                       | `<base>/help/page.tsx`                                    | XS-07 My reports                                                  |
| `/<base>/help/report`                | `<base>/help/report/page.tsx`                             | XS-07 Report a problem, then Report sent in place                 |
| `/<base>/help/reports/[reportId]`    | `<base>/help/reports/[reportId]/page.tsx`                 | XS-07 report detail (record guard)                                |
| `/<base>/help/reports`               | `next.config.ts` `redirects()`                            | → `/<base>/help` (Appendix A §3.7 row 20), 307                    |
| any other `/<base>/…`                | `<base>/[...unmatched]/page.tsx` + `<base>/not-found.tsx` | PU-15 workspace variant in the shell                              |
| `/healthz`                           | `healthz/route.ts`                                        | liveness (kept, O-10)                                             |

`<base>` is each of `student`, `faculty`, `institute`, `vendor`, `reviewer`, `content-manager`,
`admin` — seven static folders, no dynamic `[workspace]` root segment (D-12) and no `proxy.ts` in
sample mode (X-3). `_workspace/workspace-route.tsx` is the one route-level module that reads
Next.js navigation (address, query, router, `notFound`) and hands it to the features through
`@/nav/navigation`. `src/nav/routes.ts` is the manifest; `routes.test.ts` fails if a page or route
file outside it exists, and the built-screen manifest (`BUILT_SCREENS`) is generated from it.

**Phase-1 Package 1A** adds, by the same rules:

| Path                          | File(s)                                        | Shows                                                              |
| ----------------------------- | ---------------------------------------------- | ------------------------------------------------------------------ |
| `/sign-in`                    | `(auth)/layout.tsx`, `(auth)/sign-in/page.tsx` | XS-01 (+ XS-03 via `?reason=signed-out\|expired&returnTo=`, XS-04) |
| `/signed-out`                 | `next.config.ts` `redirects()`                 | → `/sign-in?reason=signed-out` (Appendix A §3.7 row 21), 307       |
| `/admin/requests`             | `admin/requests/page.tsx`                      | SA-02 Requests (B1-10)                                             |
| `/admin/requests/[requestId]` | `admin/requests/[requestId]/page.tsx`          | SA-03 Request decision (B1-11)                                     |

`_auth/sign-in-route.tsx` reads Next.js navigation for the sign-in page as `_workspace/` does for
the workspaces.

**Phase-1 Package 1B** adds the public surface (TE-8: rendered in the browser from the tab's one
sample world), by the same rules:

| Path                          | File(s)                                             | Shows                                                            |
| ----------------------------- | --------------------------------------------------- | ---------------------------------------------------------------- |
| every public page             | `(public)/layout.tsx`, `_public/public-route.tsx`   | PublicFrame: skip link, header + menu sheet, `main#main`, footer |
| `/`                           | `(public)/page.tsx`                                 | PU-01 Landing, with PU-14 at `#for-institutions` (B1-01, B1-02)  |
| `/areas`                      | `(public)/areas/page.tsx`                           | PU-02 All engineering areas (B1-03)                              |
| `/areas/[areaId]`             | `(public)/areas/[areaId]/page.tsx`                  | PU-03 Engineering area; unknown or hidden → B1-03's message      |
| `/courses/[courseId]`         | `(public)/courses/[courseId]/page.tsx`              | PU-05 Course (keyed by the course id, D-13)                      |
| `/courses`                    | `next.config.ts` `redirects()`                      | → `/areas` (Appendix A §3.7 row 1), 307                          |
| `/experiments`                | `(public)/experiments/page.tsx`                     | PU-04 Catalogue, `?area=&course=&format=&q=&sort=&view=`         |
| `/experiments/[experimentId]` | `(public)/experiments/[experimentId]/page.tsx`      | PU-06 Experiment (`?format=` from a one-format catalogue)        |
| any other address             | `not-found.tsx` (root) → `_public/public-route.tsx` | PU-15 public variant, HTTP 404, now inside the public frame      |

`_public/public-route.tsx` is the public pages' one module that reads Next.js navigation; its
`replace` mirrors a page's view into the address with `history.replaceState` (no history entry, no
scroll, no request: the catalogue keeps its state while filters change). Entity not-found states
(an unknown area, course or experiment) are drawn in place by the page, as the boards draw them,
with HTTP 200 — a client-rendered page cannot know the record on the server (TE-8 limitation).
Still not built: the Selection and request pages (PU-07 … PU-13, Package 1C) and the role homes;
every drawn way into PU-07 is not rendered (P0-35).

## Guards

- **SessionGate** (`features/shared/session-gate`). The tab's session is in memory (ADR-0004), so
  the gate is a client component reading the session store with `useSyncExternalStore` (server
  snapshot `unknown`). Unknown: the loading state ("Loading …", board 04/12). Signed out:
  `router.replace('/sign-in?returnTo=<the address asked for>')`; after "Sign out",
  `/sign-in?reason=signed-out` (XS-03 "Signed out"). Both are the XS-01 card since Package 1A — a
  client-side move, so the tab's world is kept. Since Package 1B the public PU-15's "Browse
  experiments" opens the built catalogue in the same document; no product link loads a new one.
- **`returnTo`** (`nav/return-to.ts`): honoured only as a same-origin relative path inside the
  signed-in role's own base, else the role home (AD-21; acceptance 6). XS-01 applies it after
  every sign-in (Package 1A).
- **WorkspaceFrame** (`features/shared/workspace-frame`). The shell is chosen by the session role
  (`SessionService.getSession`); whether the workspace is the person's own is the port's answer
  (`SessionService.checkWorkspace`). On another role's workspace the person's own shell renders
  **XS-06 in place of the page**: the address is kept, nothing in the sidebar is current, "Back to
  Home" and Help are their own, and the requested page is never rendered (all 42 pairs tested in
  jsdom and in the browser at four widths).
- **RecordGuard** (`features/shared/record-guard`): renders a record page from the service's
  answer — loading, failed (Try again), the record, or the drawn treatment of a refusal. Phase 0
  wires the XS-07 detail, where every refusal is the in-shell not-found (another person's report is
  never revealed). Later guards map their refusals to their drawn states (ST-19 …).
- **Unknown and unbuilt addresses**: `[...unmatched]` calls `notFound()` → the workspace's
  `not-found.tsx` renders PU-15 inside the shell (nothing current). The root `not-found.tsx` is the
  public PU-15.

## Shell facts, titles, focus

- Pages register their top-bar facts (screen, title, crumbs) with `useShellPage`; the persistent
  shell in the layout picks them up before paint (a layout effect). Pages render their own width
  (`PageContent`), so a page that changes width in place (Report a problem → Report sent) keeps its
  state.
- The browser tab's title is a React `<title>` ("Help & support · XR Learning Platform"); the root
  layout sets no metadata title, which, committed after hydration, would replace it.
- After a client-side navigation focus moves to `main#main` (the skip link's target), without
  scrolling; also when a link to the page already shown is chosen (the drawer and the account menu
  hide the chosen link). A document load moves nothing — the skip link stays the first Tab stop.

## App Router spikes (WP-0.13, Next.js 16.3.4, React 19.3, Chromium)

| Spike                                           | Result                                                                                                                                                                                                                                                                                                                           | Used as                                                                                                           |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| S1 · client-side `notFound()`                   | A client component that calls `notFound()` while rendering, after its data loads, renders the segment's `not-found.tsx` inside the persistent layout: layout state kept, same document, URL kept; leaving resets the boundary. A direct load answers **HTTP 200** (the status line went first).                                  | Adopted (no MessagePage fallback needed); 200 recorded as a limitation                                            |
| S1b · server `notFound()` under a client layout | `[...unmatched]`'s server `notFound()` beneath a layout that withholds its children until the tab's session is known also answers **200**, and the error travels in the RSC payload; a client navigation there stays in the same document. Root unknown addresses answer 404, and a client navigation to one is a document load. | In-shell PU-15 = 200 (limitation); product links never target the 404 public addresses (one documented dead link) |
| S2 · `useSyncExternalStore` session             | The server snapshot (`unknown`) is in the server HTML; hydration uses it with no mismatch warning; the client snapshot follows the boot.                                                                                                                                                                                         | SessionGate, `useSession`                                                                                         |
| S3 · `Suspense` around `useSearchParams`        | Without a boundary the production build fails ("useSearchParams() should be wrapped in a suspense boundary"); with one the server renders the fallback and the client the value. React does not hoist a `<title>` out of a fallback into the server head.                                                                        | Boundary in `workspace-route.tsx`; the boot title rendered outside it                                             |
| S4 · `router.replace` from a client page        | Same document, layout state kept.                                                                                                                                                                                                                                                                                                | The interim landing                                                                                               |

## Recorded limitations and interims

Every undrawn state string and rule the Phase-0 screens use — loading and failed words, the report
title (P0-31), the "Where" pre-fill, the empty "Where", dates, document titles — is in the
per-screen state-copy register `src/copy/state-copy.ts` (VD-12), each `drawn` (with its board) or
`provisional` (with the decision it waits on); the screens read their words from it.

- **HTTP status of the in-shell not-found is 200** (S1, S1b): the workspace layout waits for the
  tab's session before rendering its pages (sample mode, ADR-0004). The public not-found is 404.
  A server-side session (cookie or BFF, E-02) would allow 404s; Appendix F §3.3 anticipated this.
- **`/<base>` → `/<base>/help`** is an engineering-build interim (ADR-0005 §8), run after the
  workspace guard so another role's base shows XS-06 at the address asked for.
- **"Browse experiments" → `/experiments`** (public PU-15) was the one Phase-0 dead link; it
  reaches the built catalogue since Package 1B (`src/nav/link-targets.ts`).
- **"Where did it happen?"** is pre-filled with the words of the last page the person saw outside
  Help & support, in this tab (`nav/page-location.ts`, PROVISIONAL); with none, it starts empty.
- **Sign-in and sign-out stay in the document** (Package 1A): the world is kept; a reload still
  restarts it (ADR-0004 option A).
- The report title is a display-only excerpt of "What happened" (P0-31, PROVISIONAL;
  `copy/help.ts`).
