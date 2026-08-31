# 02 — Component Reuse Map

| | |
|---|---|
| **Status** | 🟠 **REUSE INVENTORY — DRAFT.** An inventory of existing assets. **Nothing is redesigned, renamed, merged or restyled** |
| **Created** | 29 August 2026 |
| **Authorised by** | `11_SAFE_WORK_BEFORE_MONDAY.md` **S5** — component reuse mapping, *"an inventory of existing assets … invalidated by nothing"* |
| **Scale** | **194 component records** across five batches → **~120 canonical components** |
| **Headline** | **One design system already carries five batches, seven roles and seventy-one screens.** The consolidation problem is not building components — it is **de-duplicating four accidental re-implementations and applying three known corrections once instead of five times** |

---

## Reuse-confidence legend

| | |
|---|---|
| **VERY HIGH** | Used by 3+ batches unchanged, QA-passed, no open question touches it |
| **HIGH** | Used by 1–2 batches, proven, and its purpose survives every Monday answer |
| **MEDIUM** | Proven, but its **framing or content** depends on an open answer |
| **LOW** | Built for one context; transfers only as a pattern |
| **BLOCKED** | Cannot be carried forward until a named question is answered |

Origin: ★ new in that batch · ♻ reused from Batch 01

---

# 1 · GLOBAL SHELL

**The foundation. Batch 01 built it; Batches 02–05 consumed it and none broke it.**

| # | Component | Hook | Source | Purpose | Variants | A11y actually implemented | Responsive | Confidence | Consolidate? |
|---|---|---|---|---|---|---|---|---|---|
| 1 | **Application Shell** (`SHR-02`) | `shell()` · `.app` `.topbar` `.snav` `.frame` `.main` | B01★ · used by **all 5** | One chrome for every workspace | per-workspace nav content + context label only | `<header>/<nav>/<main>` landmarks · skip link is first tab stop · logical order | 1440 primary, 1280 verified; **fixed 232px sidebar overflows below ~520px** | **VERY HIGH** | ✅ one source |
| 2 | **Header / topbar + brand lockup** | `.topbar` `.brand` `.bdiv` `.pname` | B01♻ · all 5 | Brand + account | logo / no-logo fallback | logo alt *"BITS Pilani WILP"* | 64px `--topbar-h` | **VERY HIGH** | ✅ |
| 3 | **Account menu** | `.acctwrap` `.account` `.acctmenu` | B01 (visual-only) · **B04★ functional** · B03 · B05 | Identity + account destinations | closed · open · inert entries · signed-out | `aria-haspopup` `aria-expanded` `aria-controls` `role=menu/menuitem` · Esc closes, focus returns · outside-click dismiss | — | **VERY HIGH** | ⚠ **B04's is the only functional one — adopt it** |
| 4 | **Breadcrumb** | `crumbs()` · `.crumb` `.sep` | B01♻ · all 5 | Location + back path | 2–3 levels | `<nav aria-label="Breadcrumb">` · current not a link, `aria-current="page"` | — | **VERY HIGH** | ✅ |
| 5 | **Page header** | `phead()` · `.phead` `.ptitles` `.pmeta` `.pactions` | B01♻ · all 5 | Title · status · actions | list · detail · with/without badge | exactly one `<h1>` per view | — | **VERY HIGH** | ✅ |
| 6 | **Card** | `.card` `.chead` `.cbody` `.cnote` | B01♻ · all 5 | Content section | 3 | — | — | **VERY HIGH** | ✅ |
| 7 | **Two-column rail layout** | `.grid-rail` `.stack` | B01♻ · all 5 | Detail = content + rail | `minmax(0,1fr) minmax(300px,360px)` | — | collapses at ≤1120px | **VERY HIGH** | ✅ |
| 8 | **Skip link + focus management** | `.skip-link` `#skip-link` | B01★ · all 5 | Bypass blocks | — | first tab stop; focus moved on route change | — | **VERY HIGH** | ✅ |
| 9 | **Live-region announcer** | `announce()` · `#announcer` | B01★ · all 5 | Polite route/result announcements | — | `aria-live="polite"` `.sr-only` | — | **VERY HIGH** | ✅ |
| 10 | **Design tokens** | `:root` custom properties | B01★ · all 5 | Two-layer palette → semantic alias | light *(dark deferred — `QX-07`)* | contrast-annotated | 4px spacing scale | **VERY HIGH** | 🔴 **See §12 — four byte-identical copies** |

---

# 2 · NAVIGATION

| # | Component | Hook | Source | Variants | A11y | Confidence | Consolidate? |
|---|---|---|---|---|---|---|---|
| 11 | **Side navigation** | `.snav` `a.nitem` `.ncount` | B01★ · all 5 | count badge · active · one level | `<nav aria-label="Workspace">` · `aria-current="page"` · 36px targets | **VERY HIGH** | ✅ |
| 12 | **Sidebar sub-navigation** | `.snav .subnav` `.subitem` | **B05★ only** | open · closed · child-active | **parent highlighted WITHOUT `aria-current`** — only one element may claim it | **HIGH** | ✅ |
| 13 | **Tab navigation** | `.tabnav` `.tn-flag` | 🔴 **B02★ AND B03★ — implemented twice, independently** | current · needs-attention dot | real links (keyboard + back-button) · `aria-current="page"` · needs-attention has `sr-only` text | **HIGH** | 🔴 **DUPLICATE — see §12** |
| 14 | **Chip filter** | `.chipfilter` `.cf-n` | B03★ | 4 role values with counts | real links · `aria-current="true"` | **HIGH** | ✅ |
| 15 | **Pagination** | `.tfoot .pgn` | B01★ | prev/next + count | `<nav aria-label="Pagination">` · real disabled states | **MEDIUM** *(visual only — sample data fits one page)* | ✅ |
| 16 | **Workspace context label** | `.snav` overline | B01★ · all 5 | per-workspace | text, not colour | **VERY HIGH** | ✅ |

---

# 3 · DATA DISPLAY

| # | Component | Hook | Source | Variants | A11y | Confidence |
|---|---|---|---|---|---|---|
| 17 | **Table / data table** | `.tablecard` `table.dt` `a.rowlink` | B01★ · all 5 | 8 row shapes across batches | real `<table>` + `<caption class="sr-only">` · `<th scope="col">` · row action is a real link · status cells icon+text | **VERY HIGH** |
| 18 | **List bar + search** | `.listbar` `.searchbox` | B01★ · all 5 | search · selects · result count | labelled · count announced politely | **VERY HIGH** |
| 19 | **Key–value / Metadata group** | `.kv` `.k` `.v` | B01★ · B02 · B03 · B05 | read-only `<dl>` · editable twin | real `<dl>` semantics | **VERY HIGH** |
| 20 | **Rail key–value** | `.railkv` `.rk` `.rv` | B03★ | narrow-rail variant of `.kv` | — | **HIGH** |
| 21 | **Fact row** | `.factrow` `.f-k` `.f-v` | B05★ | 2 | — | **HIGH** |
| 22 | **Ladder** | `.ladder` `.lrow` `.lnode` | B01★ *(XR access)* · B02 *(learning sequence)* | 6 XR states · 5 sequence states | each node's state in text | **VERY HIGH** |
| 23 | **Timeline** | `.timeline` `.tl-item` | B01★ *(review history)* · B02 *(attempt history)* · B05 *(request state)* | 3 callers | `<ol>` with full-text entries | **VERY HIGH** |
| 24 | **Stepper / Workflow stage indicator** | `.stepper` `.step` | B01★ *(governance gates)* · B03 *(SSO setup)* | complete · current · upcoming · **returned** · did-not-succeed | `<ol>`; each step's state in text, never colour/shape alone | **VERY HIGH** |
| 25 | **Run list** | `.runlist` `.rl-dot` | B03★ | 2 | status dot **decorative** — outcome always written out | **MEDIUM** |
| 26 | **Update summary** | `.updrow` `.u-v` `.u-k` | B03★ | 2 | plain counts, word labels — *not a chart, not a percentage, not a trend* | **MEDIUM** |
| 27 | **Inline citation** | `.cite` | B05★ | 2 | monospace, muted; never competes with content | **HIGH** *(a documentation device)* |
| 28 | **Not-list** | `.notlist` | B05★ | 1 | — | **HIGH** — *what a surface deliberately does not show, kept visible* |

---

# 4 · CONTENT DISCOVERY

**The public catalogue's raw material. Every row here is Batch 04's, and every row survives.**

| # | Component | Hook | Source | Variants | A11y | Confidence | PM dep |
|---|---|---|---|---|---|---|---|
| 29 | **Catalogue filter bar** | `.filterbar` `.fb-row` `.fb-foot` `.fb-count` | B04★ | active / inactive | **every control has a visible label**, not a placeholder standing in for one | **VERY HIGH** | ⚠ drop the `Type` filter — `PQ-02` |
| 30 | **Filter pill** | `.fpill` + remove button | B04★ | 3 | `aria-label` names the filter it removes | **VERY HIGH** | — |
| 31 | **Catalogue card** | `catCard()` · `.catgrid` `.catcard` | B04★ | available · owned · bundle · module · focus-within | **card is NOT a click target** — title is a link, action is a button; `:focus-within` gives keyboard parity with hover | **VERY HIGH** | ⚠ chip label `PQ-04` · amount `PM29-04` |
| 32 | **Product hero** | `.phero` `.ph-kicker` `.ph-lede` `.ph-facts` | B04★ | 3 | lede capped at 62 chars/line | **VERY HIGH** | — |
| 33 | **Included-item list** | `inclRows()` · `.incl` `.incl-row` | B04★ | **one component, four callers** — module contents · bundle contents · access summary · outcome list | success tint **always alongside the badge**, never instead of it | **VERY HIGH** ▶ *the promise stays identical from catalogue to confirmation* | — |
| 34 | **XR format badge** | `fmtBadge()` · `.fmt-web/vr/mr/ar` | B01♻ · B02 · B03 · B04 | **4 formats — MR retained** | icon + letters + colour, never colour alone | **VERY HIGH** | ⚠ `PQ-13` MR · `PQ-08` variant |
| 35 | **Search** (`SHR-03`) | `.searchbox` | B01★ · all 5 | filters as you type | labelled · count announced | **VERY HIGH** | — |

---

# 5 · CONTENT GOVERNANCE

**▶ The highest-value reuse finding in the whole corpus.** If `PQ-03` resolves to an in-product approver, this block is a **near-exact fit for tenant-application review** — already built, QA-passed and accessible.

| # | Component | Hook | Source | Purpose | Fits tenant-application review? |
|---|---|---|---|---|---|
| 36 | **Submission row** | `.dt` row + `.row-returned` inset | B01★ | Queue row w/ status, holder, updated | ✅ **A request row** |
| 37 | **Submission summary card** | `submissionSummaryCard()` | B01★ | Header block on detail/review | ✅ **An application summary** |
| 38 | **Review panel** (decision card) | rail decision blocks | B01★ | The decision for the current gate; renders **only** the actions the role holds | ✅ **Approve / request more information** |
| 39 | **Comment composer** | `requestChangesDialog()` | B01★ | Required reason on return; optional note on approve | ✅ **A required reason** |
| 40 | **Review comment / quoted reason** | `.tl-note` `.tl-item.warn` | B01★ | Author · role · timestamp · body | ✅ |
| 41 | **Changes Required panel** | `.feedback-panel` `.fh` | B01★ | The **loudest** element on a returned item | ✅ **Applicant-visible feedback** |
| 42 | **Approval panel / record** | `acadCard` | B01★ | Read-only record of a completed gate | ✅ |
| 43 | **Review history timeline** (`SHR-05`) | `timeline(sub)` | B01★ | Every submission, decision, return, comment, resubmission | ✅ **A history trail** |
| 44 | **Workflow stage indicator** | `stepper(sub)` | B01★ | Gate position, incl. the **returned** node | ✅ **A submitter-visible state** |
| 45 | **Version chip / resubmission marker** | `vchip()` `resubChip()` | B01★ | v2 chip + Resubmitted badge | 🟠 Analogue only |
| 46 | **Readiness checklist** | `.checkrow` | B01★ | CM readiness review | 🟠 Analogue only |
| 47 | **Build / docs file list** | `buildDocsCard()` | B01★ | Submitted artefacts | ✅ **Attached documents** |
| 48 | **File upload** | `.upload` `.up-ic` | B01★ | Drop area · uploaded row · error. **No format promise** — `QT-05` | ✅ **Also the CSV import target** |
| 49 | **Tabs — content viewer** (`SHR-01`) | `reviewTabs()` | B01♻ | Overview · Build & assets · Documentation · Academic record | ✅ |

> **Nine of fourteen map directly.** `08_TENANT_ONBOARDING_MODEL.md` §6 reached the same conclusion independently: *"that pattern already handles approve / request changes / reason required / history."*

---

# 6 · ACCESS / ENTITLEMENT

| # | Component | Hook | Source | Confidence | PM dep |
|---|---|---|---|---|---|
| 50 | **Access panel** | `.accesspanel` (+`.have` `.partial`) | B04★ | **HIGH** — position and behaviour survive | ⛔ **its action is `PQ-06`** |
| 51 | **Access badge** | `accessBadge()` | B04 | **VERY HIGH** — derived `none`/`some`/`all` | ⚠ `some` is bundle-only |
| 52 | **Access summary card** (checkout) | `.checkout` `.sumcard` `.sumline` `.sumtotal` | B04★ | **MEDIUM** | ⛔ `PQ-06` |
| 53 | **Account block** | `.acctbox` | B04★ | **HIGH** — the learner-facing half of FRD 9.2.1 | — |
| 54 | **Payment step** | `.paystep` | B04★ | **HIGH** — *a statement, not a choice*; **zero payment methods, because none is source-supported** | ⚠ `Q-34` gateway |
| 55 | **Outcome panel** | `.outcome` `.busy/.ok/.bad/.wait` | B04★ | **VERY HIGH** — all three FRD 9.1.x outcomes; **words-first headings** | — |
| 56 | **Determinate progress bar** | `.procbar` `.pb-steps` | B04★ | **HIGH** — *waiting never reads as a hang* | — |
| 57 | **Just-added row** | `tr.row-new` | B04★ | **HIGH** — badge is the accessible signal, tint is reinforcement | — |
| 58 | **Sign-in handoff panel** | `.handoff` | B04★ | **LOW** — **SUPERSEDED** by real auth. *A panel, not a form; collects nothing* | ⛔ `AUTH-01` |
| 59 | **XR Access ladder / Device Access Panel** | `xrLadder()` | B01★ | **VERY HIGH** — entitlement → device → availability → completion, one contextual CTA | `QT-01` mechanism-neutral |
| 60 | **Entitlement status row** | inside `xrLadder()` | B01★ | **VERY HIGH** — **B2B copy has no purchase prompt** (`D-01`) | — |
| 61 | **Device compatibility row** | inside `xrLadder()` | B01★ | **VERY HIGH** — *never a dead launch button* | `PQ-13` MR |
| 62 | **Completion pending / received** | `progressCard` | B01★ | **VERY HIGH** — pending is a **normal state, not an error** | — |
| 63 | **Covered content list** | `.covers` | B03★ | **VERY HIGH** — what an access record covers | — |
| 64 | **Eligibility list** | `.elig` | B03★ | **HIGH** — remove button carries a full `aria-label` naming the population | ⛔ `PQ-05` |
| 65 | **Reach flow** | `.reachflow` | B03★ | **HIGH** — access → reaches → eligible → in their learning; pending cells read in **words** | — |
| 66 | **Mapping row + reach pill** | `.maplist` `.maprow` `.reachpill` | B03★ | **HIGH** ▶ **the reuse source for Super Admin tenant-content allocation** | ⚠ allocation unit |
| 67 | **Learner access card** | `.entgrid` `.entcard` | B03★ | **HIGH** — **no action control**, because a non-functional control is never drawn | — |
| 68 | **Population picker** | `.pickgroup` | B03★ | **MEDIUM** — stream / group / person, each with a consequence line | ⛔ `PQ-05` |

---

# 7 · ASSESSMENT

**Batch 02's 19 new components. The most self-contained block in the corpus — and the one nothing on 29 August touches.**

| # | Component | Hook | Notable property |
|---|---|---|---|
| 69 | **Disclosure list** | `disclosureRows()` `.disc` | ▶ **The heart of the model.** Renders **no authored copy** — every row derives from the configuration object |
| 70 | **Configuration group** | `.cfggroup` | fieldset+legend; dependent fields disable (penalty ⇔ negative marking, minutes ⇔ timed) |
| 71 | **Completeness checklist** | `completeness()` `.donelist` | ok/todo + **the next safe action sentence**; states announce in text |
| 72 | **Question navigator** | `.qgrid` `.qlegend` | numbered buttons, each with a full `aria-label`; legend in text; wraps with count |
| 73 | **Timer chip** | `.timerchip` | **only when configured**; `low` under 5 min; **no enforcement — expiry prompts, never auto-submits** |
| 74 | **Answer option** | `.opt` | real radio inside a label; default/hover/selected/focus-within; static preview variant |
| 75 | **Descriptive input** | `.desc-input` `.savenote` | labelled textarea + *"Saved in this attempt"* + evaluated-after-submission note |
| 76 | **Review row** | `.revrow` | answer excerpt or *"Not answered"* (warning) |
| 77 | **Result hero** | `.result-hero` | pass / fail / pending; `role="status"`; plain-language consequence |
| 78 | **Score line** | `.scoreline` | tabular numerals, labels in text |
| 79 | **Question card** | `.qcard .qprompt` | 3 |
| 80 | **Attempt layout** | `.attempt-grid` | question area + navigator rail; position + answered count **always in text** |
| 81 | **Question type badge** | `qtypeBadge()` | **text label, never colour/icon alone** |
| 82 | **AI draft badge pair** | `.ai-badge` | *"AI-generated draft"* + *"Review required"*, dashed to read as provisional |
| 83 | **AI draft card** | `.aicard` | correct answer marked *"visible to faculty only"* · Accept / Review & edit / Discard |
| 84 | **Question row** (builder) | `.qrow` | 2 |
| 85 | **Upload report** | `uploadReportPanel()` `.uprep` | ▶ **per-row outcome list — the FRD 5.1.1 acceptance criterion, and the reuse source for CSV people import** |
| 86 | **Preview banner** | `.previewbar` | marks faculty preview as not-recorded |
| 87 | **Number input styling** | `.field input[type=number]` | Batch 01 covered text/textarea/select only |

---

# 8 · TENANT ADMIN

| # | Component | Hook | Source | Notable property | Confidence |
|---|---|---|---|---|---|
| 88 | **Operational status card** | `.opscard` `.opsgrid` | B03★ | **Deliberately incapable of holding a chart — there is no slot for one** | **HIGH** |
| 89 | **Attention list** | `.attnlist` `.attn-item` | B03★ | chip + what is wrong + why it matters + the control that resolves it | **HIGH** 🔴 **see §12** |
| 90 | **Connection status block** | `.constat` | B03★ | 5 states; **meaning is in the title text, not the node colour** | **HIGH** |
| 91 | **Setup card** | `.setupcard` | B03★ | one card per connection | **HIGH** |
| 92 | **Provenance chip** | `.srcchip` `.srcnone` | B03★ | ▶ *"From institution data"*, or a plain `—` where the platform **cannot state an origin** — with `aria-label` so a screen reader hears *"Not recorded"* rather than a bare dash | **VERY HIGH** |
| 93 | **Issue card** | `.issuelist` `.issue` | B03★ | title · count · **what happened** · separately-boxed **what to do next** · people affected · retry. Resolved state **removes the retry path rather than disabling it** | **VERY HIGH** ▶ **CSV import errors** |

---

# 9 · SUPER ADMIN

| # | Component | Hook | Source | Notable property | Confidence |
|---|---|---|---|---|---|
| 94 | **Scope bar** | `.scopebar` (+`.inst`) | B05★ | ▶ **The moment of crossing into a tenant must never be invisible.** Colour is not the only carrier — icon, key line and note all change | **VERY HIGH** |
| 95 | **Boundary note** | `.boundary` (+`.owner`) | B05★ | ▶ **The batch's signature idea.** *A boundary note names a role and a requirement.* Tinted, not warned — *"someone else owns this" is a fact, not a problem* | **VERY HIGH** |
| 96 | **Source gap** | `.gap` | B05★ | ▶ **A gap note REPLACES a control; it never accompanies a disabled one.** *A greyed-out button implies the route exists* | **VERY HIGH** — **a platform-wide rule** |
| 97 | **Readiness ledger** | `.ledger` `.led` | B05★ | Three rows, always all three — **a missing fact is shown as missing rather than omitted**; provenance line on every row without exception | **VERY HIGH** |
| 98 | **Attention list** | `.attn` `.attn-row` `.attn-clear` | B05★ | **A work list, not a KPI row.** `.attn-clear` is *an outcome, not an empty state*. Explicit `aria-label` per row so the name is not an unusable concatenation | **VERY HIGH** 🔴 **see §12** |
| 99 | **Institution state pill** | `.istate` | B05★ | each state carries **its own icon and its own words** | **HIGH** |
| 100 | **Release decision panel** | `.decide` `.verpair` `.verbox` | B05★ | live→new pairing; **no diff, changelog or version tree — no source defines one** | **MEDIUM** ⛔ `PQ-01` |
| 101 | **Configuration register row** | `.reg` `.reg-row` | B05★ | ▶ **An excellent pattern for any area where authority exists and content does not.** Zero invented controls | **VERY HIGH** |
| 102 | **Device transfer cell** | `.devmove` | B05★ | `from → to` in **one** column — two columns pushed the queue past 1280px | **HIGH** |

---

# 10 · FEEDBACK / STATUS

| # | Component | Hook | Source | Variants | Notable property |
|---|---|---|---|---|---|
| 103 | **Status badge** | `.badge` + family classes | B01★ · **extended by all four others** | **~40 states across 6 families** — governance · XR · assessment lifecycle · assessment learner · institutional account/access/connection · institution state | **Icon + text + colour. Never colour alone.** ⚠ *"Ready to Publish" was retired* when the hand-off it described ceased to exist |
| 104 | **Alert** | `.alert.info/.success/.warning/.danger` | B01♻ · all 5 | 4 | inline tinted panel, icon + title + body + optional action |
| 105 | **Toast** | `toast()` `.toast` | B01♻ · all 5 | 2 | bottom-left, `aria-live="polite"`, 5s + dismiss |
| 106 | **Empty state** | `emptyState()` `.empty` `.echip` | B01♻ · all 5 | **~20 per-surface copies** | *empty queue ≠ filtered-empty ≠ nothing yet* — the copy is per-cause, never generic |
| 107 | **Loading / progress / spinner** | `.progressbar` `.spinner` | B01♻ · all 5 | 3 | **determinate where progress is knowable; honest indeterminate + explanation where not** |
| 108 | **Error state grammar** (`STATE-03`) | — | B01♻ | — | what happened + what to do next + where to get help. **No internal codes** |
| 109 | **Confirmation / input dialog** | `openDialog()` `.scrim` `.dialog` | B01♻ · all 5 | confirm · **input (required reason)** · consequence-aware | 520px · focus trap · Esc · **backdrop click does not destroy input** · focus returns to invoker |
| 110 | **Form field + validation** | `.field` `.ferr` + `showErrors()` | B01♻ · B02 · B03 | 6 | inline per-field + **error summary that receives focus**; `aria-invalid` + `aria-describedby` |
| 111 | **Buttons** | `.btn.pri/.sec/.gho/.sm/.lg/.blk` | B01♻ · all 5 | 9 | real `<button>`; loading announces via `aria-busy` + text change |
| 112 | **Icon button** | `.iconbtn` | B01★ | 2 | `aria-label` required · ≥24px target |
| 113 | **Inline SVG icon set** | `PATHS` + `ic()` | B01★ (+**7 added in B05**) | 24 viewBox, 1.7 stroke | **no icon font, no external file.** B05's `building` is *deliberately not a bank* |
| 114 | **Sample data tag** | `.sample-tag` `sampleTag()` | B01★ · all 5 | 5 | dashed; marks anything mistakable for an approved business value |

---

# 11 · PROTOTYPE-ONLY

**Not product UI, and never was. Recorded so their absence from a consolidated product reads as scope.**

| # | Component | Hook | Source | Fate |
|---|---|---|---|---|
| 115 | **Prototype navigation strip** | `.protobar` | B01★ · all 5 | ❌ **Deleted at Stage 7.** Slate-dark, monospace, *"cannot be mistaken for product chrome"* |
| 116 | **Prototype note / control** | `.proto-note` `.pn-label` | B01★ · all 5 | ❌ Deleted |
| 117 | **Prototype index furniture** | `.index-wrap` `.pathcard` `.rolecard` | B01★ · all 5 | ❌ **Replaced by real auth + workspace resolution** |
| 118 | **Convergence figure** | `.converge` | B04★ | 🟢 **Keep as documentation.** *"The figure that lets a PM see the Batch 03 ↔ Batch 04 relationship without narration"* |
| 119 | **Sample-data note** | `.samplenote` | B05★ | ❌ Deleted |

---

# 12 · 🔴 Consolidation findings

## 12.1 · The base stylesheet has **zero** drift

**Measured, not assumed.** All five copies of the Batch-01 sheet — the master `prototype/batch01-prototype.css` plus `batch01-design-system.css` in B02, B03, B04 and B05 — are **byte-identical**: `md5 8f9fa1b862f23ca4eeccc50d429bca75`, 438 lines each, and `diff` between every adjacent pair returns nothing.

> **The four copies are a delivery-format artefact, not a design fault.** Safari blocks parent-directory subresources for a document opened from `file://`, which left the pages unstyled. Consolidation needs **one source**, but no reconciliation — there is nothing to reconcile.

**The drift is in the five per-batch override sheets that sit on top**, and it is **asymmetric**.

## 12.2 · Drift in the override sheets

| # | Finding | Present in | Absent in | Consequence |
|---|---|---|---|---|
| **F1** | `--text-3` corrected `#6A7686` → `#5F6B7A` | B04, B05 | **B01, B02, B03** | The same token renders **4.30:1** in B01–B03 and **5.43:1** in B04/B05. Below AA 4.5:1 for the small text it carries |
| **F2** | `--control-border:#7E8A99` | **B05 only** | B01–B04 | Interactive-control borders measure **1.84:1** in B01–B04. **WCAG 2.1 SC 1.4.11 requires 3:1** — that border is the only thing identifying the control |
| **F3** | `[hidden]{display:none !important}` | B03, B04, B05 | **B01, B02** | `.ferr`'s author `display:flex` outranks the UA rule behind the `hidden` attribute, so inline field errors render permanently |
| **F4** | `.empty h2` heading-order fix | B04, B05 | **B01, B02, B03** | An empty state directly beneath the page `<h1>` still emits an `<h3>` — a skipped level |
| **F5** | `table.dt a.rowlink .tmain/.tsub{display:block}` | **B05 only** | B01–B04 | Both inherit `inline` wherever they sit directly inside `a.rowlink`, running text together. B05 used a **descendant** selector rather than `>`, *"because a rule that depends on one exact nesting depth is the wrong kind of fragile"* |
| **F6** | `.subtle-note` | 🔴 **B02 `line-height:1.6`** vs **B03/B04 `line-height:1.55`** | — | **The same class name carries two different values.** Neither is wrong; they simply never met |
| **F7** | `.tabnav` | 🔴 **Byte-identical in B02 and B03** | — | B03 says so explicitly: *"Same pattern Batch 02 uses; **defined locally so Batch 03 loads no other batch's sheet**"* |
| **F8** | `.sample-tag{white-space:nowrap}` | **B02** | — | 🔴 B02 **restyles a Batch-01 component** despite its own "extensions only" claim |

> ⚠ **F1–F5 behave identically in every batch that lacks them, wherever the same markup shape occurs.** They are **shared design-system findings recorded for consolidation — deliberately not fixed in the batches by this task or the last one.**

## 12.3 · 🔴 The shell contract is not actually identical

**The stated rule** (`02_FOUNDATIONS_AND_SHELL.md` §3, `QX-06`): *"Role differences come from navigation content, permissions, actions and data — **never from different chrome**."* Measured against the code, the **header's right-hand region breaks it**.

| | B01 · B02 · B03 | B04 | B05 |
|---|---|---|---|
| Institution chip (`.inst-chip`) | ✅ rendered | ❌ dropped | ❌ dropped *(deliberately — an institution name in global chrome would imply a tenant this role does not have)* |
| Help link (`.top-help`) | ✅ rendered | ❌ dropped | 🟠 demoted to an `aria-disabled` menu item |
| Account control | 🔴 **`aria-haspopup="menu"` + `aria-expanded="false"` — and it opens nothing** | ✅ real `.acctmenu` | ✅ real menu |
| Signed-out state | — | ✅ replaced by a `Sign in` button | — |

### The two defects this surfaces

| # | Defect | Severity |
|---|---|---|
| **F9** | **A false ARIA promise on three of five batches.** B01, B02 and B03 render `aria-haspopup="menu"` and `aria-expanded="false"` on an account button that opens no menu. A screen-reader user is told a menu exists and finds none. It is *"visual-only by declared scope"* — but the ARIA is not scoped with it | 🔴 **Real accessibility defect.** Cheap to fix: either remove the attributes or adopt B04's working menu |
| **F10** | **The *"Help in a consistent location (WCAG 3.2.6)"* claim holds within B01–B03 and is broken platform-wide.** B04 drops Help; B05 demotes it | 🟠 SC 3.2.6 Consistent Help is **WCAG 2.2 A** — and the design target is **WCAG 2.2 AA** |

### Other shell deviations

| Finding | Detail |
|---|---|
| **F11 · Nav landmark label** | `"Workspace navigation"` (B01/B02/B03) · `"Learner navigation"` (B04) · `"Super Admin navigation"` (B05). The shell doc specifies `aria-label="Workspace"` — **which no batch matches exactly** |
| **F12 · Landing nav item** | `Overview` in B03 and B05, **`Home` in B04** — against B01's stated rule that governance roles land on their queue and there are no fake dashboards |
| **F13 · Nav depth** | One level in B01–B04; **B05 is the first two-level nav**. Depth stops at two, as Batch 03 required |

## 12.4 · 🔴 Four accidental re-implementations

**Each is one idea built two or three times, in isolation, because the batches never loaded one another's sheets.**

| # | Idea | Implementations | Recommendation |
|---|---|---|---|
| **F14** | **Status row with a state node** — circular node + ok/warn/bad ring + title + description + status word | **Three:** `.lrow`/`.lnode` (B01 XR ladder) · `.constat`/`.cs-node` (B03 connection status) · `.led`/`.l-ic` (B05 readiness ledger). **None reuses another** | Promote one primitive; keep three content variants |
| **F15** | **Label/value pair** | **Four:** `.kv` *Metadata Group* (B01, 190px grid) · `.railkv` (B03, 132px flex — **explicitly created because `.kv` is too wide**) · `.sumline` (B04 checkout) · `.factrow` (B05) | One primitive, four densities |
| **F16** | **Attention / work list** | **Two:** `.attnlist`/`.attn-item` (B03) · `.attn`/`.attn-row`/`.attn-clear` (B05) | **Adopt B05's** — it carries an explicit per-row `aria-label` so the accessible name is not an unusable concatenation |
| **F17** | **Content card for one content item** | **Three:** `Experiment Card` (B01 My Learning) · `.entcard` *Learner Access Card* (B03) · `.catcard` (B04 catalogue) | **Adopt B04's skeleton**; B01's and B03's become footer variants |

## 12.5 · Naming collisions worth resolving once

| # | Collision | Detail |
|---|---|---|
| **F18** | **"Tabs" means two different interaction models** | B01's `.tabs` is the **real ARIA tablist / roving-tabindex** pattern. B02's and B03's `.tabnav` are **ordinary links with `aria-current="page"`**. Both are documented as "Tab Navigation" — *a consumer reading the docs cannot tell which they are getting* |
| **F19** | **"Filter" means three different things** | B01 — a native `<select>` in `.listbar` · B03 — `.chipfilter`, link-chips with `aria-current` and per-option counts · B04 — `.fpill`, a removable pill with its own remove button |
| **F20** | **Search labelling has three idioms for one primitive** | `aria-label` on the input (B01, B02) · `sr-only <label for>` (B03, B05) · **visible uppercase label** (B04's `.filterbar`) |
| **F21** | **The XR ladder has two product names for one CSS component** | B01 documents `.ladder`/`.lrow` as *Device Access Panel* / *XR access ladder*; B02 reuses **the identical hooks** and calls it the *learning sequence*, adding only an action slot |
| **F22** | **Badge family mixes two naming axes** | Semantic state names (`.b-neutral` `.b-info` `.b-success` `.b-warning` `.b-danger` `.b-outline`) sit beside **`.b-published`**, which encodes a specific governance status rather than a hue or a state role |
| **F23** | **The component doc name almost never equals the CSS hook** | *Workflow Stage Indicator* = `.stepper` · *Review History Timeline* = `.timeline` · *Changes Required Panel* = `.feedback-panel` · *Device Access Panel* = `.ladder` · *Operational Status Card* = `.opscard` · *Readiness ledger* = `.ledger`. **There is no naming convention linking the two** |
| **F24** | **"This is deliberately not built, and here is why" is a component in one batch and prose in others** | B05 renders it — `.boundary`, `.gap`. B01 and B03 express the same idea **only in markdown tables**. ▶ **B05's is the better answer, and it is a platform-wide rule worth adopting** |

> **None of F1–F24 is a mistake by a batch.** Every one is the predictable cost of five packages built in sequence, in isolation, each correctly refusing to edit the others. They are listed here because **Stage 6 is where they get resolved once — and a merge performed before that would inherit all twenty-four.**

---

# 13 · Canonical component candidates

**The brief's list, answered against what exists.**

| Candidate | Canonical source | Confidence |
|---|---|---|
| App shell | **B01** `SHR-02` | **VERY HIGH** |
| Role / account menu | **B04** *(the only functional implementation)* | **VERY HIGH** |
| Sidebar navigation | **B01** + **B05** sub-nav | **VERY HIGH** |
| Status badge | **B01** grammar + four batches' families | **VERY HIGH** |
| Alert / banner | **B01** | **VERY HIGH** |
| Table / list | **B01** | **VERY HIGH** |
| Search / filter bar | **B01** `.listbar` *(admin)* + **B04** `.filterbar` *(catalogue)* — **two legitimately different densities** | **VERY HIGH** |
| Content card | **B04** `.catcard` | **VERY HIGH** |
| Experiment card | **B01** `Experiment Card` *(My Learning)* + **B04** `.catcard` *(catalogue)* | **HIGH** |
| Course card | 🔴 **Does not exist.** Nearest: B04 `.catcard` + `.cc-count` | **NEW — derivable** |
| CTA panel | **B04** `.accesspanel` | **HIGH** ⛔ *action is `PQ-06`* |
| Detail summary panel | **B01** `Submission Summary` · **B04** `.phero` | **VERY HIGH** |
| Empty state | **B01** + ~20 per-cause copies | **VERY HIGH** |
| Confirmation dialog | **B01** *(incl. the required-reason input variant)* | **VERY HIGH** |
| Progress status | **B01** `xrLadder` · **B02** `.donelist` · **B04** `.procbar` | **VERY HIGH** |
| Access state | **B04** derived `none`/`some`/`all` + **B03** eligibility chain | **VERY HIGH** |
| Review history / timeline | **B01** `SHR-05` | **VERY HIGH** |
| Form section | **B01** `.field` + validation grammar | **VERY HIGH** |
| Data sync / status | **B03** `.constat` · `.runlist` · `.issue` | **VERY HIGH** |
| Prototype disclaimer | **B01** `.protobar` · `.proto-note` | ❌ **Deleted at Stage 7** |
