# 18 — Unified Functional Platform · Implementation 01

**Foundation + end-to-end B2B access vertical slice** of the XR Simulation Learning Platform,
built against the 31 Aug stakeholder decisions.

This is the first **implementation** package: one connected, functional prototype proving

```
PUBLIC CATALOGUE → PROGRAMME/DEPARTMENT BUNDLE → COURSE → EXPERIMENT
→ TECHNOLOGY SELECTION → SELECTION/CART → INSTITUTIONAL REQUEST
→ SUPER ADMIN APPROVAL → PAYMENT (external only) → TENANT ACCESS ACTIVATED
→ TENANT ADMIN SEES THE ACTIVATED CONTENT
```

| | |
|---|---|
| **Source of truth** | `ui-ux/00-project-context/STAKEHOLDER_CONFIRMED_UPDATE_2026-08-31.md` (STK31-01…48) · `ui-ux/17-stakeholder-correction-blueprint/` |
| **Reuse sources** | Batches 01–05 (`ui-ux/13-full-platform-design/`) as read-only reference implementations — design tokens, shell, component grammar ported once; nothing is runtime-imported from historical folders |
| **Technology** | Dependency-free HTML + CSS + vanilla JS (ES5-style), single-page hash routing. No framework, no build step, no backend, no real payment or authentication |
| **State** | `localStorage`, isolated namespace **`xrslp-unified-v1`** (no historical batch key is reused) |
| **Theme** | Light only (logo constraint QX-07, carried forward) — with the Stage-0 a11y token fixes applied once (`--text-3:#5F6B7A`, `--control-border:#7E8A99`, `[hidden]` restored) |

## Run locally

Any static file server from this directory:

```
cd ui-ux/18-unified-functional-platform
python3 -m http.server 8123
```

then open <http://localhost:8123/>. Opening `index.html` directly via `file://` also works
(assets are local to this directory; the logo is a byte-identical copy of
`branding/bits-pilani-wilp-logo.png`, following the per-batch precedent for Safari `file://`).

## Implemented routes

**Public shell** (no sign-in — public discovery per STK31-16)

| Route | Screen |
|---|---|
| `#/` | Landing — what the platform is, how institutional access works |
| `#/catalogue` | Catalogue — search · Programme/Department filter · technology filters (derived from data) |
| `#/programme/:id` | Programme / Department bundle → its Course sub-bundles |
| `#/course/:id` | Course → its Experiments |
| `#/experiment/:id` | Experiment detail — description, Learning Outcomes, technologies + device requirements, preview placeholder, **explicit technology selection**, add to selection |
| `#/selection` | Selection basket — edit technologies, remove items, request summary. **Selection ≠ access** |
| `#/request` | Institutional request form — institution/SPOC, users/licences (>0, no cap), access term (Monthly/Quarterly/Yearly) |
| `#/requests` | Requests of the active requester scenario |
| `#/request-status/:id` | Applicant-visible status + history timeline |
| `#/payment/:id` | **External route only** — provider-neutral payment-required step; renders only in `APPROVED_PAYMENT_REQUIRED`, otherwise redirects to status. The internal route never contains this step (STK31-19) |

**Super Admin workspace**

| Route | Screen |
|---|---|
| `#/platform/requests` | Access request queue (state filter, live counts) |
| `#/platform/requests/:id` | Request detail — inspect everything, **Approve** with a consequence-explicit confirm dialog |
| `#/platform/institutions` | Tenants on the platform (read-only visibility) |

**Tenant workspace** (Institute Admin / Tenant Admin — one role, STK31-02)

| Route | Screen |
|---|---|
| `#/tenant` | Resolves the active scenario's tenant (or an honest "no tenant workspace yet" state) |
| `#/tenant/:tenantId/content-access` | Activated content: experiments, approved technologies, licence quantity, access term + validity, granted-by. Learner assignment is a designed **NEXT SLICE** gap |

Anything else → a useful not-found state.

## Request state machine

```
DRAFT (selection + form, persisted)
  → SUBMITTED
      → approve, internal / BITS Community ────────────────→ ACTIVE
      → approve, external / Subscription → APPROVED_PAYMENT_REQUIRED
                                              → simulate payment → ACTIVE
ACTIVE ⇒ tenant record (created for a new external institution,
         reused for the seeded internal one) + TenantContentAccess record
```

`PUBLISHED ≠ ENTITLED`: catalogue content, the selection, the request, and tenant access are
four separate records; tenant access ≠ learner entitlement (assignment is the next slice).

## Prototype-only controls

The dark **“PROTOTYPE CONTROLS — NOT PRODUCT UI”** strip at the top is not product UX:

- **View switch** — Public · Super Admin · Tenant Admin (no real authentication in this slice)
- **Requester scenario** — seeds the requester identity and access context:
  - **A — Internal (WILP-type)** · *Sample Engineering Institute* · context **BITS Community** · `paymentRequired: false`
  - **B — External** · *Northfield Institute of Technology* · context **Subscription** · `paymentRequired: true`
  - The internal/external classification exists **only in prototype seed data** (the production
    eligibility rule is `ND-07`, not confirmed and not invented; an anonymous visitor cannot
    self-select a free route)
- **Reset prototype data** — restores the deterministic seed state

## Two primary QA scenarios

See `QA_CHECKLIST.md`. In short: Scenario A (internal) approves straight to **Active** with no
payment step anywhere on the route; Scenario B (external) gates activation behind the
payment-required state and a clearly-labelled payment simulation.

## Intentionally NOT implemented in this slice

- Authentication / SSO / registration (scenario switcher stands in; architecture unchanged)
- Content production chain (Vendor → Academic Reviewer → Content Manager → Published) —
  **required for the complete current B2B delivery**, integrated in a later slice; this slice
  runs on seeded published content only to exercise the access journey
- Tenant Admin people/CSV/group/learner assignment (the content-access page is designed to
  gain them next), Faculty and Learner workspaces
- Super Admin tenant governance beyond request approval (creation outside a request,
  Tenant Admin assignment, deactivation, institution report), version Release/Hold, support
- Rejection / request-more-information decision outcomes (not source-supported for this slice)
- Prices, payment provider, renewal mechanics, notification channels (the required 15-day
  expiry reminder's **channel** is `ND-16`; the derived `Active / Expiring soon / Expired`
  display state is implemented as recommended supporting UX)
- B2C purchasing journey (deferred, preserved in Batch 04)

## File map

```
index.html                 entry point (classic scripts — works from file://)
assets/                    byte-identical logo copy (protected asset, never edited)
css/  tokens → base → layout → components → screens → responsive
js/   utils · data (sample pool + scenarios) · state (records + state machine)
      · components · router · app
js/screens/  public-catalogue · public-request · platform · tenant
```
