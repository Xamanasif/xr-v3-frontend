# 08 — Shared Shell and Navigation Model

| | |
|---|---|
| **Status** | 🟠 **STRUCTURAL PLANNING — DRAFT.** Candidate planes and a **draft** navigation map. **Final navigation is Stage 6 and is not created here** |
| **Created** | 29 August 2026 |
| **Prohibited by** | `11_SAFE_WORK_BEFORE_MONDAY.md` **N7** — *"Final navigation — nine workspaces, and the new surfaces are not yet scoped"* |
| **What this is instead** | Which shells the product needs, whether **one** shell can serve them, and where every candidate nav item **already comes from** |

---

## 1 · The finding

> **One shell already serves five batches, seven roles and forty-five screens. It was designed to.**

Batch 01 §3 states the rule that made it work:

> *"One shell serves all seven roles. **Role differences come from navigation content, permissions, actions and data — never from different chrome.**"* (`QX-06`)

Batches 02, 03, 04 and 05 each consumed it and **none broke it**. Batch 05 added a second nav level and stopped there. Batch 04 adjusted two chrome rules at narrow widths and **wrote both adjustments into its own sheet rather than editing Batch 01's**.

**So the question is not whether one shell can adapt.** It is whether the **public plane** — which has no role, no workspace and no signed-in identity — belongs inside it.

---

## 2 · The four planes

| # | Plane | Who is there | Chrome needs | Exists today? |
|---|---|---|---|---|
| **P1** | **PUBLIC** | No account | Marketing-adjacent header · **no side nav** · no account control · entry actions | 🔴 **No** |
| **P2** | **PLATFORM WORKSPACE** | Super Admin · Content Manager · Academic Reviewer · Vendor | The Batch-01 shell · workspace context label · queue-first nav | ✅ **Yes** — Batches 01 + 05 |
| **P3** | **TENANT WORKSPACE** | Tenant/Institute Admin · Faculty · Student | The Batch-01 shell · **institution** context label | ✅ **Yes** — Batches 02 + 03 |
| **P4** | **LEARNER EXPERIENCE** | Student *(in P3)* · Individual Learner *(standalone)* | The Batch-01 shell · minimal nav | ✅ **Yes** — Batches 01, 02, 03, 04 |

### 2.1 Can one shell adapt by role and context?

**For P2, P3 and P4: yes, demonstrably — it already does.** Five batches, one chrome, zero divergence.

**For P1: the answer is no, and the reason is structural rather than aesthetic.**

| Shell element | P2 / P3 / P4 | P1 |
|---|---|---|
| Side navigation, 232px | The organising device | **Nothing to navigate.** A visitor has no workspace |
| Workspace context label | *"LEARNER · Sample Engineering Institute"* | **No workspace, no organisation** |
| Account control | Initials · name · role caption | **No account** |
| Breadcrumb | Depth ≤ 2 within a workspace | Catalogue → Course → Experiment — a **content** path, not a workspace path |
| Primary width | Desktop-first 1440, verified 1280 | ⚠ **A public catalogue is not a desktop-only surface in practice** — `QX-01`/`QX-02` |

> **The measured consequence, already recorded in Batch 04:** *"Below roughly 520px the shared shell's fixed 232px sidebar leaves too little content width and small overflows appear. That sidebar is Batch-01 platform chrome; collapsing it is a platform-level decision, not a Batch-04 one."*
>
> **A public catalogue makes that platform-level decision unavoidable.** It is the first surface with no sidebar content and the first with a genuinely non-desktop audience.

### 2.2 The recommended structure

```
                    ONE DESIGN SYSTEM  (tokens · components · state grammar)
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        ▼                                                       ▼
  ┌───────────────┐                              ┌──────────────────────────┐
  │  PUBLIC SHELL │                              │   WORKSPACE SHELL        │
  │      P1       │                              │   P2 · P3 · P4           │
  │               │  ── sign in / register ──▶   │                          │
  │ header only   │                              │ header + side nav +      │
  │ no side nav   │  ◀── sign out ──             │ context label + account  │
  │ no account    │                              │                          │
  │ content       │                              │ adapts by ROLE via nav   │
  │ breadcrumb    │                              │ CONTENT only — never     │
  └───────────────┘                              │ different chrome         │
                                                 └──────────────────────────┘
```

**Two shells, one design system.** The public shell is not a second product — it shares every token, every component, every status-badge grammar and every accessibility primitive. It differs only in the chrome that presupposes an account.

> ⚪ **Not decided here.** An alternative is one shell whose side nav collapses to nothing when unauthenticated. It is recorded because it is defensible; it is not recommended, because "the nav is empty" and "there is no nav" produce different layouts, different breadcrumbs and different responsive rules, and a collapsed-to-nothing sidebar tends to leave its 232px assumption behind in the grid.

---

## 3 · Candidate navigation sources — every item traced

**No responsibility is created below. Every item is either built, inventoried, or explicitly marked as new-and-pending.**

Legend — ✅ built · 🟠 inventoried, not built · 🔴 new, not designed · ⛔ blocked by PM

### 3.1 PUBLIC — P1

| Item | Status | Source |
|---|---|---|
| Catalogue | 🔴 as public | Batch 04 `#/explore` — **components reusable** |
| Courses ⟦S1⟧ | 🔴 | No course page in any batch |
| Institution entry | 🔴 | `PM29-06` |
| Individual entry | 🔴 | `PM29-06` |
| Sign in | 🔴 | `AUTH-01` — never designed |
| Register | 🔴 | `AUTH-03` — never designed |

### 3.2 PLATFORM — P2

**Super Admin** — Batch 05, `#/overview` · `#/institutions` · `#/releases` · `#/device-requests` · `#/licensing` · `#/platform{/roles,/configuration}`

| Item | Status | Note |
|---|---|---|
| Overview | ✅ `SA-01` | Attention list, **no KPI, no chart** — `PM-11` |
| Institutions | ✅ `SA-02` / `SA-03` | Read-only today; `PM29-22` makes that **too conservative** |
| **Tenant requests** | ⛔ **BLOCKED** | **`PQ-03` — actor open.** Exists only if the approver is in-product |
| **Tenant content allocation** | 🔴 **NEW** | `PM29-23`. ✅ **The receiving end already exists** (Batch 03); the granting end does not. ⚪ unit open |
| Releases | ✅ `SA-04` / `SA-05` | ⚪ **Ownership ambiguous** — `PQ-01`. **Keep meanwhile** |
| Device requests | ✅ `SA-06` / `SA-07` | Unchanged. Completes once `LRN-16`/`LRN-17` exist |
| Licensing | ✅ `SA-08` | Visibility only, **no seat figure** — validated by `PM29-20` |
| Platform roles | ✅ `SA-09` **read-only** | ⛔ Write is `PM29-22`; **mechanism still `QD-02`** |
| Configuration | ✅ `SA-10` | A **register**, not a settings page. Zero invented controls |
| Vendor / Reviewer governance | ⛔ **BLOCKED** | `PQ-15` — scope unknown: global? per course? per experiment? |

**Vendor** — ✅ Batch 01: `Submissions` · `New Submission`
**Academic Reviewer** — ✅ Batch 01: `Review Queue` · `Review History`
**Content Manager** — ✅ Batch 01: `Review Queue` · `Reviewed Content` · `Published Content` ⚠ *(`Published Content` is `DA-06`, **reversible** — post-publication management is not PM-confirmed)*

### 3.3 TENANT — P3

**Tenant / Institute Admin** — Batch 03, `#/admin/*`. ⚠ **Role label pending `PQ-09`.**

| Item | Status | Note |
|---|---|---|
| Overview | ✅ `INA-01` | Operational status only — `PM-11` |
| People | ✅ `INA-02` / `INA-03` | Two inventory rows merged into a directory with a role filter |
| Academic Structure | ✅ `INA-04` / `INA-05` | **View only** — course creation is Phase 2 |
| Content Access | ✅ `INA-06` / `INA-07` / `INA-08` | 🔵 **Origin actor now supplied** by `PM29-23` — one line changes, the model does not |
| Institution Setup | ✅ `INA-09` / `INA-10` / `INA-11` / `INA-12` | SSO · institution data · records needing attention |
| **User provisioning — manual** | 🔴 **NEW** | `PM29-10`. Batch 03 `DA-04`: *"no such control exists"* |
| **CSV import** | 🔴 **NEW** · ⛔ schema | `PM29-10` · `PQ-10`. **Pattern is safe, columns are not** |
| Learner assignment | ⛔ **BLOCKED** | `PQ-05` — `DA-07` holds meanwhile, **claiming no assigner** |

**Faculty** — Batch 02, `#/faculty/*`

| Item | Status | Note |
|---|---|---|
| Assessments | ✅ `FAC-06` / `FAC-07` | Builder: questions · settings · assign, with a completeness rail |
| Question Bank | ✅ `FAC-08` | Upload → **per-row** validation → error report → commit |
| AI question drafts | ✅ `FAC-09` | Mandatory faculty review |
| **Experiments available to the tenant** | 🔴 **NEW** | `PM29-11`. **No Faculty browse surface exists.** `FAC-02`/`FAC-03` inventoried, never built. **Batch 04's catalogue is the reuse candidate** |
| Student progress / usage | 🟠 **Minimal** | `FAC-05`/`FAC-10` inventoried, not built. Kept small per `PM-11` |
| *"Analytics"* | ⛔ **BLOCKED** | `PQ-14` — points against PM-11. **No metric is invented** |

**Student** — Batches 01/02/03, `#/learner/*`

| Item | Status |
|---|---|
| My Learning | ✅ `LRN-02` — built in **three** batches |
| Progress | ✅ `LRN-13` |
| *(experiment · resources · simulation · assessment reached from My Learning)* | ✅ Batches 01 + 02 |

### 3.4 INDIVIDUAL — P4

**Individual Learner** — Batch 04. ⚠ **`Student` vs `Learner` as two product terms is `PQ-12`.**

| Item | Status | Note |
|---|---|---|
| My Learning | ✅ `LRN-02` individual variant | ▶ **The convergence point** |
| Explore / Catalogue | 🔵 **Position moves** to public | Components survive |
| Progress | 🟠 Signpost in Batch 04; ✅ built in Batches 01/02 |
| Access history | ✅ `B2C-07` | `DA-07` — *inventoried, not required*, **reversible** |
| **Device binding / replacement request** | 🔴 **MISSING** | `LRN-16`/`LRN-17`. 🟠 **The approval end exists** (Batch 05 `SA-06`/`SA-07`) — **a half-built cross-plane workflow** |

---

## 4 · Draft unified navigation map

⚠ **DRAFT. Every uncertain entry is marked. Nothing here is a decision.**

```
PUBLIC ─────────────────────────────────────────────────────────────
  Catalogue · Courses⟦S1⟧ · For institutions🔴 · For individuals🔴
  · Sign in🔴 · Register🔴

PLATFORM ───────────────────────────────────────────────────────────
  SUPER ADMIN
    Overview ✅ · Institutions ✅ · Tenant requests ⛔PQ-03
    · Tenant content allocation 🔴PM29-23 · Releases ✅⚪PQ-01
    · Device requests ✅ · Licensing ✅
    · Platform ▸ Roles ✅read-only⛔write · Configuration ✅
  CONTENT MANAGER   Review Queue ✅ · Reviewed Content ✅ · Published Content ✅DA-06
  ACADEMIC REVIEWER Review Queue ✅ · Review History ✅
  VENDOR            Submissions ✅ · New Submission ✅

TENANT ─────────────────────────────────────────────────────────────
  TENANT / INSTITUTE ADMIN ⚠label PQ-09
    Overview ✅ · People ✅ + provisioning 🔴 + CSV 🔴⛔PQ-10
    · Academic Structure ✅view-only · Content Access ✅
    · Institution Setup ✅ (Institution · Single sign-on · Institution data
                            └ Records needing attention)
  FACULTY
    Experiments 🔴PM29-11 · Assessments ✅ · Question Bank ✅
    · Student Progress 🟠scope pending ⛔PQ-14
  STUDENT
    My Learning ✅ · Progress ✅

INDIVIDUAL ─────────────────────────────────────────────────────────
  LEARNER
    My Learning ✅ · Explore🔵position moves · Progress ✅
    · Account ▸ Access history ✅DA-07 · Sign out
```

### 4.1 Confidence and source, per uncertain entry

| Entry | Confidence | Source | What unblocks it |
|---|---|---|---|
| Tenant requests | ⚪ **OPEN** | `PM29-07` + `PM29-A4` | `PQ-03` — **in-product vs manual differs by roughly a workspace** |
| Tenant content allocation | 🔵 HIGH | `PM29-23` | The allocation **unit** — experiment / course / package |
| Platform roles (write) | 🔵 HIGH on authority · ⚪ on mechanism | `PM29-22` · `QD-02` | The mechanism — invited? created? imported? mapped? |
| Releases ownership | ⚪ **OPEN** | `PM29-A1` | `PQ-01`. **Keep meanwhile — removing on ambiguity is as wrong as adding** |
| Faculty Experiments | 🔵 HIGH | `PM29-11` | Nothing structural; reuse is already mapped |
| Faculty analytics | ⚪ **OPEN** | `PM29-11` vs **PM-11** | `PQ-14` |
| Provisioning + CSV | 🔵 HIGH on need · ⚪ on schema | `PM29-10` · `PM29-25` | `PQ-10` — **a mandatory-field list is a validation contract** |
| Tenant Admin label | 🔵 HIGH *(directional, not read back)* | `PM29-09` | `PQ-09` — **and the one-role reading first** |
| Student vs Learner | ⚪ **OPEN** | `PM29-A8` | `PQ-12` |

---

## 5 · Rules any final navigation must preserve

**These are earned properties of the built work, not preferences.**

| # | Rule | Where it came from |
|---|---|---|
| 1 | **Identical chrome across roles.** Difference lives in nav content, permissions, actions and data | Batch 01 `QX-06`; Review-006 rule |
| 2 | **Depth stops at two** | Batch 03 stated it; Batch 05 obeyed it as the first two-level workspace |
| 3 | **Queue-first landings** for governance roles. No fake dashboards or fillers | Batch 01 |
| 4 | **A gap is shown as a gap, never as a disabled control** | Batch 05 `SA-C3` — *"a greyed-out control implies the route exists"*. **Platform-wide rule worth keeping** |
| 5 | **No workspace switcher** as persistent chrome | Batch 01 — `AUTH-09` is out of batch and not invented as a control |
| 6 | **No institution switcher.** The tenant boundary is structural, not a control | Batch 03; Batch 05 puts scope **in the page** via `.scopebar` |
| 7 | **Only one element may claim `aria-current`** — the child, never also the parent | Batch 05 `.subnav` |
| 8 | **Crossing into a tenant is never invisible** — and never signalled by colour alone | Batch 05 `.scopebar.inst`: icon changes, key line changes, note changes |

---

## 6 · What this document does not do

| Not done | Why |
|---|---|
| Choose final navigation | Stage 6. `N7` — nine workspaces, new surfaces unscoped |
| Choose one shell vs two | Recommended, **not decided** — §2.2 |
| Rename `Institute Admin` | `PQ-09` — **once, after confirmation** |
| Resolve `Student` vs `Learner` | `PQ-12` |
| Create any responsibility | Every item above is traced to a batch, an inventory row, or a marked-new PM direction |
| Merge navigation code | Stage 7 — **the first point at which merging is allowed** |
| Resolve `QX-01` / `QX-02` | Stage 10. ⚠ **Now sharper** — a public catalogue is not a desktop-only surface |
