# Institute Admin · final complete-role design · V3 Refined B

| | |
|---|---|
| Role | Institute Admin (IA) |
| Foundation | `XR-V3-RB-1.0` (core.css, rb.css, rb-kit.css byte-identical; hashes in FOUNDATION-LOCK.json) |
| Owned designed IDs | **19 of 19**: IA-01 … IA-11, IA-13 … IA-20, all in one design language |
| Coverage | 19 screens and 76 important subviews: 59 REDESIGNED, 17 REVIEWED AND UNCHANGED, 0 pending (COVERAGE.md) |
| Excluded, not designed, not linked | IA-12 (invitations), IA-21 (Reports), IA-22 (Settings / SSO) |
| Design history | Complete role delivered 18 Oct 2026 → refinement R1 (IA-01, IA-04, IA-06, IA-16) and IA-02 R2, 19 Oct → final consolidation of all 19 screens, 20 Oct → owner approval and the identifier pass, 21 Oct 2026 |
| Status | **FINAL — OWNER APPROVED** (21 Oct 2026) · **CONNECTED PREVIEW COMPLETE** · **ASSEMBLY PENDING XS** |
| Owner approval | Given on 21 Oct 2026 for the whole role: the plan tint is kept, and internal record ids were taken out of ordinary labels before approval was recorded (HANDOFF.md § 9). |

## Live role entry

Claude Design canvas: https://claude.ai/artifact/VM1CC1Yni43Ngw2bhtgAgb (Version 15, private to the owner until shared).

1. Open the canvas. It starts on the page **Final · start here**.
2. Use the board **"Institute Admin · connected role preview — start here"** (Play / interact). Beside it is the **coverage register** board.
3. The first screen is the role start page (design preview chrome, not product UI). Pick a sample world or one of the five journeys, then work in the Institute Admin workspace. Changes stay while you move between pages; reloading the board resets the sample world.
4. The dashed **Preview IA-xx** button (bottom right) shows the current screen ID and returns to the start page.

| Canvas page | Boards | What it shows |
|---|---|---|
| Final · start here | 2 | The connected role preview and the coverage register |
| Screens · 1440 | 20 | Every owned screen in its primary state, plus the borrowed Help page |
| States | 78 | Plan states (ending, paused, ended, no plan), new institution, empty, no match, loading, failed, validation, refusals, dialogs and results for every screen |
| Responsive | 37 | Every owned screen at 375 with the menu drawer and a dialog; 768 and 1024 for the busiest screens |

The earlier pages (Reference boards of the delivered role, the R1 checkpoint and the IA-02 R2 comparison) are no longer on the canvas, so old and new designs are never side by side. They remain in the canvas's earlier versions.

Board props (scenario, route, preset, chrome) can also be changed on the root board. Served as a plain page, the same root accepts `?ia-scenario=…&ia-route=…&ia-preset=…&ia-chrome=off`.

## Short review path (populated world, about 15 minutes)

Press Play on the large board, choose **Open the Institute Admin workspace**, then follow the sidebar:

1. **Overview** — compact head, Needs your attention, the access-plan card on the plan tint.
2. **Content access** — plan strip, experiments grouped by course with compact format badges. Open the **Course codes** tab, then back on Experiments choose **View plan**: the **Access plan** page (strip, what BITS gave, students given access, history beside).
3. **Student access** — grouped by experiment with the status switch. Choose **Give students access** and go to step 2: "Your selection" beside the steps.
4. **People** — Students tab; open **Rahul Verma** (experiments given, About and Account beside, history below). **Faculty** tab → **Dr S. Ranganathan** (courses taught). **Groups** tab → **ME ZG523 — Sem II** (members with the group's grants beside). **Faculty courses** tab (list with the assign panel beside). **Add student** and **Import students** from the Students tab.
5. **Requests** — the list → **REQ-0058**; **Device requests** tab → **Review** on DTR-0018.
6. **Usage** — figures per experiment and format with "What the figures mean" beside; switch to **By course**.
7. **Help & support** at the rail foot (borrowed shared surface).

Then glance at **States** (one row per area) and **Responsive** (phones). To see restricted states live, start the large board again and pick the world **Access paused by BITS**, **Plan ending soon**, **Plan ended** or **Approved — payment required**.

## Sidebar and coverage

| Sidebar | Screens inside | Owned IDs |
|---|---|---|
| Overview | Overview | IA-01 |
| Content access | Experiments tab · Course codes tab · Access plan detail | IA-02, IA-16, IA-03 |
| Student access | Student access list · Give students access (3 guided steps + result) | IA-04, IA-05 |
| People | Students · Faculty · Groups · Faculty courses tabs; Student record; Faculty record; Group page (create, members, access); Add student / Add faculty member; Import students (CSV) | IA-06, IA-08, IA-13, IA-15, IA-07, IA-09, IA-14, IA-10, IA-11 |
| Requests | Requests to BITS (list, new request form, request detail) · Device requests tab · Device request review and forward | IA-17, IA-18, IA-19 |
| Usage | By experiment and format · By course | IA-20 |
| Rail foot: Help & support | Borrowed shared surface | XS-07 (shared, not owned) |
| Top bar: account | Account menu, Sign out → Signed out page | XS-05, XS-03 (shared, not owned) |

Per-ID detail, states and evidence: `ROLE-STATUS.json`. Every subview and its status: `COVERAGE.md`. Every link and button tested: `LINK-MAP.json`.

## Connected journeys (all exercised, see CHECKS.md)

1. **New active institution → add student → course code → give experiment → counts agree** (world: New active institution).
2. **Import invalid CSV → row errors → corrected file → import → duplicate e-mail refused** (world: New active institution).
3. **Create group → members → group grant → withdraw one identified individual grant** (world: After the first grant).
4. **Add faculty → assign course → faculty record and Faculty courses agree** (world: Populated institution).
5. **Ask BITS for more licences or a renewal → inspect status → forward a device transfer** (world: Populated institution).

## Limits (read before reviewing)

- Design preview only. No backend, no authentication, no e-mail, no payment, no device registry. Sample worlds are illustrative fixtures (SCENARIOS.json), not application data. They are unchanged from the delivered role.
- Effects outside this role (the Student's view, BITS decisions, payment, sign-in) are shown as clearly labelled handoff pages inside the preview. Nothing claims to change another role's canvas.
- Help & support, the account menu, the signed-out page and the paused notice are **borrowed** from the shared XS contract with V3 tokens, so the role is **ASSEMBLY PENDING XS** until the Shared Surfaces delivery replaces them.
- `support.js` is the Claude Design runtime supplied by the design host. It is not in this package and must never ship in the React app. Public Sans loads from Google Fonts, as in the seed files.
- Wrappers on the Screens, States and Responsive pages are derivatives of the role root, not recovered originals of the missing V3 wrappers (common/05).

## Package map

| Path | Purpose |
|---|---|
| `project/canvas.json` | Final role canvas (4 pages, 137 boards) |
| `project/Main.dc.html` | Role preview root: shell, all 19 IA views, borrowed XS surfaces, sample worlds, named states |
| `project/ia-role.css` | The one role extension stylesheet (`ia-` prefix only) |
| `project/core.css`, `rb.css`, `rb-kit.css` | Foundation files, byte-identical |
| `project/coverage.dc.html` | Coverage register board |
| `project/scr-*`, `st-*`, `rsp-*` `.dc.html` | 135 inspection wrappers listed by the canvas |
| `ROLE-STATUS.json` | Status, coverage, states and evidence of every owned ID |
| `COVERAGE.md` | Coverage register: every owned screen and subview, REDESIGNED or REVIEWED AND UNCHANGED |
| `FOUNDATION-LOCK.json` | Base hashes, local additions, files retired since the last export |
| `COMPONENT-EXTENSIONS.md` | Reused kit parts and the role patterns |
| `LINK-MAP.json` | Every control: source, destination, classification, tested result |
| `SCENARIOS.json` | Sample worlds, named states, CSV fixtures and provenance |
| `HANDOFF.md` | Behaviour, final layouts, commands, open policies and changes for Claude Code |
| `CHECKS.md` | What was rendered, logic-tested, source-checked and not tested |

Screenshots are in the separate archive `XR-V3-IA-Final-screenshots.zip`: every owned screen at 1440, 1024, 768 and 375 in all seven sample worlds, every named state at 1440 and 375, and every canvas board at its own size.
