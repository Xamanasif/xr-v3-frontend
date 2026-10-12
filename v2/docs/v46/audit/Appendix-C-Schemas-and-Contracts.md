# Appendix C — Candidate domain schemas and mock service contracts

> **Appendix C of the Phase-0 audit report** (`XR-v46-Phase0-Audit-Report.md`, Section 5). Source: `wf/final/schemas.md`, final edition. An adversarial verifier raised 20 corrections: 19 were applied and 1 was rejected, with reasons in the Verification log at the end. The body below is unchanged.
>
> **Reading notes added at assembly**
> 1. **Labels.** `[C]` = CONFIRMED. `[P]` PROPOSED is what the rest of the report calls PROVISIONAL (an implementation field or shape that is not drawn, reversible, and safe to change). `[U]` = UNRESOLVED.
> 2. **The contract.** The 22 product ports (183 methods) and 6 test/seed-only stand-in ports (8 methods) in §3 are the service contract the plan adopts (plan X-1). Appendix D's 18 port names are aliases of these.
> 3. **Record kinds.** One `RecordKind` union: FMAP (the matrix's FCM), and COMP for the stored format completion (M17; plan X-7, X-9). Storing completion is in Phase-0 gate G-2 (AD-39).
> 4. **Phase-0 interims** for the open rules typed here: `OverlapGrantPolicy` returns `undecided` → `policy-open` for the overlap case (DV-1). Objective marks come from fixtures (DV-2). `WorkflowRoutingPolicy` may return only the drawn default.
> 5. **Id spaces.** The "D-nn" defect ids in §7 belong to this appendix. Appendix A has its own D-01…D-31.

---


Phase-0 architecture audit · read-only · 9 Oct 2026 · deliverable "Candidate domain schemas and mock service contracts" · **final edition** (draft adversarially verified; every correction re-checked against the boards and the committed foundation — see the Verification log at the end).
Status: **PROPOSAL for owner review.** Nothing here is approved, built or committed. The v46 handoff has **no field-level schemas and no service contracts** (B8-06 "Mock services" names only the service areas; entities.json gives 15 records with one status line each; 12 open decisions are classified "Shapes the data model"). Every item below therefore separates what the boards evidence from what this document proposes.

## 0. How to read this document

### 0.1 Authority (as given for this audit)
Owner binding constraints (START-HERE.md, FREEZE-RECORD-v46.md, 9 Oct 2026) > v46 boards > handoff JSON (board wins; a difference is a **handoff defect to report**, not to fix) > `derived/`. Stakeholder-confirmed records govern business behaviour; where one conflicts with v46 it is flagged for the owner, not resolved here.

### 0.2 Labels used on every item
| Label | Meaning |
|---|---|
| **[C] CONFIRMED** | Drawn on a v46 board (field label, example value, validation copy, control, transition) or stated by an owner binding constraint / stakeholder-confirmed rule. Evidence is cited. |
| **[P] PROPOSED** | An implementation field or shape not drawn anywhere (ids, foreign keys, timestamps, version counters, audit fields, read-model shapes, error unions). The reason is given. Safe to change without design input. |
| **[U] UNRESOLVED** | An open decision (OD-, T-, D-, ND-), a stakeholder ↔ v46 conflict, or a board ↔ board / board ↔ JSON inconsistency. The contract leaves room for every answer and **encodes no rule**. |

### 0.3 Citation convention
- `B2-05 f11` = `design/handoff-v46/canvas-v46/project/B2-05-Give-Students-Access.dc.html`, frame 11. Batch-0 boards are cited by number (`07`, `08`, `10`).
- `entities.json`, `flows.json`, `open-decisions.json`, `screens.json` = `design/handoff-v46/canvas-v46/project/handoff/<file>`.
- `U:<surface> FE` / `PE` = Understand-stage `fieldEvidence` / `permissionEvidence` in `scratchpad/wf/understand/surface-<surface>.json`; `U:DR BR-nnn` = `decisions-rules.json` business rule; `U:HC` = `handoff-consistency.json`; `U:RB` = `repo-baseline.json`; `U:FP` = `functional-prototype.json` (reference only).
- Committed foundation: `1b090c9:v2/packages/...` (read with `git show`).
- `BC-n` = owner binding constraint n as listed in the audit brief (BC-1 PUBLIC surface / 7 roles; BC-2 Programme/Course/Experiment/format, no Module; BC-3 five states, Completed system-set; BC-4 per-format progress; BC-5 feedback; BC-6 Faculty assessments; BC-7 first publication chain; BC-8 corrections chain; BC-9 publishing never grants access; BC-10 typed mock services, no real auth/payment/XR/grading/persistence; BC-11 Composite Wall records separate; BC-12 logo/font placeholders; BC-13 B1-10 focus fix; BC-14 one connected state).

### 0.4 Spot-checks done for this deliverable (direct reads of the frozen boards)
| Claim relied on | Verified at |
|---|---|
| Grants can be created "Waiting for a licence"; plan line "Access plan ACC-0107 · 120 licences · Yearly, ends 7 Oct 2027"; no format picker | B2-05 result template (`{{ r.sacc }} Active / Waiting for a licence`) |
| Completion is system-reported: "Completed means The simulation reports that you finished. You can’t mark it yourself." · "Completed 14 Oct 2026 · Reported by the simulation at 15:30" | B3-03 |
| Marking has save vs confirm: "Mark saved — not confirmed yet" · "Confirmed marks can’t be changed." · "Marks confirmed 7 Nov 2026, 10:15 · Dr S. Ranganathan" | B4-09 |
| Hold carries a reason the Content Manager sees; Lift hold returns to "Waiting for your decision" | B7-05 |
| Requester chain "Submitted · Under review · Approved — payment required · Payment not confirmed · Access active"; branch "Payment failed → try again"; internal route has no payment step | B1-08 |
| Content Manager send-back: "Send it to — Academic Reviewer (For a re-check of the academic content) / Vendor"; references only for the Vendor | B6-07 |
| Platform-role scope: "All experiments · A course · One experiment"; register dialogs for Vendor, Reviewer, Content Manager | B7-08 |
| Request term options "Monthly · Quarterly · Yearly · Until a fixed date"; SA decision term select "Monthly Quarterly Yearly" only | B1-07, B1-11 |
| Role-relative device-transfer words (W / IAW / SAW maps) | B3-07, B3-09, B3-11, B7-09 scripts |
| Grant status map `{active:'Active', waiting:'Waiting for a licence', inactive:'Student inactive', withdrawn:'Withdrawn', ended:'Access ended'}` | B2-04 script `LBL` |
| Student assessment words `To do · Attempt in progress · Waiting for marking · Result not released yet · Result ready` | B4-11 script `W` |
| SA request words `Under review · Information requested · Approved — payment required · Payment not confirmed · Access active` (no "Payment failed") | B1-10 script `LBL` |
| Format names and "how it runs" text (`fmtName`, `fmtText`) | B6-07 script data |
| Sign-in error "The e-mail or password isn’t right — Check both and try again." | B1-09 |
| "Request sent · Your reference is REQ-0042 · Your selection was sent with this request, so it is empty again." | B1-07 |
| Sample conflicts Konark ACC-0064 vs ACC-0091 and BITS Hyderabad ACC-0081 vs ACC-0098 (and REQ-0039 contents) | B1-11 data, B7-02 data, B1-08 |
| Record ids "Prefix + four digits in a monospace chip" | B8-03 "Record IDs" |
| No Campus record, field, filter, status or level on any board | U:FP `campus` (grep of 18 boards; every hit is a sample name, the route label "Internal — BITS campus or programme" or the phase name "Campus distribution") |
| No sample accounts and no role switcher, in any form: "Never here — DEMO strips, sample accounts, a role switcher, “Viewing as…”, or a “choose a workspace” step" | B1-09 annotation 'Never here' (final-edition re-check) |
| A Student's device-transfer request **exists and waits** when the institution has no Institute Admin: notice "This request can't be forwarded yet — Your institution has no Institute Admin right now. It stays here until one is assigned." under the request's From / To | B3-07 script state `dn` (`stage: 'sent', noIA: true`); `canRequest` checks only the pause (final-edition re-check) |
| The Institute Admin pays its own approved request: "Approved - payment required · Nothing changes until the payment is confirmed." + "Open the payment page" → B1-08 (Godavari, more licences, institution still active) | B3-08 frame 'Approved - payment required (later sample)' (final-edition re-check) |
| IA pages are read-only while paused: "Students can't open experiments. Pages are read-only until BITS lifts the pause." · caption "Batch-0 banner; no actions while paused." | B2-01 frame 'Institution paused (read-only)' (final-edition re-check) |
| Grant word while paused differs by screen: B2-04 `LBL` has no "Paused" (annotation "… · read-only while paused"); the B2-03 paused plan page shows SACC-0310 as "Paused" | B2-04 script `LBL` + 'Statuses' annotation; B2-03 paused frame (final-edition re-check) |
| History is not written on every command: Vendor `saveDraft` writes "Draft saved · Only you can see a draft." on the first save only; CM `saveDraft` only shows "Draft saved · <time> · the live version is unchanged"; assigning or restoring a scope drops the matching row from the withdrawn-scope list and prepends a history row | B5-0x shared script `saveDraft` (`const first = s.mode === 'new'`); B6-09 script `o.saveDraft`; B7-08 script (`wd.filter(…)`, `hist: [['Scope assigned - …'] …]`) (final-edition re-check) |
| Platform-code uniqueness: annotation "Each code unique (case and spaces ignored)." vs script `T(r.code).toUpperCase()` (trim + case only) | B6-10 'Rules' + script `o.save` (final-edition re-check) |

### 0.5 What this document covers
1. Cross-cutting foundations (ids, time, roles and actors, formats, role-relative labels, history, provided values, record metadata) and the **required edits to the committed foundation** — §1 (§1.9).
2. Twenty-eight candidate models with TypeScript, CONFIRMED / PROPOSED / UNRESOLVED lists, canonical status + per-role label map, and transition table — §2.
3. Mock service contracts: conventions, error union, twenty-two product service ports (183 methods, in sixteen bounded-area sections) and six **test/seed-only** system stand-in ports (8 methods, no UI of any kind), each method with input, output, errors, preconditions, cross-record side effects and calling screens — §3.
4. Sample-world requirements and the sample-data conflicts the owner must choose between — §4.
5. Validation foundation (zod placement, field-error and error-summary shape, the exact drawn copy) — §5.
6. Explicit NOT-modelled list — §6.
7. Handoff defects surfaced while modelling, and owner decisions — §7, §8.

---

## 1. Cross-cutting foundations

### 1.1 Branded identifiers

```ts
// packages/domain (proposed module: ids.ts) — framework-free, no zod (boundary matrix forbids zod in @xr/domain)
declare const brand: unique symbol;
export type Brand<T, B extends string> = T & { readonly [brand]: B };

// ---- Drawn record ids: "Prefix + four digits in a monospace chip" (B8-03 'Record IDs') ----
export type RequestId              = Brand<string, 'RequestId'>;              // REQ-0042
export type AccessPlanId           = Brand<string, 'AccessPlanId'>;           // ACC-0107
export type StudentAccessGrantId   = Brand<string, 'StudentAccessGrantId'>;   // SACC-0310 (individual) · SACC-0311 (group)
export type AssessmentId           = Brand<string, 'AssessmentId'>;           // ASMT-0009
export type AttemptId              = Brand<string, 'AttemptId'>;              // ATT-0450
export type SubmissionId           = Brand<string, 'SubmissionId'>;           // SUB-0077
export type UpdateId               = Brand<string, 'UpdateId'>;               // UPD-0005
export type DeviceTransferId       = Brand<string, 'DeviceTransferId'>;       // DTR-0018
export type SupportReportId        = Brand<string, 'SupportReportId'>;        // SUP-0213
export type QuestionId             = Brand<string, 'QuestionId'>;             // Q-0101 (one letter + four digits, B4-07)
export type GroupId                = Brand<string, 'GroupId'>;                // GRP-0012 (B2-08)
export type FacultyCourseMappingId = Brand<string, 'FacultyCourseMappingId'>; // FMAP-0021 (B2-06 f15)

// ---- Not drawn anywhere — opaque ids proposed for the store (never shown in product copy) ----
export type InstitutionId              = Brand<string, 'InstitutionId'>;   // e.g. 'godavari' (B7-02 data uses 'bitshyd', 'konark')
export type PersonId                   = Brand<string, 'PersonId'>;        // Student / Faculty / Institute Admin / platform people
export type ExperimentId               = Brand<string, 'ExperimentId'>;    // lower-case slug (committed @xr/validation `slug`)
export type CourseId                   = Brand<string, 'CourseId'>;        // stable key — NOT the platform code (code may be blank, T-17)
export type AreaId                     = Brand<string, 'AreaId'>;
export type RoleHolderId               = Brand<string, 'RoleHolderId'>;
export type ScopeId                    = Brand<string, 'ScopeId'>;
export type ResourceId                 = Brand<string, 'ResourceId'>;
export type LearningOutcomeId          = Brand<string, 'LearningOutcomeId'>;
export type FeedbackId                 = Brand<string, 'FeedbackId'>;
export type PaymentAttemptId           = Brand<string, 'PaymentAttemptId'>;
export type InstituteAdminAssignmentId = Brand<string, 'InstituteAdminAssignmentId'>;
export type QuestionDraftId            = Brand<string, 'QuestionDraftId'>;
export type ImportBatchId              = Brand<string, 'ImportBatchId'>;
export type HistoryEntryId             = Brand<string, 'HistoryEntryId'>;
/** Opaque key for the public request-status page. The reference REQ-0042 "identifies the request — it does
 *  not open the page on its own" (B1-08 'Who can open this page'; B1-07 'never presented as a key'). */
export type RequestStatusToken         = Brand<string, 'RequestStatusToken'>;

/** Ids that would collide with static route segments must never be minted (U:HC routeIssues FA-06/07, FA-14..17, VE-02/03). */
export const RESERVED_ID_SLUGS = ['new', 'draft', 'import', 'edit', 'revise', 'help', 'not-allowed'] as const;
```
- [C] The twelve drawn prefixes and the "prefix + four digits" display (B8-03 'Record IDs'; GRP-0012 B2-08; FMAP-0021 B2-06 f15; Q-0101 B4-07).
- [C] The institution's own Student ID (`GIT-2026-0418`) is **data on the Student record, not a key** (B2-07 hint "Your institution’s ID for this student, for example GIT-2026-0418.").
- [P] Opaque ids for records that have no drawn id (INST, PER, EXP, CRS, AREA, ROLE holder, RES, LO, FB …): needed for foreign keys and routes; routes key courses by a stable id because the platform code can be blank and contains a space (U:HC routeIssues PU-05).
- [P] `ExperimentId` as a lower-case slug reuses committed `1b090c9:v2/packages/validation/src/identifiers.ts` `slug`. The two Composite Wall records get different slugs (`composite-wall-conduction`, `conduction-through-a-composite-wall`) — BC-11.
- [U] When a submission id is given (OD-B5-07: prototype "on the first save of a draft") — modelled as such, flagged.

### 1.2 Time

```ts
// packages/domain (proposed module: time.ts) — framework-free. The committed boundary matrix gives @xr/domain
// NO workspace dependency (1b090c9 boundary-matrix.mjs: '@xr/domain': []), so nothing here imports @xr/validation.
export type IsoInstant   = Brand<string, 'IsoInstant'>;    // canonical UTC 'YYYY-MM-DDTHH:mm:ss.sssZ' (toISOString form)
export type CalendarDate = Brand<string, 'CalendarDate'>;  // 'YYYY-MM-DD' — plan start/end, "Until a fixed date"
/** One sample-world clock for every service (BC-14). Never Date.now() inside a rule. */
export interface ClockPort { now(): IsoInstant }
```
- [C] Boards show instants as "8 Oct 2026, 15:05" and dates as "7 Oct 2027" (B2-03); deadlines as "14 Nov 2026, 23:59" (B4-04).
- [C] Boundary: `1b090c9:v2/packages/config/eslint/boundary-matrix.mjs` — `ALLOWED_WORKSPACE_DEPENDENCIES['@xr/domain'] = []`, `FORBIDDEN_THIRD_PARTY['@xr/domain']` includes `zod`; the committed `@xr/validation` `IsoInstant` is `z.output<typeof isoInstant>` (a zod-derived type, `instant.ts`), and `rules/resolved-boundaries.mjs` checks type-only imports too. Committed `runtime/events.ts` already types `occurredAt: string` (no import).
- [P] `@xr/domain` owns the framework-free brands `IsoInstant` / `CalendarDate`. `@xr/validation` keeps the committed zod codec (`isoInstantWire`, `isoInstant`, `normaliseInstant`); `@xr/contracts` (allowed to depend on both) maps an accepted wire string to the domain brand. Because both packages would then export a type named `IsoInstant`, `@xr/contracts` imports one under an alias (or the validation-side type is renamed, e.g. `AcceptedInstant`) — an engineering choice, not a boundary change. **The boundary matrix is not widened.**
- [P] Store UTC (`IsoInstant`), render in one configured display zone. Display zone is not drawn (all sample times read as Indian local time) — implementation choice, listed for the owner only because it changes deadline/release instants.
- [U] One clock for one connected world: board dates span Aug 2026 (Vendor) → Oct 2026 (Public, Student, SA "23 Oct 2026") → Nov 2026 (Faculty) (OD-B6-12, OD-B7-08, OD-B7-14, OD-B7-15, OD-B4-16) — §4. The clock is set by the seed and by test harnesses only (§3.18); there is no time-travel control in the running app.

### 1.3 Roles, audiences and actors

```ts
import type { Role } from '@xr/domain'; // committed: 'student'|'faculty'|'tenant_admin'|'vendor'|'academic_reviewer'|'content_manager'|'super_admin'

/** v46 display names (B8-03 'Formats and names'). The committed planning labels
 *  ('Institute Admin / Tenant Admin', 'Student / Learner') must not reach product copy. */
export const ROLE_LABEL: Readonly<Record<Role, string>> = {
  student: 'Student', faculty: 'Faculty', tenant_admin: 'Institute Admin', vendor: 'Vendor',
  academic_reviewer: 'Academic Reviewer', content_manager: 'Content Manager', super_admin: 'Super Admin',
};

/** PUBLIC is a surface, not a role (BC-1). 'public' is only an audience for labels and read models. */
export type Audience = Role | 'public';

/** Non-human writers. Each is a test/seed-only stand-in port in §3.18 — never a control of any kind (product or developer). */
export type SystemActor =
  | 'system:runtime-report'    // simulation / headset reports (completion trigger OPEN — T-12)
  | 'system:payment-provider'  // payment outcome (provider OPEN — T-05, R06)
  | 'system:workflow-routing'  // routes a resubmission (OD-B5-05, M-3)
  | 'system:release-setting'   // assessment result released by its own setting (B4-14 D4)
  | 'system:term-clock';       // Ending soon / Access ended by the plan term

export type ActorRef =
  | { readonly kind: 'person'; readonly personId: PersonId; readonly role: Role; readonly displayName: string }
  | { readonly kind: 'requester'; readonly name: string }   // public contact person — no account (T-01)
  | { readonly kind: 'system'; readonly system: SystemActor };
```
- [C] Seven authenticated roles, no eighth (BC-1; U:DR BR-001/002); one role per signed-in person, no switcher and no sample-account chooser in any form — product or developer-only (owner constraint; B1-09 'Never here'; XS-02 DEFER).
- [C] The committed `ROLE_PLANNING_LABEL` (`'Student / Learner'`, `'Institute Admin / Tenant Admin'`) must not reach copy; `ROLE_LABEL` replaces it (§1.9 edit 2).
- [C] System writers are drawn as actors: completion "System" (B3-12 C3), release "The assessment’s own setting" (B4-14 D4), routing "Routed by the approved workflow rule." (B5-08), payment confirmation "not recorded on this page" (B1-11).
- [U] Internal role id `tenant_admin` vs display "Institute Admin" — keep or rename is an owner decision (U:RB conflictsWithV46 'Role identifiers'; OPEN_DECISIONS A-20 answered by BC-1).

### 1.4 Technology formats

```ts
import type { Technology, DeliveryModel } from '@xr/domain'; // committed TECHNOLOGIES = ['web','vr','mr','ar'] (FRD order, NOT the display order);
                                                          // committed DeliveryModel = 'hosted' | 'package' — reused, no second delivery vocabulary

export type FormatCode = 'WEB' | 'AR' | 'VR' | 'MR';
/** v46 order everywhere: WEB · AR · VR · MR (B8-03; board 04; B1-06 fmtList; B5-04 checkbox order). */
export const FORMAT_DISPLAY_ORDER = ['web', 'ar', 'vr', 'mr'] as const satisfies readonly Technology[];

/** Replaces the committed TECHNOLOGY_META as the ONE format vocabulary (§1.9 edit 1). */
export interface FormatMeta {
  readonly code: FormatCode;      // the chip code (B8-03 "always the chip with the code next to words")
  readonly name: string;          // chip words next to the code (B6-07 fmtName)
  readonly vendorLabel: string;   // VE-04 checkbox label
  readonly howItRuns: string;     // PU-06 / CM-03 'How it runs' (B6-07 fmtText)
  readonly delivery: DeliveryModel;
}
export const FORMAT_META: Readonly<Record<Technology, FormatMeta>> = {
  web: { code: 'WEB', name: 'Browser', vendorLabel: 'Browser (WEB)', delivery: 'hosted',
         howItRuns: 'The experiment in a web browser, on a laptop or desktop.' },
  ar:  { code: 'AR', name: 'Augmented reality', vendorLabel: 'Augmented reality (AR)', delivery: 'package',
         howItRuns: 'The experiment overlaid on your surroundings, on a supported phone or tablet.' },
  vr:  { code: 'VR', name: 'Virtual reality', vendorLabel: 'Virtual reality (VR)', delivery: 'package',
         howItRuns: 'The experiment in a virtual lab, on a supported VR headset.' },
  mr:  { code: 'MR', name: 'Mixed reality', vendorLabel: 'Mixed reality (MR)', delivery: 'package',
         howItRuns: 'The experiment combined with your real surroundings, on a supported mixed-reality device.' },
};
export function inDisplayOrder(list: Iterable<Technology>): Technology[] {
  const set = new Set(list);
  return FORMAT_DISPLAY_ORDER.filter((f) => set.has(f));
}
```
- [C] Names and how-it-runs text: B6-07 data `fmtName` / `fmtText`; Vendor labels B5-04; order B8-03 and B1-06. MR retained (U:DR BR-014).
- [C] Delivery model: WEB = web link + browser/computer; AR/VR/MR = app package (B5-04; U:DR BR-097) — the same split the committed `DeliveryModel` already names `'hosted' | 'package'` (1b090c9 technology.ts, STK31-37), so it is reused.
- [U] Board text differs slightly: B1-05 VR "on a supported headset" vs B6-07 "on a supported VR headset" — minor board inconsistency; take one string for the owner to confirm.
- [U] Committed `sortTechnologies` (web·vr·mr·ar) must never feed the UI; either add the display order (above) or change the canonical order by ADR (owner decision). Committed `TECHNOLOGY_META` (label `'Web'`, names `'Web'` / `'Virtual Reality'` / `'Mixed Reality'` / `'Augmented Reality'`) contradicts B6-07 / B8-03 and must not coexist with `FORMAT_META` — §1.9 edit 1.

### 1.5 Canonical state + role-relative labels

```ts
/** One canonical state per record; each audience reads it through its own words.
 *  entities.json lists one perspective per record — every gap is reported in §7. */
export type LabelMap<S extends string> = Readonly<Partial<Record<Audience, Readonly<Record<S, string>>>>>;

/** Example — verified against the B3-07 / B3-09 / B3-11 scripts (W, IAW, SAW). Every other record's map is the
 *  'Status → labels' table under its model in §2 and is written the same way in the web layer. */
export const DEVICE_TRANSFER_LABELS: LabelMap<DeviceTransferState> = {
  student:      { 'with-institute-admin': 'With your Institute Admin', forwarded: 'Forwarded to BITS', approved: 'Approved' },
  tenant_admin: { 'with-institute-admin': 'Waiting on you', forwarded: 'Forwarded to BITS', approved: 'Decided · approved by BITS' },
  super_admin:  { 'with-institute-admin': 'Still with the institution', forwarded: 'Forwarded', approved: 'Approved' },
};
```
- [C] Same state, different words is drawn throughout (B8-03 status vocabulary; U:HC statusWordDiffs; flows.json F2/F3 "Awaiting release decision" vs "Waiting for your decision").
- [P] Labels live in the web layer (copy), keyed by canonical state and audience; services return canonical states plus the facts a label needs (dates, revision, who), never pre-rendered words.

### 1.6 History and audit

```ts
export interface HistoryEntry<E extends string> {
  readonly id: HistoryEntryId;
  readonly event: E;                         // canonical event kind; words come from a per-audience map
  readonly at: IsoInstant;
  readonly actor: ActorRef;
  readonly note: string | null;              // reason / note exactly as entered
  readonly visibleTo: readonly Audience[];   // e.g. a withdrawal reason: the institution's administrators only (B2-04 hint)
  readonly refs: readonly RecordRef[];       // records this entry names (REQ-0042, ACC-0107 …)
}
export type RecordKind =
  | 'REQ' | 'INST' | 'ACC' | 'SACC' | 'PER' | 'GRP' | 'FMAP' | 'CCODE' | 'AREA' | 'CRS' | 'EXP' | 'SUB' | 'UPD'
  | 'RUN' | 'FB' | 'RES' | 'ASMT' | 'ATT' | 'Q' | 'DTR' | 'SUP' | 'ROLE';
export interface RecordRef { readonly kind: RecordKind; readonly id: string }
```
- [C] Every governed record shows "what · when · who · note" history (B1-08, B1-11 'History', B2-03, B2-06, B3-07, B3-09, B5-06, B6-09, B7-03, B7-05, B7-08, B7-09). Vendor history is labelled "not an audit log" (B5-06).
- [C] Role-specific history words, e.g. requester "Request submitted · BITS started reviewing · BITS asked for more information · Approved — payment needed · Approved with changes — payment needed · Approved · Payment started · Payment not completed · Payment confirmed · Access active" (B1-08) vs SA "Decided by you · 8 Oct 2026, 11:20 · External" (B1-11).
- [C] Reversible status changes keep history; nothing is hard-deleted (U:DR BR-126).
- [C] History is **not** written on every command: which commands write which entry follows the boards (per-command table in M28 — e.g. a Vendor draft save writes history only on the first save; revision and correction saves write none).
- [P] `visibleTo` lets one entry carry the reason to the right readers (withdrawal reason "Kept in the access history, which your institution’s administrators can see." — B2-04).

### 1.7 Provided values (no counting, no derivation)

```ts
/** A figure or state the service supplies as data. Neither @xr/domain nor the UI derives it
 *  (T-06 / D7 licences; OD-B3-07 last saved / last session; OD-B3-08 usage figures). */
export type Provided<T> = Brand<T, 'Provided'>;
```
- [C] "Show figures as provided … never explain what assignment, withdrawal or deactivation does to the count" (T-06); "Licences 120 — as approved by BITS" with no in-use figure (B2-03); "Last saved 12 Oct 2026, 11:20" time only (OD-B3-07).
- [U] "Licences 1,284 of 1,650" appears only on Batch-0 specimens (04, 09a "Foundation pattern example · not the IA-F1 design"); no product board shows an "of" figure. Not modelled as a field.

### 1.8 Record metadata and concurrency

```ts
export interface RecordMeta {
  readonly rev: number;           // +1 on every write; commands carry expectedRev → 'stale-version' error
  readonly createdAt: IsoInstant;
  readonly updatedAt: IsoInstant;
}
```
- [P] `rev` supports the salvaged Slice-1 store pattern "read-latest-before-mutate" and cross-tab adoption (U:RB slice1 `world-store.ts`, SALVAGE_WITH_CHANGES) and maps to HTTP `If-Match` later.
- [P] `createdAt`/`updatedAt` drive "last change" columns (VE-02 "Status · last change"; CM-08 "Returned · 26 Aug 2026").

### 1.9 Required edits to the committed foundation (1b090c9)
The approved foundation already exports vocabularies for roles, formats and runtime status. Adding the v46 vocabularies beside them would leave two answers to one question. These are the exact edits this proposal needs; none is made by this audit.

| # | Committed file (1b090c9) | What it says now | Required edit | Label |
|---|---|---|---|---|
| 1 | `v2/packages/domain/src/technology.ts` | `TECHNOLOGIES = ['web','vr','mr','ar']`; `TECHNOLOGY_META` web `label:'Web', name:'Web'`, vr `name:'Virtual Reality'`, mr `'Mixed Reality'`, ar `'Augmented Reality'`; `DeliveryModel = 'hosted' \| 'package'`; `sortTechnologies` sorts by FRD order and is documented as "the canonical display order" | Keep the `TECHNOLOGIES` ids. Add `FORMAT_DISPLAY_ORDER` (WEB · AR · VR · MR) and `FORMAT_META` (§1.4), and **delete `TECHNOLOGY_META`** (or change its `label` to the code `'WEB'\|'AR'\|'VR'\|'MR'` and its `name` to the B6-07 `fmtName` words — one of the two, never both). **Reuse `DeliveryModel`** (`hosted` = WEB link, `package` = AR/VR/MR); no `'web-link' \| 'app-package'`. Re-document `sortTechnologies` as non-UI (FRD order) or re-point it at the display order by ADR (owner decision §8-3). | [C] B6-07 `fmtName`/`fmtText`, B8-03 'Formats'; [U] order ADR |
| 2 | `v2/packages/domain/src/roles.ts` | `PLATFORM_ROLES` incl. `'tenant_admin'`; `ROLE_PLANNING_LABEL` `'Student / Learner'`, `'Institute Admin / Tenant Admin'` ("Final UI copy is a Design V2 / ND-01 matter") | Keep or rename the id `tenant_admin` (owner decision §8-2). **Remove `ROLE_PLANNING_LABEL`** (or rename it so it cannot be mistaken for copy) and add `ROLE_LABEL` (§1.3) with the B8-03 names; drop the B2C "Learner" wording from anything that can reach the UI (v46 is B2B; PUBLIC is a surface, not a role — BC-1). | [C] B8-03 'Role names'; [U] id rename |
| 3 | `v2/packages/domain/src/runtime/utilisation.ts` | `SimulationStatus = 'NOT_STARTED' \| 'IN_PROGRESS' \| 'COMPLETED'`; `deriveSimulationUtilisation` sets `COMPLETED` from a `SIMULATION_COMPLETED` event of an opened session | `FormatProgressStatus` (M17: `'not-started' \| 'in-progress' \| 'completed'`) is the **one** status any read model or UI uses. `SimulationStatus` is mapped to it only inside a future runtime adapter, never in a screen or the mock. The `SIMULATION_COMPLETED` trigger moves behind `CompletionPolicy` (typed in M17) because T-12 is open; the mock never calls `deriveSimulationUtilisation` to create a completion. | [C] BC-3; [U] T-12 |
| 4 | `v2/packages/domain/src/index.ts` | re-exports roles, technology, runtime | Add the new modules (`ids`, `time`, models of §2, pure rules); export `IsoInstant` from `@xr/domain` (§1.2) without importing `@xr/validation`. | [P] |
| 5 | `v2/packages/validation/src/instant.ts` | exports `IsoInstant = z.output<typeof isoInstant>` | No behaviour change. Optional rename of the type (e.g. `AcceptedInstant`) to avoid two exported `IsoInstant` names; `@xr/contracts` maps it to the domain brand (§1.2). | [P] |
| 6 | `v2/packages/config/eslint/boundary-matrix.mjs` | `'@xr/domain': []` | **No change.** A new mock-adapter package, if chosen (§5.1, §8-25), needs its own row. | [C] |

---

## 2. Candidate models

Model index (record codes from entities.json where one exists; codes in *italics* are records the boards use but entities.json omits — §7 D-01):

| # | Model | Code | Writer(s) (evidence) |
|---|---|---|---|
| M01 | Institution (+ Campus decision) | INST | Super Admin (created only by approving a request) |
| M02 | Institute Admin assignment | *IAA* | Super Admin |
| M03 | Access request + payment attempt | REQ / *PAY* | Public contact · Institute Admin → Super Admin; payment = system |
| M04 | Selection | *SEL* | Public visitor (browser session) |
| M05 | Access plan | ACC | system on activation; read by IA |
| M06 | Engineering area | AREA | Super Admin |
| M07 | Course + platform course code | CRS | Super Admin; code: Content Manager (M-2) |
| M08 | Institution course code | *CCODE* | Institute Admin |
| M09 | Experiment, versions, delivery, outcomes, resources | EXP / *LO* / *RES* | Content Manager (publish); Super Admin (release) |
| M10 | Submission + review/publication decisions | SUB | Vendor → Academic Reviewer → Content Manager |
| M11 | Correction (update) | UPD | Content Manager → Academic Reviewer → Super Admin |
| M12 | Person (Student, Faculty) | PER | Institute Admin (SA override) |
| M13 | Group + membership | *GRP* | Institute Admin |
| M14 | Faculty course mapping | *FMAP* | Institute Admin |
| M15 | Student access grant + provided licence wait + open gate | SACC | Institute Admin (refused while paused) |
| M16 | Runtime activity (per format) | RUN (activity) | runtime (mock stand-in) |
| M17 | Format completion + FormatProgress view | RUN (completion) | system only (T-12) |
| M18 | Resource opened | *RES activity* | Student (opening) |
| M19 | Format feedback | FB | Student |
| M20 | Assessment (+ versions) | ASMT | Faculty |
| M21 | Question bank item, assisted draft, import batch | *Q* | Faculty |
| M22 | Attempt, marking, result | ATT / *MRK* | Student · Faculty · release setting |
| M23 | Device transfer + authorised device | DTR | Student → Institute Admin → Super Admin |
| M24 | Support report | SUP | any signed-in person → Super Admin |
| M25 | Platform role holder + scopes | ROLE | Super Admin |
| M26 | Mock session / identity | *SESSION* | sign-in (mock; `signIn` only — no account switcher of any kind) |
| M27 | Derived read models (usage, access ending, overviews, follow-up) | — | services only |
| M28 | History / audit | — | per command as drawn (M28 table; §1.6) |

---

### M01 Institution (INST)
Boards: B1-11 (four events), B7-02, B7-03, B7-04, B2-01, 08 (XS-08 banner). entities.json INST.

```ts
export type InstitutionKind = 'internal' | 'external';          // 'Internal — BITS campus or programme' | 'External institution'
export type InstitutionStatus =
  | 'approved-payment-required'   // record exists, no access yet (external, before payment)
  | 'access-active'
  | 'ending-soon'                 // derived: plan ends within ENDING_SOON_DAYS (term clock) — threshold PROVISIONAL
  | 'access-paused'
  | 'access-ended';

/** 'Ending soon' / 'Reminder due' window. PROVISIONAL (U:DR BR-049; T-31; boards draw single samples only:
 *  '15 days left' B2-01 f3, '8 days left' B7-09 f4). One named constant so an owner answer changes one line. */
export const ENDING_SOON_DAYS = 15;

export interface Institution extends RecordMeta {
  readonly id: InstitutionId;
  readonly name: string;                                    // 'Godavari Institute of Technology'
  readonly kind: InstitutionKind;                           // set once, at first approval (T-04)
  readonly createdFromRequestId: RequestId;                 // 'Open request REQ-0042' (B7-03)
  readonly pause: InstitutionPause | null;                  // the only stored status fact; everything else is derived
  readonly instituteAdmin: InstituteAdminAssignment | null; // M02
  readonly history: readonly HistoryEntry<InstitutionEvent>[];
}
export interface InstitutionPause { readonly since: IsoInstant; readonly by: ActorRef; readonly reason: string }
export type InstitutionEvent =
  | 'record-created' | 'access-activated' | 'institute-admin-assigned' | 'paused' | 'restored'
  | 'student-status-overridden' | 'access-ended' | 'renewal-requested';

/** Status is read, not stored: plan dates + pause + whether any plan exists. */
export declare function institutionStatus(i: Institution, plans: readonly AccessPlan[], now: IsoInstant): InstitutionStatus;
```
**CONFIRMED**
- [C] `name` — display everywhere (sidebar workspace label, B2-01; SA-06/07 B7-02/03). Example "Godavari Institute of Technology".
- [C] `kind` — "Internal or external (required to approve)… You set this; the requester never chooses it. Approval can’t be completed while it is not set." (B1-11 f7); list shows "Not set yet / Internal / External" (B1-10). Example External.
- [C] Created only at the first approval of a new institution: "1 Institution record — Created when you approve the first request from a new institution. A record is not access." (B1-11); no "Create institution" (T-09; B7-02 annotation).
- [C] Pause / Restore with a required reason kept in the history: "Add a reason — it is kept in the history" (B7-03 f7); "Paused on 12 Oct 2026 · “The institution asked us to pause access while it checks its student list.”" (B7-03 f2); allowed from active or ending soon; restore from paused (B7-03 annotation; U:DR BR-046).
- [C] Awaiting-payment and ended institutions have no status action (B7-03 annotation).
- [C] Pause effects (B7-04): IA, Faculty and Students see the banner "Your institution’s access is paused — your work is kept"; Students can't open experiments; IA pages read-only — "Students can't open experiments. Pages are read-only until BITS lifts the pause." (B2-01 paused frame, caption "no actions while paused"; drawn per screen only for Give students access, withdraw, course codes, forwarding); requests from a paused institution can't be decided (B1-11 f14); Faculty get the banner only (OD-B7-07).
- [C] SA-06 list columns: institution, kind, status, Institute Admin ("Not assigned" + "Needs one"), "Access ends", plan summary "ACC-0107 · 1 course · 1 experiment" / "No access plan yet · 1 experiment requested" (B7-02); detail "People 12 students · 3 Faculty" (B7-03).

**PROPOSED**
- [P] `id: InstitutionId` — no id drawn; B7-02 sample data already keys institutions by slug (`bitshyd`, `konark`).
- [P] `pause` as the only stored status fact — status words derive from plan dates (term clock) and the pause, so one store change (Pause) updates every surface (BC-14).
- [P] `history` with `InstitutionEvent` kinds for B7-03 History rows ("Request REQ-0042 approved — payment required · 8 Oct 2026, 11:20 · External · approved as requested").

**UNRESOLVED**
- [U] **Campus is not designed.** No campus record, field, filter, status or hierarchy level on any board (U:FP `campus`; entities.json has none). Stakeholder STK31-23: a campus/unit may be its own tenant; no sub-tenant level. **Proposal: no Campus entity; a campus is an Institution** (sample "BITS Pilani — Hyderabad Campus", kind internal). On-campus / Off-campus categorisation ("may include", STK31-23) is not drawn and not modelled — owner decision.
- [U] Terminate / delete an institution (stakeholder STK31-21) is not drawn — only reversible Pause/Restore (conflict, U:DR conflicts 'tenant creation').
- [U] What happens if a plan's term ends while the institution is paused — not drawn.
- [U] Pause reason shown to users is open (08 rules; U:public FE INST/ACC).
- [U] The 15-day "Ending soon" threshold is PROVISIONAL (U:DR BR-049 "For the frontend build only"; T-31) — held as `ENDING_SOON_DAYS`, not hard-coded in any rule or screen.
- [U] Approving or paying for a renewal / more-licences request from an **existing** institution does not change the institution's status (it stays derived from its plans); the plan effect is OD-B3-09 (see M05, §3.4).

**Status → labels**
| Canonical | Super Admin (B7-02 stw) | Institute Admin (B2-01 status line / IA-02·03 bands) | Faculty · Student (banner) | entities.json |
|---|---|---|---|---|
| approved-payment-required | Approved — payment required | Approved — payment required (pre-activation, B2-01/02) | — | Approved — payment required |
| access-active | Access active | Access active / Active | — | Access active |
| ending-soon | Ending soon | Ending soon · "15 days left" | — | Ending soon |
| access-paused | Access paused | Access paused / Paused | "Your institution’s access is paused — your work is kept" | Access paused |
| access-ended | Access ended | Access ended / Ended | "Access ended on 7 Oct 2027" (ST-01) | Access ended |

**Transitions**
| From | To | Command | Actor |
|---|---|---|---|
| — | approved-payment-required | `approveRequest` / `approveSmallerScope` on a new **external** institution | Super Admin |
| — | access-active | `approveRequest` / `approveSmallerScope` on a new **internal** institution | Super Admin |
| approved-payment-required | access-active | payment confirmed → activation (new external institution only) | system:payment-provider |
| (any existing status) | unchanged | `approveRequest` / payment confirmed for a renewal or more-licences request, or a new-access request from an existing institution — status stays derived from its plans; plan effect **[U]** OD-B3-09 | Super Admin · system:payment-provider |
| access-active | ending-soon | plan end within `ENDING_SOON_DAYS` (15 — **[U]** PROVISIONAL, BR-049) | system:term-clock |
| ending-soon | access-ended | plan end passed | system:term-clock |
| access-active · ending-soon | access-paused | `pauseInstitution` (DL-2, reason) | Super Admin |
| access-paused | previous (access-active · ending-soon) | `restoreInstitution` (DL-2, reason) | Super Admin |
| ending-soon · access-ended | access-active | renewal activation — effect on the plan record **[U]** (OD-B3-09) | system / Super Admin (internal) |
| (any) | — | Create directly, terminate, delete — **not designed** (T-09, STK31-21) | — |

---

### M02 Institute Admin assignment
Boards: B7-03 f1, f3, f6; B1-08 'Access active' hint; B2-01 (IA identity).

```ts
export interface InstituteAdminAssignment {
  readonly id: InstituteAdminAssignmentId;
  readonly institutionId: InstitutionId;
  readonly name: string;           // required
  readonly workEmail: string;      // required, e-mail format
  readonly assignedAt: IsoInstant;
  readonly assignedBy: ActorRef;   // Super Admin
  readonly personId: PersonId;     // identity used by the mock session (§M26)
}
```
**CONFIRMED**
- [C] `name` required — "Enter the person’s name" (B7-03 f6). Drawn Institute Admins: Meera Iyer (Godavari), R. Bhatt (Konark), Dr P. Srinivas (BITS Hyderabad), S. Kulkarni (Deccan), V. Hegde (Malnad) (B7-02/B7-03 data `ia`; B7-13 sample names). N. Joshi is the Sahyadri **request contact** (B1-10 REQ-0036 `contact`; B7-13/B8-08 "Sahyadri contact N. Joshi"), not an Institute Admin — Sahyadri has none (B7-02 `ia: ""`, "No Institute Admin yet").
- [C] `workEmail` required — "Enter a work e-mail address" / "Enter an e-mail address like name@institution.edu.in" (regex `^[^\s@]+@[^\s@]+\.[^\s@]+$`, B7-03 script). The drawn sample `n.joshi@sahyadri` is the **invalid** input that triggers the format error in the Sahyadri assign dialog (B7-03 script `iaEmail`), not a valid example.
- [C] Offered once access is active; awaiting-payment institutions say "The Institute Admin is assigned once access is active." (B7-03 f3; OD-B7-11).
- [C] "Nothing is sent from here" — how they first sign in is open (T-11; B7-03 dialog).
- [C] Without an Institute Admin nobody can give students access (B7-02 data "No Institute Admin yet — nobody can give students access"; U:DR BR-048). A Student's device-transfer request is still **created** and waits: "This request can't be forwarded yet — Your institution has no Institute Admin right now. It stays here until one is assigned." (B3-07 state `dn`; U:DR BR-074; OD-B3-05).

**PROPOSED**
- [P] `id`, `assignedAt/By` — history row "Institute Admin assigned — R. Bhatt · 3 Aug 2026" (B7-02 data).
- [P] `personId` — the mock session resolves role and institution from records (Slice-1 identity principle, U:RB slice1 `identity-store.ts`).

**UNRESOLVED**
- [U] Replace / remove an Institute Admin — not drawn (B7-03 shows Assign only when none).
- [U] More than one Institute Admin per institution — not drawn; model allows one.
- [U] Identity origin, invitation, activation (T-11 WAIT).

**Status → labels**: no status chip is drawn; SA shows "Institute Admin: Meera Iyer" or "Not assigned" + "Needs one" (B7-02/B7-03); entities.json has no record for it (§7 D-01).

**Transitions**: `none → assigned` · `assignInstituteAdmin` · Super Admin · precondition institution status ∈ {access-active, ending-soon, access-paused} and no assignment. Side effect: the institution's open device-transfer requests (DTR `with-institute-admin`) become forwardable (`forwardingBlocked` clears, M23).

---

### M03 Access request (REQ) + payment attempt
Boards: B1-06, B1-07, B1-08, B1-10, B1-11, B1-13, B3-08, B7-01, B7-09. entities.json REQ; flows.json A1–A4.

```ts
export type RequestType = 'new-access' | 'additional-licences' | 'renewal';   // B1-10 Type column
export type RequestOrigin = 'public' | 'institute-admin';                      // PU-08 vs IA-17

export type RequestedTerm =
  | { readonly kind: 'monthly' } | { readonly kind: 'quarterly' } | { readonly kind: 'yearly' }
  | { readonly kind: 'until-date'; readonly endsOn: CalendarDate }   // B1-07 'Until a fixed date' — see [U]
  | { readonly kind: 'current-plan' };                               // type 'additional-licences' ONLY ('Current term', B1-11 REQ-0040).
                                                                     // A renewal carries the source plan's own term, mirrored (B1-11 REQ-0038 'Yearly'; B3-08; T-07)

export interface RequestedItem { readonly experimentId: ExperimentId; readonly formats: readonly Technology[] } // ≥ 1 format

export type RequestStatus =
  | 'under-review'                // requester sees 'Submitted' until reviewStartedAt is set
  | 'information-requested'
  | 'approved-payment-required'   // external route only
  | 'payment-not-confirmed'       // payment started; outcome not reported yet
  | 'payment-failed'
  | 'access-active';              // terminal

export interface AccessRequest extends RecordMeta {
  readonly id: RequestId;                         // issued on send: 'Your reference is REQ-0042'
  readonly statusToken: RequestStatusToken;       // opaque key of the status page (reference is not a key)
  readonly type: RequestType;
  readonly origin: RequestOrigin;
  readonly institutionId: InstitutionId | null;   // null until the first approval of a new institution
  readonly institutionName: string;
  readonly contact: RequestContact;
  readonly items: readonly RequestedItem[];       // from the Selection (public) or the plan (IA)
  readonly licencesRequested: number;             // whole number ≥ 1; for 'additional-licences' = "N more"
  readonly term: RequestedTerm;
  readonly message: string | null;                // 'Message to BITS (optional)'
  readonly sourcePlanId: AccessPlanId | null;     // 'Renew access plan ACC-0107'
  readonly receivedAt: IsoInstant;
  readonly reviewStartedAt: IsoInstant | null;    // 'BITS started reviewing' — trigger [U]
  readonly status: RequestStatus;
  readonly route: InstitutionKind | null;         // 'Not set yet' until first approval; later requests inherit it
  readonly decision: RequestDecision | null;
  readonly informationRequest: { readonly reason: string; readonly at: IsoInstant; readonly by: ActorRef } | null;
  readonly payments: readonly PaymentAttempt[];
  readonly activatedPlanId: AccessPlanId | null;
  readonly history: readonly HistoryEntry<RequestEvent>[];
}
export interface RequestContact { readonly person: string; readonly email: string; readonly phone: string | null }

export type RequestDecision =
  | { readonly kind: 'approved-as-requested'; readonly at: IsoInstant; readonly by: ActorRef; readonly route: InstitutionKind }
  | { readonly kind: 'approved-smaller-scope'; readonly at: IsoInstant; readonly by: ActorRef; readonly route: InstitutionKind;
      readonly approvedItems: readonly RequestedItem[]; readonly approvedLicences: number;
      readonly approvedTerm: Exclude<RequestedTerm, { kind: 'until-date' } | { kind: 'current-plan' }>;
      readonly reason: string };                  // 'Shown to the requester on their request status.'

export interface PaymentAttempt {                 // provider-neutral: no amount, method, provider or refund (T-05)
  readonly id: PaymentAttemptId;
  readonly startedAt: IsoInstant;
  readonly outcome: 'pending' | 'confirmed' | 'failed';
  readonly outcomeAt: IsoInstant | null;
}
export type RequestEvent =
  | 'submitted' | 'review-started' | 'information-requested' | 'approved' | 'approved-with-changes'
  | 'payment-started' | 'payment-not-completed' | 'payment-confirmed' | 'access-active';
```
**CONFIRMED — public form PU-08 (B1-07 `reqValidate`)**
- [C] `institutionName` required — "Enter your institution’s name". Example "Godavari Institute of Technology".
- [C] `contact.person` required — hint "The person BITS will contact about this request."; "Enter the contact person’s name". Example "Meera Iyer".
- [C] `contact.email` required — "Enter an e-mail address" / "Enter an e-mail address like name@institution.edu" (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`). Example `meera.iyer@godavari.edu.in`.
- [C] `contact.phone` optional — "(optional)", no rule; review shows "Not given".
- [C] `licencesRequested` required — "Enter the number of licences you are requesting" / "Enter a whole number, like 120" (`/^[1-9][0-9]*$/`); hint "How many licences your institution is asking for." Nothing says what a licence covers (D7). Example 120.
- [C] `message` optional — "Message to BITS (optional)"; review shows "None".
- [C] `term` required — "Choose how long you need access"; options Monthly · Quarterly · Yearly ("Recurring term") · Until a fixed date ("Access ends on a date you choose"); hint "BITS confirms the term when it decides the request."; `endsOn` "Enter the date access should end" only for Until a fixed date. Example Yearly.
- [C] `items` from the Selection; "Change" returns to PU-07 (B1-07).
- [C] Error summary title "There is 1 problem with this request" / "There are N problems with this request"; role alert, focused, items link to fields (B1-07 'Validation').
- [C] Never asked: internal/external, payment details, prices (B1-07 'Never asked'); no account, OTP, magic link (T-01).
- [C] Sent: "Request sent · Your reference is REQ-0042 · Use it whenever you refer to this request. · Your selection was sent with this request, so it is empty again." (B1-07).

**CONFIRMED — Institute Admin requests IA-17 (B3-08)**
- [C] "What you need" required — "Renew access plan ACC-0107" / "More licences for experiments you hold"; "Choose what you need".
- [C] More licences: experiments in the plan (pre-ticked) — "Choose at least one experiment"; licences — "Enter the number of licences you need" / "Enter a whole number, like 60"; hint "How many more you need, as a whole number."; no term asked (OD-B3-09) — stored as `term: { kind: 'current-plan' }` (SA sees "Current term", B1-11 REQ-0040).
- [C] The Institute Admin pays its own approved request: "Approved - payment required · Nothing changes until the payment is confirmed." + "Open the payment page" → provider-neutral payment page (B3-08 frame 'Approved - payment required (later sample)' → B1-08 PU-12); the institution meanwhile stays Access active.
- [C] Renewal mirrors the plan: "ACC-0107 · Shell-and-Tube Heat Exchanger · ME ZG523 · WEB VR · 120 licences · Yearly · current plan ends 7 Oct 2027" (B3-08 f2; T-07).
- [C] Organisation and contact shown read-only; optional message ("Sem II has a larger batch than planned.").
- [C] The same REQ reaches Super Admin › Requests (B3-08 f3).

**CONFIRMED — Super Admin decision SA-03 (B1-11)**
- [C] Decision radio required — "Choose a decision": Approve request · Approve a smaller scope · Request more information. **No Decline** (T-02).
- [C] Route radio — "Choose internal or external", required to approve when not yet set.
- [C] Smaller scope: formats per experiment — "Keep at least one format"; licences — "Enter a whole number of licences"; term select Monthly · Quarterly · Yearly; difference — "Change at least one thing, or choose Approve request"; reason — "Enter the reason for the change", hint "Shown to the requester on their request status." Example "Licences: 120 → 100".
- [C] Request more information: "Enter what you need from the requester"; keeps the request open; "none of the four events happen until it is approved"; no confirm dialog.
- [C] Renewal: smaller scope disabled — "Not available for a renewal — the term continues the current plan." (B1-11 f13).
- [C] Paused institution: "Requests from a paused institution can’t be decided. You can decide this one once the pause ends." (B1-11 f14).
- [C] "Where this request stands": Institution record · Request · Payment · Institutional access (B1-11 f9). "Decided by you · 8 Oct 2026, 11:20 · External" (`doneMeta`).
- [C] Four separate events: record created · request approved · payment confirmed (external only, not on this page) · access activated (internal on approval; external after payment) (B1-11; U:DR BR-036).

**CONFIRMED — requester status PU-10/PU-12 (B1-08)**
- [C] Status + "Updated 8 Oct 2026, 11:20"; "What BITS asked" (information requested); "Why it changed" + "Changed" cells; table "What you asked for and what was approved" with "Not decided yet" before a decision.
- [C] PU-12 "What will be activated" (Institution · Experiments and formats · Licences · Access term · Request); no amount, method, provider, refund or "mark paid"; only success activates; "Payment not confirmed" offers "Check again" only; "Payment failed" offers "Try payment again".
- [C] Internal route never shows a payment step (B1-08 'Two routes, one record').

**PROPOSED**
- [P] `statusToken` — the status route needs a key that is not the reference; mock: minted on send, held in the visitor's session (U:HC routeIssues PU-10).
- [P] `origin` — separates the public form from IA-17 for permissions and history wording.
- [P] `reviewStartedAt` — lets one canonical `under-review` render "Submitted" (requester, before review) and "Under review" (both, after).
- [P] `payments[]` — one row per "Continue to payment" so "Payment failed → Try payment again" keeps history.
- [P] `decision`, `informationRequest`, `activatedPlanId`, `history` — drive B1-11 'Where this request stands', PU-10 comparison table and IA-03 "From request REQ-0042".

**UNRESOLVED**
- [U] T-03: no transition **out of** `information-requested` is drawn (no reply form; SA sees only "Sent by you …" with no decision controls, B1-11 f12). The mock keeps it there.
- [U] What marks "BITS started reviewing" (B1-08 history) — not a drawn control.
- [U] SA label for `payment-failed` — B1-10 `LBL` has none.
- [U] "Until a fixed date" (B1-07) vs stakeholder-confirmed term set Monthly · Quarterly · Yearly (U:DR BR-040); SA smaller-scope term select cannot express "until a date" (B1-11).
- [U] T-01 / R01: requester identity and return path to the status page (e-mail link OPEN).
- [U] T-05 / R06: payment provider and who confirms payment.
- [U] OD-B3-09 / T-07 / T-08: what activation of a renewal or more-licences request does to the plan (same ACC extended / licence figure increased vs a new plan).
- [U] "Your institution already has this" / "Request additional licences" on public pages need a recognised institution (T-01; stakeholder 07.2-A).

**Status → labels**
| Canonical | Requester (B1-08) | Super Admin (B1-10 `LBL`) | Institute Admin (B3-08) | entities.json |
|---|---|---|---|---|
| under-review (review not started) | Submitted | Under review | Under review | — (missing) |
| under-review | Under review | Under review | Under review | Under review |
| information-requested | Information requested | Information requested | Information requested | Information requested |
| approved-payment-required | Approved — payment required ("Approved with changes" same chip) | Approved — payment required | Approved — payment required | Approved — payment required |
| payment-not-confirmed | Payment not confirmed | Payment not confirmed | — | Payment not confirmed |
| payment-failed | Payment failed | **not drawn [U]** | — | — (missing) |
| access-active | Access active | Access active | Access active | Access active |

**Transitions**
| From | To | Command | Actor |
|---|---|---|---|
| — | under-review | `submitPublicRequest` | public visitor (institution contact) |
| — | under-review | `submitRenewalRequest` / `submitAdditionalLicencesRequest` | Institute Admin |
| under-review | under-review (+ reviewStartedAt) | review started — **[U]** trigger | Super Admin (implicit) |
| under-review | information-requested | `requestMoreInformation` (reason) | Super Admin |
| under-review | approved-payment-required | `approveRequest` / `approveSmallerScope`, route external | Super Admin |
| under-review | access-active | `approveRequest` / `approveSmallerScope`, route internal (approval + activation together) | Super Admin |
| approved-payment-required · payment-failed | payment-not-confirmed | `startPayment` ("Continue to payment" / "Try payment again"; IA: "Open the payment page", B3-08) | requester (public, status token) · Institute Admin (own institution's request) |
| payment-not-confirmed | access-active | payment confirmed | system:payment-provider |
| payment-not-confirmed | payment-failed | payment failed | system:payment-provider |
| information-requested | — | reply / decide — **not designed** (T-03) | — |
| (any) | declined | **not designed** (T-02) | — |

---

### M04 Selection (SEL)
Boards: B1-04, B1-05, B1-06, every public header.

```ts
/** Lives in the visitor's browser session until the request is sent; needs no account (B1-06 'Persistence'). */
export interface Selection {
  readonly items: readonly SelectionItem[];
  readonly lastRemoved: SelectionItem | null;      // undo
}
export interface SelectionItem {
  readonly experimentId: ExperimentId;
  readonly formats: readonly Technology[];         // ≥ 1, subset of the experiment's published formats
  readonly addedAt: IsoInstant;
}
```
**CONFIRMED**
- [C] Item = experiment + chosen published formats; "Choose at least one format to add." (PU-06); last format locked "At least one format stays chosen. To take this experiment out, use Remove." (PU-07); only published formats (B1-05, B1-06).
- [C] Summary "Experiments 1 / Formats chosen WEB, VR"; bar "2 experiments · 3 formats"; format list = union in order WEB, AR, VR, MR (B1-06 `fmtList`).
- [C] Header count "Selection 1"; aria "Selection, empty" / "Selection, 1 experiment" / "Selection, N experiments" (B1-01/05/06).
- [C] Remove / undo (B1-06); emptied when the request is sent (B1-07 'Sent').
- [C] Never "cart, basket, checkout, buy"; no prices; never an entitlement (U:DR BR-030; flows.json A1).

**PROPOSED**
- [P] `addedAt` — stable list order; `lastRemoved` — single-level undo as drawn.
- [P] Stored in `sessionStorage` behind a port with try/catch and a memory fallback (session-scoped by design; nothing reaches other viewers).

**UNRESOLVED**
- [U] What happens to a selected format that is no longer published when the request is sent (not drawn; mock re-validates and refuses with a field error).

**Status → labels**: no status; header count words "Selection, empty" / "Selection, 1 experiment" / "Selection, N experiments" (public only). Not in entities.json (§7 D-01).

**Transitions**: `— → in selection` (`add`), `formats changed` (`setFormats`), `removed` (`remove`, `undoRemove`), `emptied` (request sent) — all by the public visitor in their own session.

---

### M05 Access plan (ACC)
Boards: B2-02, B2-03, B2-05, B7-03, B7-09, B1-08 (PU-13), B1-11 'Existing access'.

```ts
export type AccessPlanTerm = 'monthly' | 'quarterly' | 'yearly' | 'until-date';
export type AccessPlanStatus = 'access-active' | 'ending-soon' | 'paused' | 'access-ended';   // derived

export interface AccessPlan extends RecordMeta {
  readonly id: AccessPlanId;                    // ACC-0107 — exists only after activation
  readonly institutionId: InstitutionId;
  readonly sourceRequestId: RequestId;          // 'From request REQ-0042'
  readonly items: readonly AccessPlanItem[];    // experiments × formats in this plan
  readonly licences: Provided<number>;          // '120 — as approved by BITS'; never consumed or derived (T-06, D7)
  readonly term: AccessPlanTerm;
  readonly startsOn: CalendarDate;              // 8 Oct 2026
  readonly endsOn: CalendarDate;                // 7 Oct 2027
  readonly activatedAt: IsoInstant;             // 'Active since 8 Oct 2026, 15:05'
  readonly history: readonly HistoryEntry<AccessPlanEvent>[];
}
export interface AccessPlanItem { readonly experimentId: ExperimentId; readonly formats: readonly Technology[] }
export type AccessPlanEvent = 'activated' | 'paused' | 'restored' | 'ending-soon' | 'ended' | 'renewal-requested' | 'renewed';

export declare function accessPlanStatus(p: AccessPlan, inst: Institution, now: IsoInstant): AccessPlanStatus;
/** 'Published, not in your plan' (IA-02/03): published formats of a plan experiment minus the plan's formats. */
export declare function publishedNotInPlan(p: AccessPlan, experiments: readonly Experiment[]): readonly AccessPlanItem[];
```
**CONFIRMED**
- [C] `id` "ACC-0107" (B2-03 h1; IA-01 status line); exists only after activation (B1-08 'Access active (PU-13)').
- [C] Created by activation: "Internal: when you approve. External: only after the payment is confirmed. Activation creates the access plan." (B1-11). History "Access activated · 8 Oct 2026, 15:05 · Payment confirmed for REQ-0042. Plan ACC-0107 created." (B2-03).
- [C] `items` — "Experiments in this plan": "Shell-and-Tube Heat Exchanger · WEB, VR"; courses derived ("ME ZG523 · Thermodynamics & Heat Transfer") (B2-03).
- [C] `licences` shown as provided — "Licences 120 — as approved by BITS"; no in-use / used / free figure (B2-03, B2-02; T-06).
- [C] `term` + dates — "Yearly · 8 Oct 2026 to 7 Oct 2027" (B2-03; SA-07 table B7-03).
- [C] Ending soon — "15 days left" (B2-01 f3); access-ending rows "31 Oct 2026 · 8 days left" / "Ended 8 days ago" (B7-09 f4).
- [C] Read-only for IA and SA: "No amend control (T-08)"; "A plan can’t be amended here; changes come through a new request (T-08)." (B2-03, B7-03).
- [C] Published formats not in the plan are listed "AR is published but not in your plan" (dashed chip) and cannot be given (B2-02, B2-03, B2-05 'Not in your access plan').

**PROPOSED**
- [P] `licences` typed `Provided<number>` so no code can compute remaining/used places (Slice-1 `places.ts` arithmetic must not return — U:RB slice1).
- [P] Status derived from dates + institution pause (one stored fact each).
- [P] `history` event kinds for B2-03 History and B7-09 access ending.

**UNRESOLVED**
- [U] D7 / T-06: licence counting rule — not modelled at all (§6).
- [U] OD-B3-09: renewal / more-licences activation effect on this record (same id extended, licence figure changed, or a new plan).
- [U] Plan term "until-date" exists on the request side (B1-07) and in sample REQ-0039 ("Until 30 Jun 2027", B1-08) but SA cannot approve a changed term as a date (B1-11).
- [U] Licence "N of M" figure (Batch-0 specimens 04/09a only) — not on any product board.

**Status → labels**
| Canonical | IA-02/03 band | IA-01 status line | SA-07 table chip | Student | entities.json |
|---|---|---|---|---|---|
| access-active | Active | Access active | Access active | — | Access active |
| ending-soon | Ending soon | Ending soon | Ending soon | — | Ending soon |
| paused | Paused | Access paused | Access paused (institution word) | "paused" banner | Paused |
| access-ended | Ended | Access ended | Access ended | "Access ended on 7 Oct 2027" | Access ended |

**Transitions**
| From | To | Command | Actor |
|---|---|---|---|
| — | access-active | activation (internal approval / external payment confirmed) | Super Admin (internal) · system:payment-provider (external) |
| access-active | ending-soon → access-ended | term clock | system:term-clock |
| access-active · ending-soon | paused → previous | institution Pause / Restore | Super Admin |
| (any) | amended | **not designed** (T-08) | — |
| (any) | renewed / licences increased / new plan | activation of a renewal or more-licences request — **[U] policy-open OD-B3-09**: the mock writes **no** ACC change (no new ACC, no licence or end-date change) until the owner decides. External: nothing happens before payment is confirmed ("Nothing changes until the payment is confirmed.", B3-08). Internal: the request becomes Access active on approval; the plan effect stays open (B1-11's generic internal confirm text "…activated now and the access plan is created" does not say whether a renewal creates a new plan). | system:payment-provider (external) · Super Admin (internal) |

---

### M06 Engineering area (AREA)
Boards: B1-01, B1-02 (explorer, unregistered — §7), B1-03, B7-07, B2-12 About.

```ts
export interface EngineeringArea extends RecordMeta {
  readonly id: AreaId;
  readonly name: string;                 // unique among areas: 'Mechanical & Manufacturing'
  readonly description: string | null;   // 'Heat transfer, thermodynamics and manufacturing processes.'
  readonly artworkKey: string | null;    // concept artwork from the asset set; fallback initials when absent
  readonly history: readonly HistoryEntry<StructureEvent>[];
}
export type StructureEvent = 'area-added' | 'course-added' | 'renamed' | 'description-changed' | 'course-moved' | 'platform-code-set';
```
**CONFIRMED**
- [C] Name, description, course and experiment counts, artwork with initials fallback (B1-01 A3 data; B1-03).
- [C] Add area: "Enter the area name" / "There is already an area called <name>"; description optional (B7-07 `doAddArea`).
- [C] Rename: "Enter a name" / "Enter a different name — this is the current one" / "There is already … an area called <name>"; renaming warns where the name shows (B7-07 f6; U:DR BR-018).
- [C] No retire, no artwork upload: "Areas have no artwork set here, and can’t be retired (D3)." (B7-07).
- [C] Engineering area is a catalogue grouping of courses; label swappable (BC-2; T-35; ND-02). No Module, no Programme level.

**PROPOSED**
- [P] `id`; `artworkKey` (assets.json concept art; "concept artwork, not a simulation capture" — BC-12); `history`.
- [P] Public counts are derived from **published** experiments only.

**UNRESOLVED**
- [U] Whether a new, empty area shows in the public explorer (OD-B7-13; U:DR BR-023).
- [U] Explorer "Test area 4…9 — placeholder" frames are fixtures, never product data (B1-00).

**Status → labels**: none — entities.json AREA/CRS statuses "—"; no retire state exists (D3).

**Transitions**: `— → exists` (`addArea`), `renamed` (`rename`), `description changed` (`editDescription`) — Super Admin only. Retire: not designed (D3).

---

### M07 Course (CRS) + platform course code
Boards: B1-03, B1-04, B6-10 (CM-09), B7-07 (SA-14/15), B5-03, B2-11, B4-02.

```ts
export type PlatformCourseCode = Brand<string, 'PlatformCourseCode'>;   // 'ME ZG523' (contains a space)

export interface Course extends RecordMeta {
  readonly id: CourseId;
  readonly areaId: AreaId;
  readonly name: string;                         // unique among courses: 'Thermodynamics & Heat Transfer'
  readonly description: string | null;           // 'Laboratory experiments covering conduction…'
  readonly platformCode: PlatformCourseCode | null;   // blank allowed (T-17); single writer: Content Manager (M-2)
  readonly history: readonly HistoryEntry<StructureEvent>[];
}
/** 'What uses this course' (SA-15) — derived, listed before a move. */
export interface CourseUsage {
  readonly institutionsWithAccess: readonly { institutionId: InstitutionId; institutionCode: string | null }[];
  readonly vendorsInScope: readonly RoleHolderId[];
  readonly facultyMapped: readonly FacultyCourseMappingId[];
  readonly studentsFiled: number;
  readonly publishedExperiments: number;
}
```
**CONFIRMED**
- [C] Add course: name — "Enter the course name" / "There is already a course called <name>"; area radio — "Choose the engineering area it belongs to"; description optional; "The platform course code is added by the Content Manager in Course codes." (B7-07 f7–8).
- [C] Move course: "Choose the area to move it to"; blocked while students or Faculty are filed against it; published experiments, institutions' access and Vendor course lists move with it and are listed first (B7-07 f3–4; OD-B7-12).
- [C] Platform code single writer = Content Manager: "Single writer (M-2) — Only the Content Manager edits platform course codes." (B6-10); SA sees it read-only "Read-only · maintained by the Content Manager" (B7-07).
- [C] Platform code rule: unique among non-blank codes, compared **trimmed and case-insensitively** (B6-10 script `o.save`: `T(r.code).toUpperCase()`, `T` = trim); "{code} is already the code for {course}. Each course needs its own code."; blank allowed — "No code yet — the catalogue shows the course …" (B6-10).
- [U] Whether **internal** spaces are also ignored ("ME ZG523" vs "MEZG523"): the B6-10 'Rules' annotation says "Each code unique (case and spaces ignored)." but the drawn script does not strip internal spaces — board-internal defect §7 D-25; owner §8-29. The contract compares trimmed + case-insensitive only and does not choose silently.
- [C] Public pages show the platform code chip, omitted when blank (B1-03 'Course without a platform code'; T-17).
- [C] Vendor course list "ME ZG523 · Thermodynamics & Heat Transfer" — only assigned courses (B5-03).

**PROPOSED**
- [P] `id: CourseId` — routes and foreign keys must not use the code (blank allowed, contains a space; U:HC routeIssues PU-05/SA-15).
- [P] `CourseUsage` read model for SA-15 'What uses this course'.

**UNRESOLVED**
- [U] Stakeholder 07.2-E ("Content Manager primarily. Super Admin will also get access to it.") vs M-2 single writer — build per v46, keep the writer set as policy data (U:DR conflicts).
- [U] Changing a platform code of a course with published experiments: effects on links or institution codes not designed (OD-B6-13; U:DR BR-118).
- [U] "Students filed against a course" — modelled as `StudentCourseFiling` from the CSV import (M12); the single Add-student form does not ask course (OD-B2-04).

**Status → labels**: none for the course (entities.json "—"). Platform code display: code chip, or "No platform code yet" (SA-14/15) / "No code yet — the catalogue shows the course …" (CM-09); Super Admin sees "Read-only · maintained by the Content Manager".

**Transitions**: `— → exists` (`addCourse`), rename / description (`rename`, `editDescription`), `area A → area B` (`moveCourse`, blocked by filings) — Super Admin. `platform code set / changed / cleared` (`savePlatformCourseCodes`) — Content Manager. Retire — not designed.

---

### M08 Institution course code (CCODE)
Boards: B2-02 f2, B2-03 f6–10 (IA-16), B2-10/B2-11 (Student display), B2-07 (CSV `course_code`).

```ts
export interface InstitutionCourseCode extends RecordMeta {
  readonly institutionId: InstitutionId;
  readonly courseId: CourseId;
  readonly code: string | null;        // 'MEC-523' — no format rule
  readonly semester: string | null;    // 'Sem II' — optional; needs a code
  readonly setAt: IsoInstant;
  readonly setBy: ActorRef;            // Institute Admin
}
export type InstitutionCodeStatus = 'missing' | 'added';   // derived
```
**CONFIRMED**
- [C] "BITS course code ME ZG523 (set by BITS, read-only)" beside "Your course code" (placeholder "For example MEC-523") and "Semester (optional)" (placeholder "For example Sem II") (B2-03 f6).
- [C] Only rule: "Add your course code, or clear the semester" (semester needs a code) (B2-03 f8; U:DR BR-021).
- [C] Status "Missing / Added"; IA-02 tag "Your institution’s code: not added" (B2-02 f2).
- [C] Read-only while paused (B2-03 f9).
- [C] Students see the institution code once added ("With the institution’s course code (MEC-523)", B2-10/B2-11).

**PROPOSED**
- [P] Keyed by (institutionId, courseId); `setAt/By` for history.

**UNRESOLVED**
- [U] T-17: which code each audience sees (Students: institution code, else BITS code; public: platform code; Faculty board shows the platform code) — PROVISIONAL (U:DR BR-022).
- [U] Uniqueness of institution codes within an institution — not drawn.

**Status → labels** (IA only, derived): missing → "Missing" / "Your institution’s code: not added"; added → "Added" (B2-03 `stateText`, B2-02 f2). Not in entities.json (§7 D-01).

**Transitions**: `missing ⇄ added` · `setInstitutionCourseCode` / clear · Institute Admin · not while paused.

---

### M09 Experiment (EXP), versions, format delivery, learning outcomes (LO), resources (RES)
Boards: B1-04, B1-05, B2-12, B3-01, B4-03, B6-07, B6-08 (CM-05), B6-12, B7-05, B7-06 (SA-13), B7-11. entities.json EXP.

```ts
export interface Experiment extends RecordMeta {
  readonly id: ExperimentId;
  readonly courseId: CourseId;
  readonly originSubmissionId: SubmissionId | null;   // SUB-0077 → EXP; null for catalogue items published before the sample period
  readonly vendorOrganisation: string;                // 'Northline Simulation Studio'
  readonly live: ExperimentVersion;                   // every surface reads only the live version (B7-11)
  readonly versions: readonly ExperimentVersion[];    // history keeps every version and decision
  readonly learningOutcomes: readonly LearningOutcome[]; // one Experiment-level set, all formats (LD-3)
  readonly resources: readonly LearningResource[];
  readonly publishedAt: IsoInstant;                   // '28 Aug 2026 · 10:05'
  readonly publishedBy: ActorRef;                     // 'Kavya Nair' (Content Manager)
  readonly openUpdateId: UpdateId | null;             // at most one open correction (B6-08)
}
export interface ExperimentVersion {
  readonly label: string;                             // '1.0' first publication; '1.2', '1.3' after releases
  readonly liveFrom: IsoInstant;
  readonly liveUntil: IsoInstant | null;
  readonly source:
    | { readonly kind: 'first-publication'; readonly submissionId: SubmissionId | null; readonly revision: number | null }
    | { readonly kind: 'correction-release'; readonly updateId: UpdateId };
  readonly catalogue: CatalogueDetails;
  readonly formats: readonly PublishedFormat[];       // only formats that passed governance (LD-2), display order WEB·AR·VR·MR
  readonly preview: PreviewLink | null;
  readonly documents: readonly DocumentRef[];
}
export interface CatalogueDetails { readonly name: string; readonly summary: string; readonly description: string }
export interface PublishedFormat { readonly format: Technology; readonly delivery: FormatDelivery }
export type FormatDelivery =
  | { readonly format: 'web'; readonly webLink: string; readonly browserAndComputer: string; readonly notes: string | null }
  | { readonly format: 'ar' | 'vr' | 'mr'; readonly packageLabel: string; readonly packageReference: string | null;
      readonly packageFileName: string | null; readonly deviceNeeded: string; readonly installNotes: string; readonly notes: string | null };
export interface PreviewLink { readonly label: string | null; readonly link: string }
export interface DocumentRef { readonly fileName: string }   // sample file names only — nothing is uploaded (OD-B5-11)

export interface LearningOutcome { readonly id: LearningOutcomeId; readonly text: string }   // ordered list

export interface LearningResource {
  readonly id: ResourceId;
  readonly title: string;      // 'Lab brief — Shell-and-Tube Heat Exchanger'
  readonly kind: string;       // 'PDF document' · 'Web page' · 'Spreadsheet' (sample, OD-B3-06)
  readonly sizeLabel: string;  // '6 pages' · 'About 10 minutes' · '1 sheet'
  readonly href: string;       // opens in a new tab (T-15)
}
```
**CONFIRMED**
- [C] Public card/page: title, course line, summary, "Available in" published formats (never an entitlement), preview link or poster "Illustration · no preview for this experiment yet", "Formats and device needs" table (B1-04, B1-05). Example "Shell-and-Tube Heat Exchanger · ME ZG523 · Thermodynamics & Heat Transfer".
- [C] Only published experiments exist publicly; unpublished or unknown → not found (B1-04 'One record per experiment'; B1-05; B6-12 f5–6 "Before publication the page does not exist for the public.").
- [C] Live line "Live now: version 1.2 · since 3 Jul 2026" (B7-05); history "Version 1.2 released · 3 Jul 2026 · ‘Correction UPD-0002 — released by the Super Admin.’" / "Published · version 1.0 · 2 Jun 2026 · ‘First publication’" (CM-05, B6-08).
- [C] First live label = the Vendor's `version` field ("Live version 1.0 · since 28 Aug 2026" for SUB-0077, B7-06 SA-13).
- [C] Delivery (CM-05 B6-08 'Delivery'): WEB web link + browser; VR package label · package reference · device needed · install notes ("Distillation Column — VR build 1.2", "MVL-DC-VR-1.2").
- [C] Student hub: description, "What you need (per format)" "WEB — laptop or desktop with a current web browser · VR — supported VR headset", Engineering area, learning outcomes "The same for every format." (B2-12).
- [C] Learning outcomes: one ordered set per experiment, written by the Academic Reviewer, read-only to Vendor, Faculty, Student, public (LD-3; B1-05, B2-12, B4-03, B5-05/06).
- [C] Resources: title, kind, size label; "Opened 12 Oct 2026, 09:40 · Not opened yet · Opened in a new tab just now"; opening marks "Opened" and nothing else (B3-01; T-13).
- [C] Published content is read-only for the Super Admin, the Vendor and in CM live view (B7-06; B5-06; B6-08 'Live · read-only').
- [C] Publishing and releasing give no one access (BC-9; B6-07 "It gives no one access."; B7-05 "Release grants or changes no institution’s access").

**PROPOSED**
- [P] `id` slug, `courseId`, `originSubmissionId` — the SUB → EXP link must be explicit (U:HC routeIssues VE-04…FA-05); SA-13 references published items by SUB id ("DC Motor Speed Control · SUB-0085 · … Published experiment").
- [P] `versions[]` with `liveFrom/liveUntil` and `source` — "History keeps every version and decision" (B7-11; flows.json F4).
- [P] `openUpdateId` — enforces "Never a second, conflicting update" (B6-08, B6-11 #10).
- [P] `resources` on the experiment record (no author drawn).

**UNRESOLVED**
- [U] OD-B7-05: whether the version label is public (B7-11 reference frames show "Version 1.2 / 1.3").
- [U] Who authors / maintains learning resources — not shown on any board (U:FP warnings).
- [U] OD-B3-06 / T-15: resource types, delivery and size labels.
- [U] OD-B5-02 / T-14: app-package model (fields provisional; delivery mechanism open). AR phone-app delivery (T-14, OD-B3-13).
- [U] T-26 residual: format hold-back / adding a format after publication — not modelled (no partial publish).
- [U] OD-B5-11: documents — types, sizes, catalogue use.
- [U] OD-B5-09: two "Composite Wall" records stay separate (BC-11) — no merge, no duplicate rule.

**Status → labels**: canonical `published` only (an unpublished experiment is a Submission). entities.json "Published · version n" — consistent. Student/Faculty never see a status chip for EXP.

**Transitions**
| From | To | Command | Actor |
|---|---|---|---|
| (SUB with-content-manager) | published, version = SUB version label | `publish` | Content Manager |
| live version n | live version n+1 (label from the update) | `releaseUpdate` | Super Admin |
| live | live (unchanged) | `holdUpdate` | Super Admin |
| (any) | unpublished / retired | **not designed** | — |

---

### M10 Submission (SUB) + review and publication decisions
Boards: B5-01…B5-08, B6-01…B6-03, B6-06, B6-07, B6-11, B6-12, B7-06, B7-10. entities.json SUB; flows.json E1–E5.

```ts
export type EditorStep = 'course' | 'formats' | 'preview' | 'submit';     // VE-03…VE-06 (4 steps)

export type SubmissionStatus =
  | { readonly state: 'draft' }                                           // only the Vendor sees it
  | { readonly state: 'with-academic-reviewer'; readonly since: IsoInstant;
      readonly reason: 'first-review' | 'resubmission' | 'recheck' }      // recheck = Content Manager sent it back
  | { readonly state: 'returned'; readonly since: IsoInstant;
      readonly by: 'academic-reviewer' | 'content-manager' | 'super-admin-override' }
  | { readonly state: 'resubmitted'; readonly since: IsoInstant }        // Vendor sees 'Submitted' until routed (M-3)
  | { readonly state: 'with-content-manager'; readonly since: IsoInstant }
  | { readonly state: 'published'; readonly at: IsoInstant; readonly experimentId: ExperimentId };

export interface Submission extends RecordMeta {
  readonly id: SubmissionId;                    // given on first save (OD-B5-07); an unsaved new experiment has no id
  readonly vendorHolderId: RoleHolderId;        // creator — 'Every experiment you created' (B5-02)
  readonly vendorOrganisation: string;          // 'Northline Simulation Studio'
  readonly status: SubmissionStatus;
  readonly revision: number;                    // starts at 1; +1 on each resubmit
  readonly content: SubmissionContent;          // the four-step editor
  readonly learningOutcomes: readonly LearningOutcome[];   // committed set; travels with the reviewer's decision (OD-B6-04)
  readonly lastStepReached: EditorStep;         // 'opens at step 2, where Anil stopped' (B5-07)
  readonly reviewDecisions: readonly AcademicReviewDecision[];
  readonly contentManagerDecisions: readonly ContentManagerDecision[];
  readonly overrides: readonly StatusOverride[];
  readonly firstSubmittedAt: IsoInstant | null;
  readonly lastResubmittedAt: IsoInstant | null;
  readonly history: readonly HistoryEntry<SubmissionEvent>[];
}
export interface SubmissionContent {
  readonly courseId: CourseId | null;
  readonly name: string;                        // the only field a draft save needs
  readonly summary: string | null;
  readonly description: string | null;
  readonly version: string | null;              // '1.0'
  readonly formats: readonly Technology[];
  readonly delivery: Readonly<Partial<Record<Technology, FormatDeliveryDraft>>>;
  readonly preview: { readonly label: string | null; readonly link: string | null };
  readonly documents: readonly DocumentRef[];
}
/** Same fields as FormatDelivery with every value optional while drafting. */
export type FormatDeliveryDraft =
  | { readonly format: 'web'; readonly webLink: string | null; readonly browserAndComputer: string | null; readonly notes: string | null }
  | { readonly format: 'ar' | 'vr' | 'mr'; readonly packageLabel: string | null; readonly packageReference: string | null;
      readonly packageFileName: string | null; readonly deviceNeeded: string | null; readonly installNotes: string | null; readonly notes: string | null };

export interface ReturnReference {             // 'What it refers to' (step · format · field) — OD-B5-10
  readonly step: 'course-and-description' | 'formats-and-delivery' | 'preview-and-documents';
  readonly format: Technology | null;
  readonly field: 'summary' | 'description' | 'web-link' | 'browser-and-computer' | 'package'
                | 'device-need' | 'install-notes' | 'preview-link';
}
export interface AcademicReviewDecision {
  readonly revision: number;
  readonly decision: 'approve' | 'return-to-vendor';
  readonly reason: string | null;              // required for return
  readonly references: readonly ReturnReference[];
  readonly outcomesAtDecision: readonly LearningOutcome[];
  readonly wasRecheck: boolean;
  readonly decidedAt: IsoInstant;
  readonly decidedBy: ActorRef;
}
export type ContentManagerDecision =
  | { readonly kind: 'publish'; readonly at: IsoInstant; readonly by: ActorRef }
  | { readonly kind: 'send-back-to-reviewer'; readonly reason: string; readonly at: IsoInstant; readonly by: ActorRef }
  | { readonly kind: 'send-back-to-vendor'; readonly reason: string; readonly references: readonly ReturnReference[];
      readonly at: IsoInstant; readonly by: ActorRef };
export interface StatusOverride {               // SA 'Move status (override)' — stuck records only
  readonly from: 'with-academic-reviewer';
  readonly to: 'returned';
  readonly reason: string;
  readonly at: IsoInstant;
  readonly by: ActorRef;
}
export type SubmissionEvent =
  | 'draft-saved' | 'submitted' | 'returned-by-reviewer' | 'approved-by-reviewer' | 'resubmitted' | 'routed'
  | 'sent-back-for-recheck' | 'returned-by-content-manager' | 'published' | 'status-overridden';

/** Derived — never stored. */
export interface SubmissionGuards {
  readonly courseNoLongerAssigned: boolean;    // Vendor: 'Draft · read-only' (B5-06/B5-07; OD-B5-01)
  readonly stuck: boolean;                     // SA: 'Stuck — nobody can act' (no reviewer scope covers it)
  readonly publicationCheck: readonly PublicationCheckItem[];   // CM-03
  readonly submitChecklist: readonly SubmitChecklistItem[];     // VE-06
}
export interface PublicationCheckItem {
  readonly check: 'approved-by-reviewer' | 'learning-outcomes' | 'catalogue-details' | 'delivery-per-format';
  readonly ok: boolean;
  readonly fixHint: 'send-back-to-reviewer' | 'send-back-to-vendor' | null;
}
export interface SubmitChecklistItem {
  readonly section: 'course-and-description' | 'formats-and-delivery' | 'preview-and-documents';
  readonly missing: readonly string[];         // field names with links; preview & documents are optional
}
```
**CONFIRMED — Vendor editor (B5-03…B5-05)**
- [C] `courseId` required — "Choose a course"; "<code> is no longer one of your assigned courses. Choose one of your courses."; only assigned courses listed (B5-03). Example "ME ZG523 · Thermodynamics & Heat Transfer".
- [C] `name` required — "Enter the experiment name"; unique case-insensitively against the catalogue and the Vendor's own experiments (own current name excluded): "An experiment called “<name>” already exists. Choose a different name." (checked on Continue); a draft save needs only the name — "Enter a name to save a draft" (B5-03; OD-B5-04). Example "Conduction Through a Composite Wall".
- [C] `summary` required — "Enter a one-sentence summary" (one sentence is a hint only). `description` required — "Enter a description". `version` required — "Enter a version, for example 1.0" (B5-03; OD-B5-03 prototype set).
- [C] `formats` — "Choose at least one format"; labels "Browser (WEB)", "Augmented reality (AR)", "Virtual reality (VR)", "Mixed reality (MR)" (B5-04).
- [C] WEB delivery: web link — "Enter the web link for WEB" / "Enter a web link that starts with https://" (`^https://[^\s/.]+\.[^\s]+$`); browser and computer — "Say which browser and computer WEB needs"; notes optional (B5-04).
- [C] AR/VR/MR package: label — "Enter a package label for <XX>"; reference — "Enter a package reference for <XX>, or attach the package file" (file "Instead of, or as well as, a reference. No source code."); device — "Say which device <XX> needs"; install notes — "Add install notes for <XX>"; notes optional (B5-04; provisional T-14).
- [C] Preview: label without a valid link is an error — "Add a preview link for “<label>”, or remove the label"; link — "Enter a preview link that starts with https://"; a link without a label is allowed (B5-05; OD-B5-08). Documents optional, sample names only (B5-05; OD-B5-11).
- [C] Submit checklist lists missing items with links and sends nothing; DL-1 "This sends it to the Academic Reviewer. It does not publish anything."; read-only while under review (B5-05; U:DR BR-096).
- [C] Revision "revision 2"; return shows by whom, when, reason and "What it refers to" (step · format · field) above the editor (B5-06/B5-07; OD-B5-10). Resubmit DL-1 "Your changes are submitted for review. This does not publish anything." → Vendor sees "Submitted — your changes have been submitted for review." (B5-07; M-3).
- [C] Published record read-only; no "Propose an update", no "Add a format" (B5-06; VE-10…12, VE-14 not designed).

**CONFIRMED — Academic Reviewer (B6-02, B6-03, B6-11)**
- [C] Queue item: name · id · course · vendor · sub-line · type (New submission · Update · Re-check) · formats · waiting since; drafts never listed (B6-02).
- [C] Reviewer sees submission details, delivery details, preview label (link not shown), documents, "what changed" (field · was · now) and the previous return (B6-03).
- [C] Approve (DL-1) "Sends it to the Content Manager. Approving does not publish." — needs ≥ 1 outcome: "Add at least one learning outcome before you approve" (OD-B6-02).
- [C] Return to vendor (DL-2) reason required — "Add a reason so the vendor knows what to change"; references optional (14 options from `GX.refOpts`).
- [C] Learning-outcome editor: "Enter the outcome text" / "Enter the outcome text, or cancel"; edits in progress stay with the reviewer until the decision (OD-B6-04).
- [C] Decided items read-only (RV-06); no reject, partial approve, per-format decision, rubric or device test (B6-03 'Not designed').

**CONFIRMED — Content Manager (B6-06, B6-07, B6-11)**
- [C] Publication check (4 rows): Approved by the Academic Reviewer · Learning outcomes · Catalogue details (name, course, summary, description, version) · Delivery details for each format; fix texts "Send it back to the Academic Reviewer to add them." / "Send it back to the vendor." (B6-07 `checks[]`; OD-B6-03).
- [C] Publish (DL-1) "It appears in the public catalogue. It gives no one access." — not offered while a check fails ("Possible once nothing is missing.").
- [C] Send back (DL-2): "Choose who it goes back to" (Academic Reviewer — "For a re-check of the academic content" / Vendor — "to revise and resubmit"); reason "Add a reason so they know what to change"; references only for the Vendor (OD-B6-05).
- [C] Result "28 Aug 2026 · 10:05 · Kavya Nair" (B6-07 `pubWhen`).

**CONFIRMED — Super Admin (B7-06)**
- [C] All content read-only with workflow status, where line, who can act ("Nobody — no Academic Reviewer has EEE ZC341 in scope"), update tag.
- [C] Move status (override) DL-2 "Add a reason — it is kept in the history"; only for a stuck record with the Academic Reviewer; only target "back to the vendor"; never into or out of Published (B7-06 f5; OD-B7-09).

**PROPOSED**
- [P] Discriminated `SubmissionStatus` collapsing the Vendor engine's nine keys (`draft · with_rv · returned · submitted · with_cm · returned_cm · recheck · published · readonly`, U:vendor FE) into six states + reason/by; `readonly` becomes the derived guard `courseNoLongerAssigned`.
- [P] `reviewDecisions`, `contentManagerDecisions`, `overrides` — append-only logs that feed RV-05 "Reviewed by me", CM-03 summary lines and SA-13 history.
- [P] `lastStepReached` — persisted so a draft reopens where the Vendor stopped (inferred from B5-07 caption).
- [P] `SubmissionGuards` computed by the service so every role sees the same verdict.

**UNRESOLVED**
- [U] OD-B5-05 / M-3: the next gate after a resubmit, and whether a revision after a Content Manager return needs a fresh academic review — modelled as `resubmitted` + a test/seed-only routing port (§3.18) typed so it can **only** return the drawn default "normal chain → With Academic Reviewer · revision n — Routed by the approved workflow rule." (B5-08). A route that skips the Academic Reviewer (the prototype's removed fast-path, U:FP removedBehaviours) is **not** a contract variant; it is listed only as a possible owner answer (§8-15) because BC-7 fixes the first-publication chain.
- [U] OD-B5-06: may the Vendor change course or formats while revising — not restricted.
- [U] OD-B5-01: effect of a course scope withdrawal on a submission already with the reviewer or CM — not shown.
- [U] OD-B6-03: what blocks first publication beyond the four stated checks.
- [U] What the Vendor sees after a Super Admin override (banner, reason source) — not drawn on B5.
- [U] Vendor scope held by the person (B7-08 "Anil Shetty · scope ME ZG523") vs copy "Only the courses assigned to Northline Simulation Studio are listed." (B5-03) — person or organisation.
- [U] QP-26 / ND-13: SA return at the publication gate — not designed; not added.

**Status → labels**
| Canonical | Vendor (B5-02 filter, engine `stw`) | Academic Reviewer (B6-03 `rvChipWords`, RV-05 log) | Content Manager (B6-07 `cmChipWords`, B6-06 tabs) | Super Admin (B7-06) | entities.json |
|---|---|---|---|---|---|
| draft | Draft (or "Draft · read-only" when course withdrawn) | never listed | never listed | not listed | Draft |
| with-AR · first-review | With Academic Reviewer | Waiting · revision 1 | Still in academic review | With Academic Reviewer / Stuck — nobody can act | With Academic Reviewer |
| with-AR · resubmission | With Academic Reviewer | Resubmitted · revision 2 | Still in academic review | With Academic Reviewer / Stuck — nobody can act | With Academic Reviewer |
| with-AR · recheck | With Academic Reviewer ("Back with the Academic Reviewer for a re-check") | Back for a re-check | Back with the Academic Reviewer | With Academic Reviewer | — (missing) |
| returned · by AR | Returned ("Returned by the Academic Reviewer") | Returned to vendor (· revision 1) | With vendor | Returned to vendor | Returned |
| returned · by CM | Returned ("Returned by the Content Manager") | — | With the vendor / "You sent it back" | Returned to vendor | — (missing) |
| returned · by override | Returned (banner not drawn [U]) | — | — | Returned to vendor | — |
| resubmitted | Submitted ("With" column "—") | not drawn | not drawn | not drawn | — (missing) |
| with-content-manager | With Content Manager ("Approved by the Academic Reviewer on 14 Aug 2026.") | Approved — with the Content Manager | Ready to publish / Ready to publish · 1 to resolve; CM-02 row chip "Ready" or "1 to resolve: learning outcomes" (live check: "<n> thing(s) to resolve") (B6-06 f2, script `blockWords`; library tag "Approved <date> · 1 to resolve") | With Content Manager | With Content Manager |
| published | Published (read-only) | Approved — published / Approved — later sent back for a re-check (history) | Published | Published | Published |

**Transitions**
| From | To | Command | Actor (scope) |
|---|---|---|---|
| (unsaved) | draft (id assigned) | `saveDraft` (first save) | Vendor (assigned course) |
| draft | draft | `saveDraft` | Vendor (course still assigned) |
| draft · (unsaved) | with-AR · first-review, revision 1 | `submitForReview` (DL-1, checklist complete) | Vendor |
| with-AR (any reason) | with-content-manager | `approveSubmission` (DL-1, ≥ 1 outcome) | Academic Reviewer (in scope) |
| with-AR (any reason) | returned · by AR | `returnSubmission` (DL-2 reason, refs optional) | Academic Reviewer (in scope) |
| returned | returned | `saveRevision` ("Save changes keeps them without resubmitting") | Vendor |
| returned | resubmitted, revision + 1 | `resubmit` (DL-1) | Vendor |
| resubmitted | with-AR · resubmission | `routeResubmission` | system:workflow-routing (OD-B5-05) |
| with-content-manager | published (EXP created) | `publish` (DL-1, all checks ok) | Content Manager |
| with-content-manager | with-AR · recheck | `sendBack` → reviewer (DL-2 reason) | Content Manager |
| with-content-manager | returned · by CM | `sendBack` → vendor (DL-2 reason, refs optional) | Content Manager |
| with-AR (stuck) | returned · by override | `overrideStatus` (DL-2 reason) | Super Admin |
| any | published | by Vendor, Reviewer or Super Admin — **never** | — |
| under review | withdrawn / recalled | **not designed** | — |

---

### M11 Correction (UPD)
Boards: B6-04 (RV-04), B6-08 (CM-05/06/07), B6-09 (CM-08), B6-11, B6-13, B7-05 (SA-10/11), B7-10, B7-11. entities.json UPD; flows.json F1–F4.

```ts
export type UpdateState =
  | 'draft' | 'in-academic-review' | 'returned' | 'awaiting-release-decision' | 'on-hold' | 'released' | 'withdrawn';

export interface CorrectionUpdate extends RecordMeta {
  readonly id: UpdateId;                           // UPD-0005
  readonly experimentId: ExperimentId;
  readonly baseVersionLabel: string;               // live version when started ('The live version 1.2 is unchanged.')
  readonly state: UpdateState;
  readonly entry: 'start-a-correction' | 'edit-catalogue-details' | 'edit-delivery-link';  // first entry used
  readonly proposed: CorrectionFields;             // pre-filled from the live version (M-1)
  readonly whatChangesAndWhy: string | null;       // required to send
  readonly versionLabel: string | null;            // required to send; must differ from live
  readonly startedAt: IsoInstant;
  readonly startedBy: ActorRef;                    // Content Manager
  readonly sentForReviewAt: IsoInstant | null;
  readonly reviewDecisions: readonly UpdateReviewDecision[];
  readonly hold: { readonly at: IsoInstant; readonly by: ActorRef; readonly reason: string } | null;
  readonly holdLifts: readonly { readonly at: IsoInstant; readonly by: ActorRef }[];
  readonly release: { readonly at: IsoInstant; readonly by: ActorRef } | null;
  readonly withdrawal: { readonly at: IsoInstant; readonly by: ActorRef; readonly reason: string } | null;
  readonly history: readonly HistoryEntry<UpdateEvent>[];
}
export interface CorrectionFields {
  readonly name: string;
  readonly summary: string;
  readonly description: string;
  readonly webLink: string | null;                                       // WEB only
  readonly packageReferences: Readonly<Partial<Record<'ar' | 'vr' | 'mr', string>>>;   // VR drawn; AR/MR [U]
}
export interface UpdateReviewDecision {
  readonly decision: 'approve' | 'return-to-content-manager';
  readonly reason: string | null;                  // required for return; no references (T-28)
  readonly at: IsoInstant;
  readonly by: ActorRef;
}
export type UpdateEvent =
  | 'started' | 'saved' | 'sent-for-academic-review' | 'approved-by-reviewer' | 'returned-by-reviewer'
  | 'put-on-hold' | 'hold-lifted' | 'released' | 'withdrawn';
/** Derived: 'Description · Live now … · Proposed …', 'n fields changed', 'Version 1.2 → 1.3' (CM-08, RV-04, SA-11). */
export interface CorrectionComparisonRow { readonly field: keyof CorrectionFields | 'version'; readonly liveNow: string | null; readonly proposed: string | null }
```
**CONFIRMED**
- [C] Three entries, one draft: "Start a correction", "Edit catalogue details", "Edit delivery link" open or join the one draft pre-filled with live fields; live unchanged until release; no "safe edit" (B6-08 'Three entries, one draft'; M-1; D-09-6).
- [C] Join only while Draft or Returned; otherwise only "Open update" (read-only); "Never a second, conflicting update." (B6-08; OD-B6-07; B6-11 #10).
- [C] `whatChangesAndWhy` — "Say what changes and why"; hint "The Academic Reviewer reads this first. The Super Admin sees it when deciding on the release." Example "Corrects the reflux statement in the description …" (B6-09).
- [C] `versionLabel` — "Enter the version label, for example 1.3"; equal to live → "Use a new version label — 1.2 is live"; no format rule (OD-B6-08).
- [C] At least one change — "Change at least one catalogue detail or delivery link" (summary link → Summary field) over name · summary · description · web link · VR package reference (B6-09 `validate`; OD-B6-09).
- [C] Proposed web link hint "Starts with https://" only — no URL-format error rule in the correction form (B6-09).
- [C] Withdraw (DL-2) — "Add a reason for withdrawing this update"; offered while Draft, Returned or In academic review (OD-B6-06).
- [C] Reviewer: Approve update (DL-1) "It goes to the Super Admin, who decides when to release it. Version 1.2 stays live until then."; Return to the Content Manager (DL-2) — "Add a reason so the Content Manager knows what to change" (B6-04).
- [C] Super Admin: Release (DL-1) "Version 1.3 replaces 1.2 for everyone — the public catalogue and every institution using it. History keeps 1.2 and every decision."; Hold — "Add a reason — the Content Manager sees it", "Version 1.2 stays live"; Lift hold (DL-1, no reason) returns to "Waiting for your decision"; no release straight from On hold; never "Publish"; never edits the correction (B7-05; OD-B7-01…03).
- [C] SA sees nothing before reviewer approval: "Nothing to decide yet — This update hasn’t been approved by the Academic Reviewer yet." (B7-05 f10).
- [C] SA-11 shows "institutions using it" (Institution · Access · Students · Note) (B7-05 `E.insts`).

**PROPOSED**
- [P] `baseVersionLabel` — makes "1.2 → 1.3" and "the live version below is unchanged" deterministic even if another release lands.
- [P] `entry` — records which control opened the draft (focus target; B6-08).
- [P] `packageReferences` keyed by format — generalises the drawn VR field; see [U].
- [P] `holdLifts[]` — "Hold lifted — waiting again" (B7-05 f7) needs history.

**UNRESOLVED**
- [U] OD-B6-09: whether a correction may change learning outcomes or formats; AR/MR package references are not drawn (sample has WEB + VR only).
- [U] OD-B7-04 / BR-114: whether a held update blocks later corrections — the drawn behaviour blocks (On hold counts as open, B6-08), the policy is open.
- [U] D-09-12: whether withdrawing needs anyone's agreement. D-09-9: technical-only skip — not designed (always CM → AR → SA).
- [U] Stakeholder 07.3 R16 (CM edits/replaces a link directly) vs M-1 (through the correction chain) — build per v46; flag that a broken link cannot be fixed without review + release.

**Status → labels**
| Canonical | Content Manager (B6-09 `UX.stw`) · "With" | Academic Reviewer (B6-04 script: chip `rvChipWords` / decision title `rDecTitle`; RV-05) | Super Admin (B7-05) | entities.json |
|---|---|---|---|---|
| draft | Draft · You | not in the queue ("Nothing to decide until it is sent"); if opened: chip "Not sent for review" · title "Not sent for review yet" | (not listed) | Draft |
| in-academic-review | In academic review · Academic Reviewer | Waiting for your decision | "Nothing to decide yet" | In academic review |
| returned | Returned · You | Returned to the Content Manager | — | Returned |
| awaiting-release-decision | Awaiting release decision · Super Admin | Approved — with the Super Admin / Approved — awaiting the Super Admin’s release decision; log "Update approved — with the Super Admin" | Waiting for your decision (tab "Waiting for you"); SA-12 tag "approved — waiting for your release decision" | Awaiting release decision |
| on-hold | On hold · Super Admin | chip "On hold" (B6-04 `D.stw`) | On hold | On hold |
| released | Released · — | chip "Released"; log "Update approved — released" | Released | Released |
| withdrawn | Withdrawn · — | chip "Withdrawn" (`D.stw`) · title "Withdrawn by the Content Manager" | — | Withdrawn |

**Transitions**
| From | To | Command | Actor |
|---|---|---|---|
| — (no open update) | draft | `openCorrection` (any of the three entries) | Content Manager |
| draft · returned | same | `saveCorrection` / join from another entry | Content Manager |
| draft · returned | in-academic-review | `sendForAcademicReview` (DL-1; reason + new label + ≥ 1 change) | Content Manager |
| draft · returned · in-academic-review | withdrawn | `withdrawUpdate` (DL-2 reason) | Content Manager |
| in-academic-review | awaiting-release-decision | `approveUpdate` (DL-1) | Academic Reviewer (in scope) |
| in-academic-review | returned | `returnUpdate` (DL-2 reason) | Academic Reviewer |
| awaiting-release-decision | released (EXP live version changes) | `releaseUpdate` (DL-1) | Super Admin |
| awaiting-release-decision | on-hold (live unchanged) | `holdUpdate` (reason the CM sees) | Super Admin |
| on-hold | awaiting-release-decision | `liftHold` (DL-1, no reason) | Super Admin |
| on-hold | released | **not offered** (OD-B7-03) | — |
| awaiting · on-hold · released | withdrawn / edited | **not offered** (OD-B6-06) | — |

---

### M12 Person (PER) — Student and Faculty
Boards: B2-06 (IA-06…09), B2-07 (IA-10/11), B7-03 f8 (SA override), B1-09 f7, B2-10 (Student inactive), B4-10. entities.json PER.

```ts
export type AccountStatus = 'active' | 'inactive';

interface PersonBase extends RecordMeta {
  readonly id: PersonId;
  readonly institutionId: InstitutionId;
  readonly fullName: string;                 // 'Rahul Verma'
  readonly institutionEmail: string;         // unique within People
  readonly accountStatus: AccountStatus;
  readonly added: { readonly at: IsoInstant; readonly by: ActorRef; readonly how: 'form' | 'import'; readonly importFileName: string | null };
  readonly history: readonly HistoryEntry<PersonEvent>[];
}
export interface StudentPerson extends PersonBase {
  readonly kind: 'student';
  readonly institutionStudentId: string;     // 'GIT-2026-0418' — unique per institution, compared upper-case
  readonly programme: string | null;         // free text on the record only — never a navigation level (BC-2)
  readonly courseFilings: readonly StudentCourseFiling[];
  readonly deactivation: { readonly at: IsoInstant; readonly by: ActorRef; readonly reason: string } | null;
}
export interface FacultyPerson extends PersonBase { readonly kind: 'faculty' }
export type Person = StudentPerson | FacultyPerson;

/** 'Students filed against a course' (B7-07 move rule); 'Course and group' on the record (B2-06 f8). */
export interface StudentCourseFiling {
  readonly courseId: CourseId;
  readonly codeAsGiven: string;              // CSV course_code: 'ME ZG523' or 'MEC-523'
  readonly filedAt: IsoInstant;
  readonly source: 'import';
}
export type PersonEvent =
  | 'added' | 'imported' | 'deactivated' | 'reactivated' | 'status-overridden'
  | 'group-joined' | 'group-left' | 'access-given' | 'access-withdrawn' | 'course-assigned' | 'course-removed';

/** IA-06 directory status — derived from grants and account status (B2-06 `LBL`). */
export type StudentDirectoryStatus = 'access-active' | 'no-access-yet' | 'inactive';
```
**CONFIRMED**
- [C] Add student (IA-10): Full name — "Enter the full name"; Institution e-mail — "Enter the institution e-mail" / "Enter a full e-mail address, like name@godavari.edu.in" / "This e-mail already belongs to someone in People"; Student ID — "Enter the student ID" / "GIT-2026-0418 is already used by Rahul Verma" (compared upper-case), hint "Your institution’s ID for this student, for example GIT-2026-0418."; Programme (optional); Group (optional: "No group / ME ZG523 — Sem II / Lab batch B") (B2-07).
- [C] Add faculty member: Full name + Institution e-mail (same rules, no Student ID) (B2-07 f3). No faculty CSV.
- [C] Student CSV (IA-11): exactly six columns `student_id, full_name, email, programme, course, course_code`, all required; "Programme is empty. Every row needs the student’s programme."; "Course code is empty. Every row needs the course code (ME ZG523 or MEC-523)."; "E-mail “fatima.begum@godavari” isn’t a full address."; "Student ID GIT-2026-0409 is also in row 3. Each student needs a different ID."; IDs/e-mails already in People are errors; "Choose a CSV file first"; report "13 rows checked · 9 ready to import · 4 rows with errors", type "Error — blocks import"; any error blocks the whole import (B2-07; T-24 interim).
- [C] Record: "Added 8 Oct 2026 · imported by Meera Iyer"; "Account active / Inactive"; "Inactive since 10 Oct 2026 · Meera Iyer: “On leave this semester.”"; history rows (B2-06).
- [C] Deactivate (DL-2): "Enter the reason for deactivating this account"; hint "Shown on the student record to your institution’s administrators." Reactivate (DL-1): "the experiments Rahul has been given open again." (B2-06 f9–13).
- [C] SA override with reason: "Add a reason — it is kept in the history"; "An override — kept in the history. The Institute Admin normally changes this." (B7-03 f8).
- [C] Inactive Student signs in and sees "Your account is inactive. Contact your institution administrator."; "Nothing can be opened while the account is inactive." (B1-09 f7; 08 XS-08).
- [C] Adding a person creates a record only — no invitation, activation or provisioning (T-11).
- [C] Programme exists only on the IA form/CSV/record — 0 occurrences on Student boards (U:student FE PER 'Programme').

**PROPOSED**
- [P] `PersonId` (no drawn id); `added.how` + `importFileName` ("Imported from godavari-me-zg523.csv", B2-06 history).
- [P] `courseFilings` from CSV `course` + `course_code` so the "Move course" block and "Students filed 12" (SA-15) are computable.
- [P] Discriminated `Person` (student vs faculty) — Faculty records have no Student ID and no Account section (B2-06 f14–16).

**UNRESOLVED**
- [U] OD-B2-04: should the single form ask for programme, course and course code like the CSV.
- [U] Stakeholder STK31-26 optional columns (Semester, Organisation, Plan Terms) vs the six drawn columns — do not surface undrawn columns (U:DR conflicts).
- [U] Faculty deactivate/reactivate — Faculty list shows "Inactive" but no control is drawn.
- [U] Edit or delete a person — not drawn (ND-04; prefer reversible).
- [U] Licence effect of deactivation (C-1 / D7) — never stated.
- [C] While the institution is paused every IA write is refused: "Pages are read-only until BITS lifts the pause." (B2-01 paused frame; caption "no actions while paused"; U:institute-admin PE 'INST / all IA records' explicit-rule). [U] How IA-06…IA-15 present it (which controls hide, any per-page wording) is not drawn — the contract refuses uniformly (`institution-paused`, §3.6) and the screens follow the drawn IA-04/IA-05/IA-16 pattern until the owner says otherwise.

**Status → labels**
| Canonical | IA record (B2-06) | IA directory (B2-06 `LBL`) | IA grant row: IA-04 (B2-04) · IA-07 "Experiments given" (B2-06) · IA-05 picker (B2-05) | SA-07 (B7-03) | Student (banner) | entities.json |
|---|---|---|---|---|---|---|
| active | Account active | Access active / No access yet (derived from grants) | (grant status) | Active | — | Active |
| inactive | Inactive (+ since/by/reason) | Inactive | IA-04 "Student inactive" · IA-07 "Can’t open — inactive" + "Sneha's account is inactive." (B2-06 f11) · IA-05 "Inactive — can’t be given access" | Inactive | "Your account is inactive …" | Inactive |

**Transitions**
| From | To | Command | Actor |
|---|---|---|---|
| — | active | `addStudent` / `importStudents` (commit) / `addFaculty` | Institute Admin |
| active | inactive | `deactivateStudent` (DL-2 reason) | Institute Admin · Super Admin override (reason) |
| inactive | active | `reactivateStudent` (DL-1) | Institute Admin · Super Admin override (reason) |
| (faculty) active ⇄ inactive | — | **not designed** | — |

---

### M13 Group (GRP) + membership
Boards: B2-08 (IA-13/14), B2-05 step 2, B2-04, B2-13 f6.

```ts
export interface Group extends RecordMeta {
  readonly id: GroupId;                        // GRP-0012
  readonly institutionId: InstitutionId;
  readonly name: string;                       // 'ME ZG523 — Sem II'
  readonly createdAt: IsoInstant;
  readonly createdBy: ActorRef;
  readonly memberships: readonly GroupMembership[];   // current and past (record stays when removed)
  readonly history: readonly HistoryEntry<GroupEvent>[];
}
export interface GroupMembership {
  readonly studentId: PersonId;
  readonly addedAt: IsoInstant;
  readonly addedBy: ActorRef;
  readonly removedAt: IsoInstant | null;
  readonly removedBy: ActorRef | null;
}
export type GroupEvent = 'created' | 'renamed' | 'member-added' | 'member-removed' | 'access-given';

/** IA-14 member words (B2-08 `stText`) — derived per member × group grant. */
export type GroupMemberStanding =
  | 'can-open-it' | 'has-it-individually' | 'waiting-for-a-licence' | 'inactive' | 'added-after-the-group-grant';
```
**CONFIRMED**
- [C] Create (DL-3): "Enter a name for the group" / "A group called “<name>” already exists" (case-insensitive); hint "For example a section or lab batch. You add students next." (B2-08 f0–1). Created with 0 members.
- [C] Rename (DL-3): "Enter a name for the group" (B2-08 f6).
- [C] Add members inline (inactive students offered with " · inactive"); remove member DL-1 — they leave the group, their record stays (B2-08 f5, f7, f9).
- [C] Member count "7 members"; experiments given to the group "Shell-and-Tube Heat Exchanger · WEB VR · 12 Oct 2026 · SACC-0311 · Active" (B2-08).
- [C] Member words: "Active / Can open it / Has it individually · SACC-0310 / Waiting for a licence / Inactive · Can’t open experiments while inactive / Added after the group grant" (B2-08).
- [C] Empty group can't be chosen for a grant — "Add members before giving access" (B2-05).

**PROPOSED**
- [P] Memberships kept with `removedAt` — needed for "Added after the group grant" and history.

**UNRESOLVED**
- [U] OD-B2-02: do students added after a group grant receive the experiment ("Added after the group grant", no promise).
- [U] What removing a member does to group-given access — not stated (B2-08).
- [U] Duplicate-name check on rename — not drawn (create only).
- [U] Delete a group — not drawn. Withdraw / change a group grant — not designed (B2-04 "Change on the group" → B2-08 has no control).

**Status → labels**: groups have no status; member standings are the derived words listed above (IA only). Not in entities.json (§7 D-01).

**Transitions**: `— → exists` (`createGroup`), `renamed` (`renameGroup`), membership `added` (`addMembers`) / `removed` (`removeMember`, DL-1) — Institute Admin, own institution.

---

### M14 Faculty course mapping (FMAP)
Boards: B2-09 (IA-15), B2-06 f14–15, B4-01, B4-02, B4-09 f6.

```ts
export interface FacultyCourseMapping extends RecordMeta {
  readonly id: FacultyCourseMappingId;     // FMAP-0021
  readonly institutionId: InstitutionId;
  readonly facultyId: PersonId;
  readonly courseId: CourseId;
  readonly assignedAt: IsoInstant;         // '9 Oct 2026 · Meera Iyer'
  readonly assignedBy: ActorRef;
  readonly removedAt: IsoInstant | null;
  readonly removedBy: ActorRef | null;
}
```
**CONFIRMED**
- [C] Assign: "Choose a faculty member" (active faculty only); "Choose a course" (courses in the institution's content access); "<name> already teaches <course>" (B2-09 f4).
- [C] Remove (DL-1) warns when written answers would have no marker: "1 written answer in ME ZG523 is waiting for marking, and no other faculty member teaches the course." (B2-09 f2).
- [C] Gives students nothing; sets the Faculty workspace scope (B2-09; B2-13 f7; B4-02 "From Faculty courses, set by your Institute Admin").
- [C] Faculty scope = assigned courses ∩ experiments the institution holds (U:DR BR-064); course with no Faculty → IA warned, written answers can't be marked (B4-09 f6).
- [C] Faculty course "Access ended on 7 Oct 2027 · earlier work and results kept" (B4-02).

**PROPOSED**
- [P] Soft removal (`removedAt`) — history kept, matches U:DR BR-126.

**UNRESOLVED**
- [U] OD-B4-17: co-teaching Faculty share the same assessment — allowed by the model, no sample drawn.

**Status → labels**: no chip; IA sees "Assigned 9 Oct 2026 · Meera Iyer · FMAP-0021" and "Courses taught: ME ZG523 / No courses yet" (B2-06 f14–15); Faculty sees the course in My courses ("From Faculty courses, set by your Institute Admin"). Not in entities.json (§7 D-01; board id FMAP vs brief FCM — D-22).

**Transitions**: `not teaching → teaches` (`assignFacultyCourse`), `teaches → not teaching` (`removeFacultyCourse`, DL-1 with warning) — Institute Admin. Faculty self-assignment: not designed.

---

### M15 Student access grant (SACC) + provided licence wait + open gate
Boards: B2-04 (IA-04), B2-05 (IA-05), B2-06, B2-08, B2-10…B2-13, B3-02/B3-03 (Arun), 08 (ST-19 family). entities.json SACC; flows.json B3–B4.

```ts
export type GrantTarget =
  | { readonly kind: 'student'; readonly studentId: PersonId }
  | { readonly kind: 'group'; readonly groupId: GroupId };

export type GrantState = 'active' | 'withdrawn';   // the only stored states

export interface StudentAccessGrant extends RecordMeta {
  readonly id: StudentAccessGrantId;       // SACC-0310 (Rahul, individual) · SACC-0311 (group)
  readonly institutionId: InstitutionId;
  readonly accessPlanId: AccessPlanId;     // formats are inherited from this plan's item — never stored here (LD-1)
  readonly experimentId: ExperimentId;     // the Student-access unit is the Experiment
  readonly target: GrantTarget;
  readonly givenAt: IsoInstant;            // '9 Oct 2026, 10:20'
  readonly givenBy: ActorRef;              // 'Meera Iyer'
  readonly state: GrantState;
  readonly withdrawal: { readonly at: IsoInstant; readonly by: ActorRef; readonly reason: string } | null;  // individual only
  readonly history: readonly HistoryEntry<'given' | 'withdrawn'>[];
}

/** 'Waiting for a licence' is drawn but its rule (D7) is undecided: the state is SUPPLIED, never computed. */
export interface ProvidedLicenceWait {
  readonly grantId: StudentAccessGrantId;
  readonly studentId: PersonId;
  readonly since: IsoInstant;
  readonly message: string;                // IA-07: 'No licence is available for Arun on ACC-0107 right now.' (B2-06);
                                           // Student: 'No licence is available for you on ACC-0107 right now.' (B3-02/B3-03)
}

/** Per student × grant display status — derived. Words differ by screen (table below): 'paused' is drawn only on
 *  the IA-03 plan page (B2-03 paused frame); IA-04 (B2-04 `LBL`) keeps the grant's own word under a read-only banner. */
export type GrantDisplayStatus =
  | 'active' | 'waiting-for-a-licence' | 'student-inactive' | 'withdrawn'
  | 'individual-grant-withdrawn' | 'access-ended' | 'paused';

/** Can the signed-in Student open this experiment × format now? Evaluated by the service on every read. */
export type OpenGate =
  | { readonly canOpen: true; readonly viaGrantIds: readonly StudentAccessGrantId[] }
  | { readonly canOpen: false; readonly reason: OpenRefusal };
export type OpenRefusal =
  | 'not-given'                  // ST-19 'This experiment isn’t available to you'
  | 'no-longer-given'            // 'You no longer have access to this experiment'
  | 'institution-paused'         // 'Your institution’s access is paused'
  | 'access-ended'               // 'Your institution’s access to this experiment has ended'
  | 'student-inactive'           // 'You can’t open experiments until your institution reactivates your account.'
  | 'waiting-for-a-licence'      // 'No licence is available for you on ACC-0107 right now.'
  | 'format-not-in-plan'         // 'Not included for your institution'
  | 'format-not-published'       // 'Not available for this experiment'
  | 'overlap-policy-open';       // OD-B2-01 — the outcome is not designed
// A format "Not available right now" (B2-12 'A format not available right now': VR temporarily unavailable; WEB still opens)
// is drawn with NO cause, record, writer or OD. It is NOT an OpenRefusal: the gate returns PolicyOpen
// { decision: 'not-designed:format-temporarily-unavailable' } and the seed may carry it only as a provided fact (§7 D-26).
```
**CONFIRMED**
- [C] Give students access is its own guided 3-step flow: course (single option drawn) → experiments — "Choose at least one experiment" (summary "Check this step") → who: students (multi-select) or one group — "Choose at least one student, or switch to a group" / "Choose a group"; already-has and inactive students can't be ticked ("Rahul can’t be ticked again; Sneha is inactive"); empty group disabled (B2-05 f1, f4, f9, f10).
- [C] No WEB/AR/VR/MR picker: formats shown read-only "Inherited from ACC-0107 — not chosen here"; column "Formats (from your plan)" (B2-05, B2-04; LD-1).
- [C] Published experiments of the course not in the plan are listed "Not in your access plan" and can't be ticked (B2-05 step 1).
- [C] Result names each grant: "Rahul Verma → Shell-and-Tube Heat Exchanger → SACC-0310 → Active" (or "Waiting for a licence" + note) (B2-05 result; B2-13 f0).
- [C] Refusal pages when paused, plan ended or nothing held (B2-05 f15–17).
- [C] Student access list: one row per student × experiment; "How given": "Individually · 9 Oct 2026 · SACC-0310" / "Group: ME ZG523 — Sem II · 12 Oct 2026 · SACC-0311"; "Also in ME ZG523 — Sem II, which has this experiment · SACC-0311" (B2-04).
- [C] Withdraw (DL-2) individual grants only — "Enter the reason for withdrawing access"; hint "Kept in the access history, which your institution’s administrators can see."; "Withdrawn 12 Oct 2026"; "Show withdrawn"; group grants are changed on the group; the dialog says nothing about licences (B2-04; U:DR BR-054).
- [C] Student sees only experiments given ("1 experiment given to you · WEB and VR available"); experiment held but not given never appears; address → ST-19 (B2-11; U:DR BR-028). Grant line "Given by your institution · SACC-0310" (B3-05).
- [C] Per-format words: "Available to you" · "Not included for your institution" · "Not available for this experiment" (B2-12, B3-02; U:DR BR-027).
- [U] A fourth Student word, "Not available right now" (B2-12 frame 'A format not available right now — VR temporarily unavailable; WEB still opens. Reason wording neutral.'), has no designed cause, record, writer or open decision (U:student inconsistencies/openQuestions). Modelled as availability `not-available-right-now` that only the seed can supply; the open gate returns `policy-open` for it and encodes no rule (§7 D-26, §8-30).

**PROPOSED**
- [P] Formats not stored on the grant — derived from `accessPlanId` item at read time (the board's history snapshot "WEB and VR from ACC-0107" is a history note, not a field).
- [P] `ProvidedLicenceWait` as a separate supplied record: the state is drawn (B2-05 f11 result template; B2-06 IA-07 "No licence is available for Arun on ACC-0107 right now."; B3-02/B3-03 Arun Kumar) but no counting rule exists (D7) — the mock seeds it and a `LicenceAvailabilityOracle` port (§3.18) decides nothing except what the sample world says.
- [P] `OpenGate` evaluated by the service; the grant (entitlement) is created only by the IA — publication, plan and runtime never create or remove one (BC-3, BC-9).

**UNRESOLVED**
- [U] OD-B2-01: individual + group grant for the same experiment — whether either still opens it after one is withdrawn. Drawn safe treatment: each grant has its own state; no "can / can’t open" statement. The gate returns `overlap-policy-open` for that case; seed avoids it on Student screens (U:DR sampleWorldNotes).
- [U] OD-B2-02: late group members.
- [U] OD-B2-03 / D7: licence effect of overlapping grants; licence counting overall (§6).
- [U] Group-grant withdrawal — not designed.
- [U] Withdrawing an inactive student's individual grant — script requires active or waiting (B2-04 `canWithdraw`); no sample.
- [U] flows.json B3 calls it an "Experiment × format grant" — contradicts B2-05 (no format picker) — handoff defect (§7).

**Status → labels** (Institute Admin words differ by screen — the same grant reads differently on IA-03, IA-04, IA-05 and IA-07; reported as §7 D-24)
| Canonical / derived | IA-04 Student access (B2-04 `LBL`) | IA-03 plan page (B2-03) | IA-07 student record "Experiments given" (B2-06) | IA-05 picker (B2-05) | Group member (B2-08) | Student | entities.json |
|---|---|---|---|---|---|---|---|
| (no grant) | — / directory "No access yet" | — | — | selectable | — | experiment absent; address → "This experiment isn’t available to you" | — (flows.json "No access yet") |
| active | Active | Active ("After SACC-0310" frame) | Active | "Already has Shell-and-Tube Heat Exchanger" (not selectable; caption "Rahul can't be ticked again") | Can open it | listed; formats "Available to you" | Active |
| active + provided wait | Waiting for a licence (+ reason) | — (not drawn) | Waiting for a licence · "No licence is available for Arun on ACC-0107 right now." | — | Waiting for a licence | "No licence is available for you on ACC-0107 right now." | — (missing) |
| active + person inactive | Student inactive | — (not drawn) | "Can’t open — inactive" · "Sneha's account is inactive." (f11) | "Inactive — can’t be given access" | Inactive · Can’t open experiments while inactive | inactive banner | — (missing) |
| active + plan ended | Access ended | — (plan page "Plan ended" history) | — | refusal page (plan ended, B2-05 f15–17) | — | "Access ended on 7 Oct 2027" · earlier work | — |
| active + institution paused | **the grant's own word** (Active / Waiting for a licence / Student inactive) under the banner "Read-only while your institution's access is paused" (B2-04 f12; annotation "· read-only while paused") | **Paused** (B2-03 paused frame, SACC-0310 row) | — (not drawn) | refusal page (paused) | — | paused banner; rows stay, nothing opens | — |
| withdrawn | Withdrawn / Individual grant withdrawn (when also in a group grant) | — | "Individual grant withdrawn" · "Withdrawn 12 Oct 2026 · “Given individually by mistake.”" | selectable again (not drawn) | Has it individually (other grant) | "no longer given" + ST-19 "You no longer have access to this experiment" | Withdrawn |

**Transitions**
| From | To | Command | Actor |
|---|---|---|---|
| — | active (optionally + provided wait) | `giveAccess` (preview → apply) | Institute Admin (own institution; plan active; not paused) |
| active (individual) | withdrawn | `withdrawGrant` (DL-2 reason) | Institute Admin |
| active (group) | withdrawn | **not designed** | — |
| any | any | while paused — **refused** ("You can’t give or withdraw access until BITS lifts the pause.") | — |
| any | any | by Faculty, Student, publication, release, runtime — **never** | — |

---

### M16 Runtime activity (RUN — activity half)
Boards: B3-02, B3-03 (WEB), B3-04 (AR/VR/MR), B3-05, B3-10 (Usage), B4-10. Committed: `1b090c9:v2/packages/domain/src/runtime/events.ts`, `utilisation.ts`, `v2/packages/contracts/src/runtime-events.ts`.

```ts
/** Runtime activity per Student × Experiment × format. Written by the runtime (mock stand-in port), never by the Student,
 *  never derived from publication, plan or grant. It is NOT learning completion (BC-3). */
export interface RuntimeActivity {
  readonly studentId: PersonId;
  readonly experimentId: ExperimentId;
  readonly format: Technology;
  readonly firstOpenedAt: Provided<IsoInstant> | null;          // 'First opened 12 Oct 2026, 10:05' (WEB) / 'First session reported …' (VR)
  readonly lastSavedAt: Provided<IsoInstant> | null;            // WEB 'Last saved 12 Oct 2026, 11:20' — time only (OD-B3-07)
  readonly lastSessionReportedAt: Provided<IsoInstant> | null;  // VR 'Last session reported 16 Oct 2026, 14:10'
  readonly sessions: Provided<number>;                          // Usage 'Sessions' (B3-10 definition)
}
```
**CONFIRMED**
- [C] WEB: "Launch WEB (not started) · Continue WEB (in progress)"; "Runs in your browser in a new tab. This page keeps your place." (B3-03). AR/VR/MR: "No launch button — VR runs on the headset."; setup steps are information only (B3-04; T-14).
- [C] "Last saved 12 Oct 2026, 11:20" (WEB) and "Last session reported 16 Oct 2026, 14:10" (VR) — times only, no step names or durations (B3-03, B3-04; OD-B3-07).
- [C] Usage definitions: Started "Students who have opened this format at least once."; Sessions "Times the format was opened in the browser (WEB) or a session was reported from a headset (VR)." (B3-10).
- [C] Faculty "Formats used by your students" = opened at least once (B4-03); "Last activity" = opening a format or the assessment (sample, OD-B4-10) (B4-10).
- [C] Paused / waiting / ended: nothing opens (B3-02 'Institution paused', 'Waiting for a licence · Arun Kumar', 'Access ended' → "View earlier work").

**PROPOSED**
- [P] A per-format summary record rather than a raw event log in the mock: every figure on the boards is a time or a count that the runtime "reports"; storing `Provided<…>` values keeps the UI from computing them.
- [P] Production can derive this summary from the committed `RuntimeEventRecord` fold (`foldSessions`) — **but only for activity**; see [U] on completion.

**UNRESOLVED**
- [U] Whether a portal click on "Launch WEB" alone moves Not started → In progress, or only a runtime-reported launch (B3-03 script moves it after a successful open; the trigger is not stated) — U:student PE RUN.
- [U] T-12 / A-06: what "last saved" and "a session" are (OD-B3-07).
- [U] Time spent and per-attempt technology tag (stakeholder STK31-29/43, 07.3 R07) — not shown on any Faculty/IA board.

**Status → labels**: activity has no status of its own; it feeds `FormatProgressView` (M17). entities.json RUN merges activity and completion and names the Student as writer — defect (§7 D-05).

**Transitions** (system only)
| From | To | Event | Actor |
|---|---|---|---|
| no activity | firstOpenedAt set | format opened / first session reported | system:runtime-report (mock stand-in) |
| activity | lastSavedAt / lastSessionReportedAt / sessions updated | save / session reported | system:runtime-report |

---

### M17 Format completion + FormatProgress view (RUN — completion half)
Boards: B3-03 f3, B3-04 f2, B3-05, B3-12 C3, B3-10, B4-10, B7-03 'Institution report'.

```ts
/** Opaque, system-set learning-completion fact. The completing event is OPEN (T-12): this record is created only by
 *  RuntimeReportPort.reportCompletion — never by a Student command, never inferred from a launch, sessions, time,
 *  resources, an assessment or another format. */
export interface FormatCompletion {
  readonly studentId: PersonId;
  readonly experimentId: ExperimentId;
  readonly format: Technology;
  readonly completedAt: IsoInstant;                 // 'Completed 14 Oct 2026'
  readonly reportedFrom: 'simulation' | 'headset';  // 'Reported by the simulation at 15:30' / 'Reported from the headset at 11:15'
  readonly recordedBy: { readonly kind: 'system'; readonly system: 'system:runtime-report' };
}

export type FormatProgressStatus = 'not-started' | 'in-progress' | 'completed';

/** Per-format read model. There is no experiment-, course- or Student-level aggregate (BC-4). */
export interface FormatProgressView {
  readonly experimentId: ExperimentId;
  readonly format: Technology;
  readonly status: FormatProgressStatus;           // completed ⇐ completion fact only; in-progress ⇐ activity; else not-started
  readonly completion: FormatCompletion | null;
  readonly activity: RuntimeActivity | null;
  readonly beforePause: boolean;                   // 'Completed 14 Oct 2026 before the pause'
  readonly feedback: 'not-offered' | 'offered' | { readonly sentAt: IsoInstant };   // M19
}

/** FUTURE runtime adapter only (never the mock, never a screen). Decides which committed RuntimeEventRecord counts as
 *  the completing event once T-12 is answered; the committed utilisation.ts SIMULATION_COMPLETED rule becomes ONE
 *  implementation of it. Committed SimulationStatus is mapped to FormatProgressStatus only inside that adapter (§1.9 edit 3). */
import type { RuntimeEventRecord } from '@xr/domain';   // committed runtime/events.ts
export interface CompletionPolicy { isCompletion(event: RuntimeEventRecord): boolean }
```
**CONFIRMED**
- [C] "Completed means The simulation reports that you finished. You can’t mark it yourself."; "No “I have finished” button." (B3-03); "Completion reported from the headset (T-12)" (B3-04); actor "System" (B3-12 C3); BC-3.
- [C] "Completed 14 Oct 2026 · Reported by the simulation at 15:30" / "Completed 20 Oct 2026 · Reported from the headset at 11:15" (B3-03, B3-04); details "First opened 12 Oct 2026, 10:05 · completed 14 Oct 2026, 15:30" (B3-05 'Show details').
- [C] Progress per format: Not started · In progress (last saved) · Completed (date); no percentage, no overall verdict; resources never count (B3-05 f2 "Still no overall percentage or verdict"; U:DR BR-066; BC-4).
- [C] Faculty: "WEB Completed 14 Oct 2026 · VR In progress"; counts "WEB 2 completed · 2 in progress · 1 not started"; never a % or experiment verdict (B4-10, B4-02/03).
- [C] Usage "Completed: Students whose format was reported completed by the simulation or the headset." (B3-10). SA institution report "WEB 4 started · 2 completed · VR 2 started · 1 completed", never added up (B7-03).
- [C] Paused: "Completed 14 Oct 2026 before the pause" / "Not started before the pause" (B3-01, B3-05).

**PROPOSED**
- [P] Completion as its own record (not a status field on activity) so no code path can set it from activity.
- [P] `FormatProgressView` computed by the service from three independent records (activity, completion, feedback) — none writes another.

**UNRESOLVED**
- [U] T-12 / A-06: the completing event per format. **Conflict with committed code**: `1b090c9:v2/packages/domain/src/runtime/utilisation.ts` makes `SIMULATION_COMPLETED` for an opened session THE completion trigger and requires a launched/started session — this silently closes T-12. Keep it behind the replaceable `CompletionPolicy` typed above, used only by a future runtime adapter; the mock never derives `FormatCompletion` from `deriveSimulationUtilisation(...).status` (U:FP warnings). `FormatProgressStatus` is the one status every read model uses; committed `SimulationStatus` ('NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED') never reaches a screen (§1.9 edit 3).
- [U] "Reported from …" wording for AR / MR (Godavari has no AR sample) — only "simulation" and "headset" drawn.
- [U] T-13: whether every format must be completed — irrelevant to the model (no aggregate), listed for completeness.
- [U] Stakeholder PM-09 / D-07/D-08 sequential gating and four-part completion vs T-16 "No locks" and BC-4 — not modelled (U:DR conflicts).

**Status → labels**
| Canonical | Student (B3-02/03/05) | Faculty (B4-10) | Institute Admin (B3-10) | entities.json |
|---|---|---|---|---|
| not-started | Not started | Not started | (not in Started) | Not started |
| in-progress | In progress · "Last saved …" / "Last session reported …" | In progress | Started | In progress |
| completed | Completed 14 Oct 2026 · Reported by … | Completed 14 Oct 2026 | Completed | Completed (per format) |

**Transitions**
| From | To | Event | Actor |
|---|---|---|---|
| not-started | in-progress | activity recorded (M16) — trigger [U] | system:runtime-report |
| not-started · in-progress | completed | `reportCompletion` — event [U] (T-12) | system:runtime-report only |
| any | completed | Student command — **never** | — |
| completed | not completed | — **not designed** (first completion stands — PROPOSED, mirrors committed fold rule) | — |

---

### M18 Resource opened
Boards: B3-01 (ST-06), B2-12 Overview, B4-10 (FA-21).

```ts
export interface ResourceOpened {
  readonly studentId: PersonId;
  readonly resourceId: ResourceId;
  readonly firstOpenedAt: IsoInstant;   // 'Opened 12 Oct 2026, 09:40'
}
/** UI-only states of the open action: not opened · opening · opened (date) · couldn’t open + try again (U:DR BR-068). */
```
**CONFIRMED**
- [C] "Opening a resource marks it “Opened” and nothing else (T-13)."; never counts as progress (B3-01).
- [C] Overview summary "3 resources · none opened yet." / "Lab brief opened on 12 Oct. 2 more to read." (B2-12). Faculty sees "Opened 12 Oct 2026, 09:40 / Not opened" (B4-10).
- [C] States: not opened · opening · opened (date) · couldn’t open + try again · none attached · loading · list failed · paused (U:DR BR-068).

**PROPOSED**
- [P] Keep only the first opening (the boards show one date).

**UNRESOLVED**
- [U] OD-B3-06 / T-15 resource delivery; the prototype's "Mark as done" must not return (U:FP warnings).

**Status → labels** (Student, Faculty): "Not opened yet" / "Opened 12 Oct 2026, 09:40" / "Opened in a new tab just now" (B3-01); Faculty "Not opened" / "Opened …" (B4-10). Not in entities.json.

**Transitions**: `not opened → opened` · `openResource` · Student (given experiment, not paused, not inactive).

---

### M19 Format feedback (FB)
Boards: B3-06 (ST-16/17), B3-02, B3-03, B3-05, B3-12. entities.json FB.

```ts
export type Rating = 1 | 2 | 3 | 4 | 5;
export const FEEDBACK_STATEMENTS = [
  'This experience helped me understand the concept.',
  'The instructions were clear and easy to follow.',
  'The simulation was easy to use and interact with.',
  'This experience worked smoothly without technical issues.',
  'Overall, I was satisfied with this learning experience.',
] as const;
export const RATING_SCALE: Readonly<Record<Rating, string>> = {
  1: 'Strongly disagree', 2: 'Disagree', 3: 'Neither agree nor disagree', 4: 'Agree', 5: 'Strongly agree',
};

export interface FormatFeedback {
  readonly id: FeedbackId;
  readonly studentId: PersonId;
  readonly experimentId: ExperimentId;
  readonly format: Technology;
  readonly statementSet: 1;                                          // version of FEEDBACK_STATEMENTS
  readonly ratings: readonly [Rating, Rating, Rating, Rating, Rating];
  readonly comments: string | null;                                  // 'Additional comments (optional)'
  readonly sentAt: IsoInstant;                                       // 'Sent 14 Oct 2026, 15:42'
}
```
**CONFIRMED**
- [C] Five statements, each rated 1–5 with every point labelled (B3-06 `FB.qs`, `FB.scale`; "not colour-only").
- [C] Each rating required — "Choose a rating"; summary link "Choose a rating for statement 1"; summary title "One rating is missing" / "3 ratings are missing" (B3-06 `errTitle`).
- [C] Comments optional, no length rule; read-only shows "—" when empty (B3-06).
- [C] One record per Student × Experiment × format; the entry "Give feedback on WEB" appears only after that format is Completed — "Only after that format is recorded as completed (T-12). Not eligible → no entry at all." (B3-06 table 'Eligibility'); frame "Not eligible · VR in progress → no feedback entry … No disabled button." (B3-06); "VR not started offers nothing" (B8-04); flows.json C3; BC-5.
- [C] One submission, no edit, no resubmit — "Feedback can’t be changed after it’s sent." (B3-06; ST-17 read-only).
- [C] No staff view anywhere (Faculty, IA, SA); Usage has no feedback column (B3-06 'Not designed'; OD-B3-12; T-25).
- [C] Entry points: ST-07, ST-08, ST-09, ST-10/ST-15, Home Up next (B3-06 entry-points table).

**PROPOSED**
- [P] `id` (none drawn); `statementSet` so wording changes never re-interpret stored ratings.
- [P] Uniqueness key (studentId, experimentId, format) enforced by the service (`conflict` error).

**UNRESOLVED**
- [U] T-25 / OD-B3-12: staff ownership and analytics.
- [U] Whether feedback stays available if the grant is later withdrawn — not drawn.

**Status → labels**
| Canonical | Student | entities.json |
|---|---|---|
| not eligible (format not completed) | nothing shown | — |
| eligible (completed, none sent) | "Give feedback on WEB" | "Give feedback on WEB" |
| sent | "Feedback sent 14 Oct 2026" (B3-02/B3-05) · "WEB feedback · Sent 14 Oct 2026" · "Feedback on WEB sent" (B3-06) · "See your feedback" | "Feedback sent · WEB · 14 Oct" (wording differs — §7) |

**Transitions**: `eligible → sent` · `sendFeedback` · Student (own, format completed, none sent). `sent → edited` — never.

---

### M20 Assessment (ASMT) + versions
Boards: B4-02…B4-06 (FA-03…FA-12), B4-11, B4-14. entities.json ASMT/ATT; flows.json D1.

```ts
export type ReleaseOption = 'immediately-after-marking' | 'after-deadline' | 'on-date';

export interface AssessmentRules {
  readonly passMarkPercent: number | null;       // whole number 0–100
  readonly attemptsAllowed: number | null;       // whole number ≥ 1
  readonly deadline: IsoInstant | null;          // advisory (T-18)
  readonly release: { readonly option: ReleaseOption; readonly releaseDate: IsoInstant | null } | null;  // none pre-selected (T-19)
}
export interface AssessmentQuestionRef { readonly questionId: QuestionId; readonly questionVersion: number }

export interface Assessment extends RecordMeta {
  readonly id: AssessmentId;                     // ASMT-0009
  readonly institutionId: InstitutionId;
  readonly experimentId: ExperimentId;           // per experiment, not per format
  readonly name: string;                         // 'Heat Exchanger — post-lab'
  readonly introduction: string | null;
  readonly rules: AssessmentRules;
  readonly questions: readonly AssessmentQuestionRef[];   // ordered; pinned versions
  readonly version: number;                      // 'Version 2 since 8 Nov 2026'
  readonly versionSince: IsoInstant;
  readonly versions: readonly AssessmentVersionSnapshot[];
  readonly createdAt: IsoInstant;                // 'Created 26 Oct 2026, 16:40 by you'
  readonly createdBy: ActorRef;
  readonly readySince: IsoInstant | null;        // 'ready since 27 Oct 2026, 11:05'
  readonly history: readonly HistoryEntry<'created' | 'saved-as-draft' | 'became-ready' | 'settings-saved' | 'questions-changed' | 'new-version'>[];
}
export interface AssessmentVersionSnapshot {
  readonly version: number; readonly since: IsoInstant;
  readonly name: string; readonly introduction: string | null;
  readonly rules: AssessmentRules; readonly questions: readonly AssessmentQuestionRef[];
}
export type AssessmentReadiness = 'draft-not-ready' | 'ready';   // derived
/** Ready = name + all rules (+ release date when 'on-date') + ≥ 1 question (B4-04 annotation; OD-B4-03 assumption). */
export declare function assessmentReadiness(a: Assessment): AssessmentReadiness;
```
**CONFIRMED**
- [C] Experiment — "Choose an experiment"; one per experiment per institution: refusal at step 1 "This experiment already has an assessment" with a link to it (B4-04 `next1`; OD-B4-01 PROVISIONAL).
- [C] Name — "Enter a name for the assessment" (Continue / Save settings); "Enter a name to save a draft" (Save as draft) (B4-04, B4-06).
- [C] Introduction optional — hint "What students read before they start." (B4-04).
- [C] Pass mark — "Enter a pass mark from 0 to 100, as a whole number" (hint "Share of the total marks needed to pass, 0–100."; "50.5" rejected); shown "Pass mark 50% · 8 of 16 marks" (B4-04 f 'Step 2 · validation').
- [C] Attempts — "Enter how many attempts are allowed, as a whole number" (hint "A whole number, 1 or more.").
- [C] Deadline — "Enter the deadline" (hint "Date and time, for example 14 Nov 2026, 23:59"); no past-date or format rule; meaning after it passes is open (OD-B4-02).
- [C] Release — radio, none pre-selected: "Choose when students see their result"; options "Immediately after marking" (Each student sees their result once their answers are marked.) · "After the deadline" (Everyone sees their result when the deadline passes.) · "On a date" (+ "Enter the release date"); results and answers released together (B4-04; T-19; OD-B4-04).
- [C] Questions ≥ 1 — "Add at least one question, or save as a draft" (B4-04 `next3`); sample summary "4 questions · 16 marks" (B4-05; B4-04 caption wording "Four questions, 16 marks.").
- [C] No timer: "No time limit and no timer. Every value here is set for this assessment only - nothing comes pre-filled." (B4-04; T-22). No universal settings / defaults: a new assessment starts empty — "Nothing pre-filled (C-5)" (B4-04 head; BC-6; U:DR BR-076).
- [C] "Students can’t see a draft."; Ready → "Students who have Shell-and-Tube Heat Exchanger can now see it in Assessments and start it." (B4-04; B4-14 D1).
- [C] Reach = students who have the experiment (SACC), not FCM; formats don't change reach: "5 students who have Shell-and-Tube Heat Exchanger from Godavari Institute of Technology" (B4-05).
- [C] Versioning: changing rules or questions after submissions makes a new version — "earlier submissions keep theirs"; "Version 2 since 8 Nov 2026"; changing when results are shown is warned separately (B4-05, B4-06; OD-B4-13).
- [C] Preview creates no attempt and saves nothing; answer key "Only you see" (B4-06 FA-11).
- [C] No delete, close, make-available control (B4-04 annotation; T-18).

**PROPOSED**
- [P] `institutionId` — "one per experiment per institution" needs it; co-teaching Faculty share (OD-B4-17).
- [P] `questions` pin `questionVersion` — "assessments keep their version until Use updated version" (B4-07).
- [P] `versions[]` snapshots — attempts pin `assessmentVersion` (M22).
- [P] Readiness derived, not stored — one rule for Faculty chips and Student visibility.

**UNRESOLVED**
- [U] OD-B4-01 one per experiment per institution; OD-B4-02 deadline meaning; OD-B4-03 which rules make it Ready; OD-B4-13 version numbering; T-18 make-available control; T-22 timer (stakeholder PM-08 wants the model not to preclude one).
- [U] Ready checklist label "Name and introduction" (B4-05) vs optional introduction (B4-04) — wording inconsistency.
- [U] B4-11 f15 Student "Not available yet · no questions — This assessment can’t be started yet" contradicts "Ready requires ≥ 1 question" and "Students can’t see a draft".
- [U] Release-date ordering vs deadline — no rule drawn.

**Status → labels**
| Canonical (derived) | Faculty | Student | entities.json |
|---|---|---|---|
| draft-not-ready | Draft — not ready (B4-03/04/05) | not visible | Draft |
| ready | Ready (B4-04/05); "Assessment ready" (B4-02); "1 waiting for marking" summary | listed under To do | Ready |

**Transitions**
| From | To | Command | Actor |
|---|---|---|---|
| — | draft-not-ready | `createAssessment` (mode save-as-draft; name only required) | Faculty (experiment taught) |
| — | ready | `createAssessment` (mode create; all rules + ≥ 1 question) | Faculty |
| draft-not-ready | ready | `updateSettings` / `updateQuestions` completing the rules | Faculty |
| ready vN | ready vN+1 | rules or questions changed while submissions exist | Faculty |
| any | deleted / closed | **not designed** | — |

---

### M21 Question bank item, assisted draft, import batch (Q)
Boards: B4-07 (FA-14/15), B4-08 (FA-16/17), B4-12/B4-13 (Student view).

```ts
export type QuestionType = 'multiple-choice' | 'true-false' | 'written';
export type ChoiceKey = 'A' | 'B' | 'C' | 'D';
export type QuestionBody =
  | { readonly type: 'multiple-choice'; readonly options: Readonly<Partial<Record<ChoiceKey, string>>>; readonly correct: ChoiceKey }
  | { readonly type: 'true-false'; readonly correct: boolean }
  | { readonly type: 'written'; readonly markingGuidance: string | null };   // free text; Faculty only

export interface Question extends RecordMeta {
  readonly id: QuestionId;                       // Q-0101
  readonly institutionId: InstitutionId;
  readonly experimentId: ExperimentId;           // 'Questions for Shell-and-Tube Heat Exchanger · ME ZG523'
  readonly text: string;
  readonly body: QuestionBody;
  readonly marks: number;                        // whole number ≥ 1 — on the question (OD-B4-07)
  readonly explanation: string | null;           // shown with the correct answer after release
  readonly version: number;
  readonly versions: readonly { readonly version: number; readonly at: IsoInstant; readonly text: string; readonly body: QuestionBody; readonly marks: number; readonly explanation: string | null }[];
  readonly origin: 'written' | 'reviewed-draft' | 'import';   // 'From a draft you reviewed'
  readonly addedAt: IsoInstant;                  // 'Added 20 Oct 2026'
  readonly addedBy: ActorRef;
  readonly deleted: { readonly at: IsoInstant; readonly by: ActorRef } | null;   // 'deleted 7 Nov 2026 · history kept'
}

export interface QuestionDraftRequest {
  readonly source: 'lab-brief' | 'pasted-text';
  readonly pastedText: string | null;
  readonly types: readonly QuestionType[];       // ≥ 1
  readonly howMany: 3 | 5;
}
export interface QuestionDraft {                 // tagged 'Draft — needs your review' · 'Drafted with assistance'
  readonly id: QuestionDraftId;
  readonly experimentId: ExperimentId;
  readonly text: string;
  readonly body: QuestionBody;
  readonly marks: null;                          // no suggested marks (OD-B4-12)
  readonly explanation: string | null;
  readonly requestedAt: IsoInstant;
}
export interface QuestionImportReport {
  readonly batchId: ImportBatchId;
  readonly fileName: string;                     // 'post-lab-questions.csv'
  readonly rowsChecked: number;
  readonly rows: readonly { readonly row: number; readonly question: string; readonly problem: string; readonly severity: 'error' | 'warning' }[];
  readonly canImport: boolean;                   // false while any error (all-or-nothing interim, T-24)
}
export const QUESTION_IMPORT_COLUMNS = [
  'type', 'question', 'option_a', 'option_b', 'option_c', 'option_d', 'correct', 'marks', 'explanation', 'marking_guidance',
] as const;
```
**CONFIRMED**
- [C] Type — "Choose the question type"; "Three types only." (B4-07; T-22).
- [C] Text — "Enter the question". Options A–D (MC) — "Add at least two answer options" (hint "Up to four; mark the one correct answer."). Correct — "Choose the correct answer" (MC) / "Choose whether the statement is true or false" (TF) (B4-07).
- [C] Marks — "Enter the marks, as a whole number of 1 or more" ("two" rejected); no upper bound; on the question (B4-07; OD-B4-07).
- [C] Marking guidance (written only) — free text; "Students don’t see it while they answer." (T-21; OD-B4-08). Explanation optional — "Shown to students with the correct answer when their result is released." (OD-B4-09).
- [C] Edit a used question: "Saved as a new version…"; assessments keep theirs until "Use updated version" (B4-07). Delete (DL-1): leaves the bank, history kept, assessments keep their copy (B4-07; ND-15).
- [C] "Used in 1 assessment / Not used yet"; "From a draft you reviewed" (B4-07); "In your bank · reviewed by you" (B4-08).
- [C] Draft with assistance: source — "Choose the material to draft from" (lab brief / "Text I paste" + "Paste the text to draft from"); types — "Choose at least one question type"; how many — "Choose how many drafts you want" (3 / 5); drafts never enter the bank on their own; discarded drafts leave no trace; no provider named (B4-08; OD-B4-12).
- [C] Import: CSV only — "Choose a CSV file first"; ten-column template; "type is multiple choice, true or false, or written answer. question and marks are always required; choice questions need their options and correct (A–D, or TRUE / FALSE). explanation and marking_guidance are optional."; row report "Row 3 · … · correct is “E”, but the question has options A–D only. · Error — blocks import"; warning "explanation is empty. The question imports without one."; questions go into the bank only, never into an assessment (B4-08; T-24; OD-B4-11).

**PROPOSED**
- [P] `institutionId` + `experimentId` as the bank scope; `versions[]`; `origin`; soft `deleted`.
- [P] `QuestionDraft` kept only in the session's working set until added (discarded drafts leave no trace).

**UNRESOLVED**
- [U] Bank ownership: per Faculty member or shared by co-teaching Faculty in the institution (OD-B4-17) — "own bank" wording vs shared course.
- [U] Stakeholder STK31-33 (upload a source document / prompt) vs v46 lab brief or pasted text (OD-B4-12).
- [U] OD-B4-11 / T-24 / D5: XLSX, commit mode, warning conditions.
- [U] No FA-15 editor state for a draft under review is drawn (U:faculty inconsistencies).

**Status → labels** (Faculty only): active → "Used in 1 assessment" / "Not used yet"; reviewed draft → "In your bank · reviewed by you" (B4-08) / "From a draft you reviewed" (B4-07); draft → "Draft — needs your review" · "Drafted with assistance"; deleted → "deleted 7 Nov 2026 · history kept"; import rows "Error — blocks import" / warning (B4-07, B4-08). Not in entities.json (§7 D-01).

**Transitions**
| From | To | Command | Actor |
|---|---|---|---|
| — | active v1 | `addQuestion` / `addDraftToBank` / `commitQuestionImport` | Faculty (experiment taught) |
| active vN | active vN+1 | `editQuestion` | Faculty |
| active | deleted (history kept) | `deleteQuestion` (DL-1) | Faculty |
| draft | (gone) | `discardDraft` | Faculty |
| draft | active | automatic — **never** | — |

---

### M22 Attempt, marking and result (ATT)
Boards: B4-06 (FA-12), B4-09 (FA-18/19), B4-10, B4-11 (ST-11/12), B4-12 (ST-13), B4-13 (ST-14), B4-14.

```ts
export type AnswerValue =
  | { readonly type: 'multiple-choice'; readonly choice: ChoiceKey }
  | { readonly type: 'true-false'; readonly value: boolean }
  | { readonly type: 'written'; readonly text: string };

export interface Attempt extends RecordMeta {
  readonly id: AttemptId;                         // ATT-0450
  readonly assessmentId: AssessmentId;
  readonly assessmentVersion: number;             // earlier submissions keep their version
  readonly studentId: PersonId;
  readonly attemptNumber: number;                 // 'Attempt 1 of 2'
  readonly state: 'in-progress' | 'submitted';
  readonly answers: Readonly<Partial<Record<QuestionId, AnswerValue>>>;   // unanswered allowed
  readonly startedAt: IsoInstant;
  readonly submittedAt: IsoInstant | null;        // 'Submitted 5 Nov 2026, 18:52'
  readonly marking: AttemptMarking;
}
export interface AttemptMarking {
  readonly automatic: readonly { readonly questionId: QuestionId; readonly awarded: number; readonly outOf: number }[];
  readonly written: readonly WrittenAnswerMark[];
  readonly confirmed: { readonly at: IsoInstant; readonly by: ActorRef } | null;   // read-only afterwards
}
export interface WrittenAnswerMark {
  readonly questionId: QuestionId;
  readonly mark: number | null;                   // 0 … question marks
  readonly feedback: string | null;               // optional (OD-B4-06)
  readonly savedAt: IsoInstant | null;            // 'Mark saved — not confirmed yet'
  readonly savedBy: ActorRef | null;
}

/** Derived for the Student — no figure of any kind until marks are confirmed AND the release setting has been met. */
export type AttemptResult =
  | { readonly kind: 'in-progress' }
  | { readonly kind: 'waiting-for-marking' }
  | { readonly kind: 'not-released-yet'; readonly releaseRule: ReleaseOption }
  | { readonly kind: 'released'; readonly releasedAt: IsoInstant; readonly score: number; readonly outOf: number;
      readonly passMarkMarks: number; readonly passed: boolean; readonly attemptsLeft: number };
/** Release time by setting — system:release-setting; there is no Faculty release control (B4-14 D4). */
export declare function resultReleaseAt(rules: AssessmentRules, marksConfirmedAt: IsoInstant): IsoInstant;
```
**CONFIRMED**
- [C] Start: "Attempt 1 of 2"; "No time limit. Answers save as you go, and nothing is submitted until you choose Submit." (B4-11, B4-12).
- [C] Autosave: "Answers save automatically · Saving… · All answers saved · Your last answer didn’t save" (failed save → Try again; nothing saved is lost); answered count "<n> of <total> answered" (B4-12 script `countText`; sample caption "Two of four answered.").
- [C] Submit can fail: "Your answers weren't submitted — They're still saved here. Try again." (B4-12 frame 'Submit fails + try again').
- [C] Submit (DL-1): "You can’t change your answers after submitting"; names unanswered questions; never automatic (B4-12; U:DR BR-086).
- [C] Choice questions are marked automatically: "Marked automatically 4 of 6 marks (Question 1 2 of 2 · …)" (B4-09 `autoText`).
- [C] Written mark — "Enter a mark for question 4" / "Enter a whole number from 0 to 10" ("12" rejected); feedback optional ("No feedback" when empty); "Save mark" → "Mark saved — not confirmed yet"; "Confirm marks" (DL-1) "Confirm marks for Rahul Verma? … Confirmed marks can’t be changed."; "Marks confirmed 7 Nov 2026, 10:15 · Dr S. Ranganathan" (B4-09).
- [C] Queue oldest first; filters assessment + Waiting / Marked / All; no re-marking (T-20); no suggested marks (T-23) (B4-09).
- [C] Before release the Student sees no figure: "Submitted — waiting for marking" or "Result not released yet" (B4-13; T-19).
- [C] After release: "You passed" / "Not passed this time"; score card "11 of 16 marks", pass mark, attempt used, "Released 14 Nov 2026, 23:59, after the deadline"; per answer: your answer · correct answer (choice only) · explanation · "Feedback from Dr S. Ranganathan" · "2 of 2 marks" (B4-13; OD-B4-09).
- [C] "Try again" only when not passed and an attempt is left (B4-13; OD-B4-05).
- [C] Release by the assessment's own setting — "The assessment’s own setting · Results are released after the deadline" (B4-14 D4). Faculty sees "Not yet — after the deadline" / "Released 14 Nov 2026, 23:59" (B4-06, B4-10).
- [C] Export columns: FA-12 "student, student ID, submitted, status, score, result released to student" ("submissions-ASMT-0009.csv"); FA-20 "student, student ID, experiment, WEB, VR, assessment, result released to student, last activity" ("students-shell-and-tube.csv") — the list on screen only (B4-06, B4-10).

**PROPOSED**
- [P] `assessmentVersion` pin; `answers` keyed by question id; `marking.automatic` computed at submit.
- [P] `AttemptResult` derived by the service using the clock; no stored "released" flag, so changing the clock (sample deadline) releases consistently for every viewer (BC-14).
- [P] `resultReleaseAt`: immediately → confirm time; after deadline → max(deadline, confirm time); on a date → max(release date, confirm time) — PROPOSED reading of B4-04 option texts.

**UNRESOLVED**
- [U] **Automatic marking of choice questions is drawn (B4-09) while "grading automation" is out of scope (BC-10)** — confirm it is in scope as a deterministic answer-key comparison (not AI marking of written answers).
- [U] An attempt with no written questions: when are marks "confirmed" (not drawn).
- [U] Several written questions in one attempt: confirm per attempt or per answer (FA-18 "one row per written answer" vs FA-19 per attempt; boards show one written question).
- [U] Pass-mark rounding when % × total is not whole (50% × 16 = 8 drawn only).
- [U] Starting attempt n+1 while attempt n is waiting for marking — not drawn (prototype blocked it).
- [U] OD-B4-05 retry after a pass; T-20 re-marking; T-23 suggested marks; stakeholder STK31-31 auto-review (WAIT).
- [U] flows.json D4 / B8-04 "FA-12 (release)" by Faculty vs boards (no release control) — handoff defect (§7).

**Status → labels**
| Canonical / derived | Student (B4-11 `W`, B4-13) | Faculty (B4-06, B4-09, B4-10) | entities.json |
|---|---|---|---|
| (no attempt, assessment ready) | To do | — | — (missing) |
| in-progress | Attempt in progress; ST-14 result page "Not submitted yet — Your result appears here after you submit and your answers are marked." (B4-13) | — | Attempt in progress |
| submitted, not confirmed | Waiting for marking ("Submitted — waiting for marking") | Waiting for marking | Submitted · Waiting for marking |
| confirmed, not released | Result not released yet | lists: Marked · "Not yet — after the deadline"; FA-19: "Marks confirmed" + "7 Nov 2026, 10:15 · Dr S. Ranganathan" (B4-09) | Marks confirmed |
| released | Result ready → "You passed" / "Not passed this time" | lists: Marked · "Released 14 Nov 2026, 23:59"; FA-19: "Marks confirmed" | Result ready |

**Transitions**
| From | To | Command / event | Actor |
|---|---|---|---|
| — | in-progress | `startAttempt` (ready; has the experiment; attempts left; for n > 1 previous released and not passed) | Student |
| in-progress | in-progress | `saveAnswer` (autosave) | Student |
| in-progress | submitted | `submitAttempt` (DL-1) | Student |
| submitted | submitted (mark saved) | `saveMark` (refused `invalid-state` while the attempt is still in progress) | Faculty (course assigned) |
| submitted | submitted + confirmed (read-only) | `confirmMarks` (DL-1; `invalid-state` while in progress) | Faculty |
| confirmed | released | release setting met | system:release-setting |
| confirmed | re-marked | **not designed** (T-20) | — |
| any | released by Faculty | **not designed** (no control) | — |

---

### M23 Device transfer (DTR) + authorised device
Boards: B3-07 (ST-18), B3-09 (IA-18/19), B3-11 (SA-18/19), B3-12, B7-09, B7-10, 06 (account menu "My device"). entities.json DTR.

```ts
export type DeviceTransferState = 'with-institute-admin' | 'forwarded' | 'approved';

export interface DeviceTransfer extends RecordMeta {
  readonly id: DeviceTransferId;                  // DTR-0018
  readonly institutionId: InstitutionId;
  readonly studentId: PersonId;
  readonly format: 'ar' | 'vr' | 'mr';            // 'VR for Shell-and-Tube Heat Exchanger' — DERIVED by the service from the Student's
  readonly experimentId: ExperimentId | null;     //   authorised device; never a user choice (the ST-18 form draws no format field)
  readonly fromDevice: string;                    // read-only in the form: current authorised device (free text)
  readonly newDevice: string;                     // required
  readonly note: string | null;                   // optional; IA 'Note to you'; SA "student's note"
  readonly state: DeviceTransferState;
  readonly requestedAt: IsoInstant;               // '22 Oct 2026, 09:10'
  readonly forwarded: { readonly at: IsoInstant; readonly by: ActorRef } | null;   // '23 Oct 2026, 10:00 · Meera Iyer'
  readonly approved: { readonly at: IsoInstant; readonly by: ActorRef } | null;
  readonly history: readonly HistoryEntry<'requested' | 'forwarded' | 'approved'>[];
}
export interface AuthorisedDevice {
  readonly studentId: PersonId;
  readonly format: 'ar' | 'vr' | 'mr';
  readonly description: string;                   // 'ME lab VR headset, asset tag GIT-VR-03'
  readonly usedFor: readonly ExperimentId[];      // 'Used for VR · Shell-and-Tube Heat Exchanger'
  readonly since: IsoInstant;
  readonly viaTransferId: DeviceTransferId | null;
}
/** Read model: a request that exists but cannot move yet. Derived on every read — never a refusal of the request. */
export interface DeviceTransferView {
  readonly transfer: DeviceTransfer;
  readonly forwardingBlocked: 'no-institute-admin' | 'institution-paused' | null;
}
```
**CONFIRMED**
- [C] The form has exactly two fields: "New device" and "Anything your Institute Admin should know (optional)" (B3-07, 8 occurrences each, no other field) — no format or "current device" input (U:FP removed 'technology scope selector').
- [C] No Institute Admin: the request is **created** and waits — notice "This request can't be forwarded yet — Your institution has no Institute Admin right now. It stays here until one is assigned." under the request's From / To and history (B3-07 state `dn`: `stage: 'sent', noIA: true`; `canRequest` depends only on the pause).
- [C] New device required — "Describe the new device"; hint "Describe it the way your lab or institution labels it — for example, its asset tag."; note optional, no rule (B3-07 'Validation'; OD-B3-02).
- [C] "Moving from" read-only; authorised device shown as free text on the latest approved record (B3-07; OD-B3-01).
- [C] One open request assumed: "Request a device transfer" is hidden while a request is open (B3-07; OD-B3-03).
- [C] Can't request while paused — "You can’t request a transfer while your institution’s access is paused." (B3-07).
- [C] IA forwards (DL-1) — "Forward DTR-0018 to BITS? … You can’t take it back once it’s forwarded."; "BITS decides; you can’t approve device transfers."; unavailable while paused — "You can’t forward requests right now" (B3-09, B3-12).
- [C] SA approves (DL-1, no reason) — "Approve DTR-0018? Rahul Verma’s authorised device for VR becomes {new}. The student and Meera Iyer …"; no Decline — "A request BITS doesn’t approve stays “Forwarded”." (B3-11; T-32; OD-B3-04). Still with the institution → read-only, "Approve appears only once it is forwarded." (B7-10 f14).
- [C] "My device" in the account menu only when the Student has AR, VR or MR access; otherwise no entry and no disabled item (06; B3-07).
- [C] Authorisation change only — nothing is shipped (B3-07; flows.json Device 1).

**PROPOSED**
- [P] `AuthorisedDevice` keyed by Student × format — the approve dialog names "authorised device for VR"; `usedFor` carries the experiment line.
- [P] `format` / `experimentId` derived server-side from the Student's authorised device (the My device page context), never typed or chosen.
- [P] `institutionId` — scoping for IA-18 and paused checks.
- [P] `DeviceTransferView.forwardingBlocked` — the drawn notice is a read fact; `assignInstituteAdmin` clears it (M02).

**UNRESOLVED**
- [U] OD-B3-01 / D20b: device registry and first registration (not designed). A Student with **more than one** AR/VR/MR authorised device (not drawn — Rahul has one VR headset) would make the derived format ambiguous: the service returns `policy-open: OD-B3-01` rather than inventing a picker.
- [U] OD-B3-03: more than one open request. OD-B3-04 / T-32: decline. OD-B3-05: no Institute Admin — the request exists and waits ("It stays here until one is assigned."); who resolves the missing Institute Admin is not stated.
- [U] Withdraw / cancel a sent request — not shown.
- [U] Stakeholder STK31-38 (Student → SA) superseded by 07.2-C (via IA) — v46 matches the later record (info).

**Status → labels** (B3-07 / B3-09 / B3-11 scripts `W`, `IAW`, `SAW` — verified)
| Canonical | Student | Institute Admin | Super Admin | entities.json |
|---|---|---|---|---|
| with-institute-admin | With your Institute Admin (+ notice "This request can't be forwarded yet …" while no Institute Admin is assigned) | Waiting on you | Still with the institution | With your Institute Admin |
| forwarded | Forwarded to BITS | Forwarded to BITS | Forwarded | Forwarded to BITS |
| approved | Approved | Decided · approved by BITS | Approved | Approved |

**Transitions**
| From | To | Command | Actor |
|---|---|---|---|
| — | with-institute-admin | `requestDeviceTransfer` — also when the institution has no Institute Admin (request waits, `forwardingBlocked: 'no-institute-admin'`) | Student (AR/VR/MR given; no open request; not paused) |
| with-institute-admin | forwarded | `forwardDeviceTransfer` (DL-1, irreversible) | Institute Admin (own institution; not paused; exists only once assigned) |
| forwarded | approved (+ authorised device changes) | `approveDeviceTransfer` (DL-1) | Super Admin |
| forwarded | declined | **not designed** (T-32) | — |

---

### M24 Support report (SUP)
Boards: 07 (XS-07), B7-09 (SA-20/21), B7-10 f12, B2-01 f7. entities.json SUP.

```ts
export type SupportState = 'open' | 'resolved' | 'reopened';

export interface SupportReport extends RecordMeta {
  readonly id: SupportReportId;                   // SUP-0213 — 'Your reference is SUP-0213'
  readonly reporter: {
    readonly personId: PersonId; readonly role: Role; readonly displayName: string;
    readonly institutionId: InstitutionId | null; readonly organisation: string | null;   // 'Rahul Verma · Student · Godavari Institute of Technology'
  };
  readonly title: string;                         // 'VR simulation stopped loading at step 2' — no input field drawn
  readonly whatHappened: string;                  // required
  readonly where: string | null;                  // pre-filled from the page; editable
  readonly screenshotFileName: string | null;     // optional; nothing uploaded in the mock
  readonly state: SupportState;
  readonly sentAt: IsoInstant;
  readonly resolutions: readonly { readonly at: IsoInstant; readonly by: ActorRef; readonly note: string }[];
  readonly reopenings: readonly { readonly at: IsoInstant; readonly by: ActorRef }[];
  readonly history: readonly HistoryEntry<'sent' | 'resolved' | 'reopened'>[];
}
```
**CONFIRMED**
- [C] "What happened?" required — hint "Say what you were doing and what you saw."; summary "One thing needs fixing" (link "Say what happened") + inline "Say what happened, so it can be looked into" (07 State 1a).
- [C] "Where did it happen?" pre-filled — "Filled in from the page you came from. Change it if needed." (07). "Screenshot (optional)" — "A picture of the screen can help." (07).
- [C] Report sent: "Your reference is SUP-0213. You can follow it in My reports." (07). Same template in all seven workspaces (07 head; U:DR BR-010).
- [C] Resolve needs a note shown to the reporter — "Add a note — the reporter sees it"; Reopen is a plain confirmation (DL-1) "It goes back to the open reports. The reporter sees it is open again." (B7-09 f8–12).
- [C] No response times or SLA (ND-14).

**PROPOSED**
- [P] `reporter.institutionId` / `organisation` — the "from" line on SA-20/21; also needed if IA visibility is confirmed.
- [P] `resolutions[]` / `reopenings[]` — a report can cycle (Resolved → Reopened → Resolved).

**UNRESOLVED**
- [U] Who reopens: 07 says resolving and reopening are Super Admin actions; B7-09 f10 shows "Reopened by the reporter" (U:FP warnings).
- [U] Source of the report `title` (no input field).
- [U] IA visibility of reports from their institution: B2-01 f7 "1 open problem report from your institution · SUP-0213 · 20 Sep 2027 → View report (Help › My reports)" while SUP-0213 is Rahul's report on 07/B7-09 (3 Oct 2026).
- [U] Problem categories (stakeholder STK31-39) — no category field on 07.
- [U] Screenshot types/sizes — not shown.

**Status → labels**: Open · Resolved · Reopened for every audience (07, B7-09; entities.json consistent).

**Transitions**
| From | To | Command | Actor |
|---|---|---|---|
| — | open | `reportProblem` | any signed-in person |
| open · reopened | resolved | `resolveReport` (note required) | Super Admin |
| resolved | reopened | `reopenReport` (DL-1) | Super Admin — reporter [U] |

---

### M25 Platform role holder (ROLE) + scopes
Boards: B7-08 (SA-16/17), B7-10 f11, B6-01 scope line, B5-06/B5-07 (course withdrawn), B7-06 (who can act). entities.json ROLE.

```ts
export type PlatformRole = Extract<Role, 'vendor' | 'academic_reviewer' | 'content_manager'>;
export type ScopeTarget =
  | { readonly kind: 'all' }                                        // 'All experiments — Everything on the platform, now and later.'
  | { readonly kind: 'course'; readonly courseId: CourseId }       // 'A course — Every experiment in one course.'
  | { readonly kind: 'experiment'; readonly experimentId: ExperimentId };   // 'One experiment — Only the experiment you choose.'

export interface RoleScope {
  readonly id: ScopeId;
  readonly target: ScopeTarget;
  readonly assignedAt: IsoInstant;                // 'Since <date>'
  readonly assignedBy: ActorRef;
  readonly withdrawal: { readonly at: IsoInstant; readonly by: ActorRef; readonly reason: string } | null;
  readonly supersededAt: IsoInstant | null;       // set when the same target is assigned or restored again: the withdrawn row
}                                                 // leaves the withdrawn list (B7-08 script) but the record and history stay
export interface PlatformRoleHolder extends RecordMeta {
  readonly id: RoleHolderId;
  readonly role: PlatformRole;
  readonly name: string;                          // 'Anil Shetty'
  readonly workEmail: string;                     // unique across holders
  readonly organisation: string;                  // 'Northline Simulation Studio'
  readonly registeredAt: IsoInstant;              // 'Registered 4 Jul 2026'
  readonly registeredBy: ActorRef;
  readonly scopes: readonly RoleScope[];
  readonly personId: PersonId;                    // identity for the mock session
  readonly history: readonly HistoryEntry<'registered' | 'scope-assigned' | 'scope-withdrawn' | 'scope-restored'>[];
}
```
**CONFIRMED**
- [C] Register a Vendor / Reviewer / Content Manager (three dialogs): Name — "Enter the person’s name"; Work e-mail — "Enter a work e-mail address" / "Enter an e-mail address like name@organisation.com" / "Someone is already registered with this e-mail address"; Organisation — "Enter the organisation"; "They start with no scope — you assign it next. Nothing is sent from here." (B7-08 f6).
- [C] Assign scope: "What can they act on?" — "Choose what they can act on"; course — "Choose a course" / "<X> is already in scope"; experiment — "Choose an experiment" / "<X> is already in scope" (B7-08). Multiple people per experiment allowed (U:DR BR-119).
- [C] Withdraw (DL-2) — "Add a reason — it is kept in the history"; "They stop seeing it straight away."; shown "MEL ZG512 · Withdrawn 15 Aug 2026 · “Manufacturing Processes content is being produced in-house this term.”" (B7-08 f4).
- [C] Restore — one click with a confirmation, no reason (B7-08 f8; OD-B7-10).
- [C] "Can act on": "ME ZG523" / "All experiments" / "Nothing — no scope yet"; notice "No scope — can’t act on anything yet" (B7-08).
- [C] Scope drives workspaces: Vendor course list; reviewer queue "You review: ME ZG523 · MEL ZG512 · CHE ZG513" (B6-01; OD-B6-01 sample); a course with no reviewer in scope makes a submission "Stuck — nobody can act" (B7-06).
- [C] No invitation, no SSO set-up (B7-08 'Not here'; T-11).

**PROPOSED**
- [P] Scope items with ids so withdraw / restore target one item and history keeps the reason with the scope.

**UNRESOLVED**
- [U] Whether an "experiment" scope may name an unpublished submission (select drawn with experiments only).
- [U] Content Manager scope semantics on CM screens ("Every experiment you look after" implies one; not drawn per screen).
- [U] Vendor scope on the person vs the organisation (see M10).
- [U] OD-B7-15 sample history (EEE ZC341 scope withdrawn 1 Oct 2026 while UPD-0006 was reviewed 26 Aug).

**Status → labels**
| Canonical | Super Admin (B7-08) | entities.json |
|---|---|---|
| holder, no active scope | "Nothing — no scope yet" / "No scope — can’t act on anything yet" | — (missing) |
| scope active | "Since <date>" (no chip) | "Scope active" (**drawn nowhere** — §7) |
| scope withdrawn | "Withdrawn <date> · “reason”" + Restore scope | withdrawn (reason) |

**Transitions**
| From | To | Command | Actor |
|---|---|---|---|
| — | holder, no scope | `registerHolder` | Super Admin |
| holder | + scope active | `assignScope` | Super Admin |
| scope active | withdrawn | `withdrawScope` (DL-2 reason) | Super Admin |
| withdrawn | scope active | `restoreScope` (confirm, no reason) | Super Admin |

---

### M26 Mock session and identity
Boards: B1-09 (XS-01/03/04), 05/06 (XS-05 account menu), 08 (XS-06, XS-08).

```ts
export interface MockSession {
  readonly sessionKey: string;                    // query-cache partition (Slice-1 salvage: session-keyed queries)
  readonly personId: PersonId;                    // the only thing the session stores
  readonly role: Role;                            // resolved from records, one role per person (XS-02 DEFER)
  readonly displayName: string;                   // 'Rahul Verma'
  readonly institutionId: InstitutionId | null;   // tenant roles
  readonly organisation: string | null;           // Vendor organisation; platform roles show '— (platform role)'
  readonly signedInAt: IsoInstant;
  readonly returnTo: string | null;               // 'Sign in again to go back to where you were: My courses › Shell-and-Tube Heat Exchanger'
}
export type ShellBanner = 'institution-paused' | 'account-inactive';   // XS-08 — derived on every read
```
**CONFIRMED**
- [C] "Sign in with your institution" (button; annotation "Sign in with your institution (single sign-on) and Sign in with e-mail") and "Sign in with e-mail"; e-mail — "Enter your e-mail address" / "Enter an e-mail address like name@institution.edu" (kept after wrong details); password — "Enter your password" (cleared after wrong details; Show/Hide); wrong details "The e-mail or password isn’t right — Check both and try again." (B1-09).
- [C] Each person lands on their role's home; session expiry returns them to the page they were on (B1-09 'Session expired'; U:DR BR-008). "Forgot your password? Contact your institution administrator to reset it." (XS-04).
- [C] Account menu: "Rahul Verma · Student · Godavari Institute of Technology" (initials RV); platform roles "— (platform role)"; Vendor shows its organisation; "My device" only for Students with AR/VR/MR (06).
- [C] Another workspace's address → XS-06 "This page isn’t part of your workspace" (08). Banners: paused and inactive (08 XS-08).
- [C] Never: role switcher, "Viewing as…", sample-account chooser, workspace chooser — "Never here: DEMO strips, sample accounts, a role switcher, “Viewing as…”, or a “choose a workspace” step" (B1-09 'Never here'; 06). The owner constraint extends this to **developer-only** account selectors: there is none, in any build.

**PROPOSED**
- [P] Session stores `personId` only; role, institution and organisation are re-resolved from records on every call (U:RB slice1 identity principle).
- [P] Sample people sign in **only** through `SessionService.signIn`, by typing a fixture test credential into the drawn XS-01 form. Test credentials live in a sample-world fixture file, never in product copy and never listed by any screen or port.
- [P] Automated tests reach a person by seeding the session in the test harness (an in-memory `MockSession` passed to the adapter factory) — never through a UI control.

**UNRESOLVED**
- [U] T-10 / T-11: identity provider, SSO, password policy, invitations, activation.

**Status → labels**: signed in · banner "Your institution’s access is paused — your work is kept" / "Your account is inactive. Contact your institution administrator." (XS-08); signed out / "Your session ended" notices on Sign in (XS-03 is a notice, not a page — U:HC).

**Transitions**: `signed out → signed in` (`signIn`, any sample person with a fixture credential) · `signed in → signed out` (`signOut`) · `signed in → expired` (expiry triggered only by a test harness; returns to the page after sign-in) · role and institution never change inside a session (XS-02 DEFER).

---

### M27 Derived read models (service-computed, never stored)
These carry board figures; the UI never computes them.

```ts
export interface UsageRow {                                    // IA-20 (B3-10) — 'figures up to 24 Oct 2026'
  readonly experimentId: ExperimentId;
  readonly studentsWithAccess: Provided<number>;               // 'Students who can open the experiment today. Each student counts once, however they were given it.'
  readonly perFormat: readonly { readonly format: Technology; readonly started: Provided<number>; readonly completed: Provided<number>; readonly sessions: Provided<number> }[];
}
export interface AccessEndingRow {                             // SA-22 (B7-09 f4)
  readonly institutionId: InstitutionId; readonly planId: AccessPlanId;
  readonly endsOn: CalendarDate; readonly daysLeft: number | null; readonly endedDaysAgo: number | null;
  readonly standing:
    | { readonly kind: 'renewal-in-progress'; readonly requestId: RequestId }   // 'Renewal in progress · REQ-0038 under review'
    | { readonly kind: 'reminder-due' }                                          // 'Reminder due · Nothing is sent from here'
    | { readonly kind: 'ended-no-renewal' };                                     // 'Access ended · No renewal requested'
}
export interface AttentionRow { readonly text: string; readonly context: string; readonly action: { readonly label: string; readonly target: RecordRef | string } }
export interface FacultyStudentRow {                           // FA-20 (B4-10)
  readonly studentId: PersonId; readonly institutionStudentId: string;
  readonly perFormat: readonly FormatProgressView[];
  readonly assessment: AttemptResult | { readonly kind: 'none-set' } | { readonly kind: 'to-do' };
  readonly resultReleased: boolean;
  readonly lastActivityAt: IsoInstant | null;                  // opening a format or the assessment (sample, OD-B4-10)
  readonly inactiveDays: number | null;                        // filter 7 / 14 / 30; tag at ≥ 14
}
```
- [C] Usage figures and definitions (B3-10); no charts, percentages, licence usage, exports, Reports page, feedback column (B3-10 'Not designed'; OD-B3-08).
- [C] Access ending rows and words (B7-09 f4); "Reminder due" is a status only — nothing is sent (T-31).
- [C] Overview budgets: ≤ 3 sections, attention ≤ 5–6 rows (SA grouped ≤ 4 per group), one action each (U:DR BR-138); IA attention "12 students have no access yet · Imported on 8 Oct 2026 · Review students" (B2-01); SA figures "4 Active institutions; 13 Published experiments" (B7-01).
- [C] Faculty follow-up filter "Inactive for N days" 7 / 14 / 30 (B4-10; OD-B4-10).
- [U] OD-B3-08 / A-12 / D18: exact usage definitions and who may see them; STK31-28 reminder is a REQUIRED capability the in-product state does not discharge (expose `ReminderDue` events, send nothing — §3.17).
- [P] Read models are recomputed by the service on every read from the one store (no cached aggregates), so every role sees the same figure after any command; they have no status and no transitions of their own.

---

### M28 History / audit
Shape in §1.6. **History is written per command as the boards draw it — not on every command.** An entry carries the actor resolved from the session (or a system actor), the reason/note as entered, and `visibleTo` per the drawn reader rule. The Vendor's record history is presented as "not an audit log" (B5-06) — same entries, filtered and worded for the Vendor. Nothing is hard-deleted (BR-126). Commands not listed below write **no** history entry (reads, previews, `saveAnswer`, `openResource`, `launchWebFormat`, `sendFeedback`, `signIn`/`signOut` — their own records carry their timestamps).

| Command(s) | Record(s) that get an entry | Drawn wording (evidence) | Label |
|---|---|---|---|
| `submitPublicRequest` | REQ | "Request submitted · 2 Oct 2026, 10:14 · Meera Iyer, contact person" (B1-08) | [C] |
| review started (trigger [U]) | REQ | "BITS started reviewing" (B1-08) | [C] wording · [U] trigger |
| `requestMoreInformation` | REQ | "BITS asked for more information · “<reason>”" (B1-08) | [C] |
| `approveRequest` / `approveSmallerScope` | REQ; INST (new institution: created) | requester "Approved — payment needed · Approved as requested." / "Approved with changes — payment needed · “<reason>”" / internal "Approved" (B1-08); IA plan page "Request approved · External" (B2-03); SA "Decided by you · 8 Oct 2026, 11:20 · External" (B1-11 `doneMeta`) | [C] |
| `startPayment` | REQ | "Payment started · Waiting for confirmation." (B1-08) | [C] |
| payment outcome (stand-in) | REQ; on activation ACC and INST | "Payment not completed" / "Payment confirmed" / "Access active · Access plan ACC-0107." (B1-08); ACC "Access activated · Payment confirmed for REQ-0042. Plan ACC-0107 created." (B2-03); INST "Access active · ACC-0091 · Payment confirmed." (B7-02 data) | [C] |
| `submitRenewalRequest` / `submitAdditionalLicencesRequest` | REQ; INST | IA "Sent to BITS · 21 Oct 2026, 16:05 · Meera Iyer · 60 more licences · Shell-and-Tube Heat Exchanger" (B3-08); SA "Request REQ-0040 received - additional licences" (B7-02 data) | [C] |
| `assignInstituteAdmin` | INST | "Institute Admin assigned - R. Bhatt · 3 Aug 2026" (B7-02 data) | [C] |
| `pauseInstitution` / `restoreInstitution` | INST; ACC | "Paused on 12 Oct 2026 · “<reason>”" (B7-03); "Access paused by BITS" (B2-03); reason "kept in the history" (B7-03 f7) | [C] |
| `overrideStudentStatus` | PER | "An override — kept in the history." (B7-03 f8) | [C] |
| `addStudent` / `commitStudentImport` / `addFaculty` | PER | "Added to People · 8 Oct 2026, 16:10 · Meera Iyer · Imported from godavari-me-zg523.csv" (B2-06) | [C] (form wording [P]) |
| `deactivateStudent` / `reactivateStudent` | PER | "Account deactivated" (B2-06); reactivation wording not drawn | [C] / [P] |
| `giveAccess` | SACC; ACC; PER | ACC "Rahul Verma given Shell-and-Tube Heat Exchanger · 9 Oct 2026, 10:20 · Meera Iyer · SACC-0310 · individually" (B2-03); PER "Given Shell-and-Tube Heat Exchanger" / "Given … through the group ME ZG523 — Sem II" (B2-06) | [C] |
| `withdrawGrant` | SACC; PER | "Individual grant SACC-0310 withdrawn" + reason, visible to the institution's administrators (B2-06; B2-04 hint) | [C] |
| `createGroup` / `renameGroup` / `addMembers` / `removeMember` | GRP | not drawn (B2-08 shows no group history) | [P] |
| FMAP `assign` / `remove` | FMAP | record line "Assigned 9 Oct 2026 · Meera Iyer · FMAP-0021" (B2-06 f15); no history list drawn | [P] |
| CCODE `set` | CCODE | not drawn | [P] |
| `createAssessment` / `updateSettings` / `updateQuestions` / `useUpdatedVersion` | ASMT | meta "Created 26 Oct 2026, 16:40 by you · ready since 27 Oct 2026, 11:05" (B4-05); new version "Version 2 since 8 Nov 2026" (B4-05/06); no history list drawn | [C] meta · [P] entries |
| `addQuestion` / `editQuestion` / `deleteQuestion` / `addDraftToBank` / `commitQuestionImport` | Q | "Added 20 Oct 2026"; "deleted 7 Nov 2026 · history kept" (B4-07) | [C] |
| `startAttempt` / `submitAttempt` / `saveMark` / `confirmMarks` / release | ATT (own timestamps, no history list) | "Submitted 5 Nov 2026, 18:52"; "Mark saved — not confirmed yet"; "Marks confirmed 7 Nov 2026, 10:15 · Dr S. Ranganathan"; "Released 14 Nov 2026, 23:59" (B4-09, B4-13) | [C] fields · no entries |
| Vendor `saveDraft` | SUB | **first save only**: "Draft saved · Only you can see a draft." (B5-0x script `saveDraft`, `const first = s.mode === 'new'`); later saves write none | [C] |
| `submitForReview` | SUB | "Submitted for academic review · With the Academic Reviewer. Nothing is published." (B5-07 data) | [C] |
| `saveRevision` | — | **none** — message "Changes saved · <time> · not resubmitted yet" only (B5-0x script; U:vendor VE-08 "no history entry") | [C] |
| `resubmit` / routing | SUB | "Submitted · revision <n>"; "With Academic Reviewer · revision <n> · Routed by the approved workflow rule." (B5-08 script `route`) | [C] |
| `approveSubmission` / `returnSubmission` | SUB | "Approved by <reviewer>" / "Returned by <reviewer>" + reason (B6-07/B6-08 script vocabulary; B5-07 data "Academic Reviewer: “Please clarify the VR device requirements.”") | [C] |
| `publish` | SUB; EXP | "Published by the Content Manager"; EXP "Published · version 1.0 · ‘First publication’" (B6-07/B6-08) | [C] |
| `sendBack` | SUB | "Sent back to the Academic Reviewer by …" / "Sent back to the vendor by …" (B6-07 script) | [C] |
| `overrideStatus` | SUB | entry with the Super Admin's name and reason ("Add a reason — it is kept in the history", B7-06 f5) | [C] |
| `openCorrection` | UPD | **new draft only**: "Correction started from <Start a correction \| Edit catalogue details \| Edit delivery link> · Pre-filled with the live version 1.2." (B6-09 script `start`); joining an open draft writes none | [C] |
| `saveCorrection` | — | **none** — message "Draft saved · <time> · the live version is unchanged" only (B6-09 script `o.saveDraft`) | [C] |
| `sendForAcademicReview` | UPD | "Sent for academic review · To Prof. A. Menon. The live version 1.2 is unchanged." (B6-09) | [C] |
| `withdrawUpdate` / `approveUpdate` / `returnUpdate` | UPD | "Withdrawn" + reason; "Approved by Prof. A. Menon"; "Returned by Prof. A. Menon" + reason (B6-09, B7-05 script vocabulary) | [C] |
| `releaseUpdate` / `holdUpdate` / `liftHold` | UPD; EXP (release) | "Released by Arjun Mehta"; "Put on hold by Arjun Mehta" + reason; "Hold lifted by Arjun Mehta" (B7-05 script); EXP "Version 1.2 released · 3 Jul 2026 · ‘Correction UPD-0002 — released by the Super Admin.’" (B6-08) | [C] |
| `addArea` / `addCourse` / `rename` / `moveCourse` | AREA / CRS | "Course added by Arjun Mehta" (B7-07 data); other wording not drawn | [C] / [P] |
| `save` (platform codes) | CRS | "Platform code ME ZG523 set by the Content Manager" (B7-07 data) | [C] |
| `registerHolder` | ROLE | "Registered as Vendor · 4 Jul 2026 · Arjun Mehta · scope …" (B7-08 data) | [C] |
| `assignScope` | ROLE | "Scope assigned - <X> · Arjun Mehta"; **and** the matching row leaves the *withdrawn-scope list* (B7-08 script `wd.filter(…)`) — the earlier "Scope withdrawn - <X>" history row stays | [C] |
| `withdrawScope` | ROLE | "Scope withdrawn - <X>" + reason kept with the scope (B7-08) | [C] |
| `restoreScope` | ROLE | "Scope restored - <X>"; the row leaves the withdrawn-scope list (B7-08 script) | [C] |
| `requestDeviceTransfer` / `forwardDeviceTransfer` / `approveDeviceTransfer` | DTR (+ AuthorisedDevice on approve) | "Requested by …" / "Forwarded to BITS by …" / "Approved by BITS" (B3-07, B3-09, B7-09 script) | [C] |
| `reportProblem` / `resolveReport` / `reopenReport` | SUP | "Sent" / "Resolved" (+ note the reporter sees) / "Reopened" (07, B7-09) | [C] |

- [P] Re-assigning or restoring a scope keeps the old `RoleScope` (with its withdrawal and reason) in the record, marked superseded, and hides it from the withdrawn list as drawn — so the board's list removal is **not** a hard delete and does not conflict with BR-126 (the history rows survive on B7-08).

---

## 3. Mock service contracts

B8-06 'Mock services' (verbatim scope): "Typed service interfaces for requests, institutions, access, people, progress, feedback, assessments, marking, submissions, publication, corrections, structure, roles, operations — returning the sample world. Real auth, payment, XR runtimes, grading automation and persistence stay out until decided." B8-06 'Shared state': "One application store for every record in B8-07, so a decision in one role’s screen is what every other role sees."
Everything in this section is **[P] PROPOSED** unless a line is tagged [C] or [U]; preconditions and side effects restate the [C]/[U] items of §2.

### 3.0 Conventions

```ts
export type Result<T, E extends ServiceError = ServiceError> =
  | { readonly ok: true; readonly value: T; readonly changed: readonly RecordRef[] }   // every record this call wrote
  | { readonly ok: false; readonly error: E };

export interface FieldError { readonly field: string; readonly message: string }    // message = exact board copy (§5)

export type NotPermitted     = { readonly kind: 'not-permitted'; readonly why: 'wrong-workspace' | 'out-of-scope' | 'not-own-record' };
export type NotFound         = { readonly kind: 'not-found' };
export type InvalidState     = { readonly kind: 'invalid-state'; readonly current: string };
export type Refused<C extends RefusalCode = RefusalCode> = { readonly kind: 'refused'; readonly code: C };
export type ValidationFailed = { readonly kind: 'validation-failed'; readonly fieldErrors: readonly FieldError[]; readonly summaryTitle: string | null };
export type StaleVersion     = { readonly kind: 'stale-version'; readonly currentRev: number };
export type Conflict         = { readonly kind: 'conflict'; readonly code: 'duplicate' | 'already-sent' | 'already-exists' };
export type PolicyOpen       = { readonly kind: 'policy-open'; readonly decision: string };   // an undecided rule was reached, e.g. 'OD-B2-01'
export type Unavailable      = { readonly kind: 'unavailable' };                             // simulated failure → "error + retry · Nothing was lost"
export type ServiceError = NotPermitted | NotFound | InvalidState | Refused | ValidationFailed | StaleVersion | Conflict | PolicyOpen | Unavailable;

/** Drawn refusals — each has its own words (table below). OpenRefusal (M15) covers the Student open gate. */
export type RefusalCode =
  | OpenRefusal
  | 'plan-ended' | 'nothing-held' | 'access-not-active' | 'renewal-scope-not-adjustable' | 'selection-empty'
  | 'assessment-exists' | 'course-not-assigned' | 'course-has-people-filed' | 'publication-blocked' | 'update-already-open'
  | 'not-yet-forwarded' | 'transfer-already-open' | 'format-not-completed' | 'hold-must-be-lifted'
  | 'marks-confirmed' | 'no-attempts-left' | 'previous-not-released' | 'submit-checklist-incomplete' | 'override-not-stuck'
  | 'wrong-details' | 'last-format-locked';
```

**Drawn refusals (`RefusalCode`) and their copy**
| Code | Copy (board) |
|---|---|
| `institution-paused` | IA: "You can’t give or withdraw access until BITS lifts the pause." (B2-02/03/04) · every other IA write: "Pages are read-only until BITS lifts the pause." (B2-01 paused frame; per-page presentation not drawn for IA-06…IA-15, IA-17 [U]) · SA: "Requests from a paused institution can’t be decided. You can decide this one once the pause ends." (B1-11 f14) · Student DTR: "You can’t request a transfer while your institution’s access is paused." (B3-07) · IA DTR: "You can’t forward requests right now" (B3-09) · Student: "You can’t open experiments right now" (B7-04) |
| `plan-ended` · `nothing-held` | Give students access refusal pages (B2-05 f15–17) |
| `access-not-active` | "The Institute Admin is assigned once access is active." (B7-03 f3) |
| `renewal-scope-not-adjustable` | "Not available for a renewal — the term continues the current plan." (B1-11 f13) |
| `assessment-exists` | "This experiment already has an assessment" + link (B4-04) |
| `course-not-assigned` | "<code> is no longer one of your assigned courses. Choose one of your courses." (B5-03) |
| `course-has-people-filed` | Move blocked while students or Faculty are filed (B7-07 f3–4) |
| `publication-blocked` | "Possible once nothing is missing." (B6-07) |
| `update-already-open` | only "Open update" (B6-08) |
| `not-yet-forwarded` | "Not BITS’s to decide yet — shown read-only." / "Approve appears only once it is forwarded." (B3-11 f2, B7-10 f14) |
| `transfer-already-open` | button hidden while a request is open (B3-07; OD-B3-03 assumption) |
| `format-not-completed` | no feedback entry (B3-06 "No disabled button") |
| `hold-must-be-lifted` | "No Release button while held" (B7-10 f2) |
| `marks-confirmed` | "Confirmed marks can’t be changed." (B4-09) |
| `no-attempts-left` · `previous-not-released` | Try again only when not passed and an attempt is left (B4-13) — second code [U] |
| `submit-checklist-incomplete` | missing items with links; nothing is sent (B5-05) |
| `override-not-stuck` | "In the workflow — someone can act … nothing to do here." (B7-06 f4) |
| `not-given` · `no-longer-given` · `access-ended` · `student-inactive` · `waiting-for-a-licence` · `format-not-in-plan` · `format-not-published` · `overlap-policy-open` (OpenRefusal, M15) | ST-19 family / XS-08 (08; B2-10; B3-02); `overlap-policy-open` has no drawn copy (OD-B2-01) |
| `selection-empty` | request flow starts at the Selection (B1-06); copy for an empty submit not drawn — PROPOSED guard |
| `wrong-details` | "The e-mail or password isn’t right — Check both and try again." (B1-09) |
| `last-format-locked` | "At least one format stays chosen. To take this experiment out, use Remove." (B1-06) |

- [C] "No Institute Admin" is **not** a refusal: a Student's device-transfer request is created and waits (B3-07 state `dn`); the read fact `DeviceTransferView.forwardingBlocked: 'no-institute-admin'` drives the drawn notice (M23, §3.16).
- [P] **Error-union rule** applied to every port: every product write carries `NotPermitted` (wrong workspace, out of scope, not own record; the public `submitPublicRequest` and the browser-session `SelectionService` excepted by design); every write with a drawn state precondition carries `InvalidState`; every write with a drawn failure frame carries `Unavailable` (B2-05 'Give access fails', B3-03 'Couldn't open + try again', B3-06 'Sending fails + try again', B4-12 'Submit fails + try again', B4-12 autosave "Your last answer didn't save", B3-01 "couldn't open + try again"). `reportProblem` keeps `Unavailable` as a [P] simulated failure (07 draws only "Sending…", no failure frame).

**Rules every port follows**
1. **The caller is never a parameter.** Each adapter reads the `MockSession` and resolves role, institution and scope from records on every call (Slice-1 `types.ts` / `access-adapter.ts` pattern, U:RB salvage). A call from the wrong workspace returns `not-permitted` (UI: XS-06 or the action is simply absent).
2. **Writes carry `expectedRev`** for each record they change; a mismatch returns `stale-version` (cross-tab, BC-14).
3. **Preview → apply** where the board draws a review step (Give students access step 3, both CSV imports, course move, smaller-scope difference). Preview writes nothing; refusals are values, not exceptions.
4. **`changed` drives one connected state.** The store emits one change event per command; every role's queries are keyed by `[sessionKey, recordKind, id]` and invalidated by kind + id, so SA approval is visible in the requester's status page, the IA overview and the SA list at once.
5. **Reads return canonical states plus the facts a label needs** (dates, revision, who has it) — never pre-rendered status words (§1.5).
6. **No rule lives in a screen.** Pure rules (readiness, open gate, publication check, release time, label selection inputs) live in `@xr/domain`; adapters compose them over the store.
7. **System events come only through the test/seed-only stand-in ports of §3.18** — called by the seed loader and test harnesses, never through a control of any kind (no product control, no developer surface, no account switcher).
8. **HTTP mapping later** (committed `1b090c9:v2/packages/contracts/src/problem.ts`): `validation-failed` → 422 `errors[{path,message}]`; `not-permitted` → 403; `not-found` → 404; `invalid-state` / `refused` / `conflict` / `stale-version` → 409 with a typed `type` URI; `policy-open` → 409 `type: …/policy-open`. The same contract test suite runs against the mock and a future HTTP adapter.

---

### 3.1 SessionService (identity) — XS-01, XS-03, XS-04, XS-05, XS-06, XS-08

```ts
export interface SessionService {
  signIn(input: { readonly method: 'email'; readonly email: string; readonly password: string } | { readonly method: 'sso' })
    : Promise<Result<{ readonly session: MockSession; readonly landing: string }, ValidationFailed | Refused<'wrong-details'> | PolicyOpen | Unavailable>>;
  getSession(): Promise<Result<{ readonly session: MockSession; readonly banners: readonly ShellBanner[] } | null, Unavailable>>;
  signOut(): Promise<Result<{ readonly signedOut: true }, never>>;
  checkWorkspace(workspace: 'student' | 'faculty' | 'institute' | 'vendor' | 'reviewer' | 'content-manager' | 'admin')
    : Promise<Result<'allowed', NotPermitted>>;
}
```
| Method | Errors | Preconditions | Side effects on other records | Screens |
|---|---|---|---|---|
| `signIn` (email) | `validation-failed` ("Enter your e-mail address", "Enter an e-mail address like name@institution.edu", "Enter your password"), `refused: wrong-details` | sample-world person with a test credential; any account status (inactive Students still sign in and see the banner, B1-09 f7) | none (no audit of sign-ins drawn) | XS-01 |
| `signIn` (sso) | `policy-open` (T-10: SSO drawn as a button/state only) | — | none | XS-01 |
| `getSession` | — | — | none; `banners` derived from institution pause and account status | every shell (XS-05, XS-08) |
| `signOut` | — | signed in | none | XS-05 → XS-03 notice |
| `checkWorkspace` | `not-permitted: wrong-workspace` | — | none | XS-06 |
- [U] Session expiry (XS-03 "Your session ended — Sign in again to go back to where you were") needs a mock expiry trigger — test-harness only, no UI control.
- [C] No method lists sample accounts or switches identity; sample people sign in through `signIn` only (owner constraint; B1-09 'Never here').

---

### 3.2 CatalogueService (public surface) — PU-01…PU-06, PU-15

```ts
export interface CatalogueService {
  listAreas(): Promise<Result<readonly AreaCard[]>>;
  getArea(areaId: AreaId): Promise<Result<{ readonly area: AreaCard; readonly courses: readonly CourseCard[] }, NotFound>>;
  getCourse(courseId: CourseId): Promise<Result<{ readonly course: CourseCard; readonly experiments: readonly CatalogueEntry[] }, NotFound>>;
  searchCatalogue(query: CatalogueQuery): Promise<Result<{ readonly total: number; readonly entries: readonly CatalogueEntry[] }>>;
  getExperiment(experimentId: ExperimentId): Promise<Result<PublicExperimentPage, NotFound>>;
}
export interface AreaCard { readonly id: AreaId; readonly name: string; readonly description: string | null; readonly artworkKey: string | null; readonly courseCount: number; readonly experimentCount: number }
export interface CourseCard { readonly id: CourseId; readonly name: string; readonly platformCode: PlatformCourseCode | null; readonly description: string | null; readonly formatsInCourse: readonly Technology[] }
export interface CatalogueQuery { readonly text?: string; readonly areaId?: AreaId; readonly format?: Technology; readonly sort: 'default' | 'title-a-z' | 'course-code' }
export interface CatalogueEntry {
  readonly experimentId: ExperimentId; readonly name: string; readonly summary: string;
  readonly courseId: CourseId; readonly courseName: string; readonly platformCode: PlatformCourseCode | null;
  readonly availableIn: readonly Technology[];   // published formats, display order
}
export interface PublicExperimentPage extends CatalogueEntry {
  readonly description: string; readonly areaName: string;
  readonly learningOutcomes: readonly string[];
  readonly formats: readonly { readonly format: Technology; readonly howItRuns: string; readonly deviceNeeds: string }[];
  readonly preview: PreviewLink | null;
  readonly versionLabel: string | null;          // [U] OD-B7-05 — null unless the owner makes it public
}
```
| Method | Errors | Preconditions | Side effects | Screens |
|---|---|---|---|---|
| `listAreas` | — | none (no sign-in) | none; counts from published experiments only | PU-01 (explorer, B1-02), PU-02 |
| `getArea` / `getCourse` | `not-found` | area/course exists | none | PU-02/03, PU-05 (code chip omitted when blank) |
| `searchCatalogue` | — | — | none; placeholder "Experiment, course or code"; sort "Default order · Title A–Z · Course code" (B1-04) | PU-04 |
| `getExperiment` | `not-found` (unpublished or unknown → PU-15) | published | none; never states access or entitlement | PU-06, PU-15 |
- [C] A new experiment appears only after the Content Manager publishes it (B6-12 f5–6). A release changes what these reads return for everyone (B7-11 f5).

---

### 3.3 SelectionService (browser session only) — PU-06, PU-07, header

```ts
export interface SelectionService {   // synchronous; backed by sessionStorage with memory fallback
  get(): Selection;
  add(input: { readonly experimentId: ExperimentId; readonly formats: readonly Technology[] }): Result<Selection, ValidationFailed | NotFound>;
  setFormats(input: { readonly experimentId: ExperimentId; readonly formats: readonly Technology[] }): Result<Selection, ValidationFailed | Refused<'last-format-locked'> | NotFound>;
  remove(experimentId: ExperimentId): Result<Selection, NotFound>;
  undoRemove(): Result<Selection, InvalidState>;
}
```
| Method | Errors | Preconditions | Side effects | Screens |
|---|---|---|---|---|
| `add` | `validation-failed` "Choose at least one format to add." · `not-found` (unpublished) | formats ⊆ published formats | none outside the visitor's session | PU-06 |
| `setFormats` | `refused: last-format-locked` | item in selection | none | PU-07 |
| `remove` / `undoRemove` | `not-found` / `invalid-state` | — | none | PU-07 |
- [C] Emptied by `AccessRequestService.submitPublicRequest` (B1-07 'Sent').

---

### 3.4 AccessRequestService — PU-07…PU-14, IA-17, SA-01 (requests group), SA-02, SA-03

```ts
export interface AccessRequestService {
  // Public requester (no account)
  submitPublicRequest(input: PublicRequestInput): Promise<Result<{ readonly reference: RequestId; readonly statusToken: RequestStatusToken }, ValidationFailed | Refused<'selection-empty'> | Unavailable>>;
  getRequestStatus(token: RequestStatusToken): Promise<Result<RequesterRequestView, NotFound>>;
  startPayment(input:                                   // public requester (PU-12) OR the Institute Admin's own request (IA-17 → B1-08)
    | { readonly by: 'status-token'; readonly token: RequestStatusToken; readonly expectedRev: number }
    | { readonly by: 'institute-admin'; readonly requestId: RequestId; readonly expectedRev: number })   // resolved from the IA session
    : Promise<Result<RequesterRequestView, NotPermitted | NotFound | InvalidState | StaleVersion>>;
  // Institute Admin
  listInstitutionRequests(): Promise<Result<readonly RequestRow[], NotPermitted>>;
  getInstitutionRequest(id: RequestId): Promise<Result<RequesterRequestView, NotPermitted | NotFound>>;
  submitRenewalRequest(input: { readonly planId: AccessPlanId; readonly message: string | null }): Promise<Result<{ readonly reference: RequestId }, ValidationFailed | NotPermitted | InvalidState | Refused<'institution-paused'>>>;   // term mirrored from the plan (not 'current-plan')
  submitAdditionalLicencesRequest(input: { readonly planId: AccessPlanId; readonly experimentIds: readonly ExperimentId[]; readonly licences: string; readonly message: string | null }): Promise<Result<{ readonly reference: RequestId }, ValidationFailed | NotPermitted | InvalidState | Refused<'institution-paused'>>>;   // term = 'current-plan'
  // Super Admin
  listRequests(filter: { readonly status?: RequestStatus; readonly type?: RequestType; readonly route?: InstitutionKind | 'not-set'; readonly search?: string; readonly sort: 'received-newest' | 'received-oldest' }): Promise<Result<readonly RequestRow[], NotPermitted>>;
  getRequestForDecision(id: RequestId): Promise<Result<DecisionPage, NotPermitted | NotFound>>;
  approveRequest(input: { readonly id: RequestId; readonly route: InstitutionKind | null; readonly expectedRev: number }): Promise<Result<DecisionOutcome, DecisionErrors>>;
  approveSmallerScope(input: { readonly id: RequestId; readonly route: InstitutionKind | null; readonly items: readonly RequestedItem[]; readonly licences: string; readonly term: 'monthly' | 'quarterly' | 'yearly'; readonly reason: string; readonly expectedRev: number }): Promise<Result<DecisionOutcome, DecisionErrors | Refused<'renewal-scope-not-adjustable'>>>;
  requestMoreInformation(input: { readonly id: RequestId; readonly reason: string; readonly expectedRev: number }): Promise<Result<DecisionOutcome, DecisionErrors>>;
}
export interface PublicRequestInput {
  readonly institutionName: string; readonly contactPerson: string; readonly email: string; readonly phone: string | null;
  readonly licencesRequested: string;     // as typed; validated '/^[1-9][0-9]*$/'
  readonly message: string | null;
  readonly term: Exclude<RequestedTerm, { kind: 'current-plan' }>;
}                                          // items come from the Selection, never from the form
export interface RequestRow { readonly id: RequestId; readonly institutionName: string; readonly contactPerson: string; readonly type: RequestType; readonly route: InstitutionKind | null; readonly firstItem: RequestedItem | null; readonly itemCount: number; readonly receivedAt: IsoInstant; readonly status: RequestStatus }
export interface RequesterRequestView {
  readonly reference: RequestId; readonly institutionName: string; readonly status: RequestStatus; readonly reviewStarted: boolean;
  readonly updatedAt: IsoInstant;
  readonly asked: { readonly items: readonly RequestedItem[]; readonly licences: number; readonly term: RequestedTerm };
  readonly approved: { readonly items: readonly RequestedItem[]; readonly licences: number; readonly term: RequestedTerm; readonly changed: readonly ('items' | 'licences' | 'term')[] } | null;
  readonly whatBitsAsked: string | null; readonly whyItChanged: string | null;
  readonly nextStep: 'none' | 'continue-to-payment' | 'check-again' | 'try-payment-again' | 'sign-in';
  readonly activatedPlanId: AccessPlanId | null;
  readonly history: readonly HistoryEntry<RequestEvent>[];
}
export interface DecisionPage {
  readonly request: AccessRequest;
  readonly publishedFormats: Readonly<Record<ExperimentId, readonly Technology[]>>;
  readonly existingAccess: { readonly institutionId: InstitutionId; readonly plans: readonly AccessPlan[]; readonly paused: boolean } | null;
  readonly routeCommitted: InstitutionKind | null;          // set at first approval; later requests show it read-only
  readonly whereItStands: { readonly institutionRecord: 'not-created' | 'created'; readonly request: RequestStatus; readonly payment: 'not-needed' | 'waiting' | 'confirmed' | 'failed'; readonly institutionalAccess: 'not-active' | 'active' };
}
export interface DecisionOutcome {
  readonly request: AccessRequest; readonly institution: Institution | null; readonly plan: AccessPlan | null;
  /** What happened to access plans. 'policy-open' = renewal / more licences / new access for an existing institution
   *  reached OD-B3-09 (T-07, T-08): the mock writes no ACC change until the owner decides. */
  readonly planEffect: 'plan-created' | 'none-until-payment' | 'none' | { readonly kind: 'policy-open'; readonly decision: 'OD-B3-09' };
}
export type DecisionErrors = ValidationFailed | NotPermitted | NotFound | InvalidState | StaleVersion | Refused<'institution-paused'>;
```
| Method | Errors | Preconditions (state · role · scope) | Side effects on other records | Screens |
|---|---|---|---|---|
| `submitPublicRequest` | `validation-failed` (§5 copy; summary "There are N problems with this request"), `refused: selection-empty` | public surface; selection ≥ 1 item | creates REQ `under-review` with `statusToken` in the visitor's session; **empties the Selection**; appears in SA-02 and SA-01 requests group; **no INST, no ACC, no access** | PU-08 → PU-09 |
| `getRequestStatus` | `not-found` | token from this browser session — the reference alone opens nothing [U T-01] | none | PU-10, PU-13 |
| `startPayment` | `not-found` (unknown request, or token not held in this browser session); `not-permitted` (IA: request not from own institution, or not origin `institute-admin`); `invalid-state` (internal route, or not approved); `stale-version` | external; `approved-payment-required` or `payment-failed`; caller = holder of the status token (public) **or** the Institute Admin of the requesting institution ("Open the payment page", B3-08 later sample) | REQ → `payment-not-confirmed`; adds `PaymentAttempt(pending)`; nothing else changes until the provider reports (§3.18) — "Nothing changes until the payment is confirmed." (B3-08) | PU-12; IA-17 → B1-08 payment page (how the IA-side link reaches PU-12 without a public token is a routes matter, U:HC PU-10) |
| `listInstitutionRequests` / `getInstitutionRequest` | `not-permitted` | Institute Admin, own institution | none; the detail's `nextStep` is `continue-to-payment` / `try-payment-again` for an approved external request ("Open the payment page", B3-08) | IA-17 (list + detail states; detail has no screen ID — §7) |
| `submitRenewalRequest` | `validation-failed` "Choose what you need"; `invalid-state` (no plan); `refused: institution-paused` (general IA rule "Pages are read-only until BITS lifts the pause.", B2-01) [U — no paused IA-17 frame; B1-11 shows Konark's REQ-0040 pending from a paused institution, submission vs pause order not drawn] | Institute Admin; own plan | creates REQ type `renewal`, term **mirrored from the plan** (T-07; B3-08 "… 120 licences · Yearly · current plan ends 7 Oct 2027"); SA-22 row → "Renewal in progress · REQ-… under review"; plan unchanged | IA-17 |
| `submitAdditionalLicencesRequest` | `validation-failed` "Choose at least one experiment", "Enter the number of licences you need", "Enter a whole number, like 60"; `refused: institution-paused` (as above) | Institute Admin; experiments in own plan | creates REQ type `additional-licences`, `term: { kind: 'current-plan' }` (no term asked; SA sees "Current term"); plan unchanged until activation [U OD-B3-09] | IA-17 |
| `listRequests` | `not-permitted` | Super Admin | none; **no Declined filter** (T-02) | SA-02 (B1-10; sort must be a visible control below 760 px — BC-13) |
| `getRequestForDecision` | `not-permitted`, `not-found` | Super Admin | none | SA-03 |
| `approveRequest` | `validation-failed` "Choose a decision", "Choose internal or external"; `refused: institution-paused`; `invalid-state` (not `under-review`); `stale-version` | Super Admin; `under-review`; route required when not yet set | **Split by request type** (never creates SACC, BC-9; history per M28): **(a) `new-access` from a NEW institution** → creates INST (`kind` = route). Internal → creates ACC from the request, INST `access-active`, REQ `access-active` (approval + activation together, B1-11 confirm "Institutional access is **activated now** and the access plan is created."), `planEffect: 'plan-created'`. External → REQ `approved-payment-required`, INST `approved-payment-required`, no ACC ("Institutional access is **not activated now**. It is activated only after the payment is confirmed."), `planEffect: 'none-until-payment'`; SA-07 "Assign Institute Admin" becomes available only once access is active. **(b) `renewal`, `additional-licences`, or `new-access` from an EXISTING institution** → INST status **unchanged** (it stays derived from its existing plans; Godavari stays Access active while its more-licences request is "Approved - payment required", B3-08). External → REQ `approved-payment-required`, `planEffect: 'none-until-payment'` ("Nothing changes until the payment is confirmed.", B3-08). Internal (e.g. REQ-0038 renewal of ACC-0081, B1-11) → REQ `access-active`, `planEffect: { kind: 'policy-open', decision: 'OD-B3-09' }` — **no new ACC, no licence or end-date change** until the owner decides (T-07, T-08). | SA-03 |
| `approveSmallerScope` | as above + "Keep at least one format", "Enter a whole number of licences", "Change at least one thing, or choose Approve request", "Enter the reason for the change"; `refused: renewal-scope-not-adjustable` | as above; not for renewals | as `approveRequest` with the approved scope; requester sees "Why it changed" and "Changed" cells | SA-03, PU-10 |
| `requestMoreInformation` | "Enter what you need from the requester" | Super Admin; `under-review` | REQ → `information-requested`; requester sees "What BITS asked"; **none of the four events happen**; no exit transition drawn [U T-03] | SA-03, PU-10, IA-17 |

---

### 3.5 InstitutionService (+ access plans) — SA-06, SA-07, IA-01, IA-02, IA-03

```ts
export interface InstitutionService {
  // Super Admin
  listInstitutions(filter: { readonly tab: 'all' | 'access-active' | 'ending-soon' | 'access-paused' | 'approved-payment-required' | 'access-ended' | 'no-institute-admin'; readonly search?: string }): Promise<Result<readonly InstitutionRow[], NotPermitted>>;
  getInstitution(id: InstitutionId): Promise<Result<InstitutionDetail, NotPermitted | NotFound>>;
  assignInstituteAdmin(input: { readonly institutionId: InstitutionId; readonly name: string; readonly workEmail: string; readonly expectedRev: number }): Promise<Result<Institution, ValidationFailed | NotPermitted | Refused<'access-not-active'> | Conflict | StaleVersion>>;
  pauseInstitution(input: { readonly institutionId: InstitutionId; readonly reason: string; readonly expectedRev: number }): Promise<Result<Institution, ValidationFailed | NotPermitted | InvalidState | StaleVersion>>;
  restoreInstitution(input: { readonly institutionId: InstitutionId; readonly reason: string; readonly expectedRev: number }): Promise<Result<Institution, ValidationFailed | NotPermitted | InvalidState | StaleVersion>>;
  overrideStudentStatus(input: { readonly studentId: PersonId; readonly to: AccountStatus; readonly reason: string; readonly expectedRev: number }): Promise<Result<StudentPerson, ValidationFailed | NotPermitted | InvalidState | StaleVersion>>;
  // Institute Admin
  getMyOverview(): Promise<Result<{ readonly institution: Institution; readonly status: InstitutionStatus; readonly plan: AccessPlan | null; readonly attention: readonly AttentionRow[] }, NotPermitted>>;
  listContentAccess(): Promise<Result<readonly { readonly course: CourseCard; readonly items: readonly AccessPlanItem[]; readonly publishedNotInPlan: readonly Technology[]; readonly institutionCode: InstitutionCourseCode | null }[], NotPermitted>>;
  getAccessPlan(planId: AccessPlanId): Promise<Result<{ readonly plan: AccessPlan; readonly status: AccessPlanStatus; readonly studentsGiven: number }, NotPermitted | NotFound>>;
}
export interface InstitutionRow { readonly id: InstitutionId; readonly name: string; readonly kind: InstitutionKind; readonly status: InstitutionStatus; readonly instituteAdminName: string | null; readonly accessEndsOn: CalendarDate | null; readonly planSummary: string }
export interface InstitutionDetail {
  readonly institution: Institution; readonly status: InstitutionStatus; readonly plans: readonly AccessPlan[];
  readonly people: { readonly students: number; readonly faculty: number; readonly studentList: readonly { readonly id: PersonId; readonly name: string; readonly institutionStudentId: string; readonly status: AccountStatus }[] };
  readonly report: readonly UsageRow[];                 // 'Institution report' — per format, never added up
}
```
| Method | Errors | Preconditions | Side effects on other records | Screens |
|---|---|---|---|---|
| `listInstitutions` / `getInstitution` | `not-permitted`, `not-found` | Super Admin | none | SA-06, SA-07 |
| `assignInstituteAdmin` | "Enter the person’s name", "Enter a work e-mail address", "Enter an e-mail address like name@institution.edu.in"; `refused: access-not-active`; `conflict` (already assigned) | Super Admin; INST ∈ {access-active, ending-soon, access-paused}; none assigned | creates IAA + a fixture test credential so that person can sign in to the IA workspace through `signIn` (mock); nothing is sent (T-11); IA-01 attention, SA-06 "Needs one" cleared; the institution's waiting device-transfer requests become forwardable (`forwardingBlocked` clears; IA-18 "Waiting on you") | SA-07 |
| `pauseInstitution` | "Add a reason — it is kept in the history"; `invalid-state` (not active/ending soon) | Super Admin | INST pause set → ACC reads "Paused"; IA/Faculty/Student shells get the paused banner; Students' open gates → `institution-paused`; IA commands refuse (`institution-paused`); SA request decisions for this institution refuse; device forwarding refuses; **work, grants and progress untouched** | SA-07, B7-04 effects on IA-01…, FA-01, ST-01… |
| `restoreInstitution` | same reason copy; `invalid-state` (not paused) | Super Admin | pause cleared; every effect above reverses; history keeps both reasons | SA-07 |
| `overrideStudentStatus` | "Add a reason — it is kept in the history" | Super Admin; any institution | PER status changes (override recorded "The Institute Admin normally changes this."); Student banner / open gates follow; IA-07 shows the override in history | SA-07 |
| `getMyOverview` | `not-permitted` | Institute Admin | none; attention ≤ 6 rows (U:DR BR-138) | IA-01 |
| `listContentAccess` / `getAccessPlan` | `not-permitted`, `not-found` | Institute Admin, own plan | none; no amend control (T-08); licences as provided | IA-02, IA-03 |

---

### 3.6 People, groups, Faculty courses, institution course codes (Institute Admin) — IA-06…IA-11, IA-13…IA-16

```ts
export interface PeopleService {
  listStudents(filter: { readonly status?: StudentDirectoryStatus; readonly groupId?: GroupId; readonly search?: string }): Promise<Result<readonly { readonly student: StudentPerson; readonly directoryStatus: StudentDirectoryStatus }[], NotPermitted>>;
  getStudent(id: PersonId): Promise<Result<{ readonly student: StudentPerson; readonly groups: readonly Group[]; readonly grants: readonly StudentAccessGrant[] }, NotPermitted | NotFound>>;
  addStudent(input: { readonly fullName: string; readonly institutionEmail: string; readonly institutionStudentId: string; readonly programme: string | null; readonly groupId: GroupId | null }): Promise<Result<StudentPerson, ValidationFailed | NotPermitted | Refused<'institution-paused'>>>;
  addFaculty(input: { readonly fullName: string; readonly institutionEmail: string }): Promise<Result<FacultyPerson, ValidationFailed | NotPermitted | Refused<'institution-paused'>>>;
  previewStudentImport(input: { readonly fileName: string; readonly csvText: string }): Promise<Result<StudentImportReport, ValidationFailed | NotPermitted | Refused<'institution-paused'>>>;
  commitStudentImport(input: { readonly batchId: ImportBatchId }): Promise<Result<{ readonly added: number }, NotPermitted | InvalidState | Refused<'institution-paused'>>>;
  deactivateStudent(input: { readonly id: PersonId; readonly reason: string; readonly expectedRev: number }): Promise<Result<StudentPerson, ValidationFailed | NotPermitted | InvalidState | StaleVersion | Refused<'institution-paused'>>>;
  reactivateStudent(input: { readonly id: PersonId; readonly expectedRev: number }): Promise<Result<StudentPerson, NotPermitted | InvalidState | StaleVersion | Refused<'institution-paused'>>>;
  listFaculty(): Promise<Result<readonly { readonly faculty: FacultyPerson; readonly coursesTaught: readonly CourseId[] }[], NotPermitted>>;
  getFaculty(id: PersonId): Promise<Result<{ readonly faculty: FacultyPerson; readonly mappings: readonly FacultyCourseMapping[] }, NotPermitted | NotFound>>;
}
export interface StudentImportReport {
  readonly batchId: ImportBatchId; readonly fileName: string;
  readonly rowsChecked: number; readonly readyToImport: number;
  readonly rows: readonly { readonly row: number; readonly student: string; readonly whatToFix: string; readonly type: 'Error — blocks import' }[];
  readonly canImport: boolean;    // false while any error (all-or-nothing interim, T-24)
}
export interface GroupService {
  listGroups(): Promise<Result<readonly { readonly group: Group; readonly memberCount: number }[], NotPermitted>>;
  getGroup(id: GroupId): Promise<Result<{ readonly group: Group; readonly members: readonly { readonly student: StudentPerson; readonly standing: readonly GroupMemberStanding[] }[]; readonly grants: readonly StudentAccessGrant[] }, NotPermitted | NotFound>>;
  createGroup(input: { readonly name: string }): Promise<Result<Group, ValidationFailed | NotPermitted | Refused<'institution-paused'>>>;
  renameGroup(input: { readonly id: GroupId; readonly name: string; readonly expectedRev: number }): Promise<Result<Group, ValidationFailed | NotPermitted | StaleVersion | Refused<'institution-paused'>>>;
  addMembers(input: { readonly id: GroupId; readonly studentIds: readonly PersonId[]; readonly expectedRev: number }): Promise<Result<Group, NotPermitted | Conflict | StaleVersion | Refused<'institution-paused'>>>;
  removeMember(input: { readonly id: GroupId; readonly studentId: PersonId; readonly expectedRev: number }): Promise<Result<Group, NotPermitted | NotFound | StaleVersion | Refused<'institution-paused'>>>;
}
export interface FacultyCourseService {
  list(): Promise<Result<readonly FacultyCourseMapping[], NotPermitted>>;
  assign(input: { readonly facultyId: PersonId; readonly courseId: CourseId }): Promise<Result<FacultyCourseMapping, ValidationFailed | NotPermitted | Conflict | Refused<'institution-paused'>>>;
  previewRemoval(input: { readonly mappingId: FacultyCourseMappingId }): Promise<Result<{ readonly warning: { readonly writtenAnswersWaiting: number; readonly courseCode: string } | null }, NotPermitted | NotFound>>;
  remove(input: { readonly mappingId: FacultyCourseMappingId; readonly expectedRev: number }): Promise<Result<FacultyCourseMapping, NotPermitted | NotFound | StaleVersion | Refused<'institution-paused'>>>;
}
export interface InstitutionCourseCodeService {
  list(): Promise<Result<readonly { readonly course: CourseCard; readonly code: InstitutionCourseCode | null; readonly status: InstitutionCodeStatus }[], NotPermitted>>;
  set(input: { readonly courseId: CourseId; readonly code: string | null; readonly semester: string | null; readonly expectedRev: number | null }): Promise<Result<InstitutionCourseCode, ValidationFailed | NotPermitted | Refused<'institution-paused'> | StaleVersion>>;
}
```
| Method | Errors | Preconditions | Side effects on other records | Screens |
|---|---|---|---|---|
| `addStudent` | "Enter the full name", "Enter the institution e-mail", "Enter a full e-mail address, like name@godavari.edu.in", "This e-mail already belongs to someone in People", "Enter the student ID", "GIT-2026-0418 is already used by Rahul Verma" | Institute Admin, own institution | PER `active`, no experiments; optional group membership; IA-01 attention "N students have no access yet"; no invitation (T-11) | IA-10 |
| `addFaculty` | name / e-mail copy as above | Institute Admin | PER (faculty) `active`, no courses | IA-10 (faculty form) |
| `previewStudentImport` → `commitStudentImport` | "Choose a CSV file first"; row errors (§5); `invalid-state` when the report has errors | Institute Admin | commit creates every row or none; each Student gets `courseFilings` from `course` + `course_code` (enables SA-15 "Students filed" and the course-move block) | IA-11 |
| `deactivateStudent` | "Enter the reason for deactivating this account"; `invalid-state` (already inactive) | Institute Admin | PER `inactive`; Student shell banner; open gates → `student-inactive`; IA-04 rows "Student inactive"; group standing "Inactive"; Faculty lists keep the student; licence effect not stated (D7) | IA-07 |
| `reactivateStudent` | `invalid-state` | Institute Admin | reverse of the above ("the experiments Rahul has been given open again") | IA-07 |
| `createGroup` / `renameGroup` | "Enter a name for the group", "A group called “<name>” already exists" (create) | Institute Admin | GRP created (0 members) / renamed; IA-05 group choices update | IA-13 (DL-3 dialogs) |
| `addMembers` / `removeMember` | `conflict` (already a member) | Institute Admin | membership rows; a late member shows "Added after the group grant" — **no promise either way** [U OD-B2-02]; removal effect on group-given access [U] | IA-14 |
| `assign` (FMAP) | "Choose a faculty member", "Choose a course", "<name> already teaches <course>" | Institute Admin; active faculty; course in the institution's content access | FMAP created; Faculty workspace shows the course and the institution's experiments in it; **gives students nothing** | IA-15 |
| `previewRemoval` → `remove` | — | Institute Admin | FMAP removed; if no Faculty remain and written answers wait: IA-01 attention "no Faculty marker" (B4-09 f6) | IA-15 (DL-1 with warning) |
| `set` (CCODE) | "Add your course code, or clear the semester"; `refused: institution-paused` | Institute Admin | Student course labels switch to the institution code (T-17 [U]); IA-02 tag "Added" | IA-16 |
- [C] **Every write in this section refuses `institution-paused` while the institution is paused** — one rule applied uniformly: "Students can't open experiments. Pages are read-only until BITS lifts the pause." (B2-01 paused frame, caption "Batch-0 banner; no actions while paused."; U:institute-admin PE 'INST / all IA records', strength explicit-rule). Drawn per screen only on IA-04 withdraw, IA-05 give access, IA-16 course code (B2-03 f9) and IA-19 forwarding (B3-09).
- [U] How IA-06…IA-15 present the paused state (which controls hide, any per-page wording) is not drawn — screens reuse the drawn IA-04/IA-05/IA-16 pattern (banner + read-only) until the owner says otherwise (§8-33). Previews (`previewStudentImport`) refuse too, because the page is read-only.

---

### 3.7 StudentAccessService — IA-04, IA-05; Student ST-01…ST-05, ST-19

```ts
export interface StudentAccessService {
  // Institute Admin
  listGrants(filter: { readonly showWithdrawn: boolean; readonly experimentId?: ExperimentId; readonly search?: string }): Promise<Result<readonly GrantRow[], NotPermitted>>;
  getGiveAccessOptions(input: { readonly courseId?: CourseId; readonly preselectStudentId?: PersonId; readonly preselectGroupId?: GroupId }): Promise<Result<GiveAccessOptions, NotPermitted | Refused<'institution-paused' | 'plan-ended' | 'nothing-held'>>>;
  previewGiveAccess(input: { readonly experimentIds: readonly ExperimentId[]; readonly target: GrantTarget | { readonly kind: 'students'; readonly studentIds: readonly PersonId[] } }): Promise<Result<readonly PlannedGrant[], ValidationFailed | NotPermitted | Refused<'institution-paused' | 'plan-ended'>>>;
  giveAccess(input: { readonly experimentIds: readonly ExperimentId[]; readonly target: GrantTarget | { readonly kind: 'students'; readonly studentIds: readonly PersonId[] }; readonly expectedPlanRev: number }): Promise<Result<readonly GrantResult[], ValidationFailed | NotPermitted | Refused<'institution-paused' | 'plan-ended'> | StaleVersion | Unavailable>>;
  withdrawGrant(input: { readonly grantId: StudentAccessGrantId; readonly reason: string; readonly expectedRev: number }): Promise<Result<StudentAccessGrant, ValidationFailed | NotPermitted | InvalidState | Refused<'institution-paused'> | StaleVersion>>;
  // Student
  getMyHome(): Promise<Result<StudentHome, NotPermitted>>;
  listMyCourses(): Promise<Result<readonly MyCourseRow[], NotPermitted>>;
  getMyCourse(courseId: CourseId): Promise<Result<{ readonly course: MyCourseRow; readonly experiments: readonly MyExperimentRow[] }, NotPermitted | NotFound>>;
  getExperimentHub(experimentId: ExperimentId): Promise<Result<ExperimentHub, NotPermitted | Refused<OpenRefusal> | PolicyOpen>>;
}
export interface GrantRow { readonly grant: StudentAccessGrant; readonly student: StudentPerson; readonly experimentName: string; readonly courseCode: string | null; readonly formats: readonly Technology[]; readonly display: GrantDisplayStatus; readonly alsoInGroupGrant: StudentAccessGrantId | null; readonly wait: ProvidedLicenceWait | null }
export interface GiveAccessOptions {
  readonly plan: AccessPlan;                       // 'Access plan ACC-0107 · 120 licences · Yearly, ends 7 Oct 2027'
  readonly courses: readonly CourseCard[];
  readonly experiments: readonly { readonly experimentId: ExperimentId; readonly name: string; readonly inPlan: boolean; readonly formats: readonly Technology[] }[];
  readonly students: readonly { readonly id: PersonId; readonly name: string; readonly selectable: boolean;
    readonly why: 'already-has-it' | 'inactive' | null }[];   // IA-05 words: 'Already has <experiment>' · 'Inactive — can’t be given access' (B2-05 picker)
  readonly groups: readonly { readonly id: GroupId; readonly name: string; readonly memberCount: number; readonly selectable: boolean }[];   // empty group: 'Add members before giving access'
}
export interface PlannedGrant { readonly who: string; readonly experimentId: ExperimentId; readonly formats: readonly Technology[] }
export interface GrantResult { readonly who: string; readonly experimentId: ExperimentId; readonly grantId: StudentAccessGrantId; readonly display: 'active' | 'waiting-for-a-licence'; readonly note: string | null }
export interface StudentHome { readonly continue: MyExperimentRow | null; readonly upNext: readonly UpNextItem[]; readonly myCourses: readonly MyCourseRow[]; readonly noAccessYet: boolean }
export type UpNextItem = { readonly kind: 'format'; readonly experimentId: ExperimentId; readonly format: Technology } | { readonly kind: 'assessment'; readonly assessmentId: AssessmentId } | { readonly kind: 'feedback'; readonly experimentId: ExperimentId; readonly format: Technology };
export interface MyCourseRow { readonly courseId: CourseId; readonly name: string; readonly codeShown: string | null; readonly experimentsGiven: number; readonly formatsAvailable: readonly Technology[]; readonly earlierWork: boolean }
export interface MyExperimentRow { readonly experimentId: ExperimentId; readonly name: string; readonly formats: readonly { readonly format: Technology; readonly availability: 'available-to-you' | 'not-included-for-your-institution' | 'not-available-for-this-experiment' | 'not-available-right-now' /* [U] B2-12; no cause/record/writer designed — §7 D-26 */; readonly progress: FormatProgressStatus }[] }
export interface ExperimentHub { readonly experiment: PublicExperimentPage; readonly row: MyExperimentRow; readonly grantIds: readonly StudentAccessGrantId[]; readonly resourceSummary: { readonly total: number; readonly opened: number }; readonly assessment: { readonly id: AssessmentId; readonly result: AttemptResult | { readonly kind: 'to-do' } } | { readonly kind: 'none-set' } }
```
| Method | Errors | Preconditions | Side effects on other records | Screens |
|---|---|---|---|---|
| `listGrants` | `not-permitted` | Institute Admin | none | IA-04 |
| `getGiveAccessOptions` | `refused: institution-paused · plan-ended · nothing-held` | Institute Admin; INST not paused; an active plan | none; experiments not in plan listed "Not in your access plan"; already-has / inactive students not selectable; empty groups not selectable | IA-05 step 1–2 |
| `previewGiveAccess` | "Choose at least one experiment", "Choose at least one student, or switch to a group", "Choose a group" (summary "Check this step") | as above | none | IA-05 step 3 |
| `giveAccess` | as preview; `stale-version` (plan); `unavailable` → "nothing changes, error summary, try again" (B2-05 frame 'Give access fails · interactive') | as above | creates one SACC per student × experiment (individual) or per group × experiment; each grant is `active`, or carries a `ProvidedLicenceWait` **only if the LicenceAvailabilityOracle (§3.18) says so** — no counting [U D7]. **Student sees the experiment** (Home, My courses, hub) with formats inherited from the plan; Faculty assessment reach and FA-20 lists include the student; IA Usage "Students with access" changes; history on SACC and PER | IA-05 → result; ST-01/02/05; FA-08 reach; IA-20 |
| `withdrawGrant` | "Enter the reason for withdrawing access"; `invalid-state` (group grant, already withdrawn, student inactive [U]) | Institute Admin; individual grant; INST not paused | SACC `withdrawn`; Student: "no longer given", ST-19 "You no longer have access to this experiment", earlier work read-only; **other grants unchanged** — if a group grant covers the same experiment the outcome is `policy-open: OD-B2-01`; progress, feedback and attempts kept | IA-04 (DL-2), ST-01/02/19 |
| `getMyHome` / `listMyCourses` / `getMyCourse` | `not-permitted` | Student | none; only experiments given; course code shown per T-17 [U]; "Your institution hasn’t given you access yet." when none | ST-01, ST-02/04, ST-03 |
| `getExperimentHub` | ST-19 family refusals; `policy-open` (overlap OD-B2-01; a format "Not available right now" — not designed, D-26) | Student; open gate | none | ST-05, ST-19 |

---

### 3.8 LearningService — ST-06…ST-10, ST-15 (Student); RuntimeReportPort in §3.18

```ts
export interface LearningService {
  listResources(experimentId: ExperimentId): Promise<Result<readonly { readonly resource: LearningResource; readonly openedAt: IsoInstant | null }[], NotPermitted | Refused<OpenRefusal>>>;
  openResource(input: { readonly resourceId: ResourceId }): Promise<Result<{ readonly href: string; readonly openedAt: IsoInstant }, NotPermitted | NotFound | Refused<OpenRefusal> | Unavailable>>;
  getSimulationChooser(experimentId: ExperimentId): Promise<Result<readonly FormatProgressView[], NotPermitted | Refused<OpenRefusal>>>;
  getFormatPage(input: { readonly experimentId: ExperimentId; readonly format: Technology }): Promise<Result<{ readonly progress: FormatProgressView; readonly delivery: { readonly webLink: string } | { readonly setupSteps: readonly string[]; readonly deviceNeeded: string }; readonly gate: OpenGate; readonly authorisedDevice: AuthorisedDevice | null }, NotPermitted | NotFound>>;
  launchWebFormat(input: { readonly experimentId: ExperimentId }): Promise<Result<{ readonly href: string }, NotPermitted | Refused<OpenRefusal> | PolicyOpen | Unavailable>>;
  getMyProgress(): Promise<Result<readonly { readonly experimentId: ExperimentId; readonly name: string; readonly grantId: StudentAccessGrantId; readonly formats: readonly FormatProgressView[]; readonly assessment: AttemptResult | { readonly kind: 'none-set' } }[], NotPermitted>>;
}
```
| Method | Errors | Preconditions | Side effects on other records | Screens |
|---|---|---|---|---|
| `listResources` | open-gate refusals (paused: "Listed, not openable") | Student; experiment given | none | ST-06 |
| `openResource` | `unavailable` → "couldn’t open + try again" | open gate | first open writes `ResourceOpened` (FA-21 "Opened 12 Oct 2026, 09:40"); **never** progress | ST-06 |
| `getSimulationChooser` / `getFormatPage` | — / `not-found` | Student; given experiment | none; only formats given are offered; others read "Not included for your institution" / "Not available for this experiment" | ST-07, ST-08, ST-09 |
| `launchWebFormat` | open-gate refusals incl. `waiting-for-a-licence`; `unavailable` → "Couldn't open + try again — Nothing was lost." (B3-03 frame 'Couldn't open + try again'); `policy-open` (format "Not available right now", D-26) | WEB available to the Student; gate open | returns the web link (opens in a new tab). Records runtime activity (`firstOpenedAt`) **only if the owner decides a portal launch counts** [U]; otherwise activity comes from `RuntimeReportPort`. **Never writes completion.** | ST-08 |
| `getMyProgress` | — | Student | none; per format only; no aggregate | ST-10, ST-15 |

---

### 3.9 FeedbackService — ST-16, ST-17

```ts
export interface FeedbackService {
  getFeedbackState(input: { readonly experimentId: ExperimentId; readonly format: Technology }): Promise<Result<{ readonly state: 'not-eligible' } | { readonly state: 'eligible' } | { readonly state: 'sent'; readonly feedback: FormatFeedback }, NotPermitted>>;
  sendFeedback(input: { readonly experimentId: ExperimentId; readonly format: Technology; readonly ratings: readonly (Rating | null)[]; readonly comments: string | null }): Promise<Result<FormatFeedback, ValidationFailed | NotPermitted | Refused<'format-not-completed'> | Conflict | Unavailable>>;
}
```
| Method | Errors | Preconditions | Side effects | Screens |
|---|---|---|---|---|
| `getFeedbackState` | `not-permitted` | Student; own | none | ST-07…ST-10, ST-15, ST-01 Up next |
| `sendFeedback` | "Choose a rating" ×5 (summary "One rating is missing" / "N ratings are missing"); `refused: format-not-completed`; `conflict: already-sent`; `unavailable` → answers stay, "Nothing was lost." + try again (B3-06 frame 'Sending fails + try again') | Student; `FormatCompletion` exists for that format; none sent | creates FB; entry becomes "Feedback sent <date>"; **no staff read anywhere** (no Faculty/IA/SA method returns FB) | ST-16 → ST-17 |

---

### 3.10 AssessmentService + QuestionBankService — FA-06…FA-17, FA-22; ST-11…ST-14

```ts
export interface AssessmentService {
  // Faculty
  listAssessments(): Promise<Result<readonly { readonly assessment: Assessment; readonly readiness: AssessmentReadiness; readonly submitted: number; readonly reach: number; readonly waitingForMarking: number }[], NotPermitted>>;
  getCreateOptions(): Promise<Result<readonly { readonly experimentId: ExperimentId; readonly name: string; readonly courseCode: string | null; readonly existingAssessmentId: AssessmentId | null }[], NotPermitted>>;
  createAssessment(input: { readonly mode: 'create' | 'save-as-draft'; readonly experimentId: ExperimentId; readonly name: string; readonly introduction: string | null; readonly rules: AssessmentRulesInput; readonly questions: readonly QuestionId[] }): Promise<Result<Assessment, ValidationFailed | NotPermitted | Refused<'assessment-exists'>>>;
  getAssessment(id: AssessmentId): Promise<Result<{ readonly assessment: Assessment; readonly readiness: AssessmentReadiness; readonly reach: number; readonly totalMarks: number; readonly passMarkMarks: number | null; readonly questions: readonly { readonly ref: AssessmentQuestionRef; readonly question: Question; readonly newerVersion: number | null; readonly deletedFromBank: boolean }[] }, NotPermitted | NotFound>>;
  updateQuestions(input: { readonly id: AssessmentId; readonly questions: readonly AssessmentQuestionRef[]; readonly expectedRev: number }): Promise<Result<{ readonly assessment: Assessment; readonly newVersion: boolean }, ValidationFailed | NotPermitted | StaleVersion>>;
  useUpdatedVersion(input: { readonly id: AssessmentId; readonly questionId: QuestionId; readonly expectedRev: number }): Promise<Result<{ readonly assessment: Assessment; readonly newVersion: boolean }, NotPermitted | InvalidState | StaleVersion>>;
  updateSettings(input: { readonly id: AssessmentId; readonly name: string; readonly introduction: string | null; readonly rules: AssessmentRulesInput; readonly expectedRev: number }): Promise<Result<{ readonly assessment: Assessment; readonly newVersion: boolean; readonly releaseChanged: boolean }, ValidationFailed | NotPermitted | StaleVersion>>;
  previewAsStudent(id: AssessmentId): Promise<Result<{ readonly questions: readonly Question[]; readonly answerKey: readonly { readonly questionId: QuestionId; readonly correct: string | null; readonly markingGuidance: string | null }[] }, NotPermitted | NotFound>>;
  listSubmissions(id: AssessmentId): Promise<Result<readonly { readonly attempt: Attempt; readonly student: StudentPerson; readonly score: number | null; readonly releasedAt: IsoInstant | null }[], NotPermitted | NotFound>>;
  exportSubmissionsCsv(id: AssessmentId): Promise<Result<{ readonly fileName: string; readonly csv: string }, NotPermitted | NotFound>>;
  // Student
  listMyAssessments(): Promise<Result<readonly { readonly assessment: Assessment; readonly experimentName: string; readonly result: AttemptResult | { readonly kind: 'to-do' }; readonly attemptsUsed: number }[], NotPermitted>>;
  getAssessmentIntro(id: AssessmentId): Promise<Result<{ readonly assessment: Assessment; readonly totalMarks: number; readonly passMarkMarks: number; readonly attemptsUsed: number; readonly canStart: boolean }, NotPermitted | NotFound | Refused<OpenRefusal>>>;
  startAttempt(id: AssessmentId): Promise<Result<Attempt, NotPermitted | InvalidState | Refused<'no-attempts-left' | 'previous-not-released' | OpenRefusal>>>;
  saveAnswer(input: { readonly attemptId: AttemptId; readonly questionId: QuestionId; readonly answer: AnswerValue | null; readonly expectedRev: number }): Promise<Result<Attempt, NotPermitted | InvalidState | StaleVersion | Unavailable>>;
  submitAttempt(input: { readonly attemptId: AttemptId; readonly expectedRev: number }): Promise<Result<Attempt, NotPermitted | InvalidState | StaleVersion | Unavailable>>;
  getResult(attemptId: AttemptId): Promise<Result<{ readonly result: AttemptResult; readonly review: readonly AnswerReview[] | null }, NotPermitted | NotFound>>;
}
export interface AssessmentRulesInput { readonly passMarkPercent: string; readonly attemptsAllowed: string; readonly deadline: string; readonly releaseOption: ReleaseOption | null; readonly releaseDate: string | null }   // as typed
export interface AnswerReview { readonly questionId: QuestionId; readonly yourAnswer: AnswerValue | null; readonly correct: string | null; readonly explanation: string | null; readonly feedback: string | null; readonly awarded: number; readonly outOf: number }

export interface QuestionBankService {
  listQuestions(filter: { readonly experimentId: ExperimentId; readonly type?: QuestionType; readonly includeDeleted?: boolean }): Promise<Result<readonly { readonly question: Question; readonly usedIn: number }[], NotPermitted>>;
  getQuestion(id: QuestionId): Promise<Result<{ readonly question: Question; readonly usedIn: readonly AssessmentId[] }, NotPermitted | NotFound>>;
  addQuestion(input: QuestionInput): Promise<Result<Question, ValidationFailed | NotPermitted>>;
  editQuestion(input: QuestionInput & { readonly id: QuestionId; readonly expectedRev: number }): Promise<Result<{ readonly question: Question; readonly newVersion: boolean }, ValidationFailed | NotPermitted | StaleVersion>>;
  deleteQuestion(input: { readonly id: QuestionId; readonly expectedRev: number }): Promise<Result<Question, NotPermitted | InvalidState | StaleVersion>>;
  requestDrafts(input: { readonly experimentId: ExperimentId; readonly source: 'lab-brief' | 'pasted-text' | null; readonly pastedText: string | null; readonly types: readonly QuestionType[]; readonly howMany: 3 | 5 | null }): Promise<Result<readonly QuestionDraft[], ValidationFailed | NotPermitted | Unavailable>>;
  listDrafts(experimentId: ExperimentId): Promise<Result<readonly QuestionDraft[], NotPermitted>>;
  addDraftToBank(input: QuestionInput & { readonly draftId: QuestionDraftId }): Promise<Result<Question, ValidationFailed | NotPermitted | NotFound>>;
  discardDraft(input: { readonly draftId: QuestionDraftId }): Promise<Result<{ readonly discarded: true }, NotPermitted | NotFound>>;
  previewQuestionImport(input: { readonly experimentId: ExperimentId; readonly fileName: string; readonly csvText: string }): Promise<Result<QuestionImportReport, ValidationFailed | NotPermitted>>;
  commitQuestionImport(input: { readonly batchId: ImportBatchId }): Promise<Result<{ readonly added: readonly QuestionId[] }, NotPermitted | InvalidState>>;
}
export interface QuestionInput { readonly experimentId: ExperimentId; readonly type: QuestionType | null; readonly text: string; readonly options: Readonly<Partial<Record<ChoiceKey, string>>>; readonly correct: string | null; readonly marks: string; readonly explanation: string | null; readonly markingGuidance: string | null }
```
| Method | Errors | Preconditions | Side effects on other records | Screens |
|---|---|---|---|---|
| `createAssessment` | §5 copy (name, pass mark, attempts, deadline, release, release date, ≥ 1 question); `refused: assessment-exists` | Faculty; experiment in an assigned course and held by the institution; none exists for this experiment in the institution [U OD-B4-01] | ASMT created; **if ready: every Student who has the experiment sees it under To do** (ST-11, hub tab, Home Up next); FA-01 "Coming up" | FA-07 → result |
| `updateQuestions` / `useUpdatedVersion` / `updateSettings` | as create | Faculty (own / co-teaching); rules editable at any time | new version when attempts exist — earlier attempts keep theirs; `releaseChanged` flags the separate warning; readiness may change Student visibility | FA-09, FA-10 |
| `previewAsStudent` | — | Faculty | **creates no attempt, saves nothing** | FA-11 |
| `listSubmissions` / `exportSubmissionsCsv` | — | Faculty | none; CSV = the list on screen, incl. "result released to student" | FA-12, FA-22 |
| `listMyAssessments` / `getAssessmentIntro` | open-gate refusals | Student; has the experiment; assessment ready | none | ST-11, ST-12, hub Assessment tab |
| `startAttempt` | `refused: no-attempts-left · previous-not-released [U]` | Student; ready; attempts left; n > 1 only after a released "Not passed" | ATT `in-progress`; FA-20 "last activity" (sample rule OD-B4-10) | ST-12 → ST-13 |
| `saveAnswer` | `unavailable` → "Your last answer didn’t save" + Try again | own attempt `in-progress` | answers saved; nothing else | ST-13 |
| `submitAttempt` | `invalid-state`; `unavailable` → "Your answers weren't submitted — They're still saved here. Try again." (B4-12 frame 'Submit fails + try again') | own attempt `in-progress` | ATT `submitted`; automatic marks computed for choice questions [U scope]; **FA-18 queue + FA-01 attention "1 written answer to mark"**; IA-01 warning if the course has no Faculty | ST-13 (DL-1) |
| `getResult` | — | own attempt | none; withheld until confirmed **and** released | ST-14 |
| `addQuestion` / `editQuestion` | "Choose the question type", "Enter the question", "Add at least two answer options", "Choose the correct answer", "Choose whether the statement is true or false", "Enter the marks, as a whole number of 1 or more" | Faculty; experiment taught | Q created / new version; assessments keep their pinned version and show "Use updated version" | FA-15 |
| `deleteQuestion` | `invalid-state` (already deleted) | Faculty | Q `deleted` (history kept); assessments keep their copy | FA-14 (DL-1) |
| `requestDrafts` | "Choose the material to draft from", "Paste the text to draft from", "Choose at least one question type", "Choose how many drafts you want" | Faculty | drafts held for review only — nothing enters the bank; the mock returns canned sample drafts (no provider, T-23) | FA-16 |
| `addDraftToBank` / `discardDraft` | as add | Faculty | Q created with origin `reviewed-draft` / draft gone without trace | FA-14 Drafts, FA-16 |
| `previewQuestionImport` → `commitQuestionImport` | "Choose a CSV file first"; row report errors/warnings; `invalid-state` on errors | Faculty | all rows or none into the bank; never into an assessment | FA-17 |

---

### 3.11 MarkingService + TeachingService — FA-01…FA-05, FA-18…FA-22

```ts
export interface MarkingService {
  listQueue(filter: { readonly assessmentId?: AssessmentId; readonly state: 'waiting' | 'marked' | 'all' }): Promise<Result<readonly { readonly attempt: Attempt; readonly student: StudentPerson; readonly assessmentName: string; readonly submittedAt: IsoInstant }[], NotPermitted>>;  // oldest first
  getAttemptForMarking(attemptId: AttemptId): Promise<Result<{ readonly attempt: Attempt; readonly questions: readonly Question[]; readonly releaseLine: string | null }, NotPermitted | NotFound>>;
  saveMark(input: { readonly attemptId: AttemptId; readonly questionId: QuestionId; readonly mark: string; readonly feedback: string | null; readonly expectedRev: number }): Promise<Result<Attempt, ValidationFailed | NotPermitted | InvalidState | Refused<'marks-confirmed'> | StaleVersion>>;
  confirmMarks(input: { readonly attemptId: AttemptId; readonly expectedRev: number }): Promise<Result<Attempt, ValidationFailed | NotPermitted | InvalidState | Refused<'marks-confirmed'> | StaleVersion>>;
}
export interface TeachingService {
  getFacultyOverview(): Promise<Result<{ readonly scopeLine: { readonly courses: number; readonly experiments: number }; readonly attention: readonly AttentionRow[]; readonly comingUp: readonly { readonly assessmentId: AssessmentId; readonly deadline: IsoInstant; readonly submitted: number; readonly reach: number }[] }, NotPermitted>>;
  listMyCourses(): Promise<Result<readonly { readonly course: CourseCard; readonly experiments: number; readonly studentsWithAccess: number; readonly assessments: number; readonly accessEndedOn: CalendarDate | null }[], NotPermitted>>;
  getTeachingExperiment(experimentId: ExperimentId): Promise<Result<{ readonly experiment: PublicExperimentPage; readonly formatsInstitutionHas: readonly Technology[]; readonly formatsUsedByStudents: readonly Technology[]; readonly perFormatCounts: readonly { readonly format: Technology; readonly completed: number; readonly inProgress: number; readonly notStarted: number }[]; readonly assessmentId: AssessmentId | null }, NotPermitted | NotFound>>;
  listStudents(input: { readonly experimentId: ExperimentId; readonly inactiveForDays?: 7 | 14 | 30 }): Promise<Result<readonly FacultyStudentRow[], NotPermitted>>;
  getStudentDetail(input: { readonly studentId: PersonId; readonly experimentId: ExperimentId }): Promise<Result<{ readonly row: FacultyStudentRow; readonly resources: readonly { readonly title: string; readonly openedAt: IsoInstant | null }[]; readonly attempts: readonly Attempt[] }, NotPermitted | NotFound>>;
  exportStudentsCsv(input: { readonly experimentId: ExperimentId; readonly inactiveForDays?: 7 | 14 | 30 }): Promise<Result<{ readonly fileName: string; readonly csv: string }, NotPermitted>>;
}
```
| Method | Errors | Preconditions | Side effects on other records | Screens |
|---|---|---|---|---|
| `listQueue` / `getAttemptForMarking` | `not-permitted` (course not assigned) | Faculty; assessment in an assigned course | none | FA-18, FA-19 |
| `saveMark` | "Enter a mark for question 4", "Enter a whole number from 0 to 10"; `refused: marks-confirmed`; `invalid-state` (attempt still in progress) | Faculty; attempt submitted, not confirmed | stores provisional mark + feedback ("Mark saved — not confirmed yet"); Student sees nothing | FA-19 |
| `confirmMarks` | missing marks → field errors; `refused: marks-confirmed`; `invalid-state` (attempt still in progress) | Faculty; every written answer has a mark | marks read-only; Faculty status "Marked"; Student "Result not released yet" until `system:release-setting` releases ("Immediately after marking" → now); FA-01 attention row removed; IA-01 "no marker" warning cleared | FA-19 (DL-1) → ST-14 when released |
| TeachingService reads | `not-permitted`, `not-found` | Faculty; assigned courses ∩ experiments the institution holds | none; per-format words, no %; **no feedback, no score before marking** | FA-01…FA-05, FA-20, FA-21 |
| `exportStudentsCsv` | — | Faculty | none; "It contains the filtered list only." | FA-22 |
- [C] No Faculty release control, no re-mark, no suggested marks, no messaging (B4-09, B4-14; T-20, T-23, T-34).
- [U] FA-21 route lacks the experiment (`/faculty/students/[studentId]`) — the contract takes both ids (U:HC routeIssues FA-21).

---

### 3.12 ProductionService (submissions, review, publication) — VE-01…VE-09, VE-13; RV-01…RV-03, RV-05, RV-06; CM-01…CM-04; SA-12, SA-13

```ts
export interface ProductionService {
  // Vendor
  getVendorOverview(): Promise<Result<{ readonly statusCounts: Readonly<Record<'draft' | 'with-academic-reviewer' | 'with-content-manager' | 'published', number>>; readonly attention: readonly AttentionRow[] }, NotPermitted>>;
  listMyExperiments(filter: { readonly status?: 'draft' | 'submitted' | 'with-academic-reviewer' | 'returned' | 'with-content-manager' | 'published'; readonly search?: string }): Promise<Result<readonly { readonly submission: Submission; readonly guards: SubmissionGuards }[], NotPermitted>>;
  getEditor(input: { readonly id: SubmissionId | null; readonly step: EditorStep }): Promise<Result<{ readonly submission: Submission | null; readonly assignedCourses: readonly CourseCard[]; readonly readOnly: boolean }, NotPermitted | NotFound>>;
  saveDraft(input: { readonly id: SubmissionId | null; readonly content: SubmissionContent; readonly step: EditorStep; readonly expectedRev: number | null }): Promise<Result<Submission, ValidationFailed | NotPermitted | Refused<'course-not-assigned'> | InvalidState | StaleVersion>>;
  continueStep(input: { readonly id: SubmissionId | null; readonly content: SubmissionContent; readonly from: EditorStep }): Promise<Result<{ readonly next: EditorStep }, ValidationFailed | NotPermitted | Conflict | Refused<'course-not-assigned'>>>;
  submitForReview(input: { readonly id: SubmissionId | null; readonly content: SubmissionContent; readonly expectedRev: number | null }): Promise<Result<Submission, Refused<'submit-checklist-incomplete' | 'course-not-assigned'> | ValidationFailed | NotPermitted | InvalidState | StaleVersion>>;
  getRecord(id: SubmissionId): Promise<Result<{ readonly submission: Submission; readonly guards: SubmissionGuards; readonly lastReturn: AcademicReviewDecision | ContentManagerDecision | null }, NotPermitted | NotFound>>;
  saveRevision(input: { readonly id: SubmissionId; readonly content: SubmissionContent; readonly expectedRev: number }): Promise<Result<Submission, ValidationFailed | NotPermitted | InvalidState | StaleVersion>>;
  resubmit(input: { readonly id: SubmissionId; readonly content: SubmissionContent; readonly expectedRev: number }): Promise<Result<Submission, Refused<'submit-checklist-incomplete'> | ValidationFailed | NotPermitted | InvalidState | StaleVersion>>;
  // Academic Reviewer
  getReviewerOverview(): Promise<Result<{ readonly scopeLine: readonly string[]; readonly waiting: readonly AttentionRow[] }, NotPermitted>>;
  getReviewQueue(filter: { readonly type?: 'new' | 'update' | 'recheck'; readonly courseId?: CourseId; readonly search?: string }): Promise<Result<readonly ReviewQueueItem[], NotPermitted>>;
  getSubmissionForReview(id: SubmissionId): Promise<Result<{ readonly submission: Submission; readonly whatChanged: readonly { readonly field: string; readonly was: string; readonly now: string }[]; readonly previousReturn: AcademicReviewDecision | null; readonly recheck: ContentManagerDecision | null; readonly decided: boolean }, NotPermitted | NotFound>>;
  approveSubmission(input: { readonly id: SubmissionId; readonly outcomes: readonly string[]; readonly expectedRev: number }): Promise<Result<Submission, ValidationFailed | NotPermitted | InvalidState | StaleVersion>>;
  returnSubmission(input: { readonly id: SubmissionId; readonly reason: string; readonly references: readonly ReturnReference[]; readonly outcomes: readonly string[]; readonly expectedRev: number }): Promise<Result<Submission, ValidationFailed | NotPermitted | InvalidState | StaleVersion>>;
  listReviewedByMe(): Promise<Result<readonly { readonly recordRef: RecordRef; readonly name: string; readonly courseCode: string | null; readonly type: 'new' | 'update' | 'recheck'; readonly decision: AcademicReviewDecision | UpdateReviewDecision; readonly nowState: SubmissionStatus | UpdateState }[], NotPermitted>>;
  // Content Manager
  getContentManagerOverview(): Promise<Result<{ readonly attention: readonly AttentionRow[]; readonly withOthers: readonly AttentionRow[] }, NotPermitted>>;
  listReadyToPublish(): Promise<Result<readonly { readonly submission: Submission; readonly approvedAt: IsoInstant; readonly approvedBy: string; readonly check: readonly PublicationCheckItem[] }[], NotPermitted>>;
  getPublicationDecision(id: SubmissionId): Promise<Result<{ readonly submission: Submission; readonly check: readonly PublicationCheckItem[]; readonly cataloguePreview: PublicExperimentPage }, NotPermitted | NotFound>>;
  publish(input: { readonly id: SubmissionId; readonly expectedRev: number }): Promise<Result<{ readonly submission: Submission; readonly experiment: Experiment }, NotPermitted | InvalidState | Refused<'publication-blocked'> | StaleVersion>>;
  sendBack(input:                                   // references exist ONLY for the Vendor (B6-07; OD-B6-05)
    | { readonly id: SubmissionId; readonly to: 'academic-reviewer'; readonly reason: string; readonly expectedRev: number }
    | { readonly id: SubmissionId; readonly to: 'vendor'; readonly reason: string; readonly references: readonly ReturnReference[]; readonly expectedRev: number })
    : Promise<Result<Submission, ValidationFailed | NotPermitted | InvalidState | StaleVersion>>;
    // the unchosen recipient is a form-level state ('Choose who it goes back to') validated before the call
  getLibrary(filter: { readonly tab: 'ready' | 'in-review' | 'with-vendor' | 'published'; readonly search?: string }): Promise<Result<readonly { readonly ref: RecordRef; readonly name: string; readonly where: string; readonly tag: string | null }[], NotPermitted>>;
  // Super Admin
  listAllContent(filter: { readonly status?: string; readonly search?: string }): Promise<Result<readonly { readonly ref: RecordRef; readonly name: string; readonly courseCode: string | null; readonly formats: readonly Technology[]; readonly status: SubmissionStatus; readonly stuck: boolean; readonly whoCanAct: string | null; readonly openUpdate: UpdateId | null }[], NotPermitted>>;
  getContentRecord(ref: RecordRef): Promise<Result<{ readonly submission: Submission | null; readonly experiment: Experiment | null; readonly stuck: boolean }, NotPermitted | NotFound>>;
  overrideStatus(input: { readonly id: SubmissionId; readonly reason: string; readonly expectedRev: number }): Promise<Result<Submission, ValidationFailed | NotPermitted | Refused<'override-not-stuck'> | StaleVersion>>;
}
export interface ReviewQueueItem { readonly ref: RecordRef; readonly name: string; readonly courseCode: string | null; readonly who: string; readonly subLine: string; readonly type: 'new' | 'update' | 'recheck'; readonly formats: readonly Technology[]; readonly waitingSince: IsoInstant }
```
| Method | Errors | Preconditions (state · role · scope) | Side effects on other records | Screens |
|---|---|---|---|---|
| `saveDraft` | "Enter a name to save a draft"; `refused: course-not-assigned` | Vendor; unsaved or `draft`; course still assigned (else editor read-only) | first save mints SUB id ("Draft saved · SUB-0077"); only the Vendor sees drafts | VE-03…VE-06, VE-09 |
| `continueStep` | step field errors (§5); `conflict: duplicate` "An experiment called “<name>” already exists. Choose a different name." | Vendor | none (validation only; uniqueness vs catalogue + own experiments, case-insensitive [U OD-B5-04]) | VE-03…VE-05 |
| `submitForReview` | `refused: submit-checklist-incomplete` (missing items with links, nothing sent) | Vendor; draft/unsaved; checklist complete | SUB → with-AR · first-review, revision 1; appears in the queues of reviewers whose scope covers it (else SA-12 "Stuck — nobody can act"); RV-01 waiting list; **publishes nothing** | VE-06 (DL-1) |
| `saveRevision` / `resubmit` | as submit | Vendor; `returned` | resubmit → `resubmitted`, revision + 1; Vendor sees "Submitted" until `system:workflow-routing` routes it (§3.18) | VE-08 (DL-1) |
| `getReviewQueue` / `getSubmissionForReview` | `not-permitted: out-of-scope` | Academic Reviewer; scope covers the course or experiment; drafts never listed | none | RV-01, RV-02, RV-03, RV-06 |
| `approveSubmission` | "Add at least one learning outcome before you approve"; outcome mid-edit blocks | AR; with-AR (any reason); in scope | SUB → with-content-manager; outcomes travel with the decision (Vendor sees them read-only; CM sees them in the check); CM-02 "Ready to publish"; reviewer log "Approved — with the Content Manager"; **publishes nothing** | RV-03 (DL-1) |
| `returnSubmission` | "Add a reason so the vendor knows what to change" | AR; with-AR; in scope | SUB → returned (by AR); Vendor sees reason + references above the editor; VE-01 attention row | RV-03 (DL-2) |
| `publish` | `refused: publication-blocked` | Content Manager; with-content-manager; all four checks ok | SUB → published; **creates EXP** (live version = SUB version label, formats = SUB formats, outcomes, delivery); EXP listed in the public catalogue under its course with its formats **only**; IA-02/IA-05 list it "Not in your access plan" for institutions that do not hold it; SA overview "Published experiments" +1; reviewer log "Approved — published"; **no ACC, SACC, licence, Faculty or Student change** (BC-9) | CM-03 (DL-1) → PU-05/PU-06 |
| `sendBack` | "Choose who it goes back to" (form level), "Add a reason so they know what to change" (both at once) | CM; with-content-manager | to reviewer (reason only, **no references**) → with-AR · recheck (queue type "Re-check"; CM "Back with the Academic Reviewer"; Vendor "With Academic Reviewer"); to vendor → returned (by CM) with optional references | CM-03 (DL-2) |
| `overrideStatus` | "Add a reason — it is kept in the history"; `refused: override-not-stuck` | Super Admin; with-AR and stuck; never into or out of Published | SUB → returned (by override); recorded with the SA's name and reason; Vendor can change and resubmit (Vendor-side banner [U]) | SA-13 (DL-2) |
| reads (`listAllContent`, `getContentRecord`, `getLibrary`, overviews) | `not-permitted` | role + scope | none; published records read-only for SA | SA-12, SA-13, CM-01, CM-04, VE-01, VE-02, VE-07, VE-13, RV-05 |

---

### 3.13 CorrectionService (updates, Release / Hold) — CM-05…CM-08, RV-04, SA-10, SA-11

```ts
export interface CorrectionService {
  // Content Manager
  getPublishedExperiment(id: ExperimentId): Promise<Result<{ readonly experiment: Experiment; readonly openUpdate: CorrectionUpdate | null; readonly canJoin: boolean }, NotPermitted | NotFound>>;
  openCorrection(input: { readonly experimentId: ExperimentId; readonly entry: 'start-a-correction' | 'edit-catalogue-details' | 'edit-delivery-link' }): Promise<Result<{ readonly update: CorrectionUpdate; readonly joined: boolean }, NotPermitted | NotFound | InvalidState | Refused<'update-already-open'>>>;
  saveCorrection(input: { readonly id: UpdateId; readonly proposed: CorrectionFields; readonly whatChangesAndWhy: string | null; readonly versionLabel: string | null; readonly expectedRev: number }): Promise<Result<CorrectionUpdate, NotPermitted | InvalidState | StaleVersion>>;
  sendForAcademicReview(input: { readonly id: UpdateId; readonly expectedRev: number }): Promise<Result<CorrectionUpdate, ValidationFailed | NotPermitted | InvalidState | StaleVersion>>;
  withdrawUpdate(input: { readonly id: UpdateId; readonly reason: string; readonly expectedRev: number }): Promise<Result<CorrectionUpdate, ValidationFailed | NotPermitted | InvalidState | StaleVersion>>;
  listUpdates(filter: { readonly state?: UpdateState }): Promise<Result<readonly { readonly update: CorrectionUpdate; readonly experimentName: string; readonly withWhom: 'you' | 'academic-reviewer' | 'super-admin' | null }[], NotPermitted>>;
  getUpdate(id: UpdateId): Promise<Result<{ readonly update: CorrectionUpdate; readonly comparison: readonly CorrectionComparisonRow[] }, NotPermitted | NotFound>>;
  // Academic Reviewer
  getUpdateForReview(id: UpdateId): Promise<Result<{ readonly update: CorrectionUpdate; readonly comparison: readonly CorrectionComparisonRow[]; readonly live: ExperimentVersion; readonly decided: boolean }, NotPermitted | NotFound | InvalidState>>;
  approveUpdate(input: { readonly id: UpdateId; readonly expectedRev: number }): Promise<Result<CorrectionUpdate, NotPermitted | InvalidState | StaleVersion>>;
  returnUpdate(input: { readonly id: UpdateId; readonly reason: string; readonly expectedRev: number }): Promise<Result<CorrectionUpdate, ValidationFailed | NotPermitted | InvalidState | StaleVersion>>;
  // Super Admin
  listUpdatesForRelease(filter: { readonly tab: 'waiting-for-you' | 'on-hold' | 'released' }): Promise<Result<readonly { readonly update: CorrectionUpdate; readonly experimentName: string; readonly courseCode: string | null }[], NotPermitted>>;
  getUpdateDecision(id: UpdateId): Promise<Result<{ readonly update: CorrectionUpdate; readonly comparison: readonly CorrectionComparisonRow[]; readonly liveLine: { readonly label: string; readonly since: IsoInstant }; readonly institutionsUsingIt: readonly { readonly institutionId: InstitutionId; readonly planId: AccessPlanId; readonly formats: readonly Technology[]; readonly studentsWithAccess: number; readonly note: string | null }[] }, NotPermitted | NotFound | InvalidState>>;
  releaseUpdate(input: { readonly id: UpdateId; readonly expectedRev: number }): Promise<Result<{ readonly update: CorrectionUpdate; readonly experiment: Experiment }, NotPermitted | InvalidState | Refused<'hold-must-be-lifted'> | StaleVersion>>;
  holdUpdate(input: { readonly id: UpdateId; readonly reason: string; readonly expectedRev: number }): Promise<Result<CorrectionUpdate, ValidationFailed | NotPermitted | InvalidState | StaleVersion>>;
  liftHold(input: { readonly id: UpdateId; readonly expectedRev: number }): Promise<Result<CorrectionUpdate, NotPermitted | InvalidState | StaleVersion>>;
}
```
| Method | Errors | Preconditions | Side effects on other records | Screens |
|---|---|---|---|---|
| `openCorrection` | `refused: update-already-open` (open update in review / awaiting / on hold → "Open update" only); `not-found` (unknown experiment); `invalid-state` (experiment not published — there is no live version to pre-fill) | Content Manager; published experiment | creates UPD `draft` pre-filled from the live version, or joins the open draft/returned one; EXP `openUpdateId` set; CM-04 library tag "Update in …"; **live unchanged** | CM-05 → CM-06/CM-07/"Start a correction" → CM-08 |
| `saveCorrection` | `invalid-state` (not draft/returned) | CM | none outside the UPD | CM-08 |
| `sendForAcademicReview` | "Say what changes and why", "Enter the version label, for example 1.3", "Use a new version label — 1.2 is live", "Change at least one catalogue detail or delivery link" | CM; draft or returned | UPD → in-academic-review; appears in the reviewer queue (type "Update"); history "To Prof. A. Menon. The live version 1.2 is unchanged." | CM-08 (DL-1) |
| `withdrawUpdate` | "Add a reason for withdrawing this update" | CM; draft / returned / in-academic-review | UPD → withdrawn; EXP `openUpdateId` cleared; reviewer queue loses it | CM-08 (DL-2) |
| `approveUpdate` | `invalid-state` | AR; in-academic-review; scope | UPD → awaiting-release-decision; SA-10 "Waiting for you"; SA-01 attention; **live unchanged** | RV-04 (DL-1) |
| `returnUpdate` | "Add a reason so the Content Manager knows what to change" | AR; in-academic-review | UPD → returned; CM draft editable again | RV-04 (DL-2) |
| `releaseUpdate` | `refused: hold-must-be-lifted`; `invalid-state` (not awaiting) | Super Admin; awaiting-release-decision | **EXP live version → the update's label (1.2 → 1.3); proposed fields replace the live catalogue/delivery fields; previous version kept in `versions`**; public PU-05/06, Student hub, Faculty teaching view, CM-05 and every institution read the new version; UPD released; EXP `openUpdateId` cleared; **grants and changes no institution's access** | SA-11 (DL-1) |
| `holdUpdate` | "Add a reason — the Content Manager sees it" | Super Admin; awaiting-release-decision | UPD → on-hold; CM sees reason; live unchanged; later corrections remain blocked as drawn [U OD-B7-04] | SA-11 |
| `liftHold` | `invalid-state` | Super Admin; on-hold | UPD → awaiting-release-decision ("Hold lifted — waiting again"); never releases | SA-11 (DL-1) |

---

### 3.14 AcademicStructureService + PlatformCourseCodeService — SA-14, SA-15, CM-09

```ts
export interface AcademicStructureService {
  getStructure(): Promise<Result<readonly { readonly area: EngineeringArea; readonly courses: readonly { readonly course: Course; readonly publishedExperiments: number }[] }[], NotPermitted>>;
  getArea(id: AreaId): Promise<Result<{ readonly area: EngineeringArea; readonly courses: readonly Course[] }, NotPermitted | NotFound>>;
  getCourse(id: CourseId): Promise<Result<{ readonly course: Course; readonly usage: CourseUsage }, NotPermitted | NotFound>>;
  addArea(input: { readonly name: string; readonly description: string | null }): Promise<Result<EngineeringArea, ValidationFailed | NotPermitted>>;
  addCourse(input: { readonly name: string; readonly areaId: AreaId | null; readonly description: string | null }): Promise<Result<Course, ValidationFailed | NotPermitted>>;
  rename(input: { readonly kind: 'area' | 'course'; readonly id: AreaId | CourseId; readonly name: string; readonly expectedRev: number }): Promise<Result<EngineeringArea | Course, ValidationFailed | NotPermitted | StaleVersion>>;
  editDescription(input: { readonly kind: 'area' | 'course'; readonly id: AreaId | CourseId; readonly description: string | null; readonly expectedRev: number }): Promise<Result<EngineeringArea | Course, NotPermitted | StaleVersion>>;
  previewMoveCourse(input: { readonly courseId: CourseId; readonly toAreaId: AreaId }): Promise<Result<{ readonly blocked: boolean; readonly blockers: { readonly students: number; readonly faculty: number }; readonly movesWithIt: CourseUsage }, NotPermitted | NotFound>>;
  moveCourse(input: { readonly courseId: CourseId; readonly toAreaId: AreaId | null; readonly expectedRev: number }): Promise<Result<Course, ValidationFailed | NotPermitted | Refused<'course-has-people-filed'> | StaleVersion>>;
}
export interface PlatformCourseCodeService {
  list(): Promise<Result<readonly { readonly course: Course; readonly areaName: string; readonly publishedExperiments: number }[], NotPermitted>>;
  save(input: { readonly changes: readonly { readonly courseId: CourseId; readonly code: string | null; readonly expectedRev: number }[] }): Promise<Result<readonly Course[], ValidationFailed | NotPermitted | StaleVersion>>;
}
```
| Method | Errors | Preconditions | Side effects on other records | Screens |
|---|---|---|---|---|
| `addArea` | "Enter the area name", "There is already an area called <name>" | Super Admin | AREA created; public explorer unchanged until it has published experiments [U OD-B7-13] | SA-14 |
| `addCourse` | "Enter the course name", "There is already a course called <name>", "Choose the engineering area it belongs to" | Super Admin | CRS created, "No platform code yet"; CM-09 lists it; assignable in Platform roles scopes | SA-14 |
| `rename` | "Enter a name", "Enter a different name — this is the current one", "There is already a course / an area called <name>" | Super Admin | name changes everywhere it shows (catalogue, Vendor course list, Student/Faculty course rows) — warned before | SA-15 |
| `previewMoveCourse` → `moveCourse` | "Choose the area to move it to"; `refused: course-has-people-filed` | Super Admin; no Student filings and no FMAP on the course | course's area changes; published experiments, institutions' access and Vendor course lists move with it (public explorer counts follow) | SA-15 |
| `save` (platform codes) | "{code} is already the code for {course}. Each course needs its own code." | **Content Manager only** (M-2); unique among non-blank codes compared trimmed + case-insensitive (B6-10 script); internal spaces **[U]** (annotation says "spaces ignored" — D-25) | public code chips, course pages, Student course code (when no institution code), Faculty course rows, Vendor course list, CSV `course_code` matching all read the new code; effects on links/institution codes [U OD-B6-13] | CM-09 |

---

### 3.15 PlatformRoleService — SA-16, SA-17

```ts
export interface PlatformRoleService {
  listHolders(filter: { readonly tab: 'vendors' | 'reviewers' | 'content-managers'; readonly search?: string }): Promise<Result<readonly { readonly holder: PlatformRoleHolder; readonly canActOn: string }[], NotPermitted>>;
  getHolder(id: RoleHolderId): Promise<Result<PlatformRoleHolder, NotPermitted | NotFound>>;
  registerHolder(input: { readonly role: PlatformRole; readonly name: string; readonly workEmail: string; readonly organisation: string }): Promise<Result<PlatformRoleHolder, ValidationFailed | NotPermitted>>;
  assignScope(input: { readonly holderId: RoleHolderId; readonly target: ScopeTarget | { readonly kind: null }; readonly expectedRev: number }): Promise<Result<PlatformRoleHolder, ValidationFailed | NotPermitted | StaleVersion>>;
  withdrawScope(input: { readonly holderId: RoleHolderId; readonly scopeId: ScopeId; readonly reason: string; readonly expectedRev: number }): Promise<Result<PlatformRoleHolder, ValidationFailed | NotPermitted | InvalidState | StaleVersion>>;
  restoreScope(input: { readonly holderId: RoleHolderId; readonly scopeId: ScopeId; readonly expectedRev: number }): Promise<Result<PlatformRoleHolder, NotPermitted | InvalidState | StaleVersion>>;
}
```
| Method | Errors | Preconditions | Side effects on other records | Screens |
|---|---|---|---|---|
| `registerHolder` | "Enter the person’s name", "Enter a work e-mail address", "Enter an e-mail address like name@organisation.com", "Someone is already registered with this e-mail address", "Enter the organisation" | Super Admin | ROLE holder with no scope + sample identity (mock); nothing sent (T-11) | SA-16 (dialog) |
| `assignScope` | "Choose what they can act on", "Choose a course", "Choose an experiment", "<X> is already in scope" | Super Admin | Vendor: course appears in their course list; Reviewer: matching submissions/updates enter their queue — a stuck record becomes un-stuck; CM: library scope [U]; a withdrawn scope for the same target leaves the withdrawn list (B7-08 script) — kept in the record as superseded, history rows kept (M28) | SA-17 |
| `withdrawScope` | "Add a reason — it is kept in the history" | Super Admin; scope active | "They stop seeing it straight away": Vendor drafts in that course → read-only ("Draft · read-only"); reviewer queue items leave — may become "Stuck — nobody can act" | SA-17 (DL-2) |
| `restoreScope` | `invalid-state` | Super Admin; scope withdrawn | reverses the above; no reason asked; history "Scope restored - <X>" (B7-08 script) | SA-17 (confirm) |

---

### 3.16 OperationsService — device transfers, support, access ending, usage, SA overview — ST-18, IA-18…IA-20, SA-01, SA-18…SA-22, XS-07

```ts
export interface OperationsService {
  // Device transfers
  getMyDevice(): Promise<Result<{ readonly devices: readonly AuthorisedDevice[]; readonly openTransfer: DeviceTransferView | null; readonly lastTransfer: DeviceTransfer | null; readonly canRequest: boolean; readonly blockedBy: 'institution-paused' | null }, NotPermitted>>;
  // The two drawn fields only. Format and experiment are derived from the Student's authorised device — never a user choice.
  requestDeviceTransfer(input: { readonly newDevice: string; readonly note: string | null }): Promise<Result<DeviceTransferView, ValidationFailed | NotPermitted | InvalidState | Refused<'institution-paused' | 'transfer-already-open'> | PolicyOpen>>;
  listDeviceRequests(filter: { readonly state?: DeviceTransferState }): Promise<Result<readonly DeviceTransfer[], NotPermitted>>;     // IA, own institution
  getDeviceRequest(id: DeviceTransferId): Promise<Result<DeviceTransfer, NotPermitted | NotFound>>;
  forwardDeviceTransfer(input: { readonly id: DeviceTransferId; readonly expectedRev: number }): Promise<Result<DeviceTransfer, NotPermitted | InvalidState | Refused<'institution-paused'> | StaleVersion>>;
  listDeviceTransfers(filter: { readonly state?: DeviceTransferState }): Promise<Result<readonly DeviceTransfer[], NotPermitted>>;    // SA
  approveDeviceTransfer(input: { readonly id: DeviceTransferId; readonly expectedRev: number }): Promise<Result<{ readonly transfer: DeviceTransfer; readonly device: AuthorisedDevice }, NotPermitted | Refused<'not-yet-forwarded'> | InvalidState | StaleVersion>>;
  // Support (every workspace)
  reportProblem(input: { readonly whatHappened: string; readonly where: string | null; readonly screenshotFileName: string | null }): Promise<Result<SupportReport, ValidationFailed | NotPermitted | Unavailable>>;
  listMyReports(): Promise<Result<readonly SupportReport[], never>>;
  getMyReport(id: SupportReportId): Promise<Result<SupportReport, NotPermitted | NotFound>>;
  listSupportReports(filter: { readonly state?: SupportState }): Promise<Result<readonly SupportReport[], NotPermitted>>;   // SA
  resolveReport(input: { readonly id: SupportReportId; readonly note: string; readonly expectedRev: number }): Promise<Result<SupportReport, ValidationFailed | NotPermitted | InvalidState | StaleVersion>>;
  reopenReport(input: { readonly id: SupportReportId; readonly expectedRev: number }): Promise<Result<SupportReport, NotPermitted | InvalidState | StaleVersion>>;
  // Access ending, usage, overview
  listAccessEnding(): Promise<Result<readonly AccessEndingRow[], NotPermitted>>;   // SA-22
  getUsage(input: { readonly courseId?: CourseId }): Promise<Result<{ readonly figuresUpTo: IsoInstant; readonly rows: readonly UsageRow[] }, NotPermitted>>;   // IA-20
  getSuperAdminOverview(): Promise<Result<{ readonly figures: { readonly activeInstitutions: number; readonly publishedExperiments: number }; readonly groups: readonly { readonly group: 'requests' | 'updates' | 'device-transfers' | 'support' | 'access-ending' | 'institutions'; readonly count: number; readonly rows: readonly AttentionRow[] }[] }, NotPermitted>>;
}
```
| Method | Errors | Preconditions | Side effects on other records | Screens |
|---|---|---|---|---|
| `requestDeviceTransfer` | "Describe the new device"; `refused: institution-paused · transfer-already-open`; `invalid-state` (no authorised AR/VR/MR device to move from); `policy-open: OD-B3-01` (more than one authorised device — not drawn) | Student with AR/VR/MR given; no open request (assumption, OD-B3-03); **an Institute Admin is NOT required** | DTR `with-institute-admin`, format/experiment derived from the authorised device; IA-01 attention "1 device request to forward to BITS"; IA-18 "Waiting on you"; SA-18 "Still with the institution" (read-only). **No Institute Admin**: the DTR is still created and waits — `forwardingBlocked: 'no-institute-admin'` → Student notice "This request can't be forwarded yet — Your institution has no Institute Admin right now. It stays here until one is assigned." (B3-07 `dn`); it becomes forwardable when `assignInstituteAdmin` runs (who resolves it [U OD-B3-05]) | ST-18 |
| `forwardDeviceTransfer` | `refused: institution-paused`; `invalid-state` | Institute Admin, own institution | DTR → forwarded (irreversible); Student "Forwarded to BITS"; SA-18 "Forwarded"; SA-01 attention | IA-19 (DL-1) |
| `approveDeviceTransfer` | `refused: not-yet-forwarded` | Super Admin; forwarded | DTR → approved; **AuthorisedDevice for that Student × format becomes the new device**; Student and IA see "Approved" / "Decided · approved by BITS"; ST-09 shows the new device; no Decline (T-32) | SA-19 (DL-1) |
| `reportProblem` | "Say what happened, so it can be looked into" (summary "One thing needs fixing"); `not-permitted` (no session) | any signed-in person (all seven workspaces) | SUP `open`; SA-20 list; SA-01 support group | XS-07 |
| `resolveReport` | "Add a note — the reporter sees it" | Super Admin; open or reopened | SUP → resolved; reporter's My reports shows the note | SA-21 |
| `reopenReport` | `invalid-state` | Super Admin (reporter [U]); resolved | SUP → reopened; "The reporter sees it is open again." | SA-21 (DL-1), XS-07 [U] |
| `listAccessEnding` | — | Super Admin | none; emits **ReminderDue facts only — nothing is sent** (T-31; STK31-28 conflict) | SA-22 |
| `getUsage` | `not-permitted` | Institute Admin (only, per OD-B3-08) | none; per experiment × format, never summed; no feedback column | IA-20 |
| `getSuperAdminOverview` | — | Super Admin | none; groups ≤ 4 rows each | SA-01 |

---

### 3.17 Notifications and reminders
- [C] No notification or message is sent from the product (T-34; U:DR BR-124); statuses are read where the person is.
- [P] The store emits domain facts (`ReminderDue{planId, endsOn}`, `RequestDecided`, `UpdateReleased` …) on an in-process event bus used only for query invalidation and tests. **No adapter sends anything.**
- [U] STK31-28 (15-day reminder to tenants) is a REQUIRED capability that the in-product "Reminder due" state does not discharge; channel and recipient are ND-16 / A-05 / D19 — production requirement for the owner.

### 3.18 System stand-in ports (test and seed only — no UI of any kind)
These stand in for the non-human writers of §1.3 (`SystemActor`) and for the board controls ("Restart", "Sample: …", "Move the sample date past the deadline", "The workflow routes the resubmission") that are **not product features** (START-HERE Known exception 4). They are called **only** by the seed loader and by test harnesses. They have **no UI of any kind** — no product control, no developer surface, no demo clock, no runtime-event simulator, no payment simulator, no account switcher — because the committed architecture bans stand-in controls ("no scenario selector, no demo clock, no stand-in controls in V2", `1b090c9:v2/docs/ARCHITECTURE.md` §14) and the prototype's demo clock, "DEMO CONTROL runtime-event simulator", payment simulation screen and actor switchers are removed behaviours (U:FP removedBehaviours).

The running app therefore needs no time travel, payment or runtime control: §4.1 **State coverage** seeds at least one record in every drawn state (an external request awaiting payment, a payment failed, a format completed with feedback offered, a result released, an update on hold …), so every screen state is reachable by signing in as the right sample person. A **developer surface** that would let someone drive these ports by hand is an explicit owner choice (§8-5); the default answer is **none**. If the owner chooses one, the exception and its removal trigger are recorded first.

```ts
export interface ClockPort { now(): IsoInstant; setSampleNow(instant: IsoInstant): void }   // setSampleNow: seed / test harness only (§4)
export interface PaymentOutcomePort {
  report(input: { readonly requestId: RequestId; readonly outcome: 'confirmed' | 'failed' }): Result<DecisionOutcome, InvalidState>;
  // confirmed, new external institution: ACC created; INST access-active; REQ access-active; IA can be assigned (planEffect 'plan-created')
  // confirmed, renewal / more licences / new access for an EXISTING institution: REQ access-active; INST status unchanged;
  //            planEffect { kind: 'policy-open', decision: 'OD-B3-09' } — no ACC write until the owner decides
  // failed:    REQ payment-failed; requester / IA offered 'Try payment again'
}
export interface RuntimeReportPort {
  reportActivity(input: { readonly studentId: PersonId; readonly experimentId: ExperimentId; readonly format: Technology; readonly kind: 'opened' | 'saved' | 'session'; readonly at: IsoInstant }): Result<RuntimeActivity, InvalidState>;
  reportCompletion(input: { readonly studentId: PersonId; readonly experimentId: ExperimentId; readonly format: Technology; readonly at: IsoInstant; readonly from: 'simulation' | 'headset' }): Result<FormatCompletion, InvalidState>;
  // the ONLY writer of FormatCompletion; idempotent — the first completion stands (PROPOSED). Side effects: table below.
}
export interface WorkflowRoutingPolicy {      // OD-B5-05 / M-3 — typed so it can ONLY return the drawn default (B5-08)
  route(submission: Submission): { readonly reason: 'resubmission' };   // → with-AR · resubmission, 'Routed by the approved workflow rule.'
}
export interface LicenceAvailabilityOracle {  // T-06 / D7 — answers ONLY from seeded sample-world data; no counting
  waitFor(input: { readonly planId: AccessPlanId; readonly studentId: PersonId; readonly experimentId: ExperimentId }): ProvidedLicenceWait | null;
}
export interface OverlapGrantPolicy {         // OD-B2-01 / OD-B2-02 — no default in the contract
  resolve(input: { readonly grants: readonly StudentAccessGrant[]; readonly studentId: PersonId }): 'open' | 'closed' | 'undecided';
}
```
Six ports, eight methods (`ClockPort.now` is the same method every service reads, §1.2). There is **no identity port**: sample people sign in through `SessionService.signIn` with fixture test credentials typed into the drawn XS-01 form; tests seed the session in the harness (M26).

**`RuntimeReportPort.reportCompletion` — side effects on other records** (BC-14: one system event, every role sees it)
| Record / view | Effect | Evidence |
|---|---|---|
| `FormatCompletion` | created for Student × Experiment × format; a second report for the same key is ignored (first completion stands, [P]) | M17 |
| Student format page (ST-08 / ST-09) | "Completed 14 Oct 2026 · Reported by the simulation at 15:30" / "… Reported from the headset at 11:15"; the "Give feedback on <FORMAT>" entry appears | B3-03, B3-04; B3-12 C3 "Completion from the simulation → Give feedback on WEB" |
| Student Simulation chooser, Progress, hub, Home "Up next" | that format reads Completed with its date; feedback entry offered (`FeedbackService.getFeedbackState` → `eligible`) | B3-02, B3-05, B3-06 entry-points table |
| Faculty FA-03 / FA-20 / FA-21 | per-format counts and the student's format column ("WEB Completed 14 Oct 2026") change; never a % or verdict | B4-03, B4-10 |
| Institute Admin IA-20 Usage | "Completed" count for that experiment × format changes | B3-10 definitions |
| Super Admin SA-07 institution report | per-format "started · completed" figures change, never added up | B7-03 |
| Everything else | **unchanged** — no grant, no assessment, no attempt, no other format, no resource state, no licence figure | BC-3, BC-4, BC-9 |

- [U] Whether the mock may route a resubmission immediately (Vendor never sees "Submitted") or must hold it visibly in `resubmitted` — owner decision tied to M-3. A route that skips the Academic Reviewer is **not** in the contract; it is only a possible owner answer (§8-15).
- [U] Whether the mock ever produces "Waiting for a licence" for a **new** grant (seed-only answers vs never) — owner decision (D7).
- [U] The `OverlapGrantPolicy` answer for the connected store (OD-B2-01) — owner decision; tests must cover each answer.

---

## 4. Sample-world requirements

### 4.1 Requirements
- [C] **One coherent sample world** (T-36): "BITS Pilani Hyderabad, Godavari Institute, ME ZG523 … marked as sample; no B2 counts reused". One store holds every record in §2 so a decision in one role's screen is what every other role sees (BC-14; B8-06 'Shared state').
- [C] Core chain the flows trace (flows.json; B8-04 'State sharing'): REQ-0042 → ACC-0107 (Godavari Institute of Technology, external, Shell-and-Tube Heat Exchanger WEB + VR, 120 licences, Yearly 8 Oct 2026 – 7 Oct 2027) → SACC-0310 (Rahul Verma × Shell-and-Tube) → RUN WEB/VR + DTR-0018 → ASMT-0009 / ATT-0450 → SUB-0077 → EXP → UPD-0005 (Distillation Column 1.2 → 1.3) → SUP-0213.
- [C] People: Rahul Verma (Student, GIT-2026-0418), Meera Iyer (Institute Admin and REQ-0042 contact), Dr S. Ranganathan (Faculty), Anil Shetty / Northline Simulation Studio (Vendor), Prof. A. Menon (Academic Reviewer), Kavya Nair (Content Manager), Arjun Mehta (Super Admin); state carriers Arun Kumar ("Waiting for a licence", B3-02/B3-03, B2-05 f11, B2-06 IA-07 record), Sneha (inactive, B2-05 f9), Nikhil (withdrawn grant, B2-04), Priya (second submission, B4-06), Neha Kulkarni (learner reference, B7-11); second Vendor Meridian Virtual Labs / Ritu Sharma (OD-B6-11); institutions and their Institute Admins from OD-B7-06 / B7-02 (Deccan Institute of Technology · S. Kulkarni, Malnad College of Engineering · V. Hegde, Konark Polytechnic · R. Bhatt, BITS Pilani — Hyderabad Campus · Dr P. Srinivas; Sahyadri Institute of Engineering · **no Institute Admin**; Vizag Polytechnic, Krishna College of Engineering); **request contacts** (not Institute Admins): Sahyadri · N. Joshi (REQ-0036, B1-10), Konark · R. Bhatt (REQ-0040, B1-11), Godavari · Meera Iyer (REQ-0042), REQ-0039 · A. Menon (S-3).
- [C] The two Composite Wall records are **separate** (BC-11; OD-B5-09): "Composite Wall Conduction" (published, WEB + AR, Batch-1 catalogue) and SUB-0077 "Conduction Through a Composite Wall" (WEB · VR). Different slugs; no merge; no duplicate-content rule. The unique-name check (OD-B5-04) passes because the names differ — it must never be "fixed" to compare normalised content.
- [C] Sample values are never defaults: pass mark 50 %, 2 attempts, 14 Nov 2026 23:59, licence figures (BC-6; U:DR BR-076; B4-04 "Nothing pre-filled (C-5)" and "Every value here is set for this assessment only - nothing comes pre-filled.").
- [C] Board controls are not product ("Restart", "Start again", "Sample: …") (START-HERE Known exception 4) — the test/seed-only stand-in ports of §3.18 replace them in the seed loader and tests; nothing replaces them in the running app.
- [P] **State coverage**: the seed must contain at least one record in every drawn state each screen needs (e.g. an institution per status incl. "Approved — payment required" and "No Institute Admin"; a request per status incl. "Payment failed" and an IA more-licences request "Approved - payment required"; a submission per Vendor/Reviewer/CM state incl. "Stuck — nobody can act"; an update per CM state incl. Withdrawn and On hold; a DTR per state incl. one waiting with no Institute Admin; a format Completed with feedback offered and one with feedback sent; an attempt per Student/Faculty state incl. a released result; a SUP Open/Resolved/Reopened). Each seeded record carries a `seedNote` naming the board frame it reproduces. **This is what replaces any runtime "demo control"**: every drawn state is reached by signing in as the right sample person, not by driving a simulator.
- [P] **Deterministic ids and counters**: next ids continue above the highest drawn id of each series (drawn maxima across all boards: REQ-0058, ACC-0107, SACC-0314, ASMT-0009, ATT-0451, SUB-0086, UPD-0007, DTR-0019, SUP-0213, Q-0117, GRP-0013, FMAP-0021 → next REQ-0059, ACC-0108, SACC-0315 …); never collide with reserved route slugs.
- [P] **Persistence**: versioned envelope + zod codec + integrity gate + memory fallback + cross-tab adoption (Slice-1 `world.ts` / `world-store.ts`, SALVAGE_WITH_CHANGES); browser storage of the sample world is acceptable only if the owner confirms (BC-10 excludes backend persistence).
- [P] **Product seed vs test fixtures**: explorer "Test area 4…9 — placeholder" (B1-00) and Slice-1 edge cases (inactive student, other-institution student, licence exhaustion) are fixtures only; Slice-1 `seed.ts` ("Sample Campus A/B", "Direct Shear Test") is discarded (U:RB slice1).
- [P] **Sample credentials** for every sample person live in a fixture file used only by `SessionService.signIn` (typed into the drawn XS-01 form) and by test harnesses — test values only, never shown in product copy, never listed by any screen or port.
- [U] **Marking the world as sample** (T-36) vs "no generic DEMO banner" (owner constraint) — proposal: the sample flag lives in data only (seed metadata, `seedNote`), not in product chrome and not in a developer surface; owner to confirm.
- [U] **One clock**: boards are dated per batch — Vendor/Reviewer/CM Aug 2026; Public, SA ("23 Oct 2026"), IA and Student learning 2–24 Oct 2026; Faculty and assessments 26 Oct – 14 Nov 2026; IA ending-soon frames Sep 2027. The store needs one `ClockPort` value set by the seed (tests may set others); a per-flow clock would need an owner decision, and no clock control exists in the running app.
- [U] **Live walk-through of system events** (an external payment confirming, a simulation reporting completion, a release date passing) is not possible in the running app by default — those states are seeded. Whether the owner wants a recorded-exception developer surface for demonstrations is §8-5 (default: none).

### 4.2 Sample-data conflicts for the owner to choose (no product effect; the store can hold only one answer)
| # | Record | Board A | Board B (/C) | Choice needed |
|---|---|---|---|---|
| S-1 | **Konark Polytechnic access plan** | B1-11 SA-03 (REQ-0040 additional licences, received 29 Sep 2026 12:37, contact R. Bhatt): "Access plan **ACC-0064** · Buck Converter Ripple (WEB, AR) · **180 licences** · term ends **24 Sep 2027**. The institution is **paused**." | B7-02/B7-03 (SA-06/07): **ACC-0091** · Buck Converter Ripple · EEE ZG512 · WEB + AR · **60 licences** · **Quarterly 3 Aug – 2 Nov 2026** · status **Ending soon** · origin REQ-0031 · "Access active · ACC-0091 · 3 Aug 2026 · Payment confirmed." | plan id, licences, term/end, paused vs ending soon |
| S-2 | **BITS Pilani — Hyderabad Campus access plan** | B1-11 SA-03 (REQ-0038 renewal, internal): "Access plan **ACC-0081** · these **3 experiments** · **860 licences** · current term ends **31 Oct 2026**." | B7-02/B7-03: **ACC-0098** · Distillation Column + Boiler Drum Level (CHE ZG513) · WEB + VR · **80 licences** · **Monthly 1–31 Oct 2026** · IA Dr P. Srinivas · "Access active · ACC-0098 · **26 Sep 2026** · Internal — no payment step." / C: B1-08 PU-13 (REQ-0039): **ACC-0098** · Composite Wall Conduction (WEB, AR) + Fin-Tube Bundle (WEB, VR) · **860 licences** · **Until 30 Jun 2027** · "Access active **29 Sep 2026, 09:40**" | plan id(s), experiments, licences, term, activation date |
| S-3 | REQ-0039 contact person | B1-08: "Request submitted 26 Sep 2026 · **A. Menon**, contact person" | Academic Reviewer **Prof. A. Menon** (B6) | distinct people or rename (one role per person) |
| S-4 | SUP-0213 | 07 / B7-09: sent **3 Oct 2026** by Rahul Verma (Student) | B2-01 f7: "1 open problem report from your institution · SUP-0213 · **20 Sep 2027**" (IA overview) | date; and whether the IA sees institution reports at all [U] |
| S-5 | SUB-0077 publication vs catalogue | B6-12: published **28 Aug 2026** | Batch-1 October catalogue lists 12, not 13 (OD-B6-12; OD-B7-08 "13 published") | include SUB-0077's experiment in the catalogue seed or move its publication date |
| S-6 | UPD-0005 timing | B6 approved **27 Aug 2026** | SA world **23 Oct 2026** — waiting ~8 weeks (OD-B7-14) | accept or re-date |
| S-7 | Reviewer scope history | B6: Prof. A. Menon reviewed UPD-0006 (EEE ZC341) on 26 Aug | scope line lists three other courses; B7-08 EEE ZC341 scope withdrawn 1 Oct 2026 (OD-B7-15) | consistent scope history |
| S-8 | ASMT-0009 counts on 7 Nov 2026 | B4-05 / B4-03: "1 of 5 submitted · 1 waiting for marking" | B4-06 / B4-09 badge: 2 waiting (Priya submitted 6 Nov 20:10) | one count |
| S-9 | Sample deadline | 14 Nov 2026 (moved from 14 Sep, OD-B4-16) | later than the SA world date (23 Oct) | ordering of the one clock |
| S-10 | VR "how it runs" text | B1-05 "… on a supported headset." | B6-07 "… on a supported VR headset." | one string |
| S-11 | Second Vendor | Meridian Virtual Labs / Ritu Sharma (OD-B6-11) | — | confirm as sample |
| S-12 | Overlapping grant seed | SACC-0311 group "ME ZG523 — Sem II" includes Rahul, who also holds SACC-0310 | Student-side outcome not drawn (OD-B2-01) | keep on IA screens only (U:DR sampleWorldNotes) |

---

## 5. Validation foundation

### 5.1 Placement (boundary matrix at 1b090c9)
| Layer | Holds | Why |
|---|---|---|
| `@xr/domain` | TS types and brands of §1–§2, **including its own `IsoInstant` / `CalendarDate` brands** (§1.2); pure rules (readiness, open gate, publication check, release time, status derivations, `ENDING_SOON_DAYS`) | framework-free; **no workspace dependency and no zod** (1b090c9 boundary-matrix.mjs `'@xr/domain': []`, `FORBIDDEN_THIRD_PARTY` incl. `zod`) — so nothing here imports `@xr/validation`, not even a type |
| `@xr/validation` | field primitives: `requiredTrimmed(msg)`, `wholeNumberString(msg)` (`/^[1-9][0-9]*$/`), `wholeNumberInRange(min,max,msg)`, `emailAsDrawn(msg)` (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`), `httpsLinkAsDrawn(msg)` (`/^https:\/\/[^\s/.]+\.[^\s]+$/`), `calendarDate`, committed `isoInstantWire` / `isoInstant` codec | shared by every form and adapter |
| `@xr/contracts` | one input schema per command and one output schema per DTO (wire form), published as OpenAPI components later; maps accepted wire strings to the `@xr/domain` brands (allowed: `['@xr/domain','@xr/validation']`) | the same schemas validate the mock and a future HTTP adapter (contract test suite) |
| `apps/web` | React Hook Form + `zodResolver` with the same schemas; the copy catalogue (§5.4) | ARCHITECTURE §4 |
| mock adapters | apps/web or a new workspace package — **owner/engineering decision** (a new package needs a boundary-matrix entry) | — |

### 5.2 Rules taken from the boards
- [C] Validate on the primary action; errors on the field **and** in a summary; focus moves to the summary or the first field; fields keep what was typed; required reasons on DL-2 actions; duplicate checks where shown (codes, names, scopes) (B8-07 'Validation'; B8-06 'Validation'; U:DR BR-122).
- [C] Error summary: role alert, focused, each item links to its field (B1-07 'Validation'). **Defects to fix in the shared component, not to copy**: Batch-7 SA dialogs show field errors only (no summary, U:super-admin inconsistencies); 77 of 192 drawn error summaries do not link to fields (U:visual-system).
- [P] Wire vs accepted forms (as committed `instant.ts`): inputs arrive as typed strings (`'120'`, `'50'`, `'14 Nov 2026, 23:59'`); accepted forms are trimmed and parsed; a rejected value never becomes a default.

### 5.3 Shapes
```ts
export interface FieldErrorView { readonly fieldId: string; readonly message: string; readonly summaryText: string }  // summaryText defaults to message
export interface ErrorSummaryView { readonly title: string; readonly items: readonly FieldErrorView[] }            // role="alert", tabIndex -1, focused
export function toErrorSummary(e: ValidationFailed, titleFor: (n: number) => string): ErrorSummaryView;            // e.g. PU-08 'There are N problems with this request'
```
Example schemas (zod 4, committed 4.6.0):
```ts
import { z } from 'zod';
const required = (message: string) => z.string().trim().min(1, message);
const email = (empty: string, format: string) => required(empty).regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, format);

export const publicRequestInputSchema = z.object({
  institutionName: required('Enter your institution’s name'),
  contactPerson: required('Enter the contact person’s name'),
  email: email('Enter an e-mail address', 'Enter an e-mail address like name@institution.edu'),
  phone: z.string().trim().transform((v) => (v === '' ? null : v)),
  licencesRequested: required('Enter the number of licences you are requesting').regex(/^[1-9][0-9]*$/, 'Enter a whole number, like 120'),
  message: z.string().trim().transform((v) => (v === '' ? null : v)),
  term: z.discriminatedUnion('kind', [
    z.object({ kind: z.literal('monthly') }), z.object({ kind: z.literal('quarterly') }), z.object({ kind: z.literal('yearly') }),
    z.object({ kind: z.literal('until-date'), endsOn: required('Enter the date access should end') }),
  ], { error: 'Choose how long you need access' }),
});

export const formatFeedbackInputSchema = z.object({
  ratings: z.array(z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]).nullable()).length(5)
    .superRefine((r, ctx) => r.forEach((v, i) => { if (v === null) ctx.addIssue({ code: 'custom', path: [i], message: 'Choose a rating' }); })),
  comments: z.string().trim().transform((v) => (v === '' ? null : v)),
});   // summary title: 'One rating is missing' | '<n> ratings are missing'; summary link 'Choose a rating for statement <n>'
```

### 5.4 Copy catalogue (exact drawn messages; one key per field rule)
| Screen (board) | Field / rule → message |
|---|---|
| PU-06/07 (B1-05/06) | formats ≥ 1 → "Choose at least one format to add." · last format → "At least one format stays chosen. To take this experiment out, use Remove." |
| PU-08 (B1-07) | institution → "Enter your institution’s name" · contact → "Enter the contact person’s name" · e-mail → "Enter an e-mail address" / "Enter an e-mail address like name@institution.edu" · licences → "Enter the number of licences you are requesting" / "Enter a whole number, like 120" · term → "Choose how long you need access" · end date → "Enter the date access should end" · summary → "There is 1 problem with this request" / "There are N problems with this request" |
| SA-03 (B1-11) | "Choose a decision" · "Choose internal or external" · "Keep at least one format" · "Enter a whole number of licences" · "Change at least one thing, or choose Approve request" · "Enter the reason for the change" · "Enter what you need from the requester" · summary "Check your decision" |
| XS-01 (B1-09) | "Enter your e-mail address" · "Enter an e-mail address like name@institution.edu" · "Enter your password" · "The e-mail or password isn’t right — Check both and try again." |
| XS-07 (07) | "Say what happened, so it can be looked into" · summary "One thing needs fixing" (link "Say what happened") |
| IA-10 (B2-07) | "Enter the full name" · "Enter the institution e-mail" · "Enter a full e-mail address, like name@godavari.edu.in" · "This e-mail already belongs to someone in People" · "Enter the student ID" · "<ID> is already used by <name>" |
| IA-11 (B2-07) | "Choose a CSV file first" · "Programme is empty. Every row needs the student’s programme." · "Course code is empty. Every row needs the course code (ME ZG523 or MEC-523)." · "E-mail “<value>” isn’t a full address." · "Student ID <ID> is also in row <n>. Each student needs a different ID." · row type "Error — blocks import" |
| IA-07 (B2-06) | "Enter the reason for deactivating this account" |
| IA-04 (B2-04) | "Enter the reason for withdrawing access" |
| IA-05 (B2-05) | "Choose at least one experiment" · "Choose at least one student, or switch to a group" · "Choose a group" · summary "Check this step" |
| IA-13/14 (B2-08) | "Enter a name for the group" · "A group called “<name>” already exists" |
| IA-15 (B2-09) | "Choose a faculty member" · "Choose a course" · "<name> already teaches <course>" |
| IA-16 (B2-03) | "Add your course code, or clear the semester" |
| IA-17 (B3-08) | "Choose what you need" · "Choose at least one experiment" · "Enter the number of licences you need" · "Enter a whole number, like 60" |
| ST-16 (B3-06) | "Choose a rating" · summary link "Choose a rating for statement <n>" · titles "One rating is missing" / "<n> ratings are missing" |
| ST-18 (B3-07) | "Describe the new device" |
| FA-07/10 (B4-04/06) | "Choose an experiment" · "Enter a name for the assessment" · "Enter a name to save a draft" · "Enter a pass mark from 0 to 100, as a whole number" · "Enter how many attempts are allowed, as a whole number" · "Enter the deadline" · "Choose when students see their result" · "Enter the release date" · "Add at least one question, or save as a draft" |
| FA-15 (B4-07) | "Choose the question type" · "Enter the question" · "Add at least two answer options" · "Choose the correct answer" · "Choose whether the statement is true or false" · "Enter the marks, as a whole number of 1 or more" |
| FA-16/17 (B4-08) | "Choose the material to draft from" · "Paste the text to draft from" · "Choose at least one question type" · "Choose how many drafts you want" · "Choose a CSV file first" · row error e.g. "correct is “E”, but the question has options A–D only." · warning "explanation is empty. The question imports without one." |
| FA-19 (B4-09) | "Enter a mark for question <n>" · "Enter a whole number from 0 to <max>" |
| VE-03 (B5-03) | "Choose a course" · "<code> is no longer one of your assigned courses. Choose one of your courses." · "Enter the experiment name" · "An experiment called “<name>” already exists. Choose a different name." · "Enter a name to save a draft" · "Enter a one-sentence summary" · "Enter a description" · "Enter a version, for example 1.0" |
| VE-04 (B5-04) | "Choose at least one format" · "Enter the web link for WEB" · "Enter a web link that starts with https://" · "Say which browser and computer WEB needs" · "Enter a package label for <XX>" · "Enter a package reference for <XX>, or attach the package file" · "Say which device <XX> needs" · "Add install notes for <XX>" |
| VE-05 (B5-05) | "Add a preview link for “<label>”, or remove the label" · "Enter a preview link that starts with https://" |
| RV-03 (B6-03) | "Add a reason so the vendor knows what to change" · "Enter the outcome text" · "Enter the outcome text, or cancel" · "Add at least one learning outcome before you approve" |
| RV-04 (B6-04) | "Add a reason so the Content Manager knows what to change" |
| CM-03 (B6-07) | "Choose who it goes back to" · "Add a reason so they know what to change" |
| CM-08 (B6-09) | "Say what changes and why" · "Enter the version label, for example 1.3" · "Use a new version label — <live> is live" · "Change at least one catalogue detail or delivery link" · "Add a reason for withdrawing this update" |
| CM-09 (B6-10) | "<code> is already the code for <course>. Each course needs its own code." |
| SA-07 (B7-03) | "Enter the person’s name" · "Enter a work e-mail address" · "Enter an e-mail address like name@institution.edu.in" · Pause / Restore / status override → "Add a reason — it is kept in the history" |
| SA-11 (B7-05) | Hold → "Add a reason — the Content Manager sees it" |
| SA-13 (B7-06) | Move status → "Add a reason — it is kept in the history" |
| SA-14/15 (B7-07) | "Enter the area name" · "There is already an area called <name>" · "Enter the course name" · "There is already a course called <name>" · "Choose the engineering area it belongs to" · "Enter a name" · "Enter a different name — this is the current one" · "Choose the area to move it to" |
| SA-16/17 (B7-08) | "Enter the person’s name" · "Enter a work e-mail address" · "Enter an e-mail address like name@organisation.com" · "Someone is already registered with this e-mail address" · "Enter the organisation" · "Choose what they can act on" · "Choose a course" · "Choose an experiment" · "<X> is already in scope" · withdraw → "Add a reason — it is kept in the history" |
| SA-21 (B7-09) | Resolve → "Add a note — the reporter sees it" |

---

## 6. NOT modelled (and must not be introduced)
| Not modelled | Authority |
|---|---|
| A **Module** layer anywhere; **Programme** as a navigation level, catalogue grouping or filter (Programme is free text on the Student record only) | BC-2; U:DR BR-012/013; B7-07/B7-13 "No Module layer"; U:FP warnings (prototype collapsed Programme into the grouping) |
| A **Campus** entity or any level below the Institution | v46 draws none (U:FP campus); STK31-23 "no sub-tenant level" |
| **Aggregate completion** — experiment-, course- or Student-level verdict, percentage, "overall Completed", resources counting as progress | BC-4; B3-05 f2; T-13; committed FUNCTIONAL_PARITY_MATRIX P-15 conflicts (U:RB) |
| **Launch-derived completion**, Student self-report ("I have finished", "Mark as done"), completion from sessions, time, resources, assessment or another format | BC-3; B3-03; T-12 |
| **Licence counting** — consumption on grant / withdrawal / deactivation, remaining places, "in use" figures, over-allocation errors, `no-place-remaining` refusals (Slice-1 `places.ts`) | T-06 / D7; B2-05 "no licence arithmetic"; U:RB slice1 |
| **Payment processing** — amount, price, method, provider screens, refund, manual "mark paid" | BC-10; T-05; R06; B1-08 |
| **Real authentication** — passwords at rest, SSO flows, invitations, activation, password reset, multi-role workspace choice | BC-10; T-10, T-11; XS-02 DEFER |
| **XR runtimes** — launching packages, store / MDM / download / side-loading routes, device registry beyond free text | BC-10; T-14; OD-B3-01 |
| **Grading automation** — suggested marks, AI auto-review of written answers, auto-submit, timers | BC-10; T-22, T-23; STK31-31 WAIT (choice-question answer-key comparison is drawn — owner to confirm, §8) |
| **Backend persistence**, sent notifications / reminders / messages, report pages, KPI dashboards, exports beyond "the list on screen" | BC-10; T-33, T-34; U:DR BR-124/125 |
| Decline of requests or device transfers; Declined states; plan amendment; direct institution creation; institution termination | T-02, T-32, T-08, T-09; STK31-21 conflict |
| Super Admin edits of published content or platform codes; Super Admin "Publish"; partial publish / format hold-back; Vendor updates and "Add a format" (VE-10…12, VE-14) | M-1, M-2, LD-4; T-26; BC-7/8 |
| Assessment delete / close / make-available; re-marking; rubric builder; staff feedback views; Faculty messaging; group deletion; group-grant withdrawal; person edit/delete; Faculty deactivation | T-18, T-20, T-21, T-25, T-34; not drawn on B2/B4 |
| Prices, "cart / basket / checkout / buy", B2C commerce, a "Lifetime" period | U:DR BR-030, BR-140 |
| Generic DEMO banner; **any** account / role switcher or sample-account chooser — in-product **or developer-only** (no `DevIdentityPort`, no "listSampleAccounts", no "switchTo"); "Viewing as…"; a developer surface with a demo clock, runtime-event simulator or payment simulator (unless the owner records an exception, §8-5); unrelated SaaS design system; canvas `support.js`; board controls; captions | owner constraints (9 Oct 2026); B1-09 'Never here'; 1b090c9 ARCHITECTURE §14; START-HERE Known exceptions 4, 6; U:FP removedBehaviours (actor switchers, demo expiry clock, DEMO CONTROL runtime-event simulator, payment simulation screen) |
| A routing branch that sends a resubmission straight to the Content Manager (skipping the Academic Reviewer) | BC-7; B5-08 drawn default; U:FP removed "silent fast-path"; M-3 / OD-B5-05 open |
| A caller-chosen device format (or "current device" / reason fields) in a device-transfer request | B3-07 form (two fields only); U:FP removed "technology scope selector" |
| "No Institute Admin" as a refusal of a Student's device-transfer request | B3-07 state `dn` (request exists and waits) |
| Prototype artefacts: tenant/"Subscription" words, prototype defaults (pass mark 60, 3 attempts), overall learning state, resource "Mark as done", device-delivery ladder | U:FP warnings |

---

## 7. Handoff defects surfaced by this model (board wins — report, do not fix)
| ID | Defect | Where |
|---|---|---|
| D-01 | entities.json has 15 records; the boards also write SEL, payment attempts, RES opened, LO, CCODE, GRP, FMAP, Q (+ drafts, imports), marking, Institute Admin assignment, authorised device — no entity rows | entities.json vs B1-06, B1-08, B3-01, B6-03, B2-03, B2-08, B2-09, B4-07/08/09, B7-03, B3-07 |
| D-02 | REQ statuses omit "Submitted" and "Payment failed" | entities.json vs B1-08 f1, f7 |
| D-03 | INST/ACC words mixed ("Paused" vs "Access paused"); "Renewal in progress", "Reminder due" (access-ending standings) absent | entities.json vs B2-01…03, B7-09 |
| D-04 | SACC "Active · Withdrawn" omits "Waiting for a licence", "Student inactive", "Individual grant withdrawn", "Access ended", "Paused"; flows.json "No access yet" is a person-directory word | entities.json vs B2-04 `LBL`, B2-06 |
| D-05 | RUN `ownerWriter: Student` and one merged status set — Completed is system-set (BC-3); activity and completion are different states | entities.json RUN vs B3-03 f3, B3-04 f2, B3-12 C3 |
| D-06 | "ASMT / ATT" mixes two records; omits "To do", "Result not released yet", "Marked", "Draft — not ready", "Passed / Not passed" | entities.json vs B4-03…06, B4-11, B4-13 |
| D-07 | DTR lists Student words only (IA "Waiting on you · Decided · approved by BITS"; SA "Still with the institution · Forwarded") | entities.json vs B3-09/B3-11 scripts |
| D-08 | SUB lists Vendor words only; omits "Submitted" (M-3), "Draft · read-only", reviewer/CM/SA words; flows.json/B8-04 E omit CM send-back to reviewer (re-check) and to vendor | entities.json, flows.json vs B5-06, B6-03, B6-06/07, B7-06 |
| D-09 | UPD lists CM words only; reviewer and SA words missing; flows.json F1 omits Withdraw, F2 omits reviewer Return | entities.json, flows.json vs B6-04, B6-09, B7-05 |
| D-10 | ROLE "Scope active" is drawn nowhere; "No scope" state missing | entities.json vs B7-08 |
| D-11 | FB wording "Feedback sent · WEB · 14 Oct" vs boards "Feedback sent 14 Oct 2026" / "Feedback on WEB sent" | entities.json vs B3-02, B3-05, B3-06 |
| D-12 | Flow D4: Faculty releases on FA-12 — boards release by the assessment's own setting, no Release control | flows.json, B8-04 vs B4-06, B4-14 D4 |
| D-13 | Flow B3: "Experiment × format grant" — boards inherit formats from the plan, no picker (LD-1) | flows.json vs B2-05 |
| D-14 | Flow C3 feedback entry only from ST-10/ST-15 — boards also ST-07/08/09 and Home Up next | flows.json vs B3-06 entry-points table |
| D-15 | No flow steps for IA-17 → SA Requests, group grant SACC-0311, FMAP → Faculty scope, IA withdraw → Student, IA-16 code → Student display | flows.json vs B3-08, B2-08, B2-13 |
| D-16 | Support reopen actor: 07 "Super Admin actions" vs B7-09 f10 "Reopened by the reporter" | 07 vs B7-09 |
| D-17 | Assessment Ready checklist "Name and introduction" vs optional introduction; B4-11 f15 Student "Not available yet · no questions" vs Ready requiring ≥ 1 question | B4-04/05 vs B4-11 |
| D-18 | Request term "Until a fixed date" on the public form has no counterpart in the SA decision term select | B1-07 vs B1-11 |
| D-19 | CM-07 "Edit a delivery link (with reason)" — board has no per-link reason or "Remove from the draft"; only the draft-level "What changes and why" | screens.json / inventory vs B6-08/B6-09 |
| D-20 | Register gaps that read models must still serve: IA request detail (REQ-0058) has no screen ID; Student hub Assessment tab has no ID; B1-02 explorer unregistered | screens.json vs B3-08, B4-11 f7–9, B1-02 |
| D-21 | navigation.json "Request access → PU-08" vs boards linking PU-07 (Selection) | navigation.json vs B1-01, B1-06 |
| D-22 | Record-code naming differs: board FMAP vs brief FCM; ACC vs inventory PLAN | B2-06 vs entities.json / inventory |
| D-23 | SA validation pattern: B8-07 "errors on the field and in a summary" vs Batch-7 SA dialogs with field errors only | B8-07 vs B7-02…B7-09 |
| D-24 | Board-to-board: the same Student grant reads differently while the institution is paused — IA-03 plan page shows "Paused" (SACC-0310 row), IA-04 Student access keeps the grant's own word ("Active", "Waiting for a licence", "Student inactive") under a read-only banner (B2-04 `LBL` has no "Paused"; annotation "… · read-only while paused"). The "student inactive" condition is also worded three ways on IA screens: "Student inactive" (IA-04), "Can’t open — inactive" (IA-07), "Inactive — can’t be given access" (IA-05) | B2-03 paused frame vs B2-04 f12 + script `LBL`; B2-06 f11; B2-05 picker |
| D-25 | Board-internal: platform-code uniqueness — 'Rules' annotation "Each code unique (case and spaces ignored)." vs the drawn script, which ignores case and surrounding spaces only (`T(r.code).toUpperCase()`), so "ME ZG523" and "MEZG523" both pass | B6-10 annotation vs B6-10 script `o.save` |
| D-26 | A Student per-format word "Not available right now" (frame 'A format not available right now — VR temporarily unavailable; WEB still opens. Reason wording neutral.') has no record, cause, writer, status list entry or open decision | B2-12 frame 2 vs entities.json, open-decisions.json (U:student inconsistencies) |

---

## 8. Owner decisions this deliverable needs
1. **Campus** — confirm: no Campus entity; a campus is an Institution; On-/Off-campus categorisation not modelled (STK31-23).
2. **Role id** — keep committed `tenant_admin` with display "Institute Admin", or rename the id (A-20, BC-1); either way remove `ROLE_PLANNING_LABEL` from anything that can reach copy (§1.9 edit 2).
3. **Format order** — add a WEB · AR · VR · MR display order beside committed `web·vr·mr·ar`, or change the canonical order by ADR; and retire committed `TECHNOLOGY_META` in favour of `FORMAT_META` (reusing `DeliveryModel`) — §1.9 edit 1.
4. **T-12 completion** — move committed `utilisation.ts` `SIMULATION_COMPLETED` rule behind `CompletionPolicy` (typed in M17) for a future runtime adapter; make `FormatProgressStatus` the one UI status (§1.9 edit 3); confirm `FormatCompletion` is written only by the runtime stand-in; decide whether a portal "Launch WEB" alone sets In progress.
5. **Developer surface — default NONE.** The six stand-in ports (ClockPort, PaymentOutcomePort, RuntimeReportPort, WorkflowRoutingPolicy, LicenceAvailabilityOracle, OverlapGrantPolicy) are test/seed-only and need no exception to ARCHITECTURE §14 as long as no UI drives them. Only if the owner wants live demonstrations of payment confirmation, runtime completion or a moving clock does a developer surface become an option — then record it as an exception (successor of CF-01/CF-02) with a removal trigger **before** building it. An account / role switcher is never an option (owner constraint; B1-09 'Never here').
6. **D7 / T-06** — may the mock create a NEW grant as "Waiting for a licence" (seed-driven oracle) or never; confirm licences are display-only.
7. **OD-B2-01 / OD-B2-02** — choose the OverlapGrantPolicy answer (individual + group grant) and late-member behaviour for the connected store.
8. **Group-grant withdrawal** — not designed ("Change on the group" leads nowhere); confirm out of scope.
9. **Sample world** — choose S-1 Konark (ACC-0064 vs ACC-0091), S-2 BITS Hyderabad (ACC-0081 vs ACC-0098 vs B1-08 REQ-0039 contents), S-3 "A. Menon", S-4 SUP-0213, S-5…S-9 timeline and one sample clock (OD-B6-12, OD-B7-08, OD-B7-14, OD-B7-15, OD-B4-16).
10. **Sample marking** — where "marked as sample" (T-36) lives without a DEMO banner.
11. **Access term "Until a fixed date"** (B1-07) vs stakeholder Monthly · Quarterly · Yearly (BR-040), and how SA approves a changed date term.
12. **OD-B3-09 / T-07 / T-08** — effect of activating a renewal or more-licences request (or new access for an existing institution) on the ACC record (same id extended, figure changed, or new plan). Until decided the mock returns `planEffect: policy-open` and writes no ACC change; the institution's status never moves backwards (§3.4 `approveRequest` split).
13. **T-03** — exit from "Information requested" (none drawn); **review-started** trigger for "Submitted" → "Under review"; SA label for "Payment failed".
14. **T-01 / R01** — status-page key: session-scoped opaque token (reference is not a key) — confirm.
15. **OD-B5-05 / M-3** — mock routes a resubmission immediately or holds it visibly as "Submitted". A possible owner answer "a revision after a Content Manager return may go straight back to the Content Manager" is **not** in the contract (the routing port can only return the drawn default); it would need a BC-7-compatible decision first.
16. **Vendor scope** — held by the person (B7-08) or the organisation (B5-03 copy).
17. **Choice-question automatic marking** (B4-09) vs "no grading automation" — confirm in scope.
18. **Assessment edge rules** — all-choice attempts (when marks confirm), confirm granularity with several written answers, pass-mark rounding, retry while waiting, release time when marks confirm after the deadline (OD-B4-02/04/05).
19. **OD-B7-04** — held update blocks later corrections (as drawn) — confirm.
20. **OD-B6-09** — correction fields for AR/MR package references and learning outcomes.
21. **Support** — who reopens (07 vs B7-09), title source, IA visibility of institution reports (B2-01 f7).
22. **OD-B3-08** — usage figures computed by the service from store records under the B3-10 definitions; IA only.
23. **Resource authorship** — who writes learning resources (not shown).
24. **OD-B3-01 / OD-B3-03 / OD-B3-05** — authorised-device keying (Student × format; what happens when a Student holds more than one AR/VR/MR device — the request form has no format field), one open transfer, and who resolves a request waiting because the institution has no Institute Admin.
25. **Validation placement** — zod in `@xr/validation` + `@xr/contracts`; mock adapters in apps/web or a new package (boundary-matrix change).
26. **Browser persistence** of the sample world (versioned store) — acceptable under BC-10.
27. **STK31-28** — 15-day reminder: production channel/recipient (ND-16); mock exposes ReminderDue facts and sends nothing.
28. **Platform-role experiment scope** — published experiments only, or also submissions.
29. **Platform-code uniqueness (D-25)** — are internal spaces ignored ("ME ZG523" = "MEZG523", per the B6-10 annotation) or only case and surrounding spaces (per the B6-10 script)?
30. **"Not available right now" (D-26)** — what makes one format of a given experiment temporarily unavailable, who sets it, and what record holds it; until then it is seed-only and the gate returns `policy-open`.
31. **Paused grant wording (D-24)** — one word for a grant while the institution is paused ("Paused" on IA-03 vs the grant's own word on IA-04), and one word for "student inactive" across IA-04 / IA-05 / IA-07 — or confirm the per-screen words are intended.
32. **"Ending soon" threshold** — confirm 15 days (BR-049 PROVISIONAL, T-31); held as `ENDING_SOON_DAYS`.
33. **Paused IA screens** — confirm that every IA write is refused while paused ("Pages are read-only until BITS lifts the pause.", B2-01) and how IA-06…IA-15 and IA-17 present it (not drawn).


---

## Verification log
Final editor's record of the 20 corrections in the adversarial verifier report (`wf/verify/schemas.json`). Each was re-checked against the cited board (html-unescaped `design/handoff-v46/canvas-v46/project/*.dc.html`), the Understand files, or the committed foundation (`git show 1b090c9:…`) before it was applied or rejected. **19 APPLIED (2 with a stated adjustment) · 1 REJECTED.** No binding constraint was weakened. Counts after editing: 28 models; 22 product ports / 183 methods (unchanged); 6 test/seed-only stand-in ports / 8 methods (the draft had 7 ports / 10 methods incl. `DevIdentityPort`; the verifier's "8 methods" for the draft under-counted one-line interfaces).

| # | Severity | Correction | Outcome | Re-check evidence / reason |
|---|---|---|---|---|
| 0 | critical | Remove `DevIdentityPort` (developer-only account switcher) | **APPLIED** | B1-09 'Never here' "DEMO strips, sample accounts, a role switcher…"; owner constraint bans a developer-only account selector. Removed from §3.18, M26, §4.1, §6, §8-5; sample people sign in via `signIn` with fixture credentials; tests seed the session. |
| 1 | major | Re-scope stand-in ports as test/seed-only; developer surface = owner choice, default none | **APPLIED** | 1b090c9 ARCHITECTURE §14 "no scenario selector, no demo clock, no stand-in controls in V2"; U:FP removedBehaviours (demo expiry clock, DEMO CONTROL runtime-event simulator, payment simulation screen). §3.18 rewritten; §4.1 State coverage named as the replacement; §8-5 default NONE. |
| 2 | major | `@xr/domain` must not import `IsoInstant` from `@xr/validation` | **APPLIED** | 1b090c9 boundary-matrix.mjs `'@xr/domain': []`, `zod` forbidden; validation `IsoInstant = z.output<…>`. §1.2 declares domain brands; §5.1 and §1.9 updated; matrix not widened. |
| 3 | major | Split `approveRequest` side effects by request type | **APPLIED** | B3-08 later-sample frame (Godavari more-licences "Approved - payment required … Nothing changes until the payment is confirmed." while active); B1-11 REQ-0038 internal renewal of ACC-0081; OD-B3-09 safe treatment. §3.4 row split; `DecisionOutcome.planEffect`; M01, M05, PaymentOutcomePort mirrored. |
| 4 | major | Contract path for IA "Open the payment page" | **APPLIED** | B3-08 button "Open the payment page" → B1-08. `startPayment` now takes `{ by: 'status-token' } \| { by: 'institute-admin', requestId }`; errors NotPermitted \| NotFound \| InvalidState \| StaleVersion; M03 actor updated. |
| 5 | major | "No Institute Admin" is not a refusal of a device-transfer request | **APPLIED** | B3-07 state `dn` (`stage:'sent', noIA:true`) renders "This request can't be forwarded yet … It stays here until one is assigned." under an existing request. Removed `no-institute-admin` from `RefusalCode` and `getMyDevice.blockedBy`; added `DeviceTransferView.forwardingBlocked`; `assignInstituteAdmin` clears it. |
| 6 | major | State the required edits to committed TECHNOLOGY_META / DeliveryModel / ROLE_PLANNING_LABEL / SimulationStatus; type `CompletionPolicy` | **APPLIED** | 1b090c9 technology.ts, roles.ts, runtime/utilisation.ts read. New §1.9 table; `FORMAT_META` reuses `DeliveryModel` ('hosted' \| 'package'); `CompletionPolicy` typed in M17. |
| 7 | minor | 'Paused' grant word cited to the wrong board; per-screen IA words | **APPLIED** | B2-04 `LBL` + annotation (no "Paused"; f12 keeps grant words); B2-03 paused frame SACC-0310 "Paused"; B2-06 "Can’t open — inactive"; B2-05 "Inactive — can’t be given access". M15 table split per screen; M12 updated; new D-24. |
| 8 | minor | Add missing role words | **APPLIED (adjusted)** | B6-04 script: chip `rvChipWords` draft → "Not sent for review"; on-hold / released / withdrawn chips come from `D.stw` ("On hold", "Released", "Withdrawn"); "Withdrawn by the Content Manager" and "Not sent for review yet" are the decision-panel **titles** (`rDecTitle`), not chips — recorded as such rather than as chip words. B4-13 "Not submitted yet"; B4-09 "Marks confirmed"; B6-06 `blockWords` "Ready" / "1 to resolve: learning outcomes"; B2-12 "Not available right now" added as [U] availability with `policy-open` (new D-26). |
| 9 | minor | Replace the blanket "one history entry per command" rule with a per-command table | **APPLIED (adjusted)** | B5-0x script `saveDraft` (history on first save only); B6-09 `o.saveDraft` (message only); U:vendor VE-08 "no history entry"; B7-08 script. M28 table written. **Not applied:** flagging the SA-17 list removal as a BR-126 conflict — the B7-08 script removes the row only from the withdrawn-scope *list* (`wd.filter`) and prepends a history row, so history is kept; modelled as `RoleScope.supersededAt`, no conflict. |
| 10 | minor | Complete error unions | **APPLIED** | Failure frames B2-05 'Give access fails', B3-03 'Couldn't open + try again', B3-06 'Sending fails + try again', B4-12 'Submit fails + try again' → `Unavailable` on giveAccess, launchWebFormat, sendFeedback, submitAttempt. NotPermitted on continueStep, reportProblem; NotFound \| NotPermitted on startPayment; InvalidState on saveMark, confirmMarks, openCorrection, requestDeviceTransfer. Rule stated in §3.0. |
| 11 | minor | Replace `Refused<'institution-paused'>` on IA-06…IA-15 writes with `PolicyOpen` | **REJECTED** | The rule is drawn: IA overview while paused "Students can't open experiments. Pages are read-only until BITS lifts the pause." with caption "Batch-0 banner; no actions while paused." (B2-01; U:institute-admin PE strength explicit-rule). Turning it into `policy-open` would weaken a drawn rule. The inconsistency the verifier found is fixed the other way: the refusal now applies **uniformly** to every IA write (§3.6, M12, §3.0); only the per-screen presentation of IA-06…IA-15 / IA-17 stays [U] (§8-33). |
| 12 | minor | 'current-plan' term only for additional licences | **APPLIED** | B1-11 data REQ-0040 `term: "Current term"`, REQ-0038 `term: "Yearly"`; B3-08 renewal mirror line. M03 comment, IA-17 rows. |
| 13 | minor | Platform-code uniqueness: annotation vs script | **APPLIED** | B6-10 'Rules' "case and spaces ignored" vs script `T(r.code).toUpperCase()`. Trim + case = [C]; internal spaces = [U]; D-25, §8-29; M07 and §3.14 rows. |
| 14 | minor | Fix wrong-board / wrong-item citations | **APPLIED** | Arun wait note → B2-06; "No time limit and no timer." → B4-04; "VR not started offers nothing" → B8-04 (B3-06 "Not eligible → no entry at all."); "In your bank · reviewed by you" → B4-08; SSO button "Sign in with your institution"; "Two of four answered" → script `countText` + caption; "4 questions · 16 marks" → B4-05; START-HERE exception 7 citation replaced by BC-6 / BR-076 / B4-04 "Nothing pre-filled"; M02 examples are drawn Institute Admins; N. Joshi moved to request contacts (B1-10 REQ-0036; Sahyadri has no IA). |
| 15 | minor | Routing policy may only return the drawn default | **APPLIED** | B5-08 script `route` "Routed by the approved workflow rule." → With Academic Reviewer; U:FP removed fast-path. `WorkflowRoutingPolicy.route` returns `{ reason: 'resubmission' }` only; CM-skip listed in §8-15 and §6. |
| 16 | minor | No caller-chosen format in `requestDeviceTransfer` | **APPLIED** | B3-07 labels: "New device", "Anything your Institute Admin should know (optional)" only. Input is `{ newDevice, note }`; format/experiment derived; >1 authorised device → `policy-open: OD-B3-01` [U]. |
| 17 | minor | 15-day threshold is PROVISIONAL | **APPLIED** | U:DR BR-049 status PROVISIONAL. `ENDING_SOON_DAYS = 15` in M01 with citation; transition and §8-32. |
| 18 | minor | `sendBack` references only for the Vendor | **APPLIED** | B6-07 send-back dialog; U:reviewer-cm CM-03 "[no references]" for the Academic Reviewer. Discriminated input union in §3.12. |
| 19 | minor | Side effects of `reportCompletion` | **APPLIED** | B3-12 C3 "Completion from the simulation → Give feedback on WEB"; B3-03/B3-04; B4-10; B3-10; B7-03 template "{started} started · {done} completed". Table added under §3.18; nothing else changes (BC-3/4/9). |
