# V3 frontend — stakeholder demo readiness report (22 Oct 2026)

**The frontend is ready to demonstrate. It is NOT stakeholder-approved and NOT frozen.** Nothing in
this preparation changed product code, the sample-world seed, permissions or business rules.

## A. Frontend status

| Item                        | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Repository / branch         | `/Users/mymac/Desktop/AR-VR-v3-ui`, `v3/refined-b-ui`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Product commit demonstrated | `4c0f180` (Vendor identifier rule) — on top of the four-role run (`aa654ab` RV, `5e102ee` IA, `68efdc2` FA, `1d03cb8` ST, `9ad1612` records)                                                                                                                                                                                                                                                                                                                                                                                           |
| Working tree                | clean before this preparation; this record and its companions are the only additions (docs)                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Recovery bundles            | `~/Downloads/XR-frontend-v3-4c0f180-ve-ids.bundle` (latest, restore-tested) and one per role                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Protected original          | `/Users/mymac/Desktop/AR-VR` unchanged (`1b090c9`, 98 paths)                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Coverage                    | 109 of 123 designed screens migrated to V3 (all role workspaces + Entry & Shared); 14 Public screens keep their v46 presentation — 2 locked V1 landing (PU-01, PU-14) and 12 public pages without a V3 package                                                                                                                                                                                                                                                                                                                         |
| Public Landing              | **Working and connected, but not the approved design.** `/` serves the preserved simplified v46 homepage; every link works (catalogue, areas, experiments, For institutions, Selection, Request access, Sign in). The approved premium landing (`21 · FROZEN · Premium Direction B2 – BITS Immersive Experience`, verified SHA-256 `3dbe9412…4d07c`) is **not integrated** — it is the held task “prompt 13”. Plan: `PUBLIC-LANDING-INTEGRATION-PLAN.md` (16 owner decisions, about 7.5–10.5 working days). Waiting for your approval. |

## B. Demo readiness

- **Start:** `/Users/mymac/Desktop/XR-V3-stakeholder-demo/demo-tools/start-demo.sh` (stop:
  `stop-demo.sh`). The demo runs from a durable copy of the verified build (survives a restart),
  not from the repository.
- **Mode A — clean world:** http://localhost:3360/ (reset: `/prototype/reset` → **Reset demo
  data**). The real workflows create everything.
- **Mode B — prepared showcase:** http://localhost:3361/ + a one-line loader pasted in the browser
  console (“Everything done” or “Onboarded only”). The prepared worlds were produced by running the
  real workflows on this build; no seed or code change. Separate address = separate world, so Mode B
  never hides Mode A.
- **Verified credentials** (sample e-mail + any non-empty password; empty password and unknown
  e-mails are refused):

| Role                       | E-mail                                                                | Available                                    |
| -------------------------- | --------------------------------------------------------------------- | -------------------------------------------- |
| Super Admin                | `arjun.mehta@wilp.example`                                            | at once                                      |
| Vendor                     | `anil.shetty@northline.example` (also `ritu.sharma@meridian.example`) | at once                                      |
| Academic Reviewer          | `a.menon@wilp.example`                                                | at once                                      |
| Content Manager            | `kavya.nair@wilp.example`                                             | at once                                      |
| Institute Admin            | `v.hegde@malnad.example` (also Deccan, Konark)                        | at once                                      |
| Institute Admin (Godavari) | `meera.iyer@godavari.edu.in`                                          | after onboarding (Mode A Journey E) / Mode B |
| Faculty                    | `s.ranganathan@godavari.edu.in`                                       | after Meera adds him / Mode B                |
| Student                    | `rahul.verma@godavari.edu.in`                                         | after Meera adds him / Mode B                |

Verified on the durable demo servers: all 8 seeded logins land on their workspace; the three
Godavari people are refused in a clean world and sign in after the journey; the full walkthrough
passes on 3360; both prepared worlds load in a fresh browser on 3361.

## C. Full product walkthrough

`STAKEHOLDER-DEMO-GUIDE.md` §2 — Public discovery → Vendor creates → Academic review (return,
resubmit, approve) → Content Manager publishes → public catalogue lists it → institution requests it
together with Shell-and-Tube → Super Admin approves → payment stand-in → Institute Admin assigned →
students, faculty, course assignment, access grants → the Student learns (sample WEB activity,
feedback) → Faculty assessment → Student attempt → marking → result. Every step was verified in this
order on one shared world (113 captures, no console error). **The newly published experiment can be
requested, put in the plan, granted to the Student and launched** — access never comes from
publishing alone (“Publishing gave no one access.”).

## D. Stakeholder presentation

- **Executive demo (about 15 min):** `STAKEHOLDER-DEMO-GUIDE.md` §3 on Mode B.
- **Highlight:** one connected product; strict separation of academic approval and publication;
  access only through the institution's plan and its grants; course-scoped review; guided authoring
  with validation; Faculty assessment and marking; the Student's progress and results; a consistent
  V3 design across 7 workspaces and 4 screen widths; no internal record numbers in workspace labels.
- **Say accurately:** local prototype, sample data in the browser, no backend; sample sign-in; SSO
  shown only; payment stand-in; sample WEB activity (same for every experiment, real simulation
  content is an external dependency; illustrative simulation stages not shown); placeholder
  resource links; logo placeholder (the official logo is supplied and waits for the landing work);
  the simplified homepage (the premium landing is pending).

## E. Quality and risks

| Check                                                                              | Result                                                                                                                                                                                                       |
| ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Final platform gate on the four-role code (`pnpm verify`, 22 Oct)                  | all PASS except parity's 7 recorded Public artwork comparisons (baseline exception)                                                                                                                          |
| Vendor identifier fix (`4c0f180`)                                                  | unit 1,505 + 7,761; Vendor specs 71/71 at four widths; product-build phase-5/6, flows, foundation 239 at 1440 and the Vendor set at 1024/768/375, 0 failed                                                   |
| Stakeholder-order journey on one world (3361)                                      | PASS (≈ 5 min, 113 captures, 0 console errors, 0 overflow)                                                                                                                                                   |
| Existing full walkthrough (`e2e/flows/walkthrough.spec.ts`) on the demo build 3360 | PASS (3.4 min)                                                                                                                                                                                               |
| Presentation audit (≈ 302 pages × 4 widths = 1,209)                                | 0 page errors, 0 overflow, 0 broken images or failed assets, 0 dead links (323 internal links), 264/264 wrong-role checks correct, 48/48 sign-outs; internal references only in the allowed quoted seed text |
| Demo kit                                                                           | logins, both showcase worlds, reset — verified on the durable servers                                                                                                                                        |

**Real outstanding defects: none demo-blocking, no visible functional defect.** Cosmetic / decision
items (register K-01…K-14): the approved premium landing not yet integrated (K-01); the logo
placeholder in two wordings (K-02); requester-facing REQ-/ACC- references on public request pages
(K-03, decision); Faculty Students filter default with two experiments (K-04); two identically named
“Open experiment” links (K-05); visible “still open” decision notes (K-06); an ellipsis on IA People
at 1024/768 (K-12); a focus ring on the “not your workspace” heading (K-13).

**Known baseline exception:** the 7 Public artwork parity comparisons (2 on the landing, 5 on
PU-03/PU-06).

**Unsupported external integrations:** identity provider / SSO, payment provider, e-mail delivery,
real simulation builds and runtime reporting, resource hosting, device registry.

**What could interrupt the live demo:** (1) a different browser profile or a reset between roles
(the world lives in the browser) — use one window; (2) clicking a sample resource link (opens
“This site can’t be reached”); (3) in Mode A, Faculty Students needs Shell-and-Tube picked in the
filter; (4) a Chrome “allow pasting” prompt the first time the loader line is pasted; (5) the demo
servers stopped — `start-demo.sh`.

## F. Sign-off preparation

- Review register + CSV template: `FRONTEND-REVIEW-REGISTER.md`, `FRONTEND-REVIEW-REGISTER.csv`.
- Proposed freeze checklist (not executed): `FRONTEND-SIGNOFF-CHECKLIST.md`.
- Items awaiting product decisions: the premium landing go-ahead and its 16 decisions (D-1…D-16 in
  the landing plan, incl. confirming the supplied logo `branding/bits-pilani-wilp-logo.png` as the
  authorised asset); the requester reference (K-03); licence counting and first sign-in (noted on
  the Super Admin screens); prototype field sets (Vendor); sign-in method; the simulation-stage data
  dependency.

Evidence (screenshots, logs, audit data) is outside the repository in
`/Users/mymac/Desktop/XR-V3-stakeholder-demo/evidence/`.
