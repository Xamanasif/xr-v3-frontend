# 10 — Super Admin Platform Model

| | |
|---|---|
| **Status** | ✅ **CURRENT SUPER ADMIN MODEL OF RECORD** |
| **Created** | 31 August 2026 |
| **Governing decisions** | `STK31-06` · `07` · `09` · `21` · `22` · `24` · `25` · `27` · `28` · `38` · `39` · `40` · `41` · `42` |
| **Note** | Batch 05 was **intentionally conservative**, and correctly so. The 31 Aug review supplies the source material its audit could not find |

---

## 1 · What changed, in one paragraph

Batch 05 concluded that *"Super Admin holds exactly two clean write actions in Phase 1 — release or hold a module version (2.3.2), and approve a device-replacement licence transfer (2.4.2) — plus one bounded read capability."* Its `R-01` … `R-14` table **refuted fourteen candidate capabilities on the explicit ground that no source named them.** **Four of those refutations are now reversed** (`R-01`, `R-02`, `R-03`, `R-04`), **two are explicitly NOT reversed** (`R-05`, `R-06`), and the role gains five capability areas that did not exist. **The batch was not wrong. It was smaller than the platform now needs, in specific, bounded places — and its own audit structure makes each one straightforward to reopen.**

---

## 2 · The confirmed Super Admin capability set — `STK31-40`

| # | Capability | Status | Decision |
|---|---|---|---|
| 1 | **Tenant requests** — a queue of institutional applications awaiting decision | 🔴 **NEW** | `STK31-20`, `STK31-21` |
| 2 | **Tenant approval** — approve / request more information, with a reason and history | 🔴 **NEW** | `STK31-20`, `STK31-21` |
| 3 | **Tenant creation** | 🔴 **NEW** — reverses `R-01` | `STK31-21` |
| 4 | **Tenant deactivation / termination** | 🔴 **NEW** — prefer reversible (`STK31-22`) | `STK31-21`, `STK31-22` |
| 5 | **Tenant Admin assignment** | 🔴 **NEW** — reverses `R-02` | `STK31-21` |
| 6 | **Tenant content allocation** — Courses and Experiments | 🔴 **NEW** — the granting end exists nowhere | `STK31-24` |
| 7 | **Technology allocation** — AR / VR / Web per allocated Experiment | 🔴 **NEW** | `STK31-15`, `STK31-24` |
| 8 | **Platform role assignment / governance** | 🟠 **EXPAND** — `SA-09` is read-only today | `STK31-41` |
| 9 | **Course/Experiment-specific Vendor / Reviewer / Content Manager mapping**; multiple people per Experiment | 🔴 **NEW** — reverses `R-03`, `R-04` | `STK31-41` |
| 10 | **Later-version Release / Hold** | ✅ **KEEP — now CONFIRMED**, no longer provisional | `STK31-07` · FRD 2.3.2 |
| 11 | **Device-transfer requests** | ✅ **KEEP** | `STK31-38` · FRD 2.4.2 |
| 12 | **Existing licensing / subscription visibility** | ✅ **KEEP + EXPAND** | `STK31-27`, `STK31-28` |
| 13 | **Institution profile / report** | 🟠 **EXPAND materially** | `STK31-42` |
| 14 | **Streams / programmes used** | 🔴 **NEW** — `SA-03` can name none today | `STK31-42` |
| 15 | **Students / users per stream** | 🔴 **NEW** | `STK31-42` |
| 16 | **Active Courses / Experiments per tenant** | 🔴 **NEW** — `SA-03` *"cannot say which experiments"* | `STK31-42` |
| 17 | **Requested / approved licences / users** | 🔴 **NEW** — now derivable from the approved request | `STK31-27` |
| 18 | **Subscription / access term · the REQUIRED 15-day expiry reminder** *(an `Expiring soon` attention surface is recommended supporting UX, not a separate requirement)* | 🔴 **NEW** | `STK31-28` |
| 19 | **Experiment usage** | 🔴 **NEW** | `STK31-42` |
| 20 | **Platform support / issues** | 🔴 **NEW** — a whole capability area | `STK31-39` |
| 21 | **Canonical / master metadata management** | 🔴 **NEW** *(shared with Content Manager)* | `STK31-09` |
| 22 | **Student deactivation as a platform override** | 🔵 | `STK31-25` |

**Five KEEP · four EXPAND · thirteen NEW.**

---

## 3 · What Super Admin explicitly does NOT do

| Prohibited | Why |
|---|---|
| **First publication of a new Experiment** | `STK31-06` · PM-16/17/18. **The Content Manager publishes** |
| **Grant / revoke an individual learner entitlement** | Batch 05 `R-05` — **still refuted.** `STK31-25` gives it to the Tenant Admin |
| **Assign content to learners or cohorts** | Batch 05 `R-06` — **still refuted.** Tenant-plane, FRD 8.1.4 / 8.1.3 |
| **Configure institutional SSO or ERP** | Batch 05 `R-08` / `R-09` — **still refuted.** FRD 4.2.2 / 7.1.x acceptance criteria assign both to the Institute Admin. Built in Batch 03 |
| **Unpublish / withdraw content** | Batch 05 `R-14` — **still refuted.** No source; it would contradict PM-16/17/18 through a side door |
| **Any assessment surface** | Batch 05 `R-07` — zero Super Admin occurrences across all eleven assessment requirements |
| **Custom role creation** | FRD 8.3.x — **Phase 3** |
| **Cross-tenant analytics dashboards** | FRD 8.2.x / 11.3.x — Phase 2. PM-11 |
| **Bundle creation and pricing** | FRD 6.3.x — Phase 2 |
| **Revenue / financial analytics** | `STK31-40`, `STK31-42` — **explicitly prohibited** |
| **Return a submission at the first-publication gate** | ⚪ `QP-26` — **still OPEN** (`ND-13`). Not granted, not refused |

> ### The altitude rule
> **Super Admin decides WHAT A TENANT MAY USE. The Tenant Admin decides WHICH LEARNER GETS WHAT.**
> Tenant-level allocation and learner-level assignment are different objects at different altitudes. Collapsing them grants a capability nobody described, and two FRD requirements assign the learner-level ones elsewhere.

---

## 4 · The publish / release firewall — `STK31-06` + `STK31-07`

```
   NEW EXPERIMENT
   Vendor → Academic Reviewer → CONTENT MANAGER → PUBLISHED
                                    ▲
                                    └── FIRST PUBLICATION.  Content Manager.  Word: PUBLISH
                                        Super Admin is NOT the first-publication owner


   ALREADY-PUBLISHED EXPERIMENT
   current released version → newer approved version → SUPER ADMIN
                                                            │
                                                     RELEASE  or  HOLD
                                                            ▲
                        Word: RELEASE / HOLD.  Never "publish".
                        Reason given: Super Admin has platform-wide visibility into
                        who is using the existing version, and can manage / notify
                        affected users before replacement.
```

> 🔴 **A known live collision to fix in the unified build.** Batch 05 firewalled *"release"* to mean *not publication*. **Batch 01's shipped copy uses *"release"* to mean publish, in four strings.** Both batches are internally correct. **The smaller side changes:** Batch 01's four strings become *publish*.

> 🔴 **Two version schemes must also be reconciled.** Batch 01's `version` is an **integer counting correction rounds** (a submission reaches *published v3*); Batch 05's is a **semver string on a published module** (`1.4.0 → 1.5.0`). **Nothing connects them.** The unified model needs either one scheme or an explicit statement that these are two different objects. See `17_CONCEPTUAL_DATA_AND_STATE_MODEL.md`.

---

## 5 · Institution profile and reporting — `STK31-42`

Supported operational information:

| Item | Exists today? |
|---|---|
| Tenant identity | ✅ Batch 05 `SA-02` / `SA-03` |
| Tenant Admin | 🔴 new |
| Active content / access | 🟠 Batch 05 shows a **boolean** and a **count of streams** — it *"cannot say which experiments"* |
| Number and names of streams | 🔴 new — a scalar count today, naming none |
| Student / user counts | 🔴 new |
| Students / users by stream, where available | 🔴 new |
| **Licence / user quantity** | 🔴 new — now derivable from the **approved request** (`STK31-27`) |
| **Subscription / access term** | 🔴 new (`STK31-28`) |
| Assigned Courses / Experiments | 🔴 new |
| **Technology selection** | 🔴 new (`STK31-15`) |
| Usage / completion indicators | 🔴 new |
| **Issues requiring attention** | 🔴 new — incl. **15-day expiry** and support issues |

> **No revenue metrics may be invented** (`STK31-42`). **PM-11 is scoped, not overridden**: every item above is an operational fact the platform holds or will hold, not a derived KPI.

**Reuse note.** Batch 03 models institution data with a full failure taxonomy — *"26 records not applied"* with **which records and why**; Batch 05 shows only the boolean outcome. The expanded `SA-03` should consume Batch 03's richer model rather than re-deriving it.

---

## 6 · Platform role governance — `STK31-41`

Super Admin governs **Vendor · Academic Reviewer · Content Manager**.

```
GLOBAL                              PER-CONTENT
role-holder registry                assignment
· who holds which platform role     · this Vendor for this Course
· account governance                · this Reviewer for this Experiment
                                    · this Content Manager for this Course
                                    · MULTIPLE people may be associated
                                      with ONE Experiment where required
```

**Do NOT assume assignment is global-only.** Both levels exist.

> **Batch 05 `SA-09` states on-screen:** *"No institutional person appears on this screen. No institutional role can be assigned from here."* The **first sentence stays true** — institutional people are the Tenant Admin's, per `STK31-25`. **The second is superseded** for platform roles.

**The remaining gap.** `QD-02` asked *how does anyone become a role-holder in Phase 1?* `STK31-41` answers **who assigns**, not **how an identity first exists**. FRD 7.4.2 (IdP role mapping) and 8.3 (custom roles) are both **Phase 3**. **Safe handling:** design assignment against an identity that already exists; show origin as a **provenance line**; invent no invitation or account-creation mechanism.

---

## 7 · Licensing, terms and expiry on the platform side

| Surface | Content | Rule |
|---|---|---|
| Licensing / access visibility (`SA-08`) | Access records as they stand · **licence/user quantity from the approved request** · access term | ✅ **No seat figure that does not come from an approved request** (`STK31-27`) — validating Batch 05 `R-10` |
| Access-term states | Active · **Expiring soon (T-15 days)** · Expired · Renewed | **No automatic renewal, payment or charge is assumed** (`STK31-28`, `ND-11`) |
| **The 15-day reminder** | **REQUIRED** — the Tenant must receive an expiry reminder 15 days ahead | 🟠 **The delivery channel is PENDING** (`ND-16`). ⛔ Do not invent e-mail, SMS, push or a provider |
| Attention surfacing | An `Expiring soon` row on the platform overview and the institution report | 🔵 **RECOMMENDED SUPPORTING UX — a design choice, not a separate stakeholder requirement.** It does not discharge the reminder |

🔴 **Do NOT restore arbitrary sample caps such as 5,400.**

---

## 8 · Platform configuration

**Batch 05's configuration *register* pattern is kept unchanged** — every candidate configuration area listed with its real source status, and **zero invented controls**.

> **The platform-wide rule this establishes:** *a gap is shown as a gap, never as a disabled control.* **Adopt it across the unified build.**

---

## 9 · What Batch 05 got right and must not be "corrected"

| Position | Status |
|---|---|
| No seat, cap or capacity figure | ✅ **Validated by `STK31-27`** |
| No publish control | ✅ **Validated by `STK31-06`** |
| No unpublish / withdraw | ✅ Still refuted (`R-14`) |
| No assessment surface of any kind | ✅ Still refuted (`R-07`) |
| No institution SSO / ERP configuration | ✅ Still refuted (`R-08`, `R-09`) |
| Mechanism-neutral release copy | ✅ `QT-01` still pending |
| Configuration as a **register**, not a settings page | ✅ Kept |
| `R-05` / `R-06` — learner-level entitlement and assignment | ✅ **Still refuted.** Tenant-plane, per `STK31-25` |
| **The authority-audit method itself** — classify every candidate against verbatim sources | ✅ **The most transferable asset in the batch. Apply it to the new capability areas** |
