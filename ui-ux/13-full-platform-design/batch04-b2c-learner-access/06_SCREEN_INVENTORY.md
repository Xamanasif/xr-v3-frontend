# 06 — Screen Inventory

**Batch 04 · Individual (B2C) learner access**

---

## 1. Base screens — 10 product screens

| # | ID | Screen | Route | Purpose | Requirement | Reframe ID |
|---|---|---|---|---|---|---|
| 1 | `B2C-01` | **Explore — catalogue** | `#/explore` | What can I learn, what does it run on, what do I already have, what can I get | 1.1.3 · 6.1.1 · 6.1.2 · D-21 · Table 14 ② | `B2C-01` |
| 2 | `B2C-02` | **Module detail** | `#/module/<id>` | What this is, what is in it, what it runs on, whether I have it | 6.1.1 · 3.1.1 · 3.1.2 · 1.2.x · D-24 · Table 14 ③ | `B2C-02` |
| 3 | `B2C-03` | **Bundle detail** | `#/bundle/<id>` | Exactly what a bundle contains, and what I would gain | 6.1.2 · D-24 | `B2C-02` |
| 4 | `B2C-04` | **Get access** | `#/get-access/<id>` | What · which account · how much · pay | 6.1.x · 9.1.1 · 9.1.2 · Table 14 ③ | `B2C-03` |
| 5 | `B2C-05` | **Confirming payment** | `#/processing` | Determinate wait; nothing added yet | 9.1.1 · 9.1.2 · Table 14 ④ | `B2C-04` |
| 6 | `B2C-06` | **Access outcome** | `#/result` | Succeeded · not completed · still confirming | 9.1.x · 9.2.1 · 9.2.2 | `B2C-05` |
| 7 | `LRN-02` | **My Learning** | `#/my-learning` | Everything the learner has access to | 8.1.5 · 9.2.2 · D-22 · Table 14 ⑤ | `LRN-02` |
| 8 | `LRN-04b` | **Experiment handoff** | `#/learn/<id>` | What is in it, and where the rest is designed | 3.1.1 · 3.1.2 · PM-09 | `LRN-04` entry |
| 9 | `B2C-07` | **Access history** | `#/history` | What access was added to this account, and when | **Inventoried, not required** — `DA-07` | `B2C-06` |
| 10 | `AUTH-B2C` | **Sign in to continue** | `#/sign-in[/<id>]` | A transaction belongs to an account | 4.1.1 · `QX-10` | — new, minimal |

**All six inventoried `B2C-01` … `B2C-06` screens are covered**, plus `LRN-02` in the individual context, an experiment handoff, and a minimal authentication handoff.

### Not counted as design screens

| Route | What it is |
|---|---|
| `#/index` | **Prototype index** — not product UI. Demo paths, the two-routes figure, entry points |
| `#/home` · `#/progress` | **Prototype signposts** — not product UI. They keep the confirmed navigation intact while naming exactly where each surface is designed. Labelled as signposts on screen |
| unknown routes | Fall back to the prototype index rather than a blank page |

**Screen count is deliberately not inflated.** Nine of the ten are load-bearing; the tenth (`AUTH-B2C`) exists because a transaction must belong to an account and would otherwise dead-end. Payment outcomes are **states of one screen**, not three screens.

---

## 2. Important states — 24

### `B2C-01` Explore
1. Full catalogue — 11 offerings, mixed access states
2. Search applied — results plus a removable pill
3. Filters applied — discipline + delivery type, bundles matched by their contents
4. **No results** — three pills, one clear action
5. Signed out — browsable; header offers Sign in
6. Learner already holds something — banner naming how many

### `B2C-02` Module detail
7. Available — amount, Get access
8. **Already held** — no amount, no Get access, Go to My Learning
9. Web-delivery variant — "runs in a web browser"
10. Device-delivery variant (VR/MR/AR) — device line plus the platform-makes-it-available note
11. Also-in-a-bundle — the bundle listed, no saving claimed

### `B2C-03` Bundle detail
12. Available — all contents listed
13. **Partly held** — "N of M already yours", per-module marks, **no amount**, remaining modules offered individually, overlap notice
14. **Fully held** — "You have all of this", no amount, no action

### `B2C-04` Get access
15. Single module
16. Bundle — contents enumerated from the bundle record
17. **Partly-held bundle blocked at the route** — "Some of this bundle is already yours"; no payment control; remaining modules offered individually

### `B2C-05` / `B2C-06` Payment
18. **Processing** — determinate, nothing added yet
19. **Succeeded** — what arrived, listed, plus reference
20. **Not completed** — nothing added, no amount taken, retry
21. **Still confirming** — nothing added yet, activation is automatic if it completes

### `LRN-02` My Learning
22. Populated — origin shown per row
23. **Just added** — banner plus per-row badge, shown once
24. **Empty** — "Explore the catalogue" (individual variant of Divergence 6)

**Plus:** access history populated · access history empty · already-have route guard · sign-in handoff · signed-out catalogue.

---

## 3. Routes — 15

| Route | Screen |
|---|---|
| `#/index` | Prototype index |
| `#/explore` | `B2C-01` |
| `#/module/<id>` | `B2C-02` |
| `#/bundle/<id>` | `B2C-03` |
| `#/get-access/<id>` | `B2C-04` — or the already-have guard |
| `#/processing` | `B2C-05` |
| `#/result` | `B2C-06` |
| `#/my-learning` | `LRN-02` |
| `#/learn/<id>` | `LRN-04b` |
| `#/history` | `B2C-07` |
| `#/sign-in` · `#/sign-in/<id>` | `AUTH-B2C` |
| `#/home` · `#/progress` | Signposts |
| anything else | Prototype index |

---

## 4. End-to-end flows

| Flow | Path | Proves |
|---|---|---|
| **A — Discover → get access → My Learning** | Explore → module → Get access → pay → succeeded → My Learning | The core B2C journey. **The same item** changes state and appears in My Learning without a reload |
| **B — Bundle access** | Explore → bundle → Get access → pay → succeeded → My Learning | One transaction grants **every module the bundle contains, each individually** (6.1.2) |
| **C — Already held** | Explore → an item already held → detail | **No purchase path anywhere** — and forcing the checkout URL is blocked at the route. The same guard blocks a **partly-held bundle** |
| **D — Payment not completed** | detail → Get access → simulate failure | **No access created**, catalogue unchanged, absent from My Learning, retry available |
| **E — Search / filter** | Explore → search → filter → no results → clear | Discovery updates locally, including the empty state and reset |
| **F — Signed out** | Sign out → detail → Get access → sign-in handoff → back | A transaction belongs to an account, without designing authentication |

---

## 5. Prototype state

| State | Kind |
|---|---|
| `available` | Derived from `S.access` |
| `checkout` | `tx.stage` |
| `processing` | `tx.stage` |
| `access-success` | `tx.stage` |
| `payment-failed` | `tx.stage` |
| `entitled` | Derived from `S.access` |
| `pending` (indeterminate) | `tx.stage` — required by FRD 9.1.x |
| `some` (bundle partly held) | Derived |
| `justAdded` | Derived, consumed once |
| `signedIn` | Learner flag |

**Six required, one source-added, three derived.**

---

## 6. Coverage against the brief

| Area | Covered by |
|---|---|
| B2C-01 Catalogue / Explore | `B2C-01` — search, discipline, delivery type, module/bundle, mixed access states |
| B2C-02 Search / filter result | `B2C-01` states 2–4, including no-results and reset |
| B2C-03 Module detail | `B2C-02` |
| B2C-04 Bundle detail | `B2C-03` — Bundle is confirmed by FRD 6.1.2 |
| B2C-05 Already entitled | `B2C-02`/`B2C-03` held states **and** the route guard |
| B2C-06 Access / checkout | `B2C-04` — provider-neutral payment step, no method chooser |
| Payment states | `B2C-05` + `B2C-06` — four, including the source-supported indeterminate |
| Success → entitlement | `settleTransaction()` → `S.access`, recomputed everywhere |
| My Learning handoff | `LRN-02` + `LRN-04b` |
| Login / account context | `AUTH-B2C` — minimal handoff only |
| B2B vs B2C convergence | The two-routes figure on the prototype index |
