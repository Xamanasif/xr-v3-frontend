# 07 — XR Delivery Model

**Review:** 006 — Full Platform Reframe
**Created:** 2026-08-18
**Authority:** **PM-05** · **PM-03** · **PM-06**
**Nature of this document:** **a PRODUCT / UX CONTRACT — not a final engineering architecture.**

---

## The PM's position, quoted exactly

> **PM confirmed the PRODUCT REQUIREMENT:**
> **entitlement-aware XR experiment delivery/access from the platform to the supported device.**
>
> **The PM did NOT select the final technical implementation between:**
> - direct package/application download
> - centralized XR application with downloadable modules
> - synchronization/deep-link mechanisms
> - another technically appropriate solution
>
> **Do not silently choose one during UI/UX.**

### The example the PM gave

> If **"Soil Mechanics"** is an experiment available on the webpage/platform and the user is **subscribed/entitled** to it, there must be a mechanism for that experiment to become available on the user's **headset/device**.

### What this document therefore does and does not do

| Does | Does not |
|---|---|
| Define the **product lifecycle** an entitled experiment passes through | Select a delivery mechanism |
| Define the **states** a learner must be able to perceive | Name an API, endpoint, or protocol |
| Define the **UX contract** each state must satisfy | Specify a package format or file type |
| Record **both** PM-described concepts, neither selected | Invent a synchronisation or deep-link scheme |
| Flag FRD gaps for technical resolution | Resolve them |

**Also required, from PM-03:** *"one central web portal"* must **not** be read as *"every XR runtime executes inside the browser."* FRD 1.2.2, 1.2.3, 1.2.4, 2.1.1, and 2.1.2 all place XR runtimes **outside** the browser. Only FRD 1.2.1 (web simulation) runs in it.

---

# Part 1 · The four runtime targets

| Format | FRD | Runtime | Application architecture in the FRD | Portal can execute? |
|---|---|---|---|---|
| **WEB** | 1.2.1 | Standard web browser, no XR hardware | n/a — runs in the portal | ✅ **Yes** |
| **VR** | 1.2.2 | VR headset, e.g. Meta Quest | **2.1.1** — centralized master VR application on the Meta Quest Store, acting as *"the container for downloading and launching XR simulation modules"* | ❌ No |
| **MR** | 1.2.3 | MR device, e.g. Ajna Lens | **2.1.2** — sideloaded application on the device | ❌ No |
| **AR** | 1.2.4 | Android / iOS mobile | ⚠ **NONE — see §5** | ❌ No |

### Supporting delivery requirements the FRD does define

| FRD | Requirement | Applies to |
|---|---|---|
| 2.2.1 | Modules packaged as **encrypted asset bundles**, dynamically downloaded by the master XR application | VR (explicitly), others implied |
| **2.2.2** | Modules download **only after licence validation is confirmed by the platform** | **All — this is the entitlement gate** |
| 2.3.1 | The XR application automatically downloads updated module versions | Device apps |
| 2.3.2 | Super Admin controls when versions release to production | Platform |
| 2.3.3 | Modules update **independently** of the master application | Device apps |
| 2.4.1 | B2C licences bound to an encrypted device ID **and** a user account | B2C |
| 2.4.2 | Device replacement requires **Super Admin approval** | B2C |
| 2.4.3 | Institutional deployments allow multiple students on shared devices | B2B |
| 2.4.4 | Institutional students sign into the XR app with **LMS credentials** | B2B |
| 10.1.1 | All asset bundles encrypted before distribution | All |
| **10.1.2** | Modules require **licence validation before execution** | **All — the second entitlement gate** |
| 12.2.1 | Assets delivered via CDN to reduce download latency | All |

**FRD 2.2.2 and 10.1.2 together are the existing FRD basis for PM-05.** Entitlement-aware delivery is **not a new requirement** — it is a Phase-1 requirement that the Student-only interpretation surfaced only as a restricted state, never as a delivery experience.

---

# Part 2 · The entitled-experiment lifecycle

**This is the product contract.** It holds regardless of which technical mechanism is eventually chosen.

```
┌─────────────────────────────────────────────────────────────────────┐
│ ①  DISCOVER / ASSIGNED / PURCHASED                                   │
│    B2B: stream package assigned      6.2.1 · 7.2.3                   │
│    B2C: module or bundle purchased   6.1.1 · 6.1.2 · 9.2.1           │
│    The experiment is visible to the learner in the portal.           │
└──────────────────────────────┬──────────────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│ ②  ENTITLEMENT VALIDATION                        2.2.2 · 10.1.2      │
│    The platform confirms a valid licence for this account.           │
│    ◆ Not entitled → LICENCE DENIED                                   │
└──────────────────────────────┬──────────────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│ ③  DEVICE COMPATIBILITY                          1.2.1 – 1.2.4       │
│    Which runtime does this experiment require, and does the learner  │
│    have access to it?                                                │
│    ◆ WEB → skip to ⑥                                                 │
│    ◆ Unsupported / unavailable → UNSUPPORTED DEVICE                  │
└──────────────────────────────┬──────────────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│ ④  DEVICE DELIVERY / ACCESS               ⚠ MECHANISM PENDING PM-05  │
│                                                                      │
│    The entitled experiment BECOMES AVAILABLE on the supported        │
│    device. How, is not decided. See §3.                              │
└──────────────────────────────┬──────────────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│ ⑤  AVAILABILITY STATE ON THE DEVICE                                  │
│    The learner must be able to tell where the experiment is:         │
│    available · preparing · ready · update available · failed         │
│    (12.2.1 makes waiting a real, designed experience)                │
└──────────────────────────────┬──────────────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│ ⑥  LAUNCH / SESSION                                                  │
│    WEB  → runs in the portal                              1.2.1      │
│    XR   → runs on the device                       2.1.1 · 2.1.2     │
│    Institutional sign-in with LMS credentials             2.4.4      │
│    ⚠ under SSO the learner may hold no password                      │
└──────────────────────────────┬──────────────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│ ⑦  COMPLETION / RESULT                                     D-19      │
│    Completion is recorded against the ACCOUNT, not the device.       │
│    The portal reflects account state; it does not observe the        │
│    XR session.                                                       │
│    States: COMPLETION PENDING · COMPLETION RECEIVED                  │
│    ⚠ reconciliation when a completion is never recorded is PENDING   │
└──────────────────────────────┬──────────────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│ ⑧  PLATFORM REFLECTION                          11.1.1 · D-08        │
│    Module completion evaluated → next module unlocks (D-07)          │
│    Visible to the learner (own) and, operationally, to               │
│    Faculty / Institute Admin within the tenant (1.3.4 · PM-11)       │
└─────────────────────────────────────────────────────────────────────┘
```

---

# Part 3 · The two PM-described concepts — **neither selected**

## Concept A — Direct package / application delivery

> *"The experiment/application/package can be downloaded/installed onto the target device."*

```
Platform ── validates entitlement ──▶ delivers the experiment package
                                              │
                                              ▼
                              Target device installs it as its own
                              downloadable/installable unit
```

| | |
|---|---|
| **Learner mental model** | *"I install the experiment I bought."* One experiment = one installable thing |
| **UX implications** | Per-experiment install state · per-experiment storage · per-experiment update · possible store or installer step outside the portal |
| **FRD support** | Partial. 2.2.1 packages modules as bundles, but describes them as *"dynamically downloaded by the master XR application"* — which is Concept B's framing |
| **Open** | Whether an experiment can be installed **without** a container application is never stated |

## Concept B — Centralized XR application with entitlement-controlled modules

> *"There can be one centralized application on the VR device containing/supporting the experiments, while the user only sees or can access the experiments for which the platform reports a valid subscription/entitlement."*

```
Platform ── reports entitlements ──▶ Centralized device application
                                              │
                                     shows / unlocks only the
                                     experiments the account is
                                     entitled to
```

| | |
|---|---|
| **Learner mental model** | *"I open the app and my experiments are there."* One app, a filtered library |
| **UX implications** | Single install · entitlement-filtered library inside the app · module-level rather than app-level updates · sign-in on the device becomes load-bearing (2.4.4) |
| **FRD support** | **Strong for VR.** 2.1.1 describes exactly this container; 2.2.1 has it downloading bundles; 2.3.3 updates modules without reinstalling the app; 2.4.4 has the learner signing in |
| **Open** | Whether MR (2.1.2, sideloaded) and AR (no architecture at all) follow the same pattern |

## Other concepts the PM left open

- **Synchronisation mechanisms** — the platform and device reconcile entitlement state on a schedule or trigger
- **Deep-link mechanisms** — the portal hands off to a device or app context
- **Another technically appropriate solution**

## The honest position

**FRD Section 2 leans toward Concept B for VR.** 2.1.1 ("container for downloading and launching"), 2.2.1 ("dynamically downloaded by the master XR application"), 2.3.3 ("independently of the master XR application"), and 2.4.4 (sign in to the XR application) describe a centralized-app architecture in some detail.

**That is a fact about the FRD, not a decision by the PM.** The PM explicitly declined to select, and:

- The FRD's Concept-B language addresses **VR only**
- **MR** is a *sideloaded* application (2.1.2) — a different distribution model
- **AR** has **no** application architecture in the FRD at all
- The PM's own **Concept A** remains explicitly on the table

**Therefore: no selection is made here, and the UX contract in Part 4 is written to survive either outcome.**

---

# Part 4 · Required states and screens

Every state below is required **regardless of mechanism**. This is the deliverable that lets design proceed without the pending decision.

## 4.1 Entitlement and access states

| State | Trigger | FRD | What the learner must understand |
|---|---|---|---|
| **Available / entitled** | Valid licence, compatible device | 2.2.2 | This is yours; here is how to reach it |
| **Licence denied** | Validation fails at browse or launch | 2.2.2 · 10.1.2 | Why not, and who to ask. **No internal codes** (C-07) |
| **Licence cap reached** | Institutional seat cap exhausted | 6.2.2 | Institution-managed; contact the administrator. **No purchase prompt for B2B** (D-01) |
| **Not entitled** | No licence | 2.2.2 | B2C: purchase path. B2B: contact institution |

## 4.2 Device and delivery states

| State | Trigger | FRD / PM | UX contract |
|---|---|---|---|
| **Unsupported device** | Learner's device cannot run this format | 1.2.2–1.2.4 | Name the required device honestly. **Never a non-functional launch button** (C-08) |
| **Delivery available** | Entitled + compatible; not yet on the device | **PM-05** | State what will happen next, without naming a mechanism |
| **Preparing / downloading** | Delivery in progress | 12.2.1 | **Determinate progress where possible.** CDN latency is real and designed for, not incidental |
| **Ready / installed** | Available on the device | PM-05 | Clear "you can run this now, on that device" |
| **Update available** | New version released | 2.3.1 · 2.3.2 | What changed if known; never block on an unrequested update |
| **Delivery failed** | Network or transport failure | D-18 | What happened + what to do next. Retry available |
| **Storage issue** | Insufficient device storage | ⚠ *only if technically relevant* | Held as a **conditional** state — not designed until the mechanism confirms it can occur |

## 4.3 Session and completion states

| State | Trigger | FRD / PM | UX contract |
|---|---|---|---|
| **Launch (web)** | Web simulation | 1.2.1 | Runs in the portal. Determinate asset loading |
| **Continue on device** | XR simulation ready | 2.1.1 · 2.1.2 | Instruction, not a warning (D-19) |
| **Completion pending** | Session done, not yet recorded | D-19 · A-43 | "Awaiting device completion" — a **normal** state, not an error |
| **Completion received** | Platform recorded it | D-19 · 11.1.1 | Module progresses; next module unlocks (D-07) |
| **Completion never recorded** | ⚠ Recording failure | ⚠ PENDING | Retry and refresh offered; **no manual override** — an override would defeat the gate for everyone |

## 4.4 Device management states — B2C only

| State | Trigger | FRD | Status |
|---|---|---|---|
| **Device bound** | Licence bound to a device ID + account | 2.4.1 | 🔴 **No surface exists** |
| **Replacement requested** | Learner requests a transfer | 2.4.2 | 🔴 **No surface exists** |
| **Awaiting Super Admin approval** | Request pending | 2.4.2 | 🔴 **No surface exists** |
| **Replacement approved / rejected** | Super Admin decides | 2.4.2 | 🔴 **No surface exists** · ⚠ FRD describes no rejection |

**B2B has no personal device binding** — institutional deployments use shared devices (2.4.3).

## 4.5 Screens these states imply

Full specification in `10_FULL_PLATFORM_SCREEN_INVENTORY.md`.

| Screen | Role | Status |
|---|---|---|
| Simulation access — Web / VR / MR / AR variants | Learner | **MODIFY** — exists as guidance; must carry delivery states |
| Web simulation runtime | Learner | **KEEP** |
| Device delivery status | Learner | 🔴 **NEW** |
| My devices | Learner (B2C) | 🔴 **NEW** |
| Device replacement request | Learner (B2C) | 🔴 **NEW** |
| Device replacement approvals | Super Admin | 🔴 **NEW** |
| Version release control | Super Admin | 🔴 **NEW** |
| Access restricted (licence / cap / device) | Shared state | **KEEP + EXPAND** |

---

# Part 5 · FRD gaps flagged for later technical resolution

## Gap 1 — **No AR application architecture** ⚠ *primary flag*

FRD **1.2.4** requires AR simulation support on Android and iOS. FRD **Section 2 — XR Content Delivery Architecture** then defines application architecture for exactly two targets:

- **2.1.1** Master VR Application (Meta Quest Store)
- **2.1.2** MR Device Application (sideloaded, Ajna Lens)

**There is no 2.1.3. AR has no container, no distribution channel, no packaging requirement, and no update path anywhere in the FRD.**

| Consequence | Detail |
|---|---|
| Neither PM concept is grounded for AR | Concept A has nothing to install into; Concept B has no centralized app to filter |
| Mobile distribution is unaddressed | App stores impose their own review, update, and entitlement constraints that no requirement acknowledges |
| Device binding is undefined for AR | 2.4.1 binds B2C licences to *"an encrypted XR device ID"* — whether a phone qualifies is unstated |

**Flagged for technical resolution. Not resolved, and not designed around by assuming AR behaves like VR.**

## Gap 2 — Web simulation delivery path is unstated

FRD 1.2.1 has web simulations running in a standard browser. FRD 2.2.1 (encrypted bundles) and 2.2.2 (licence-validated download) sit under *XR Content Delivery Architecture*. **Whether web simulations use the same encrypted-bundle and licence-validation path is never stated** — which affects load time, the pre-launch experience, and whether 10.1.2's execution-time gate applies in-browser.

## Gap 3 — Package / submission format undefined

FRD 2.2.1 says *"encrypted asset bundles"* and nothing further. **A Vendor cannot be shown what to upload** (FLOW 1 ①) and a delivery state cannot indicate size or type.

## Gap 4 — XR sign-in under SSO

FRD 2.4.4 requires institutional students to sign into the XR application with **LMS credentials**. FRD 4.2.2 + PM-10 make **institutional SSO** required. **An SSO-authenticated learner may hold no password to type into a headset.** Both requirements are Phase 1 and they collide.

## Gap 5 — Completion reconciliation

`D-19` makes completion account-level, and forbids inventing a cross-device mechanism. **What happens when a completion is never recorded — and how quickly a recorded one reaches the portal — is undefined.** Progression gates on recorded state, so the learner is stuck through no fault of their own.

## Gap 6 — MR sideloading authority

FRD 2.1.2 requires a **sideloaded** MR application. Sideloading is administratively gated by definition. **No requirement says who authorises or performs it** — a plausible Institute Admin capability with no FRD basis.

---

# Part 6 · Design rules for XR delivery

Binding on all downstream work.

1. **Never select a mechanism.** Until the PM or engineering decides, every delivery surface describes **outcomes** — *"this becomes available on your headset"* — never **transport**.

2. **Never show a non-functional control** (`C-08`). If the portal cannot launch it, the portal does not offer a Launch button.

3. **Never invent device control** (`C-06`). No claimed live handoff, no remote install trigger, no invented push channel. `C-06` is **retained** — PM-05 requires obtaining a mechanism, not inventing one.

4. **The portal reflects; it does not observe** (`D-19`). Completion is account state read by the portal, not an XR session watched by it.

5. **Waiting is designed.** CDN latency (12.2.1) and bundle size (2.2.1) make preparation time real. Determinate progress where the mechanism can supply it; honest indeterminate treatment where it cannot.

6. **Entitlement is checked twice, and both are visible.** Browse-time (2.2.2) and execution-time (10.1.2). A learner can pass the first and fail the second, and that must not read as a bug.

7. **Every failure says what happened and what to do next** (`D-18`), with **no internal authorization codes** (`C-07`).

8. **AR is not assumed to behave like VR.** Gap 1 is flagged, not filled.

9. **State names are mechanism-neutral.** *"Ready on your device"* survives either concept. *"Downloaded"* presumes Concept A. *"Unlocked in the app"* presumes Concept B. **Neither is used.**

---

# Summary

| | |
|---|---|
| **Product requirement** | ✅ **CONFIRMED** — entitlement-aware XR delivery/access from platform to device (PM-05) |
| **Technical mechanism** | ⚠ **PENDING — deliberately not selected** |
| **Concepts recorded** | 2 named by the PM, plus synchronisation/deep-link and "another appropriate solution" |
| **Runtime targets** | 4 — Web (1.2.1) · VR (1.2.2, 2.1.1) · MR (1.2.3, 2.1.2) · AR (1.2.4, **no architecture**) |
| **Lifecycle stages defined** | 8 |
| **States specified** | 21 across entitlement, delivery, session, and device management |
| **Screens implied** | 8 — 5 new, 2 modified, 1 kept |
| **FRD gaps flagged** | 6 — **AR application architecture is the primary flag** |
| **Existing FRD basis for the requirement** | 2.2.2 and 10.1.2 — this is **not** a new requirement |

**The UX contract in Part 4 is complete and mechanism-independent.** Detailed design of the learner-facing delivery experience can proceed now; only the transport-specific detail waits on the pending decision.
