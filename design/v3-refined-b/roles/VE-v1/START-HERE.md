# XR Learning Platform · Design V3 · Vendor — complete role (final)

| | |
| --- | --- |
| Status | **FINAL DESIGN · AWAITING OWNER ACCEPTANCE**. The design is complete and connected. Claude Code implementation has **not** started. |
| Role | Vendor (owner code `VE`), Refined Direction B |
| Foundation | `XR-V3-RB-1.0`. The three shared CSS files are byte-identical to the foundation lock (`FOUNDATION-LOCK.md`) |
| Owned designed IDs | **10 of 10**: VE-01, VE-02, VE-03, VE-04, VE-05, VE-06, VE-07, VE-08, VE-09, VE-13 |
| Excluded, not designed | VE-10, VE-11, VE-12, VE-14, VE-15. Nothing links to them |
| Refinement | R1 (accepted by the owner, with its five presentation choices) is merged into the role source and applied to every screen. The four R1 screens render exactly as accepted, apart from one 14px spacing fix (`CHECKS.md`) |
| Sample world | Thursday 27 August 2026 · Anil Shetty · Northline Simulation Studio (as in v46) |
| Delivered | 19 October 2026 · Design canvas version 14 |

This package is the **one authoritative Vendor source**. It supersedes both earlier packages:

- `XR-V3-Vendor-Complete-Role-Source.zip` (18 Oct, the pre-refinement baseline);
- `XR-V3-Vendor-Refinement-R1-Source.zip` (the R1 checkpoint).

## Live role entry

`project/Main.dc.html` is the working Vendor workspace. On the Design canvas it is the first board, **“Vendor workspace · live connected role · start here”**. Press Play on it.

It is one role-preview root with connected subviews. The sidebar, lists, records, the four-step editor, dialogs and Help all run inside it. Every change you make carries through to the list, the Overview and the record until you press **Reset**. That covers save, submit, revise, resubmit and report a problem.

The dashed bar above the page is for reviewers only and is not part of the product. It lets you jump to a screen, load a scenario, fill sample answers or reset, and it explains handoffs to other roles.

The other 69 boards are inspection evidence. Each one opens a single screen or state at a fixed width: 1440, 1024, 768 or 375. They import the same root (`<dc-import name="Main">` with a start state), so they always show the current design. The canvas has a single page.

## Sidebar destinations (all covered)

| Destination | Where | Screen |
| --- | --- | --- |
| Overview | rail, phone menu | VE-01 |
| My experiments | rail, phone menu | VE-02, which leads to VE-07, VE-08, VE-09 and VE-03…VE-06 |
| Help & support | rail foot, phone menu, account menu | XS-07, borrowed shared surface |
| Account menu | top bar | XS-05, borrowed: name, role, organisation, Help, Sign out |

## Five-minute review path

1. **Overview.**
   - The studio band shows four real counts.
   - The returned item (Forced Convection) leads, with its reason and the parts it refers to.
   - Recent activity opens each record.
2. **Create experiment.**
   - Press Continue with nothing filled and look at the error summary.
   - Fill the fields, or use “Fill sample answers”.
   - Press **Save draft**. The draft becomes SUB-0087.
3. **My experiments.**
   - Try the status tabs and the search.
   - Press **Edit draft** and finish steps 2–4. On step 2, tick formats and watch each block's status and the outline.
4. **Check and submit.**
   - Each step has its own review section with a **Change** button.
   - Submit, then confirm in the dialog. The outcome card states what happens next.
   - Open the record and its **Submission and version history** tab.
5. **Revise and resubmit.**
   - From the Overview, choose **Revise “Forced Convection”**. The reason sits above the editor, and its chips jump to the AR fields.
   - Save changes, then open the record. The private revision is stated inside the returned-reason panel.
   - Resubmit. The wording stays neutral: “Submitted · revision 2”.
6. **Read-only records.** Open **Fin-Tube Bundle** (published, read-only) and **Surface Roughness in Turning** (course withdrawn, read-only).
7. **Help.** Open the account menu → **Help & support** → **Report a problem**.

## What is in this package

| Path | What |
| --- | --- |
| `project/` | Everything the Design host needs: `canvas.json`, `Main.dc.html` (live root), 69 inspection wrappers, the 3 locked shared CSS files and `v3-vendor.css` (the single role stylesheet) |
| `ROLE-STATUS.md` | **Authoritative** status of each owned ID: source, kind, route proposal, states, boards, evidence |
| `FOUNDATION-LOCK.md` | **Authoritative** foundation record: base version, shared-file hashes, local additions listed separately |
| `ROLE-STATUS.json`, `FOUNDATION-LOCK.json` | Machine-readable mirrors of the two records above, generated from the same data in the same build |
| `COMPONENT-EXTENSIONS.md` | Reused kit patterns, the role's `ve-` primitives and `vr-` layout patterns, borrowed XS surfaces |
| `LINK-MAP.json` | Every named control: destination, classification, tested status |
| `SCENARIOS.json` | Fixture snapshots with provenance (v46, v46-derived or illustrative) |
| `HANDOFF.md` | States, allowed actions, command needs, open policies, status wording, changes from v46 |
| `CHECKS.md` | What was rendered, exercised and source-checked, with widths and keyboard paths |

Screenshots for implementation comparison are in a separate archive: `XR-V3-Vendor-Complete-Role-FINAL-Screenshots.zip`. It holds every state at four widths, every board and the test evidence.

## Limits, stated plainly

- **No backend or authentication.** Records live in the preview's own state and reset with **Reset**.
- **Borrowed shared surfaces.** Account menu, Help & support and “not part of your workspace” are borrowed: v46 shared behaviour drawn in V3 tokens. **Sign out** ends at a short handoff note, because the Signed out page (XS-03) belongs to Shared Surfaces. Swap in the XS deliverables at assembly.
- **Logo.** The WILP logo is a reserved slot. No logo binary was supplied, and none was invented.
- **Fonts.** Public Sans loads from Google Fonts on the host. The local checks used the same family from a local copy. No font files are included.
- **Hosted canvas not opened in a browser.** The published files were downloaded back and are byte-identical to the tested files, and the host serves the same design runtime the tests used (`CHECKS.md`).
- **Design runtime.** `support.js` is supplied by the host. It is not in this package and must never ship in the React app.
