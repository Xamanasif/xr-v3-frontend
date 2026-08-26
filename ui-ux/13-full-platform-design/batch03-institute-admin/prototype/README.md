# Batch 03 — High-Fidelity Interactive Prototype (Institute Admin)

**Primary Batch-03 deliverable.** Semantic HTML + modern CSS + minimal plain JavaScript. **No framework, no backend, no database, no authentication, no real single sign-on, no real institution-data integration, no real entitlement service, no telemetry, and no network request of any kind.** Every state is local prototype state held in the page.

The eligibility computation in `batch03-prototype.js` is a function over that local state. It is **not** a schema, an API contract or a data-model proposal — the entitlement service and its interfaces are pending.

## How to open

**Option 1 — directly in a browser (recommended):** open `batch03-prototype.html` by double-clicking, or:

```bash
open "ui-ux/13-full-platform-design/batch03-institute-admin/prototype/batch03-prototype.html"
```

This works in Safari and Chrome alike, **including the header logo**: Safari blocks parent-directory subresources for directly-opened local files, so the prototype keeps everything it needs inside this folder — `batch01-design-system.css` (a verbatim, byte-identical snapshot of the Batch-01 stylesheet) and `assets/bits-pilani-wilp-logo.png` (a byte-identical local copy of the branding source).

**Option 2 — simple local server** (from the repository root; only QA seeding needs http):

```bash
python3 -m http.server 8080
```

then visit `http://localhost:8080/ui-ux/13-full-platform-design/batch03-institute-admin/prototype/batch03-prototype.html`.

Best reviewed at **1440px** (also verified at 1280px). Light theme only, as in Batch 01 and Batch 02.

## What you land on

The **Prototype Index** (labelled *"Prototype Navigation — Not Product UI"*) linking the two workspaces and five demo paths:

- **A — Institution setup overview:** Overview (what needs attention right now) → People → Content Access → Institution Setup, with the status of both connections.
- **B — Content access reaches a learner** *(the batch's central proof)*: Content Access → *Surveying XR* is **not yet reaching learners** → open it → **Add eligibility** → an academic stream → Access Mapping shows the gap closed → **Learner access check** shows the experiment now appearing in that learner's My Learning. Remove the eligibility and every step reverses, including the learner's view.
- **C — People and academic structure:** People → Rahul Verma (what he can reach, and through which relationship) → his academic stream → the content access reaching it. Also: the record that **needs attention** and why it reaches nothing.
- **D — Single sign-on:** Institution Setup → Single sign-on → save the details → check the connection (**the first check does not succeed**, so both states are reachable) → check again → turn institutional sign-in on.
- **E — Institution data and its exceptions:** Institution data (last run **completed with issues**) → Records needing attention (three distinct issue kinds, each with *what happened* then *what to do next*) → simulate the institution's records being corrected at source → **Retry these records** → applied, and the affected people change.

The dark strip on every page is prototype navigation; **Reset demo** restores all sample data. State persists per tab (`sessionStorage`), so you can move between the Institute Admin workspace and the learner access check mid-flow — which is exactly how path B is demonstrated.

## Notes & limits

- **All people, institutional identifiers, institutions, content access records, dates and counts are SAMPLE DESIGN DATA**, tagged in the UI wherever they could be mistaken for approved values.
- **Deliberately unresolved, by instruction.** How an institution comes to hold content access (no purchase, price, payment, invoice, plan, tier, term or renewal appears anywhere) · what the commercial unit is (records are described by the content they cover, never by a packaging noun) · whether there is a seat model (**nothing counts seats**) · who assigns learner entitlement (the eligibility editor is a **labelled, reversible design assumption**) · whether learners may browse content they are not entitled to (no browse surface is added) · the identity provider, protocol and attribute mapping (**none is named**; automatic role mapping is absent) · the institution-data provider and integration contract (**no endpoint, credential, payload, schema or field name**) · who creates Faculty accounts (Faculty are listed; no origin is claimed) · what happens after an access record's end date (dates are shown as data; **no expiry behaviour is drawn**).
- Where the real world would act — a connection check, a scheduled run, the institution's own records being corrected at source — the prototype either simulates it locally or provides a clearly-labelled **"PROTOTYPE CONTROL — NOT PRODUCT UI"** button, rather than pretending the browser can do it.
- **One control on Institution data is a design assumption, not a requirement.** **Run now** is kept because it is the only route to the run-in-progress state and the natural action after a source correction, but **no source establishes a manual or on-demand synchronisation** — the requirement is a *scheduled* run at a configurable interval. It is recorded as **`DA-15` — DESIGN ASSUMPTION, REVERSIBLE** and can be removed without affecting any other screen. **Retry these records**, by contrast, **is confirmed** by an explicit acceptance criterion.
- Help and the account menu are visual-only, as in Batch 01 and Batch 02.
- The learner view is a **single read-only verification surface**, labelled *"PROTOTYPE SCOPE — NOT PRODUCT UI"*. Opening an experiment, getting it onto a supported device, the learning sequence and assessments are designed in Batch 01 and Batch 02 and are **not** repeated or modified here.
- The header logo loads from `assets/bits-pilani-wilp-logo.png` — a **byte-identical local prototype copy** of `branding/bits-pilani-wilp-logo.png` (the source asset is never modified; check for drift with `cmp`). If the image ever fails to load, the graphic is omitted cleanly and the text lockup stands alone — never a broken image.

## Files

| File | Purpose |
|---|---|
| `batch03-prototype.html` | Entry point (mounts the app) |
| `batch01-design-system.css` | **Verbatim, byte-identical snapshot** of `../../prototype/batch01-prototype.css` so the prototype loads styled from `file://` in Safari (which blocks parent-directory subresources for directly-opened files). **Batch 01 remains the source of truth** — check for drift with `cmp` against the original |
| `batch03-prototype.css` | **Extensions only** — institutional administration components on the same tokens. No Batch-01 token or component is redefined; the one exception is documented in the file (restoring the `hidden` attribute, which the Batch-01 `.ferr` rule overrides) |
| `batch03-prototype.js` | Sample data, the access/eligibility model, views, router, dialogs and toasts; includes a small commented QA-seed hook used by `../qa/qa-seed.html` |
| `assets/bits-pilani-wilp-logo.png` | **Byte-identical local copy** of `branding/bits-pilani-wilp-logo.png` so the header logo renders when the file is opened directly. The branding source remains untouched and authoritative |
