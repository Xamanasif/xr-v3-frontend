# 18 — Requirement Safety Check

| | |
|---|---|
| **Status** | ✅ **VERIFICATION RECORD** |
| **Created** | 31 August 2026 |
| **Purpose** | Prove that no document in this package, and not the stakeholder update it indexes, makes any of the seventeen prohibited claims |
| **Method** | Each row was **verified by direct search of the delivered files**, not recalled. Where a term appears, the row records **in what sense** it appears |

---

## The seventeen checks

| # | The claim that must NOT be made | Result | Where the correct position is stated |
|---|---|---|---|
| **1** | **Semester is mandatory** | ✅ **CORRECT** — `Semester` is stated as **OPTIONAL / tenant-selectable / never mandatory** in every occurrence. The 29 Aug handwritten "mandatory" marking is explicitly recorded as **SUPERSEDED** | `STK31-11` · `STK31-26` · `05` §4.2 · `07` §6.1 · `02` row 20 |
| **2** | **Separate `Student` and `Learner` roles** | ✅ **CORRECT** — stated as **ONE formal role, two contexts**, with no separate permission set. The planning term `Student / Learner` is used throughout | `STK31-01` · `04` §1 · `09` §1 · `02` row 3 |
| **3** | **B2C is the current primary delivery** | ✅ **CORRECT** — **B2B is the current delivery priority**; B2C is **DEFERRED / SECONDARY**, preserved, not deleted. B2C checkout architecture is explicitly barred from driving the Phase-1 build | `STK31-04` · `03` §2, §4 · `06` §7 |
| **4** | **Lifetime access** | ✅ **CORRECT** — *"There is no Lifetime access option"* is stated wherever periods appear. Periods are **Monthly · Quarterly · Yearly** | `STK31-05` · `03` D2 · `14` `U-IND-01` |
| **5** | **First publication by Super Admin** | ✅ **CORRECT** — **first publication is the Content Manager's**, stated with the FRD 1.4.4 deviation recorded. The two withdrawn Super Admin publish screens stay withdrawn | `STK31-06` · `04` §5.1 · `10` §3, §4 · `13` Part A |
| **6** | **Later-version release by Content Manager** | ✅ **CORRECT** — **later-version Release/Hold is the Super Admin's**, and the terminology firewall is stated as mandatory | `STK31-07` · `04` §5.1 · `10` §4 |
| **7** | **A fixed universal seat cap** | ✅ **CORRECT** — *"no universal fixed seat cap"*; quantity derives **only** from the approved request. *"Do NOT restore arbitrary sample caps such as 5,400"* appears three times | `STK31-27` · `06` §5 · `07` §8.1 · `10` §7 |
| **8** | **The old arbitrary 3-module Bundle** | ✅ **CORRECT** — explicitly **SUPERSEDED**; bundling follows the Programme/Course hierarchy. It is also recorded that the rejected reading was **never FRD-sourced** | `STK31-13` · `05` §3 · `02` row 2 · `13` Part D |
| **9** | **Direct external B2B access before approval** | ✅ **CORRECT** — *"Access is NEVER granted before approval"*, with the step order drawn so payment and activation cannot precede approval | `STK31-20` · `06` §3.1 · `07` §1 |
| **10** | **Mandatory payment for internal / BITS community** | ✅ **CORRECT** — *"Do NOT create a payment screen for internal / BITS-community access where payment is not required"*, restated as **"not a hidden one, not a skipped one, not a disabled one"** | `STK31-19` · `06` §3.2 · `15` §6 rule 6 |
| **11** | **Tenant Admin can redefine the canonical Experiment catalogue** | ✅ **CORRECT** — stated as **prohibited** in the authority table, the tenant model and the correction map | `STK31-10` · `STK31-25` · `04` §3.2 · `07` §5 |
| **12** | **Vendor owns Learning Outcomes** | ✅ **CORRECT** — **Academic Reviewer owns Learning Outcomes.** The Batch 01 correction row says explicitly *"Learning Outcomes do NOT go here"* on the Vendor submission screen | `STK31-08` · `04` §3.5 · `13` Part A `S02` · `14` `U-VND-02` |
| **13** | **Descriptive grading by Academic Reviewer** | ✅ **CORRECT** — **Faculty is the ONLY human evaluator.** The Academic Reviewer row states *"Does NOT grade descriptive answers"* | `STK31-31` · `04` §3.5 · `08` §3 · `09` §7 |
| **14** | **AI auto-review automatically finalises grades** | ✅ **CORRECT** — *"Do NOT assume an AI-generated score is automatically final"*, plus *"never auto-final"* in the screen inventory and the non-blocking register | `STK31-31` · `08` §3 · `14` `U-FAC-10` · `16` `ND-09` |
| **15** | **Automatic subscription renewal** | ✅ **CORRECT** — *"Do NOT assume automatic payment, automatic renewal, or automatic charge"*. `Renewed` is reachable **only by an explicit action** | `STK31-28` · `07` §8.2 · `16` `ND-11` |
| **16** | **Source-code upload required from Vendor** | ✅ **CORRECT** — *"Source code is NOT required from the Vendor unless another source explicitly demands it"*. No source does | `STK31-37` · `11` §1 |
| **17** | **MR removed from scope** | ✅ **CORRECT** — **MR is retained** as an inherited source-supported capability, with its FRD basis (1.2.3, 2.1.2) and its own open question (`QP-14`) recorded. All four format badges are kept | `STK31-45` · `05` §6 · `11` §3 · `13` Part A |

**17 of 17 correct. Zero prohibited claims present.**

---

## Additional safety checks this package applies to itself

| # | Check | Result |
|---|---|---|
| **18** | **The stakeholder's formal company title is never asserted** | ✅ The source is named *"31 Aug stakeholder review"* or *"stakeholder-confirmed follow-up"* throughout. No title, no organisation role, no seniority claim appears anywhere |
| **19** | **PM-12 is not reversed** | ✅ The `Programme / Department Bundle` is stated as a **different object** from FRD 3.3.1's certification program, and *"no Phase-1 certification experience is created"* is written in three places |
| **20** | **PM-11 is scoped, not overridden** | ✅ *Analytics* means **operational learning analytics**. Every reporting item maps to a Phase-1 FRD **recording** requirement, and *"no invented dashboards"*, *"no revenue metrics"* and *"no decorative dashboards"* are all stated |
| **21** | **`D-25` is not overridden** | ✅ The feedback-visibility options govern **when explanations become visible after an attempt**. *"A learner never sees the correct-answer key"* is preserved explicitly |
| **22** | **PM-05 is not resolved** | ✅ `QT-01` stays open **by explicit instruction**. `STK31-37` refines packaging, **not mechanism**, and this is stated in the decision and in `11` §2 |
| **23** | **Batch 05 `R-05` / `R-06` are not reversed by association** | ✅ Stated three times, with the altitude rule spelled out — tenant-level allocation and learner-level assignment are different objects |
| **24** | **No FRD, `source/`, `requirements/`, PM capture, Review 006, batch, `15-` or `16-` file is edited** | ✅ Verified by `git status`. **Only new files exist** |
| **25** | **No prototype, HTML, JS, CSS, Figma, backend, API or database schema is created** | ✅ Every file in this package is Markdown. The data model is explicitly labelled **conceptual only, no schema** |
| **26** | **No open question is closed without an answer** | ✅ **16 `ND-nn` items** plus **16 standing register items** remain visibly open, each with a safe reversible handling. **They are implementation details, not unconfirmed decisions** |
| **27** | **No price, SLA, priority formula, payment provider, or auto-review algorithm is invented** | ✅ Each is listed under *"what this model deliberately does NOT contain"* in its own document, and again in `16` |
| **28** | **Overrides are recorded, not silently reconciled** | ✅ **23 decisions carry a 🔴/🟣 supersession marker**, and `02_PREVIOUS_DECISIONS_SUPERSEDED.md` gives all 29 rows a prior source, a new source, and a required correction |
| **29** | **The 15-day Tenant expiry reminder is REQUIRED; its channel is PENDING; the in-product `Expiring soon` row is RECOMMENDED UX only** | ✅ All three are classified separately in `STK31-28`, `07` §8.2, `10` §7, `12`, `03`, `13`, `14`, `16` `ND-16` and `diagrams/SUPPORT_FLOW.md`. **No file claims the in-product state is itself stakeholder-required**, and **no delivery channel is invented anywhere** |
| **30** | **The Question Bank action is `Delete`** | ✅ `Add` · `Edit` · **`Delete`** is the user-facing requirement in `STK31-34`, `08` §6, `13` Part B, `14` `U-FAC-07`, `17` record 25 and `diagrams/ASSESSMENT_FLOW.md`. **`Retire` / `Archive` appear nowhere as the requirement** — `STK31-22` is scoped to the mechanism |
| **31** | **P0–P3 are implementation priorities, not project phases** | ✅ Stated in `14` §Priority definitions, `15` §2, `03` §1 and the README. **Content production is explicitly "required for the current complete delivery, not deferred"** |
| **32** | **`Programme` and `Academic Stream` are not forced apart** | ✅ Modelled as **one grouping level** in `STK31-12`, `05` §2.2, `17` record 1 and 18, `13`, `14` and `diagrams/CONTENT_HIERARCHY.md`. **No implementation dependency requires two records** |
| **33** | **No further stakeholder read-back is demanded** | ✅ The 31 Aug decisions are stated as **the current project source of truth**. The package says only that it is **based on stakeholder input supplied for the project**, and **claims no independent external verification** |

---

## What this check could not verify, and did not claim to

| Not verified | Why |
|---|---|
| Anything about the stakeholder input itself | **This documentation is based on stakeholder input supplied for the project** — the 31 Aug review, the written follow-up answers, the meeting notes and the clarification of the previously ambiguous portions. **No independent external verification of that input was performed, and none is claimed.** The written follow-up is the highest-precedence current source, so **the confirmed decisions are the current project source of truth and are not reopened here** |
| That every FRD citation is complete | FRD text was read from the **verified DOCX companions** (PDF text extraction is unavailable in this environment). Page counts and version headers match the PDFs three-for-three, as recorded in `ui-ux/15-post-pm-alignment/02_SOURCE_PRECEDENCE_AND_CONFLICTS.md` §5.1. **Citations were re-verified by direct search, not recalled** |
| That the batch corrections are complete at the sub-state level | `13_BATCH_01_05_EXACT_CORRECTION_MAP.md` is **screen-level**. Individual state-level corrections surface during the unified build |
