# Batch 01 — High-Fidelity Interactive Prototype

**Primary design deliverable.** Semantic HTML + modern CSS + minimal plain JavaScript. No framework, no backend, no database, no authentication, no external API, no real upload, no real XR communication, no payment, no telemetry. All interactivity is client-side prototype state.

## How to open

**Option 1 — directly in a browser (recommended):**
Open `batch01-prototype.html` by double-clicking it, or from a terminal:

```bash
open "ui-ux/13-full-platform-design/prototype/batch01-prototype.html"
```

**Option 2 — simple local static server** (from the repository root, so the logo path resolves the same way):

```bash
python3 -m http.server 8080
```

then visit `http://localhost:8080/ui-ux/13-full-platform-design/prototype/batch01-prototype.html`.

Best reviewed at a **1440px** browser width (also checked at 1280px). Light theme only in Batch 01.

## What you land on

The **Prototype Index** — clearly labelled *“Prototype Navigation — Not Product UI”*. It links into the five role workspaces and lists the five demo paths (A–E) with step-by-step scripts:

- **A — Content happy path:** Vendor submits “Soil Mechanics XR Experiment” → Academic Reviewer approves → Content Manager approves readiness → Super Admin publishes.
- **B — Academic changes required:** reviewer returns with a required reason → vendor sees the exact feedback → corrects → resubmits → academic review resumes with history intact.
- **C — Content Manager changes required:** same loop at the readiness gate — resubmission returns to the **Content Manager**, not to the start, never straight to publish.
- **D — Learner XR access:** entitlement ✓ → device compatibility ✓ → Get on device → Availability pending → Ready on device → (simulated device session) → Completion pending → Completion received → Progress updated.
- **E — XR restriction/failure states:** not entitled · access denied · unsupported device · availability failed · availability unknown · completion not yet received.

The dark strip at the top of every page is prototype navigation for switching roles; the **Reset demo** button restores all sample data. Demo state persists per browser tab (sessionStorage) so you can move between roles mid-flow.

## Notes & limits

- **All people, dates, experiments and values are SAMPLE DESIGN DATA** (tagged in the UI where they could be mistaken for approved values).
- **The XR delivery mechanism is not selected** (PM-05). Copy is mechanism-neutral (“Get on device”, “Availability pending”, “Ready on device”) and **may change after the XR delivery implementation is selected**. Where the real world would act (a device session, a completion arriving), the prototype provides clearly-labelled **“PROTOTYPE CONTROL — NOT PRODUCT UI”** buttons instead of pretending the browser can observe a headset.
- The Web-format experiment launches a **sample placeholder** runtime (the real web runtime is a retained Review-005 design outside Batch 01). VR/MR/AR never run in the browser.
- Governance and learner demo states are independent: the learner-side “Soil Mechanics — Direct Shear Test” is pre-published/entitled so Path D can be demonstrated without first completing Path A.
- Help and the account menu are visual-only in this batch.
- The header logo is referenced in place from `branding/` (the asset is never copied or modified). If your browser blocks that local reference — e.g. Safari's local-file restrictions when the HTML is opened directly — the graphic is omitted cleanly and the text lockup stands alone; serving the repository root (Option 2) always shows the logo.

## Files

| File | Purpose |
|---|---|
| `batch01-prototype.html` | Entry point (mounts the app; no content of its own) |
| `batch01-prototype.css` | Design tokens (ported from Review-005 `tokens.css`) + Batch-01 shell & components |
| `batch01-prototype.js` | Sample data, prototype state machine, views, router, dialogs/toasts |

The logo is referenced in place from `branding/bits-pilani-wilp-logo.png` (never copied or modified).
