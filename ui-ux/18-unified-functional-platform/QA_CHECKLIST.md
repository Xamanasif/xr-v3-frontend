# QA Checklist — Unified Functional Platform · Implementation 01

Run from `ui-ux/18-unified-functional-platform/` (see README for local run).
Every step below was executed against the final build in a Chromium-based browser
(runtime-verified; see the implementation report). Re-run on Safari for the review pass.

## Scenario A — internal / BITS Community (no payment step)

| # | Step | Expected | Result |
|---|---|---|---|
| A1 | Prototype controls → **Reset prototype data** → confirm | Seed state: scenario A, 1 seeded tenant, no requests/access; lands on `#/` | ✅ |
| A2 | Browse without any login: `#/` → **Browse catalogue** | Catalogue renders publicly | ✅ |
| A3 | Open **Civil Engineering** (Programme/Department bundle) | Its 3 Course sub-bundles | ✅ |
| A4 | Open **Soil Mechanics** | Its 2 Experiments | ✅ |
| A5 | Open **Direct Shear Test** | Detail: description, Learning Outcomes, technologies + device requirements, preview placeholder, access panel | ✅ |
| A6 | Tick **VR** (and optionally **AR**) in *Select technologies* | Explicit selection; *Add to selection* with none ticked shows an inline error and adds nothing | ✅ |
| A7 | **Add to selection** | Toast; panel flips to *In your selection*; header count updates | ✅ |
| A8 | **Selection → Prepare institutional request** → quantity `120`, term `Quarterly` → **Submit** | `REQ-001` created once; selection + draft cleared; status page confirms with identifier | ✅ |
| A9 | Prototype controls → **Super Admin** | Request queue, `REQ-001` submitted | ✅ |
| A10 | Open `REQ-001` | Full inspection: institution, BITS Community context, contact, users, term, items + technology variants, history | ✅ |
| A11 | **Approve request** → confirm dialog | Consequence text names the internal branch; on confirm status → **Active** | ✅ |
| A12 | Verify **no payment screen occurs** | Route never contains a payment step; `#/payment/REQ-001` redirects to status | ✅ |
| A13 | Prototype controls → **Tenant Admin** | Resolves to *Sample Engineering Institute* workspace | ✅ |
| A14 | Verify approved content appears | `ACC-001` from `REQ-001` listed under Content access | ✅ |
| A15 | Verify technologies / quantity / term | Exactly the selected variants per experiment; 120 users; Quarterly with end date; granted by Super Admin | ✅ |

## Scenario B — external institution (payment-gated)

| # | Step | Expected | Result |
|---|---|---|---|
| B1 | Reset prototype data; set Requester scenario **B — External** | Scenario switches (toast) | ✅ |
| B2 | Browse the catalogue publicly | Works as in A | ✅ |
| B3 | Select one or more Experiments (e.g. Total Station, Beam Deflection) | Added with per-experiment technologies | ✅ |
| B4 | Choose technology variants per Experiment | Any combination; ≥1 enforced | ✅ |
| B5 | Submit request (e.g. 40 users, Yearly) | `REQ-00n` with context **Subscription**, payment required | ✅ |
| B6 | Super Admin approves | Dialog names the external consequence | ✅ |
| B7 | Verify status = **Approved — payment required** | Queue + detail + applicant status all show it | ✅ |
| B8 | Verify tenant access is **NOT** active yet | No tenant record exists for the institution; Tenant Admin view shows *no active tenant workspace*; no access record | ✅ |
| B9 | Applicant status → **Continue to payment** → *Simulate payment completed* (PROTOTYPE ONLY) | Provider-neutral screen states no configured commercial amount | ✅ |
| B10 | Verify request becomes **Active** | Status + history updated | ✅ |
| B11 | Verify tenant content access appears | External tenant created from the request; access record with items, technologies, 40 users, Yearly + end date | ✅ |

## Cross-cutting checks

| Check | Expected | Result |
|---|---|---|
| Search | `shear` → 1 match; grouping cards hide while filtering; caret/focus preserved while typing | ✅ |
| Filters | Technology toggles (`aria-pressed`) and programme select combine; count + live announcement update | ✅ |
| Empty search | *No experiments match* + clear action | ✅ |
| Edit selection | Technology checkboxes update the stored item | ✅ |
| Remove item | Removes with toast; summary updates | ✅ |
| Last-technology guard | Unchecking the only technology is reverted with an explanatory error | ✅ |
| Quantity validation | empty / `0` / negative / decimal rejected inline; no max cap | ✅ |
| Term + identity validation | Missing term, name, contact, invalid email → inline errors + focused summary (`aria-invalid`, `aria-describedby`) | ✅ |
| Double-submit | Submit disables on first click; one record per submission; refresh cannot duplicate | ✅ |
| Refresh persistence | Selection, draft fields, requests, tenants, access survive reload (`localStorage` `xrslp-unified-v1`) | ✅ |
| Reset | Restores deterministic seed data | ✅ |
| Deep-route refresh | Direct load of e.g. `#/tenant/…/content-access`, `#/platform/requests/REQ-002` renders correctly | ✅ |
| Invalid route | `#/nonexistent/route` → not-found state with recovery links | ✅ |
| Responsive widths | 375 px, 768 px, desktop: zero horizontal page overflow on all routes; tables collapse to labelled cards ≤740 px; sidebar becomes a horizontal strip ≤900 px; detail rails stack with the decision panel first | ✅ |
| Keyboard | Skip link is the first tab stop and focuses main; all controls are native buttons/links/inputs; dialog traps Tab/Shift+Tab, closes on Escape, restores focus to the opener | ✅ |
| Console | No errors or warnings across both scenarios | ✅ |
| Empty states | Empty catalogue search · empty selection · no requests (applicant + Super Admin) · tenant with no active content · no tenant workspace yet | ✅ |

## Invariants spot-checked

- **CART/SELECTION ≠ ENTITLEMENT** — nothing before approval (and payment, where applicable) creates a tenant or access record.
- **No payment screen on the internal route** — the step does not exist there, hidden or otherwise.
- **Access is never granted before approval**; for external, never before payment completion.
- **No universal seat cap**; quantity comes only from the request.
- **No prices anywhere**; the payment step states the amount is not configured.
- Terminology: *Experiment* (never *Module*), *Web* (never *WebGL* in copy), one *Student/Learner* role, one *Institute Admin / Tenant Admin* role, *Semester* absent (not required anywhere).
