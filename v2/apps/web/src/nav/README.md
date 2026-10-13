# Workspace navigation (WP-0.8)

The navigation of the seven workspaces and the public header, as data, plus the rules that turn it
into a sidebar (Appendix F WP-0.8; Appendix E §4; boards 05, 06, 08, 12). The shell itself is
`features/shared/workspace-shell/role-workspace-shell.tsx`, composed from the `@xr/ui` shell parts;
the account menu (XS-05) is `features/shared/xs-05-account-menu/`.

| Module               | What it holds                                                                                                                                                                                                |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `nav-config.ts`      | The seven workspaces in board 06's order (labels, icon keys, routes, count words, section tabs), "My device", and the public header (data only: PublicShell is Phase 1 under G-8)                            |
| `screens.ts`         | The designed workspace screen ids the navigation can name (no excluded id), and the two unnumbered views that need a sidebar owner                                                                           |
| `active-item.ts`     | The explicit current-item map (Appendix A §3.6): each screen's owning destination, Help on the Help pages, nothing on XS-06, the in-shell PU-15 and ST-18                                                    |
| `built-screens.ts`   | The built-screen manifest, generated from `routes.ts` (a screen is built when it has a page). Phase 0 builds only XS-07, so every sidebar shows Help alone; the items of later screens appear in board order |
| `routes.ts`          | The Phase-0 route manifest (WP-0.13): the 35 page files and the other §3.3 route files, the row-20 redirects, `resolveAddress` (what an address shows), and the role ↔ workspace-base mapping                |
| `link-targets.ts`    | The link-target ledger (ADR-0005 §8): every action drawn on the Phase-0 screens, where it goes and what that address shows — with the one documented dead link ("Browse experiments", PU-04 Phase 1)         |
| `return-to.ts`       | The `returnTo` rule (own base only, same-origin relative path) and the sign-in addresses the session gate uses (XS-01 in Phase 1)                                                                            |
| `page-location.ts`   | "Where did it happen?": the last page outside Help & support, in the person's words, in memory per person per tab (PROVISIONAL)                                                                              |
| `navigation.tsx`     | The framework-free navigation the route layer supplies to the features (address, query, `replace`, `notFound`), as `@/platform/link` supplies `next/link`                                                    |
| `sidebar-model.ts`   | Config + manifest + current screen + count figures → the `Sidebar` props (the configured singular for 1, no count at zero)                                                                                   |
| `help.ts`            | Help & support's addresses under each workspace base and each view's top-bar words, crumb and page width (board 07)                                                                                          |
| `rail-preference.ts` | The rail choice in memory, per person, for the life of the tab (the Phase-0 interim, VD-20 / X-10). Nothing is stored in localStorage, sessionStorage or cookies; a reload starts from the board default     |

## Sources and checks

- **Board 06 is the authority.** `nav-config.test.ts` parses board 06's script (`raw[]` and the
  icon paths `const I`) from the frozen handoff and compares labels, order, icon paths, count words
  and lines; `handoff/navigation.json` must equal the config after its two documented
  normalisations (HB-19 "Help (foot)" → "Help", always last; HB-02 header "Request access" → PU-07
  Selection, as B1-01 links it). Routes must equal `docs/v46/routes.json`, and the current-item map
  its `sidebarActiveMap`. Board 06's account-menu table is read by `test-support/boards.ts` for the
  account-menu and shell tests.
- **No undrawn destination.** No Settings, Reports, role switcher, workspace chooser or licence
  meter appears in any configuration (tested), and the account menu has only My device\*, Help
  and Sign out. "My device" needs a Student holding AR, VR or MR **and** ST-18 built; Sign out runs
  the session port's command through the session gate (WP-0.13), which clears the query cache.
- **In a browser.** The specimen harness renders the seven shells from the same `@xr/ui` parts with
  board-06 fixture data (`apps/specimens/src/specimens/components/role-shells.tsx`; the harness
  may import `@xr/ui` only). `apps/specimens/e2e/role-shells.spec.ts` compares what renders with
  board 06 itself at 1440 (labels, icon paths, counts in words, lines, the account menu); drives
  the drawer at 1023, the rail at 1100 and the full sidebar at 1440 for every role, Phase 0 and
  fully built; checks the band, the drawer, document scrolling, axe and visible focus at 1440,
  1024, 768 and 375; and the 1023 / 1024 / 1279 / 1280 app-width boundaries. Which destinations
  are built and which is current are the specimen's own data there: the map, the manifest, the
  account-menu rules and the rail store run in a browser only once WP-0.13 builds the routes, and
  its route suite repeats these checks on the real composition.

## Open items (not resolved here)

- **ST-19 current item.** Appendix A §3.6 and the product boards B2-11 f12 / B2-12 f4 draw ST-19
  "Experiment not available" with My courses current; board 08 draws the same refusal as a message
  page with nothing current. The map follows the route register until the owner decides (ST-19 is
  built in Phase 2).
- **Count words differ between boards.** Board 06 says "4 waiting for review" and "2 ready to
  publish"; the B6 product boards build "{n} items waiting for review" and "{n} experiments ready
  to publish" (with "1 item …" and "1 experiment …"), as already noted in
  `docs/v46/understand/surface-reviewer-cm.json`. The configuration follows board 06, the
  authority for navigation.
- **Singulars.** Marking's "1 written answer to mark" is drawn as a sidebar count (B4). The
  Institute Admin's "1 device request to forward" is drawn only as B2-01's attention row ("1
  device request to forward to BITS"): no board draws that sidebar count at 1. "Requests under
  review" has no drawn singular (every drawn figure reads "3 requests under review"), so a figure
  of 1 reads "1 requests under review" until one is approved.
- **The Institute Admin's Requests count.** Board 06 counts device requests to forward on
  "Requests", which opens Requests to BITS (IA-17), not the Device requests tab it counts (IA-18) —
  against its own rule "Counts appear only where they open the list they count". Keep, drop, or
  open the Device requests tab while the count shows: an owner decision before IA-17 is built.
  Still open after WP-0.9: `@xr/domain`'s `navCounts.instituteAdminDeviceRequests` counts the
  records only and decides nothing about where the count belongs.
- **Counted link names in Chromium** ("Marking , 12 written answers to mark", as the boards' own
  markup is named): reported in `packages/ui/README.md` (WP-0.8), with the narrow `aria-label` fix
  not applied. Kept by the owner as an implementation choice, not a change to the frozen design
  (WP-0.9 authorization, 13 Oct 2026), as is the omitted navigation landmark while nothing is
  built.

## Done in WP-0.13

- **The page's facts reach the shell**: pages register them with `useShellPage`
  (`features/shared/workspace-frame/shell-page.tsx`); the shell in the workspace layout uses them
  before paint. The in-shell PU-15 and XS-06 register theirs the same way.
- **Focus after choosing a destination**: after a client-side navigation focus moves to `main`
  (the skip link's target), and so after choosing the page already shown (drawer or account
  menu). A document load moves nothing. See `features/shared/workspace-frame/route-focus.ts`.
- **The manifest is generated** from the route manifest, which `routes.test.ts` holds equal to
  the route files on disk (Appendix F WP-0.13 acceptance 8).
- The route-level suite repeats the WP-0.8 shell checks on the real composition
  (`e2e/foundation/`): bands at 1023/1024 and 1279/1280, the drawer, the account menu, axe and
  visible focus at the four widths.
