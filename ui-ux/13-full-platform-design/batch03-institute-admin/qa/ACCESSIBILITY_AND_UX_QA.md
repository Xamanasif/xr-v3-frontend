# Batch 03 — Accessibility & UX QA

**Standard:** designed toward **WCAG 2.2 AA** (the Batch-01 / `D-11` baseline carried forward).
**Honest position:** ✅ **DESIGN REVIEW COMPLETED** · ⚠️ **IMPLEMENTATION ACCESSIBILITY TESTING NOT PERFORMED** — no assistive-technology pass, no automated conformance tooling, no user testing. **No conformance claim is made.** The prototype is a design artefact, not production code.

---

## 1 · Accessibility design review

Structural checks were executed programmatically against the running prototype across **all 18 routes**; the results below are what those checks returned, not an intention.

| Area | Position in Batch 03 | Result |
|---|---|---|
| **Landmarks** | `<header>`, `<nav aria-label="Workspace navigation">`, `<nav aria-label="Breadcrumb">`, `<main id="main-content">` on every product route; the prototype strip is its own labelled `nav` marked *not product UI* | ✅ 18/18 routes |
| **Headings** | Exactly one `<h1>` per view; section cards use `<h2>`, rail cards `<h2>`, nested groups `<h3>` | ✅ 18/18 routes |
| **Skip link** | First tab stop on every route; focuses `main` directly rather than fighting the hash router | ✅ present on every route |
| **Current location** | Exactly one `aria-current="page"` in the side navigation on every route; breadcrumb current item is `aria-current="page"` and not a link; the Institution Setup tab strip uses real links with `aria-current="page"` | ✅ 18/18 routes |
| **Tables** | Real `<table>` with `<caption class="sr-only">` and `<th scope="col">` on every column, on all six list surfaces | ✅ 0 tables missing a caption; 0 headers missing a scope |
| **Form labels** | Every input, select and textarea has a visible `<label for>` or an explicit `sr-only` label (search fields); required fields marked; the eligibility picker's radios are wrapped in labels with a consequence line each | ✅ 0 unlabelled controls |
| **Accessible names** | Every `<button>` and `<a>` carries text or an `aria-label` (icon-only controls: dialog close, toast dismiss; the eligibility Remove button names the population it removes) | ✅ 0 controls without a name |
| **Images & icons** | The logo has real alt text (`BITS Pilani WILP`) and a clean text-only fallback if it cannot load; all decorative inline SVG is `aria-hidden="true"` | ✅ 0 images without alt · 0 non-hidden decorative SVG |
| **Visible focus** | Global `:focus-visible` ring inherited from Batch 01, never suppressed; the eligibility picker's label rows also use `:focus-within` so the focused radio is visible on the whole row | ✅ rule present |
| **Dialogs** | `role="dialog"` + `aria-modal="true"` + `aria-labelledby` pointing at a real heading; focus trapped with Tab/Shift-Tab; **Esc closes**; backdrop click closes without destroying typed input; initial focus lands on the first control; focus returns to the invoker, or to `main` when the invoker was removed by the action | ✅ all four dialogs |
| **Live region** | `<div id="announcer" role="status" aria-live="polite">` announces every state change: details saved, connection check outcome, sign-in turned on, eligibility added or removed (with the resulting learner count), schedule saved, run started and completed, records retried and applied, validation failures | ✅ present |
| **Status never by colour alone** | Every badge is icon + words. Every attention row states the problem in a sentence. The tab-strip needs-attention dot is accompanied by `sr-only` " — needs attention". Run-history dots are decorative; the outcome is always written out. The reach-flow's pending cells read "No one yet" / "None" / "Not visible" in words | ✅ every badge carries text |
| **Reduced motion** | The Batch-01 global `prefers-reduced-motion` kill switch applies to every animation added here (spinner, dialog entrance, toast entrance) | ✅ rule present |
| **Error messaging** | Sign-on validation renders inline messages with an icon, sets `aria-invalid`, moves focus to the first offending field and announces the failure. The `hidden` attribute was restored in the Batch-03 sheet because the Batch-01 `.ferr` rule outranked it — without that fix, error text rendered permanently | ✅ fixed and verified |
| **Empty states** | Six cause-specific empty states, each saying what is empty and why, and offering the next step only where one honestly exists | ✅ |
| **No internal identifiers in product UI** | No FRD number, PM code, open-question reference, screen ID, phase label, protocol, provider, endpoint or schema term appears anywhere a user can see | ✅ verified across all 18 routes (§4) |

### Target size (WCAG 2.2 SC 2.5.8)

Every button, form control, navigation item, table action, chip filter and pill meets 24 × 24 px. During QA, **43 text links were below 24 px tall**; the Batch-03 sheet now gives row-level links a 24 px hit area using padding cancelled by an equal negative margin, so **nothing moves visually and the Batch-01 sheet stays untouched**.

**14 links remain below 24 px, all of one kind:** the inline links inside the person-detail sentence *"Through **Geotechnical & Soil Mechanics XR**, which reaches academic stream **B.E. Civil Engineering**"*. SC 2.5.8 **exempts** a target whose size is constrained by the line-height of the surrounding non-target text. **Stated, not hidden** — an implementation may still choose to enlarge them.

### Known gaps — stated, not hidden

- **Reflow / 1.4.10 remains out of scope.** Desktop-first per `D-15`, carried from Batch 01 and Batch 02. Layouts use fluid grids so a later reflow pass is not blocked, but no mobile administration scope is claimed.
- No assistive-technology pass has been run. Live-region wording is prototype copy and should be reviewed with a screen reader during implementation.
- Colour contrast is inherited from the Batch-01 contrast-annotated token set and was not independently re-measured for this batch; the only new colour usages are existing semantic tokens in existing roles.
- The eligibility dialog's dependent select repopulates when the population type changes; focus stays on the radio the user activated rather than moving to the select. Acceptable in a prototype; note for implementation.

---

## 2 · Comprehension checks

**As Institute Admin.** *What needs me right now?* → the Overview attention list, three real items, each with the control that resolves it ✓ · *Who is in my institution?* → People, with academic context and account state per person ✓ · *Why can this person see nothing?* → Person detail states the cause and links to the records that caused it ✓ · *What content may we use?* → Content Access, described by the experiments each record covers ✓ · *Who is eligible for it?* → the reach flow, the eligibility list with learner counts, and Access Mapping from both directions ✓ · *Which parts of my institution get nothing?* → Access Mapping's second section, in words ✓ · *Is our sign-in working?* → four distinct states with the next step named in each ✓ · *Is our institution data healthy?* → connection, schedule, last-run outcome, and a work list when it is not ✓ · *What do I do about a failed record?* → what happened, then what to do next, then retry ✓.

**As the eligible learner.** *What is available to me, and why?* → the content appears with *"Included in your institution's access"* ✓ · *What if nothing is there?* → an honest empty state directing them to their institution, **with no purchase prompt** ✓.

**What an Institute Admin deliberately cannot do here** — and would not expect to, because no control hints at it: buy anything, see a price, see a seat count, author a course, register a device, configure an assessment, read another institution's data, edit published content, or see an audit trail that nobody has specified.

---

## 3 · Visual QA

**Method.** Every base screen and curated state rendered and inspected at **1440 px**; representative screens re-checked at **1280 px**. Captures via headless Chrome (device scale factor 1) through `qa-seed.html` + `seed-states/*.json` partial state patches, each run starting from a reset state. **31 screenshots** in `screenshots/` — 26 at 1440 px, 5 at 1280 px.

**Defects found and fixed during QA:**

1. **Inline field errors rendered permanently.** The Batch-01 sheet gives `.ferr` an author `display:flex`, which outranks the UA rule behind the `hidden` attribute, so a red error icon showed under the eligibility select before any validation ran. Fixed by restoring `[hidden]` in the Batch-03 sheet — the Batch-01 sheet is not modified.
2. **Single sign-on showed "Not set up" after details were saved.** The status lookup keyed on the raw check state, and the saved-but-unchecked case collided with the never-configured case. Fixed by giving the saved-but-unchecked case its own key; all four states verified in sequence afterwards.
3. **The eligibility dialog's select was empty until the population type was changed.** It was only populated by the change handler. Fixed by populating on open.
4. **Focus was lost after a dialog action re-rendered the view.** `close()` returned focus to the invoking control, which no longer existed. Fixed by returning focus to `main` when the invoker is gone.
5. **43 text links below the 24 px target size.** Fixed with a zero-visual-change hit-area rule (§1).
6. **Missing `eye` icon** referenced by the person-detail action, which rendered an empty SVG. Added.

**Checked explicitly:** no horizontal scroll at 1440 or 1280 on any of the 18 routes, and no element extending past the viewport ✓ · the logo loads over http and over `file://`, and falls back cleanly to the text lockup when it cannot ✓ · table density and truncation at both widths ✓ · one primary action per context ✓ · every list has a distinct empty state ✓ · dialog behaviour (Esc, backdrop, focus return) ✓ · the prototype navigation strip is visually unmistakable and labelled *not product UI* on every route ✓ · unknown routes fall back to the Prototype Index rather than a blank page ✓.

**Functional paths executed end to end in a real browser before capture:**

- **A** Overview → People → Content Access → Institution Setup.
- **B** Content Access → *Surveying XR* (not yet reaching learners) → Add eligibility → academic stream → reaches 4 learners → Access Mapping gap closed → **learner access check shows the experiment**; then remove the eligibility and every step reverses, including the learner view.
- **C** People → Rahul Verma → his academic stream → the access reaching it; and Sana Basheer → the cause of her having no access → the records that caused it.
- **D** Single sign-on: empty-form validation (2 errors) → save → check (**did not succeed**) → check again (**checked**) → confirm dialog → **on**.
- **E** Institution data → Records needing attention → **retry before the cause is fixed** (correctly reports the records still need attention) → simulate the records corrected at source → retry each of the three issues → all applied, the two affected people change state, and the page reports nothing needs attention.

---

## 4 · Requirement-safety check (task brief §24)

A programmatic search over **the rendered product UI of all 18 routes** for language that would turn an open decision into a requirement.

**Terms searched:** price · pricing · cost · payment · invoice · billing · checkout · cart · purchase · buy · subscribe · subscription · plan · tier · renew · seat · quota · licence · license · SAML · OIDC · OAuth · LDAP · Azure · Okta · Microsoft · Google · Oracle · Moodle · SAP · endpoint · API · webhook · payload · schema · database · token · credential · SSO · ERP · FRD · PM- · OQ- · DA- · QP- · QT- · QD- · "Phase 1" · "Phase 2" · "Phase 3".

**Result: zero occurrences.** Not one of those terms appears anywhere a user can see, on any route, in any state.

A second search over the prototype source, the wireframes and the seven Batch-03 documents found the same terms **only** in (a) code comments and design notes stating that the concept is deliberately absent, (b) an explicit negation list in `05_SSO_ERP_MODEL.md`, and (c) one direct quotation of the FRD's own non-selection of an integration provider. **No assertion was found anywhere that a subscription type, catalogue subscription, seat model, price, renewal, entitlement assigner, manual-assignment requirement, automatic-assignment requirement, recurring B2C subscription, sign-on vendor or protocol, integration provider, or post-expiry behaviour has been decided.**

Two additional checks:

- **Every one of the six PM open questions is carried explicitly** in the Batch-03 documents, each with a statement of how the design stays truthful while it remains open.
- **All 14 design assumptions are registered** in `02_INSTITUTE_ADMIN_UX_MODEL.md` §7, each with the choice, the reason, its reversibility and the decision that would change it. **None is presented as a requirement anywhere.**

---

## 4b · Follow-up requirement-safety check (2026-08-25, before visual review)

Three specific claims were re-examined against the Detailed FRD. **Two were unsafe and were corrected; one was confirmed and is now cited.**

### "Run now" on Institution Data — **NOT source-supported → reclassified `DA-15`**

Searched the whole FRD set for a manual/on-demand synchronisation. What the source actually says:

- **FRD 7.2.1** requires *scheduled* synchronisation *"at configurable intervals"*. Its acceptance criterion is *"An Institute Admin sets the synchronisation interval and can see the last run, its outcome, its counts and its errors."*
- The Institute Admin's permitted-actions list reads *"Configure ERP integration and synchronisation interval (7.1.1, 7.1.2, 7.2.1)"*.
- The institutional-integration flow contains only *"Scheduled synchronisation runs at the interval the Institute Admin has configured."*
- The phrase "run now" appears **once** in the whole FRD set — in an unrelated XR passage (*"That it can be run now, and on which device"*).
- Its only prior appearance in the design chain is one cell in the Review-006 screen inventory (`IAD-12`, *"Set interval · run now"*) — a design-inventory entry, not a requirement.

**Handling: option B.** The control is **kept** (it is the only route to the run-in-progress state and the natural action after a source correction) and is now **explicitly classified `DA-15` — DESIGN ASSUMPTION, REVERSIBLE** in the assumption register, the screen inventory, the SSO/ERP model (new §2.3), the README, the prototype README, the wireframe annotation, and a comment at the code site. **It is presented nowhere as a confirmed requirement.**

### "Retry these records" — **CONFIRMED, now cited**

Three independent statements establish it, and all three are now quoted in the documentation:

> *"Given a failed ERP synchronisation run, when the Institute Admin views synchronisation history, then failed records are retained with a reason and a retry is available."* — Institute Admin acceptance criterion
> *"Failed records are retained with a reason, retry is available, and nothing is silently discarded."* — institutional-integration flow, step 5 (7.2.1)
> *"Given a synchronisation run containing failed records, when it completes, then failed records are retained with a reason, nothing is silently discarded, and a retry is available."* — acceptance-criteria register

### "Recorded by the platform team" — **withdrawn**

*"The platform team"* is not one of the seven approved roles, and **no source confirms who records institutional content access** (`OQ-01` open; the FRD's own list of unresolved Institute Admin details includes *"how an institutional licence is transacted in Phase 1"*). Three product strings implied an operational owner and were replaced with neutral wording:

| Before | After |
|---|---|
| Rail field: **Recorded — by the platform team** + date | **Recorded** — **date only, no actor** |
| Empty state: *"When the platform team records content access for your institution, it appears here…"* | *"Content access recorded for this institution appears here, with the experiments it covers."* |
| Rail note: *"Quote the reference if you contact the platform team about this content access."* | *"Quote this reference in any query about this content access."* |
| Institution data: *"The connection is set up with the platform team. Its technical details are confirmed by them…"* | *"The technical details of this connection are not edited here."* |

**One usage was deliberately kept:** *"The exact details required will be confirmed by the platform team"* on the sign-on form. That is the **Batch-01 precedent** (*"Package requirements will be confirmed by the platform team"*) and refers to **who will later confirm a pending technical detail** — not to who owns institutional content access. The two are different claims and are treated differently.

### Entitlement ownership — **no unsafe wording found**

A search for *"Institute Admin assigns"* and equivalents returned **one** hit: a row label inside a table explicitly headed *"If `OQ-04` resolves to…"*. It was reworded to *"…the **Institute Admin** being the assigner"* so its conditional nature is unmissable at row level, and the table now carries an explicit note that **no row is a prediction, a recommendation or a working position**, and that Batch 03 states nowhere that the Institute Admin assigns learner entitlements.

Product copy was re-read in the same pass. *"Choose who this content access reaches"* is imperative copy describing the control in front of the operator, not a business rule about ownership — it is unchanged, and `DA-07` carries the classification. The learner-facing *"Your institution decides which experiments are available to you"* attributes the decision to **the institution**, never to a role, and is now recognised as **source-confirmed**: FRD 7.2.3's acceptance criterion requires *"a student in an unmapped stream sees an empty entitlement state that explains what to do"*, and the FRD's flow note states such a state *"explains that the institution assigns access"*.

### Newly found source contradiction — recorded, not resolved by drawing

The FRD v5 draft carries the acceptance criterion *"Given a licence approaching its seat cap, when the Institute Admin views the institution overview, then seat utilisation is visible before learners are blocked."* **Batch 03 does not satisfy it, on purpose** — the FRD v5 set is a draft for review, the PM update of 2026-08-25 reopened the seat model as `OQ-03`, and the task brief instructed that seat counts be avoided. Recorded in full under `DA-08`; satisfiable later by adding one capacity row without changing any other screen.

### Academic Structure label — no change

Re-checked for a source contradiction and found none. *"Program"* appears in the Phase-1 FRD only as *certification programs* (deferred to a later phase), so the collision the label avoids is real. `DA-02` stands.

---

## 5 · Prototype QA checklist (task brief §25)

| # | Check | Result |
|---|---|---|
| A | All routes load | ✅ 18/18 render their expected `<h1>`; unknown routes fall back to the Prototype Index |
| B | Navigation works | ✅ side nav, breadcrumbs, setup tab strip, row links, cross-links between people ↔ structure ↔ access ↔ records |
| C | Seeded state resets | ✅ **Reset demo** restores the initial state; each QA capture starts from a reset |
| D | No console errors | ✅ zero console messages of any level across every route and every interaction exercised |
| E | Interactions remain local | ✅ all state changes are in-page; nothing is written outside `sessionStorage` (plus the one-shot QA patch key) |
| F | No external network dependency | ✅ three same-directory files and one same-directory image; no font, script, style, image, XHR, fetch, WebSocket, analytics or telemetry request leaves the page |
| G | Safari `file://` logo | ✅ construction verified; ⚠️ one part of the check could not be automated — see §6 |
| H | 1440 layout clean | ✅ no horizontal scroll, no clipped element, on any route |
| I | 1280 layout clean | ✅ no horizontal scroll, no clipped element, on any route |
| J | No Batch 01 / Batch 02 files modified | ✅ verified by `git status` — the only changes in the working tree are new files under `batch03-institute-admin/` |

---

## 6 · Logo verification

| Check | Result |
|---|---|
| Source untouched | ✅ `branding/bits-pilani-wilp-logo.png` is unmodified — `git status` reports no change under `branding/` |
| Local copy byte-identical | ✅ `cmp` reports no difference; SHA-256 `f98fe1f89cf99ab5058cfb34fed6857de0712a02ef71d611c3bcbdac17a7184c` matches the branding source exactly |
| Every subresource is same-directory | ✅ the page references exactly four subresources — `batch01-design-system.css`, `batch03-prototype.css`, `batch03-prototype.js` and `assets/bits-pilani-wilp-logo.png` — all relative to the prototype folder. **Safari's restriction applies to *parent-directory* subresources of a directly-opened local file, so it cannot apply to any of them.** This is the same construction Batch 02 documented as verified in Safari |
| Renders under `file://` | ✅ the prototype was loaded from a real `file://` URL in a real browser and captured: fully styled, logo present |
| Renders over http | ✅ verified in all 31 headless captures |
| Fallback | ✅ `onerror` removes the image and its divider and the text lockup stands alone — never a broken-image icon |

### What could not be automated — stated, not glossed

The prototype was **opened in Safari itself** from the `file://` URL during QA, but two automated verifications of that specific window failed for reasons outside the prototype:

- `screencapture -l <windowid>` returned *"could not create image from window"* — the shell running QA does not hold macOS screen-recording permission.
- Safari's `do JavaScript` Apple Event is refused unless **Allow JavaScript from Apple Events** is enabled in Safari's Developer settings, which it is not on this machine.

**So the Safari render was not machine-verified.** What *is* verified is the byte-identity of the asset, the same-directory construction that makes Safari's restriction inapplicable, and a real `file://` load in a real browser. The Safari tab was left open at the prototype so the result can be confirmed by eye in one glance.

---

## 7 · Files

| Item | Location |
|---|---|
| State seeder (needs an http server) | `qa-seed.html` |
| Partial state patches | `seed-states/*.json` — 9 files, each with a note explaining the state it produces. Eight drive a capture; `state-all-clear.json` (institution with nothing needing attention) is provided for review and is not captured |
| Captures | `screenshots/` — 26 at 1440 px, 5 at 1280 px |
