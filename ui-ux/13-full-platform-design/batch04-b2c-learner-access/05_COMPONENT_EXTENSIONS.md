# 05 — Component Extensions

**Batch 04 · Individual (B2C) learner access**

---

## 1. Rule

**Batch 04 adds components. It changes nothing.**

`prototype/batch01-design-system.css` is a **byte-identical snapshot** of `ui-ux/13-full-platform-design/prototype/batch01-prototype.css` — verified with `cmp`. Batch 01 remains the source of truth; the local copy exists only because Safari blocks parent-directory subresources for a document opened directly from `file://`, which left the page unstyled. Same-directory references load everywhere.

`prototype/batch04-prototype.css` contains **extensions only**:

- **No design token is redefined.** No new colour, no new radius, no new shadow, no new type size outside the existing ramp.
- **No Batch-01 component is restyled.** Buttons, badges, alerts, tables, forms, dialogs, cards, empty states, toasts and the shell are used exactly as Batch 01 defines them.
- Two narrow-width rules **adjust** Batch-01 chrome without editing the Batch-01 sheet, and both say so in a comment (§5).

---

## 2. Reused unchanged from Batch 01

| Component | Used for |
|---|---|
| App shell — `.protobar` `.topbar` `.snav` `.frame` `.main` | Every route |
| `.brand` + logo fallback | Header, including the `no-logo` path |
| `.btn` `.pri` `.sec` `.gho` `.lg` `.sm` `.blk` | Every action |
| `.badge` `.b-success` `.b-info` `.b-outline` `.b-neutral` | Access states |
| `.fmt` `.fmt-web` `.fmt-vr` `.fmt-mr` `.fmt-ar` | Delivery formats — the Batch-01 format colours, unchanged |
| `.alert` `.info` `.success` `.warning` `.danger` | Notices and outcome detail |
| `.card` `.chead` `.cbody` | Content sections |
| `.tablecard` `.listbar` `table.dt` | My Learning · Access history |
| `.empty` `.echip` | Empty and no-result states |
| `.searchbox` | Catalogue search |
| `.field` `.checkrow` | (no longer used — the payment step has no form control) |
| `.progressbar` | Payment progress |
| `.sample-tag` | Sample-data marking |
| `.proto-note` `.pn-label` | Prototype controls and signposts |
| `.crumb` `.phead` `.pmeta` `.pactions` | Page headers |
| `.toast` `.toasts` · `.scrim` `.dialog` | Feedback and dialog primitives |
| `.index-wrap` `.pathcard` `.rolecard` | Prototype index |
| `.sr-only` `.skip-link` `:focus-visible` | Accessibility primitives |

**The design system was sufficient for a learner-facing catalogue.** Everything below is genuinely new structure, not restyling.

---

## 3. New in Batch 04

### 3.1 `.filterbar` — catalogue discovery

Four labelled controls on one surface, with an active-filter footer.

| Part | Purpose |
|---|---|
| `.fb-row` | Search (flexible) + three selects + Clear filters |
| `.fb-foot` | Result count and removable filter pills |
| `.fb-count` | `N items` — or `N items of 11` when a filter is active |
| `.fb-pills` / `.fpill` | One pill per active filter, each with its own remove button |

Every control has a **visible label**, not a placeholder standing in for one. `.fpill button` carries an `aria-label` naming the filter it removes.

### 3.2 `.catgrid` / `.catcard` — the catalogue card

Auto-filling grid, minimum 316px. The card is a flex column so the footer sits on the baseline regardless of summary length.

| Part | Content |
|---|---|
| `.cc-top` | Type chip (`.cc-kind`, `.bundle` variant) + access badge. The chip carries one word — `Module` or `Bundle` — so both kinds occupy the same width and the row never wraps beside the badge |
| `.cc-head` | Title + discipline as one **fixed-height block** (70px). This is what makes a row of cards line up when some titles run to two lines and others to one — the slack falls below the pair, never between them |
| `h3 > a` | Title — the primary link |
| `.cc-sum` | One-line learning summary |
| `.cc-meta` | Facts row — delivery format badges, preceded by `.cc-count` (*"3 modules"*) on a bundle |
| `.cc-foot` | Amount + `SAMPLE AMOUNT` caption, and one action. `min-height` keeps every footer on the same baseline |
| `.catcard.owned` | Held items: success-tinted surface, amount replaced by *"In your learning"* (`.cc-state.ok`) |

**The whole card is not a click target.** The title is a link and the action is a button — so there is no click-only region, and everything is reachable by keyboard in a sensible order. `:focus-within` gives the card the same emphasis as `:hover`, so keyboard users get the same affordance.

### 3.3 `.phero` / `.accesspanel` — product detail

Two columns at 1440/1280 — the learning story left, the access decision right — collapsing to one below 1040px, where the panel moves **above** the body (`order:-1`) so the decision is not buried.

| Part | Purpose |
|---|---|
| `.ph-kicker` | Type chip, access badge, format badge |
| `.ph-lede` | One paragraph, capped at 62 characters per line |
| `.ph-facts` / `.ph-fact` | Discipline and device requirement as compact facts |
| `.accesspanel` | Sticky. **The only place an amount and a primary access action appear on a detail screen** |
| `.accesspanel.have` | Held: success surface, **no amount, no Get access**, one action |
| `.ap-state` · `.ap-amt` · `.ap-note` · `.ap-act` · `.ap-sub` | State line · amount · what it adds · actions · reassurance |

### 3.4 `.incl` / `.incl-row` — "what is included"

**One component, four callers**: module components, bundle contents, access summary, outcome list. That is what keeps the promise identical from catalogue to confirmation.

| Part | Purpose |
|---|---|
| `.ir-node` | Delivery-type icon |
| `.ir-t` · `.ir-d` | Name · format badge and device line |
| `.ir-side` | *"Already yours"* where it applies |
| `.incl-row.have` | Success tint — **always alongside the badge**, never instead of it |
| `.incl-foot` | A qualifying note within the same border |

### 3.5 `.checkout` / `.sumcard` — access summary

| Part | Purpose |
|---|---|
| `.checkout` | Body + sticky summary; single column below 1040px |
| `.sumline` | Label / value row — item, type, experiments added, account |
| `.sumtotal` | The amount, separated by a rule |
| `.sc-foot` | Full-width primary action, then the way back |
| `.sc-legal` | *"…no payment is taken and no card, bank or personal detail is collected anywhere in it."* |

### 3.6 `.acctbox` — the account receiving access

Avatar, name, e-mail. The learner-facing half of **FRD 9.2.1**'s *"linked to the user account"*.

### 3.7 `.paystep` — the payment step

**A statement, not a choice.** One row: a lock icon, *"Online payment"*, and one line of explanation. There is no radio group, no `<fieldset>`, and no selectable option, because **no payment method is source-supported** — an audit of all three FRD editions and every project register returns zero occurrences of any payment method, mode, option or instrument.

This replaces an earlier `.methodlist` / `.methodrow` radio group that offered three sample instrument labels. Those were removed: even labelled as samples, a chooser implies the platform will offer methods and that these are the categories. FRD 9.1.1's acceptance criterion asks for exactly one thing — *"a provider-neutral payment step"* — and that is what this is.

### 3.8 `.outcome` — payment result

One panel, four variants: `.busy` `.ok` `.bad` `.wait`.

**Every variant carries an icon and a words-first heading.** Colour is never the only carrier: *"It's yours — access added"*, *"Payment not completed"*, *"Still confirming your payment"*, *"Confirming your payment"* each state the outcome in the heading itself.

`.procbar` gives the processing state a **determinate** bar with three named steps, so waiting never reads as a hang.

### 3.9 `.acctmenu` — account menu

The confirmed IA puts Purchases under Account. Batch 01 and Batch 03 render the account control as visual-only; here it opens, because **Access history** and **Sign out** are real destinations. `aria-haspopup`, `aria-expanded`, `aria-controls`, `role="menu"`/`menuitem`, Escape to close with focus returned to the trigger, and outside-click dismissal. Inert entries carry `aria-disabled`.

### 3.10 `.handoff` — sign in to continue

A panel, **not a form**. No input of any kind. One primary action, one secondary, and a note saying authentication is designed elsewhere.

### 3.11 `.converge` — the two-routes figure

**Prototype index only — a reviewer artefact, not product UI.** Two columns (institutional / individual) meeting a shared footer: *"Same platform from here on."* This is the figure that lets a PM see the Batch 03 ↔ Batch 04 relationship without narration.

### 3.11a `.accesspanel.partial` — partly-held bundle

An informational variant of the access panel: info tint, **no amount**, and no primary purchase action. It states the overlap and points at the confirmed alternative — the remaining modules, individually. Used only when `offeringAccess()` returns `some`, which can happen only for a bundle.

### 3.12 `tr.row-new` — just added

Success tint plus a left rule **and** a *"Just added"* badge in the row. The badge is the accessible signal; the tint is reinforcement.

### 3.13 `.pn-body` / `.pn-actions` — prototype control internals

Batch 01 and Batch 03 build the prototype-note body with an inline `style="flex:1"`. Batch 04 uses classes instead, because **an inline declaration outranks the stylesheet** and prevented the narrow-width rule from ever applying — the control's button row pushed past the viewport at 640px. Same visual result, and now actually adjustable.

---

## 4. Status vocabulary

| Meaning | Badge | Icon | Colour |
|---|---|---|---|
| Held in full | *You have access* | check | success |
| Held in part (bundle) | *N of M already yours* · *Partly in your learning* | info | info |
| Not held | *Available to get access* | — | outline / neutral |
| Item within a list, held | *Already yours* | check | success |
| Just arrived | *Just added* | check | success |

**Every state has a word.** Nothing is signalled by colour alone anywhere in the batch — checked explicitly in `qa/ACCESSIBILITY_AND_UX_QA.md` §4.

---

## 5. Two Batch-01 chrome adjustments

Both are narrow-width only, both live in the Batch-04 sheet, and both are commented where they sit. **The Batch-01 sheet is not edited.**

| Adjustment | Why |
|---|---|
| `.protobar` may wrap below 900px; its long right-hand caption is hidden | The Batch-01 strip is fixed-height and single-row, and overflowed by 51px at 768px once its label and the Reset control no longer fit. `SAMPLE DESIGN DATA` is already stated on every screen it labels |
| `.tablecard { overflow-x:auto }` below 740px | The Batch-01 card uses `overflow:hidden`, which **clipped** wide table columns rather than letting them scroll. No `min-width` is forced on the table — doing so pushed the document itself sideways once the viewport fell below that figure |

Also carried over from Batch 03, for the same reason it exists there: `[hidden]{display:none !important}`, because the Batch-01 sheet gives `.ferr` an author `display:flex` that outranks the UA rule behind the `hidden` attribute.

---

## 6. Responsive behaviour

**Phase-1 mobile requirements are not confirmed**, so these are resilience rules, not a mobile design.

| Breakpoint | Change |
|---|---|
| ≤ 1180px | Detail and checkout side columns narrow |
| ≤ 1040px | Two-column layouts become one; sticky panels unstick; **the access panel moves above the body** |
| ≤ 900px | Prototype strip may wrap |
| ≤ 860px | Denser card grid; filter controls stretch; hero and outcome type step down |
| ≤ 740px | Prototype control stacks; table cards scroll horizontally within themselves |
| ≤ 640px | One card per row; card actions go full width; summary lines stack |

Measured result: **no horizontal document overflow on any route from 1440px down to 560px.** Below roughly 520px the shared shell's fixed 232px sidebar leaves too little content width and small overflows appear. That sidebar is Batch-01 platform chrome; collapsing it is a platform-level decision, not a Batch-04 one. See `qa/ACCESSIBILITY_AND_UX_QA.md` §3.

---

## 7. What was deliberately not built

| Not built | Why |
|---|---|
| Cart / basket component and cart badge | `DA-01` — no cart |
| Payment-method chooser, instrument icons, card-network marks | **No payment method is source-supported.** FRD 9.1.1 asks only for a provider-neutral step |
| Coupon field, promo banner, discount ribbon, "you save" | No source establishes any of it |
| Price-range filter, sort-by-price control | Would imply a settled price model |
| Rating, review, enrolment count, popularity or "new" flag | Invented data |
| Wishlist, save-for-later, compare, gift | No source |
| Card-number, CVV, expiry, billing-address or address-book fields | The prototype collects nothing, ever |
| Countdown, urgency device, scarcity marker | Not an academic platform's register |
| Certificate or credential component | Certification is Phase 2 — PM-12 |
| Carousel, hero banner, promotional tile | A catalogue, not a storefront |
