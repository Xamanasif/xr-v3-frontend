# 13 — Consolidation Sequence

| | |
|---|---|
| **Status** | 🟠 **SEQUENCING PLAN — DRAFT** |
| **Created** | 29 August 2026 |
| **Driver** | `PM29-01` — *"start from the complete user journey and later combine the separate designs into the final product"* |
| **State** | **Stage 0 complete. Nothing beyond it has started, and nothing beyond Stage 1 may start** |

---

## The principle

> **Combining code is the last thing that happens, not the first.**

Merging five prototypes today would bake in: a `Module`/`Experiment` inconsistency that is already shipped, five separate navigations, a catalogue in a superseded position, a Super Admin workspace known to be too small, and a missing authentication layer. **Every one of those would then have to be unpicked from merged code rather than fixed in isolated packages.**

---

# The ten stages

## Stage 0 — Post-PM alignment ✅ **COMPLETE**
**This folder.** Extraction, precedence, conflicts, models, journeys, impact, gaps, questions, sequence, diagrams.
**Output:** twelve preserved ambiguities, ten must-answer questions, a batch impact matrix, a pre-Monday gap inventory.

---

## Stage 1 — PM clarification 🟠 **NEXT**
**Input:** `12_PM_CLARIFICATIONS_FOR_MONDAY.md`
**Output:** answers to `PQ-01` … `PQ-10`, and read-backs on `PQ-09`/`PQ-10`.
**Gate:** ⛔ **No design work on any blocked item proceeds until this happens.**

> **Only Stage 1 is authorised to start after Stage 0.** The mapping and analysis exercises in `11_SAFE_WORK_BEFORE_MONDAY.md` may run in parallel because they are blocked by nothing — including **auth analysis and IA** (`S9a`–`S9e`). ⛔ **Building the authentication surface is not among them**: auth routing intersects five open questions, so it waits for Stage 1 like every other blocked item.

---

## Stage 2 — Update the requirement and decision register
Convert confirmed `PM29-nn` items into the authoritative chain, continuing at **PM-19**.

| Task | Detail |
|---|---|
| Issue `PM_CONFIRMED_UPDATE_2026-09-xx.md` | Only for items the PM actually confirms. **Same authority-rule structure as the 18/19/25 August captures** |
| Record every FRD deviation and extension | Public browsing · Programme · MR · technology-as-level · CSV people import · subscription periods · free institutional branch · tenant approval states. **The FRD is never edited** |
| Update the open-question register | Close what is answered. **Do not close what is not.** Add the new ones |
| Re-issue `01_PM_2026-08-29_DECISION_EXTRACTION_DRAFT.md` status | DRAFT → superseded by the confirmation document |

**Do NOT** edit the 18/19/25 August captures, Review 006, or the FRD. They are historical records — the same rule those documents applied to their own predecessors.

---

## Stage 3 — Correct the affected functional batches
**Only what the answers require.** Each batch is corrected **in place, in its own package**, still separate.

| Batch | Likely work | Depends on |
|---|---|---|
| **01** | Experiment ↔ course mapping in submission; version-release boundary | `PQ-01`, `PQ-20` |
| **02** | Terminology; Faculty view of tenant experiments; progress scope | `PQ-04`, `PQ-14` |
| **03** | **People provisioning — manual + CSV**; content-access origin actor; course code; possible role rename | `PQ-03`, `PQ-09`, `PQ-10` |
| **04** | Catalogue position; CTA; bundle; access periods; terminology | `PQ-02`, `PQ-06`, `PQ-07`, `PQ-08` |
| **05** | Tenant governance; tenant content allocation; role governance; version-release outcome | `PQ-01`, `PQ-03`, `PQ-15` |

**Rule:** a correction is a **correction**, not a redesign. Anything that turns into a redesign belongs in Stage 5.

---

## Stage 4 — Formal Phase-1 gap audit
**The real one**, replacing the pre-Monday inventory in document 10.

| Task | Detail |
|---|---|
| Re-audit all Phase-1 requirements | Working set: **76 + 2 PM-deferred** (PM-12) |
| Map every requirement to an owning role and a screen | Extends the Review-006 method with the new surfaces |
| Reconcile the 104-screen inventory against what is actually built | Built · partially built · untouched · superseded |
| Produce the build backlog | **This is the artefact Stage 5 works from** |

> **Why it waits for Stage 3:** an audit run before corrections measures the wrong thing and has to be redone.

---

## Stage 5 — Build the missing UX
**Ordered by dependency, not by workspace.**

| # | Area | Note |
|---|---|---|
| 1 | **Authentication and workspace resolution** | ⛔ **Build waits for Stage 1.** Auth *routing* intersects the entry fork, tenant authorisation, individual authorisation, SSO fallback (`QT-04`) and the Student/Learner label. The **analysis and IA** (`S9a`–`S9e`) may run before Stage 1; the surface may not. Everything public depends on it, which is why it is first once unblocked |
| 2 | **Public landing, catalogue, course page, experiment detail** | Structure safe now; CTA needs `PQ-06` |
| 3 | **Entry fork** | Institution / Individual |
| 4 | **Tenant application → validation → authorisation → creation** | Needs `PQ-03`. **Reuses Batch 01's governance-review pattern if in-product** |
| 5 | **Super Admin tenant content allocation** | Needs the allocation unit. **The receiving end already exists in Batch 03** |
| 6 | **Tenant Admin people provisioning — manual + CSV** | Needs `PQ-10`. **Reuses Batch 02's upload → per-row error → commit pattern** |
| 7 | **Faculty view of tenant experiments** | Reuses Batch 04's catalogue components |
| 8 | **Learner device binding + replacement request** | `LRN-16`/`LRN-17`. **The approval end already exists in Batch 05** — this completes a half-built cross-plane workflow |
| 9 | **B2C access periods** | Secondary priority per `PM29-05` |
| 10 | Remaining gap-audit items | From Stage 4's backlog |

---

## Stage 6 — Unified information architecture
| Task | Detail |
|---|---|
| One sitemap across every workspace | Public · auth · nine workspaces |
| One navigation model | Per-workspace nav content, **identical chrome** — the Review-006 rule |
| Resolve terminology **once**, everywhere | From `PQ-04`, `PQ-09`, `PQ-12` |
| One design-system source of truth | Batches 02–05 each carry a byte-identical stylesheet copy — correct per batch, **one source on consolidation** |
| Reconcile screen IDs | Batch-local IDs (`INA-nn`, `S01`…) → the stable Review-006 inventory |

---

## Stage 7 — One consolidated interactive prototype
**The first stage that merges anything.**

| Task | Detail |
|---|---|
| One shell, one router, one state model | Replaces five `sessionStorage` models |
| One design system | From Stage 6 |
| End-to-end journeys, not per-batch demos | Public → request → tenant → provision → learn, and public → individual → access → learn |
| Cross-workspace continuity | The same sample institution, people and experiments already run through all five batches — **a real asset** |

**⛔ This is the first point at which merging is allowed.** Doing it earlier is the specific mistake this sequence exists to prevent.

---

## Stage 8 — Stakeholder review
The consolidated prototype, reviewed as one product. Findings feed back to Stage 5 or Stage 6, **not** into an unplanned redesign.

---

## Stage 9 — Final visual redesign
The first stage that changes how anything **looks**. Everything before it is structure, behaviour and correctness. Figma resumes here, per PM-02 and the `FIGMA_HANDOFF_LATER.md` notes each batch already carries.

---

## Stage 10 — Responsive, accessibility and handoff
| Task | Detail |
|---|---|
| Resolve `QX-01` | Does desktop-first ~1440px extend to every workspace? **A public catalogue is not a desktop-only surface in practice** |
| Resolve `QX-02` | WCAG 2.2 SC 1.4.10 Reflow — currently **NOT MET** by agreed scope, across nine workspaces |
| Full WCAG 2.2 AA pass | On the consolidated product |
| Developer handoff | Specs, tokens, states, acceptance criteria |

---

# Reuse from every current batch

**The point of the sequence is that almost nothing is thrown away.**

## Batch 01 — Content governance + learner XR access
| Asset | Reuse |
|---|---|
| **Application shell, side nav, header, breadcrumb, page header** | ✅ **The shell for the entire consolidation** |
| **Governance queue + review panel + decision dialog + required reason + history timeline + stage indicator** | ✅ **Near-exact fit for tenant-application review** (`PQ-03`) |
| Status badge grammar — governance and XR sets | ✅ Extends to new states |
| Alerts · toasts · empty states · loading · error grammar | ✅ Platform-wide |
| File upload with no format promise | ✅ Reusable for CSV import |
| Metadata group — read-only and editable twins | ✅ Reusable for the application form |
| XR access components — entitlement, compatibility, availability, completion | ✅ The learner core |
| **`Experiment` terminology** | ✅ **The best-aligned batch** if `PQ-04` chooses *Experiment* |

## Batch 02 — Assessment
| Asset | Reuse |
|---|---|
| Assessment builder · question bank · question editor · AI drafts | ✅ Unchanged |
| Configuration-generated learner disclosure | ✅ Unchanged |
| Attempt · review · submit · result · pending-evaluation | ✅ Unchanged |
| **Upload → per-row validation → error report → commit** | ✅ **Near-exact fit for CSV people import** |
| Completeness rail | ✅ Reusable on any multi-step configuration |

## Batch 03 — Institute Admin
| Asset | Reuse |
|---|---|
| **Content access → eligibility → learner spine** | ✅ **Architectural — `PM29-23` fills its one blank** |
| People directory · person detail | ✅ The base that provisioning attaches to |
| Academic structure — streams, groups, courses | ✅ Reusable |
| SSO configure → check → turn on | ✅ Unchanged |
| Institution data — schedule, history, errors, retry | ✅ Unchanged |
| Records Needing Attention | ✅ **A strong pattern** — reusable for CSV import errors |
| Two-directional mapping view | ✅ Reusable for tenant content allocation |

## Batch 04 — B2C learner access
| Asset | Reuse |
|---|---|
| **Access record as the single spine** | ✅ **Architectural** |
| Catalogue card · grid · four filter controls | ✅ **The public catalogue's basis** |
| Module detail | ✅ The public experiment page's basis |
| Access-state derivation `none`/`some`/`all` | ✅ A signed-out visitor is the `none` case |
| Payment outcomes — success · declined · indeterminate | ✅ FRD 9.1.x requires all three |
| Only success writes · duplicate blocked at the route | ✅ Architectural |
| My Learning convergence | ✅ **Where both routes meet** |

## Batch 05 — Super Admin
| Asset | Reuse |
|---|---|
| The **authority audit method** — classify every candidate against verbatim sources | ✅ **The most transferable thing in the batch.** Apply it to the new Super Admin areas |
| Institutions list + detail | ✅ The base that governance actions attach to |
| Version release / hold | ⚪ Pending `PQ-01` |
| Device replacement approval | ✅ Unchanged — **and it completes once `LRN-16`/`LRN-17` are built** |
| Configuration **register** pattern — every candidate area with its real source status | ✅ **An excellent pattern for any area where authority exists and content does not** |
| *"A gap is shown as a gap, never as a disabled control"* | ✅ **A platform-wide rule worth keeping** |

---

# What must not happen

| # | Prohibited | Why |
|---|---|---|
| 1 | Merging prototypes before **Stage 7** | Bakes in known-wrong terminology, navigation and placement |
| 2 | Renaming anything before **Stage 2** | The rename must happen once |
| 3 | Running the formal gap audit before **Stage 3** | It would measure the pre-correction state and be redone |
| 4 | Visual redesign before **Stage 9** | Structure first |
| 5 | Figma before **Stage 9** | PM-02, reinforced by `PM29-01` |
| 6 | Editing the FRD, `source/`, or `requirements/` at any stage | Deviations are recorded, never applied |
| 7 | Editing the 18/19/25 August captures or Review 006 | Historical records |
| 8 | Closing an open question without a PM answer | Twelve stay visibly open |
