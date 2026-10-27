# XR Learning Platform V3: hands-on test guide

| Item     | Value                                                                                                                                                                                                                                                                    |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| For      | The owner, testing by hand in Google Chrome                                                                                                                                                                                                                              |
| Build    | Commit **`4ff9b8c`** (branch `v3/refined-b-ui`): the accepted V1 premium landing plus the two Phase-2 P0 corrections                                                                                                                                                     |
| Address  | **http://localhost:3363/** (always type `localhost`, never `127.0.0.1`, which is a different, separate world)                                                                                                                                                            |
| Folder   | `/Users/mymac/Desktop/XR-V3-hands-on-test/`                                                                                                                                                                                                                              |
| Verified | 24 Oct 2026, read-only, by driving **only** `http://localhost:3363` from fresh Playwright contexts (headless Chromium, 1440×900 and 375×812). Every step below was run in order on **one** clean world. Every value and on-screen word quoted below comes from that run. |
| Evidence | `/Users/mymac/Desktop/XR-V3-hands-on-test/evidence/hands-on-run/` (`shots/001…064-*.png`, `out/out-1…30.txt`, `out/reload-check.txt`, the driver in `driver/`)                                                                                                           |
| Based on | `CLEAN-WORLD-PLAN.md` (same folder as this guide), which was made on the build before the fixes. This guide replaces its "today / after the fix" notes with what 4ff9b8c actually does.                                                                                  |

---

## 0. Result of the verification on 3363 (read this first)

- **All 22 steps (0–21) pass, in order, on one clean world.** No step needs a workaround any more.
- **Correction 1, request recovery: PASS.** The visitor's status page survived each of these:
  - a reload while **Submitted**;
  - a typed address;
  - navigating away and coming back through **Your selection**;
  - Back and Forward;
  - a reload after the **External approval**;
  - closing the tab and opening a new one in the same browser.

  **Your selection** shows "You have a request in progress for Konkan College of Engineering. **Check request status**". Payment then completed. The end state has **one** request (REQ-0042) and **one** institution (Konkan). A different browser cannot recover the request, and **Reset demo data** clears the kept ticket.

- **Correction 2, assessment shapes: PASS.** Rohan's results:

  | Shape           | What Faculty sees and does                                                                                       | Rohan's result                               |
  | --------------- | ---------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
  | **Choice-only** | It is in Marking as "Marked automatically · confirm the marks". Faculty confirms it.                             | 3 of 3                                       |
  | **Two written** | One mark block per written answer. **Confirm marks** is refused until both marks are saved, then confirmed once. | 9 of 10                                      |
  | **One written** | As before                                                                                                        | 4 of 10, then a second attempt gives 9 of 10 |
  | **Mixed**       | As before                                                                                                        | 10 of 12                                     |

  Each result was released as its setting said. A separate check also verified **After the deadline** and **On a date**.

- **Landing at `/`: PASS at 1440 and 375.**
  - The three hero scenes rotate about every 7.6 s.
  - **Pause motion** stops the rotation, and **Play motion** restarts it.
  - **Sign in** goes to `/sign-in`, and **Browse the catalogue** goes to `/experiments` (12 experiments).
  - **Request institutional access** goes to **Your selection**.
  - There is no horizontal scroll at 375.
- **Console errors: 0** in every context. **0** requests went to any other port.
- **No new defect was found in the corrected scope.** Section 10 lists minor observations (O-1…O-6). None of them blocks the test.

---

## 1. Purpose

This is a hands-on test of the whole platform, starting from an empty sample world. **Only the Super Admin is seeded.** You create everything else through the real screens:

- the engineering area, course and course code;
- the Vendor, Reviewer and Content Manager;
- the experiment, through review and publication;
- the institution request, approval and payment;
- the Institute Admin, Faculty, Student and their access;
- the WEB activity, four assessments, marking, results and progress;
- a post-publication correction.

The run also confirms the two P0 corrections in commit `4ff9b8c`:

1. **Same-browser payment request recovery.** The visitor's own request ticket survives a reload, navigating away, or closing the tab. "Your selection" leads back to the request. Another browser cannot recover it, and Reset clears it.
2. **Every assessment shape can be marked and released.** That covers choice-only, one written answer, mixed, and two or more written answers.

---

## 2. The build: start, stop, check

| Action     | How                                                                                                                                                                                                                            |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Start      | In Terminal: `/Users/mymac/Desktop/XR-V3-hands-on-test/start-hands-on.sh`. It prints `Hands-on test build: http://localhost:3363/  (HTTP 200)`. If it says "Port 3363 is already in use (already running?)", it is already up. |
| Check      | Open http://localhost:3363/ and look for the premium landing: "Set the conditions. See what follows. Understand why."                                                                                                          |
| Stop       | `/Users/mymac/Desktop/XR-V3-hands-on-test/stop-hands-on.sh`. It stops only what listens on port 3363.                                                                                                                          |
| Server log | `/Users/mymac/Desktop/XR-V3-hands-on-test/hands-on-3363.log`                                                                                                                                                                   |

Stopping or restarting the server **does not** reset your test world. The world lives in the test browser profile, not on the server.
The build serves only 3363. It never uses 3300/3330/3360/3361/3362. Your other builds and their worlds stay untouched.

---

## 3. Use the dedicated Chrome profile (important)

**Open the test browser** with:

```
/Users/mymac/Desktop/XR-V3-hands-on-test/open-test-chrome.sh
```

This opens Chrome with its **own profile**, `~/XR-V3-hands-on-chrome-profile`, at http://localhost:3363/. The window has none of your everyday bookmarks or extensions. That is how you tell it apart.

**Why a dedicated profile.** The sample world is not on the server. It is kept in the browser's storage, **per Chrome profile and per address** (scheme + host + port).

- Your everyday Chrome has its own worlds, including the existing **Godavari test world** on other addresses. A **reset** there would destroy it.
- The dedicated profile keeps the hands-on world separate from your everyday Chrome and from those worlds. You can then reset 3363 freely.
- **Never open `/prototype/reset` on any other address.** Only use `http://localhost:3363/prototype/reset`, and only in this profile.

**Rules of the world (all verified on 3363):**

| Rule                                              | What it means for you                                                                                                                                                                                                                                                                                                                                                            |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Use one window. Tabs share the world.**         | Every tab of this profile on `localhost:3363` sees the same records, **live**. In the run, open tabs updated with no reload: the visitor's status page changed after approval and after payment, Rohan's Home showed new access as soon as it was given, and the SA institution page turned "Access active" after payment.                                                       |
| **Sessions are per tab.**                         | Two people can be signed in at once, one per tab, for example Student in one tab and staff in another. Signing out in one tab does not affect the others. There is no role switcher: to change person in a tab, use **Sign out** (account menu, top right) and sign in again.                                                                                                    |
| **A reload signs that tab out.**                  | A reload, a typed address or a new tab signs **that tab** out. It goes to `/sign-in?returnTo=<page>`, and after sign-in it returns there. The world is kept, and other tabs stay signed in. Inside a signed-in tab, move **with the app's links** (the browser Back button is fine). The visitor's request status page is the exception: it now survives reloads (Correction 1). |
| **Selection is per tab.**                         | "Your selection" belongs to the tab that built it. It survives a reload of that tab.                                                                                                                                                                                                                                                                                             |
| **Sample clock**                                  | Each reset starts the world at **2 Oct 2026, 10:00**, and the clock then runs in real time. So "14 Nov 2026, 23:59" reads "43 days left".                                                                                                                                                                                                                                        |
| **Incognito or another browser = another world.** | It starts as a fresh seed world and shares nothing with this profile. Step 11, try T7, uses this on purpose.                                                                                                                                                                                                                                                                     |

**Recommended tabs, all in the one test window:**

- **[V] Visitor.** Never signs in. It builds the selection and sends the request. Send the request from [V]: the build keeps a request ticket only for a signed-out visitor.
- **[S] Staff.** Each staff person signs in and out here in turn.
- **[L] Learner.** Rohan signs in at step 13 and stays signed in. This tab is optional, but it shows the live updates.

---

## 4. Clean-world start (step 0 of the run)

1. In the test window, tab [V], type `http://localhost:3363/prototype/reset`.
2. Press **Reset demo data**. A dialog opens: "Reset demo data?", listing "Every record returns to its starting state · Everyone is signed out, in every tab of this browser · Your selection of experiments is emptied". Press **Reset demo data** again.
3. → Expect "**Back to the starting state** · Every record is as it was at the start, and nobody is signed in."
4. Baseline checks:
   - http://localhost:3363/experiments → "**12 experiments**"
   - http://localhost:3363/areas → **AREAS 3 · COURSES 5 · EXPERIMENTS 12**

Reset only affects this profile on `localhost:3363`. It also clears the kept request ticket (verified at step 21).

---

## 5. Bootstrap credentials

**Signing in.** Go to `/sign-in`, enter the e-mail below, then **any non-empty password** (for example `x`), then **Sign in**.

- The page says "Prototype sign-in. Real accounts, password checks and institution single sign-on aren't connected in this build."
- Do not use **Sign in with your institution**. It answers "Institution sign-in isn't available right now".
- An unknown e-mail gives "The e-mail or password isn't right".

| Record                                                                                                                  | E-mail                     | Mandatory?                              | Why                                                                                                                                                                                                                                                                                                                                                    |
| ----------------------------------------------------------------------------------------------------------------------- | -------------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Super Admin Arjun Mehta**                                                                                             | `arjun.mehta@wilp.example` | **Yes, always**                         | No screen creates a Super Admin. It is a seeded identity. Platform roles can register only Vendors, Academic Reviewers and Content Managers.                                                                                                                                                                                                           |
| Content Manager Kavya Nair (scope: All experiments)                                                                     | `kavya.nair@wilp.example`  | Only if you keep the owner's step order | Step 3 (course code) comes before step 6 (new Content Manager). Only a Content Manager with **All experiments** scope may save course codes. A course-scoped one is refused, "These codes can't be saved yet" (CC-06, still open). **Without Kavya:** do step 6 first, give the new Content Manager **All experiments** scope, and use her for step 3. |
| Seeded catalogue experiments: Shell-and-Tube Heat Exchanger, Fin-Tube Bundle, Composite Wall Conduction (ME ZG523, WEB) | —                          | Optional, but recommended               | Each experiment can have only **one** assessment per institution (ASMT-03). Four shapes therefore need four experiments in the plan. A plan cannot be amended later, so all four must go into the **first** request. **Without them:** Priya creates and publishes three more CE ZG514 experiments (steps 7–9 three times, about 30 min more).         |
| Build stand-ins                                                                                                         | —                          | Present in the build                    | The payment step, the sample WEB activity, the automatic choice marking (answer-key stand-in) and resubmission routing.                                                                                                                                                                                                                                |
| Other seeded institutions, requests and people                                                                          | —                          | Not used                                | Background only. They appear in counts such as "11 requests" or "7 institutions".                                                                                                                                                                                                                                                                      |

---

## 6. Cast (all created in the UI except Arjun and, optionally, Kavya)

| Role                                | Name                                   | E-mail (any password)           | Can sign in from                                                        | Lands on           |
| ----------------------------------- | -------------------------------------- | ------------------------------- | ----------------------------------------------------------------------- | ------------------ |
| Super Admin (seed)                  | Arjun Mehta                            | `arjun.mehta@wilp.example`      | the start                                                               | `/admin`           |
| Content Manager (seed, step 3 only) | Kavya Nair                             | `kavya.nair@wilp.example`       | the start                                                               | `/content-manager` |
| Vendor                              | Priya Raman · Structura Virtual Labs   | `priya.raman@structura.example` | step 4 (Register)                                                       | `/vendor`          |
| Academic Reviewer                   | Dr Sunil Kulkarni                      | `s.kulkarni@wilp.example`       | step 5                                                                  | `/reviewer`        |
| Content Manager                     | Neha Joshi                             | `neha.joshi@wilp.example`       | step 6                                                                  | `/content-manager` |
| Requester (not an account)          | Asha Patil, the contact on the request | `asha.patil@konkan.edu.in`      | **not before step 12** (verified: "The e-mail or password isn't right") | —                  |
| Institute Admin                     | Asha Patil                             | `asha.patil@konkan.edu.in`      | step 12, once access is active                                          | `/institute`       |
| Student                             | Rohan Desai                            | `rohan.desai@konkan.edu.in`     | step 13 (Add student)                                                   | `/student`         |
| Faculty                             | Dr Meena Rao                           | `meena.rao@konkan.edu.in`       | step 13 (Add faculty member)                                            | `/faculty`         |

No invitation or e-mail is ever sent. Every screen that creates a person says "Nothing is sent from here" or "No invitation or e-mail is sent".

---

## 7. The run, step by step (verified on 3363)

**Notation**

- **[S] / [V] / [L]**: the tab.
- **Bold**: exact on-screen labels.
- **→ Expect**: what the run showed.
- **⇒ State**: what carries forward.
- **Sign out**: account menu, top right (initials and name), then **Sign out**.
- Times such as "10:0x" are the sample clock and will differ slightly for you.

### Step 0 · Start clean (1 min)

See §4. ⇒ State: seed world, clock 2 Oct 2026, 10:00. (shot `001`)

### Step 1 · New engineering area (Super Admin, 2 min)

1. [S] `http://localhost:3363/sign-in`, **E-mail** `arjun.mehta@wilp.example`, **Password** `x`, **Sign in**. → Expect `/admin` **Overview**.
2. Left navigation **Academic structure** → **Add area**.
3. Check the error first: press **Add area** in the dialog with nothing typed. → "Enter the area name".
4. Fill in:
   - **Area name** `Civil & Structural`
   - **Description (optional)** `Structural analysis, construction materials and geotechnics.`
5. Press **Add area**. → Expect "**Civil & Structural was added.** Add courses to it to start using it." The area is listed last, with "No courses yet. Add one to start using this area." (shot `002`)

⇒ State: a new area (address `area-0001`). It is not public until it has a published experiment.

### Step 2 · New course (Super Admin, 1 min)

1. [S] Same page → **Add course**.
2. Check the errors first: press **Add course** with nothing filled in. → "Enter the course name" and "Choose the engineering area it belongs to".
3. Fill in:
   - **Course name** `Structural Analysis`
   - **Engineering area** `Civil & Structural`
   - **Description (optional)** `Beams, trusses and frames under load.`
4. Press **Add course**. → Expect "**Structural Analysis was added.** The Content Manager adds its platform course code." The row reads "Structural Analysis · No platform code yet · 0 published experiments". (shot `003`)
5. **Sign out.**

⇒ State: a course with no code (`crs-0001`).

### Step 3 · Course code (Content Manager with All experiments scope, 2 min)

1. [S] Sign in `kavya.nair@wilp.example` → left navigation **Course codes**. The head reads "Courses with a code **5** of 7 · 2 without a code".
2. Check the duplicate rule first: in **Platform course code for Structural Analysis** type `ME ZG523` → **Save codes**. → "Check the codes · ME ZG523 is already the code for Thermodynamics & Heat Transfer. Each course needs its own code."
3. Type `CE ZG514` → **Save codes**. → Expect "**Codes saved** · 2 Oct 2026, 10:0x"; the head reads "**6** of 7 · 1 without a code". (shot `004`)
4. **Sign out.**

⇒ State: the course is now "CE ZG514 · Structural Analysis".

### Step 4 · New Vendor, its organisation and its course (Super Admin, 3 min)

1. [S] Sign in `arjun.mehta@wilp.example` → **Platform roles**. The tabs read "Vendors 2 · Reviewers 1 · Content Managers 1". Press **Register a Vendor**.
2. Check the errors first:
   - Press **Register** with nothing filled in. → "Enter the person's name", "Enter a work e-mail address", "Enter the organisation".
   - Enter **Work e-mail** `a.menon@wilp.example`. → "Someone is already registered with this e-mail address".
3. Fill in and register:
   - **Name** `Priya Raman`
   - **Work e-mail** `priya.raman@structura.example`
   - **Organisation** `Structura Virtual Labs`
   - **What can they submit to?** → **Assign courses next** (this walk gives Priya one course next; "Any course" is the dialog's default).
   - Press **Register**.
4. → Expect the holder page `/admin/roles/role-0001`: "**Priya Raman is registered as Vendor.** Assign what they can act on. Nothing was sent to them." and "No scope — can't act on anything yet".
5. Panel **Assign scope** → **A course** → **Course** `CE ZG514 · Structural Analysis` → **Assign scope**.
6. → Expect "**Scope assigned: CE ZG514.** It now appears in their workspace." and "Can create experiments and submit them for: CE ZG514." (shot `005`)

Notes:

- A Vendor's scope (owner decisions of 27 Oct 2026): **Any course** (the All experiments scope, as SA-16 and SA-17 call it for a Vendor) lets them submit to every course, now and later; **A course** restricts them to that course; **One experiment** is not offered for a Vendor. With no scope the Vendor sees "No course is assigned to you yet" and no Create experiment.
- _Organisation_ is a text field on each person; there is no separate organisation record. A second person of the same Vendor is registered with the **identical** organisation text — each still sees and opens only the experiments they created themselves.

### Step 5 · New Academic Reviewer and review scope (Super Admin, 1.5 min)

1. [S] **Platform roles** → tab **Reviewers** → **Register a Reviewer**.
2. Fill in **Name** `Dr Sunil Kulkarni`, **Work e-mail** `s.kulkarni@wilp.example`, **Organisation** `BITS Pilani WILP` → **Register**.
3. **A course** → `CE ZG514 · Structural Analysis` → **Assign scope**. → Expect "Sees submissions and updates for these in the review queue: CE ZG514." (`role-0002`, shot `006`)

### Step 6 · New Content Manager and scope (Super Admin, 1.5 min)

1. [S] **Platform roles** → tab **Content Managers** → **Register a Content Manager**.
2. Fill in **Name** `Neha Joshi`, **Work e-mail** `neha.joshi@wilp.example`, **Organisation** `BITS Pilani WILP` → **Register**.
3. **A course** → `CE ZG514 · Structural Analysis` → **Assign scope**. → Expect "Decides publication and raises corrections for: CE ZG514." (`role-0003`, shot `007`)
4. The tabs now read **Vendors 3 · Reviewers 2 · Content Managers 2**.
5. Optional sign-in check:
   - **Sign out** → `s.kulkarni@wilp.example` → `/reviewer`.
   - **Sign out** → `neha.joshi@wilp.example` → `/content-manager`, with every pipeline count at 0.
   - **Sign out.**

### Step 7 · New experiment (Vendor, 5 min)

1. [S] Sign in `priya.raman@structura.example` → `/vendor` → **Create experiment**.
2. Step 1 **Course and description**:
   - **Engineering area** `Civil & Structural` (chosen already: the only area Priya's course is in)
   - **Course** `CE ZG514 · Structural Analysis` (the only option)
   - **Version** `1.0`
   - **Experiment name** `Simply Supported Beam Deflection`
   - **Summary** `Load a simply supported beam and see how its deflection follows the load, the span and the section.`
   - **Description** `Learners place point and distributed loads on a steel beam, measure the mid-span deflection and compare it with the elastic beam formula.`
   - **Save draft** → the address becomes `/vendor/experiments/SUB-0077/edit` and shows "Draft saved · …" and "Only you can see a draft".
3. **Continue** → Step 2 **Formats and delivery**. Tick **WEB** and **AR**.
   - WEB web link: first type `labs.structura.example/beam` → **Continue**. → "Enter a web link that starts with https://". Then type `https://labs.structura.example/beam`.
   - WEB browser and computer: `A current browser on a laptop or desktop, with a keyboard and mouse.`
   - AR package label: `Beam Deflection AR 1.0`
   - AR package reference: `structura-beam-ar-1.0`
   - AR device needed: `An ARCore or ARKit phone or tablet.`
   - AR install notes: `Install the package on the lab tablets and open it once while online.`
4. **Continue** → Step 3 Preview and documents (all optional) → **Continue** → Step 4. → Expect "Everything required is provided".
5. **Submit for academic review** → dialog → **Submit for academic review**. → Expect "Submitted for academic review · Status With Academic Reviewer". (shot `008`)
6. **Sign out.**

⇒ State: SUB-0077 (WEB + AR) is with the Reviewer.

### Step 8 · Return, revise, approve (Reviewer ↔ Vendor, 8 min)

1. [S] Sign in `s.kulkarni@wilp.example` → **Review queue** (1 · New submission · "Revision 1 · from Structura Virtual Labs") → open **Simply Supported Beam Deflection**.
2. Return it:
   - Choose **Return to vendor**.
   - **Reason the vendor will see (required)** `Please name the tablets the AR package has been tested on.`
   - Tick AR **Device need**.
   - Press **Return to vendor**. → "Returned to vendor".
   - **Sign out.**
3. Sign in `priya.raman@structura.example` → **My experiments**. The row reads "Returned · By the Academic Reviewer today". Open it.
4. Revise:
   - **Revise and resubmit** → link **Formats & delivery · AR · Device need**.
   - **Device needed** `Tested on Samsung Galaxy Tab S9 and iPad (10th generation); any ARCore or ARKit tablet.`
   - **Save changes** → "Changes saved · … · not resubmitted yet".
   - **Continue** → **Continue** → **Resubmit** → dialog "Your changes are sent as revision 2." → **Resubmit**. → "Submitted · Revision 2".
   - **Sign out.**
5. Sign in `s.kulkarni@wilp.example` → **Review queue** ("Resubmitted · revision 2") → open it. "What changed in revision 2" shows Was/Now for the AR device need.
6. Add three learning outcomes. For each: type it in **Add a learning outcome**, then press **Add outcome**.
   - `Calculate the mid-span deflection of a simply supported beam under a point load.`
   - `Explain how span and second moment of area change the deflection.`
   - `Compare measured deflections with the elastic beam formula and explain the difference.`
7. Choose **Approve** → **Approve** → dialog "It goes to the Content Manager with its 3 learning outcomes…" → **Approve**. → Expect "**Approved — with the Content Manager**". (shot `009`)
8. **Sign out.**

### Step 9 · Publication (Content Manager Neha, 3 min)

1. [S] Sign in `neha.joshi@wilp.example` → **Ready to publish**. The row reads "Approved by Dr Sunil Kulkarni · 3 learning outcomes". Open the publication decision.
2. Choose **Publish** → **Publish** → dialog "It appears in the public catalogue under CE ZG514 · Structural Analysis with WEB and AR…" → **Publish**. → Expect "**Published**". (shot `010`)
3. **Sign out.**
4. [V] Public checks:
   - **Browse experiments** → "**13 experiments**", including the new one.
   - **Areas** → **AREAS 4 · COURSES 6 · EXPERIMENTS 13**.
   - **Civil & Structural** (`/areas/area-0001`) → **Structural Analysis** (`/courses/crs-0001`) → **Simply Supported Beam Deflection** (`/experiments/simply-supported-beam-deflection`).
   - It shows WEB + AR, the three outcomes, the revised AR device need, and an "SS" monogram tile instead of a picture. (shot `011`)

⇒ State: the experiment is published, and nobody has access yet.

### Step 10 · Institution request (Visitor) ★ corrected step (4 min + 3 min of tries)

1. [V] On the new experiment's page, tick **WEB** and **AR** → **Add to selection**. The header reads "Selection 1".
2. Add the three seeded ME ZG523 experiments, **WEB only**. For each one:
   - **Browse experiments** → search `ME ZG523`.
   - Open **Shell-and-Tube Heat Exchanger**, **Fin-Tube Bundle** or **Composite Wall Conduction**.
   - Tick **WEB** → **Add to selection**.

   The header ends at "Selection 4". You may reload [V] here; the selection survives.

3. **Go to selection** → "Your selection" lists 4 experiments → **Continue to request**.
   - **Institution name** `Konkan College of Engineering`
   - **Contact person** `Asha Patil`
   - **E-mail** `asha.patil@konkan.edu.in`
   - **Licences requested** `60`
   - **Access term** `Yearly` (the choices are Monthly, Quarterly, Yearly and Until a fixed date)
   - Press **Review request**. The summary lists "Simply Supported Beam Deflection — WEB, AR; Shell-and-Tube Heat Exchanger — WEB; Fin-Tube Bundle — WEB; Composite Wall Conduction — WEB". Press **Submit request**.
4. → Expect "**Request sent** · Your reference is REQ-0042. … Your selection was sent with this request, so it is empty again." (shot `012`)
5. **Check request status** → `/requests/rq-0011` → "REQ-0042 · Konkan College of Engineering · **Submitted** · We've received your request". (shot `013`)

**Try deliberately (Correction 1, while Submitted). All of these were verified:**

| #   | Do this in [V]                                                                                                     | → Expect                                                                                                                                                                                                                                                                         |
| --- | ------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T1  | Reload the status page (⌘R)                                                                                        | Still "REQ-0042 · **Submitted**" (shot `014`). Before the fix this showed "We can't find that page".                                                                                                                                                                             |
| T2  | Click in the address bar and press Enter on `http://localhost:3363/requests/rq-0011`                               | The same status page                                                                                                                                                                                                                                                             |
| T3  | Header **Browse experiments**, then header **Selection 0**                                                         | "Your selection" shows a quiet note: "**You have a request in progress for Konkan College of Engineering.** **Check request status**", above "Your selection is empty" (shot `015`). **Check request status** leads back to the status page. Browser Back and Forward also work. |
| T4  | Go to `http://localhost:3363/` (the landing), scroll to "For institutions", press **Request institutional access** | You arrive at "Your selection" with the same note.                                                                                                                                                                                                                               |

Finish with [V] on the status page (**Check request status**). ⇒ State: REQ-0042 under review, and this browser keeps its ticket.

### Step 11 · External approval and payment (Super Admin + Visitor) ★ corrected step (3 min + 3 min of tries)

1. [S] Sign in `arjun.mehta@wilp.example` → Overview → press **Open request** for Konkan College of Engineering (`/admin/requests/REQ-0042`).
   "Existing access" reads: "None. There is no institution record for Konkan College of Engineering yet. Approving this request creates the record; it does not activate access."
2. Choose **Approve request** → route **External institution** → press **Approve request**.
   - The dialog reads: "Creates the institution record for Konkan College of Engineering, classified external. … Its status becomes Approved — payment required."
   - Press **Approve request**. → Expect "**Approved — payment required**". (shot `016`)
3. [V], with no reload: within about a second the page changes by itself to "**Approved — payment required** · Approved. Payment is needed before access starts." It shows **Continue to payment**.
4. Optional [S] **Institutions** → **Konkan College of Engineering** (address `/admin/institutions/godavari`; see §10, F-1). It reads:
   - "Approved — payment required"
   - "Institute Admin: assigned once access is active"
   - "No status action here. Payment is confirmed on the request, outside this page."

   There is no Assign button yet.

**Try deliberately (Correction 1, after the approval). All of these were verified:**

| #   | Do this                                                                                                                                                                                   | → Expect                                                                                                                                                                                |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| T5  | [V] Reload the status page                                                                                                                                                                | Still "**Approved — payment required**" with **Continue to payment** (shot `017`). Before the fix this stranded the institution.                                                        |
| T6  | [V] Header **Areas** → header **Selection**                                                                                                                                               | The same "You have a request in progress…" note                                                                                                                                         |
| T7  | **Close tab [V]** (⌘W). Open a **new tab** (⌘T) and go to `http://localhost:3363/selection`, or go to `http://localhost:3363/` and press **Request institutional access**.                | The note "You have a request in progress for Konkan College of Engineering. **Check request status**" (shot `018`). This new tab is now [V].                                            |
| T8  | **Check request status** → **Continue to payment** → `/requests/rq-0011/payment` "Pay for access" (shot `019`). Optionally reload this page too; it stays. Press **Continue to payment**. | Status "**Access active** · Access plan **ACC-0107**". The history reads "Payment confirmed" and then "Access active". This is a stand-in: no amount and no money (shot `020`).         |
| T9  | [S] **Requests**                                                                                                                                                                          | "11 requests". Konkan College of Engineering appears **once**, with "Access active".                                                                                                    |
| T10 | [S] **Institutions**                                                                                                                                                                      | "7 institutions". Konkan appears **once**, reading "Access active · Institute Admin: not assigned · 4 experiments · 60 licences · Yearly term · 2 Oct 2026 → 1 Oct 2027" (shot `021`).  |
| T11 | **Another browser cannot recover.** Open an Incognito window of the test Chrome (⌘⇧N) and go to `http://localhost:3363/requests/rq-0011`, then `/selection`.                              | "**We can't find that page**". "Your selection is empty", with no note (shot `022`). Incognito is a separate, empty world. Close it afterwards; nothing needs a reset.                  |
| T12 | Back in the test window, [V] → `/selection`                                                                                                                                               | The note is **gone**. This is by design: the note lists only requests still in progress, not after "Access active". The status address `/requests/rq-0011` still opens in this browser. |

**Alternative: the Internal route.** Use it if payment is not the point. It was verified in a separate world.

- At point 2 choose **Internal: BITS campus or programme** instead.
- The dialog reads "Approves the request. There is no payment step. Institutional access is activated now and the access plan is created."
- → "Access active" and "Payment: Not needed (internal)". **Assign Institute Admin** is available at once (shot `023`).
- The requester's status goes straight to "Access active · Access plan ACC-0107".

⇒ State: institution Konkan (external) and plan ACC-0107: 4 experiments, 60 licences, yearly. No Student access exists yet.

### Step 12 · Institute Admin (Super Admin, 1.5 min)

1. [S] On Konkan's institution page → **Assign Institute Admin** → **Name** `Asha Patil`, **Work e-mail** `asha.patil@konkan.edu.in` → **Assign**.
2. → Expect "**Asha Patil is now the Institute Admin for Konkan College of Engineering.** Nothing is sent from here. How they first sign in is still open." (shot `024`)
3. **Sign out.**

Only one Institute Admin can be assigned, and replacing them is not designed (INST-06). Type carefully.

### Step 13 · Student and Faculty accounts (Institute Admin, 3 min)

1. [S] Sign in `asha.patil@konkan.edu.in` → `/institute` "Access active · Your access plan ends on 1 October 2027".
2. **People** → **Add student**:
   - **Full name** `Rohan Desai`
   - **Institution e-mail** `rohan.desai@konkan.edu.in`
   - **Student ID** `KCE-2026-0101`
   - **Programme (optional)** `B.E. Civil Engineering`
   - Press **Add student**.

   → Expect "**Added** · Rohan Desai is in People now, with no experiments yet. No invitation or e-mail is sent."

3. Optional [L]: open a new tab, sign in `rohan.desai@konkan.edu.in` → "Hello, Rohan · Your institution hasn't given you access yet". Keep [L] open.
4. [S] **People** → tab **Faculty** → **Add faculty member** → **Full name** `Dr Meena Rao`, **Institution e-mail** `meena.rao@konkan.edu.in` → **Add faculty member**.
   → Expect "Dr Meena Rao is in People now, with no courses yet." (shot `025`)

### Step 14 · Course mappings and Student access (Institute Admin, 4 min)

1. [S] From that result press **Assign a course**.
   - **Faculty member** `Dr Meena Rao`; **Course** `CE ZG514 — Structural Analysis` → **Assign course**. → "Dr Meena Rao now teaches CE ZG514. It appears in their Faculty workspace."
   - Repeat with `ME ZG523 — Thermodynamics & Heat Transfer`. Only the two plan courses are offered.
2. **People** → **Rohan Desai** → **Give this student access**:
   - Step 1: **Course** `CE ZG514 — Structural Analysis` (already chosen) → tick **Simply Supported Beam Deflection** → **Continue**.
   - Step 2: "1 student selected · Rohan Desai" → **Continue**.
   - Step 3: "Rohan Desai → Simply Supported Beam Deflection → Active" → **Give access**. → "**Access given**".
   - [L] Rohan's Home changes by itself to "Start here · CE ZG514 · Structural Analysis · Simply Supported Beam Deflection".
3. **Give more access**:
   - **Course** `ME ZG523 — Thermodynamics & Heat Transfer` → tick all three → **Continue**.
   - Step 2 shows "0 students selected". **Tick Rohan Desai** (see O-4) → **Continue**.
   - → 3 rows → **Give access**.
4. **Student access** → 4 rows, all **Active**, "Individually" (shot `026`).
5. **Sign out.**

⇒ State: Meena teaches 2 courses (4 experiments), and Rohan has 4 grants. Formats come from the plan: Beam = WEB + AR; the others = WEB.

### Step 15 · WEB activity (Student, 4 min)

1. [L] as `rohan.desai@konkan.edu.in` → **My courses**. CE ZG514 lists 1 experiment and ME ZG523 lists 3, all "Not started".
2. Open the activity:
   - **Open experiment** on Simply Supported Beam Deflection → tab **Simulation** → **Open WEB** → **Launch WEB**.
   - A new tab opens: "Simulated for this prototype · Sample WEB activity · Simply Supported Beam Deflection".
   - The launcher now reads "In progress · First opened 2 Oct 2026, 10:0x".
3. In the activity tab:
   - Set **Level 1** → **Run trial**, **Level 3** → **Run trial**, **Level 5** → **Run trial**. You get "Three trials done" with 17.6, 30.4 and 40.0.
   - Choose **Level 5** → **Check answer**. → "Correct — the highest level gave the highest value."
   - **Finish activity** → "Activity completed". (shot `027`)
   - Close that tab.
4. [L] → Expect "**Completed** 2 Oct 2026 · Reported by the simulation at 10:0x" (shot `028`). Do not reload the launcher while the activity is open.
5. **Give feedback on WEB** → rate all five statements (for example 5) → **Submit feedback** → "Feedback on WEB sent".
6. AR: **Open AR** shows set-up notes only. There is no launch; the headset runtime is outside this build.

### Step 16 · Four assessments (Faculty) ★ corrected scope (12 min)

1. [S] Sign in `meena.rao@konkan.edu.in` → Overview "You teach 2 courses with 4 experiments, as assigned by your Institute Admin."
2. For each assessment: **My courses** → the experiment's link → **Create assessment**. The wizard is the same each time:
   - **Step 1:** the experiment is preselected → **Continue**.
   - **Step 2 "Set the rules":**
     - **Assessment name** (from the table below)
     - **Introduction (optional)**
     - **Pass mark (%)** `50`
     - **Attempts allowed** `2`
     - **Deadline** `14 Nov 2026, 23:59`
     - Release: **Immediately after marking** (the other choices are "After the deadline" and "On a date"; see §7a)
     - **Continue**
   - **Step 3:** for each question: **New question** → choose **Multiple choice**, **True or false** or **Written answer** → fill in **Question**, then the options (**Option A…D** and **Correct**) or True/False, **Marks**, and optionally **Explanation** or **Marking guidance** → **Save question**. You return with the question ticked.
   - **Continue** → Step 4 Preview → **Create assessment**.
   - → Expect "**Assessment created** · Ready · Students who have <experiment> can now see it in Assessments and start it."

| ID  | Shape           | Experiment                       | Assessment name                                                                                   | Questions (type · text · answer · marks)                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Summary                |
| --- | --------------- | -------------------------------- | ------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| A   | **mixed**       | Simply Supported Beam Deflection | `Beam Deflection — post-lab (mixed)`. Introduction: `One choice question and one written answer.` | **Multiple choice** · `Doubling the span of a simply supported beam under a central point load multiplies its mid-span deflection by:` · Options `2` / `4` / `8` / `16`, **Correct = Option C (8)** · Marks `2` · Explanation `Deflection under a central point load grows with the cube of the span.` **+ Written answer** · `Explain why the measured deflection can differ from the elastic beam formula.` · Marking guidance `Look for support conditions, self-weight and measurement error.` · Marks `10` | 2 questions · 12 marks |
| B   | **one written** | Shell-and-Tube Heat Exchanger    | `Heat Exchanger — written reflection (one written)`                                               | **Written answer** · `Explain how the effectiveness of the exchanger changed as you raised the flow rate.` · Marks `10`                                                                                                                                                                                                                                                                                                                                                                                         | 1 question · 10 marks  |
| C   | **choice only** | Fin-Tube Bundle                  | `Fin-Tube Bundle — quick check (choice only)`                                                     | **Multiple choice** · `Fouling on the tube side makes the overall heat transfer coefficient:` · `Rise` / `Fall` / `Stay the same`, **Correct = Option B (Fall)** · Marks `2` **+ True or false** · `Fouling adds a thermal resistance in series with the wall.` · **True** · Marks `1`                                                                                                                                                                                                                          | 2 questions · 3 marks  |
| D   | **two written** | Composite Wall Conduction        | `Composite Wall — report (two written)`                                                           | **Written answer** · `Describe the temperature profile you measured across the layered wall.` · Marks `5` **+ Written answer** · `Which layer contributed most to the total thermal resistance, and why?` · Marks `5`                                                                                                                                                                                                                                                                                           | 2 questions · 10 marks |

3. **Assessments** → 4 rows, all "**Ready**", each "0 of 1 students submitted" (shot `033`). Every shape is accepted, and every one can now be marked.
   - A second assessment on the same experiment is not possible (ASMT-03). The chooser marks the others "Already has an assessment".

### Step 17 · Student submissions (6 min)

1. [L] **Assessments** ("To do 4") → **Open** next to an assessment → "Before you start" → **Start assessment** ("Attempt 1 of 2").
   - The attempt page has no left navigation. Leave it with **Back to experiment**, then **Assessments**.
2. Answers. Answers save as you type.
   - A: choose `8`; written answer `The supports are not perfectly pinned, the beam self-weight adds load, and the dial gauge reading has a small error.`
   - B: `Effectiveness fell as the flow rate rose, because the fluid spent less time in the exchanger.`
   - C: `Fall`, `True`
   - D: `The temperature fell in straight lines inside each layer, steepest in the insulation.` / `The insulation layer: it has the lowest conductivity, so most of the temperature drop happened across it.`
3. For each: **Submit** → dialog "Submit your answers? … All 2 questions are answered." (B says "All 1 questions…", O-1) → **Submit answers** → "**Answers submitted** · Waiting for marking".
4. **Submitted** tab → 4 rows "Waiting for marking" (shot `036`):
   - A, B and D: "Submitted 2 Oct 2026, 10:0x · **your faculty marks written answers**"
   - C: "Submitted … · **your faculty confirms the automatic marks**" (new wording for choice-only)

### Step 18 · Faculty marking ★ corrected step (8 min)

1. [S] Meena → **Overview**. "Needs your attention" shows (shot `037`):
   - "**4** · Written answers to mark · Across 3 assessments"
   - "**1** · Submission to confirm · Fin-Tube Bundle — quick check (choice only) · No written answer to mark. Check the automatic marks, then confirm them." with **Confirm marks**

   The left navigation reads **Marking 5**.

2. **Marking** → "**4 written answers waiting · 1 submission to confirm**". Four rows, each with **Mark** (shot `038`):

   | Row | Shows                                          |
   | --- | ---------------------------------------------- |
   | A   | "Question 2 · written answer"                  |
   | B   | "Question 1 · written answer"                  |
   | C   | "**Marked automatically · confirm the marks**" |
   | D   | "**Questions 1 and 2 · written answers**"      |

3. **A (mixed):** **Mark**. The page shows "Marked automatically · 2 of 2 marks".
   - **Your mark** (out of 10) `8`
   - **Feedback for Rohan (optional)** `Good: you named the support conditions and self-weight. Quantify the gauge error next time.`
   - **Save mark** → "Mark saved — not confirmed yet".
   - **Confirm marks** → the dialog reads "Question 2 is marked 8 of 10. Rohan's total becomes 10 of 12 marks — passed (pass mark 6). … Rohan sees the result as soon as you confirm, as set for this assessment." → **Confirm marks**.
   - → "**Marks confirmed** · 10 of 12 marks · Passed · pass mark 6" (shot `039`).
4. **B (one written):** mark `4`, feedback `You described the trend but not the reason. Look at residence time again.` → **Save mark** → **Confirm marks** → **Confirm marks**. → "4 of 10 marks · Not passed · pass mark 5".
5. **D (two written). Try this deliberately.** The page shows both answers and **two** mark blocks, "Question 1 · written answer, out of 5" and "Question 2 · written answer, out of 5", each with its own feedback and **Save mark** (shot `040`).

   | #   | Do this                                                                                                                                                              | → Expect (verified)                                                                                                                                                                                                                                                                                                                                                                |
   | --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
   | D1  | Press **Confirm marks** with nothing entered                                                                                                                         | **No dialog.** "Enter a mark for question 1" appears under question 1, and the cursor jumps there (shot `041`).                                                                                                                                                                                                                                                                    |
   | D2  | Question 1: mark `4`, feedback `Clear description; add the measured temperatures at each interface.` → **Save mark** (for question 1). Then press **Confirm marks**. | "Mark saved — not confirmed yet" for question 1. **Still no dialog:** "Enter a mark for question 2" appears (shot `042`).                                                                                                                                                                                                                                                          |
   | D3  | Question 2: mark `5`, feedback `Correct, and well reasoned from the conductivities.` → **Save mark**.                                                                | Total "**9 of 10** · 0 marked automatically + 9 written · pass mark 5"                                                                                                                                                                                                                                                                                                             |
   | D4  | **Confirm marks** (once)                                                                                                                                             | The dialog reads "Question 1 is marked 4 of 5. Question 2 is marked 5 of 5. Rohan's total becomes 9 of 10 marks — passed (pass mark 5)." → **Confirm marks** → "**Marks confirmed** · 9 of 10 marks · Passed · Question 1 4 of 5 · Question 2 5 of 5 · Feedback on question 1 … · Feedback on question 2 … · Result released to Rohan when the marks were confirmed" (shot `043`). |

   Also verified in a separate world: if you type both marks but do not press **Save mark**, **Confirm marks** saves them first and then opens the dialog.

6. **C (choice only). Try this deliberately.** Press **Mark**. The page reads (shot `044`):
   - "Marked automatically · 3 of 3 marks · Question 1 · Multiple choice 2 of 2 · Question 2 · True or false 1 of 1"
   - "There's no written answer to mark · The choice questions are marked automatically. Check their marks, then confirm them."
   - "Total 3 of 3 · 3 marked automatically · pass mark 1.5"
   - **No mark or feedback field.**

   Press **Confirm marks** → the dialog reads "Rohan's total becomes 3 of 3 marks — passed (pass mark 1.5)." → **Confirm marks** → "**Marks confirmed** · 3 of 3 marks · Passed · Result released to Rohan when the marks were confirmed" (shot `045`).

7. **Marking** → "Nothing waiting", with Marked 4. The navigation count is gone. The Overview reads "Nothing needs you right now".
8. Optional second attempt (3 min, verified):
   - [L] Open B's result ("Not passed this time · You have 1 attempt left") → **Try again** → "Attempt 2 of 2".
   - Answer `Effectiveness fell because a higher flow rate cuts the residence time, so NTU drops.` → submit.
   - [S] **Marking** shows "1 written answer waiting", with row "Attempt 2 of 2".
   - Mark `9`, feedback `Much better: you linked residence time and NTU.` → save → confirm.
   - [L] → "You passed · 9 of 10 · Attempt 2 of 2".

### Step 19 · Results and progress (4 min)

1. [L] **Assessments** shows To do 0 · Submitted 0 · **Results 4**. Each row reads "Released 2 Oct · Result ready · **See result**" (shot `046`).

   | Assessment | Result page shows                                                                                                                                                                                     |
   | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
   | A          | "**You passed** 10 of 12 marks · Pass mark 50% · 6 of 12 · Released …, when marked". Q1 "8 · Correct" with the explanation. Q2 "8 of 10" with Meena's feedback (shot `047`).                          |
   | B          | "**Not passed this time** 4 of 10" and "You have 1 attempt left. Your first result stays here." with **Try again** (shot `048`). After the optional attempt 2: "You passed 9 of 10 · Attempt 2 of 2". |
   | C          | "**You passed** 3 of 3 · Pass mark 50% · 1.5 of 3 marks". "Fall · Correct", "True · Correct" (shot `049`).                                                                                            |
   | D          | "**You passed** 9 of 10". Q1 "4 of 5" and Q2 "5 of 5", each with its own feedback (shot `050`).                                                                                                       |

2. [L] **Progress** (shot `051`):
   - Simply Supported Beam Deflection: "WEB · Completed 2 Oct 2026 · First opened … · Reported by the simulation at 10:0x · Feedback sent 2 Oct 2026". AR: "Not started · No headset session reported yet".
   - One assessment line per experiment:
     - "Beam Deflection — post-lab (mixed) · passed · 10 of 12 marks · released 2 Oct 2026"
     - "Heat Exchanger — written reflection (one written) · passed · 9 of 10 marks" (4 of 10 · not passed without attempt 2)
     - "Fin-Tube Bundle — quick check (choice only) · passed · 3 of 3 marks"
     - "Composite Wall — report (two written) · passed · 9 of 10 marks"
3. [S] Meena → **Students**. The **Experiment** filter starts at Simply Supported Beam Deflection: "Rohan Desai · WEB Completed · AR Not started · Marked 10 of 12 · result released" (shot `053`).
   - Switch the filter: Fin-Tube "Marked 3 of 3 · result released", Composite Wall "Marked 9 of 10 · result released", Shell-and-Tube "Marked 9 of 10" (4 of 10 without attempt 2).
   - **Rohan Desai** → per-format progress ("Per format only — there is no overall percentage or verdict"), then "Assessment · Marked … 10 of 12 marks · Passed · pass mark 6 · Result released …" and **View marks** (shot `054`).
   - **Export CSV** is available.
4. [S] **Sign out** → sign in `asha.patil@konkan.edu.in` → **Usage** (shot `055`):
   - Simply Supported Beam Deflection: WEB Started 1 · Completed 1 · Sessions 1; AR 0.
   - The others: "No activity yet".
   - Overview: "Licences 60 as approved by BITS".
   - Rohan's record: 4 grants "Individually · Active".
5. **Sign out.**

### Step 20 · Optional: post-publication correction (CM → Reviewer → Super Admin, 6 min)

1. [S] `neha.joshi@wilp.example` → **Content library** → **Published 1** → **Simply Supported Beam Deflection** → **Edit catalogue details**. This opens `/content-manager/updates/UPD-0005`.
   - **Reason for the change** `The summary should say the beam is steel and name the formula learners compare against.`
   - **New version label** `1.1`
   - **Summary** `Load a simply supported steel beam and compare its measured deflection with the elastic beam formula.`
   - **Save draft** → **Send for academic review** → dialog → **Send for academic review**. → "In academic review · 1.0 live · 1.1 proposed".
   - **Sign out.**
2. `s.kulkarni@wilp.example` → **Review queue** (Updates 1 · "From Neha Joshi, Content Manager") → open → **Approve** → **Approve update** → dialog → **Approve update**. → "Approved — with the Super Admin". **Sign out.**
3. `arjun.mehta@wilp.example` → the Overview shows "Correction waiting for release". Open **Review correction** (for Simply Supported Beam Deflection) → choose **Release update** → dialog → **Release update**.
   → "**Version 1.1 is live.** Everyone now sees the corrected experiment. No access changed." (shot `056`)
4. Checks:
   - [V] the experiment page shows the new summary.
   - [L] Rohan's access and progress are unchanged.
   - Priya's **My experiments** still shows "Published · Live in the catalogue since 2 Oct".

### Step 21 · Reset (1 min)

1. [V] `http://localhost:3363/prototype/reset` → **Reset demo data** → dialog → **Reset demo data**.
2. Checks (all verified):
   - "Back to the starting state".
   - [S] and [L] go to `/sign-in?returnTo=…` by themselves.
   - The catalogue shows "12 experiments".
   - `priya.raman@structura.example` gives "The e-mail or password isn't right".
   - **The kept request ticket is cleared:** `/selection` shows no note, and `/requests/rq-0011` shows "We can't find that page" (shot `057`).

### 7a. Optional: the other release settings (verified in a separate world)

The main run uses **Immediately after marking** for all four shapes. One experiment can hold only one assessment, so the other settings need a second run after a reset. Both were verified on 3363:

| Assessment                                        | Before Faculty confirms                                                                            | When Faculty confirms                                                                                    | After confirming                                                                                                                                                          |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Choice-only, **After the deadline**               | The Student's row reads "Result after 14 Nov · 23:59 · your faculty confirms the automatic marks". | The dialog reads "… sees the result after the deadline: 14 Nov 2026, 23:59, as set for this assessment". | Faculty sees "Result not released … yet". The Student sees "Result not released yet · Marked · released after the deadline", and Results reads "No results released yet". |
| Two written, **On a date** (`16 Nov 2026, 09:00`) | —                                                                                                  | The dialog reads "… sees the result on 16 Nov 2026, 09:00".                                              | The Student sees "Marked · released on 16 Nov 2026, 09:00".                                                                                                               |

The sample clock runs in real time from 2 Oct, so these results stay unreleased during a test.

---

## 8. Expected state after each step

| After step | What exists in the world (beyond the seed)                                                                                                                                                                                     |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 0          | Nothing: seed only. 12 experiments; AREAS 3 · COURSES 5.                                                                                                                                                                       |
| 1–2        | Area Civil & Structural (`area-0001`) and course Structural Analysis (`crs-0001`) with no code                                                                                                                                 |
| 3          | Code CE ZG514 on that course (6 of 7 courses coded)                                                                                                                                                                            |
| 4–6        | Priya (Vendor, CE ZG514), Dr Sunil Kulkarni (Reviewer, CE ZG514), Neha (CM, CE ZG514): Vendors 3 · Reviewers 2 · Content Managers 2                                                                                            |
| 7–8        | SUB-0077, revision 2, 3 outcomes, approved, with the CM                                                                                                                                                                        |
| 9          | Published experiment: 13 experiments; AREAS 4 · COURSES 6 · EXPERIMENTS 13                                                                                                                                                     |
| 10         | REQ-0042 Submitted (11 requests); this browser keeps its ticket (it survives reload, navigation and closing the tab)                                                                                                           |
| 11         | Institution Konkan, external, at `/admin/institutions/godavari` (7 institutions); REQ-0042 Access active; plan ACC-0107 (4 experiments, 60 licences, Yearly, 2 Oct 2026 → 1 Oct 2027). The "request in progress" note is gone. |
| 12         | Asha Patil is Institute Admin and can sign in                                                                                                                                                                                  |
| 13–14      | Rohan (student) and Meena (faculty) can sign in; Meena teaches CE ZG514 and ME ZG523; Rohan has 4 Active grants                                                                                                                |
| 15         | Beam WEB Completed, feedback sent                                                                                                                                                                                              |
| 16         | 4 assessments, all Ready, 6 bank questions                                                                                                                                                                                     |
| 17         | 4 attempts submitted, waiting for marking (4 written answers + 1 submission to confirm)                                                                                                                                        |
| 18         | All 4 confirmed and released; optionally B attempt 2 (9 of 10)                                                                                                                                                                 |
| 19         | Read-only views agree: Student Results and Progress, Faculty Students, IA Usage                                                                                                                                                |
| 20         | UPD-0005 released, live version 1.1                                                                                                                                                                                            |
| 21         | Back to the seed; the kept ticket is cleared                                                                                                                                                                                   |

---

## 9. What cannot be created in the UI, and why

| #   | Record or action                                                                                                                  | Why                                                                                                      | Use instead                                                          |
| --- | --------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| 1   | **Super Admin**                                                                                                                   | A seeded identity. Platform roles register only Vendors, Reviewers and Content Managers.                 | `arjun.mehta@wilp.example`                                           |
| 2   | A course code saved by a **course-scoped** CM                                                                                     | CC-06, still open: "These codes can't be saved yet"                                                      | Kavya, or a new CM with **All experiments** scope                    |
| 3   | A Vendor with "One experiment" scope                                                                                              | Not offered to a Vendor (owner decision PD-4, 27 Oct 2026)                                               | **A course** or **All experiments** (any course)                     |
| 4   | A Vendor **organisation** record                                                                                                  | It is a text field on each person                                                                        | Type the same organisation text for every person                     |
| 5   | An **institution**, directly                                                                                                      | Created only by approving a request                                                                      | Steps 10–11                                                          |
| 6   | A second request from an existing institution, or adding a later-published experiment to a plan                                   | It creates a duplicate institution, and plans cannot be amended (P1 items A and B)                       | Put every experiment in the **first** request                        |
| 7   | Replacing an Institute Admin, or adding a second one                                                                              | INST-06, still open                                                                                      | Assign once, carefully                                               |
| 8   | An Institute Admin before access is active                                                                                        | Refused until payment (External) or approval (Internal)                                                  | Finish step 11 first                                                 |
| 9   | Declining or withdrawing a request; leaving "information requested"                                                               | Not designed (T-02, T-03)                                                                                | Don't use **Request more information** in a run you need to finish   |
| 10  | Retiring an area or course; area, course or experiment artwork; **Featured** experiments; learning resources for a new experiment | Not available in the build. Featured is a seeded list. A new experiment has no artwork and no resources. | Expect the monogram tile and "No resources for this experiment yet." |
| 11  | A second assessment on the same experiment                                                                                        | ASMT-03                                                                                                  | One experiment per assessment shape                                  |
| 12  | Deactivating Faculty; editing a person                                                                                            | PER-07 / PER-08, not designed                                                                            | —                                                                    |
| 13  | AR / VR / MR launch and completion                                                                                                | No headset runtime; only WEB has the sample activity                                                     | WEB only; AR shows set-up notes                                      |
| 14  | Licence counting, invitations, passwords, institution SSO                                                                         | D7 / T-06, T-10 / T-11                                                                                   | —                                                                    |
| —   | ~~Confirming choice-only or ≥2-written attempts~~                                                                                 | **Now possible** (Correction 2, verified)                                                                | —                                                                    |

---

## 10. Known limitations and P1 items not yet decided

The full analysis, with reproduction, options and recommendations, is in the P1 Decision Register: `/Users/mymac/Desktop/AR-VR-v3-ui/v2/docs/v3/phase2/P1-DECISION-REGISTER.md`. It is in the repository working tree and not yet committed.

| ID   | Limitation                                                                                                   | What you would see                                                                                                                                                                  | Status                        |
| ---- | ------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| P1-A | **Duplicate institution on a repeat request.** A public request is never matched to an existing institution. | A second record with the same name; SA-03 says "There is no institution record … yet"                                                                                               | Decision Q-A1…A4 pending      |
| P1-B | **No plan amendment for new experiments**; renewal and "more licences" change nothing                        | A newly published experiment reaches only a new institution's **first** request. An approved renewal reads "Access active" on IA-17, but the plan's end date does not move.         | Decision Q-B1…B4 pending      |
| P1-C | **Group timing**: students added to or removed from a group after a group grant                              | The Student sees "hasn't been settled yet", while IA screens say "Active" or "No access yet"                                                                                        | Decision Q-C1…C3 pending      |
| P1-D | **Licences are not counted**                                                                                 | "60 licences, as approved. How licences are counted is still open." There is no cap and no "waiting for a licence".                                                                 | D7, decision pending          |
| P1-E | **Information requested / decline / withdraw are dead ends**                                                 | After **Request more information** neither side has a control. There is no Decline and no Withdraw.                                                                                 | T-02 / T-03, decision pending |
| F-1  | **The 'godavari' internal id**                                                                               | The first new institution's address is `/admin/institutions/godavari`, whatever its name (verified: Konkan). No page text shows it.                                                 | Demo-data quirk               |
| L-1  | **Resource links are placeholders**                                                                          | Seeded resources (for example Shell-and-Tube's "Lab brief", "Pre-lab reading", "Readings sheet") point to `https://docs.example/…`, which opens nothing. A new experiment has none. | Stand-in                      |
| L-2  | **The sample WEB activity**                                                                                  | "Simulated for this prototype": a stand-in page, not the real simulation                                                                                                            | Stand-in                      |
| L-3  | **AR / VR / MR are set-up only**                                                                             | Set-up notes, "No headset session reported yet"; no launch or completion                                                                                                            | Out of scope                  |
| L-4  | **Sample sign-in and payment stand-ins**                                                                     | Any password opens a sample account; institution SSO is unavailable. Payment is one "Continue to payment" press with no amount.                                                     | Stand-ins                     |
| L-5  | **Request recovery is same-browser only** (by owner decision)                                                | Another browser, Incognito or another device cannot reopen the request. A request sent from a **signed-in** tab is not kept; use the visitor tab.                                   | By design                     |

Minor observations from this run (none blocks the test):

| ID  | Observation                                                                                                                                                                                | Evidence                                      |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------- |
| O-1 | The submit dialog for a one-question assessment reads "All **1 questions** are answered." (plural)                                                                                         | `handson/out/out-15.txt` (B)                  |
| O-2 | Unrounded pass marks: "pass mark 1.5" and "50% · 1.5 of 3 marks" for the 3-mark choice-only assessment. Rounding is still open (M22); this is not new.                                     | `out-18.txt`, `out-19.txt`, shots `044`/`049` |
| O-3 | The course-scoped CM's Content library reads "In the catalogue 1 · **Across 6 courses**", with a course filter listing every course (earlier D-4, unchanged)                               | `out-22.txt`                                  |
| O-4 | **Give more access**, started from a student's record, does not preselect the student again ("0 students selected") (earlier D-7, unchanged)                                               | `out-12.txt`                                  |
| O-5 | The "You have a request in progress" note disappears once access is active. This is the designed rule ("nothing once access is active"); the status address keeps working in this browser. | `out-23.txt`, `out-26.txt`                    |
| O-6 | At 375 px the landing header shows **Catalogue** instead of **Browse the catalogue**. The full label is in the hero. This is the designed short label.                                     | `out-25.txt`, shot `062`                      |

---

## 11. Reset and recovery

| Situation                                                       | What to do                                                                                                                                                                        |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Start again from a clean world                                  | Test window: `http://localhost:3363/prototype/reset` → **Reset demo data** → **Reset demo data**. Every tab is signed out, and the selection and kept request ticket are cleared. |
| A tab shows the sign-in page unexpectedly                       | You reloaded or typed an address in a signed-in tab. Sign in again: you return to that page. Nothing is lost.                                                                     |
| You closed the visitor tab mid-request                          | Open a new tab → `http://localhost:3363/selection` → **Check request status** (verified, T7)                                                                                      |
| You used **Request more information** by mistake                | That request is a dead end (P1-E). Reset, and repeat steps 1–10.                                                                                                                  |
| You picked the wrong Vendor scope                               | Assign **A course** on the holder page. If the Vendor still can't act, reset.                                                                                                     |
| You assigned the wrong Institute Admin                          | It can't be replaced (INST-06). Reset.                                                                                                                                            |
| The page says "We can't find that page" for `/requests/rq-0011` | You are in another browser or Incognito, the world was reset, or the address is mistyped.                                                                                         |
| The server is down (the page doesn't load)                      | Run `start-hands-on.sh`. The world in the test profile is still there.                                                                                                            |
| You want to stop testing                                        | Close the test Chrome window and run `stop-hands-on.sh`. The test world stays in `~/XR-V3-hands-on-chrome-profile` for next time.                                                 |
| Something looks wrong in your everyday Chrome                   | Nothing in this guide touches it. **Never** reset on any other address.                                                                                                           |

---

## 12. Timings

| Step                                          | By hand (estimate) | Notes                                                                                |
| --------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------ |
| 0 Reset + baseline                            | 1–2 min            |                                                                                      |
| 1–2 Area + course                             | 3 min              |                                                                                      |
| 3 Course code                                 | 2 min              | one sign-out and one sign-in                                                         |
| 4–6 Vendor, Reviewer, CM + scopes             | 6–7 min            |                                                                                      |
| 7 Experiment                                  | 5 min              | the most typing                                                                      |
| 8 Submit → return → revise → approve          | 8 min              | 4 sign-ins                                                                           |
| 9 Publish + public check                      | 3 min              |                                                                                      |
| 10 Request (4 experiments) + tries T1–T4      | 4 + 3 min          |                                                                                      |
| 11 External approval + payment + tries T5–T12 | 3 + 4 min          |                                                                                      |
| 12 Institute Admin                            | 1–2 min            |                                                                                      |
| 13–14 People, courses, access                 | 7 min              |                                                                                      |
| 15 WEB activity + feedback                    | 4 min              |                                                                                      |
| 16 Four assessments (6 questions)             | 12 min             | about 3 min each                                                                     |
| 17 Four submissions                           | 6 min              |                                                                                      |
| 18 Marking (A, B, D with refusals, C)         | 8 min              | +3 min for the optional second attempt                                               |
| 19 Results, progress, usage                   | 4 min              |                                                                                      |
| 20 Correction (optional)                      | 6 min              |                                                                                      |
| 21 Reset                                      | 1 min              |                                                                                      |
| **Total**                                     | **≈ 95–105 min**   | About 70 min without step 20, the second attempt and the optional tries T2/T4/T6/T11 |

For reference, the automated run of steps 0–21 on 3363, including every recovery try, took **about 9.5 min of real time** (20:14:17 → 20:23:51 wall clock). The sample clock read 10:00 at reset and 10:08 at the last mark. Server responses were immediate: a sign-in took about 0.3 s, and the landing loaded and settled in about 2 s.

---

## 13. Verification record (3363, 24 Oct 2026)

| Step                                                                                                                                                                                | Result | Evidence                                        |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ----------------------------------------------- |
| 0 Reset, 12 experiments, AREAS 3/5/12                                                                                                                                               | PASS   | `out-1`, shot `001`                             |
| 1–2 Area, course, empty-field errors                                                                                                                                                | PASS   | `out-2`, shots `002`–`003`                      |
| 3 Code: duplicate refused, CE ZG514 saved                                                                                                                                           | PASS   | `out-3`, shot `004`                             |
| 4–6 Vendor, Reviewer, CM + course scopes; e-mail duplicate refused                                                                                                                  | PASS   | `out-3`, shots `005`–`007`                      |
| 7–8 Experiment, https check, return, revise, approve with 3 outcomes                                                                                                                | PASS   | `out-4`, shots `008`–`009`                      |
| 9 Publish; 13 experiments; AREAS 4/6/13; public page                                                                                                                                | PASS   | `out-5`, shots `010`–`011`                      |
| 10 Request REQ-0042; recovery T1–T4 while Submitted                                                                                                                                 | PASS   | `out-6`, `out-7`, shots `012`–`015`             |
| 11 External approval; live update; T5 reload after approval; T6; T7 close and reopen the tab; payment; Access active ACC-0107; one request and one institution                      | PASS   | `out-8`, `out-9`, shots `016`–`021`             |
| 11 T11 another browser cannot recover; Internal alternative                                                                                                                         | PASS   | `out-10`, shots `022`–`023`                     |
| 12 Requester e-mail refused before; IA assigned                                                                                                                                     | PASS   | `out-11`, shot `024`                            |
| 13–14 Student, Faculty, course mappings, 4 grants; live Home update                                                                                                                 | PASS   | `out-11`, `out-12`, shots `025`–`026`           |
| 15 WEB activity completed; feedback                                                                                                                                                 | PASS   | `out-13`, shots `027`–`028`                     |
| 16 Four shapes created Ready                                                                                                                                                        | PASS   | `out-14`, shots `029`–`033`                     |
| 17 Four submissions; choice-only waiting wording                                                                                                                                    | PASS   | `out-15`, shots `034`–`036`                     |
| 18 Counts (Overview 4 + 1, rail 5, queue "4 written answers waiting · 1 submission to confirm"); A, B; D refused twice then confirmed once at 9/10; C confirmed at 3/3; queue empty | PASS   | `out-16`–`out-18`, shots `037`–`045`            |
| 18.8 B attempt 2 (9/10)                                                                                                                                                             | PASS   | `out-20`                                        |
| 19 Student Results ×4 and Progress; Faculty Overview, Students and detail; IA Usage and record                                                                                      | PASS   | `out-19`, `out-21`, `out-22`, shots `046`–`055` |
| 20 Correction 1.0 → 1.1 released                                                                                                                                                    | PASS   | `out-22`, shot `056`                            |
| 21 Reset; tabs signed out; ticket cleared; Priya refused                                                                                                                            | PASS   | `out-23`, shot `057`                            |
| Landing 1440 / 375: rotation about every 7.6 s, Pause/Play, Sign in, Browse the catalogue, Request institutional access → Your selection, no horizontal scroll                      | PASS   | `out-24`, `out-25`, shots `058`–`064`           |
| Release "After the deadline" / "On a date"; Confirm saves typed marks; note gone after Access active                                                                                | PASS   | `out-26`–`out-28` (separate world)              |
| Reload / typed address / new tab signs only that tab out; returnTo works                                                                                                            | PASS   | `out/reload-check.txt`                          |
| Console errors / requests to other ports                                                                                                                                            | 0 / 0  | `out-29`                                        |

Every Playwright context was fresh and disposable. The main world was reset at step 21 and closed. No file in `AR-VR-v3-ui` or `XR-V3-hands-on-test` was changed, nothing was built, and no git command was run. Your own Chrome profiles were never touched.
