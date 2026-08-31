# 01 — Existing Screen Reuse Map

| | |
|---|---|
| **Status** | 🟠 **REUSE ANALYSIS — DRAFT.** Records reuse. **Changes nothing. Batches 01–05 are READ ONLY** |
| **Created** | 29 August 2026 |
| **Authorised by** | `11_SAFE_WORK_BEFORE_MONDAY.md` **S3** — screen-coverage mapping, *"a fact-finding exercise over existing artefacts"* |
| **Method** | Every row was read from the batch's own documents **and** verified against the route table in its prototype `.js`. Routes are quoted as they appear in code |
| **Total inventoried** | **78 surfaces** — **71 product screens** + **7 prototype-only surfaces** |

---

## Reuse classification

| Class | Meaning |
|---|---|
| **KEEP** | Carries forward as-is. Nothing on 29 August changes it |
| **KEEP + REFRAME** | The artefact survives; its **framing, position or origin line** changes |
| **KEEP + EXPAND** | The artefact survives and **gains** a region, state or capability |
| **MERGE** | Two or more batches solve the same problem; one canonical screen results |
| **SUPERSEDE** | Replaced by a surface that does not exist yet. **The artefact is not deleted** |
| **DEFER** | Preserved intact, carried forward **later**, pending an answer |
| **REMOVE** | Already withdrawn by a prior decision. Recorded so its absence reads as scope |
| **BLOCKED BY PM** | Cannot be carried forward at all until a named question is answered |
| **PROTOTYPE-ONLY** | Never product UI. Not carried forward, and never was meant to be |

> **The governing rule of this map:** *a screen is not obsolete because the architecture changed.* Batch 04's catalogue is the test case — its **position** is superseded and its **artefact** is KEEP + REFRAME. Only two rows in 78 are REMOVE, and both were withdrawn before this task began.

---

# Batch 01 — Content governance + learner XR access

`ui-ux/13-full-platform-design/` · sessionStorage `xrslp-batch01-proto-v2`

| Screen ID | Name | Role | Route | Major states | Reuse | Unified destination | Modifications required | PM dep | Term dep | Visual dep |
|---|---|---|---|---|---|---|---|---|---|---|
| `S01` · `VND-01` | My Submissions | Vendor | `#/vendor/submissions` | populated · empty · changes-required emphasis · filtered · search | **KEEP** | PLATFORM → Vendor | — | — | *Experiment* ✅ | Stage 9 |
| `S02` · `VND-02` (+`03`,`04`) | New Submission | Vendor | `#/vendor/new` | blank draft · validation error · correction mode · upload states · declaration | **KEEP + EXPAND** | PLATFORM → Vendor | **Add experiment↔course mapping** (`PM29-17`); **candidate home for learning outcomes** (`E4`) | ⚠ `PQ-20` who maps · **N-1** who authors outcomes | ✅ | Stage 9 |
| `S02-edit` / `S02-correction` | Edit draft / Correct submission | Vendor | `#/vendor/submission/:id/edit` | edit · correction w/ feedback visible · validation · resubmit confirm | **KEEP** | PLATFORM → Vendor | — | — | ✅ | Stage 9 |
| `S03` · `VND-05` (+`SHR-05`) | Submission Detail & Status | Vendor | `#/vendor/submission/:id` | Draft · Academic Review · Changes Required (academic) · Resubmitted v2 · Content Readiness · Changes Required (readiness) · Publishing · Published · not-found | **KEEP** | PLATFORM → Vendor | — | — | ✅ | Stage 9 |
| `S04` · `ARV-01` | Review Queue | Academic Reviewer | `#/arv/queue` | queue incl. Resubmitted marker · empty | **KEEP** | PLATFORM → Reviewer | — | ⚠ `PQ-15` governance scope | ✅ | Stage 9 |
| `S04-history` | Review History | Academic Reviewer | `#/arv/history` | populated · empty | **KEEP** | PLATFORM → Reviewer | — | — | ✅ | Stage 9 |
| `S05` · `ARV-02` | Academic Review | Academic Reviewer | `#/arv/review/:id` | under review · request-changes dialog (reason required) · approve confirm · resubmitted w/ prior decision · tabs · not-found | **KEEP** | PLATFORM → Reviewer | — | ⚠ `QD-08` rubric still undefined | ✅ | Stage 9 |
| `S06` · `CM-01` | Content Review Queue | Content Manager | `#/cm/queue` | queue · empty | **KEEP** | PLATFORM → Content Manager | — | — | ✅ | Stage 9 |
| `S06-history` | Reviewed Content | Content Manager | `#/cm/history` | populated · empty | **KEEP** | PLATFORM → Content Manager | — | — | ✅ | Stage 9 |
| `S07` · `CM-02` | Content Readiness & Publication | Content Manager | `#/cm/review/:id` | under review · request-changes dialog · publish confirm · publishing · published · academic record read-only · not-found | **KEEP** | PLATFORM → Content Manager | ⚪ **Version-release boundary may move** | ⚠ **`PQ-01`** · `QP-26` | ✅ | Stage 9 |
| ~~`S08`~~ · ~~`SA-02`~~ | ~~Publish Queue~~ | ~~Super Admin~~ | *(none — doc/wireframe only)* | — | **REMOVE** | — | **Already withdrawn** by the PM publication correction of 2026-08-25 | ✅ settled | — | — |
| ~~`S09`~~ · ~~`SA-03`~~ | ~~Publish Experiment~~ | ~~Super Admin~~ | *(none)* | — | **REMOVE** | — | Already withdrawn. Its confirm/progress/result states were **absorbed into `S07`** | ✅ settled | — | — |
| `S10` · `CM-03` | Published Content | Content Manager | `#/cm/published` | populated | **KEEP** | PLATFORM → Content Manager | ⚠ `DA-06` **REVERSIBLE** — the publisher is confirmed, post-publication management is **not** | ⚠ owner of live catalogue | ✅ | Stage 9 |
| `S11` · `LRN-02` | My Learning | Learner (B2B) | `#/learner/my-learning` | populated · empty | **MERGE** | LEARNER → My Learning **(canonical)** | Merge with Batch 02, 03, 04 variants — **cluster D1** | ⚠ `PQ-12` | 🔴 header says *Experiments* | Stage 9 |
| `S12` · `LRN-04`+`LRN-07` | Experiment Detail | Learner | `#/learner/experiment/:id` | entitled+compatible · not entitled · access denied · unsupported device · web variant · resources · assessment link · not-found | **KEEP + REFRAME** | LEARNER → Experiment **(canonical)** · **public twin** in `07` | Gains a **public, unauthenticated sibling**; gains `E4` outcomes + `E5` preview | ⚠ `PQ-08` technology · `QX-03` captions | ✅ | Stage 9 |
| `S13` · `LRN-15` | XR Device Access | Learner | `#/learner/experiment/:id/device` | availability pending · ready on device · delivery failed · availability unknown · completion pending · completion received | **KEEP** | LEARNER → Experiment → Device | ⚠ Completes only when `LRN-16`/`LRN-17` are built | `QT-01` mechanism | ✅ | Stage 9 |
| `WEB-RUN` | Web simulation placeholder | Learner | `#/learner/experiment/:id/run` | placeholder · return · sample | **KEEP** | LEARNER → Simulation | Stands in for `LRN-08`, which is KEEP-from-Review-005 | — | ✅ | Stage 9 |
| `S14` · `LRN-13` | Progress | Learner | `#/learner/progress` | populated · updated landing · pending | **MERGE** | LEARNER → Progress **(canonical)** | Merge with Batch 02 `B12` — **cluster D3** | — | 🔴 | Stage 9 |
| `INDEX` | Prototype Index | *(none)* | `#/index` | index · fallback | **PROTOTYPE-ONLY** | — | Replaced by real authentication + workspace resolution (`AUTH-01`/`08`) | — | — | — |

**18 product surfaces · 1 prototype-only.** 12 KEEP · 1 KEEP+EXPAND · 1 KEEP+REFRAME · 2 MERGE · 2 REMOVE *(pre-withdrawn)*.

---

# Batch 02 — Assessment

`batch02-assessment/` · sessionStorage `xrslp-batch02-proto-v1`
⚠ **No `*SCREEN_INVENTORY*.md` exists in this batch.** IDs `B01`–`B12` come from `01_SOURCE_AND_SCOPE.md` §5; the prototype actually routes **16 distinct views**.

| Screen ID | Name | Role | Route | Major states | Reuse | Unified destination | Modifications required | PM dep | Term dep |
|---|---|---|---|---|---|---|---|---|---|
| `B01` · `FAC-06` | Assessments (list) | Faculty | `#/faculty/assessments` | populated · empty · filtered-empty · draft "setup incomplete" · awaiting-evaluation proto note · search · status filter · assigned | **KEEP** | TENANT → Faculty | — | — | 🔴 *Module* ×165 |
| `B02-questions` · `FAC-07` | Builder — Questions | Faculty | `#/faculty/assessment/<aid>` | empty · populated · needs-attention dot · add-from-bank · remove · reorder · ready-only filter · completeness | **KEEP** | TENANT → Faculty | — | — | 🔴 |
| `B02-settings` · `FAC-07` | Builder — Settings | Faculty | `#/faculty/assessment/<aid>/settings` | draft · configured · dependent-field disable · sample-tagged params · validation · negative-marking pair | **KEEP** | TENANT → Faculty | — | — | 🔴 |
| `B02-assign` · `FAC-07` | Builder — Assign | Faculty | `#/faculty/assessment/<aid>/assign` | no context · module selected · assign disabled until complete · already-holding-assessment excluded · assigned · course/semester slot | **KEEP + REFRAME** | TENANT → Faculty | ⚠ **Assignment owner is open**; may gain course code / semester | ⚠ **`PQ-05`** · `PQ-10` | 🔴 |
| `B03` | Assessment Preview — learner view | Faculty | `#/faculty/assessment/<aid>/preview` | preview banner · generated disclosure · varied config · not-recorded note | **KEEP** | TENANT → Faculty | — | — | 🔴 |
| `B04` · `FAC-08` | Question Bank | Faculty | `#/faculty/questions` | populated · empty · no-matches · **upload report with per-row errors** · Ready vs AI-draft · type filter | **KEEP + EXPAND** | TENANT → Faculty | ▶ **Its upload pattern is the reuse source for CSV people import** | — | 🔴 |
| `B05` | Question Editor | Faculty | `#/faculty/question/new` · `/<qid>` | create · edit · edit-AI-draft · missing text · missing options · missing correct answer · type switch · save · cancel | **KEEP** | TENANT → Faculty | — | — | 🔴 |
| `B06` · `FAC-09` | AI Question Drafts | Faculty | `#/faculty/questions/ai` | request · generating · drafts for review · generation failure · empty · accept · edit · discard | **KEEP** | TENANT → Faculty | — | — | 🔴 |
| *(learner)* | My Learning | Learner | `#/learner/my-learning` | populated · per-module status · pending · updated · empty · … | **MERGE** | LEARNER → My Learning | **Cluster D1** | ⚠ `PQ-12` | 🔴 |
| `B07` · `LRN-04` | Module Detail | Learner | `#/learner/module/<mid>` | assessment available (why) · locked until simulation (why) · in progress · passed · pending · attempts used · resources · sequence ladder | **MERGE** | LEARNER → Experiment | **Cluster D2** — merges with Batch 01 `S12` | ⚠ `PQ-04` | 🔴 **the same object as `S12`, under a different noun** |
| `B08` · `LRN-09` | Assessment Introduction | Learner | `#/learner/assessment/<aid>` | available · not yet available · resume · already submitted · passed · **no attempts remaining** · **couldn't load (retry)** · generated disclosure · timed/untimed · descriptive-present | **KEEP** | LEARNER → Assessment | — | ⚠ `QP-27` feedback policy | 🔴 |
| `B09` · `LRN-10` | Assessment Attempt | Learner | `#/learner/assessment/<aid>/attempt` | MCQ · True/False · descriptive · answered/unanswered navigator · timer only when configured · **time-elapsed prompt (no auto-submit)** · saved-as-you-go | **KEEP** | LEARNER → Assessment | — | — | 🔴 |
| `B10` · `LRN-11` | Review Answers | Learner | `#/learner/assessment/<aid>/review` | all answered · unanswered warning with numbers · change answer · submit | **KEEP** | LEARNER → Assessment | — | — | 🔴 |
| `LRN-11` *(dialog)* | Submit Confirmation | Learner | *(dialog, not a route)* | attempts remaining · last attempt · pending-evaluation note · unanswered warning · confirm · cancel | **KEEP** | LEARNER → Assessment | Dialog, not a screen | — | 🔴 |
| `B11` · `LRN-12` | Result | Learner | `#/learner/assessment/<aid>/result` | **passed** · **not passed** (+retry only while attempts remain) · **result pending evaluation** · final-result-received · score line · attempt history | **KEEP** | LEARNER → Assessment | — | ⚠ `QP-27` | 🔴 |
| `B12` · `LRN-13` | Progress | Learner | `#/learner/progress` | per-module simulation/assessment/module status · pending banner · updated banner · **never complete while a result is pending** | **MERGE** | LEARNER → Progress | **Cluster D3** — merges with Batch 01 `S14` | — | 🔴 |
| `FAC-11` | Descriptive evaluation queue | *(owner undefined)* | *(none)* | **not designed** | **BLOCKED BY PM** | TENANT → Faculty? | ⛔ **`QP-02` HIGH** — *the only open item that can strand a learner* | ⛔ **`QP-02`** | — |
| *(index)* | Prototype Index | *(none)* | `#/index` | index · fallback | **PROTOTYPE-ONLY** | — | — | — | — |

**17 product surfaces · 1 prototype-only.** 11 KEEP · 1 KEEP+EXPAND · 1 KEEP+REFRAME · 3 MERGE · 1 BLOCKED.

---

# Batch 03 — Institute administration

`batch03-institute-admin/` · sessionStorage `xrslp-batch03-proto-v1`
**The batch whose most conservative choices now receive their answers cleanly.**

| Screen ID | Name | Role | Route | Major states | Reuse | Unified destination | Modifications required | PM dep | Term dep |
|---|---|---|---|---|---|---|---|---|---|
| `INA-01` | Institution Overview | Institute Admin | `#/admin/overview` | attention items present · all clear · partial · per-card needs-attention · counts · links | **KEEP** | TENANT → Admin | May gain provisioning + allocation attention rows | — | ⚠ `PQ-09` role label |
| `INA-02` | People | Institute Admin | `#/admin/people` | directory · filtered to Faculty · filtered-empty · empty institution · row needing attention · role chip filter · search | **KEEP + EXPAND** | TENANT → Admin | 🔴 **ADD manual person creation** (`PM29-10`) · 🔴 **ADD bulk CSV import** | ⛔ **`PQ-10`** schema · ⚠ `QD-01` CSV↔ERP conflict | ⚠ `PQ-09` |
| `INA-03` | Person Detail | Institute Admin | `#/admin/person/:id` | learner with access · learner not in a stream · faculty (no origin recorded) · learner in stream not group · provenance chip · needs attention · read-only external fields | **KEEP + EXPAND** | TENANT → Admin | 🟠 **FILL Faculty origin** — `PM29-10` answers *who creates a Faculty account* | ⚠ `PQ-10` | ⚠ `PQ-09` |
| `INA-04` | Academic Structure | Institute Admin | `#/admin/structure` | populated · non-matching incoming values (attention) · view-only · empty | **KEEP + EXPAND** | TENANT → Admin | 🔴 **ADD Course ID / Code** (`PM29-15`) — **no such field exists in any source** | ⛔ **`PQ-10`** · ⚠ `PQ-04(b)` Programme vs Stream | 🔴 *Stream* ×252 vs *Programme* |
| `INA-05` | Stream / Group Detail | Institute Admin | `#/admin/structure/:id` | reached by content access · reached by nothing · members · faculty · empty · not-found · counts | **KEEP** | TENANT → Admin | — | ⚠ `PQ-04(b)` | 🔴 |
| `INA-06` | Content Access | Institute Admin | `#/admin/access` | populated · a record not yet reaching learners · **no content access recorded yet** · search | **KEEP + REFRAME** | TENANT → Admin | 🟢 **FILL the origin actor** — `PM29-23` names **Super Admin**. *One line changes; the model does not* | ⚠ allocation **unit** | ⚠ *Licence/Entitlement* |
| `INA-07` | Content Access Detail | Institute Admin | `#/admin/access/:id` | active with eligibility · active with no eligibility · after eligibility added · covered content · effective dates · add/remove dialogs · not-found | **KEEP + REFRAME** | TENANT → Admin | Same origin fill. ⚠ Eligibility editor is **`DA-07` REVERSIBLE** — **no assigner is claimed** | ⛔ **`PQ-05`** | ⚠ |
| `INA-08` | Access Mapping | Institute Admin | `#/admin/mapping` | gaps present · every record reaching learners · both-direction view | **KEEP + EXPAND** | TENANT → Admin | ▶ **Its two-direction view is the reuse source for Super Admin tenant-content allocation** | ⚠ `PQ-05` | ⚠ |
| `INA-09` | Institution Setup | Institute Admin | `#/admin/setup` | landing · both connection states · edit dialog · tabs | **KEEP** | TENANT → Admin | ⛔ Institution create/delete stays platform-side and absent | — | ⚠ `PQ-09` |
| `INA-10` | Single Sign-On | Institute Admin | `#/admin/setup/sso` | not set up · details saved not checked · **check did not succeed** · on (with identity-matching status) · stepper states · turn-on dialog | **KEEP** | TENANT → Admin | — | ⚠ `QT-04` SSO-vs-LMS collision (**HIGH**) | — |
| `INA-11` | Institution Data | Institute Admin | `#/admin/setup/data` | completed with issues · completed healthy · run in progress · schedule · history | **KEEP** | TENANT → Admin | ⚠ `DA-15` *Run now* is **not source-established**, reversible | ⚠ `QD-01` | — |
| `INA-12` | Records Needing Attention | Institute Admin | `#/admin/setup/data/attention` | three issue kinds open · retried before cause fixed · resolved · per-issue what-happened / what-next | **KEEP + EXPAND** | TENANT → Admin | ▶ **Its issue-card pattern is the reuse source for CSV per-row import errors** | ⚠ `QD-01` | — |
| `INA-13` | Learner Access Check | Learner | `#/learner/my-learning` | eligible content present · **not currently eligible** | **MERGE** | LEARNER → My Learning | **Cluster D1.** A *verification view over `LRN-02`*, `DA-14` — not a separate product screen | ⚠ `PQ-12` | ⚠ |
| `index` | Prototype Index | *(none)* | `#/index` | index · fallback | **PROTOTYPE-ONLY** | — | — | — | — |

**13 product surfaces · 1 prototype-only.** 5 KEEP · 5 KEEP+EXPAND · 2 KEEP+REFRAME · 1 MERGE.

---

# Batch 04 — B2C learner catalogue and access

`batch04-b2c-learner-access/` · sessionStorage `xrslp-batch04-proto-v1`
**Components reusable · entry model superseded · nothing deleted.**

| Screen ID | Name | Role | Route | Major states | Reuse | Unified destination | Modifications required | PM dep | Term dep |
|---|---|---|---|---|---|---|---|---|---|
| `B2C-01` | Explore — catalogue | Learner | `#/explore` | full catalogue · search + pill · filters applied · **no results** · **signed out** · already-holds banner · owned cards | **KEEP + REFRAME** | **PUBLIC → Catalogue** | 🔴 **Position moves out from behind sign-in** (`PM29-02`). Components survive; **card action verb changes** | ⛔ **`PQ-06`** CTA · ⛔ `PQ-02` drop the Type filter | 🔴 chip says **`Module`** |
| `B2C-02` | Module detail | Learner | `#/module/<id>` | available · **already held** · web variant · device variant · also-in-a-bundle | **KEEP + REFRAME + EXPAND** | **PUBLIC → Experiment detail** + LEARNER → Experiment | Gains `E4` learning outcomes, `E5` preview, `E2` course context; **loses the amount publicly** | ⛔ `PQ-06` · `PM29-04` · `QX-03` | 🔴 |
| `B2C-03` | Bundle detail | Learner | `#/bundle/<id>` | available · **partly held** (per-module marks, no amount, overlap notice) · fully held | **DEFER** | *(pending)* | ⛔ **Preserved intact. Not carried into the public catalogue** | ⛔ **`PQ-02`** | 🔴 *Bundle* ×295 |
| `B2C-04` | Get access (summary + payment step) | Learner | `#/get-access/<id>` | single module · bundle contents enumerated · **partly-held blocked at the route** · account block · provider-neutral payment step · prototype outcome control | **BLOCKED BY PM** | *(pending)* | ⛔ The **transaction** cannot be designed. Its **summary/account/payment-step components** are reusable | ⛔ **`PQ-06`**, `PQ-07`, `PQ-02` | 🔴 |
| `B2C-05` | Confirming payment | Learner | `#/processing` | determinate progress · nothing added yet | **KEEP** | LEARNER → Access | ✅ FRD 9.1.x requires it | — | — |
| `B2C-06` | Access outcome | Learner | `#/result` | **succeeded** · **not completed** · **still confirming** · reference + date | **KEEP** | LEARNER → Access | ✅ All three outcomes are required and all three exist | — | — |
| `LRN-02` | My Learning (individual) | Learner | `#/my-learning` | populated w/ origin per row · **just added** banner + row badge · empty · sign-in required | **MERGE** | LEARNER → My Learning | **Cluster D1.** ▶ **This is where the two routes converge** | ⚠ `PQ-12` | 🔴 header says **`Experiment`** |
| `LRN-04b` | Experiment handoff | Learner | `#/learn/<id>` | contents · signpost to where the rest is designed | **MERGE** | LEARNER → Experiment | **Cluster D2.** A handoff, not a rival design | — | 🔴 |
| `B2C-07` | Access history | Learner | `#/history` | populated · empty · per-entry origin | **KEEP** | LEARNER → Account | ⚠ `DA-07` — *inventoried, not required*, **reversible** | — | — |
| `AUTH-B2C` | Sign in to continue | Learner | `#/sign-in` · `#/sign-in/<id>` | handoff · returns to origin · signed-out guard | **SUPERSEDE** | AUTH → `AUTH-01` | ⛔ Replaced by a real sign-in that **does not exist yet**. *A panel, not a form — it collects nothing* | ⛔ `AUTH-01`/`02`/`03`/`08` · `PQ-07` | ⚠ `PQ-12` |
| `GUARD-ALREADY-HAVE` | Already-held route guard | Learner | `#/get-access/<id>` | blocked at the route | **KEEP** | LEARNER → Access | ✅ **Architectural** — *duplicate access blocked at the route, not hidden on the card* | — | — |
| `GUARD-PARTLY-HELD` | Partly-held bundle guard | Learner | `#/get-access/<bundle>` | blocked at the route, remaining offered individually | **DEFER** | *(pending)* | ⛔ Downstream of the bundle definition. `DA-10` reversible · `Q-45` open | ⛔ **`PQ-02`** | 🔴 |
| `NOT-FOUND` | Page not found | Learner | *(inline)* | not found | **KEEP** | ALL | Generalises to a platform-wide not-found | — | — |
| `PROTO-INDEX` | Prototype index | *(reviewer)* | `#/index` | index · two-routes figure · fallback | **PROTOTYPE-ONLY** | — | ▶ Its `.converge` figure is a **reviewer artefact worth keeping as documentation** | — | — |
| `SIGNPOST-HOME` | Home signpost | Learner | `#/home` | signpost | **PROTOTYPE-ONLY** | — | — | — | — |
| `SIGNPOST-PROGRESS` | Progress signpost | Learner | `#/progress` | signpost | **PROTOTYPE-ONLY** | — | Real screen exists in Batches 01/02 | — | — |

**13 product surfaces · 3 prototype-only.** 5 KEEP · 2 KEEP+REFRAME *(one of them also +EXPAND)* · 2 MERGE · 2 DEFER · 1 SUPERSEDE · 1 BLOCKED.

---

# Batch 05 — Super Admin

`batch05-super-admin/` · **Two write actions in the whole workspace. That is the finding, not an omission.**

| Screen ID | Name | Role | Route | Major states | Reuse | Unified destination | Modifications required | PM dep | Term dep |
|---|---|---|---|---|---|---|---|---|---|
| `SA-01` | Platform overview | Super Admin | `#/overview` | work waiting · **nothing waiting** (`.attn-clear`, an outcome not an empty state) · partial · per-row counts | **KEEP + EXPAND** | PLATFORM → Super Admin | 🔴 **ADD rows for tenant requests and content allocation.** ⛔ **Still no dashboard** — `PM-11` | ⚠ `PQ-03` | — |
| `SA-02` | Institutions | Super Admin | `#/institutions` | full list · filtered *(not yet operating)* · filtered *(one state)* · **no results** · search · state pills | **KEEP + EXPAND** | PLATFORM → Super Admin | 🔴 **Read-only is now too conservative** (`D-02`). `PM29-22` adds governance **writes** | ⛔ **`PQ-03`** · action list ⚪ | ⚠ *Institution/Tenant* |
| `SA-03` | Institution detail | Super Admin | `#/institution/<id>` | operating · attention needed · setup incomplete (no sign-in/data) · setup incomplete (no access record) · not-found · scope bar tinted | **KEEP + EXPAND** | PLATFORM → Super Admin | Same. ▶ **Its readiness ledger is where allocation would attach** | ⛔ `PQ-03` | ⚠ |
| `SA-04` | Module releases | Super Admin | `#/releases` | awaiting · held · released · all versions · **nothing awaiting** · filters | **KEEP** *(pending)* | PLATFORM → Super Admin | ⚪ **Ownership ambiguous.** *Removing on ambiguity is as wrong as adding* | ⛔ **`PQ-01`** | 🔴 *Module* ×133 |
| `SA-05` | Release decision | Super Admin | `#/release/<id>` | awaiting (Hold + Release) · held (warning) · released · not-found · 2 dialogs | **KEEP** *(pending)* | PLATFORM → Super Admin | ⚪ Same. Controls are **named for the version, not a destination** | ⛔ **`PQ-01`** · `QP-26` | 🔴 |
| `SA-06` | Device replacement requests | Super Admin | `#/device-requests` | awaiting · approved · all · **no one waiting** | **KEEP** | PLATFORM → Super Admin | ⚠ **No decline path exists** — stated as a gap, not a disabled control | ⚠ `DA-07` no-decline | — |
| `SA-07` | Device request detail | Super Admin | `#/device-request/<id>` | awaiting · approved · not-found · approve dialog · both ends of FLOW 8 | **KEEP** | PLATFORM → Super Admin | 🟠 **Completes only when `LRN-16`/`LRN-17` are built** — a **half-built cross-plane workflow** | — | — |
| `SA-08` | Licensing | Super Admin | `#/licensing` | records present · some institutions without · **no records at all** | **KEEP** | PLATFORM → Super Admin | ✅ **No seat figure — validated by `PM29-20`** | ⚠ `QP-04` | 🔴 *Licence* ×52 vs *Entitlement* |
| `SA-09` | Platform roles | Super Admin | `#/platform/roles` | read-only table (role · holders · count · basis) | **KEEP + EXPAND** | PLATFORM → Super Admin | 🔴 **Read-only is too conservative on authority** (`PM29-22`) — ⛔ **but still correct on mechanism**. A control cannot be designed without `QD-02` | ⛔ **`QD-02`** · `PQ-15` | ⚠ |
| `SA-10` | Platform configuration | Super Admin | `#/platform/configuration` | register — 15 rows, four kinds, **zero invented controls** | **KEEP** | PLATFORM → Super Admin | ▶ **An excellent pattern for any area where authority exists and content does not** | — | — |
| `index` | Prototype index | *(none)* | `#/index` | index · fallback | **PROTOTYPE-ONLY** | — | — | — | — |

**10 product surfaces · 1 prototype-only.** 6 KEEP · 4 KEEP+EXPAND. **No REMOVE, no SUPERSEDE, no MERGE.**

---

# Roll-up

| Class | Count | Notes |
|---|---|---|
| **KEEP** | **39** | |
| **KEEP + EXPAND** | **11** | |
| **KEEP + REFRAME** | **6** | |
| **MERGE** | **8** | → **3 canonical screens** (clusters D1, D2, D3) |
| **DEFER** | **2** | Both bundle-dependent |
| **SUPERSEDE** | **1** | `AUTH-B2C` → a sign-in that does not exist |
| **BLOCKED BY PM** | **2** | `B2C-04` transaction · `FAC-11` descriptive grading |
| **REMOVE** | **2** | Both **withdrawn before this task** by the 2026-08-25 publication correction |
| **PROTOTYPE-ONLY** | **7** | Five indexes, two signposts |
| **Total** | **78** | **71 product · 7 prototype-only** |

## What the numbers say

- **56 of 71 product screens (79%) are KEEP in some form.** The corpus is not a draft to be rebuilt; it is a platform to be assembled.
- **Only 2 are REMOVE — and both were already removed.** Nothing in this analysis deletes a screen that currently exists.
- **8 MERGE rows collapse to 3 canonical screens.** All three are **learner-facing**, and all three were duplicated because four batches each needed a learner context. See `10_DUPLICATION_AND_TERMINOLOGY_AUDIT.md`.
- **Batch 05 has the cleanest map and the largest pending expansion.** Ten screens, ten KEEPs, five of which grow — precisely because its audit method made each refutation individually reversible.
- **The single most consequential row is `INA-06`/`INA-07`.** Its origin line carries *a date and no actor* because no source confirmed one. `PM29-23` supplies it. **A blank built to be filled, received its answer.**
