# 01 — Stakeholder Decision Index

| | |
|---|---|
| **Status** | ✅ **CURRENT SOURCE OF TRUTH INDEX** |
| **Created** | 31 August 2026 |
| **Authority** | `ui-ux/00-project-context/STAKEHOLDER_CONFIRMED_UPDATE_2026-08-31.md` — the decisions live there. **This is the index, not the record** |
| **Source** | 31 Aug stakeholder review · stakeholder-confirmed follow-up · handwritten meeting notes · direct user clarification |

> **The stakeholder's formal company title is not asserted anywhere in this package.**

---

## How to read this index

Every row points at a decision in the update file. **The update file is authoritative; this table exists so a reader can find a decision by subject rather than by number.**

| | |
|---|---|
| ✅ | CONFIRMED — settled outright. Build against it |
| 🔵 | DIRECTIONAL — clear instruction; the surface still needs design |
| 🟠 | CONFIRMED, one named detail pending. **Not a blocker** |

---

## A · By subject

### Roles and authority

| ID | Decision | Conf. | Where it lands |
|---|---|:---:|---|
| `STK31-01` | Seven roles. **Student and Learner are ONE role**, two contexts | ✅ | `04` · `09` |
| `STK31-02` | **Institute Admin = Tenant Admin** — one formal role. Label pending | ✅🟠 | `04` · `07` |
| `STK31-03` | **Internal content teams operate through the Vendor role.** No new roles | ✅ | `04` |
| `STK31-47` | One unified product, designed from the complete journey | ✅ | `15` |
| `STK31-48` | Historical prototypes preserved unchanged | ✅ | `13` |

### Delivery priority

| ID | Decision | Conf. | Where |
|---|---|:---:|---|
| `STK31-04` | **B2B is the current delivery priority.** Direct self-service B2C deferred | ✅ | `03` · `06` |
| `STK31-05` | B2C periods preserved — **Monthly · Quarterly · Yearly · no Lifetime** | ✅ | `03` · `06` |

### Content production and release

| ID | Decision | Conf. | Where |
|---|---|:---:|---|
| `STK31-06` | **FIRST PUBLICATION = Content Manager.** Not Super Admin | ✅ | `04` · `05` |
| `STK31-07` | **LATER VERSION RELEASE / HOLD = Super Admin.** Terminology firewall | ✅ | `04` · `10` |
| `STK31-08` | Content responsibility model. **Academic Reviewer owns Learning Outcomes** | ✅ | `04` · `05` |
| `STK31-46` | An Experiment maps to a Course; a Course holds several | ✅🟠 | `05` |

### Content model and metadata

| ID | Decision | Conf. | Where |
|---|---|:---:|---|
| `STK31-09` | Canonical metadata — **Content Manager AND Super Admin** | ✅ | `05` · `10` |
| `STK31-10` | Academic streams/programmes are **platform-controlled** | ✅ | `05` |
| `STK31-11` | Tenant-specific mappings. **Semester is OPTIONAL, never mandatory** | ✅ | `05` · `07` |
| `STK31-12` | Hierarchy — **Programme/Department Bundle → Course sub-bundles → Experiments → Available Technologies** | ✅ | `05` |
| `STK31-13` | The **3-module Bundle model is superseded** | ✅ | `05` |
| `STK31-14` | **`Experiment` is the canonical planning term.** No Course→Module→Experiment triple | ✅🟠 | `05` · `13` |
| `STK31-15` | **Technology-specific access.** Institution selects AR/VR/Web combinations | ✅🟠 | `05` · `06` · `11` |
| `STK31-45` | **MR is retained** as inherited source-supported capability | ✅ | `11` |

### Public catalogue and B2B access

| ID | Decision | Conf. | Where |
|---|---|:---:|---|
| `STK31-16` | **Public discovery before login is required** | ✅ | `06` |
| `STK31-17` | Public Experiment detail content set, incl. **Learning Outcomes** and preview | ✅ | `06` |
| `STK31-18` | **The B2B cart is a selection basket + request preparation, not a checkout** | ✅ | `06` |
| `STK31-19` | **Internal / collaborator route may skip payment.** Access still tracked | ✅🟠 | `06` |
| `STK31-20` | External route: request → **Super Admin approval** → payment → activation. **No access before approval** | ✅ | `06` · `07` |

### Tenants

| ID | Decision | Conf. | Where |
|---|---|:---:|---|
| `STK31-21` | **Super Admin owns tenant approval, creation, governance, termination and Tenant Admin assignment** | ✅ | `07` · `10` |
| `STK31-22` | **Prefer reversible deactivation over deletion** | ✅ | `07` · `10` |
| `STK31-23` | **A campus/unit may be its own Tenant.** No sub-tenant level | ✅🟠 | `07` |
| `STK31-24` | **Super Admin controls tenant content and technology allocation** | ✅ | `07` · `10` |
| `STK31-25` | Tenant Admin responsibilities, incl. **content assignment from the approved set** | ✅ | `07` |
| `STK31-26` | CSV field set. **`Plan Terms` included, mandatory status pending** | ✅🟠 | `07` |
| `STK31-27` | Licence/user quantity comes from the request. **No universal seat cap** | ✅ | `07` · `10` |
| `STK31-28` | Access term + a **REQUIRED 15-day pre-expiry reminder to the Tenant** *(channel pending)*. No automatic renewal assumed | ✅🟠 | `07` · `10` |

### Faculty, assessment, learning

| ID | Decision | Conf. | Where |
|---|---|:---:|---|
| `STK31-29` | Faculty workspace scope — **operational learning analytics only** | ✅ | `08` |
| `STK31-30` | **Faculty owns assessment configuration.** MCQ · True/False · Descriptive | ✅ | `08` |
| `STK31-31` | **Faculty is the ONLY human descriptive evaluator.** Optional auto-review assists | ✅🟠 | `08` |
| `STK31-32` | **Faculty controls answer/explanation visibility.** BITS = Taxila-reference pending | ✅🟠 | `08` |
| `STK31-33` | AI question generation **from uploaded source material / context** | ✅ | `08` |
| `STK31-34` | Question Bank — **`Add` · `Edit` · `Delete`** · AI-accept · import. History preserved | ✅ | `08` |
| `STK31-35` | Assessment may be **portal-external and/or embedded**. Integration boundary documented only | 🔵 | `08` · `11` |
| `STK31-36` | **Progress must be expressible per assigned technology** | ✅ | `09` |
| `STK31-43` | Faculty/tenant reporting content | ✅ | `08` |

### XR delivery, devices, support

| ID | Decision | Conf. | Where |
|---|---|:---:|---|
| `STK31-37` | AR/VR = **package**; Web/WebGL = **hosted link**. No source code required | ✅🟠 | `11` |
| `STK31-38` | One authorised device. **Transfer → Super Admin approval** | ✅ | `11` |
| `STK31-39` | **Help / support is required**, both ends | ✅🟠 | `12` |

### Platform governance

| ID | Decision | Conf. | Where |
|---|---|:---:|---|
| `STK31-40` | Super Admin capability expansion | ✅🔵 | `10` |
| `STK31-41` | **Platform role assignment may be Course- or Experiment-specific** | ✅ | `10` |
| `STK31-42` | Super Admin institution reporting content | ✅🔵 | `10` |
| `STK31-44` | **SSO, with a platform-authentication fallback** | ✅🟠 | `06` · `07` |

---

## B · What this review closed

**Twelve preserved ambiguities and thirteen open questions.** Recorded so nobody re-opens them.

| Was open | Now |
|---|---|
| `PM29-A1` / `PQ-01` — version release ownership | ✅ `STK31-06` + `STK31-07` — **two owners, two objects** |
| `PM29-A2` / `PQ-02` — what a Bundle is | ✅ `STK31-12` + `STK31-13` |
| `PM29-A3` / `PQ-05` — learner-assignment owner | ✅ `STK31-25` — **Tenant Admin** |
| `PM29-A4` / `PQ-03` — B2B approval actor | ✅ `STK31-20` + `STK31-21` — **Super Admin, in-product** |
| `PM29-A6` / `PQ-06` — cart vs request list | ✅ `STK31-18` — **selection basket + request** |
| `PM29-A7` / `PQ-11` *(topology half)* | ✅ `STK31-23` — **separate tenants** |
| `PM29-A8` / `PQ-12` — Student vs Learner | ✅ `STK31-01` — **one role** |
| `PM29-A9` / `PQ-04(b)` — what *Programme* is | ✅ `STK31-12` — **academic grouping, not the deferred certification node** |
| `PM29-A10` / `PQ-13` — is MR still in scope | ✅ `STK31-45` — **yes** |
| `PM29-A11` / `PQ-08` — technology, level or property | ✅ `STK31-15` — **selectable dimension** |
| `PM29-A12` / `PQ-14` — what *analytics* means | ✅ `STK31-29` — **operational learning analytics** |
| `PM29-16` / `PQ-04(a)` — Module or Experiment | ✅ `STK31-14` — **Experiment** |
| `PQ-09(a)` — is Tenant Admin the same role | ✅ `STK31-02` — **yes** |
| `PQ-10` — the learner metadata read-back | ✅ `STK31-26` *(+ `STK31-11` on Semester)* |
| `PQ-15` — Vendor/Reviewer governance scope | ✅ `STK31-41` — **both, at course and experiment level** |
| 🔴 `QP-02` — **who grades descriptive answers** | ✅ `STK31-31` — **Faculty.** *The only open item that could strand a learner* |
| 🔴 `QP-27` — post-attempt feedback policy | ✅ `STK31-32` — **Faculty-controlled**, BITS pending |
| `PQ-21` — institutional access duration | ✅ `STK31-28` |

---

## C · What is deliberately still open

**Sixteen non-blocking details (`ND-01` … `ND-16`) plus the standing technical register.** Full treatment in `16_REMAINING_NONBLOCKING_DETAILS.md`.

> **These are implementation details, not unconfirmed decisions.** Every `STK31-nn` decision is **current and authoritative** and is **not reopened**.

> **None of them blocks the start of unified implementation.** Each has a safe, reversible UX handling recorded.

**Still open and untouched by this review:** `QP-26` *(Super Admin return at the publication gate)* · `QT-01` *(XR delivery mechanism — pending by explicit PM-05 instruction)* · `QT-02` *(no AR application architecture in the FRD)* · `QT-03` *(assessment API contract)* · `QT-04` *(XR sign-in under SSO)* · `QP-14` *(MR sideloading authority)* · `QD-01` *(editable vs institution-owned fields)* · `QD-07` *(metadata schema)* · `QD-08` *(curriculum validation rubric)* · `QX-01` / `QX-02` *(viewport and reflow across all workspaces)* · `QX-03` *(caption / transcript / audio-description ownership)*.
