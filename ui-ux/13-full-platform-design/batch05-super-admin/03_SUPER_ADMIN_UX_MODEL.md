# 03 — Super Admin UX Model

| | |
|---|---|
| **Document ID** | `BATCH05_SUPER_ADMIN_UX_MODEL` |
| **Batch** | 05 — Super Admin + platform-wide administration |
| **Date** | 27 August 2026 |
| **Covers** | The workspace: its shape, its navigation, its vocabulary, its assumption register and its open questions |

---

## 1 · The idea the workspace is built on

A Super Admin sees across every institution and acts inside almost none of them.

That asymmetry is not a limitation to work around — it is the role, and the whole workspace is arranged to make it legible. Three consequences follow, and they explain nearly every design decision in this batch.

**One · The workspace is a work list, not a dashboard.**
FRD Table 41 sets the Phase-1 reporting need as *"cross-tenant operational oversight and content pipeline status. **No detailed analytics in Phase 1**,"* and §6.7.3 prohibits cross-tenant analytics dashboards outright. So the home screen answers *"what needs a decision from me?"* and nothing else. There are two numbers on it. Both are counts of platform work items awaiting this person, both are also in the navigation, and both disappear when the work is done.

**Two · Every read carries its owner.**
Where the workspace shows something another role controls — an institution's sign-in, its data connection, its stream mapping — it names that role beside the fact. A deliberate absence that is explained reads as a decision; the same absence unexplained reads as an unfinished screen. This is the **boundary note**, and it is the component Batch 05 uses most.

**Three · A gap is shown as a gap.**
Several Phase-1 requirements exist whose *mechanism* does not: how an institutional licence is transacted, who provisions a role, whether a device request can be declined. Where the workspace reaches one, it says so on the screen, in product language, and offers no control. It never shows a disabled button — a greyed-out control implies the route exists and is merely unavailable, which is the opposite of true.

## 2 · Navigation

**Derived from the surviving capabilities.** Not copied from the Institute Admin workspace, not copied from the Content Manager's, and not carried over intact from the pre-override model.

```
Overview                    what needs a decision                       FRD 8.1.1 · PM-11
Institutions                every institution, read-only                FRD 1.3.5 · PM-13
Releases              [n]   module versions awaiting a decision         FRD 2.3.2
Device requests       [n]   individual learners awaiting approval       FRD 2.4.2
Licensing                   access records, shown as existing           FRD 8.1.1 · 6.2.x
Platform                    ├── Platform roles      read-only           FRD 8.1.1 · QD-02
                            └── Configuration       the register        FRD 8.1.1
```

Six primary items, depth two at most — the same shape as the Institute Admin workspace in Batch 03, so the two read as one platform.

### How it departs from Table 41

Detailed FRD Table 41 records the pre-override navigation as *"Overview · Publishing · Content · Institutions · Licensing · Platform · Account."* Batch 05 departs in exactly three places, each for a stated reason:

| Table 41 | Batch 05 | Why |
|---|---|---|
| **Publishing** | *struck* | `PM-16` / `PM-17` / `PM-18` moved publication to the Content Manager. **Nothing replaces it.** |
| **Content** | *struck* | With publication gone, the only content this role still touches is a version awaiting a release decision — which is what *Releases* is. A second content catalogue would duplicate the Content Manager's Published Content screen (`CM-03`), which Batch 01 already reassigned away from Super Admin |
| — | **Releases** | FRD 2.3.2 has a Phase-1 surface and had no navigation entry of its own, because Table 41 folded it into *Publishing* |

Overview, Institutions, Licensing, Platform and Account are Table 41's, unchanged.

### Counts

Only two navigation items carry a count, and both count **platform work awaiting this person** — never tenant data, and never anything aggregated across institutions. A count of zero is not rendered: an empty badge is noise, and its absence is already the message.

## 3 · The shell

Batch 01's chrome (`SHR-02`), unchanged, with **one addition and one deliberate omission**.

**Added — the scope bar.** Every Super Admin surface declares its scope in the same place, in the same shape, immediately below the breadcrumb. There are only two kinds:

```
  ⊕  VIEWING                Platform-wide view. Institutional figures are shown
     The platform           on an institution's own page, never combined here.

  ⌂  VIEWING INSTITUTION    Everything on this page belongs to this institution
     Meridian College…      alone. Nothing here is combined with any other.
```

The institution variant is tinted, so the moment of crossing into a tenant is never invisible. This is the structural half of AC-04 — see [`05_CROSS_TENANT_MODEL.md`](05_CROSS_TENANT_MODEL.md) §3.

**Omitted — the institution chip.** Batch 03's header carries the institution name, because an Institute Admin is always inside one. Super Admin is not: FRD 1.3.5 places the role above every tenant and `PM-13` confirms it is the only role spanning planes. An institution name in the global chrome would imply a current tenant this role does not have. The institution appears inside the page, in the scope bar, only while one is open.

## 4 · Vocabulary

The words are load-bearing in this batch, because the risk it exists to avoid is a wording risk.

| Batch 05 uses, for Super Admin | Batch 05 never uses, for Super Admin |
|---|---|
| **Release version** · **Hold version** *(the two controls)* | Publish · Publishing · Published · Ready to publish |
| Held · Released · Version | Publication gate · Publish queue |
| Production *(consequence only, in FRD 2.3.2's words)* | **Release to production · Production release · Hold release** |
| Approve *(a device transfer only)* | Approve *(content)* · Return · Request changes · Reject · Decline |
| Operating · Attention needed · Setup incomplete | Active · Inactive · Suspended · Expired |
| Content access · Access record | Licence purchase · Subscription · Plan · Seat · Price |
| Awaiting a decision | Pending approval *(of content)* |

**The two controls are named for what they act on — the version.** *Release version* and *Hold version*. The first pass used *Release to production*, *Production release* and *Hold release*; all three are retired from every control, dialog title, confirmation label and page head. An action named for a **destination** reads as a second shipping gate, and the shipping gate is publication — which has already happened, and is the Content Manager's. *Production* survives only where it explains the **consequence**, in FRD 2.3.2's own words, and never as the name of an action.

**Publication is stated on the screen as already complete.** `SA-04`'s lead alert reads *"Content publication has already occurred — this screen is version release control only"*; `SA-05` repeats it in a boundary note carrying the module's own publication date. Neither screen is a second publication gate, and neither may become one.

**"Published" does appear** — as a fact about a module (*"published on 11 Aug 2026 by the Content Manager"*) and in boundary notes naming who owns publication. It never appears as a control, and the requirement-safety audit verifies that across every control on every route.

**"Ready to Publish" is retired platform-wide.** Batch 01 retired it because it only ever described a hand-off from the Content Manager to the Super Admin. Batch 05 does not revive it under that name or any other.

## 5 · Design assumption register

Every assumption Batch 05 introduces. Each is reversible, and each names the PM question that would resolve it.

---

### `DA-01` — Institution state is **derived**, not stored

**Decision.** An institution's operating state is computed at render time from three observable readiness facts, each with its own requirement — a content access record exists (6.2.1 / 6.2.2), institutional sign-in is configured (4.2.2), the institution data integration ran (7.1.1 / 7.2.1). Three outcomes: **Operating**, **Attention needed**, **Setup incomplete**.

**Why necessary.** SA-02 and SA-03 need a state to show, and a cross-institution list is unreadable without one.

**Source gap.** No requirement defines an institution lifecycle. Nothing stores a status.

**Why this form.** Deriving from facts that *are* required invents no new data and no new state machine. The ledger shows the three facts and their provenance alongside the derived word, so the derivation is always visible rather than asserted.

**Deliberately excluded.** No *Inactive*, *Suspended*, *Expired* or *Cancelled*. Each of those is the **result of an administrative action**, and no source defines a Super Admin action that produces one. Adding them would smuggle in a capability through a status label.

**Reversibility.** **High.** If a lifecycle is later defined, `stateOf()` reads it instead of deriving it; the ledger and the pill are unchanged.
**Impact if changed.** The three state labels and the overview's "not yet fully operating" grouping.
**PM question.** *Does an institution have a stored lifecycle status in Phase 1, and if so who changes it?*

---

### `DA-02` — The cross-tenant surface is **read-only**

**Decision.** No cross-institution write control exists anywhere. Not suspend, not activate, not a status change, not a configuration edit.

**Why necessary.** FRD 1.3.5 grants *"controlled access to **view and manage** data across tenants."* The word *manage* implies a write. **No source names a single cross-tenant management action**, and the Review-006 matrix's own note concedes its `M` is *"derived from 1.3.5"* rather than from a requirement of its own.

**Why this form.** The least-assumptive reading. The batch brief's rule is applied literally: *"Any write action requires explicit source authority. If only visibility is confirmed: make it read-only."* SA-03 states the gap on the page and leaves room in the layout for the control that would fill it.

**Reversibility.** **High.** A governance write drops into the existing detail layout without restructuring.
**Impact if changed.** SA-03 gains an action region; SA-02 may gain a row action.
**PM question.** *Which specific cross-tenant actions does 1.3.5's "manage" authorise?* → see judgement call **D-02** in the audit.

---

### `DA-03` — **No institution onboarding surface**

**Decision.** No *add institution*, no onboarding wizard, no first-admin assignment. SA-02 shows institutions that already exist.

**Why necessary.** A reviewer arriving at a platform admin workspace expects to create a tenant.

**Source gap.** FRD 4.2.1 reads *"**Institutions shall register their organization** through the platform's institutional onboarding interface"* — the grammatical subject is the institution, and its acceptance criterion names no role at all. FLOW 6 step 1 attributes onboarding **jointly** to Institute Admin and Super Admin. How the first Institute Admin comes to exist is stated nowhere.

**Reversibility.** **High.** A create flow is additive; nothing in Batch 05 assumes institutions cannot be created.
**Impact if changed.** SA-02 gains a primary action and a new screen.
**PM question.** *In Phase 1, who registers an institution, who activates it, and who assigns its first Institute Admin?*

---

### `DA-04` — **Platform roles are read-only**

**Decision.** SA-09 lists who holds each central-plane role. No assign, revoke, invite, create or deactivate control.

**Why necessary.** §6.7.2 confirms *"platform configuration and platform role assignment"* as a permission, so omitting the area entirely would under-serve a confirmed authority.

**Source gap.** **`QD-02`, an open HIGH question.** The Detailed FRD states it plainly: *"Super Admin assigns platform roles under 8.1.1; how a person becomes Faculty or Institute Admin within a tenant in Phase 1 is recorded as an open question."* Designing an assignment control would mean choosing a provisioning mechanism.

**Also.** Only **central-plane** roles appear. Institute Admin, Faculty and Learner are tenant-internal and deliberately absent — their absence is stated on the screen.

**Reversibility.** **High.** Actions are additive to an existing table.
**Impact if changed.** SA-09 gains controls and at least one dialog.
**PM question.** *What is the Phase-1 provisioning mechanism for a platform role — and who provisions Vendor and Academic Reviewer accounts?*

---

### `DA-05` — Configuration is a **register**, not a settings page

**Decision.** SA-10 renders fifteen configuration areas, each with its source status: *built here*, *another role owns it*, *a later phase*, *not defined anywhere*. **Zero invented controls.**

**Why necessary.** FRD 8.1.1 confirms *"full administrative control over platform configuration"* in as many words, and **no source names a single Phase-1 platform-wide setting**.

**Why this form.** A settings page invented to fill that space would be the most misleading artefact this batch could produce: it would look like a specification, and every control on it would be fiction. The register is the honest version, and the screen's content *is* the finding.

**Reversibility.** **High.** Each row becomes a real control when a requirement gives it one.
**Impact if changed.** SA-10 becomes a form; the register survives as its index.
**PM question.** *Which specific platform-wide settings exist in Phase 1?*

---

### `DA-06` — **A hold carries no reason**

**Decision.** Holding a release records the state and nothing else. No reason field, no comment, no note.

**Why necessary.** Holding is required to be *"an available and visible outcome"* (2.3.2 acceptance criterion), and a reviewer expects to say why.

**Source gap.** **`GP-4`** — Phase 1 defines no audit trail outside content governance: *"Audit trails for licensing changes, entitlement grants, platform configuration and device-replacement approvals are not defined by any requirement and are not invented here."* A recorded justification would be a record the requirement set has not got.

**Reversibility.** **High.** A reason field is additive to the existing dialog.
**Impact if changed.** The hold dialog gains a field; SA-05 gains a display line.
**PM question.** *Is a release decision recorded, and if so with what?* — part of the broader `GP-4` question.

---

### `DA-07` — **Approve is the only device-request outcome**

**Decision.** SA-07 offers Approve. There is no decline, and the absence is shown as a **marked gap on the page**, not as a disabled control.

**Why necessary.** A reviewer will ask what happens to a request that should not be granted.

**Source gap.** FRD 2.4.2's row records it verbatim: *"The FRD describes no rejection path, no evidence requirement and no limit on replacement frequency — all PENDING DECISION."*

**Why not a disabled button.** A greyed-out *Decline* implies the route exists and is temporarily unavailable. The route does not exist. The gap note says so.

**Reversibility.** **High.**
**Impact if changed.** SA-07 gains a second outcome, a dialog, and a third request state.
**PM question.** *What happens to a device-replacement request that should not be granted?*

---

### `DA-08` — Sample institution names, and their count

**Decision.** Five fictional institutions, spanning the three derived states, each labelled as sample design data in the prototype chrome and on the pages that use their figures.

**Why necessary.** Cross-tenant visibility cannot be demonstrated with one tenant, and AC-04 compliance cannot be demonstrated without several.

**Why five.** Enough to show a list, a filter, an empty result and every state; few enough that no reader mistakes it for a production register.

**Reversibility.** **Total** — sample data only.
**PM question.** None.

---

### `DA-09` — Three local design-system corrections

**Decision.** Batch 05 corrects two inherited token values and one inherited layout omission **locally**, in its own stylesheet. Batch 01 is not edited.

| Token | Was | Is | Why |
|---|---|---|---|
| `--text-3` | `#6A7686` — 4.30:1 on surface | `#5F6B7A` — 5.43:1 | Below AA 4.5:1 for the small text it carries. Carried forward from Batch 04 |
| **`--control-border`** *(new)* | *(`--border-strong` `#B6C0CD` — 1.84:1)* | `#7E8A99` — 3.51:1 | **New finding.** Where `--border-strong` draws the boundary of an interactive control, WCAG 1.4.11 requires 3:1. A separate token is introduced and applied **only** to inputs, selects and secondary buttons; on cards, dividers and dashed notes the boundary is decorative and is left alone |

### `OQ-03` — **OPEN**

> **Does institutional access use a learner/seat cap, and if so what is the exact model?**

Batch 05's first pass answered this question by accident. `SA-08` carried a **Student cap** column (5,400 / 900 / 1,800 / 2,600), `SA-03` carried *"Capped at 5,400 students"* and a **Student cap on the access record** key/value row, and the seed data carried a `cap` field behind them all — read from the draft FRD's seat-utilisation line at 6.2.2.

**That was not safe.** `OQ-03` is open: the later PM update reopened the institutional seat model, and a draft FRD reference must not be presented as a settled product rule. Every one of those surfaces asserted, in product language, that institutional content access *definitely has* a numeric student cap.

**Resolution.** The column, the figure, the key/value row, the seat-utilisation bullet and the underlying `cap` seed field are **removed**. **Nothing replaces them** — no alternative commercial model is invented, no expiry, package, seat, billing or term. What `SA-08` and `SA-03` now show is only what the sources support: **that an access record exists, which academic streams it covers, and the access state.** Where the absence would otherwise read as an oversight, the screen says the model is open and cites `OQ-03`.

---

**Third correction — table text hierarchy.** Batch 01's `table.dt td .tmain` / `.tsub` rules style the two spans but never set `display`, because in Batch 01 they always sat on block-level elements. `SA-04`'s module cell puts them directly inside `a.rowlink`, where they are spans — so the module name and its discipline ran together on one line. Corrected with `table.dt a.rowlink .tmain,table.dt a.rowlink .tsub{display:block}` — a **descendant** combinator, not the direct-child one the first pass used, because the two DOM shapes in this batch differ in depth and a depth-specific rule stops applying the moment a wrapper changes. Every other Batch-05 table measures identically before and after at both target widths. Verified in **Safari** as well as Chrome; see [`06_COMPONENT_EXTENSIONS.md`](06_COMPONENT_EXTENSIONS.md) §5(c) for the per-engine measurements.

**Referred upward.** All three affect Batches 01–04 as well wherever the same markup shape occurs. Shared design-system findings, recorded here for consolidation, **not fixed there by this task**.

---

### `DA-10` — Navigation labels

**Decision.** *Overview · Institutions · Releases · Device requests · Licensing · Platform*.

**Why necessary.** Table 41's list is pre-override and contains an item (*Publishing*) that must not exist.

**Source gap.** Only Table 41 names any Super Admin navigation, and it is superseded on that point.

**Reversibility.** **Total** — labels only.
**PM question.** *Is "Releases" the right product word for FRD 2.3.2, given it must not read as publication?*

---

## 6 · Open questions carried forward

**None of these is resolved by this batch.** Each is listed with what it blocks.

| # | Question | Register | Blocks |
|---|---|---|---|
| 1 | May Super Admin **return** a submission at the publication gate? | **`QP-26`** | Any return / request-changes control. **Deliberately not resolved** — see §7 |
| 2 | After Content Manager publishes content, does Super Admin still retain the separate Phase-1 **version release/hold** authority from FRD 2.3.2? | §6.6.5, new | SA-04 · SA-05. **`D-01` — OPEN PM CLARIFICATION** |
| 3 | Which specific cross-tenant **write actions** does 1.3.5's *"manage"* authorise? | new | Any write on SA-02 / SA-03. **`D-02` — OPEN PM CLARIFICATION** |
| 4 | How is an institutional **licence transacted** in Phase 1? | `QP-04`, `OQ-01`–`OQ-03`, §6.7.5 | SA-08 beyond visibility |
| 4a | **Does institutional access use a learner/seat cap, and if so what is the exact model?** | **`OQ-03`** | Any cap, seat, capacity or utilisation figure on SA-03 / SA-08. **Removed from the product UI on 29 Aug — see below** |
| 5 | What is the Phase-1 **origin of role assignment**? | **`QD-02`** (HIGH) | SA-09 actions |
| 6 | Who **creates an institution**, and who assigns its first Institute Admin? | from 4.2.1 | Any onboarding surface |
| 7 | Who **provisions Vendor and Academic Reviewer** accounts? | new | Any account registry |
| 8 | Is there an **audit trail outside content governance**? | **`GP-4`**, §6.7.5 | Any activity or history screen |
| 9 | Which **platform settings** exist in Phase 1? | from 8.1.1 | SA-10 becoming a form |
| 10 | What happens to a **device request that should not be granted**? | FRD 2.4.2 | SA-07's second outcome |
| 11 | May Super Admin see **assessment answer keys**? | §6.7.5 | Any assessment visibility |

Also carried, unchanged and unaffected by this batch: `QT-01` (XR delivery mechanism — pending by explicit PM instruction), `QT-04` (XR sign-in under SSO), `OQ-04`–`OQ-06` (entitlement assignment, learner browse behaviour, B2C purchase model).

## 7 · `QP-26` — stated plainly

> **May Super Admin also return a submission at the publication gate?**

`PM-14` names **Academic Reviewer and Content Manager only**. The 25 August update states *who publishes* and says nothing about return authority; its own text records that **`QP-26` therefore remains OPEN / PENDING and must not be recorded as resolved.**

**Batch 05 introduces no return, request-changes, reject or reopen control anywhere**, and the requirement-safety audit verifies that mechanically across every control on every route. The question is carried forward untouched.

## 8 · How the workspace reads

Not flashy, and not meant to be. The register of the whole workspace is **calm, operational and specific**: short pages, real states, no decoration, no metric that is not a count of work, no chart of any kind.

It should feel **wider** than the Institute Admin workspace without feeling more powerful — because it is wider and less powerful, and that is the honest impression. A person opening it should be able to answer *"what needs me, and what am I allowed to do about it?"* in the first screenful, and should never wonder why a control is missing, because the page will already have told them.
