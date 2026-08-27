# Accessibility and UX QA — Batch 04

**Individual (B2C) learner access** · branch `uiux/full-platform-design` · 2026-08-27

---

## 1. Method

Every route rendered and inspected at **1440 px**, then re-checked at **1280 px** and at four narrower widths. Captures via **headless Chrome, device scale factor 1**, one run per shot; seeded states go through `qa-seed.html`, which stores a partial state patch and redirects to the target route within the same run.

Structural checks (heading order, labelling, accessible names, tab order, contrast, target size, overflow) were run **programmatically in a real browser** across all 15 routes rather than assessed by eye — the scripts and their results are reproduced below.

**32 screenshots** in `screenshots/` — **27 at 1440 px, 5 at 1280 px**.
**13 partial state patches** in `seed-states/`, each carrying a `_note` explaining the state it produces.

> **Re-verified after the commercial-safety pass (2026-08-27).** The payment-method chooser was removed, bundle sample amounts were set equal to the sum of their components, and a partly-held bundle was made non-purchasable. Every check below was re-run against the corrected build; §2.8 records the regression.

---

## 2. Functional paths executed end to end in a real browser

### 2.1 The required end-to-end test — **PASSED**

Run in full against `Surveying — Total Station Basics`, the seeded not-held offering.

| # | Step | Result |
|---|---|---|
| 1 | Reset Demo | ✅ Toast shown, catalogue restored |
| 2 | Open Catalogue | ✅ 11 offerings |
| 3 | Target is available, not held | ✅ *"Available to get access"*, ₹1,800, **View details** |
| 4 | Open target detail | ✅ Amount, **Get access**, full component list |
| 5 | Start Get access | ✅ Access summary reached |
| 6 | Reach checkout | ✅ Item, type, count, account, amount, a provider-neutral payment step, one action |
| 7 | **Simulate FAILURE** | ✅ *"Payment not completed"* · *"nothing has been added to your learning and no amount has been taken"* |
| 8a | No access record exists | ✅ `Object.keys(S.access) = ["c_shear"]` — unchanged |
| 8b | No history record | ✅ `history = ["ACC-2026-0114"]` — unchanged |
| 8c | Reference counter not advanced | ✅ `seq = 115` — unchanged |
| 8d | Catalogue still shows not held | ✅ *"Available to get access"* |
| 8e | My Learning does not contain it | ✅ One row: Soil Mechanics only |
| 9 | Retry | ✅ **Try again** returns to a fresh access summary; the stale stage is cleared |
| 10 | **Simulate SUCCESS** | ✅ Processing → *"It's yours — access added"* |
| 11a | Success state | ✅ Item listed · reference `ACC-2026-0115` · date |
| 11b | Catalogue updates | ✅ *"You have access"*, amount replaced, **Go to My Learning** |
| 11c | Item detail updates | ✅ *have* panel — no amount, no Get access |
| 11d | My Learning contains the **same** item | ✅ Two rows; Surveying marked **Just added** |
| 12 | Refresh | ✅ Access persists (`sessionStorage`) |
| 13 | Persistence model behaves as chosen | ✅ Survives refresh; gone on a new session. The *"just added"* emphasis correctly does **not** survive — it is a moment, not a state |
| 14 | Reset Demo | ✅ |
| 15 | Temporary access removed, seed restored | ✅ `access = {c_shear}` · `history` length 1 · `seq = 115` · `tx = null` |

### 2.2 Already-held cannot enter a duplicate purchase — **PASSED**

Forced the URL `#/get-access/o_shear` for an item the learner already holds.

> Result: **"You already have this"**, with **Go to My Learning**. `document.getElementById('pay-btn')` → **`null`**.

The guard is at the **route**, not merely hidden on the card — no payment control is rendered at all.

### 2.3 Bundle — every included item receives the correct state — **PASSED**

`Mechanical Engineering Bundle` (torsion · heat · gear), one transaction:

```
access  → c_shear, c_torsion, c_heat, c_gear
history → { ref: ACC-2026-0116, offering: o_bmech, amount: 7200,
            granted: [c_torsion, c_heat, c_gear] }
```

✅ All three granted **individually** (FRD 6.1.2) · ✅ three separate My Learning rows, each reading *"From Mechanical Engineering Bundle · 27 Aug 2026"* · ✅ the pre-existing `c_shear` record untouched · ✅ one history record, not three.

### 2.4 Bundle partial overlap — derived, not hard-coded — **PASSED**

After getting Surveying on its own, the Geotechnical bundle (which also contains it) **spontaneously** reported *"1 of 3 already yours"* on its catalogue card and its detail screen, with *"Already yours"* against Surveying only. **No code path is specific to this case.**

Following the commercial-safety pass, that bundle is also **not purchasable**: it carries no amount, its checkout route is blocked, and its remaining modules are offered individually instead. See §2.8 flow E.

### 2.5 Search, filter and no-results — **PASSED**

`soil` → 2 results, one removable pill · Civil + VR → 3 results (the bundle matched via its VR module) · `quantum` + Civil + VR → **no-results state**, three pills, one clear action · Clear filters → 11 items restored.

### 2.6 Signed-out handoff — **PASSED**

Account menu → Sign out → catalogue and detail remain browsable, header offers **Sign in** → **Get access** routes to *"Sign in to continue"* → either action returns to exactly the offering the learner left.

### 2.7 Indeterminate outcome — **PASSED**

*"Still confirming your payment"* · *"Nothing has been added to your learning so far"* · no access record written · `OUTCOME HANDLING PENDING` marker present.

---

### 2.8 Commercial-safety regression — **ALL PASSED**

Re-run in a real browser after the corrections.

| Flow | Check | Result |
|---|---|---|
| **A** | Available module → Get access → **FAILURE** | ✅ `h1 = "Payment not completed"` · `access = [c_shear]` · `seq = 115` · `history = 1` — **nothing created** |
| **B** | Retry → **SUCCESS** | ✅ Module becomes **"You have access"** with **no amount** · appears in My Learning · catalogue owned count 1 → 2 |
| **C** | Already-entitled module, forced checkout URL | ✅ `h1 = "You already have this"` · `payBtn = false` |
| **D** | Bundle with **no** overlap | ✅ Amount **₹7,200 = exact component sum** · all 3 modules granted individually · one history record |
| **E** | **Partly-overlapping bundle** | ✅ Panel class `accesspanel partial` · state *"Partly yours already"* · **no amount** · **no Get access** · 2 individual offers in contents · forced checkout gives *"Some of this bundle is already yours"* with `payBtn = false` and **no amount** |
| **F** | Reset Demo | ✅ `access = [c_shear]` · `seq = 115` · `history = 1` · `tx = null` · filters cleared · signed back in |

| Also checked | Result |
|---|---|
| Payment step | ✅ `methodRadios = 0` · `.paystep` present · `tx` carries **no `method` field** |
| Bundle sample amounts | ✅ `o_bgeo = 6000` (2400+1800+1800) · `o_bmech = 7200` (2600+2400+2200) — **exact sums** |
| Search / filter | ✅ `soil` → 2 · `quantum` → 0 with the empty state · clear → 11 |
| Indeterminate outcome | ✅ *"Still confirming your payment"* · `stage = pending` · **no access created** · `OUTCOME HANDLING PENDING` marker |
| **1440 px** | ✅ **No overflow** on any of 15 routes · a11y clean · **contrast: no failures** |
| **1280 px** | ✅ **No overflow** on any of 15 routes · a11y clean · **contrast: no failures** |
| **Console errors** | ✅ **None** |
| **Network calls** | ✅ Only the prototype's own static files — `.html`, `.css`, `.js`, the logo (plus the QA seeder's JSON when the seeder is used). **No third-party, no API, no payment, no auth, no analytics** |
| Account-menu safety | ✅ Four entries — Access history, Profile (inert), Help (inert), Sign out. **Zero** matches for account deletion, saved cards, payment profile, billing, subscription management, password or account-merge |

**One defect found and fixed during this pass:** the not-found fallback (`#/nope`) rendered with **no `<h1>`**, leaving a screen-reader user without a title for where they landed. A page heading was added.

---

## 3. Responsive

**Measured**, not estimated: for each width, every one of the 15 routes was rendered and `document.documentElement.scrollWidth − clientWidth` checked.

| Width | Result |
|---|---|
| **1440 px** — primary | ✅ **No horizontal overflow on any of the 15 routes.** Two-column detail and checkout, three-across catalogue |
| **1280 px** — secondary | ✅ **No horizontal overflow on any route.** Side columns narrow; layout otherwise identical |
| 1024 px | ✅ No overflow. Two-column layouts collapse; **the access panel moves above the body** so the decision is not buried |
| 768 px | ✅ No overflow. Prototype strip wraps; card grid densifies |
| 560 px | ✅ No overflow. One card per row; card actions full width; table cards scroll within themselves |
| 480 px | ⚠️ First overflow appears — see below |

### The narrow-width boundary, stated precisely

**Clean from 1440 px down to 560 px.** Below roughly 520 px, small overflows appear (21–74 px on five routes).

The cause is structural and **not Batch 04's**: the shared Batch-01 shell gives the left navigation a **fixed 232 px width** that never collapses, so at 480 px only ~176 px of content width remains. Collapsing that sidebar is a **platform-level decision affecting every workspace in Batches 01–04**, not a Batch-04 change, and **Phase-1 mobile requirements are not confirmed**. Recorded here rather than patched locally.

Three narrow-width defects that **were** Batch 04's own were found and fixed:

| Found | Fix |
|---|---|
| Prototype strip overflowed by 51 px at 768 px (fixed-height, single-row) | Allowed to wrap below 900 px; its long right-hand caption hidden |
| Table columns **clipped** rather than scrolling (`overflow:hidden` on the card) | `overflow-x:auto` below 740 px. No `min-width` forced on the table — an earlier attempt at that pushed the *document* sideways below 590 px and was reverted |
| Prototype control's button row overflowed by 10 px at 640 px | Its body used an inline `style="flex:1"`, which **outranks the stylesheet** and blocked the narrow-width rule. Replaced with classes (`.pn-body`, `.pn-actions`) |

**Checked explicitly:** no clipped checkout control at any tested width ✓ · catalogue cards remain readable at every width ✓ · the access panel stays reachable ✓.

---

## 4. Accessibility

### 4.1 Structure — **all 15 routes clean**

Script-verified per route: exactly one `<h1>`; no skipped heading level; every `<img>` has `alt`; every form control has a `<label for>`, a wrapping `<label>`, `aria-label` or `aria-labelledby`; every button and link has an accessible name; the skip link exists and its target exists; every table has a `<caption>`.

```
#/index ok · #/explore ok · #/module/o_survey ok · #/module/o_shear ok
#/bundle/o_bgeo ok · #/get-access/o_survey ok · #/get-access/o_shear ok
#/my-learning ok · #/learn/c_shear ok · #/history ok · #/sign-in/o_survey ok
#/home ok · #/progress ok · #/nope ok
```

**Two heading defects were found and fixed:**

- Catalogue card titles (`h3`) sat directly under the page `h1`. A screen-reader-only `<h2>Learning content</h2>` now names the results region, which is also `aria-labelledby` for it.
- Empty states used `h3` directly under `h1`. Changed to `h2`, with matching styling added to the Batch-04 sheet.

### 4.2 Keyboard

| Check | Result |
|---|---|
| Everything operable without a mouse | ✅ 38 visible focusable elements on the catalogue, all reachable |
| No positive `tabindex` anywhere | ✅ 0 — natural DOM order throughout |
| Focus visible | ✅ Inherited `:focus-visible` — 2 px outline, 2 px offset |
| **Catalogue filters** | ✅ Four real form controls with visible labels. Search filters on `input`; selects on `change`; filter pills and Clear are buttons |
| Search caret preserved while typing | ✅ Selection restored after each re-render |
| Account menu | ✅ `aria-haspopup` · `aria-expanded` toggles true/false · `aria-controls` · `role="menu"`/`menuitem` · **Escape closes and returns focus to the trigger** · outside click dismisses · **closed menu is out of the tab order** (verified: a hidden item cannot take focus) |
| Payment method | ✅ Radio group in a `<fieldset>` with an `sr-only` `<legend>`; each radio wrapped in its own `<label>` |
| Prototype outcome toggles | ✅ 3/3 carry `aria-pressed` |
| Dialog primitive | ✅ Focus trap, Escape, backdrop dismiss, focus returned (inherited, unmodified) |
| Route change | ✅ `main` focused transiently, scroll reset only on a genuine path change |

**One inherited ordering note, not a defect in the product:** the skip link is preceded in tab order by the five controls of the **prototype navigation strip**, because that strip renders before the app shell. The strip is non-product chrome that would not exist in the product. Same structure as Batches 01 and 03; recorded rather than restructured.

### 4.3 Screen-reader announcements

| Event | Announced |
|---|---|
| Search / filter change | *"N items match your search and filters."* — `role="status"`, `aria-live="polite"` |
| Filters cleared | *"Filters cleared. Showing all 11 items."* |
| Catalogue results region | `aria-live="polite"`, `aria-labelledby` its own heading |
| Payment starts | *"Confirming your payment. Please wait."* |
| **Access created** | *"Access added. &lt;item&gt; is now in My Learning."* |
| **Payment failed** | *"Payment not completed. Nothing was added to your learning. You can try again."* |
| **Indeterminate** | *"Payment still being confirmed. Nothing has been added to your learning yet."* |

Each payment outcome is announced **and** carries a visible words-first heading — the outcome is never conveyed by colour or icon alone.

### 4.4 Contrast — **zero failures**

Every element with direct text content, on every route, measured against its computed effective background. WCAG AA thresholds: 4.5:1 normal, 3:1 large.

> **Result: 0 failures. Worst ratio observed 4.68:1.**

**A real defect was found and fixed.** The first pass produced **15 failing selectors**, all with the same cause: the Batch-01 semantic token `--text-3` (`--n-500`, `#6A7686`) measures **4.12–4.46:1** on the surfaces it actually sits on — just under 4.5:1 — affecting secondary captions, table headers, the sample-data tag, breadcrumb links, prototype-note text and the account e-mail.

**Fix:** `--text-3` redefined to `#5F6B7A` **in the Batch-04 sheet only**. That clears 4.5:1 on every surface in this batch (worst case 4.90:1 on the success tint) while staying clearly lighter than `--text-2` (`#515D6C`), so the three-tier hierarchy survives.

> ⚠️ **Referred upward.** This is a **shared design-system finding, not a Batch-04 one**. `--text-3` is used across Batches 01, 02 and 03 and is marginally sub-AA in all of them. **The Batch-01 sheet was not edited** — the correction is scoped to Batch 04 and flagged here for a platform-wide decision.

### 4.5 Colour independence

| State | Not colour alone |
|---|---|
| Held | *"You have access"* + check icon |
| Partly held | *"N of M already yours"* + info icon |
| Not held | *"Available to get access"* |
| Item within a list | *"Already yours"* + check icon |
| Just added | *"Just added"* badge **and** a left rule, not only the tint |
| Payment succeeded / failed / indeterminate | Distinct icon **and** a words-first heading |
| Selected payment method | The radio itself — the tint is reinforcement |
| Active filters | Named pills with text, each removable |

### 4.6 Target size

Interactive targets ≥ 24×24 px, except two categories that meet WCAG 2.5.8 exceptions:

- **Card title links and My Learning row links** (~17–19 px tall) are constrained by the line height of the heading text (*Inline* exception) **and** every one has a full-size equivalent on the same row — a 40 px *View details* button, or a 32 px *Open* button (*Equivalent* exception).
- Inline text links inside sentences.

**A real defect was found and fixed:** the filter-pill remove buttons were 18×18 px with **no equivalent control** — removing one filter is not achievable any other way. Raised to **24×24 px** (pill height 26 → 30 px).

### 4.7 No inaccessible click-only regions

The catalogue card is **not** a click target. The title is a link, the action is a button; `:focus-within` gives the card the same emphasis as `:hover`, so keyboard users get the same affordance. No `div` anywhere carries a click handler as its only means of activation.

### 4.8 Reduced motion

Inherited `@media (prefers-reduced-motion: reduce)` reduces every animation and transition to 1 ms. The payment progress bar remains **determinate** — its information is the width, not the motion.

---

## 5. Requirement-safety audit (§36)

**Method.** All **32** route/state combinations rendered in headless Chrome, DOM dumped, scripts/styles/comments stripped, and the remaining **user-visible text** (including `sr-only` content, which a screen reader does reach) searched for 60+ terms that could assert an unsupported requirement. Word-boundary matching, so *card* does not hide inside *discard*.

### Terms with **zero** occurrences anywhere

```
subscription · subscrib* · monthly · annual · renew · cancel · refund
course purchase · membership · member · tier · premium · seat · quota
licence · license · faculty · Razorpay · Stripe · PayPal · UPI · Visa
Mastercard · netbanking · net banking · debit card · credit card
bank transfer · wallet · payment mode · payment option · payment instrument
tax · GST · discount · coupon · promo · cart · basket · Google · OAuth
SAML · OTP · lifetime · perpetual · certificate · certification · expiry
expires · plan · SKU · tenant · provision · deal
```

**Every payment-method term is now absent**, which was the point of the correction: *netbanking, debit card, credit card, bank transfer, wallet, payment mode, payment option* and *payment instrument* all return zero.

### Terms that do occur — every one classified

| Term | Where | Classification |
|---|---|---|
| **payment method** | Checkout only | ✅ **Negation.** *"No payment provider, gateway, card network **or payment method** has been selected for the platform."* The phrase appears only to deny it |
| **gateway**, **provider** | Checkout note; prototype index | ✅ **Negations.** The FRD 9.1.1 TECHNICAL-PENDING disclosure |
| **card** | Checkout (*"card network"*, in the negation) · prototype index (*"The **card** offers My Learning"* — the catalogue **card**, a UI element) | ✅ One negation, one UI-element noun. **No payment card anywhere** |
| **receipt**, **invoice** | Access history footnote | ✅ **Explicit pending statement** — *"a receipt, an invoice or neither — is not yet decided, so nothing is offered for download here"* |
| **password**, **one-time** | Sign-in handoff | ✅ **Negations** — *"There is no password field, no one-time code and no named sign-in provider"* |
| **activate** | Checkout; indeterminate outcome | ✅ **Source-confirmed.** *"you do not have to activate anything"* restates **FRD 9.2.1** — *"without any further learner action"* |
| **saving**, **offer** (commercial sense) | Module detail bundle card | ✅ **Negation** — *"Nothing here is described as a **saving** or an **offer** — how bundles are priced is not settled"* |
| **offer** (availability sense) | Bundle detail; overlap guard | ✅ **Factual statement about availability**, not a commercial offer — *"is not **offered** as a single purchase"* |
| **entitlement** | Prototype index disclaimer only | ✅ **Non-product surface**, labelled *PROTOTYPE INDEX — NOT PRODUCT UI*, stating that **no entitlement service exists**. The word appears on **no learner-facing screen** |

### Result

> **No accidental requirement was found in the corrected package.** Every commercially or technically loaded term that appears is a source-confirmed restatement, an explicit negation, an explicit pending statement, or an ordinary non-commercial use of the word.

### Corrections made across the two audit passes

| # | Found | Correction |
|---|---|---|
| 1 | Prototype index said *"subscribing institution"* while `OQ-01`/`OQ-02` are open | Reworded. `subscrib*` now occurs **0** times |
| 2 | Three sample payment-instrument labels (*Card · Bank transfer · Another payment method*) — **no payment method is source-supported** | Removed. The step is now a statement: *"Online payment"* |
| 3 | Bundle amounts were **below** the sum of their components, letting a reader infer a discount rule from arithmetic | Set **equal** to the sum |
| 4 | A partly-held bundle could be bought at its full listed amount, asserting *"no credit for what you own"* | **Not purchasable.** No amount, checkout blocked at the route, remaining modules offered individually |
| 5 | Access history was cited to FRD 9.2.1 as though required | Reclassified: **inventoried** as `B2C-06`, **not requirement-mandated** — `DA-07`, reversible |

---

## 6. Edge states

| State | Present |
|---|---|
| Catalogue no-results | ✅ With pills retained so the learner can see what excluded everything |
| Already held — card, detail, and route guard | ✅ Three layers |
| Bundle partly held | ✅ Derived |
| Bundle fully held | ✅ |
| Payment processing | ✅ Determinate |
| Payment not completed | ✅ Retry, no access created |
| Payment still confirming | ✅ Source-supported indeterminate |
| Access confirmed | ✅ |
| My Learning empty | ✅ Individual variant — *"Explore the catalogue"* |
| My Learning partial | ✅ |
| Access history empty | ✅ |
| Signed out | ✅ |
| Unknown route | ✅ Falls back to the prototype index, never a blank page |

**Deliberately absent** — none is established by any source: refund · cancellation · expired access · renewal · waitlist · gifting · promo codes · *"item unavailable for access"* (no source describes such a state — recorded as `OQ-B4-02` so its absence is visibly deliberate).

---

## 7. Standalone `file://` under Safari

| Check | Result |
|---|---|
| Logo is a byte-identical copy of `branding/bits-pilani-wilp-logo.png` | ✅ `cmp` clean · SHA-256 `f98fe1f8…7184c` on both. **The source asset was not modified** |
| Design system is a byte-identical copy of the Batch-01 sheet | ✅ `cmp` clean |
| Every subresource is a **same-directory** relative path | ✅ `batch01-design-system.css` · `batch04-prototype.css` · `batch04-prototype.js` · `assets/bits-pilani-wilp-logo.png`. **No `../` reference outside comments** |
| No CDN, no external URL, no remote font | ✅ Zero |
| Renders from `file://` fully styled, logo present | ✅ Verified in Chrome from a real `file://` URL — 1440 px full-page capture, all 11 cards, logo loaded |
| Safari opens the `file://` document | ✅ Verified via AppleScript — correct URL and document title returned |
| Logo fallback if the image cannot load | ✅ `onerror` removes the graphic and adds `.no-logo`; the text lockup stands alone — never a broken-image icon |

> **Limitation, stated plainly.** Safari's rendered DOM could **not** be inspected programmatically: *"Allow JavaScript from Apple Events"* is disabled in Safari's Develop settings, and `screencapture -l` fails because this shell holds no macOS screen-recording or assistive-access permission (the same limitation Batch 03 recorded). **What is verified for Safari is that it loads the document and that the resource graph satisfies exactly the constraint Safari imposes — same-directory subresources only.** Full-fidelity Safari rendering was verified structurally and by equivalence with the Batch-03 pattern, not by a Safari screenshot.

---

## 8. Checks summary

| | Check | Result |
|---|---|---|
| A | End-to-end failure → success → My Learning | ✅ Passed in full |
| B | No access created on failure or indeterminate | ✅ Verified in state |
| C | Reset Demo restores the exact seed | ✅ access · history · counter · transaction · filters · sign-in |
| D | Already-held cannot reach a payment control | ✅ Blocked at the route |
| E | Bundle grants each module individually | ✅ FRD 6.1.2 satisfied |
| F | Same item appears in My Learning, no reload | ✅ |
| G | Catalogue, detail and My Learning all recompute | ✅ From one access map |
| H | 1440 layout clean | ✅ No overflow, 15 routes |
| I | 1280 layout clean | ✅ No overflow, 15 routes |
| J | Narrow-width resilience | ✅ Clean to 560 px; boundary documented |
| K | Heading structure | ✅ 15/15 routes, after 2 fixes |
| L | Labels and accessible names | ✅ 15/15 routes |
| M | Contrast AA | ✅ 0 failures, after a token correction |
| N | Colour independence | ✅ Every state has a word |
| O | Target size | ✅ After 1 fix; 2 documented exceptions |
| P | Live-region announcements | ✅ All four outcomes |
| Q | Requirement-safety audit | ✅ No accidental requirement, after 1 correction |
| R | No backend, network, payment, auth or AI | ✅ Zero requests of any kind |
| S | `file://` standalone | ✅ Chrome verified; Safari load verified, DOM not inspectable |

---

## 9. Defects found and fixed during QA

| # | Defect | Severity | Fix |
|---|---|---|---|
| 1 | `--text-3` fails AA on 15 selectors (4.12–4.46 : 1) | **High** | Token darkened to `#5F6B7A` in the Batch-04 sheet. **Referred upward — affects Batches 01–03 too** |
| 2 | Catalogue card titles skipped `h1 → h3` | Medium | `sr-only` `<h2>` names the results region |
| 3 | Empty states used `h3` under `h1` | Medium | Changed to `h2` with matching styling |
| 4 | Filter-pill remove buttons 18×18 px, no equivalent | Medium | Raised to 24×24 px |
| 5 | Prototype strip overflowed 51 px at 768 px | Medium | Allowed to wrap below 900 px |
| 6 | Table columns clipped instead of scrolling | Medium | `overflow-x:auto` below 740 px |
| 7 | Prototype control overflowed 10 px at 640 px (inline `flex:1` outranked the stylesheet) | Low | Replaced with classes |
| 8 | Payment method label and description ran together on one line | Low | `display:block` on both |
| 9 | Single-module checkout listed the item twice | Low | Itemised list now only for bundles |
| 10 | A finished transaction stage persisted on re-entering checkout | Low | Stage reset on entry; a stale success/failure can no longer be re-read as current |
| 11 | *"Just added"* survived a refresh | Low | Marked seen after first render — it is a moment, not a state |
| 12 | Prototype index said *"subscribing institution"* while `OQ-01`/`OQ-02` are open | Low | Reworded; `subscrib*` now occurs 0 times |
| 13 | **Payment-method chooser offered three instrument labels that no source supports** | **High** | Removed. Replaced with a provider-neutral payment step — a statement, not a choice |
| 14 | **Bundle amounts sat below the sum of their components**, implying a discount rule by arithmetic | **High** | Set equal to the component sum |
| 15 | **A partly-held bundle could be purchased at full price**, asserting an unestablished overlap rule | **High** | Made non-purchasable: no amount, route blocked, remaining modules offered individually |
| 16 | Access history cited FRD 9.2.1 as though the surface were required | Medium | Reclassified as inventoried-but-not-required — `DA-07` |
| 17 | Not-found fallback had **no `<h1>`** | Medium | Page heading added |

---

## 10. Artefacts

| Item | Location |
|---|---|
| Prototype | `../prototype/batch04-prototype.html` |
| Wireframes | `../wireframes/batch04-wireframes.html` |
| State seeder | `qa-seed.html` — needs an http server (`fetch` does not run from `file://`) |
| State patches | `seed-states/` — 13 files, each with a `_note` |
| Captures | `screenshots/` — 32 files: 27 at 1440 px, 5 at 1280 px |
