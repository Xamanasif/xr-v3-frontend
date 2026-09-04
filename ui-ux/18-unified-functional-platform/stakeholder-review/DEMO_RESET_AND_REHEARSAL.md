# Demo Reset and Rehearsal Runbook — Safari

| | |
|---|---|
| **Browser** | **Safari** on macOS |
| **URL** | <http://localhost:8731/> |
| **Build** | `ui-ux/18-unified-functional-platform/` |
| **State** | `localStorage`, key **`xrslp-unified-v1`**, `schemaVersion 8` |
| **Companion** | Run this alongside **`STAKEHOLDER_DEMO_SCRIPT.md`** — the segment numbers match |
| **Verified** | Every step below was executed in the running build |

---

## 1 · Start the local server

The prototype is static files with no build step and no backend. Any static server works.

```bash
cd /Users/mymac/Desktop/AR-VR/ui-ux/18-unified-functional-platform && python3 -m http.server 8731
```

Leave that terminal window open for the whole meeting — closing it stops the server.

Then confirm it is serving before you open Safari:

```bash
curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost:8731/
```

You want **`HTTP 200`**. Then open <http://localhost:8731/> in Safari.

**Port already in use?** Something else is on 8731:

```bash
lsof -nP -iTCP:8731 -sTCP:LISTEN
```

Either stop that process, or serve on another port and use that URL throughout.

**To stop the server after the meeting:** `Ctrl-C` in that terminal window.

> **`file://` also works** — you can open `index.html` directly, since all assets are local and the
> scripts are classic (non-module) scripts. **Use the server anyway.** It is the closer match to how
> anyone else will see it, and it keeps the URL in the address bar something you can read aloud.

---

## 2 · Reloading in Safari — read this carefully

| What you want | Do this |
|---|---|
| **Normal reload** — re-run the page, **keep** the prototype data | **⌘R** (Command-R), or *View → Reload Page* |
| **Reload ignoring the cache** — after editing a CSS or JS file | **⌥⌘R** (Option-Command-R), or *View → Reload Page From Origin* |
| **Discard the prototype data and return to the seed** | The in-page **Reset prototype data** button — **§4** |

> ### ⚠️ Do not press ⇧⌘R (Shift-Command-R) in Safari.
>
> **It is not a hard refresh.** In Safari, ⇧⌘R **toggles Reader** — it will replace the page with a
> stripped-down article view, mid-demo, in front of the stakeholder. There is nothing broken if it
> happens: press ⇧⌘R again, or click the Reader icon in the address bar, to come back.
>
> Safari's "reload ignoring cache" is **⌥⌘R** — *Reload Page From Origin*.

### ⌘R does NOT reset the demo

Worth being certain about, because it changes how you recover from a mistake. Prototype state lives
in `localStorage`, so it **survives**:

- a normal reload (⌘R)
- a reload from origin (⌥⌘R)
- closing and reopening the tab
- quitting and reopening Safari
- restarting the server

**Only the *Reset prototype data* button discards data.** So during a demo, ⌘R is completely safe —
if a screen looks wrong or stale, reload first. It re-renders from the same state and loses nothing.

> **One place to be careful.** A draft produced by *Draft questions with assistance* is held on the
> screen, not in state, deliberately — so an unreviewed draft cannot persist as something that looks
> reviewed. A reload discards those drafts. Nothing else in the build behaves this way.

---

## 3 · Where the demo state lives, and how to check it

`localStorage` is **per browser**. Safari and the Chrome you rehearsed in do **not** share state.
Rehearse in Safari and demo in Safari.

To confirm you are on a clean seed without clicking anything, open the Web Inspector console
(*Develop → Show JavaScript Console*, or ⌥⌘C — enable the Develop menu in
*Safari → Settings → Advanced* first) and run:

```js
[XRSLP.state.requests().length, XRSLP.state.tenants().length, XRSLP.state.contentVersions().length]
```

A clean seed returns **`[0, 1, 0]`** — no requests, one institution, no version candidates.

> Close the Web Inspector before the meeting starts.

---

## 4 · Resetting — when, and exactly what happens

**Click *Reset prototype data* (top-right of the dark prototype strip) exactly twice:**

1. **Once at the end of your rehearsal**, so the build is sitting on a clean seed overnight.
2. **Once immediately before the stakeholder walks in.**

**Do not reset during the demo.** Every segment of the script depends on state the previous one
created.

**What the control does**

| | |
|---|---|
| Button | **Reset prototype data** |
| Dialog title | **Reset prototype data?** |
| Buttons | **Cancel** · **Reset data** |
| After confirming | Navigates to the public landing page (`#/`) · toast **"Prototype data reset to seed state."** |

**What reset clears:** the selection, all requests, every institution created by an approval and
every tenant access record, tenant people/groups/mappings/assignments back to the seed set, the
Question Bank and assessment configuration back to the seeded samples, **every** student learning
record (resources opened, simulations run, assessment attempts, faculty reviews), the content pool
back to the seeded published catalogue plus the four sample in-flight submissions, every governance
record (tenant activation and history, Tenant Admin assignments, platform role assignments, version
candidates with their Release/Hold decisions, device transfer requests, support reports), and the
requester scenario back to **A**.

**Nothing survives a reset.** It is the only action in the whole build that discards data — loading
state written by an earlier build upgrades it in place instead.

### What exists immediately after a reset

Know this cold — it is what stops you opening an empty screen by accident.

| | After reset |
|---|---|
| Institutions | **1** — Sample Engineering Institute, Tenant Admin **Priya Raghavan** |
| Its access records | **0** — it holds nothing until you approve a request |
| Its people | 2 Faculty (**Dr. Arjun Mehta**, **Dr. Sneha Iyer**) · 6 students · 2 groups |
| Student entitlements | **0 for every student** |
| Faculty mappings | **0** |
| Requests | **0** — `REQ-001` does not exist until you submit it |
| Published catalogue | **6** experiments |
| In-flight content | `EXP-007` Draft · **`EXP-008` Academic review** · **`EXP-009` Content readiness review** · `EXP-010` Changes requested |
| Version candidates awaiting Release/Hold | **0** |
| Device requests · support reports | **0** · **0** |
| Faculty review queue | **empty** |
| Requester scenario | **A — Internal institution (WILP-type)** |

**Consequences for the script.** Parts 2–7 build their own state live — that is the demo. Part 8
uses the pre-seeded `EXP-008` and `EXP-009`, so the publication chain needs no authoring. Part 8's
**later-version** half has no seeded candidate: either explain it (recommended) or create one, per
the optional segment in the script.

---

## 5 · The deterministic sequence after reset

Follow this in order. Nothing here depends on timing, and every id is deterministic.

| # | Role · scenario | Do exactly this | State it leaves |
|---|---|---|---|
| **0** | — | **Reset prototype data → Reset data** | Clean seed, landing page |
| **1** | Public | Catalogue → Civil Engineering → Soil Mechanics → **Direct Shear Test** | — |
| **2** | Public · **scenario A** | On Direct Shear tick **Web + VR + AR** → **Add to selection**. Catalogue → Soil Mechanics → **Consolidation Test** → tick **Web + VR** → **Add to selection** | Selection: 2 experiments · 5 technology selections |
| **3** | Public | **Selection → Prepare institutional request** → licences **40** → term **Yearly** → **Submit institutional request** | **`REQ-001`** · Submitted |
| **4** | Super Admin | Access requests → **REQ-001** → press **Approve request** with the reason empty | Refusal shown; nothing written |
| **5** | Super Admin | Untick **AR** under Direct Shear · quantity **40 → 30** · term **Yearly → Quarterly** · type a reason · **Approve request → Approve** | `REQ-001` **ACTIVE** · access **ACC-001** · 0 students entitled |
| **6** | Public · **scenario B** | Switch scenario to **B**. Catalogue → Surveying → **Total Station Experiment** → tick **Web + AR** → **Add to selection** → **Selection → Prepare institutional request** → **25** licences → **Yearly** → submit | **`REQ-002`** · Submitted |
| **7** | Super Admin | Access requests → **REQ-002** → reason → **Approve request → Approve** (change nothing) | `APPROVED_PAYMENT_REQUIRED` · **Northfield institution created** · **no** access record |
| **8** | Super Admin | **Institutions** → note *2 tenants · 1 awaiting payment*, *None yet*, *Awaiting payment* → open **Northfield Institute of Technology** | Report shows every figure at zero |
| **9** | Public | **Requests → REQ-002** (or `#/payment/REQ-002`) → **Payment declined** | Recorded · **nothing written** |
| **10** | Public | **Payment successful** | `REQ-002` **ACTIVE** · access **ACC-002** · still exactly 2 institutions |
| **11** | Tenant Admin | Prototype strip → **Tenant Admin** → **Overview** (read the attention row) → **Content access** → **ACC-001** | Approved 30 · Assigned 0 · Remaining 30 · Direct Shear shows **Web VR only** |
| **12** | Tenant Admin | **Assign an experiment** → ACC-001 → **Direct Shear Test** → tick **Rahul Verma** → **Create assignment** | Assigned 1 · Remaining 29 |
| **13** | Tenant Admin | **Assignments → New assignment** → ACC-001 → **Consolidation Test** → **Rahul Verma** → **Create assignment** | Still **Assigned 1 · Remaining 29** ← the licence proof |
| **14** | Tenant Admin | **Faculty mapping** → **Dr. Arjun Mehta** → **ACC-001** → **Soil Mechanics** → leave *Whole course context* → **Map Faculty** | Toast: *"No student licence was consumed."* |
| **15** | Faculty | Prototype strip → **Faculty** → **Dr. Arjun Mehta** → **My Content** → **Question Bank** → **Assessments** → **Reviews** (empty) → **Student Progress** | 2 mapped experiments · 1 student reached |
| **16** | Student | Prototype strip → **Student** → **Rahul Verma** → **My Learning** → **Direct Shear Test** | 2 experiments, each Web + VR |
| **17** | Student | Simulation → **Web** → **Open the simulation** → **Open the Web simulation** | Web simulation opened and recorded |
| **18** | Student | **My Learning → Consolidation Test → Go to the assessment → Start the assessment** → answer Q1–Q3, type 2 sentences into Q4 → **Submit assessment → Submit** | Result **Pending Faculty review** · marks withheld |
| **19** | Faculty | Prototype strip → **Faculty** → **Reviews** → **Review (Rahul Verma)** → marks **out of 3** → **Confirm review** | Review complete · result evaluated, still withheld until the deadline |
| **20** | Student | Prototype strip → **Student** → **Progress** | Per-technology and rolled-up progress |
| **21** | Vendor | Prototype strip → **Vendor** → **Ananya Rao** → **Submissions** | 3 records; `EXP-008` with the reviewer |
| **22** | Academic Reviewer | Prototype strip → **Academic Reviewer** → **Dr. R. Iyer** → **Queue** → **Differential Levelling Exercise (sample)** → type one outcome → **Add outcome** → **Approve academically → Approve academically** | `EXP-008` → **Content readiness review** |
| **23** | Content Manager | Prototype strip → **Content Manager** → **M. Kulkarni** → **Queue** → the same record → **Publish** → **Publish** | `EXP-008` **Published** · **no** access, licence or entitlement changed anywhere |
| **24** | Super Admin | **Content governance** | Release/Hold list empty + the Publish-vs-Release statement |
| **25** | Super Admin | **Operations** → Access record **ACC-001** → Ends in **15 days (reminder due)** → **Move the end date** | Reminder due-state visible · *DELIVERY CHANNEL PENDING* note |

**Total: 25 steps.** In rehearsal this runs in **12–14 minutes** of clicking; the script's 17 minutes
is that plus the talking.

### Optional — the later version (after step 25, +3 min)

**Vendor → Ananya Rao → Versions → Propose a version** on *Direct Shear Test* → label **`1.1`** →
describe what changed → **Save the version** → **Submit for academic review → Submit for review** →
**Academic Reviewer → Dr. R. Iyer → Queue →** the version → **Approve version → Approve version** →
**Super Admin → Content governance →** open **Direct Shear Test** → **Release version → Release
version**.

Verified working. The release dialog states that it grants no tenant anything.

---

## 6 · The exact actors and scenarios to use

Use these. Do not improvise a different student or a different experiment — several are
deliberately empty or deliberately awkward, for reasons that are useful in a design review and
unhelpful on stage.

| Use | Not |
|---|---|
| Student **Rahul Verma** (`SEI/CE/2023/0142`) — the only student you assign anything to | Any of the other five students — **all start with zero entitlement** and stay that way. Their empty state is correct and honest, and it is a dull thing to land on by accident |
| Faculty **Dr. Arjun Mehta** (`SEI/FAC/0031`) — the one you map | Faculty **Dr. Sneha Iyer** — unmapped by design, so her workspace is empty |
| Tenant Admin **Priya Raghavan** | Northfield has **no** Tenant Admin and **no** people — do not open its Tenant Admin workspace expecting content |
| **Direct Shear Test** — Web/VR/AR · 5 resources · 5 objective questions · **results shown immediately** | *Beam Deflection*, *Torsion Test*, *Bernoulli's* — no assessment configured, so the assessment step is legitimately absent |
| **Consolidation Test** — the only assessment with a **written answer**, so the only route to a Faculty review | Don't expect a written answer from Direct Shear — it has none |
| **Total Station Experiment** — for the external request | — |
| **`EXP-008`** at the academic gate · **`EXP-009`** at the readiness gate | `EXP-007` (Draft — nobody is waiting on it) · `EXP-010` (Changes requested — belongs to a different Vendor and Reviewer) |
| Vendor **Ananya Rao** · Reviewer **Dr. R. Iyer** · Manager **M. Kulkarni** | Vendor **K. Menon** and Reviewer **Dr. S. Nandakumar** — they hold only `EXP-010` |
| Scenario **A** for Parts 2–3 · scenario **B** for Part 4 | Reversing them — the internal route has **no payment screen at all**, so scenario A cannot demonstrate Part 4 |

> **`EXP-009` is your spare.** It sits at the publication gate already. If step 22 goes wrong, skip
> to `EXP-009` and publish that instead — Part 8 still lands.

---

## 7 · What not to click during the demo

### Never — these cannot be undone without a full reset

| Control | Where | Why |
|---|---|---|
| **Reset prototype data** | Prototype strip, every screen | Destroys the entire demo. The only data-discarding action in the build. It **does** ask for confirmation — click **Cancel** |
| **Confirm review** *(a second time, or early)* | Faculty → a review | A confirmed review is **read-only and cannot be reopened**. Confirm exactly one, at step 19 |
| **Publish** *(on the wrong record)* | Content Manager | **There is no unpublish or withdraw anywhere.** A record published by accident stays published |
| **Release version** / **Hold** *(on the wrong candidate)* | Super Admin → Content governance | **There is no rollback** to a previously released version |
| **Submit assessment** *(early or twice)* | Student → an attempt | Answers cannot be changed after submitting, and the attempt is consumed. Direct Shear allows 3, Consolidation 2 |
| **Payment successful** *(before you have shown the awaiting-payment state)* | Payment screen | Activates immediately. You lose the single most important screen in Part 4 |
| **Delete** *(a question)* | Faculty → Question Bank | The item leaves the active bank and nothing surfaces it again — no archive, no bin, no restore |

### Avoid — recoverable, but it will derail the story

| Control | Where | Why |
|---|---|---|
| **Request more information** | Super Admin → request detail | Sends `REQ-001` back to the applicant and **blocks approval** until they resubmit. Mention that it exists; don't click it |
| **Withdraw scope** | Super Admin → Role governance | Withdraws a content actor's authority and freezes their records — it will break Part 8 |
| **Deactivate** *(institution or student)* | Super Admin → institution report · Tenant Admin → person | Reversible, but it zeroes entitlement and changes several screens at once. Only click it if you are deliberately demonstrating it |
| **Remove** *(a Faculty mapping)* | Tenant Admin → Faculty mapping | After step 18 this strands the pending review — the dialog will warn you, correctly. It is a good demo of the warning and a bad accident |
| **Ends in → "already ended (expired)"** | Super Admin → Operations | Expires the access record and **zeroes entitlement derived from it** — the Student workspace empties out. Use **15 days (reminder due)** instead. Recoverable by moving the date back |
| **The "— choose a … —" option** in any *Viewing as* selector | Prototype strip | Clears the selection and navigates you to the chooser screen. Harmless, but you lose your place |
| **Changing the Requester scenario mid-request** | Prototype strip | Re-seeds the institution, SPOC and access context. Only change it at step 6, before building the second selection |

### One ordering trap

`#/request` renders the **Selection** screen if the selection is empty. It is not a bug — you cannot
prepare a request for nothing. Always add to the selection **before** clicking *Prepare institutional
request*.

---

## 8 · Pre-meeting smoke checklist

**Do this 15 minutes before, not 2.** Budget 5 minutes.

**Environment**

- [ ] Server running: `curl` returns **HTTP 200** on <http://localhost:8731/>
- [ ] The terminal running the server is open and will not be closed
- [ ] **Safari** is the browser, and the landing page loads with the platform logo
- [ ] Web Inspector **closed**; Reader **not** active
- [ ] Zoom at 100% (**⌘0**), window large enough that the prototype strip does not wrap awkwardly
- [ ] Notifications silenced · screen sharing tested · Do Not Disturb on

**Optional but reassuring — the automated suite** (needs nothing but macOS; writes no files):

```bash
cd /Users/mymac/Desktop/AR-VR/ui-ux/18-unified-functional-platform && /System/Library/Frameworks/JavaScriptCore.framework/Versions/A/Helpers/jsc qa/harness.js qa/checks.js | tail -4
```

- [ ] Prints **`ALL CHECKS PASSED — 685 assertions`**

**Clean state**

- [ ] **Reset prototype data → Reset data** · toast *"Prototype data reset to seed state."*
- [ ] Console check returns **`[0, 1, 0]`** (§3), or trust the reset
- [ ] Requester scenario shows **A — Internal institution (WILP-type) (BITS Community)**

**60-second route spot-check** — click each and confirm a heading renders (this touches nothing):

- [ ] `#/catalogue` → **Catalogue**
- [ ] Direct Shear Test → the technology and learning-outcome cards
- [ ] **Super Admin → Access requests** → *"No requests"* empty state
- [ ] **Super Admin → Institutions** → *1 tenant on the platform* · Sample Engineering Institute · Priya Raghavan · access records **`0 of 0 live`** *(correct — the seeded institution holds nothing until you approve `REQ-001`)*
- [ ] **Super Admin → Operations** → *No device requests* · *No issues reported* · *No access term needs attention*, and **no expiry control is shown** *(correct — the prototype-only date control appears only once an access record exists, i.e. after step 5)*. The **DELIVERY CHANNEL PENDING** note is visible even now
- [ ] **Tenant Admin** → Overview renders for Sample Engineering Institute
- [ ] **Faculty** → chooser lists Dr. Arjun Mehta and Dr. Sneha Iyer
- [ ] **Student** → chooser lists all six students
- [ ] **Academic Reviewer → Dr. R. Iyer → Queue** → `EXP-008` present
- [ ] **Content Manager → M. Kulkarni → Queue** → `EXP-009` present
- [ ] Return to `#/catalogue` and leave it there

**Materials**

- [ ] `STAKEHOLDER_DEMO_SCRIPT.md` open on a second screen or printed
- [ ] `STAKEHOLDER_REVIEW_CHECKLIST.md` ready to write in
- [ ] `OPEN_DECISIONS_FOR_STAKEHOLDER.md` ready, **D1–D7** flagged
- [ ] Somewhere to capture visual feedback without breaking the flow

---

## 9 · Recovery — if something goes wrong mid-demo

**Stay calm and keep narrating.** This is a functional prototype under review; a wrong click is not
a failure of the product. Say what you meant to do, recover, and carry on.

### The screen looks wrong, stale or half-rendered

Press **⌘R**. It re-renders from the same state and **loses nothing**. This fixes most cosmetic
oddities.
*(Not ⇧⌘R — that is Reader. See §2.)*

### You accidentally pressed ⇧⌘R and Safari went into Reader

Press **⇧⌘R** again, or click the Reader icon in the address bar. No state is affected.

### You clicked *Request more information* on `REQ-001`

You cannot approve it until the applicant replies — and you can do that:
**Public → Requests → REQ-001** → the applicant's screen shows the reason you gave → **resubmit**
with a note → back to **Super Admin → Access requests → REQ-001** → approve as planned.
Roughly 40 seconds, and it demonstrates the round trip you were going to describe anyway.
**Turn it into the feature.**

### You approved `REQ-001` without narrowing it

Do not try to undo it. Say:

> "I approved that exactly as asked — which is the normal case. Let me show you the narrowing on the
> external one instead."

Then narrow **`REQ-002`** at step 7 (drop **AR** from Total Station, reduce **25 → 20**). The
narrowing story lands identically; Part 5's *"look, no AR"* callback moves to Northfield.

### You clicked *Payment successful* before showing the awaiting-payment state

The state is gone for `REQ-002`, but the **institution report still tells the story**:
**Super Admin → Institutions → Northfield → Origin: *Created from approved request REQ-002***.
Say what the intermediate state was and move on. Do **not** reset to retry — you would lose
`REQ-001` and everything after it.

### You published or released the wrong record

There is no unpublish and no rollback — and that is a real, honest property of the build worth
saying out loud:

> "And that shows you something real: there is no unpublish in this build, deliberately. Withdrawing
> published content is not a capability any source asked for, so we did not invent one — which is
> exactly the kind of thing I want you to tell me if it is wrong."

Then continue with the spare record.

### A student's workspace is empty

You are almost certainly viewing the wrong student. Check the **Viewing as student** selector reads
**Rahul Verma** — he is the only one with an assignment. If it is right and the workspace is still
empty, step 12 or 13 did not commit: go back to **Tenant Admin → Assignments** and confirm the
assignment exists.

### The Faculty review queue is empty when you expect a response

Step 18 has not completed. The written answer only exists after **Submit assessment → Submit** on
**Consolidation Test** (not Direct Shear — it has no written question), and only reaches
**Dr. Arjun Mehta** because of the step-14 mapping.

### The Student workspace suddenly empties out

You most likely set an access record's **Ends in** to *"already ended (expired)"* on the Operations
screen. Entitlement from an expired record stops being effective — correctly. **Recover by moving
the date back:** Operations → the same record → **16 days (not due)** → **Move the end date**.
Nothing was deleted.

### You truly need to start over

Only if the state is unusable. **Reset prototype data → Reset data**, then run §5 steps 1–5 —
about 90 seconds gets you back to an active institution with a narrowed grant, which is enough to
resume from Part 5. Say plainly that you are resetting the sample data and why.

### The server has stopped and every page 404s

Restart it (§1) and press **⌘R**. **Your prototype state survives** — it is in the browser, not the
server. You lose nothing.

---

## 10 · After the meeting

- [ ] Transfer every note from the checklist into a durable document **the same day** — the value is in the stakeholder's own wording, and that fades fast
- [ ] Split the changes into **business-rule** and **presentation** (the checklist close-out has the split)
- [ ] **Reset prototype data** so the build is on a clean seed for the next viewer
- [ ] `Ctrl-C` the server
- [ ] Confirm the repository is still clean: `git status` in `/Users/mymac/Desktop/AR-VR` — nothing in this runbook writes to the repository, and running the demo changes only browser storage
