# 09 — Student / Learner Learning and Progress Model

| | |
|---|---|
| **Status** | ✅ **CURRENT LEARNER MODEL OF RECORD** |
| **Created** | 31 August 2026 |
| **Governing decisions** | `STK31-01` · `04` · `15` · `31` · `32` · `36` · `37` · `38` · `39` · `45` |
| **Standing approval preserved** | **PM-09** — *resources → simulation → assessment → completion* is the approved learning-flow model |

> **This is the most finished part of the platform.** Two batches designed it, PM-09 approved it, and the 31 Aug review changes exactly one thing about it: **progress gains a technology dimension.**

---

## 1 · One role, two contexts — `STK31-01`

```
                    STUDENT / LEARNER
                    (ONE formal role)
                            │
            ┌───────────────┴───────────────┐
            ▼                               ▼
   B2B — INSTITUTIONAL              B2C — INDIVIDUAL
   under a Tenant                   ▷ DEFERRED (STK31-04)
   ▶ CURRENT PRIORITY
            │                               │
            └───────────────┬───────────────┘
                            ▼
                  THE SAME LEARNING CORE
                  identical for both contexts
```

**There is no separate `Student` role and `Learner` role. There are no separate permission sets.** Planning term: **`Student / Learner`**, until final UI copy standardisation.

---

## 2 · The learning journey — unchanged, and approved

```
MY LEARNING
   │  the Experiments made available to this learner
   ▼
EXPERIMENT DETAIL
   │  · what it is · Course context · supported technologies
   │  · device / runtime requirement · what is inside it
   ▼
LEARNING RESOURCES ................. PDF notes · instructional video    (FRD 3.1.2, optional)
   ▼
SIMULATION
   │  ├── Web / WebGL ............... in browser                        (FRD 1.2.1)
   │  └── AR · VR · MR .............. on device, entitlement-aware      (PM-05, mechanism-neutral)
   ▼
ASSESSMENT ......................... configuration-driven               (PM-08, optional per 3.1.2)
   │  MCQ · True/False · Descriptive
   ▼
RESULT
   │  · passed · not passed (retry while attempts remain)
   │  · RESULT PENDING EVALUATION → Faculty evaluates  (STK31-31)
   │  · explanation visibility per Faculty policy      (STK31-32)
   ▼
PROGRESS / COMPLETION
      · NEVER complete while a result is pending
      · NOW EXPRESSED PER ASSIGNED TECHNOLOGY          (STK31-36)
```

**Every stage above is built, across Batches 01 and 02, except the technology dimension on progress.**

---

## 3 · The one structural change — progress per technology (`STK31-36`)

> **If the same Experiment is assigned in multiple formats — AR, VR, WebGL — the learner/progress experience must be able to show progress per assigned technology/format.**
>
> **Three assigned technology experiences must NOT collapse into one ambiguous completion state.**

### Why this is a real change, not a display tweak

| | Today | Required |
|---|---|---|
| **Batch 01** | `progress` is a **stored enum** driven by XR delivery events; completing the simulation **is** completion | Per-technology |
| **Batch 02** | `progress` is **derived, never stored** — resources + simulation + assessment pass, four parts; an Experiment never completes while a result is pending. **PM-09 confirms this derivation as the intended one** | Per-technology |
| **Both** | One completion state per Experiment | **A completion state per assigned technology, plus an Experiment-level roll-up** |

### The shape

```
EXPERIMENT: Soil Mechanics — Direct Shear Test
   assigned technologies:  AR · VR · Web

   ├── AR   ...... resources ✓ · simulation ✓ · assessment ✓   → complete
   ├── VR   ...... resources ✓ · simulation — · assessment —   → in progress
   └── Web  ...... resources ✓ · simulation ✓ · assessment ⧗   → awaiting evaluation

   EXPERIMENT ROLL-UP ....... derived, never stored, and never ambiguous
```

**Design rules that follow:**

| # | Rule |
|---|---|
| **1** | **The roll-up must state which technologies it covers.** A bare "in progress" that hides two of three assigned formats is exactly the ambiguity the decision prohibits |
| **2** | **Batch 02's derivation model is kept** (PM-09). It gains an axis; it is not replaced |
| **3** | **An Experiment assigned in one technology renders identically to today.** The dimension must not add noise where it carries no information |
| **4** | Resources are Experiment-level; **simulation and assessment state are technology-level** unless a source says otherwise |

---

## 4 · Entitlement-aware technology access

**Unchanged, and still mechanism-neutral.** `QT-01` — which XR delivery mechanism — remains **pending by explicit PM-05 instruction**.

| Technology | Delivery | Learner surface |
|---|---|---|
| **Web / WebGL** | **Hosted / deployed** experience represented by a **link** (`STK31-37`) | Runs in browser. Built (`WEB-RUN` placeholder for `LRN-08`) |
| **AR** | **Downloadable / authorised package** (`STK31-37`) | Device access states. Built (Batch 01 `S13`) |
| **VR** | **Downloadable / authorised package** (`STK31-37`) | Device access states. Built |
| **MR** | Sideloaded application (FRD 2.1.2). **Retained** (`STK31-45`) | Device access states. Built. ⚠ `QP-14` — who authorises sideloading — open |

**Batch 01's six XR access states are preserved:** availability pending · ready on device · delivery failed · availability unknown · completion pending · completion received.

---

## 5 · Device binding and replacement — `STK31-38`

```
LEARNER
   │
   ├── DEVICE BINDING ................. one authorised licence/device relationship
   │      🔴 no registry exists anywhere — the platform has a transfer approval
   │         with no device registry
   │
   └── REQUEST A DEVICE TRANSFER ...... 🔴 the learner end is NOT built
              ▼
        SUPER ADMIN REVIEWS / APPROVES  ✅ built — Batch 05 SA-06 / SA-07
              ▼
        AUTHORISED DEVICE BINDING CHANGES
```

> **A half-built cross-plane workflow.** The approval end exists; the learner end does not. Two new learner screens (`LRN-16` device binding, `LRN-17` replacement request) complete it.

**Do not generalise into arbitrary licence administration** (`STK31-38`). **Device registration and remote management are Phase 2** (FRD 2.5.x / 2.6.x).

⚠ Batch 05's transfer record has **only two states** (`awaiting`, `approved`) *"because no rejection path exists in the requirement"*. That gap is shown as a gap and is **not** filled by invention.

---

## 6 · What the learner can and cannot do

| Can | Cannot |
|---|---|
| See Experiments made available to them | Author or configure an assessment — **PM-15**, in **either** context |
| Access learning content | See the correct-answer key — **`D-25`** |
| See progress and completion, **per technology** | Assign content to themselves or others |
| Access the AR/VR/MR runtime where appropriate | Choose which technologies the institution licensed |
| Use Web/WebGL experiences in-browser | Change a device binding without Super Admin approval |
| Browse the public catalogue **before login** (`STK31-16`) | See a price or a licence figure that does not exist |
| **Report an operational issue** (`STK31-39`) | — |

---

## 7 · Result and feedback behaviour

| Behaviour | Status |
|---|---|
| Objective results are complete and immediate | ✅ built |
| Descriptive results enter **`pending evaluation`** | ✅ built |
| **Faculty evaluates descriptive answers** — the only human evaluator | ✅ **NOW OWNED** (`STK31-31`) |
| Auto-review may assist Faculty; **never auto-final** | 🟠 `ND-09` |
| **Explanation visibility follows the Faculty's policy** — immediately / after deadline / custom date | ✅ **NOW OWNED** (`STK31-32`) |
| BITS feedback timing | 🟠 **Taxila-reference pending** (`ND-10`) |
| An Experiment never completes while a result is pending | ✅ built, preserved |
| Learner-facing wording names no evaluator by name | ✅ preserved — *"the required evaluation"* |

> **The strand risk is closed.** Before 31 August, a learner could submit a descriptive answer into a state with **no evaluator, no rubric, no turnaround and no queue**, while the approved progression gated the next Experiment on completion. **`STK31-31` gives that state an owner.**

---

## 8 · What this model deliberately does NOT contain

| Not modelled | Why |
|---|---|
| A selected XR delivery mechanism | **PM-05** left it open; `QT-01` pending. Batch 01 is deliberately mechanism-neutral |
| A device registry beyond the binding relationship | FRD 2.5.x / 2.6.x are **Phase 2** |
| A decline path on a device-transfer request | **No source contains one.** Shown as a gap, not as a disabled control |
| Certification, badges, or a completion certificate artefact | **PM-12** — Phase 2 |
| Gamification, leaderboards, social features, recommendations | `C-04` working rule; FRD 4.5 is Phase 2 |
| A turnaround commitment for descriptive evaluation | No source states one |
| An auto-submit on timer expiry | Batch 02's rule — **the platform prompts, it never auto-submits** — is preserved and flagged for re-confirmation once a server exists (`Q-43`) |
