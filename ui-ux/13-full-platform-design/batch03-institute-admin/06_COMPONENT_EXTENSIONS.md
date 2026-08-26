# Batch 03 — Component Extensions

Batch 03 reuses the Batch-01 component system wherever one exists (its stylesheet is consumed as a verbatim, byte-identical snapshot — `prototype/batch01-design-system.css` — so the prototype loads from `file://` in Safari; **Batch 01 remains the source of truth and is not modified**). This file lists only what institutional administration **adds**.

Format: Purpose · States · Accessibility · Origin (♻ reused Batch-01 · ♻✎ reused with modification · ★ new in Batch 03).

---

## Reused unchanged (♻ — no respecification)

Application shell · side navigation · header · breadcrumb · page header · buttons (primary / secondary / ghost / icon, all sizes and the `busy` state) · text, textarea and select fields · form validation grammar (inline error + `aria-invalid`) · search and filter listbar · table · status badge families · alert (info / success / warning / danger) · toast · confirmation dialog · empty state · loading spinner and progress bar · stepper (`.stepper` / `.step`) · key–value metadata grid (`.kv`) · row emphasis for rows needing attention (`.row-returned`) · `sample-tag` · `proto-note` · prototype navigation strip · index page furniture.

## Extended (♻✎)

| Component | Extension |
|---|---|
| **Status Badge** | New institutional sets, on the existing icon + text + colour pattern, never colour alone. **Account:** `Active` (success) · `Awaiting first sign-in` (neutral) · `Needs attention` (warning). **Content access:** `Active` (success) · `Not yet reaching learners` (warning). **Connection:** `Connected` (success) · `Not connected` (neutral) · `On` (success) · `Needs setup` (warning). |
| **Stepper** | Reused verbatim for the single sign-on setup sequence (add details → check → turn on). The `returned` node state carries the **connection check did not succeed** case; every node also states its status in words (`Done` / `Next` / `Did not succeed` / `Not started`). |
| **Table** | Two new row shapes — the people directory row (name + institutional ID, role, academic context, account, source) and the content access row (record + covered content, count, status, reaches, effective from). No new table behaviour; sorting and bulk actions remain unbuilt. |
| **Empty State** | Per-surface copy for six distinct emptiness causes: no people yet · no search match (people) · no content access recorded · no search match (content access) · no members in a population · no eligible learners. |
| **`[hidden]` restoration** | The Batch-01 sheet gives `.ferr` an author `display:flex`, which outranks the UA rule behind the `hidden` attribute, so inline field errors would render permanently. Batch 03 restores `hidden` in its own sheet rather than editing the Batch-01 sheet. |

## New (★)

| Component | Purpose · key states · accessibility |
|---|---|
| **Operational Status Card** (`.opscard`, `.opsgrid`) | The Overview's four facts. One label, one value, one consequence line, one link. States: normal / needs-attention (`.attn`, warning tint **plus** wording that says what is wrong). Deliberately incapable of holding a chart — there is no slot for one. |
| **Attention List** (`.attnlist`, `.attn-item`) | The Overview work list: chip + what is wrong + why it matters + the control that resolves it. States: warning / informational / an all-clear row that says explicitly what was checked. Each item is a real state of the institution, never a placeholder. |
| **Connection Status Block** (`.constat`) | The single-sign-on and institution-data headline: state node + title + explanation + the next action, in one row. States: neutral / ok / warn / bad / busy (spinner in the node). Every state's meaning is in the title text, not the node colour. |
| **Setup Card** (`.setupcard`, `.setupgrid`) | Institution Setup landing: one card per connection — what it does, its status badge, its current state in words, and the way in. |
| **Provenance Chip** (`.srcchip`, `.srcnone`) | Where a record came from — `From institution data`, or a plain `—` where the platform cannot state an origin. Carries an `aria-label` on the dash so a screen reader hears "Not recorded" rather than a bare dash. |
| **Covered Content List** (`.covers`) | What an access record covers: format-appropriate icon, title, XR format badge, device line. Reused for the person-level access summary, where each row also names the relationship that produced it. |
| **Eligibility List** (`.elig`) | Who an access record reaches: population-type icon, name (linked to that population), type + date added, learners reached, remove control. The remove button carries a full `aria-label` naming the population. |
| **Reach Flow** (`.reachflow`) | Four cells — content access → reaches → eligible learners → in their learning — that make the handoff legible at a glance. States: complete / pending (pending cells read "No one yet", "None", "Not visible" in words, and are also warning-coloured). |
| **Mapping Row** (`.maplist`, `.maprow`, `.reachpill`) | The two-direction access map: one side names the object, the other lists what reaches it as linked pills, or states the gap in words (`.mp-none`). |
| **Issue Card** (`.issuelist`, `.issue`) | One record-level exception: title, affected record count, **what happened**, then a separately-boxed **what to do next**, the people affected, and the retry control. States: open (warning) / resolved (success, with the retry path removed rather than disabled). |
| **Run List** (`.runlist`) | Recent institution-data runs: timestamp, outcome in words, note. The status dot is decorative — the outcome is always written out. |
| **Update Summary** (`.updrow`) | What the last run changed: four plain counts with word labels. Not a chart, not a percentage, not a trend. |
| **Learner Access Card** (`.entgrid`, `.entcard`) | The verification view's content card: title, format badge, device line, and the access line *"Included in your institution's access"*. **No action control** — opening an experiment is Batch-01 territory, and a non-functional control is never drawn. |
| **Chip Filter** (`.chipfilter`) | The people role filter as real links with `aria-current="true"` and a count per option. |
| **Rail Key–Value** (`.railkv`) | The compact label/value list used inside narrow rail cards, where the Batch-01 `.kv` grid is too wide. |
| **Population Picker** (`.pickgroup`) | The Add-eligibility dialog's choice of academic stream / group / individual learner: real radios inside labels, each with a consequence line, driving a dependent select. |
| **Tab Navigation** (`.tabnav`) | Institution Setup sections as sub-routes styled as tabs — real links, so keyboard and browser-back work. A needs-attention dot is accompanied by `sr-only` text, never colour alone. Same pattern Batch 02 uses; defined locally so Batch 03 loads no other batch's sheet. |
| **Mini Label** (`.minilabel`), **Subtle Note** (`.subtle-note`), **Inline Icon** (`.inline-ic`) | Small typographic utilities the Batch-01 sheet does not carry. |

---

## Deliberately not built

| Not built | Why |
|---|---|
| Charts, gauges, sparklines, trend lines, utilisation bars | PM-11 — operational status only; dashboards are a later phase |
| A seat or capacity meter | The seat model is an open question (`DA-08`) |
| Any purchase, pricing, checkout, invoice or renewal component | Task brief §7; the acquisition route is open |
| An audit/history timeline for access, eligibility or configuration changes | The audit trail outside content governance is undefined (`DA-10`) — the Batch-01 timeline component exists and would drop straight in if it is ever defined |
| Bulk selection and bulk actions on people or access records | No flow needs them, and the assignment authority is unresolved |
| Sortable table headers, saved views, column configuration | Out of scope for the batch's questions |
| A course or academic-structure editor | Course creation is a later phase |
| A device or XR administration component | Device registration and remote control are a later phase |
| Any assessment component | Assessment authority for this role is explicitly not granted |
| Notification centre, dark theme, mobile navigation | No Phase-1 requirement; desktop-first scope carried from Batch 01 |
