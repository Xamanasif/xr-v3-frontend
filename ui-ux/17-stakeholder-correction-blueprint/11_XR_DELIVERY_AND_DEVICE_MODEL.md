# 11 — XR Delivery and Device Model

| | |
|---|---|
| **Status** | ✅ **CURRENT DELIVERY MODEL OF RECORD** |
| **Created** | 31 August 2026 |
| **Governing decisions** | `STK31-15` · `35` · `36` · `37` · `38` · `45` |
| **Standing constraint preserved** | **PM-05** — the *product requirement* (entitlement-aware delivery) is confirmed; the **technical mechanism is NOT selected**. `QT-01` remains open **by explicit instruction** |

---

## 1 · The delivery model — `STK31-37`

| Technology | Delivery model | Vendor submits |
|---|---|---|
| **AR** | **Downloadable / authorised package** | A compiled package |
| **VR** | **Downloadable / authorised package** | A compiled package |
| **MR** | Sideloaded application (FRD 2.1.2) — **retained**, see §3 | A compiled package |
| **Web / WebGL** | **Hosted / deployed** experience represented by a **link** | A hosted link |

**Vendor submission may include a compiled package OR a hosted link, depending on the technology.**

> ### Two prohibitions
> **1. Source code is NOT required from the Vendor** unless another source explicitly demands it. No source does.
> **2. No backend or storage provider is selected here.** Not a CDN, not an object store, not a delivery network.

---

## 2 · What is still not selected — and why that is correct

**PM-05 confirmed the product requirement and explicitly declined to choose between:**

| Concept | Description |
|---|---|
| **A** | The experiment/application/package **can be downloaded/installed** onto the target device |
| **B** | **One centralized application on the VR device** contains/supports the experiments, and the user sees only those for which the platform reports a valid entitlement |
| — | Synchronisation / deep-link mechanisms · another technically appropriate solution |

**`STK31-37` refines the *packaging*, not the *mechanism*.** It says AR/VR are package-shaped and Web is link-shaped. It does **not** say whether a package is installed directly or delivered inside a container application.

> **`QT-01` remains open, pending by explicit PM-05 instruction.** Batch 01's XR access design is **deliberately mechanism-neutral** and survives every answer. **Do not resolve it during UI/UX.**

**FRD position, for reference — it leans but does not decide.** FRD 2.1.1 describes a centralized master VR application acting as *"the container for downloading and launching XR simulation modules"*, with 2.2.1 (encrypted asset bundles), 2.3.1–2.3.3 (module updates without app reinstallation) and 2.4.4 (session-based device login). That corresponds closely to **Concept B for VR**. **FRD Section 2 defines no application or packaging architecture for AR at all** (`QT-02`, HIGH, open), and whether **Web** simulations use the same encrypted-bundle and licence-validation path is unstated (`Q-16`).

---

## 3 · The four formats — MR is retained

`STK31-45`. The 31 Aug review used the shorthand **AR · VR · WebGL**. **An omission in a spoken list is not a decision.**

| FRD | Format | Runtime | Status |
|---|---|---|---|
| 1.2.1 | **Web** | Standard browser, no XR hardware | ✅ In scope |
| 1.2.2 | **VR** | VR headsets — master application (2.1.1) | ✅ In scope |
| **1.2.3** | **MR** | **MR hardware (e.g. Ajna Lens) — sideloaded application (2.1.2)** | ✅ **RETAINED** |
| 1.2.4 | **AR** | Android / iOS mobile | ✅ In scope — ⚠ **no FRD application architecture exists** (`QT-02`) |

> **MR = inherited source-supported capability unless explicitly removed. It must not be silently dropped.**
> MR carries its own Phase-1 requirements (1.2.3 runtime, 2.1.2 application) and its own open question — **`QP-14`: who authorises and performs MR sideloading.** Batch 01 designs **all four** format badges and **all four** device-compatibility states, and **none is removed**.

**Product copy rule.** *"WebGL" appears in no source.* The FRD says *"standard web environments"* / *"standard web browser"*. **Use `Web` in product copy; carry `Web / WebGL` only as internal planning vocabulary.**

---

## 4 · Technology as a selectable, separately licensable dimension — `STK31-15`

An institution selects which technologies it receives for an Experiment: **AR only · VR only · Web only · AR + Web · VR + Web · AR + VR · all available.**

Selection depends on **hardware availability · institution requirements · commercial/access arrangement**. **Access, licensing and pricing may differ by selected technology. No actual prices are invented** (`ND-08`).

### What this changes across the delivery chain

```
VENDOR SUBMISSION
   · one Experiment, several technology implementations
   · a package per device technology, a link for Web
        ▼
CANONICAL RECORD
   · technology availability is central metadata (STK31-09)
        ▼
SUPER ADMIN TENANT ALLOCATION
   · Course · Experiment · TECHNOLOGY VARIANT            STK31-24
        ▼
TENANT'S APPROVED SET
   · carries which technologies were granted
        ▼
TENANT ADMIN ASSIGNMENT
   · a Student or group receives the Experiment in the granted technologies
        ▼
LEARNER
   · sees only the technologies they are entitled to and their device supports
   · PROGRESS IS TRACKED PER TECHNOLOGY                   STK31-36
```

> 🔴 **Today, every batch redefines the format enum as a private constant map, and one experiment carries a data contradiction across batches.** The unified build needs **one technology enum, one label set, and one device sentence per format** — a design-only reconciliation that needs no further decision.

---

## 5 · Progress per technology — `STK31-36`

See `09_STUDENT_LEARNING_PROGRESS_MODEL.md` §3 for the full model. In delivery terms:

| Rule | Consequence for delivery |
|---|---|
| Progress is expressed **per assigned technology** | A completion event must identify **which technology** it came from |
| Three technologies must not collapse into one ambiguous state | The roll-up must state **which technologies it covers** |
| One assigned technology renders as today | The dimension adds no noise where it carries no information |

**This has an integration consequence** (`STK31-35`): whatever returns completion, time spent and progress must carry a **technology identifier**. **The contract itself is not designed here** — `QT-03` is open.

---

## 6 · Device licensing and transfer — `STK31-38`

```
   ONE AUTHORISED LICENCE / DEVICE RELATIONSHIP        FRD 2.4.1 — preserved
              │
              │  🔴 no device registry exists anywhere
              │     the platform has a device TRANSFER approval
              │     with no device REGISTRY behind it
              ▼
   STUDENT REQUESTS TRANSFER                            🔴 LRN-17 — not built
              ▼
   SUPER ADMIN REVIEWS / APPROVES                       ✅ built — SA-06 / SA-07
              ▼
   AUTHORISED DEVICE BINDING CHANGES                    FRD 2.4.2
```

**Do not generalise into arbitrary licence administration.** **Device registration and remote configuration are Phase 2** (FRD 2.5.x / 2.6.x).

⚠ **Two recorded gaps, shown as gaps and not invented:**
1. **No device registry** — the binding exists as a relationship, not as an administrable record.
2. **No decline path** on a transfer request — Batch 05's record has exactly two states because the requirement contains no rejection behaviour.

---

## 7 · The integration boundary — `STK31-35`

**Documented, not implemented.**

```
   PLATFORM (portal)                            EXPERIMENT / APPLICATION
   ─────────────────                            ────────────────────────
   assessment configuration        ──────────▶  rendered inside the app, where embedded
   entitlement + granted           ──────────▶  what this learner may run,
     technologies                                and in which technology
                                   ◀──────────  completion            (per technology)
                                   ◀──────────  time spent            (FRD 11.1.2)
                                   ◀──────────  progress / result     where applicable
```

> ⛔ **Do NOT implement any API or backend now.** No endpoint, payload, contract, schema or field type is proposed by this document.

**Standing open items this boundary depends on, none resolved here:** `QT-01` XR delivery mechanism · `QT-02` AR application architecture · `QT-03` assessment configuration API contract · `QT-04` XR sign-in under SSO (FRD 2.4.4 device login vs 4.2.2 institutional SSO) · `Q-42` recovery when a completion event never arrives · `Q-43` server-authoritative assessment timer.

---

## 8 · What this model deliberately does NOT contain

| Not modelled | Why |
|---|---|
| A selected delivery mechanism (Concept A vs B vs deep-link) | **PM-05** — explicitly not selected. `QT-01` |
| A package format, encryption scheme, or bundle specification | FRD 2.2.1 names encrypted asset bundles; the format is a pending technical decision |
| An AR application architecture | **`QT-02`** — the FRD defines none, and `STK31-37` does not supply one |
| A backend, storage provider, CDN or delivery network | Out of scope by instruction |
| A device registry or remote management surface | FRD 2.5.x / 2.6.x — **Phase 2** |
| A decline path on a device-transfer request | No source contains one — **shown as a gap** |
| Who authorises MR sideloading | **`QP-14`** — open |
| Any API endpoint, payload or schema | `STK31-35` — **boundary only** |
