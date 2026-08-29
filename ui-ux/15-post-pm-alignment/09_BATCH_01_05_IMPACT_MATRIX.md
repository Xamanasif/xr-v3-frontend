# 09 — Batch 01–05 Impact Matrix

| | |
|---|---|
| **Status** | 🟠 **IMPACT ANALYSIS — DRAFT.** Records impact. **Changes nothing** |
| **Created** | 29 August 2026 |
| **Batches 01–05** | **READ ONLY in this task.** Not modified, not edited, not touched |

**Magnitude scale**

| | |
|---|---|
| **LOW** | Copy, labels, a field, a documentation note |
| **MEDIUM** | A screen, a state, or a new surface inside an existing workspace |
| **HIGH** | A new capability area, or a stated design position that must be replaced |
| **ARCHITECTURAL** | Changes the journey shape, the authority model, or where a surface sits |

---

# Part A · Decision-by-decision impact

| # | Decision | Confidence | Batch | Currently | Verdict | Magnitude | Safe before Monday? | PM answer needed? | Reason |
|---|---|---|---|---|---|---|---|---|---|
| **1** | `PM29-01` journey-first; combine later | ✅ HIGH | **All** | Five separate packages | **Keep + reframe** | LOW | ✅ **Yes** — documentation only | ❌ No | Reframing costs nothing and changes no artefact |
| **2** | `PM29-02` public pre-login discovery | 🔵 HIGH | **04** | Explore sits behind sign-in | **Modify (position)** | **ARCHITECTURAL** | 🟠 **Partly** — components may be mapped; the CTA may not be chosen | ⚠️ `PQ-06` for the CTA | The entry point moves; the components do not |
| **3** | `PM29-03` public experiment detail content | 🔵 HIGH | 04, 01 | Facts exist, scattered | **Add (re-composition)** | MEDIUM | ✅ **Yes** — inventory the facts | ❌ No | Only *learning outcomes* and *preview/video* are genuinely new |
| **4** | `PM29-04` public pricing visibility | ⚪ OPEN | 04 | No public page at all | **Pending** | — | ❌ **No** | ✅ Yes | "Do NOT yet invent" |
| **5** | `PM29-05` B2B primary / B2C secondary | 🔵 HIGH | **04** | Framed as a peer route | **Keep + reclassify** | LOW | ✅ **Yes** — classification only | ⚠️ Phase-1 timing (`PQ-07`) | Reclassification, not redesign. **Nothing deleted** |
| **6** | `PM29-06` two entry contexts | 🔵 HIGH | — | No fork exists | **Add** | MEDIUM | 🟠 Structure only | ⚠️ Downstream B2B branch | The fork is clear; what it leads to is not |
| **7** | `PM29-07` tenant application path | 🔵 HIGH | — | `AUTH-10` never built | **Add** | **HIGH** | ❌ **No** | ✅ `PQ-03` | Actor and states unknown |
| **8** | `PM29-08` internal free / external paid | 🔵 HIGH | 03, 05 | Batch 03 starts at *"access exists"*, origin actor blank | **Keep — validated** | MEDIUM | ❌ **No** | ✅ `PQ-11` | Batch 03's neutrality **accommodates both branches unchanged** |
| **9** | `PM29-09` Tenant/Institute Admin — same role position | 🔵 HIGH *(directional; reading not read back)* | **03** | `Institute Admin` everywhere | **Keep as-is, pending label** | LOW *(but wide)* | ❌ **No** | ✅ `PQ-09` | A rename must happen **once**, after confirmation |
| **10** | `PM29-10` manual + CSV people provisioning | 🔵 HIGH | **03** | **No provisioning control** (`DA-04`) | **Add** | **HIGH** | 🟠 **Pattern only** — the schema is blocked | ✅ `PQ-10` for the schema | The largest gap in the built work |
| **11** | `PM29-11` Faculty sees tenant experiments | 🔵 HIGH | **02** | No Faculty browse surface | **Add** | MEDIUM | 🟠 Map the reuse | ❌ No for the surface | Batch 04's catalogue is a candidate source |
| **12** | `PM29-11` Faculty *"analytics"* | ⚪ OPEN | **02** | Minimal, per PM-11 | **Pending** | — | ❌ **No** | ✅ `PQ-14` | Points against PM-11. **No metric invented** |
| **13** | `PM29-12` Student capabilities | 🔵 HIGH | 01, 02, 03 | Fully designed | **Keep** | — | ✅ n/a | ❌ No | Reinforces existing work |
| **14** | `PM29-13` Program level | 🔵/🟣 | **03** | Word deliberately avoided | **Pending** | **HIGH** | ❌ **No** | ✅ `PQ-04` | Collides with PM-12-deferred *certification program* |
| **15** | `PM29-13` Course → Experiment spine | 🔵 HIGH | All | Consistent with FRD 3.2.1 + 3.1.1 | **Keep** | LOW | ✅ **Yes** | ❌ No | The safe part of the hierarchy |
| **16** | `PM29-13` Technology as a level | 🟠 | 01, 04 | Format is a **property** | **Pending** | **HIGH** | ❌ **No** | ✅ `PQ-08` | Changes catalogue, detail and access record |
| **17** | `PM29-14` MR omitted from the list | 🟣 | **01** | All four formats designed | **Keep — no removal** | — | ✅ **Yes** — keep | ✅ `PQ-13` | An omission is not a decision |
| **18** | `PM29-15` Course Name + Course ID/Code | 🔵 HIGH | **03** | Courses shown; **no code field** | **Add** | MEDIUM | ❌ **No** | ✅ `PQ-10` | No course-code field exists in any source |
| **19** | `PM29-16` Module vs Experiment | 🟠 READ-BACK | **All five** | 🔴 **Batches disagree; Batch 04 disagrees with itself** | **Pending** | **HIGH** *(wide, mechanical)* | ✅ **Audit yes · rename no** | ✅ `PQ-04` | A shipped inconsistency a consolidation exposes immediately |
| **20** | `PM29-17` Experiment ↔ Course mapping | 🔵 HIGH | 01, 03 | Vendor submission has **no course mapping** | **Add** | MEDIUM | ❌ **No** | ⚠️ Who maps it? | The 5–10 figure is **SAMPLE**, not cardinality |
| **21** | `PM29-18` technology selection + pricing | 🟠 READ-BACK | 04 | Formats are informational badges | **Pending** | **HIGH** | ❌ **No** | ✅ `PQ-08` | Commercial rules unresolved |
| **22** | `PM29-19` Monthly / Quarterly / Yearly | ✅ HIGH | **04** | **No term shown anywhere** | **Add** | MEDIUM | ❌ **No** *(B2C is secondary)* | ⚠️ `PQ-07` for timing | **An addition, not a contradiction.** Nothing to retract |
| **23** | `PM29-20` no seat model | ✅ HIGH | **03, 05** | Every seat/cap/quota figure **already removed** | **Keep — validated** | — | ✅ **Yes** — keep | ❌ No | Confirms both batches were right |
| **24** | `PM29-21` Super Admin central | 🔵 HIGH | **05** | Two writes + one bounded read | **Modify** | **ARCHITECTURAL** | ❌ **No** | ✅ `PQ-01`, `PQ-03` | The role is larger than the audit could support at the time |
| **25** | `PM29-22` tenant + role governance | 🔵 HIGH | **05** | `R-01`/`R-02` refuted; `SA-09` read-only | **Modify — refutations lift** | **ARCHITECTURAL** | ❌ **No** | ✅ `PQ-03` | Authority directional; **mechanism still `QD-02`** |
| **26** | `PM29-23` Super Admin allocates tenant content | 🔵 HIGH | **03, 05** | Batch 03 origin line: date, **no actor** | **Add (SA) / fill (IAD)** | **ARCHITECTURAL** | ❌ **No** | ⚠️ Allocation unit | **A blank Batch 03 was built to accept** |
| **27** | `PM29-24` Vendor / Reviewer governance | 🟠 | **05** | `R-03`/`R-04` refuted | **Pending — refutations lift** | **HIGH** | ❌ **No** | ✅ `PQ-15` | Scope unknown: global? per course? per experiment? |
| **28** | `PM29-25` learner metadata | 🟠 READ-BACK | **03** | Narrow person record, justified | **Pending** | **HIGH** | ❌ **No** | ✅ `PQ-10` | **No schema exists in any source** |
| **29** | `PM29-A1` version release ownership | ⚪ OPEN | **05, 01** | `SA-04`/`SA-05` kept, isolated, reversible | **Pending — keep meanwhile** | **HIGH** | ❌ **No** | ✅ **`PQ-01`** | Removing on ambiguity is as wrong as adding |
| **30** | `PM29-A2` Bundle definition | ⚪ OPEN | **04** | Bundle = id-list granting each module | **Pending** | **HIGH** | ❌ **No** | ✅ **`PQ-02`** | Four candidate meanings; each changes what carries a price |
| **31** | `PM29-A3` learner-assignment owner | ⚪ OPEN | **03, 02** | `DA-07` reversible editor | **Pending — keep meanwhile** | MEDIUM | ❌ **No** | ✅ `PQ-05` | Batch 03 already declines to name an assigner |
| **32** | `PM29-A6` cart vs request list | ⚪ OPEN | **04** | `DA-01` direct single-item | **Pending** | **HIGH** | ❌ **No** | ✅ `PQ-06` | A request list is a **different object** from a cart |

---

# Part B · Batch 01 — Content governance + learner XR access

## B.1 What remains valid

| Element | Status | Why |
|---|---|---|
| **Vendor → Academic Reviewer → Content Manager → Published** | ✅ **Unchanged** | PM-14 + PM-16/17/18. Nothing on 29 Aug touches the chain's shape |
| Changes-required · comments · correction · resubmission at the returning gate | ✅ **Unchanged** | PM-14 |
| Review history / status traceability (`SHR-05`) | ✅ **Unchanged** | PM-14 |
| *"Rejected"* never used; the vendor always sees **who holds** the submission | ✅ **Unchanged** | FRD 1.4.5 expressed positively |
| No disabled Publish control anywhere in the Vendor workspace | ✅ **Unchanged** | FRD 1.4.5 |
| Learner XR access — entitlement → compatibility → availability → completion | ✅ **Unchanged** | PM-05, mechanism-neutral. `PM29-12` reinforces it |
| All four format badges — Web · VR · **MR** · AR | ✅ **Keep all four** | `PM29-14`'s omission is not a removal |
| **`Experiment` as the user-facing term** | ✅ **Now the best-aligned batch** | The PM used *experiment* throughout on 29 Aug |
| Component system — queue, review panel, decision dialog, history timeline, stage indicator | ✅ **Unchanged, and newly valuable** | A direct fit for tenant-application review — see §B.3 |

## B.2 What is impacted

| # | Impact | Magnitude | Detail |
|---|---|---|---|
| 1 | **The chain is now the first half of a longer chain** | MEDIUM | Batch 01 ends at *Published*. `PM29-23` adds *→ allocated to a tenant → visible to Faculty*. **Batch 01 is not wrong; it is incomplete as an end-to-end story** |
| 2 | **Experiment ↔ Course mapping is absent from submission** | MEDIUM | `PM29-17` requires an experiment to map to a course. Batch 01's `VND-02`/`VND-04` metadata has **no course field** — and **who** performs the mapping (Vendor? CM? Super Admin, per tenant?) is unstated |
| 3 | **`PM29-A1` version release** | HIGH | Batch 01 withdrew both SA publish screens. Version release lives in Batch 05. If ownership changes, the boundary between the two batches moves |
| 4 | Vendor / Reviewer governance by Super Admin | LOW *(for Batch 01)* | `PM29-24` is a Batch-05 concern; Batch 01 has no account administration |
| 5 | Metadata schema | LOW | `VND-04` fields are already labelled **SAMPLE** (`QD-07`). `PM29-25` does not change that |
| 6 | `Programme` in the hierarchy | LOW | Batch 01 has no programme level and does not need one until `PQ-04` resolves |

## B.3 The reuse finding worth carrying forward

**Batch 01's governance-review pattern is a near-exact fit for tenant-application review**, if `PM29-A4` resolves in favour of an in-product approver:

| Application review needs | Batch 01 already has |
|---|---|
| A queue of things awaiting a decision | `Table` + `Submission Row` + queue-empty state |
| A detail view with the submitted information | `Submission Summary` + `Metadata Group` |
| Approve / request changes with a **required reason** | `Review Panel` + `Confirmation Dialog` (input variant) + `Comment Composer` |
| A state the submitter can see | `Status Badge` governance set + `Workflow Stage Indicator` |
| A history trail | `Review History Timeline` (`SHR-05`) |

**Verdict: LOW–MEDIUM overall. Batch 01 survives 29 August better than any other batch.**

---

# Part C · Batch 02 — Assessment

## C.1 What remains valid

| Element | Status |
|---|---|
| Question bank — spreadsheet upload with per-row error reporting | ✅ Unchanged (FRD 5.1.1) |
| AI-generated drafts under mandatory Faculty review | ✅ Unchanged (FRD 5.1.2) |
| Question editor | ✅ Unchanged (`A3`) |
| Assessment builder — questions · settings · assign, completeness rail | ✅ Unchanged (PM-08) |
| Configuration-generated learner disclosure | ✅ Unchanged — **and `PM29-11` reinforces Faculty ownership** |
| Learner attempt · review · submit · result · pending-evaluation | ✅ Unchanged |
| Progress never marks a module complete while a result is pending | ✅ Unchanged |
| Learner never authors, configures, or sees the key | ✅ Unchanged (PM-15 `F12`, `D-25` `F11`) |
| Descriptive-grading owner still unresolved and **not designed** | ✅ Correct — `QP-02` still HIGH and open |

## C.2 What is impacted

| # | Impact | Magnitude | Detail |
|---|---|---|---|
| 1 | **No Faculty surface for "experiments available to the tenant"** | MEDIUM | `PM29-11` requires it. Batch 02 covers `FAC-06/07/08/09` + learner screens only. `FAC-02`/`FAC-03` (Courses / Course detail) exist in the **inventory** but were **not built** |
| 2 | **Faculty student usage / progress is minimal** | MEDIUM | `FAC-05` and `FAC-10` are inventoried, not built. Batch 02 kept result visibility deliberately small per PM-11 |
| 3 | **"Analytics"** | ⚪ BLOCKED | `PM29-11` uses a word PM-11 deferred. **No metric is defined.** → `PQ-14` |
| 4 | **Terminology — the largest single rename in the platform** | HIGH *(mechanical)* | Batch 02 uses `Module` in **61** label positions. If `Experiment` wins, this is the biggest text change of any batch |
| 5 | Course code / semester in the assessment assignment context | LOW | `PM29-15`/`PM29-25` may add fields to the assign step. Blocked by `PQ-10` |
| 6 | Assessment as a per-technology thing? | ⚪ UNKNOWN | If `PM29-A11` makes technology a variant, does an assessment attach to the experiment or to a variant? **Not asked yet** — folded into `PQ-08` |

**Verdict: MEDIUM. The assessment core is untouched; the surrounding Faculty workspace is incomplete against the new direction.**

---

# Part D · Batch 03 — Institute Admin

**The batch with the highest impact from a single item, and simultaneously the batch whose caution paid off most.**

## D.1 What remains valid

| Element | Status |
|---|---|
| The spine: `institution content access → eligibility → learner eligibility → content in My Learning` | ✅ **Unchanged — and `PM29-23` validates it** |
| Content-access origin line carrying **a date and no actor** | ✅ **Exactly right.** `PM29-23` names the actor. A blank built to be filled |
| No price, packaging noun, seat count or purchase route anywhere | ✅ **Validated by `PM29-20`** |
| Single sign-on: configure → check → turn on, enabled only after a successful test | ✅ Unchanged (FRD 4.2.2 acceptance criterion) |
| Institution data: schedule, last run, outcome, counts, errors, retry | ✅ Unchanged (FRD 7.2.1) |
| Records Needing Attention | ✅ Unchanged |
| Academic structure **view-only**; no course authoring | ✅ Unchanged (FRD 3.4.x Phase 2) |
| Learner Access Check proving the handoff | ✅ Unchanged |
| `DA-07` eligibility editor labelled reversible, assigner **not claimed** | ✅ **Still correct** — `PM29-A3` is still open |

## D.2 What is impacted

| # | Area | Verdict | Magnitude | Detail |
|---|---|---|---|---|
| 1 | **People — manual creation** | 🔴 **ADD** | **HIGH** | `DA-04`: *"the Institute Admin creates accounts manually — no such control exists"*. `PM29-10` requires one |
| 2 | **People — bulk CSV import** | 🔴 **ADD** | **HIGH** | No import surface of any kind. Needs upload → validate → per-row error report → commit → outcome. ⚪ **Schema blocked by `PQ-10`** |
| 3 | **Faculty provisioning** | 🟠 **FILL** | MEDIUM | Faculty rows show `—` in Source *"because who creates a Faculty account is undefined"*. `PM29-10` answers it: the Tenant Admin |
| 4 | **Content-access origin actor** | 🟢 **FILL** | LOW | `PM29-23` → *Super Admin*. **One line changes; the model does not** |
| 5 | **Programme vs Academic stream** | ⚪ **PENDING** | **HIGH** | Batch 03 deliberately avoided *program*. Is the PM's *Programme* the stream, a level above, or the deferred certification node? → `PQ-04` |
| 6 | **Course ID / Code** | 🔴 **ADD** | MEDIUM | No course-code field exists. *"May vary by institution"* implies it belongs to the **tenant mapping**, not the central record — a structural point, unresolved |
| 7 | **Semester** | ⚪ **PENDING** | MEDIUM | No Phase-1 basis anywhere. Its only v5 appearance is a Phase-2 version-locking line |
| 8 | **`Institute Admin` → `Tenant Admin`?** | ⚪ **PENDING** | LOW *(wide)* | Every screen, route, document and prototype string. Must happen **once** → `PQ-09` |
| 9 | **Learner-assignment owner** | ⚪ **PENDING** | MEDIUM | `DA-07` holds meanwhile → `PQ-05` |
| 10 | **CSV as a third write path** | ⚪ **SHARPENS `QD-01`** | MEDIUM | ERP is authoritative (7.1.1) and sync overwrites. **What happens when CSV and ERP disagree about the same person is undefined** — and it is now a real, reachable conflict |
| 11 | Institution creation / deletion absent | ✅ **Still correct** | — | Batch 03 says it is *"platform-side and absent"*. `PM29-07`/`PM29-22` confirm it is platform-side |

> **Impact 10 deserves its own line in the PM conversation.** Adding a manual and a CSV route beside an authoritative ERP creates a **write-conflict** that `QD-01` (*which fields are user-editable vs ERP-owned?*) has left open since Review 006. It is not a new question — but `PM29-10` makes it unavoidable.

**Verdict: HIGH. One whole capability area (people provisioning) is missing; everything else either holds or gains a value it was built to receive.**

---

# Part E · Batch 04 — B2C learner access

## E.1 Reusable — carry forward

| Asset | Why it survives |
|---|---|
| **The access record `{ via, on, ref }` as the single spine** | ✅ **Architectural.** Card state, detail, summary, outcome and My Learning are all functions of it. A cart, a request list or an authorisation step would all grant through the same path |
| Catalogue card — six fields, one action, fixed-height blocks | ✅ Reusable in a public catalogue |
| Grid + four filter controls | ✅ Reusable |
| Module detail page | ✅ Reusable; gains learning outcomes + preview |
| Access-state derivation `none` / `some` / `all` | ✅ Reusable — a signed-out visitor is the `none` case with a different CTA |
| Payment outcomes — success · declined · indeterminate | ✅ FRD 9.1.x requires all three |
| **Only success writes** | ✅ Architectural |
| Duplicate access blocked **at the route**, not hidden on the card | ✅ Reusable |
| Access history (`B2C-06`) | ✅ Keep |
| My Learning convergence | ✅ **This is where both routes meet** |

## E.2 Needs rethinking

| # | Element | Verdict | Magnitude | Detail |
|---|---|---|---|---|
| 1 | **Authenticated-first Explore** | 🔴 **SUPERSEDED as a position** | **ARCHITECTURAL** | `PM29-02`. It was correct against FRD FLOW 3; the position moves, the components do not |
| 2 | **Direct checkout emphasis (`DA-01`)** | 🟠 **HOLD** | **HIGH** | `PM29-A6`. Already labelled reversible, MEDIUM impact, spine unaffected. **A B2B request list is a different object, not a modification of `DA-01`** |
| 3 | **Bundle model** | ⚪ **BLOCKED** | **HIGH** | `PM29-A2`. Four candidate meanings. Note: the FRD's own glossary carries **no cardinality**, so the interpretation the PM rejected was never sourced |
| 4 | **Partly-held bundle (`DA-10`)** | ⚪ **BLOCKED** | MEDIUM | Downstream of the same definition. `Q-45` still open |
| 5 | **No commercial duration** | 🟢 **ADD, no retraction** | MEDIUM | Batch 04 shows **no** term, renewal, recurrence or cancellation. `PM29-19` is a clean addition |
| 6 | **B2C-first framing** | 🟢 **RECLASSIFY** | LOW | Documentation only |
| 7 | **`Module` / `Bundle` card labels** | ⚪ **PENDING** | LOW *(wide)* | 🔴 **Batch 04 is internally inconsistent today**: card chip `Module`, table header `Experiment` → `PQ-04` |
| 8 | Technology as a purchasable variant | ⚪ **BLOCKED** | **HIGH** | `PM29-18`. Formats are informational badges today |

## E.3 Migration path

```
TODAY                              TARGET
─────                              ──────
sign in → Explore → detail          public catalogue → detail
        → Get access                        │
        → single-item checkout      ┌───────┴────────┐
        → payment                   ▼                ▼
        → access → My Learning   B2B PRIMARY     B2C SECONDARY
                                 request-first    period-based access
                                 ⚪ PM29-A6       ✅ PM29-19 periods
                                                  ⚪ PM29-A5 authorisation
                                        └───────┬────────┘
                                                ▼
                                          ACCESS RECORD
                                          (unchanged spine)
                                                ▼
                                          MY LEARNING
```

**Four moves, in order:** lift the catalogue out from behind sign-in → add the entry fork above it → add a period selector to the individual path → re-label once. **Move 1's CTA and moves 3–4 are all blocked.**

**Verdict: ARCHITECTURAL for the entry model; MEDIUM for everything else. No component is wasted.**

---

# Part F · Batch 05 — Super Admin

**The batch most changed by 29 August — because the meeting supplied exactly the source material its audit could not find.**

## F.1 The core finding, restated

Batch 05's audit concluded:

> *"Super Admin holds exactly two clean write actions in Phase 1 — release or hold a module version (2.3.2), and approve a device-replacement licence transfer (2.4.2) — plus one bounded read capability: cross-institution governance and operational oversight (1.3.5)."*

**That was correct on the evidence available.** Its `R-01`…`R-14` table refuted fourteen candidate capabilities **on the explicit ground that no source named them**. Four of those refutations now have a source.

## F.2 Capability-by-capability

| Batch-05 position | 29 Aug direction | Verdict | Magnitude | Reason | Source confidence |
|---|---|---|---|---|---|
| `C-01` cross-tenant oversight, **read-only** (`SA-02`/`SA-03`) | `PM29-22` tenant governance | **MODIFY** | **ARCHITECTURAL** | `D-02` asked *"which cross-tenant writes does 1.3.5 authorise?"* and answered *none, pending*. **Now too conservative** | 🔵 HIGH on direction · ⚪ on the action list |
| `C-02` version release / hold (`SA-04`/`SA-05`) | `PM29-A1` ambiguous | **PENDING — keep meanwhile** | **HIGH** | `D-01` already flags exactly this. **Do not remove on ambiguity** | ⚪ OPEN |
| `C-03` device-replacement approval (`SA-06`/`SA-07`) | Untouched | **KEEP** | — | FRD 2.4.2 unaffected | ✅ CONFIRMED |
| `C-04` operational status, no analytics (`SA-01`) | `PM29-21` central role | **KEEP + EXTEND** | MEDIUM | New work items (tenant requests, allocations) belong on the overview. **Still no dashboard** — PM-11 | 🔵 HIGH |
| `C-05` licence visibility, **no seat figure** (`SA-08`) | `PM29-20` no seat model | **KEEP — validated** | — | `R-10` was right | ✅ CONFIRMED |
| `C-06` platform role holders, **read-only** (`SA-09`, `DA-04`) | `PM29-22` role governance | **MODIFY** | **ARCHITECTURAL** | Authority is now directional. **Mechanism is still `QD-02`** — a control cannot be designed without it | 🔵 HIGH on authority · ⚪ on mechanism |
| `SA-10` configuration **register**, zero invented controls | Untouched | **KEEP** | — | `P-06` still open | ✅ Correct |
| **`R-01`** institution creation / onboarding — REFUTED | `PM29-07` platform validation + authorisation | 🔴 **REFUTED → OPEN** | **ARCHITECTURAL** | FRD 4.2.1 is self-registration, but a platform-side step now exists. **Actor still unnamed** | 🔵 HIGH that it exists · ⚪ who |
| **`R-02`** assign the first Institute Admin — REFUTED | `PM29-22` define/authorise the Tenant Admin | 🔴 **REFUTED → OPEN** | **ARCHITECTURAL** | Authority directional; `QD-02` withholds the mechanism | 🔵 HIGH on authority |
| **`R-03`** Vendor account administration — REFUTED | `PM29-24` Vendor governance | 🔴 **REFUTED → OPEN** | **HIGH** | Scope unknown: global? per course? per experiment? | 🟠 READ-BACK |
| **`R-04`** Academic Reviewer administration — REFUTED | `PM29-24` Reviewer governance | 🔴 **REFUTED → OPEN** | **HIGH** | Same | 🟠 READ-BACK |
| **`R-05`** grant/revoke a **learner** entitlement — REFUTED | `PM29-23` is about **tenants** | ✅ **STILL REFUTED** | — | FRD 8.1.3 names Institute Admin; `OQ-04` open. **Different altitude** | — |
| **`R-06`** assign courses/modules **to learners/cohorts** — REFUTED | `PM29-23` is about **tenants** | ✅ **STILL REFUTED** | — | FRD 8.1.4 is the Faculty role definition | — |
| **`R-08`/`R-09`** institution SSO / ERP configuration — REFUTED | Untouched | ✅ **STILL REFUTED** | — | FRD 4.2.2 / 7.1.x acceptance criteria assign both to Institute Admin — Batch 03 | — |
| **`R-14`** unpublish / withdraw content — REFUTED | Untouched | ✅ **STILL REFUTED** | — | No source; would contradict PM-16/17/18 through a side door | — |
| **NEW** — tenant content allocation | `PM29-23` | 🔴 **ADD** | **ARCHITECTURAL** | **No surface exists at either end of the granting side** | 🔵 HIGH |
| **NEW** — tenant request queue and decision | `PM29-07` + `PM29-A4` | 🔴 **ADD, if in-product** | **ARCHITECTURAL** | Depends entirely on the actor answer | ⚪ OPEN |
| `O-01` publication removed | Untouched by 29 Aug | ✅ **KEEP REMOVED** | — | PM-16/17/18 stand. **20+ source restatements still assert the old model** — the requirement-safety audit is still needed | ✅ CONFIRMED |
| `QP-26` SA return authority | Untouched | ⚪ **STILL OPEN** | — | Nothing in this meeting addresses it | ⚪ OPEN |

## F.3 Which read-only assumptions are now too conservative

**Exactly three. Named precisely, so the correction is bounded:**

| # | Assumption | Now |
|---|---|---|
| 1 | **`D-02`** — the institution surfaces are entirely read-only; no cross-tenant write is designed | 🔴 **Too conservative.** `PM29-22` (tenant governance) + `PM29-23` (tenant content) are both writes against the institution object |
| 2 | **`DA-04`** — `SA-09` platform roles is read-only, with no create/assign/revoke control | 🔴 **Too conservative on authority.** `PM29-22`. ⚠️ **But still correct on mechanism** — `QD-02` is unanswered, and a control cannot be designed without knowing whether people are invited, created, imported or mapped |
| 3 | **`SA-09`'s on-screen statement** — *"No institutional person appears on this screen. No institutional role can be assigned from here."* | 🔴 **Too conservative.** `PM29-22` explicitly includes defining and authorising the Tenant Admin |

**Which are still correct, and should not be loosened by association:**

| Assumption | Status |
|---|---|
| No seat, cap or capacity figure | ✅ **Validated by `PM29-20`** |
| No publish control | ✅ PM-16/17/18 |
| No unpublish / withdraw | ✅ No source |
| No assessment surface of any kind | ✅ `R-07` — zero Super Admin occurrences across all eleven assessment requirements |
| No institution SSO / ERP configuration | ✅ Assigned to Institute Admin by acceptance criteria |
| Mechanism-neutral release copy | ✅ PM-05 `QT-01` still pending |
| Configuration as a **register**, not a settings page | ✅ No Phase-1 setting is named anywhere |

**Verdict: ARCHITECTURAL. Batch 05 is not wrong — it is smaller than the platform now needs, in four specific places, and its own audit structure makes each of them straightforward to reopen.**

---

# Part G · Roll-up

## G.1 By batch

| Batch | Verdict | Magnitude | Blocked on PM? |
|---|---|---|---|
| **01** Content governance + XR access | ✅ **Largely intact** | LOW–MEDIUM | Only `PM29-A1` |
| **02** Assessment | ✅ Core intact · 🟠 Faculty workspace incomplete | MEDIUM | `PQ-04`, `PQ-14` |
| **03** Institute Admin | ✅ Model validated · 🔴 **one capability area missing** | **HIGH** | `PQ-04`, `PQ-05`, `PQ-09`, `PQ-10` |
| **04** B2C learner access | ✅ Components reusable · 🔴 **entry model superseded** | **ARCHITECTURAL** | `PQ-02`, `PQ-06`, `PQ-07`, `PQ-08` |
| **05** Super Admin | 🟠 **Correct but too small in four places** | **ARCHITECTURAL** | `PQ-01`, `PQ-03`, `PQ-15` |

## G.2 By magnitude

| Magnitude | Count | Examples |
|---|---|---|
| **ARCHITECTURAL** | **7** | Public discovery position · tenant content allocation · Super Admin tenant governance · Super Admin role governance · tenant onboarding · B2C entry model · `R-01`/`R-02` reopening |
| **HIGH** | **11** | People provisioning · Bundle · version release · Programme · technology-as-level · CSV schema · Vendor/Reviewer governance · Module-vs-Experiment · cart-vs-request · `DA-01` · tenant application |
| **MEDIUM** | **13** | Faculty experiment browse · Faculty progress · entry fork · course code · semester · access periods · experiment↔course mapping · public detail content · … |
| **LOW** | **6** | Reclassifications, label pending states, documentation notes |

## G.3 The single most important sentence in this analysis

> **No batch needs to be thrown away, and no batch is wrong.**
> Three of the five (**01**, **02**, **03**) are substantially validated by the new direction — and Batch 03's most conservative choices, the ones that looked over-careful at the time, are the ones that now receive their answers cleanly. **What changed is not the quality of the work; it is the size of the platform around it.**
