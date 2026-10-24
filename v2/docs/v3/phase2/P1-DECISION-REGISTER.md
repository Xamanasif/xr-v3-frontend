# P1 Decision Register: institution requests, plans, group timing, licences, request management

> **Status (24 Oct 2026):** investigated read-only at `2762031`. The two P0 corrections committed
> afterwards (`536547a` payment recovery, `4ff9b8c` assessment shapes) do not change any finding
> below. **Nothing in this register is implemented**: every item waits for the owner's / PM's
> decision. Reproduction scripts, logs and screenshots are kept outside the repository in
> `/Users/mymac/Desktop/XR-V3-hands-on-test/evidence/p1-repro/`.

**Date:** 24 Oct 2026. **Type:** read-only investigation. No repository file was changed, nothing was built, and no git command changed state.
**Baseline:** `v3/refined-b-ui` @ `2762031`, repository `/Users/mymac/Desktop/AR-VR-v3-ui`, monorepo `v2/`.

| Item                              | Value                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Code in scope vs the audited code | `git diff 9ad1612..2762031` is **empty** for `packages/domain`, `packages/sample-platform`, `packages/contracts`, `apps/web/src/features/{admin,institute,student,faculty}`, `features/public/pu-10-request-status` and the request copy files. The only changes since the audit (`d9cc098`) are the V1 landing (`pu-01-landing`, `copy/public.ts`, `copy/landing-v1.ts`, `nav/*`, scans). Every audit line reference below was re-read in the current code.                                                          |
| Running build used                | `http://localhost:3360` (cwd `~/Desktop/XR-V3-stakeholder-demo/v2/apps/web`, the demo-kit build of the `4c0f180` code; the code in scope is identical to HEAD). It was read only through new Playwright contexts, each starting from a new spine-start world.                                                                                                                                                                                                                                                         |
| Reproductions                     | Scripts and logs are in `/Users/mymac/Desktop/XR-V3-hands-on-test/evidence/p1-repro/` (r1 = A, B, E · r2 = C, D · r3 = renewal; `*-log.json` and screenshots).                                                                                                                                                                                                                                                                                                                                                        |
| Evidence reused                   | Audit `~/Downloads/XR-V3-E2E-Connections-Audit-2026-10-22/` (matrix §2/§4/§6/§8, appendix B G-1…G-15, appendix C B1/B2/G4–G7); `docs/v46/audit/Appendix-G-Owner-Decisions.md` (P1-05, P1-08, P1-11, P2-01, P2-03, P2-04, P2-06, SC-11, SC-19, SC-23); `Appendix-C-Schemas-and-Contracts.md` (M03 transitions, §3.4 `approveRequest` split, §8-6/7/12/13); `docs/decisions/README.md`; `docs/v46/permission-matrix.json`; `docs/v46/understand/decisions-rules.json`; `docs/v46/handover/OWNER_DECISIONS_HANDOVER.md`. |

Abbreviations: **DOM** = `v2/packages/domain/src`, **SP** = `v2/packages/sample-platform/src`, **CT** = `v2/packages/contracts/src/draft/ports`, **WEB** = `v2/apps/web/src`.
Ownership groups: DOM · SP · CT · WEB-admin · WEB-institute · WEB-faculty · WEB-student · PUBLIC (PU pages). The landing is now committed and accepted (`b98814d`, `2762031`) and did not touch PU-10, so PUBLIC fixes outside `pu-01-landing` no longer have to wait for it.

---

## 0. Summary

| #   | Issue                                                             | Verified now                                                                                                                                                                                                                       | Classification                                                                                                                                        | Open decision(s)                                                            | Fix now?                                                       | Decision-dependent fix size     |
| --- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------- |
| A   | Repeat public request from an onboarded institution               | **Reproduced on 3360**. A second "BITS Pilani — Hyderabad Campus" record was created; SA-03 said "There is no institution record … yet".                                                                                           | **Confirmed defect.** The Appendix C §3.4 case (b), "new-access from an EXISTING institution", can never be reached. The matching rule is unresolved. | T-01 / R01, SEL-05, (INST-01), T-09                                         | Interim guard only, with owner acknowledgement (new open item) | Interim S–M; link command M     |
| B   | Active plan + newly published experiment; renewal / more licences | **Reproduced on 3360**. No path keeps one institution. An approved renewal reads "Access active" while the plan is unchanged.                                                                                                      | **Unresolved business rule** (plan effect) + **missing implementation** (amendment or extra plan)                                                     | OD-B3-09, T-07, T-08 (ACC-03), REQ-29/30, BR-043                            | Copy line on IA-17 only (light owner acknowledgement)          | M (extra plan) – L (amendment)  |
| C   | Late / removed group members                                      | **Reproduced on 3360**. Late member: Student "hasn't been settled yet"; IA-04 "Active"; IA-06 "Access active". Removed member: IA-06 "No access yet · Give access"; the Student still sees the experiment as "given, not settled". | **Unresolved business rule.** The cross-screen inconsistency is a **confirmed defect** against the existing safe treatment.                           | OD-B2-02 (SACC-16, GRP-03), GRP-05 (P2-04)                                  | **Yes**: align IA/Faculty reads with the gate (no new rule)    | Interim M; rule itself S–M      |
| D   | Licence counting                                                  | Confirmed in code. 3360: plan "80 licences … Giving or withdrawing access doesn't change what is shown here."                                                                                                                      | **Unresolved business rule** (deliberate safe treatment) → missing implementation                                                                     | D7 / T-06, OD-B2-03, ACC-08, ACC-09 (P2-01, SC-19, SC-23)                   | No                                                             | M–L                             |
| E   | Information requested / decline / withdrawal                      | **Reproduced on 3360**. After "Request more information" the SA-03 panel has 0 radios and 0 buttons, PU-10 has 0 controls, and seeded REQ-0041 is the same.                                                                        | **Unresolved business rules** (dead end by safe treatment)                                                                                            | T-03 (REQ-06, REQ-18, OD-B3-10, P1-05), T-02 (REQ-10, REQ-20), REQ-22 / R06 | **Yes**: PU-10 "Reply outside the platform" line (F-08)        | Resume M; Decline L; Withdraw M |

---

## A. A repeat public request from an onboarded institution creates a second institution

**Verified current behaviour**

- `DOM/request/decide.ts:118-167` `submitPublicRequest` always sets `institutionId: null` (`:141`) and does no lookup by name or e-mail.
- `SP/handlers/access-request.ts:188-190` `institutionOf` resolves the institution only from `request.institutionId`, so the approval handler (`:445-470`) passes `institution: null`. It also asks for the route again (`:454-455`, `request.set-route` only when the institution is null).
- `DOM/request/decide.ts:490-501` then mints a new record through `newInstitution` (`DOM/institution/records.ts:33-55`, "Created when you approve the first request from a **new** institution", INST-01). With the Internal route it also creates a new plan (`:514-519`).
- Nothing in DOM, SP or WEB checks that a name is unique (grep: no duplicate or same-name guard in `institution/`, `request/` or the handlers).
- The domain already supports a linked request. `resolveRoute` (`decide.ts:415-423`) locks the route to `institution.kind`, `approve` writes no plan for an existing institution (`:514-522`, `planEffect: policy-open OD-B3-09`), and SA-03's `decisionPage` (`access-request.ts:151-186`) shows `existingAccess`. Appendix C §3.4 specifies exactly this case (b). **No command or screen ever links a public request to an institution**, so case (b) can never be reached.

**Reproduction (3360, `r1-requests.mjs`, log `r1-log.json` A.1–A.6)**

1. A visitor submits a public request named "BITS Pilani — Hyderabad Campus" (seeded, internal, active plan ACC-0098, IA Dr P. Srinivas) for Shell-and-Tube. It becomes REQ-0042.
2. SA-06 before approval has one row, `/admin/institutions/bitshyd`.
3. SA-03 "Existing access" reads: _"None. There is no institution record for BITS Pilani — Hyderabad Campus yet. Approving this request creates the record; it does not activate access."_ (`WEB/features/admin/sa-03-request-decision/decision-view.ts:368-375` → `WEB/copy/requests.ts:482-487`). The route choice is offered.
4. The confirm dialog reads: "Creates the institution record for BITS Pilani — Hyderabad Campus, classified internal … the access plan is created."
5. SA-06 after approval has **two** rows: `/admin/institutions/godavari` "BITS Pilani — Hyderabad Campus, Access active, no Institute Admin" and `/admin/institutions/bitshyd` "BITS Pilani — Hyderabad Campus, Access active". The duplicate also took the reserved id `godavari` (see §F-1).

**Affected roles and contracts.** Visitor/requester (PU-07…PU-10), Super Admin (SA-02, SA-03, SA-06, SA-07), the institution's Institute Admin (who never sees the new access), and every later role of that institution. CT `AccessRequestService.submitPublicRequest / getRequestForDecision (DecisionPage.existingAccess, routeCommitted) / approveRequest / approveSmallerScope`; `InstitutionService.listInstitutions / assignInstituteAdmin`. DOM `submitPublicRequest`, `approveRequest`, `resolveRoute`, `newInstitution`; policy `request.submit-public / request.approve / request.set-route` (`DOM/policy/rules.ts:191-275`).

**User impact.**

- The world is corrupted with no way back: there is no merge or delete (T-09), and no decline exists to dispose of the request (T-02).
- The route can be chosen differently from the original institution's.
- The duplicate needs its own Institute Admin. The existing IA cannot be assigned, because PC-49 refuses an e-mail that already signs someone in (`SP/handlers/identity-safeguard.ts:28-30`). The original institution's students therefore never receive the new experiment (repro B.1/B.2).
- SA-03 tells the Super Admin something false.

**Classification.** Confirmed defect: it violates INST-01 "first request from a new institution" and makes the contract's case (b) unreachable. The rule for recognising an existing institution is unresolved: T-01 / R01 requester identity; SEL-05 UNRESOLVED ("needs a recognised institution"); stakeholder 07.2-A.

**Minimal correction.**

1. **Interim (no business rule; light owner acknowledgement).** SP `decisionPage` adds the same-name institutions, compared case- and space-insensitively (CT `DecisionPage` additive field). SA-03 replaces the false "None…" sentence with a warning naming the existing record(s) and links to them. `approveRequest` / `approveSmallerScope` answer `policy-open` (a new `OPEN_CAPABILITIES` item, e.g. `request.match-existing-institution`) while such a match is unresolved. Nothing auto-merges.
2. **Real fix (after decision).** A Super Admin command `linkRequestToInstitution(requestId, institutionId)`, allowed only while the request is under review: set `institutionId`, lock the route, history entry. After that, the existing approval logic handles case (b).

**Fix now or decision?** The interim needs only the owner's acknowledgement of a new open item and one warning text. The link command needs a PM/stakeholder decision.

- **Q-A1. How is a public request matched to an existing institution?**
  - (a) The Super Admin links it manually on SA-03. The page suggests matches by normalised name and contact-email domain, and the SA confirms "same institution" or "different institution". **Recommended**: no automatic guess, no identity dependency, and the domain already supports the linked case.
  - (b) Automatic match on exact normalised name. Risky with campuses, renamed or similarly named institutions.
  - (c) The requester declares "we already have access" with a reference. This cannot be verified without T-01.
  - (d) Block approval on a name clash. Without a decline this leaves the request waiting until a decision.
- **Q-A2.** Confirm that a linked request keeps the institution's existing route, so the Super Admin is not asked again. The domain already locks it (`route-locked`). **Recommended: yes.**
- **Q-A3.** Are two institutions with the same name allowed when the Super Admin confirms they are different? **Recommended: yes, with an explicit confirmation**, and later a disambiguating field such as campus or city.
- **Q-A4.** When a signed-in Institute Admin uses the public selection, should the request carry their institution automatically? (T-01.) **Recommended: yes**, or send them to the IA-17 route from Q-B4.

**File ownership and size.**

- Interim: SP `handlers/access-request.ts:151-186, 445-504`; CT `access-request.ts` (`DecisionPage`); DOM `policy/rules.ts:2078-2094`; WEB-admin `features/admin/sa-03-request-decision/{decision-view.ts:368-375, request-decision.tsx}`, `copy/requests.ts:482-487` plus a state-copy entry; tests in `decision-view.test.ts`, `request-decision.test.tsx`, the SP handler test and one alternates e2e. **S–M, about 200 lines.**
- Link command: DOM `request/model.ts:142-219` (command plus self-transition), `request/decide.ts` (new function), `policy/rules.ts`; CT new method and input; SP handler; WEB-admin SA-03 control, confirm text and copy; tests. **M, about 400–600 lines.**

---

## B. Existing plans and newly published experiments; renewal / more licences / plan amendment

**Verified current behaviour.** An institution with an active plan has **no path** to a newly published experiment that keeps one institution:

1. IA-17 "Renew your access plan" mirrors the plan's items (`DOM/request/decide.ts:265-280`, `:276`).
2. IA-17 "More licences" accepts only experiments already in the plan (`:298-303`, `not-in-plan`). The form lists only the plan's experiments (`WEB/features/institute/ia-17-requests/ask-form.tsx:205-296`).
3. IA-05 give access refuses `experiment-not-in-plan` (`DOM/access/decide.ts:78-79`). Repro B.2: the original BITS Hyderabad IA is not offered Shell-and-Tube.
4. The designed route, "new experiments/formats are requested through the public catalogue" (BR-043, CONFIRMED-STAKEHOLDER; REQ-30 note), leads to issue A: a duplicate institution.
5. Even a linked new-access request would write no plan. Approval: `decide.ts:514-522` creates a plan only when `isNew && type === 'new-access'`. Payment: `:729-753` creates one only when `own.length === 0 && type === 'new-access'`. Both answer `planEffect: policy-open OD-B3-09`.
6. The Super Admin has no amend control (T-08, ACC-03 "WAIT FOR DECISION").

A new **format** of an in-plan experiment shows only as "Published, not in your plan" (`DOM/read-models/read-models.ts:118-133`), which is information and nothing more.

**Renewal / more licences.** Approval writes no plan change: no `endsOn` extension and no change to the licence figure (`decide.ts:520-522`, `request.test.ts:368`).

- SA-03 is honest. The 3360 repro (r3, approving the seeded REQ-0038) showed "This page does not change the current plan. Its term still shows as ending on 31 Oct 2026."
- **IA-17 is not honest.** It shows "Access active · BITS has activated this request." and "Your access plan: Active" (`WEB/features/institute/ia-17-requests/request-detail.tsx:189-205`, `request-view.ts:247-262`, `WEB/copy/institute-requests.ts:293-294, 304-310`) while IA-03 still reads "Monthly term · 29 days left · 31 Oct 2026". Repro log `r3-log.json` B3.1–B3.4.

**Affected roles and contracts.** Institute Admin (IA-02, IA-03, IA-05, IA-17), Super Admin (SA-03), Student (no access to the new experiment), Faculty (cannot teach it). CT `AccessRequestService.submitRenewalRequest / submitAdditionalLicencesRequest / approveRequest` (`DecisionOutcome.planEffect`); `PaymentOutcomePort` (`reportPaymentOutcome`); `InstitutionService.listContentAccess / getAccessPlan`; `StudentAccessService.getGiveAccessOptions / giveAccess`.

**User impact.**

- A newly published experiment reaches only new institutions, and only in their first request.
- A renewal approved for an ending plan reads as active to the IA, yet the plan still ends on its original date and access then ends.
- "More licences" changes nothing.

**Classification.** Unresolved business rule: OD-B3-09 / T-07 / T-08 (Appendix G P1-11; Appendix C §8-12), REQ-29/30 PROVISIONAL. Missing implementation once that rule is decided. The IA-17 "Access active" wording is a misleading-copy defect (audit N-02/G-5): SA-03 is correct, IA-17 is not.

**Minimal correction.**

1. **Now (copy; light owner acknowledgement because it departs from B3-08's drawn "Access active" detail):** on IA-17, when the request activated no plan (`createdPlanOf` returns null for a renewal or more-licences request), show SA-03's approved sentence, "The current plan isn't changed by this request; its term still ends on …", in place of "BITS has activated this request." Change "Your access plan: Active" to "Unchanged". These are existing approved SA-03 words (`copy/requests.ts:380-384, 473-478`), so no new rule is introduced.
2. **After the decision:** see Q-B1 to Q-B4.

**Fix now or decision?** The copy line can be done now. The plan effect needs a PM/stakeholder decision.

- **Q-B1. When an institution with a plan is approved for new experiments or formats, what changes?**
  - (a) A **separate additional plan** with its own term, licence figure and payment. **Recommended**: the read side already works per plan (`SP/world/queries.ts:144-158` `currentPlanOf` picks the live plan holding the experiments; `plansOf` in IA-02 and SA-07; the gate reads `grant.accessPlanId`). There are no term-merging or pro-rating rules to invent, and External payment already works per request.
  - (b) **Amend the existing plan** (add items, same `endsOn`). This needs pro-rating, pricing and licence-pool rules (T-08).
  - (c) New experiments only at renewal.
- **Q-B2. What does an approved renewal do?**
  - (a) Extend the same ACC by one term from its current `endsOn`. **Recommended**: keeps the reference, grants and history.
  - (b) A new plan starting on the old end date.
  - (c) A new plan starting today.
- **Q-B3. What does approved "more licences" do?**
  - (a) Add N to the plan's figure. **Recommended**, and it ties to D7.
  - (b) Create a separate licence top-up record.
- **Q-B4. Where does an onboarded institution ask for a newly published experiment?**
  - (a) A third IA-17 kind, "Add experiments to your access" (IA-origin, `institutionId` known, so issue A cannot arise). **Recommended.**
  - (b) The public catalogue (BR-043 as confirmed), which requires the Q-A1 linking.
  - (c) Both.

**File ownership and size.**

- Copy fix: WEB-institute `ia-17-requests/{request-detail.tsx:189-205, request-view.ts:247-262}`, `copy/institute-requests.ts:293-310`; tests in `copy/institute-requests.test.ts` and `features/institute/requests.test.tsx`. **S, about 40 lines.**
- After Q-B1(a), Q-B2(a), Q-B3(a) and Q-B4(a): DOM `request/model.ts:29` (new `RequestType`), `request/decide.ts:265-321, 478-540, 701-771`, `institution/records.ts`, `institution/model.ts` (plan history events); CT input and method; SP `handlers/access-request.ts:347-405` plus `student-access.ts:287` (give-access options read the union of live plans, not only the newest); WEB-institute `ia-17-requests/ask-form.tsx`; WEB-admin `sa-03-request-decision/decision-view.ts:303-334` (confirm lines); tests. **M–L, about 600–900 lines.**

---

## C. Group access timing (late and removed members)

**Verified current behaviour**

- The Student gate (`DOM/access/gate.ts:64-77` `membershipAtGrant`; `:97-104`) answers `policy-open OD-B2-02` for a member added after the group grant and `GRP-05` for one removed after it. The Student copy reads "Your access to this experiment hasn't been settled yet." (`WEB/copy/state-copy-student.ts:193-201`).
- The IA and Faculty reads ignore the timing:
  - `SP/handlers/student-access.ts:231-280` `listGrants` reaches the group's current members (`:238-241`) and labels them through `grantDisplayStatus` (`DOM/access/gate.ts:192-207`), which has no membership input. Result: "Active".
  - `SP/handlers/institute-reads.ts:43-55` `reachedBy` / `activeReach` (current members) feeds the IA-06 directory (`:233`) and IA-01 attention (`:134`).
  - `SP/handlers/assessment.ts:1414-1428` `reachedStudents` (current members) feeds `TeachingService.getFacultyOverview` (`:1532`), `listMyCourses` (`:1607`), `getTeachingExperiment` (`:1639`) and the student rows (`:1805`).
- Removed members drop out of every IA and Faculty read, but the Student keeps the experiment, shown as undecided.

**Reproduction (3360, `r2-group-timing.mjs`, log `r2-log.json` C.0–C.8)**

- Setup: BITS Hyderabad IA added Asha, Bala and Chitra, created group "Cohort Probe" with Asha and Chitra, and gave the group Distillation Column. After 65 s Bala was added and Chitra removed.
- IA-14 group page: Asha "Can open it"; Bala "Added after the group grant". The add panel already said "whether that grant reaches them isn't decided yet".
- **IA-04:** "Bala Iyer … Group: Cohort Probe … Active".
- **IA-06:** "Bala Iyer … Access active · Experiments given: Distillation Column"; **"Chitra Das … No group … No access yet · Give access"**.
- **Student Bala:** "Distillation Column — Your access to this experiment hasn't been settled yet".
- **Student Chitra:** the same, listed under "All the experiments given to you".
- Student Asha: "Open experiment".

**Affected roles and contracts.** Institute Admin (IA-01, IA-04, IA-06, IA-14), Faculty (FA overview, courses, teaching experiment, student lists, counts), Student (hub, courses). CT `StudentAccessService.listGrants` (`GrantRow.display`, CT `student-access.ts:112`), `PeopleService.listStudents` (`studentDirectoryStatus`, CT `people.ts:62`), `InstitutionService.getMyOverview`, `GroupService.addMembers / removeMember`, `TeachingService.*`; DOM `experimentGate`, `groupMemberStanding`, `grantDisplayStatus`.

**User impact.** The common "add a new student to an existing cohort" path dead-ends for that student, while the IA list says Active and Faculty count them. The IA cannot see why the student cannot open the experiment. A removed student is told "No access yet" on IA-06 while their own home still lists the experiment.

**Classification.** The rule itself is unresolved: OD-B2-02 (SACC-16 UNRESOLVED, GRP-03), GRP-05 (P2-04 UNRESOLVED), recorded as "decide before production". The **inconsistency is a confirmed defect** against the existing safe treatment. OD-B2-02 says "No promise either way", and GRP-05 says "no access-effect statement is shown" (permission matrix). IA-04/IA-06 "Active", Faculty counts and IA-06 "No access yet" for a removed member each make such a statement.

**Minimal correction (purely technical, possible now: audit F-06).**

- Export a membership-standing helper from `DOM/access/gate.ts:64-77`.
- `listGrants`, `activeReach` and `reachedStudents` show a late member with IA-14's existing word, "Added after the group grant", and leave late members out of Faculty counts. This needs an additive `GrantDisplayStatus` / `studentDirectoryStatus` value in DOM `access/model.ts:77-86` and CT.
- IA-06 must not say "No access yet" for a member removed after a grant. Show no access statement, per GRP-05. This needs one word or blank cell from the owner (light).

**Decision questions (for the rule itself).**

- **Q-C1. Does a group grant reach students added later?**
  - (a) Yes, for as long as they are members. **Recommended**: it matches the inventory/register IA-F5 ("Group grants reach new members"), what IA-04, IA-06 and Faculty already show, and normal cohort management. The licence effect is per D7.
  - (b) No: a snapshot at grant time, so the IA re-gives access. IA-14 would then need a "Give access to new members" control.
- **Q-C2. What does removing a member do?**
  - (a) It ends group-given access unless the student holds an individual grant. History and earlier work are kept, read-only per SACC-14. **Recommended**, symmetric with Q-C1(a).
  - (b) Access remains until it is withdrawn explicitly. Group-grant withdrawal is also undecided (SACC-08 / OD-B2-01).
- **Q-C3.** With D7: does a late member take a licence at once, or wait if none is free? **Recommended:** same as any new grant (Q-D2).

**File ownership and size.**

- Interim alignment: DOM `access/gate.ts:64-77`, `access/model.ts:77-86`; CT `student-access.ts:112, 186`, `people.ts:62`; SP `handlers/student-access.ts:231-280`, `institute-reads.ts:43-55, 134, 233`, `assessment.ts:1414-1428`; WEB-institute IA-04/IA-06 status words (`copy/ia-access.ts`, `copy/institute-people.ts`); tests in DOM `access.test.ts`, the SP handler tests and `features/institute/*.test.tsx`. **M, about 300 lines.**
- Rule after Q-C1(a)/Q-C2(a): DOM `gate.ts:101-104` (treat `added-after` as member and `removed-after` as not a member) and `:225`; `access.test.ts:274-290`; WEB `copy/ia-access.ts:622`, `features/institute/ia-14-group/group-view.ts:71`, `copy/state-copy-student.ts`, `copy/state-copy-groups.ts`. **S–M, about 150 lines.** The interim alignment then becomes unnecessary, so if the decision is quick, do the rule instead.

---

## D. Licence counting

**Verified current behaviour**

- `AccessPlan.licences: Provided<number>` is "Never consumed or derived" (`DOM/institution/model.ts:115-116`).
- `giveAccess` has "No licence arithmetic anywhere" (`DOM/access/decide.ts:1-4`). A wait is created only when the oracle answers (`:161-176`).
- The oracle answers only from seeded facts (`SP/handlers/student-access.ts:65-77`), and the product seed holds none (`SP/seed/spine-start.ts:113`, `licenceWaits: []`). "Waiting for a licence" therefore never occurs in the product.
- 3360 (r2 D.1/D.2): IA-05 review shows "Licences: Your access plan · 80 licences · Monthly, ends 31 Oct 2026". IA-03 shows "80 … Licences and term are as BITS approved them. Giving or withdrawing access doesn't change what is shown here." (`WEB/copy/institute-home.ts:437`). SA-07 shows "How licences are counted is still open." (`WEB/copy/institutions.ts:690-692`).
- There is no cap: a plan of N licences can be given to any number of students. Reproduced up to 3 students; the absence of a cap is evident from the code.

**Affected roles and contracts.** IA (IA-02, IA-03, IA-05, IA-01 attention "students waiting for a licence"), SA (SA-07, IA-17/SA-03 more-licences semantics), Student (ST-19 "Waiting for a licence"). CT `StudentAccessService.giveAccess / previewGiveAccess`; stand-in `LicenceAvailabilityOracle` (`DOM/access/model.ts:109-119`, test/seed only); plan views.

**User impact.** Entitlement accounting, a core institutional rule, is absent. The licence figure is decoration, and "more licences" requests have no meaning.

**Classification.** Unresolved business rule with a deliberate safe treatment: D7 / T-06, OD-B2-03, ACC-08 PROVISIONAL, ACC-09 UNRESOLVED (Appendix G P2-01, SC-19 "production blocker", SC-23). It becomes missing implementation once decided. Not a defect today.

**Minimal correction (after decision).**

- DOM `licencesInUse(plan, grants, groups, students)`.
- `giveAccess` creates waits from that count, not from the oracle; keep the oracle only as a seed override.
- Promote waits when a licence is released (withdraw `DOM/access/decide.ts:235-300`, deactivation, group removal, plan end).
- Plan views show "n of N in use".

**Decision questions**

- **Q-D1. What consumes a licence?**
  - (a) One per distinct student with at least one active grant under the plan. **Recommended**: the plan, the request and the approval each carry one licence figure, not one per experiment (`AccessPlan.licences`; `licencesRequested`). It is also the earlier V1 rule, "one licence per active student per access record; Faculty consume none; deactivation releases; reactivation queue" (`docs/MIGRATION_STRATEGY.md:54`, superseded only as "open", `:144`).
  - (b) Per student × experiment.
  - (c) Per student × format.
- **Q-D2. What happens when a grant would exceed the figure?**
  - (a) The grant is created in the drawn "Waiting for a licence" state (B2-04/B2-05/B3-02, already modelled as `ProvidedLicenceWait`) and promoted first come, first served. **Recommended.**
  - (b) Refuse the grant.
- **Q-D3.** What releases a licence: withdrawal, student deactivation, plan end, group removal (Q-C2)? **Recommended: all four.**
- **Q-D4.** Does an individual grant plus a group grant for the same student count once (OD-B2-03)? **Recommended: once**, which follows automatically from Q-D1(a).
- **Q-D5.** Do Faculty consume licences? **Recommended: none.**
- **Q-D6.** May the IA and SA see "n of N in use", which ACC-08 forbids today? **Recommended: yes.**
- **Q-D7.** The IA-17 more-licences form asks for experiments plus one number. Under Q-D1(a), is the number simply added to the plan figure (Q-B3)? **Recommended: yes**, and drop the experiment choice or keep it as information only.

**File ownership and size.** DOM `access/decide.ts`, `access/model.ts:55-119`, a new read model, `institution/model.ts:115-116`; SP `handlers/student-access.ts:65-77, 401-426` (+ people deactivation, group removal); CT plan and grant views (in-use figure); WEB-institute IA-02/IA-03/IA-05 copy, WEB-admin SA-07 copy (`copy/institutions.ts:690-692`); tests across DOM, SP and WEB, plus e2e. **M–L, about 600–1000 lines.** Nothing can be done before the decision.

---

## E. Request management: information requested, decline, withdrawal

**What exists today**

| Actor                                                            | Can do                                                                           | Cannot do                                                                                                                                                                |
| ---------------------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Public requester (ticket held in the sending tab only, ADR-0009) | submit; read PU-10; pay (External)                                               | reply to "Information requested", edit, withdraw; reopen the status page after a reload (CB-1)                                                                           |
| Institute Admin (own institution, IA-17)                         | submit renewal or more licences; read the list and detail; open the payment page | reply ("Reply outside the platform; there is no reply form here.", `WEB/copy/institute-requests.ts:335-336`), withdraw, edit                                             |
| Super Admin (SA-02/SA-03)                                        | approve, approve a smaller scope, request more information                       | decline, close, resume after information was requested, resolve a stuck payment (`OPEN_CAPABILITIES` `request.resolve-stuck-payment` REQ-22, `DOM/policy/rules.ts:2080`) |

**Verified current behaviour**

- `DOM/request/model.ts:9-10, 47-54, 155-219`: there is no `declined` or `withdrawn` status or command, and no transition out of `information-requested`.
- `DOM/request/decide.ts:366-371` `decidable` answers `policy-open T-03` for `information-requested`.
- SA-03 treats information-requested as decided (`decision-view.ts:46-49` `panelKindOf` → `decided`; `:404-413`, `:472-473`).
- SA-01 lists only `under-review` (`SP/handlers/operations.ts:169`), so these requests drop off the Overview and are reachable only through the SA-02 status filter.
- PU-10 shows "BITS needs more information / Your request stays open while BITS waits for this information." and "What BITS asked" (`WEB/copy/request-access.ts:252-256`, `features/public/pu-10-request-status/request-status.tsx:147-152`), with no instruction and no control.

**Reproduction (3360, r1 E.1–E.5)**

- Repeat-request flow: REQ-0058 → SA "Request more information" → SA-03 panel "Information requested · … The request stays open." **0 radios, 0 buttons.**
- The requester's PU-10 in the sending tab has **0 text boxes, 0 buttons, 0 links** in main.
- Seeded REQ-0041 (Krishna) shows the same panel with 0 controls.

**Affected contracts.** CT `AccessRequestService.requestMoreInformation / getRequestStatus / getInstitutionRequest / listRequests` (no Declined filter, T-02), `OperationsService.getSuperAdminOverview`. DOM `REQUEST_TRANSITIONS`, `decidable`.

**User impact.**

- A request in information-requested is a permanent dead end for both sides. The public requester is not even told how to reply.
- The Super Admin cannot dispose of unwanted requests: duplicates from A, spam, ineligible institutions, or the seeded REQ-0041 / REQ-0037 / REQ-0036.
- No requester can cancel.

**Classification.** Unresolved business rules:

- T-03 (REQ-06, REQ-18 UNRESOLVED; OD-B3-10; Appendix G P1-05).
- T-02 (REQ-10 / REQ-20 PROVISIONAL, "WAIT FOR DECISION"; Appendix C §8-13).
- Requester withdrawal: not drawn and has no row; DTR-04 covers only device transfers.
- The PU-10 missing instruction is a **confirmed gap against an existing approved line**: IA-17 already says "Reply outside the platform" for the same state.

**Correction to the audit wording.** Matrix 6.6 and appendix B 6.7 call the missing decline "by owner decision T-02". T-02 is **not** an owner decision against decline: it is "WAIT FOR DECISION" with the safe treatment "No Decline button".

**Minimal correction**

1. **Now (purely technical, existing approved wording):** add IA-17's sentence, "Reply outside the platform; there is no reply form here.", to PU-10 for `information-requested` (audit F-08). Files: PUBLIC `features/public/pu-10-request-status/request-status.tsx:147-152`, `copy/request-access.ts:252-256` plus a state-copy entry and a test. **S, about 25 lines.** It is no longer blocked by the landing.
2. **After decision:** see Q-E1 to Q-E4.

**Decision questions**

- **Q-E1. How does "Information requested" end?**
  - (a) SA "Resume review" on SA-03 moves it back to `under-review`; the reply itself happens outside the platform. **Recommended**: smallest, no identity dependency, consistent with IA-17's existing line.
  - (b) An in-platform reply on PU-10 and IA-17. For the public requester this depends on T-01, and the ticket is lost on reload.
  - (c) (a) for every request, plus an authenticated IA reply on IA-17.
- **Q-E2. Decline (T-02)?**
  - (a) SA "Decline" with a required reason gives a terminal "Declined", shown to the requester and IA, with nothing created. Allowed from under-review and information-requested. **Recommended**: it is also the only clean way to dispose of A-duplicates and stuck seeded requests.
  - (b) Keep no decline.
- **Q-E3. Withdrawal?**
  - (a) The IA may withdraw its own IA-17 requests while undecided; the public requester relies on the SA's decline. **Recommended**: the public ticket is lost on reload, so a public withdraw has little value.
  - (b) Both may withdraw.
  - (c) None.
- **Q-E4.** May the SA close an "Approved — payment required" request whose payment never started (Vizag REQ-0037; CB-1 strandings)? This ties to REQ-22 / R06 and INST-05. **Recommended: yes, through the same Decline/Close command with a reason.**

**File ownership and size**

- Resume (Q-E1a): DOM `request/model.ts:142-219` (command plus transition `information-requested → under-review`), `request/decide.ts:366-393`, `policy/rules.ts`; CT method; SP handler `handlers/access-request.ts:506-535`; WEB-admin SA-03 (`decision-view.ts:46-49, 404-413, 472-473`, `request-decision.tsx:849`); PU-10/IA-17 history copy; tests. **M, about 300 lines.**
- Decline (Q-E2a): adds a value to the shared `RequestStatus` enum, which every exhaustive status switch reads: SA-02 filter `features/admin/sa-02-requests/requests.tsx:50-56`, `features/admin/shared/request-status.tsx`, IA-17 `request-view.ts:56-60, 247-290`, PU-10 `copy/request-access.ts` status head and history, SA-01. **L, about 600–800 lines.**
- Withdraw: **M**, reusing the Decline plumbing.

---

## F. Other functional defects noticed in passing

1. **The reserved institution id `godavari` goes to whichever new institution is approved first** (audit G-4, still present, now reproduced with a non-Godavari name). Repro A.6: the duplicate "BITS Pilani — Hyderabad Campus" lives at `/admin/institutions/godavari`. Sources: `SP/seed/spine-start.ts:30-36` (`WALK_RESERVATIONS.institution: ['godavari']`). The local-build pre-authorised device GIT-VR-03 (`SP/seed/local-demonstration.ts:17-26`, `institutionId: 'godavari'`) attaches to that institution. **Defect, demo data. S:** reserve `godavari` only when the approved name is "Godavari Institute of Technology".
2. **A group can be given the same experiment twice.** The `giveAccess` group branch (`DOM/access/decide.ts:84-91`) has no `already-given` check, unlike the individual branch (`:93-109`). `getGiveAccessOptions` marks every non-empty group selectable (`SP/handlers/student-access.ts:349-352`). This produces two active SACC rows and duplicate IA-04 rows. Side effect: the second grant silently "settles" late members (their `addedAt` is now before the second `givenAt`), hiding OD-B2-02. Found in code, not reproduced. **Defect (part of audit N-05). S:** refuse `already-given` for the same group and experiment.
3. **The removed-member contradiction** (C above): IA-06 "No access yet · Give access" while the Student lists the experiment as given. Reproduced (r2 C.7/C.8).
4. **Multiple concurrent renewals are allowed.** `submitRenewalRequest` (`DOM/request/decide.ts:265-280`) has no open-renewal guard; IA-17 only shows a note (`ask-form.tsx:74-79, 298-301`). Combined with E, an information-requested renewal keeps that note forever. **Unresolved** ("more than one open request" is not drawn). Ask with Q-E3.
5. **Still present from the audit (code unchanged):**
   - `until-date` end date not checked against today (`DOM/request/decide.ts:93-109`; audit G-10/N-04).
   - Approval does not re-check that the requested formats are still published (`:478-540`; G-11).
   - PU-13 offers "Sign in" to a requester who has no account (`pu-10-request-status/request-status.tsx:186-193`; G-9/N-03).
   - The SA-02 status filter has no "Payment failed" option (`features/admin/sa-02-requests/requests.tsx:50-56`; the SA label is undrawn [U]).

## G. Audit validation

| Audit item                  | Current code                                                                                                     | Note                                                                                                                                  |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| CB-4 / M-02 / G-2           | Confirmed (`decide.ts:141`, `access-request.ts:188-190`)                                                         | Extended: it also hits seeded, onboarded institutions; SA-03 states falsely that no record exists; the duplicate takes id `godavari`. |
| M-03 / G-5 / G-13 / F-05    | Confirmed (`decide.ts:265-321, 514-522, 729-753`)                                                                | Refined: SA-03 already says "plan isn't changed"; only IA-17 (and PU-10, reachable by the IA) reads "Access active".                  |
| M-10 / G7 / F-06            | Confirmed (`gate.ts:64-104`; `student-access.ts:231-280`; `institute-reads.ts:43-55`; `assessment.ts:1414-1428`) | Extended: removed member on IA-06 = "No access yet · Give access" while the Student still sees the experiment.                        |
| M-09 / G4 / B2 / F-07       | Confirmed (`model.ts:115-116`, `student-access.ts:65-77`, `spine-start.ts:113`)                                  | —                                                                                                                                     |
| M-07 / G-6 / F-08           | Confirmed (`decide.ts:366-371`; SA-03 has 0 controls; PU-10 has 0 controls)                                      | F-08 is no longer blocked by the landing (PU-10 untouched by `b98814d`).                                                              |
| M-08 / 6.6 / G-7            | Confirmed (no status, command or transition)                                                                     | Wording corrected: T-02 is "WAIT FOR DECISION", not an owner decision against decline.                                                |
| Line references (F-04…F-07) | All still valid (no code change in scope)                                                                        | `student-access.ts` `listGrants` loop is `:231-280` (audit `:238-277`).                                                               |

No current code contradicts a substantive audit finding.
