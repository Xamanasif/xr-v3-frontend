# Batch 05 — Super Admin + Platform-Wide Administration

| | |
|---|---|
| **Batch** | 05 |
| **Date** | 27 August 2026 |
| **Branch** | `uiux/full-platform-design` |
| **Status** | **Complete · uncommitted · awaiting PM review** |
| **Role** | Super Admin |
| **Screens** | 10 base · 26 states · 3 dialogs |

---

## Read this first

> ### There is no publication anywhere in this batch — deliberately.
>
> The **Content Manager** publishes content (`PM-16` · `PM-17` · `PM-18`). The Super Admin holds no publish control, no publication queue, and no return-to-vendor action, and **none is invented in its place**.
>
> FRD **1.4.4** still assigns publication to the Super Admin. That is a **recorded PM deviation**, left unreconciled in the sources — the FRD, the Review-006 matrix and the 18 August baseline are all unedited.
>
> **`QP-26`** — *may Super Admin return a submission at the publication gate?* — **remains OPEN / PENDING** and is not resolved here.

## The finding

The batch began with an exhaustive source audit rather than a design, because the PM update had removed the role's only previously-designed responsibility and deferred everything else. The audit's result:

> **Super Admin holds exactly two clean write actions in Phase 1** — release or hold a module version (FRD **2.3.2**), and approve a device-replacement licence transfer (FRD **2.4.2**) — **plus one bounded read capability**: cross-institution governance and operational oversight (FRD **1.3.5**), presented one institution at a time and never aggregated.
>
> Everything else the role is commonly assumed to own is PM-overridden, Phase 2/3, another role's, or an open question.

That is a small role. **The batch is exactly as large as the sources support, and no larger.**

Full reasoning, with every requirement quoted verbatim: **[`02_SUPER_ADMIN_AUTHORITY_AUDIT.md`](02_SUPER_ADMIN_AUTHORITY_AUDIT.md)** — read it before the design documents.

## The workspace

```
Overview                    what needs a decision                    FRD 8.1.1 · PM-11
Institutions                every institution, read-only             FRD 1.3.5 · PM-13
Releases              [n]   module versions awaiting a decision      FRD 2.3.2      ← WRITE
                            release version · hold version — publication already happened
Device requests       [n]   individual learners awaiting approval    FRD 2.4.2      ← WRITE
Licensing                   access records, shown as existing        FRD 8.1.1 · 6.2.1
                            no cap, seat or capacity figure — OQ-03 OPEN
Platform                    ├── Platform roles      read-only        FRD 8.1.1 · QD-02
                            └── Configuration       the register     FRD 8.1.1
```

Three ideas shape every screen:

1. **A work list, not a dashboard.** No chart, KPI, metric or trend anywhere. `PM-11` defers detailed metrics; §6.7.3 prohibits cross-tenant analytics dashboards.
2. **Every read carries its owner.** Where a screen shows something another role controls, it names that role and the requirement beside it. A deliberate absence that is explained reads as a decision.
3. **A gap is shown as a gap** — never as a disabled control. A greyed-out button implies the route exists and is merely unavailable, which is the opposite of true.

## Screens

| # | Screen | Route | Basis |
|---|---|---|---|
| SA-01 | Platform overview | `#/overview` | FRD 8.1.1 · `PM-11` |
| SA-02 | Institutions | `#/institutions` | FRD 1.3.5 · `PM-13` |
| SA-03 | Institution detail | `#/institution/<id>` | FRD 1.3.5 · AC-04 |
| SA-04 | Module releases | `#/releases` | FRD 2.3.2 |
| **SA-05** | **Release decision** | `#/release/<id>` | FRD 2.3.2 · FLOW 10 — **write** · `D-01` |
| SA-06 | Device replacement requests | `#/device-requests` | FRD 2.4.2 |
| **SA-07** | **Device request detail** | `#/device-request/<id>` | FRD 2.4.2 · FLOW 8 — **write** |
| SA-08 | Licensing | `#/licensing` | FRD 8.1.1 · 6.2.1 · `OQ-03` |
| SA-09 | Platform roles | `#/platform/roles` | FRD 8.1.1 · `QD-02` |
| SA-10 | Platform configuration | `#/platform/configuration` | FRD 8.1.1 |

## Run the prototype

Open `prototype/batch05-prototype.html` in any browser — **including Safari from `file://`**, which is verified.

```
prototype/batch05-prototype.html
```

No backend, no API, no database, no tenant service, no role service, no identity provider, no analytics, **no network request of any kind**. All institutions are fictional. Every person, identifier, module, version and date is sample design data.

**Reset Demo** restores the exact initial state — verified byte-identical.

## Documents

| File | What it holds |
|---|---|
| [`01_SOURCE_AND_SCOPE.md`](01_SOURCE_AND_SCOPE.md) | Sources, precedence, what is in and out of scope and why |
| **[`02_SUPER_ADMIN_AUTHORITY_AUDIT.md`](02_SUPER_ADMIN_AUTHORITY_AUDIT.md)** | **The audit. Read first.** Every capability classified, with verbatim sources |
| [`03_SUPER_ADMIN_UX_MODEL.md`](03_SUPER_ADMIN_UX_MODEL.md) | The workspace, its vocabulary, the **assumption register**, the **open questions** |
| [`04_PLATFORM_ADMIN_MODEL.md`](04_PLATFORM_ADMIN_MODEL.md) | Releases · device approvals · platform roles · configuration · licensing |
| [`05_CROSS_TENANT_MODEL.md`](05_CROSS_TENANT_MODEL.md) | The platform / tenant boundary and how `AC-04` is enforced |
| [`06_COMPONENT_EXTENSIONS.md`](06_COMPONENT_EXTENSIONS.md) | Five new components, and the two inherited accessibility corrections |
| [`07_SCREEN_INVENTORY.md`](07_SCREEN_INVENTORY.md) | Ten screens, 26 states, full traceability |
| [`FIGMA_HANDOFF_LATER.md`](FIGMA_HANDOFF_LATER.md) | What a later Figma pass would need |
| [`qa/ACCESSIBILITY_AND_UX_QA.md`](qa/ACCESSIBILITY_AND_UX_QA.md) | Accessibility, responsive, behaviour and requirement-safety results |

## QA result

| Check | Result |
|---|---|
| Automated accessibility & overflow | **PASS** — 42 route/width combinations, zero findings |
| Colour contrast (WCAG 2.1) | **PASS** — 34 pairs, zero failures |
| Behaviour & state isolation | **PASS** — 38 assertions, including byte-identical Reset Demo |
| Requirement safety | **PASS** — 489 control labels across 20 routes, no unsupported responsibility |
| Console errors | **Zero** |
| Network requests | **Zero** |
| Safari `file://` | **PASS** *(27 Aug self-test)*. On 29 Aug the release table was **measured directly in Safari** at 1440 and 1280 — `display:block`, zero run-together lines, zero clipping. A manual review that saw otherwise was reading a **cached pre-fix stylesheet**; empty Safari's cache before re-checking. Structure and the zero-external-dependency guarantee re-verified and unchanged. See the QA doc §7 |
| 1440 · 1280 | Clean, no horizontal overflow, nothing clipped |

**Re-run 29 August 2026**, after the version-release terminology pass and the scoped table-hierarchy correction: all four suites **PASS** unchanged — 42 route/width combinations, 34 contrast pairs, **38** behaviour assertions, **489** control labels across 20 routes — with zero console errors, and **Reset Demo** additionally verified end-to-end in the live prototype.

**Screenshots refreshed 29 August 2026**, in two passes: **18** after the terminology change, then **11** more after the `OQ-03` student-cap removal. **35 of 38 are byte-identical to a current-prototype render.** The three exceptions are the dialog captures, whose underlying screens are byte-identical and whose residual difference is the dialog entrance-animation blend, so the stored files are kept. No capture shows the retired *Release to production* / *Hold release* wording, and none shows a student cap, seat figure or capacity limit. Details in [`qa/ACCESSIBILITY_AND_UX_QA.md`](qa/ACCESSIBILITY_AND_UX_QA.md) §1.

## Open PM clarifications

Two source interpretations are genuinely open. Both took the **least-assumptive reversible** reading, both are classified **`OPEN PM CLARIFICATION`**, and both are surfaced on the screens themselves — not only in these documents.

### `D-01` — **OPEN PM CLARIFICATION**

> **"After Content Manager publishes content, does Super Admin still retain the separate Phase-1 version release/hold authority from FRD 2.3.2?"**

`PM-18` removed Super Admin from the *publication flow*. FRD 2.3.2 is a separate Phase-1 requirement, `UNCHANGED-FRD`, with its own flow (FLOW 10), and §6.6.5 records the ambiguity in the FRD's own words.

**Position meanwhile.** The 2.3.2 capability is kept, and kept **isolated and reversible**:

- The two controls are **Release version** and **Hold version** — named for what they act on. *Release to production*, *Production release* and *Hold release* are **retired** from every control, dialog title, confirmation label and page head. *Production* survives only where it explains the consequence, in FRD 2.3.2's own words.
- `SA-04` and `SA-05` state in product language that **content publication has already occurred** and that this is **version release control only**. Neither is a second publication gate.
- Release state is read and written by `SA-04` and `SA-05` alone. **If the PM rules otherwise, the two screens withdraw as a pair — exactly as Batch 01's two publish screens did — leaving no orphaned surface.**

### `D-02` — **OPEN PM CLARIFICATION**

> **"Which specific cross-tenant write actions does FRD 1.3.5's 'view and manage' authorise?"**

| Cross-tenant **visibility** | **Source-supported** — FRD 1.3.5 · `PM-13` · `AC-04` |
|---|---|
| Specific cross-tenant **write** actions | **OPEN / PENDING** — no source names one |

**Position meanwhile.** The institution surfaces are **entirely read-only**, and the question is asked on the page. Absent by design and verified mechanically: edit institution · deactivate institution · suspend institution · delete tenant · modify institution SSO · modify institution ERP · assign learner content · assign institutional licences · edit institution users.

Eleven open questions are carried forward unresolved. See [`03_SUPER_ADMIN_UX_MODEL.md`](03_SUPER_ADMIN_UX_MODEL.md) §6.

## Not done, deliberately

**No commit.** **No modification to any earlier batch, requirement, source, branding or review artefact.** **No final visual redesign.** **No open question resolved.** **No Batch 06.**
