# Batch 01 — High-Fidelity Interactive Prototype

**Primary design deliverable.** Semantic HTML + modern CSS + minimal plain JavaScript. No framework, no backend, no database, no authentication, no external API, no real upload, no real XR communication, no payment, no telemetry. All interactivity is client-side prototype state.

## How to open

**Option 1 — directly in a browser (recommended):**
Open `batch01-prototype.html` by double-clicking it, or from a terminal:

```bash
open "ui-ux/13-full-platform-design/prototype/batch01-prototype.html"
```

**Option 2 — simple local static server** (from this `prototype/` directory):

```bash
python3 -m http.server 8080
```

then visit `http://localhost:8080/batch01-prototype.html`.

Best reviewed at a **1440px** browser width (also checked at 1280px). Light theme only in Batch 01.

## What you land on

The **Prototype Index** — clearly labelled *“Prototype Navigation — Not Product UI”*. It links into the five role workspaces and lists the five demo paths (A–E) with step-by-step scripts:

- **A — Content happy path:** Vendor submits “Soil Mechanics XR Experiment” → Academic Reviewer approves → **Content Manager publishes to production**. You can also run the same path with a submission you create yourself in **New Submission** — it becomes its own record and travels the chain under the title you enter.
- **B — Academic changes required:** reviewer returns with a required reason → vendor sees the exact feedback → corrects → resubmits → academic review resumes with history intact.
- **C — Content Manager changes required:** same loop at the readiness gate — resubmission returns to the **Content Manager**, not to the start, and never skipping the academic gate.
- **D — Learner XR access:** entitlement ✓ → device compatibility ✓ → Get on device → Availability pending → Ready on device → (simulated device session) → Completion pending → Completion received → Progress updated.
- **E — XR restriction/failure states:** not entitled · access denied · unsupported device · availability failed · availability unknown · completion not yet received.

The dark strip at the top of every page is prototype navigation for switching roles; the **Reset demo** button restores the seeded sample data and removes any submissions created during the demo. Demo state persists per browser tab (`sessionStorage`, key `xrslp-batch01-proto-v2`) so you can move between roles mid-flow and survive a page refresh. Where a browser blocks storage on `file://`, the prototype falls back to in-memory state — role switching is hash routing without a page load, so a walkthrough still works end to end; only a hard refresh resets it.

> **Publication ownership.** Following the PM publication correction of 2026-08-25 the governance chain is **Vendor → Academic Reviewer → Content Manager → Published**. The Content Manager requests changes or publishes. **Super Admin remains one of the approved platform roles**, but takes no part in the active Batch-01 content-publication workflow and therefore has no workspace in this prototype; its detailed responsibilities are **deferred** to a later platform batch. The Content Manager's **Published Content** list is a **DESIGN ASSUMPTION — REVERSIBLE** (`DA-06`), not a PM-confirmed requirement. See [`../01_BATCH01_SCOPE.md`](../01_BATCH01_SCOPE.md) and [`PM_CONFIRMED_UPDATE_2026-08-25.md`](../../00-project-context/PM_CONFIRMED_UPDATE_2026-08-25.md).

## Notes & limits

- **All people, dates, experiments and values are SAMPLE DESIGN DATA** (tagged in the UI where they could be mistaken for approved values).
- **The XR delivery mechanism is not selected** (PM-05). Copy is mechanism-neutral (“Get on device”, “Availability pending”, “Ready on device”) and **may change after the XR delivery implementation is selected**. Where the real world would act (a device session, a completion arriving), the prototype provides clearly-labelled **“PROTOTYPE CONTROL — NOT PRODUCT UI”** buttons instead of pretending the browser can observe a headset.
- The Web-format experiment launches a **sample placeholder** runtime (the real web runtime is a retained Review-005 design outside Batch 01). VR/MR/AR never run in the browser.
- Governance and learner demo states are independent: the learner-side “Soil Mechanics — Direct Shear Test” is pre-published/entitled so Path D can be demonstrated without first completing Path A.
- Help and the account menu are visual-only in this batch.
- The header logo is loaded from `assets/bits-pilani-wilp-logo.png`, a **byte-identical local copy** of `branding/bits-pilani-wilp-logo.png`. **`branding/` remains the single source of truth**: the source asset is never modified, and the copy is never independently edited — refresh it with `cp` and verify with `cmp`, never by editing. A local copy is required because Safari blocks parent-directory subresources when an HTML file is opened directly from `file://`, which previously left the real logo missing. If the image still cannot load, the graphic is omitted cleanly and the text lockup stands alone — never a broken-image icon.

## Files

| File | Purpose |
|---|---|
| `batch01-prototype.html` | Entry point (mounts the app; no content of its own) |
| `batch01-prototype.css` | Design tokens (ported from Review-005 `tokens.css`) + Batch-01 shell & components |
| `batch01-prototype.js` | Sample data, prototype state machine, views, router, dialogs/toasts |
| `assets/bits-pilani-wilp-logo.png` | Byte-identical local copy of the branding logo (see below) |

**Branding source of truth.** `branding/bits-pilani-wilp-logo.png` at the repository root is the only master. `assets/bits-pilani-wilp-logo.png` is a verbatim copy kept solely so the logo loads under Safari `file://`. Verify it has not drifted:

```bash
cmp branding/bits-pilani-wilp-logo.png ui-ux/13-full-platform-design/prototype/assets/bits-pilani-wilp-logo.png
```

(`sha256` of both, at the time of writing: `f98fe1f89cf99ab5058cfb34fed6857de0712a02ef71d611c3bcbdac17a7184c` — the same file the Batch-02 prototype copy carries.)
