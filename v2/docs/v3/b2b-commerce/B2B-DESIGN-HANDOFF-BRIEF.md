# XR Learning Platform: B2B Commerce Design Handoff Brief (for Claude Design)

> **Record note (preserved 4 Nov 2026).** This is the design handoff brief as delivered on 4 Nov 2026, kept verbatim except for this note; the closing chat lines are not reproduced. It was the input to both design canvases and is not a design authority.
>
> **Errata delivered with the brief**
>
> 1. Phone tables on public pages switch at **600 px**, not 760 px (the specification said 760).
> 2. V3 table breakpoints follow the real tokens: full table at 880 px and wider, two-line rows from 660 to 879 px, stacked below 660 px.
>
> **Superseded by provisional owner decisions (4 Nov 2026, `B2B-DECISION-REGISTER.md`)**
>
> - PD-B2B-4: no “Paid from” line on the receipt.
> - PD-B2B-5: all workflow dates and times follow the seeded walk.
> - PD-B2B-6: Institute Admin identifier behaviour as approved in IA-v1, pending reconciliation.
> - PD-B2B-1: the Operations description includes external payments.
>
> Official pricing, tax rules, renewal pricing and extra-licence pricing remain open.

**Status: design exploration only.** The owner approved Option A as the _design exploration approach_. This is **not** approval to implement any screen, to change product behaviour, or to modify any frozen design. Every price, tax treatment and commercial rule in this brief is a **placeholder** awaiting owner decisions.

**Product:** XR Learning Platform for BITS Pilani WILP. Institutions request access to XR/web lab experiments; the BITS Super Admin approves; external institutions pay; the institution's administrator then gives students access.

**Source of truth:** repository `gnankankanala19/XR-Learning-Platform`, branch `claude/laughing-noether-f2q7b2` @ `d0594ff`. Specification: `B2B-COMMERCE-SCREEN-SPEC.md`.

---

## 0. What we are asking Claude Design to do

Design the **missing external-institution commerce moments** inside the existing product, using only the existing visual systems:

1. An approved institutional **quotation** and commercial summary.
2. A **simulated payment** page with three outcomes: successful, failed, unconfirmed.
3. A **payment confirmation and simulated receipt**.
4. The **requester's payment history**.
5. The **Institute Admin's subscription and payment history**.
6. The **Super Admin's payment overview**.
7. The small **insertions** into existing approved screens that connect these moments.

Do **not** design a storefront, pricing page, plans catalogue, cart, checkout or "Buy" flow. Do not redesign the landing page or any approved screen.

---

## 1. Design authorities and what is frozen

| Authority                                                                                                                                          | Applies to                                                                                           | Rule                                                                                                                                         |
| -------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| **v46 canvas** (frozen handoff, 178 files)                                                                                                         | Every **public** page except `/`: catalogue, experiment, selection, request, request status, payment | The visual authority for public pages. Never edited, normalised or re-exported. A change needs a new canvas version and a new owner approval |
| **V3 Refined Direction B** (foundation XR-V3-RB-1.0, frozen) + owner-approved role exports **SA-v1** (Super Admin) and **IA-v1** (Institute Admin) | The **Super Admin** and **Institute Admin** workspaces                                               | New SA and IA views must look as if they came from these exports. The exports themselves are never edited                                    |
| **V1 Public Landing** (PU-01 with the PU-14 "How institutional access works" section), frozen                                                      | `/` only                                                                                             | **Out of scope. Do not touch or redesign**                                                                                                   |
| **XS-v6** (entry and shared screens)                                                                                                               | Sign-in, account menu, messages                                                                      | Reference only                                                                                                                               |
| **Official logo** `branding/bits-pilani-wilp-logo.png`                                                                                             | As already used                                                                                      | Keep existing logo usage and logo slots exactly as built                                                                                     |

**Never copy into product designs:**

- canvas board controls ("Restart", "Sample: …")
- captions and annotations as product UI
- fixed-height presentation frames
- the canvas runtime
- role-export sample records, preview state machines, dashed preview buttons, Tweaks and galleries
- the landing's design-host harness bar

Annotations are welcome in your deliverables, on a clearly separate annotation layer.

---

## 2. Visual system A: v46 (public pages)

### 2.1 Tokens (from the frozen v46 handoff `tokens.json`)

**Typeface**

- **Public Sans** (`'Public Sans', system-ui, -apple-system, 'Segoe UI', sans-serif`).
- Mono for identifiers: `ui-monospace, 'SFMono-Regular', Menlo, Consolas, monospace`.

**Colour**

| Token                                    | Hex                                                       | Typical use                                                                                |
| ---------------------------------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| navy-950 / 900 / 800 / 700               | #080C33 / #0C1247 / #141B5E / #1B2470                     | Public header and footer (#0C1247), headings (#141B5E)                                     |
| indigo-600 / 500 / 300 / 200 / 100       | #2A3390 / #3B49B8 / #8592E6 / #C9CEF2 / #E6E8FA           | Format chips (#E6E8FA bg, #C9CEF2 border), accents                                         |
| gold-400 / 450 / 500 / 600 / 700 / 50    | #F7C95B / #F4B93A / #E9A825 / #A8740A / #8A5A05 / #FBF3E0 | Primary button (#E9A825, border #A8740A), eyebrow text (#8A5A05), "Changed" chip (#FBF3E0) |
| cyan-400 / 700 / 50                      | #35C0DE / #0B6E85 / #E6F7FB                               | Accents                                                                                    |
| ink / ink-2 / ink-3                      | #12173F / #40476B / #5C6389                               | Body, secondary, meta/hint text                                                            |
| line / line-strong                       | #E1E4F3 / #7A82AE                                         | Borders, dashed "off" states                                                               |
| canvas / surface / surface-2 / surface-3 | #F4F5FB / #FFFFFF / #F4F5FB / #EEF0F8                     | Page background, cards, quiet fills                                                        |
| link / focus / focus on navy             | #1F4FD8 / #1F4FD8 / #F7C95B                               | Links; 2 px focus ring                                                                     |
| ok / ok-bg                               | #1D6B45 / #E8F4EC                                         | Success                                                                                    |
| warn / warn-bg                           | #8A5A05 / #FBF3E0                                         | Waiting / pending                                                                          |
| err / err-bg                             | #B42318 / #FDECEA                                         | Failure, errors                                                                            |
| info / info-bg                           | #1F4FD8 / #EAF0FD                                         | Information                                                                                |

**Other tokens**

- **Spacing:** 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80 px.
- **Radius:** 4 · 6 · 8 · 12 px (cards in the request flow use 12 px; the payment card 14 px).
- **Elevation:**
  - e1 `0 1px 2px rgba(12,18,71,.06)`
  - e2 `0 12px 32px rgba(12,18,71,.14)`
  - e3 `0 24px 60px rgba(12,18,71,.28)`
- **Motion:** 120 / 200 / 280 ms, `cubic-bezier(.2,0,0,1)`.

### 2.2 Type scale (public)

| Style                            | Spec                                                                                       |
| -------------------------------- | ------------------------------------------------------------------------------------------ |
| Page H1 (`xp-h1`)                | 48 px / 1.06, 700, −0.025em, navy #141B5E. **40 px** below 1024; **32 px / 1.1** below 600 |
| Eyebrow (`xp-eyebrow`)           | 13/16, 700, +0.12em, UPPERCASE, #8A5A05 (for example "PAYMENT · REQ-0042")                 |
| Lead (`xp-lead`)                 | 18/28, #40476B, max 720 px; 16/24 below 600                                                |
| Status title (`xp-status-title`) | 28/36, 700                                                                                 |
| Status text                      | 17/26, #40476B, max 680 px                                                                 |
| Section H2 (`xr-h2`)             | 22/30, 700                                                                                 |
| H3 (`xp-h3`)                     | 22/28, 700, navy                                                                           |
| Body                             | 16/24                                                                                      |
| Review and comparison text       | 15/22                                                                                      |
| Meta / hint                      | 14/20, #5C6389                                                                             |
| Identifier (`xr-id`)             | mono 14 px, #40476B (for example "REQ-0042")                                               |

### 2.3 Layout

**Page container (`xp-in`)**

- Max 1440 px.
- Side padding **64** px; **40** below 1280; **32** below 1024; **16** below 600.
- Form pages (`xp-in--form`): max **848** px. Reading pages (`xp-in--read`): max **1168** px.
- Page padding (`xp-page`): 40 px top, 80 px bottom.

**Public header and footer**

- Navy #0C1247, white text.
- Below 1024 the header collapses to a "Menu" sheet.
- Keep exactly as built.

**Breakpoints**

- The public pages use **container queries** on the `xp` container at **600 / 1024 / 1280** px (plus 760 for some tables).
- Approved review widths: **1440 · 1024 · 768 · 375**.

### 2.4 Components to reuse (public)

| Component                                            | Look                                                                                                                                                                                                         |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Primary button** (`xr-btn--primary`)               | Gold #E9A825, 1.5 px border #A8740A, ink text, min-height 44, radius 6, 600 15 px. The main call to action on request pages is taller (`xp-cta`, 52 px). **One primary per view**                            |
| **Secondary button**                                 | White, 1.5 px navy border #141B5E, navy text                                                                                                                                                                 |
| **Text button / link**                               | #1F4FD8; Back link with a left chevron ("Back to request status")                                                                                                                                            |
| **Status pill** (`xr-status`)                        | 28 px high, radius 999, 14/20 600. Tones: info #EAF0FD/#1F4FD8 · ok #E8F4EC/#1D6B45 · wait #FBF3E0/#8A5A05 · err #FDECEA/#B42318 · paused (white, navy inset outline) · off (dashed #7A82AE)                 |
| **Notice** (`xr-notice`)                             | Padding 14/16, radius 8, icon + text 15/22. Info bg #EAF0FD; **quiet** bg #F4F5FB with a 1 px #E1E4F3 border; error bg #FDECEA                                                                               |
| **Section card** (`xr-section`)                      | White, 1 px #E1E4F3, radius 12, header row with the H2                                                                                                                                                       |
| **Status head panel** (`xp-statushead`)              | White, radius 12, padding 28, 1 px border, **6 px left accent** (info blue; ok / wait / err variants). Holds the status pill, "Updated …", the title, the text and the one next action                       |
| **Review list** (`xp-review`)                        | Label / value / action grid: 200 px · 1fr · auto, gaps 10/24, 15/22. Stacks to one column below 600                                                                                                          |
| **Comparison table** (`xp-compare`)                  | Full-width table, 15/22. Changed cells carry a gold **"Changed"** chip (`xp-diff`: #FBF3E0, #8A5A05, 12 px 700, radius 999). **Below 600** it becomes labelled rows (each cell prefixed by its column label) |
| **Summary list / card** (`xp-sumlist`, `xp-sumcard`) | Label–value rows, 15/22. The card is white, padding 24, radius 12, e1 shadow, sticky on desktop (as "Your selection" uses it)                                                                                |
| **Payment card** (`xp-pay`)                          | White, 1 px #E1E4F3, **radius 14, padding 32**, e1 shadow, 20 px gap. Below 600: padding 20 and full-width buttons                                                                                           |
| **Form footer** (`xp-formfoot`)                      | Secondary link left, primary right; wraps (primary on top) on phones                                                                                                                                         |
| **Success message** (`xr-msg`)                       | 48 px circular mark (success tone with a check icon), title 28/36 700, body, actions row (as on **Request sent**, PU-09)                                                                                     |
| **Format badge** (`xr-fmt`)                          | 28 px high, radius 4, bg #E6E8FA, border #C9CEF2, navy 700 13 px code: **WEB · AR · VR · MR** (display order)                                                                                                |
| **Timeline**                                         | History list (what, when, note) as on Request status                                                                                                                                                         |
| **Failed block / Loading**                           | The existing "We couldn't load this — Try again" block and a screen-reader loading line. No skeleton art on these pages                                                                                      |

### 2.5 The prototype support frame (for `/prototype/*` pages only)

These pages are **not product screens** and have no public header. Use the existing prototype frame, which looks like the sign-in page:

- A calm brand background (soft gold and cyan radial washes).
- **One centred white card:** max 460 px (760 for wide content), padding 36/36/32, **radius 16, e3 shadow**.
- A brand row (logo slot + "XR Learning Platform") over a 1 px divider.
- A title 30/36 700.

Existing examples: `/prototype/reset` ("Reset demo data") and `/prototype/web-activity` (the sample WEB activity).

---

## 3. Visual system B: V3 Refined Direction B (Super Admin and Institute Admin)

### 3.1 Tokens (from `design/v3-refined-b/pack/references/v3/design-tokens.json`)

| Token                         | Hex                              | Use                                                                 |
| ----------------------------- | -------------------------------- | ------------------------------------------------------------------- |
| navy / navy-2                 | #141B5E / #1B2470                | Rail (248 px), page and section headings, format-in-plan            |
| indigo / indigo-2             | #3B49B8 / #2A3390                | Links, tab underline, selection                                     |
| selection tint                | #EEF0FB                          | Chosen option, chips, focused row                                   |
| **gold** / gold-hi / gold-ink | #E9A825 / #F2B636 / #7A5004      | **The one primary action per view**, nav count, current-page marker |
| ivory / ivory line            | #FBF5E6 / #ECDDB5                | Urgent notes (renewal due, priority band)                           |
| plan tint / plan line         | #ECEFFB / #D7DCF2                | Access plan band, IA identity band                                  |
| canvas / paper                | #F3F4F9 / #FFFFFF                | Page background / surfaces                                          |
| line / line-2                 | #E3E6F0 / #D5DAEA                | Borders / stronger dividers                                         |
| ink / ink-2 / ink-3           | #131938 / #363D62 / #555C7E      | Body / secondary / labels                                           |
| ok                            | #1D6B45 on #E6F3EB               | Access active, Active, **Paid / Confirmed**                         |
| warn                          | #8A5A05 on #FBF1DC               | Approved — payment required, Payment not confirmed, Ending soon     |
| err                           | #B42318 on #FCEBE9               | Information requested, validation errors, **Payment failed**        |
| info                          | #1F4FD8 on #EAF0FD               | Under review                                                        |
| paused                        | #141B5E on #F1F2FA, line #CDD2EC | Paused pill (outlined), banners                                     |
| focus                         | #1F4FD8                          | 2 px outline, 2 px offset                                           |

**Typography:** Public Sans.

| Style                 | Spec                             |
| --------------------- | -------------------------------- |
| Page title            | 40/46 700 −0.025em (phone 32/38) |
| Record title          | 38/44 (phone 30/36)              |
| Section / group title | 20/28 700                        |
| Card title            | 18.5/26 700                      |
| Body                  | 16/24                            |
| Table cell            | 15.5/23                          |
| Label                 | 14.5/20 600                      |
| Status pill           | 14/20 600                        |

**Shape**

- Radius: surface 18 · plan band 20 · card 16 · cell 12 · control 10 · chip/pill 999.
- Surface shadow: `0 1px 2px rgba(19,25,56,.05), 0 6px 24px -12px rgba(19,25,56,.10)`.
- Dialog shadow: `0 30px 90px rgba(12,18,71,.38)`.
- Dialog max width 580. Decision panel 340–384 px.

**Sizes:** control height 44 · button 40 (large 46) · rail 248.

### 3.2 Layout and breakpoints (V3)

**Shell**

- Navy rail 248 px on the left (role label in gold capitals, destinations, counts).
- Top line 72 px (64 on phones) with the date and account menu.
- Page padding **40** px; **32** below 1280; **16** below 760. Section gap 28 px (22 on phones).
- **Below 1024:** the rail is hidden and replaced by a **Menu** button and drawer.
- **Below 760:** phone chrome (smaller top line, page title 32/38, date line moves into the page head).

**Tables (request-table rule)**

- Table width ≥ 880: full table.
- 660–879: two-line rows.
- Below 660: stacked cards.
- Below 520: status on top.

**Toolbars**

- Below 900: search on its own line.
- Below 836: a sort control replaces column sorting.
- Below 600: type-size filters move into "More filters".

**Detail pages with a decision panel:** one column below 860 px (panel after the details, with a "Go to decision" link).

**Plan band:** below 760, the identity sits above the term.

### 3.3 Components to reuse (V3)

| Component                                                            | Look                                                                                                                                                                                 |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Page head**                                                        | H1 40/46 navy, lead line, optional eyebrow date, actions at the right; breadcrumbs above record pages                                                                                |
| **Surface** (`rk-surface`)                                           | White, 1 px #E3E6F0, **radius 18**, surface shadow. Sections inside: padding 24/28 with a 1 px top divider; section head row with the title (20/28) and a count or link at the right |
| **Fact strip**                                                       | A top strip of a record (grid of 150 px+ cells), bg #F7F8FC, rounded top corners                                                                                                     |
| **Definition list** (`rk-dl`)                                        | 168 px label · 1fr value; gap 10/20                                                                                                                                                  |
| **Link tabs** (`rk-tabs`)                                            | 48 px tabs, 600 16 px, ink-2. The current tab is navy with an indigo underline; a 1 px #D5DAEA baseline; horizontally scrollable on phones                                           |
| **Segmented views**                                                  | The SA list views (for example Support: Open · Resolved · All)                                                                                                                       |
| **List surface + filter toolbar + record table**                     | Search field, filters, "More filters", status line with counts, then the table; rows link to records                                                                                 |
| **Buttons**                                                          | 40 px, radius 10, 1.5 px border #C3C9E4, navy 600 15 px. **Primary** gold #E9A825 (border #C98F14, ink text); **navy** filled; **ghost** indigo text. Text links indigo 600 15 px    |
| **Status pill** (`xr-st`)                                            | 28 px, radius 999, 600 14/20, tones as in §3.1                                                                                                                                       |
| **Notices / plan notes / banners**                                   | Plan notes on the plan tint; ivory for urgent; paused outline style                                                                                                                  |
| **Decision panel + confirm dialog** (SA-03)                          | Right-hand panel with radio choices; the confirm dialog lists "What happens now" and "Only after later events, or not from here"                                                     |
| **"Where it stands" list**                                           | Term/value pairs for Institution record · Request · Payment · Institutional access                                                                                                   |
| **IA plan strip, term bar, plan facts**                              | Plan-tinted band (radius 20): status, term with a progress bar and days left, "Licences — as approved by BITS", footnote                                                             |
| **IA list table, section head and count, empty title, status notes** | IA list patterns (Student access, People)                                                                                                                                            |
| **Read-only table, record list, quiet line**                         | SA record pages (Institution detail)                                                                                                                                                 |

---

## 4. Content and wording rules (apply to every frame)

- **Dates:** "8 Oct 2026" or "8 Oct 2026, 15:05". Never numeric or US formats.
- **Spelling:** UK, "licence/licences". Write **"E-mail"**, never "email".
- **Banned in product copy:**
  - "demo"
  - "declined", "decline", "reject…" — **a failed payment is "Payment failed"**
  - "tenant", "provisioned"
  - "campus" as an entity word (institution names such as "BITS Pilani — Hyderabad Campus" are fine)
  - "Mark paid", "Buy", "Cart", "Checkout"
  - "Sample accounts", "Switch role", "Viewing as"
- **Identifiers**
  - **Public pages** may show the request reference "REQ-0042" (the requester quotes it).
  - **Super Admin and Institute Admin pages show no internal reference** (no REQ-, ACC-, payment or receipt numbers). Name things by institution, request kind ("New access", "Renewal", "More licences"), experiments and date.
- **Separate events stay separate:** "Approved" never reads as active; "Payment started" never reads as paid; payment activates the institution's plan, but **students get access only when the institution's administrator gives it**.
- **Money (placeholder only):** render amounts as **"₹ X,XX,XXX"** (totals) and **"₹ X,XXX"** (per licence). Use no realistic figures. Put a canvas annotation "PLACEHOLDER — no approved price" beside the first money value of each frame (annotation layer, not product UI).
- **Proposed product disclaimer** wherever an amount appears (pending decision CD-05): **"Sample prices for this prototype — not BITS prices. No tax is calculated."**
- **No tax rows.** Do not draw GST, tax or invoice-number lines (CD-03). You may annotate where a tax line would go if a later decision requires one.

---

## 5. The 11 proposed additions

Proposed IDs continue each role's numbering past existing and excluded IDs: PU-16, IA-21, IA-22 and SA-23…25 are registered as excluded. **New IDs require owner approval (§11).**

| #   | Addition                      | Proposed ID                   | Kind                                    | Route                                        | Placement                                                                                                                       | System                | Must visually match                                                     |
| --- | ----------------------------- | ----------------------------- | --------------------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | --------------------- | ----------------------------------------------------------------------- |
| A1  | Commercial summary            | — (region of PU-10)           | Insertion                               | `/requests/[requestId]`                      | Between the status head and "What you asked for and what was approved"                                                          | v46                   | PU-10 sections; PU-07 summary card                                      |
| A2  | **Quotation**                 | **PU-17**                     | New screen                              | `/requests/[requestId]/quotation`            | From A1 "View quotation" and PU-12 "See the full quotation"                                                                     | v46                   | PU-10 compare table, PU-08 "Check your request" review list, PU-12 card |
| A3  | Amount row on Payment         | — (region of PU-12)           | Insertion                               | `/requests/[requestId]/payment`              | Inside the payment card, after "What will be activated"                                                                         | v46                   | PU-12 (B1-08 frame 5)                                                   |
| A4  | **Simulated payment**         | none (prototype support page) | Support page                            | `/prototype/payment?request=[requestId]`     | Opened in the same tab by PU-12 "Continue to payment"                                                                           | Prototype frame (v46) | `/prototype/web-activity`, `/prototype/reset`, sign-in frame            |
| A5  | Outcome states                | — (existing PU-10 states)     | Existing states + words                 | `/requests/[requestId]`                      | After A4                                                                                                                        | v46                   | PU-10 states (B1-08)                                                    |
| A6  | **Simulated receipt**         | **PU-18**                     | New screen                              | `/requests/[requestId]/receipt`              | From A1, A7, PU-17, IA-23, IA-17                                                                                                | v46                   | PU-09 success mark + PU-17 layout                                       |
| A7  | Payments (requester history)  | — (region of PU-10)           | Insertion                               | `/requests/[requestId]`                      | Between "What you asked for…" and "History"                                                                                     | v46                   | PU-10 compare table + status pills                                      |
| A8  | **Subscription and payments** | **IA-23**                     | New screen (**new 3rd tab of IA-02**)   | `/institute/content-access?tab=subscription` | IA "Content access" → tabs: Experiments · Course codes · **Subscription and payments**                                          | V3 / IA-v1            | IA-02 Content access, IA-03 Access plan, IA-04/IA-06 list tables        |
| A9  | IA insertions                 | —                             | Insertions                              | IA-17 detail; IA-03                          | IA-17 "Where it stands" payment fact gains the amount and a receipt link; IA-03 strip foot gains a "Payments and receipts" link | V3 / IA-v1            | IA-17 detail, IA-03                                                     |
| A10 | **Payments** (SA overview)    | **SA-26**                     | New screen (**new 4th Operations tab**) | `/admin/operations/payments`                 | SA "Operations" → tabs: Device transfers · Support · Access ending · **Payments**                                               | V3 / SA-v1            | SA-20 Support list, SA-22 Access ending                                 |
| A11 | SA insertions                 | —                             | Insertions                              | SA-03 decision; SA-07 institution            | SA-03 confirm dialog quote line, "Where it stands" amount, read-only quotation view; SA-07 "Payments" section                   | V3 / SA-v1            | SA-03, SA-07                                                            |

**No sidebar destination is added for any role.** Sidebars are tested against frozen board 06.

---

## 6. The external-institution journey

### 6.1 External institution (new) — the main journey

| #   | Step                                                                                                        | Actor                                                    | Screen                             | New design?                                                                |
| --- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- | ---------------------------------- | -------------------------------------------------------------------------- |
| 1   | Browse areas, courses, experiments; choose formats                                                          | Visitor                                                  | PU-01 landing, PU-02…PU-06         | **No.** No prices anywhere                                                 |
| 2   | Build the request basket                                                                                    | Visitor                                                  | PU-07 Your selection               | **No.** Basket, never a cart                                               |
| 3   | Request details → check → submit                                                                            | Visitor                                                  | PU-08 → PU-09 (reference REQ-0042) | No                                                                         |
| 4   | Track status                                                                                                | Visitor                                                  | PU-10 (Submitted / Under review)   | No                                                                         |
| 5   | Decide: Approve / Approve a smaller scope / Request more information; choose Internal or External           | Super Admin                                              | SA-02 → SA-03                      | **A11:** the external confirm dialog shows the quoted amount (placeholder) |
| 6   | Quotation frozen at approval; institution record created; no access yet                                     | System                                                   | —                                  | —                                                                          |
| 7   | See "Approved — payment required" + commercial summary                                                      | Requester                                                | PU-10                              | **A1**                                                                     |
| 8   | Read the full quotation                                                                                     | Requester                                                | PU-17                              | **A2**                                                                     |
| 9   | Review what will be activated + amount → "Continue to payment"                                              | Requester (or the institution's IA, if one exists later) | PU-12                              | **A3**                                                                     |
| 10  | Choose an outcome on the simulated provider page                                                            | Payer                                                    | `/prototype/payment`               | **A4**                                                                     |
| 11a | Outcome **Complete the payment** → plan created → "Access active"                                           | System                                                   | PU-10                              | **A5** (+ A1 "What your institution paid", A7 row)                         |
| 11b | Outcome **Make the payment fail** → "Payment failed" → "Try payment again" (back to step 9, same quotation) | —                                                        | PU-10                              | **A5**                                                                     |
| 11c | Outcome **Leave it unconfirmed** → "Payment not confirmed" → "Check again" (a re-read, never "pay again")   | —                                                        | PU-10                              | **A5**                                                                     |
| 12  | Receipt                                                                                                     | Requester / IA                                           | PU-18                              | **A6**                                                                     |
| 13  | Assign the Institute Admin (only once access is active)                                                     | Super Admin                                              | SA-07                              | No                                                                         |
| 14  | Subscription and payment history                                                                            | Institute Admin                                          | IA-23                              | **A8**                                                                     |
| 15  | Add people, give students access, students learn                                                            | IA → Student                                             | IA-05…, ST-*                       | No                                                                         |
| 16  | All payments across institutions, read-only                                                                 | Super Admin                                              | SA-26                              | **A10**                                                                    |

### 6.2 Internal BITS institution (never enters the payment journey)

SA-03 approval with "Internal" activates access at once:

- **No quotation, no payment page, no simulated payment, no receipt, no payment rows.**
- In IA-23, an internal institution sees a tab labelled **"Subscription"** with plan facts only, plus one quiet line: "Your institution's access doesn't need a payment."
- Internal institutions **never appear** in SA-26.

### 6.3 Renewal and more licences (existing institutions): NOT complete

- Pricing and plan effects for renewals and additional licences are **undecided** (OD-B3-09, CD-13).
- In the current product, approving or paying for these **does not change the plan**.
- **Design only the interim variant:** today's amount-free PU-12, and PU-10 / IA-17 without an amount.
- Provide **one placeholder frame** labelled "Renewal / more-licences pricing — decision pending". Do not design final renewal pricing.

### 6.4 Request status vocabulary (reuse exactly)

| Fact                          | Public (PU-10)                                                                  | Super Admin "Where it stands" | Institute Admin (proposed) | Pill tone |
| ----------------------------- | ------------------------------------------------------------------------------- | ----------------------------- | -------------------------- | --------- |
| Approved, payment not started | "Approved — payment required"                                                   | Payment: "Not started"        | "Payment needed"           | warn      |
| Payment pending               | "Payment not confirmed" (history "Payment started · Waiting for confirmation.") | "Waiting, not confirmed"      | "Waiting for confirmation" | warn      |
| Payment failed                | "Payment failed" ("The payment didn't go through. Nothing has been activated.") | "Payment failed"              | "Payment failed"           | err       |
| Payment confirmed             | "Access active" (history "Payment confirmed")                                   | "Confirmed 8 Oct 2026, 15:05" | "Paid"                     | ok        |
| Internal                      | no payment words                                                                | "Not needed (internal)"       | no payment words           | —         |

---

## 7. Detailed visual requirements

### A1: Commercial summary on PU-10 (insertion)

**Placement and look**

- A white section card (radius 12, 1 px #E1E4F3) **between** the status head panel and "What you asked for and what was approved".
- Shown **only** for external, approved requests with a quotation.

**Content**

- **H2 "What BITS approved costs".** After activation it becomes **"What your institution paid"**.
- Summary rows:
  - **Total** "₹ X,XX,XXX" (value 700 weight)
  - **Based on** "2 experiments · WEB, VR · 120 licences · Yearly"
  - **Prepared** "8 Oct 2026"
- Quiet notice with the sample-price disclaimer.
- Secondary button **"View quotation"**. After activation, also **"View receipt"**.
- The existing next action (Continue to payment / Try payment again / Check again) **stays in the status head**. Do not duplicate it as a primary here.

**Match:** PU-10 section cards; PU-07 summary-card typography.

### A2: PU-17 Quotation (new screen, v46)

```
[ public header — unchanged ]
xp-in--read (max 1168)
  ← Back to request status
  QUOTATION · REQ-0042                                   (eyebrow, gold-brown)
  Quotation for Godavari Institute of Technology         (H1 48 / 40 / 32)
  Prepared by BITS when your request was approved on 8 Oct 2026.
  Access starts only after the payment is confirmed.     (lead)

  ┌ Who and what ──────────────────────────────── (section card)┐
  │ Institution              Godavari Institute of Technology  │
  │ Contact person           Meera Iyer                        │
  │ Request                  REQ-0042 (mono)                   │
  │ Experiments and formats  Shell-and-Tube Heat Exchanger — WEB, VR;
  │                          Distillation Column — WEB  [Changed] │
  │ Licences                 120                               │
  │ Access term              Yearly                            │
  └─────────────────────────────────────────────────────────────┘
  ┌ Quotation ───────────────────────────────────────────────────┐
  │ Experiment | Format | Licences | Term | Price per licence | Amount │
  │ Shell-and-Tube Heat Exchanger | [WEB] | 120 | Yearly | ₹ X,XXX | ₹ X,XX,XXX │
  │ Shell-and-Tube Heat Exchanger | [VR]  | 120 | Yearly | ₹ X,XXX | ₹ X,XX,XXX │
  │ Distillation Column           | [WEB] | 120 | Yearly | ₹ X,XXX | ₹ X,XX,XXX │
  │                                           Total   ₹ X,XX,XXX │
  │ (quiet) Sample prices for this prototype — not BITS prices.  │
  │         No tax is calculated.                                │
  └──────────────────────────────────────────────────────────────┘
  Print     Back to request status          [ Continue to payment → ] (gold, 52 px)
```

**Rules**

- One line per experiment × format (CD-01 placeholder basis).
- The "Changed" chip appears on rows the Super Admin narrowed (smaller scope).
- The primary action depends on the request's state:

  | State   | Primary action                                                                     |
  | ------- | ---------------------------------------------------------------------------------- |
  | Payable | "Continue to payment"                                                              |
  | Pending | No primary; quiet line "Your payment is waiting for confirmation" + link to status |
  | Active  | "View receipt" (secondary)                                                         |

- **Print view:** hide the header, footer and actions; keep the black-on-white table.

**States:** loading, failed (Try again), not found (public not-found page), no quotation (goes to status), smaller scope (Changed chips), after activation.

### A3: PU-12 Payment (insertion)

- Inside the existing payment card (radius 14, padding 32), after the five rows of "What will be activated" (Institution · Experiments and formats · Licences · Access term · Request), add:
  - one row **"Amount to pay"** "₹ X,XX,XXX" (value emphasised)
  - a link **"See the full quotation"**
- Replace the card's quiet note with the simulation line **only in the prototype profile**: "Simulated payment — no money moves and no payment details are asked for."
- Keep the H1 "Pay for access", the lead "Access for {institution} starts after the payment is confirmed.", and the buttons "Back to request status" and **"Continue to payment"**.

**Interim variant (renewal / more licences):** no amount row, today's words.

### A4: Simulated payment (prototype support page, not a product screen)

```
[ calm brand background — prototype / sign-in frame ]
        ┌───────────────────────────────── card (max 460–560, radius 16, e3) ┐
        │ [logo slot]  XR Learning Platform                                  │
        │ ────────────────────────────────────────────────────────────────── │
        │ Simulated payment                                   (30/36, 700)  │
        │ ┌ info notice ──────────────────────────────────────────────────┐ │
        │ │ Simulated payment — no money moves and no payment details are │ │
        │ │ asked for. This page stands in for a payment provider.        │ │
        │ └───────────────────────────────────────────────────────────────┘ │
        │ Paying for   Godavari Institute of Technology                     │
        │ Request      REQ-0042                                             │
        │ Amount       ₹ X,XX,XXX                                           │
        │ Started      8 Oct 2026, 15:02                                    │
        │ [        Complete the payment        ]   (primary gold, full width)│
        │ [        Make the payment fail       ]   (secondary, full width)  │
        │              Leave it unconfirmed        (text button)            │
        │ Nothing here is collected or stored except the outcome you choose.│
        └───────────────────────────────────────────────────────────────────┘
```

**Must not contain:**

- card, UPI, bank, account or OTP fields
- provider logos or names
- any real payment provider UI or financial credential collection
- the words "declined" or "demo"

**After each choice:** busy state ("Recording the outcome…", all three buttons disabled), then a return in the same tab to the request status page.

**States:**

- Connecting / loading
- Ready
- Busy
- Nothing to pay (no pending payment: return to status)
- Refused or out of date (re-read, return to status)
- Not found (no access)
- Paused institution (CD-14 proposal: "Complete the payment" disabled with the paused notice)

**Route and access restrictions:** see §10.3.

### A5: Outcome states on PU-10 (existing states; design verification frames)

| Outcome     | Status head (existing words)                                                                 | Next action                                                                                                   | Also                                                                               |
| ----------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Completed   | "Access active", "Access plan …"                                                             | "Sign in" (existing) + proposed line "Your institution administrator signs in once BITS assigns them" (CD-15) | A1 shows "What your institution paid" + "View receipt"; A7 row "Payment confirmed" |
| Failed      | "Payment failed" — "The payment didn't go through. Nothing has been activated." (err accent) | "Try payment again"                                                                                           | A7 row "Payment failed"                                                            |
| Unconfirmed | "Payment not confirmed" — "Access starts once the payment is confirmed." (wait accent)       | "Check again" (re-read only)                                                                                  | A7 row "Waiting for confirmation"                                                  |

### A6: PU-18 Simulated receipt (new screen, v46)

```
xp-in--read
  ← Back to request status
  (✓ 48 px success mark)
  Payment receipt                                         (H1)
  Simulated receipt for a prototype. It is not a tax invoice.   (lead)
  ┌ Payment ─────────────────────────────────────────────┐
  │ Status            [ Payment confirmed ] (ok pill)    │
  │ Confirmed on      8 Oct 2026, 15:05                  │
  │ Amount            ₹ X,XX,XXX                         │
  │ Paid for request  REQ-0042                           │
  │ Paid from         This browser   (or: Your institution administrator) │
  └──────────────────────────────────────────────────────┘
  ┌ What was paid for ── same lines table as PU-17 + Total ┐
  ┌ What happened next ──────────────────────────────────┐
  │ Institutional access became active on 8 Oct 2026.     │
  │ Students get access when your institution             │
  │ administrator gives it.                               │
  └──────────────────────────────────────────────────────┘
  (quiet) Sample prices for this prototype — not BITS prices. No tax is calculated.
  Print      Back to request status
```

- **No** receipt number, GSTIN, tax lines, payer bank details or signature (CD-10).
- One receipt per request (only one payment can be confirmed).

**States:** loading, failed, not found, not yet confirmed (goes to status), print view.

### A7: Payments section on PU-10 (requester history)

- A section card **between** "What you asked for and what was approved" and "History".
- Shown only when at least one payment was started.
- **Table** (newest first):
  - Started (date, time)
  - Amount ₹ X,XX,XXX
  - Outcome pill: Payment confirmed (ok) / Waiting for confirmation (wait) / Payment failed (err)
  - Outcome time
  - "View receipt" on the confirmed row only
- Below 600: labelled rows.
- **Show a frame with three rows:** failed → failed → confirmed.

### A8: IA-23 Subscription and payments (new screen; new IA-02 tab)

```
[ V3 shell: navy rail 248 — "INSTITUTE ADMIN"; Content access current ]
Page head (existing IA-02, unchanged): Content access · lead
Tabs: Experiments | Course codes | Subscription and payments  ← NEW third tab (needs approval)

┌ Your subscription ─────────────────────────────── (surface r18)┐
│ ┌ plan band (plan tint #ECEFFB, r20) ─────────────────────────┐ │
│ │ [Access active]  Your access plan                           │ │
│ │ Yearly · 8 Oct 2026 to 7 Oct 2027   ███████░░░  240 days left│ │
│ │ 120 licences — as approved by BITS                          │ │
│ │ Renewal: not requested     View plan · Ask for a renewal    │ │
│ └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
┌ Payments                                        3 payments ┐
│ Date        | For                                  | Amount     | Status       |          │
│ 8 Oct 2026  | New access · Shell-and-Tube Heat     | ₹ X,XX,XXX | [Paid]       | View receipt │
│             |   Exchanger, Distillation Column     |            |              |          │
│ 8 Oct 2026  | New access · …                       | ₹ X,XX,XXX | [Payment failed] |      │
│ (foot, quiet) Sample prices for this prototype — not BITS prices. No tax is calculated. │
└───────────────────────────────────────────────────────────────┘
```

**Actions**

- "Open the payment page" (to PU-12) on rows that need payment or failed. These are IA-17's existing words.
- "View receipt" (to PU-18) on paid rows.

**No internal references.** Name rows by kind and experiments only.

**Variants**

- **External** (above).
- **Internal:** tab labelled "Subscription", only the plan band(s), plus the quiet line "Your institution's access doesn't need a payment."
- **Several plans:** one band each.
- **Plan ending soon:** ivory urgent note "15 days left" and "Ask for a renewal".
- **Ended:** ended pill; history kept.
- **Paused:** paused outline pill and banner; actions hidden.
- **Renewal requested and approved:** "Renewal approved — payment needed" shown **without an amount**, plus the decision-pending annotation.

**States:** loading rows; failed ("Try again"); no payments yet (calm empty title "No payments yet."); paused (read-only).

### A9: IA insertions

- **IA-17 request detail, "Where it stands":** the payment fact reads "Payment needed · ₹ X,XX,XXX". When paid: "Paid 8 Oct 2026" + a "View receipt" link. The existing navy "Open the payment page" button is kept.
- **IA-03 access plan:** one text link "Payments and receipts" in the plan band's foot (external only).

### A10: SA-26 Payments (new screen; new Operations tab; read-only)

```
[ V3 shell: rail "SUPER ADMIN"; Operations current ]
Operations (H1 40/46)  · lead (existing, unchanged)
Tabs: Device transfers | Support | Access ending | Payments   ← NEW fourth tab (needs approval)
Views: [Needs payment] [Waiting or failed] [Confirmed] [All]   (segmented, as Support)
[ Search institutions …………… ]
2 need payment · 1 waiting or failed · 4 confirmed in the last 30 days   (status line)
┌ list surface ───────────────────────────────────────────────────────────┐
│ Institution | For | Amount | Status | Approved | Last activity |         │
│ Vizag Polytechnic | New access · Buck Converter Ripple +1 | ₹ X,XX,XXX | [Not started] | 22 Sep 2026 | — | Open request │
│ Godavari Institute of Technology (New institution) | New access · Shell-and-Tube… +1 | ₹ X,XX,XXX | [Waiting, not confirmed] | 8 Oct 2026 | 8 Oct 2026 | Open request │
│ Konark Polytechnic | New access · Buck Converter Ripple | ₹ X,XX,XXX | [Confirmed 3 Aug 2026] | … │
└──────────────────────────────────────────────────────────────────────────┘
(quiet line) Payments are confirmed by the payment provider, not from this page.
```

- **Links:** the institution name goes to SA-07; "Open request" goes to SA-03.
- **Explicitly absent** (excluded screen SA-05 and design guards): Record payment, Mark paid, Activate, Refund, Decline, Close, Export.
- **No money totals across institutions** (CD-12).
- Internal institutions never appear.

**States:** loading rows; failed (SA message + "Try again"); empty per view ("Nothing needs payment"); no match for search; all four views.

### A11: SA insertions

- **SA-03 confirm dialog** (external approve and smaller scope only):
  - Under "What happens now", one line: "The requester is asked to pay ₹ X,XX,XXX (sample prices)."
  - For a smaller scope, the amount reflects the narrowed scope.
  - Internal dialogs are **unchanged**.
- **SA-03 "Where it stands":** the Payment fact gains the amount ("Waiting, not confirmed · ₹ X,XX,XXX").
- **SA-03 decided external panel:** "View quotation" opens a read-only quotation (V3 dialog, max 580). The lines table uses V3 table styling and **no reference ids**.
- **SA-07 institution detail:** a "Payments" section (read-only table: date, for, amount, status) after the plans section. External only. The awaiting-payment state (no plan, no Institute Admin) is unchanged.

---

## 8. Required states (design every cell that applies)

| Addition    | Default                     | Loading      | Empty                        | Success                                     | Failed (read)     | Pending                      | Other / errors                                                                            |
| ----------- | --------------------------- | ------------ | ---------------------------- | ------------------------------------------- | ----------------- | ---------------------------- | ----------------------------------------------------------------------------------------- |
| A1 summary  | Approved — payment required | page loading | hidden (internal, undecided) | "What your institution paid" + receipt link | page failed block | Payment not confirmed        | Payment failed; smaller scope                                                             |
| A2 PU-17    | Payable                     | ✓            | no quotation → status        | after activation                            | ✓ Try again       | waiting line, no primary     | not found; Changed rows; print                                                            |
| A3 PU-12    | Amount row                  | ✓            | renewal interim (no amount)  | → A4                                        | ✓                 | busy "Starting the payment…" | stale / refused → status; not payable → status                                            |
| A4 provider | Ready                       | connecting   | nothing to pay               | completed → status                          | refused           | left unconfirmed → status    | busy; paused (CD-14); not found                                                           |
| A5 PU-10    | —                           | —            | —                            | Access active                               | —                 | Payment not confirmed        | Payment failed + Try payment again                                                        |
| A6 PU-18    | Confirmed                   | ✓            | not yet confirmed → status   | ✓                                           | ✓                 | —                            | not found; print                                                                          |
| A7 history  | rows                        | with page    | hidden                       | confirmed row                               | with page         | waiting row                  | failed rows; several attempts                                                             |
| A8 IA-23    | External                    | rows         | No payments yet              | Paid rows                                   | ✓ Try again       | Waiting row                  | Payment needed; failed; internal; ending soon; ended; paused; renewal pending (no amount) |
| A9 IA       | amount in stands            | —            | —                            | Paid + receipt                              | —                 | Waiting                      | failed                                                                                    |
| A10 SA-26   | Needs payment view          | rows         | per view                     | Confirmed view                              | ✓                 | Waiting or failed view       | no match; 375 cards                                                                       |
| A11 SA      | dialog line                 | —            | internal (no line)           | confirmed stands                            | —                 | waiting stands               | smaller scope amount                                                                      |

---

## 9. Responsive layouts (1440 · 1024 · 768 · 375)

| Addition                    | 1440                                                      | 1024                               | 768                                                                  | 375                                                                                                                          |
| --------------------------- | --------------------------------------------------------- | ---------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Public pages (A1–A3, A5–A7) | Reading column 1168 (form 848), padding 64 → 40 at < 1280 | Padding 40 (≥ 1024 desktop header) | Padding 32, H1 40, header Menu sheet                                 | Padding 16, H1 32, review lists stack, comparison/lines tables become **labelled rows**, buttons full width (primary on top) |
| A2 / A6 tables              | 6 columns                                                 | 6 columns (tighter)                | 6 columns, wrapping experiment names                                 | Labelled rows per line; total row stays at the end                                                                           |
| A4 provider card            | Centred card 460–560                                      | same                               | same                                                                 | Card fills width minus 16 px margins; buttons stacked full width                                                             |
| V3 pages (A8–A11)           | Rail 248 + content, padding 40                            | Rail visible (≥ 1024), padding 32  | Rail → Menu + drawer, padding 32; tables 660–879 → **two-line rows** | Phone chrome, padding 16, H1 32/38; tables stacked (status on top < 520); tabs scroll horizontally; segmented views wrap     |
| A10 toolbar                 | Search + views on one line                                | same                               | Search on its own line (< 900)                                       | Views wrap; filters in "More filters" (< 600)                                                                                |
| A11 SA-03                   | Detail + decision panel (340–384)                         | same                               | One column (< 860), panel after the details, "Go to decision"        | same; dialog full width minus margins                                                                                        |
| Print (A2, A6)              | A4 portrait, header/footer/actions hidden                 | —                                  | —                                                                    | —                                                                                                                            |

No horizontal page scrolling at any width. Targets: at least 44 px on public pages; 40 px buttons and 44 px controls in V3.

---

## 10. Restrictions protecting frozen designs and existing functionality

### 10.1 Never change

- Any file under the v46 handoff, V3 Refined B (including the SA-v1 / IA-v1 / XS-v6 role exports) or the V1 landing.
- The **landing page** `/` and every public page **before approval**:
  - PU-01…PU-09: landing, areas, catalogue, course, experiment, selection, request, request sent
  - **no amounts, no "Buy", no cart, no checkout**
- The selection basket model.
- **Sidebar destinations** of all seven roles: Student, Faculty, Institute Admin, Vendor, Academic Reviewer, Content Manager, Super Admin.
- Existing labels, status words, layouts and flows of approved screens, except the listed insertions.

### 10.2 Never add

- A storefront, pricing page, plan tiers, coupons, refunds, or a tax/GST invoice.
- Real payment provider screens, or card/UPI/bank/OTP fields.
- "Mark paid", "Record payment", "Activate manually" (**SA-05 is an excluded screen**), "Decline" (**SA-04 excluded**), "Create institution" (**SA-08 excluded**), a requester reply form (**PU-11 excluded**), invitations (**IA-12 excluded**).
- Role switchers, sample-account lists, "Viewing as", demo banners.

### 10.3 The proposed `/prototype/payment` route and hosted access

- It **stands in for an external payment provider**. It is **not a product screen**, has no screen ID, and appears in no navigation. It is reached **only** from PU-12 "Continue to payment" (and, for a payment left unconfirmed, from the prototype support index, CD-09).
- It is served **only by the prototype build profile**:
  - **Today:** the local prototype build (`NEXT_PUBLIC_XR_DATA_SOURCE=sample` and `NEXT_PUBLIC_APP_ENV=development`).
  - **Hosted "prototype" profile:** undecided (CD-17).
  - **Any other build** answers "Not found", and PU-12 keeps its current provider-neutral behaviour.
- **Hosted access:** a hosted prototype must be **access-protected** (for example host-level password protection). The current rule says "the permissive sample sign-in is never deployed publicly" (TE-8). Sample credentials never appear in product UI.
- The outcome is recorded as the **payment provider's report**, never as a user or admin "mark paid".
- The page is visibly labelled as simulated on every state.

### 10.4 Internal BITS institutions

They never see a quotation, a payment page, the simulated provider, a receipt or a payment row. They never appear in the Super Admin payments view.

---

## 11. Approvals needed before any build

| Item                                     | Approval needed                                                                                                                                                                                                   |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **New screen IDs**                       | **PU-17** Quotation, **PU-18** Simulated receipt, **IA-23** Subscription and payments, **SA-26** Payments, registered as "proposed extension — owner-approved composition" (distinct from a complete role export) |
| **New tabs**                             | **IA-02 third tab** "Subscription and payments" (changes the approved IA-v1 Content access tab set). **Operations fourth tab** "Payments" (changes the approved SA-v1 Operations tab set)                         |
| **Insertions into approved screens**     | PU-10 (A1, A7), PU-12 (A3), IA-17 and IA-03 (A9), SA-03 and SA-07 (A11)                                                                                                                                           |
| **Prototype support page**               | `/prototype/payment`: an owner authorisation extending the current payment stand-in (TE-4), recorded like the existing `/prototype` pages                                                                         |
| **Hosted profile and access protection** | CD-17 + TE-8                                                                                                                                                                                                      |
| **Words**                                | Every new line enters the state-copy register as _provisional_ until signed off                                                                                                                                   |
| **Visual sign-off**                      | Review build at 1440 · 1024 · 768 · 375                                                                                                                                                                           |

---

## 12. Approved requirements vs unresolved commercial decisions

### 12.1 Approved / confirmed (design must follow)

- External flow: request → **Super Admin approval** → **payment** → access. Access is never granted before approval (stakeholder STK31-20).
- Internal BITS route has **no payment screen**, but is still tracked (STK31-19).
- The B2B "cart" is a **selection basket and request preparation, not a checkout** (STK31-18).
- **No price on public pages** (blueprint 17/05; parity P-28).
- Four separate events: institution record · approval · payment confirmation · activation (BR-036).
- Terms Monthly · Quarterly · Yearly (BR-040). "Until a fixed date" exists in the current form, but **its pricing is undecided**.
- Licence quantity comes from the request; no universal cap. **Licence counting is undecided** (T-06), so licences show "as approved by BITS".
- Super Admin approves, chooses Internal or External once, and assigns the Institute Admin after activation.
- Owner identifier rule: no internal references in role workspaces.
- **Option A** approved as the design exploration approach (this brief).

### 12.2 Unresolved: use placeholders and annotate

| ID    | Decision                                              | Current proposal (not approved)                                              |
| ----- | ----------------------------------------------------- | ---------------------------------------------------------------------------- |
| CD-01 | Price basis                                           | Per licence × format × term, per experiment                                  |
| CD-02 | Currency and format                                   | INR, "₹ X,XX,XXX", Indian grouping, no paise                                 |
| CD-03 | Tax                                                   | No tax line; "No tax is calculated"                                          |
| CD-04 | Price figures                                         | Owner to supply. **Design uses placeholders only**                           |
| CD-05 | Disclaimer wording                                    | §4 line                                                                      |
| CD-06 | Quotation validity                                    | Frozen at approval, no expiry                                                |
| CD-07 | Quotation page and printing                           | PU-17 page; browser print only                                               |
| CD-08 | Simulated provider page                               | Three outcomes; under `/prototype`; same tab                                 |
| CD-09 | Resolving an unconfirmed payment                      | Re-open the provider page from the prototype support index; no admin control |
| CD-10 | Receipt content and references                        | "Not a tax invoice"; request reference only; no receipt number               |
| CD-11 | IA placement; internal label                          | IA-02 third tab; internal "Subscription" without payments                    |
| CD-12 | SA overview scope                                     | Operations tab, four views, counts only, read-only                           |
| CD-13 | **Renewal and more-licences pricing and plan effect** | **Not designed.** Interim: no amount; decision-pending frame                 |
| CD-14 | Paying while paused                                   | "Complete the payment" disabled while paused                                 |
| CD-15 | "Paid from" wording; PU-13 "Sign in" line             | "This browser" / "Your institution administrator"                            |
| CD-16 | New screen IDs                                        | PU-17, PU-18, IA-23, SA-26                                                   |
| CD-17 | Hosted prototype profile                              | Separate "prototype" build profile, access-protected                         |
| CD-18 | Saved sample data reset on upgrade                    | Accept a one-time reset                                                      |

---

## 13. Design review criteria

1. **Fidelity to the existing systems.** Uses only the tokens in §2 / §3: no new colours, typefaces, radii, shadows or spacing values. Public additions are indistinguishable in style from PU-10 / PU-12; IA and SA additions are indistinguishable from IA-02 / IA-03 / IA-17 and SA-20 / SA-22 / SA-03 / SA-07.
2. **Component reuse.** Every element maps to a component in §2.4 / §3.3. Any genuinely new element is flagged with a justification.
3. **Placement.** Matches §5 exactly: no new sidebar items; insertions only where listed; existing content untouched.
4. **Rules.**
   - No amount on PU-01…PU-09.
   - Internal institutions excluded.
   - No storefront, cart or checkout.
   - No provider fields.
   - No tax/invoice rows.
   - Excluded screens absent.
5. **Wording.** §4 rules: "Payment failed" (never "declined"), "E-mail", UK spelling, formatted dates, no internal references in IA/SA, disclaimer present wherever an amount appears.
6. **Placeholders.** Every money value is "₹ X,XX,XXX" / "₹ X,XXX" with a "PLACEHOLDER" annotation; renewal pricing shown only as decision-pending.
7. **States.** Every cell of §8 is designed or explicitly marked not applicable.
8. **Responsive.** All four widths, no horizontal scroll, no clipped text, thresholds per §9.
9. **Accessibility (WCAG 2.1 AA).**
   - 4.5:1 text contrast.
   - Visible 2 px #1F4FD8 focus.
   - Status never by colour alone (pill text always present).
   - Logical heading order (one H1).
   - Tables with header cells and labelled rows on phones.
   - Busy and outcome announcements (status / alert regions) noted.
   - Targets ≥ 44 px (public) / 40 px (V3 buttons).
10. **Separation of events.** No frame implies access before payment confirmation, or student access from payment alone.
11. **Annotation hygiene.** Annotations, placeholders and open-decision markers sit on a separate layer and never look like product UI.

---

## 14. Proposed design deliverables

1. **Journey board:** §6 end to end, from the existing PU-07/PU-08/PU-10/SA-03 frames to the new frames, with the internal branch and the renewal "decision pending" branch.
2. **Before/after insertion sheets** for PU-10, PU-12, IA-02 tabs, IA-17, IA-03, Operations tabs, SA-03 confirm dialog and SA-07: the existing approved frame beside the proposed one, insertion highlighted.
3. **Screen frames at 1440 · 1024 · 768 · 375** for A1–A11 covering every state in §8. Plus print views for PU-17 and PU-18, the internal IA-23 variant, and the paused variants.
4. **Component mapping sheet:** each element → existing component name and token references (§2.4 / §3.3); new elements flagged.
5. **Copy deck:** every new string, marked _provisional_, with its screen and state (for the state-copy register).
6. **Redlines:** spacing, type and colour references for the new regions and screens.
7. **Accessibility notes:** focus order, headings, live regions, phone table labelling.
8. **Open-decision overlay:** every CD-nn marked on the frames it affects.
9. **Placeholder and sample-data sheet** (Appendix A) used consistently.

---

## Appendix A: Placeholder sample data (use consistently; all fictional sample records)

**Institutions**

| Institution                       | Type          | Commercial state                                                                                                           |
| --------------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------- |
| Godavari Institute of Technology  | external, new | Approved — payment required → payment journey. Institute Admin after activation: Meera Iyer (`meera.iyer@godavari.edu.in`) |
| Vizag Polytechnic                 | external      | Approved — payment required (not started)                                                                                  |
| Sahyadri Institute of Engineering | external      | more-licences payment not confirmed (**renewal / more-licences: no amount, decision pending**)                             |
| Konark Polytechnic                | external      | active, payment confirmed                                                                                                  |
| Deccan Institute of Technology    | external      | paused                                                                                                                     |
| Malnad College of Engineering     | external      | access ended                                                                                                               |
| BITS Pilani — Hyderabad Campus    | **internal**  | **must never appear in any payment view**                                                                                  |

- **Super Admin:** Arjun Mehta.
- **Experiments (with courses):**
  - Shell-and-Tube Heat Exchanger, Composite Wall Conduction, Fin-Tube Bundle (Thermodynamics & Heat Transfer, **ME ZG523**)
  - CNC Turning Centre, Investment Casting (Manufacturing Processes, **MEL ZG512**)
  - Induction Motor Loading, Synchronous Generator, Transformer Tests (Electrical Machines, **EEE ZC341**)
  - Buck Converter Ripple (Power Electronics, **EEE ZG512**)
  - Distillation Column, Boiler Drum Level, Orifice Plate Metering (Process Instrumentation & Control, **CHE ZG513**)
- **Formats:** WEB · AR · VR · MR. Only the formats an experiment publishes can be chosen.
- **Example request:** REQ-0042, 120 licences, Yearly, approved 8 Oct 2026; plan term "Yearly · 8 Oct 2026 to 7 Oct 2027".
- **Money:** "₹ X,XX,XXX" (totals), "₹ X,XXX" (per licence). **No real figures.**
