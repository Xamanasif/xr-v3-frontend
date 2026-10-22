# XR Learning Platform V3 — stakeholder demo guide

For presenting the V3 frontend (commit `4c0f180`, branch `v3/refined-b-ui`) to the Project Manager
and stakeholders. **The frontend is not yet stakeholder-approved or frozen.** This guide shows what
exists today; it does not add or fake anything.

Every step below was run end to end against the same build on 22 Oct 2026 (one shared sample
world, the stakeholder order, about five minutes of automated clicking, no console error).

## 1. Before the meeting (5 minutes)

1. Open Terminal and start the demo servers:

   ```bash
   /Users/mymac/Desktop/XR-V3-stakeholder-demo/demo-tools/start-demo.sh
   ```

   It starts three local servers of the same verified build (ports 3300 and 3330 are never used):

   | Address                                 | What it is                                                |
   | --------------------------------------- | --------------------------------------------------------- |
   | http://localhost:3360/                  | **Mode A — clean world**: the full end-to-end walkthrough |
   | http://localhost:3361/                  | **Mode B — prepared showcase**: populated dashboards      |
   | http://localhost:3369 (helper, no page) | hands the prepared worlds to Mode B                       |

   To stop them afterwards: `/Users/mymac/Desktop/XR-V3-stakeholder-demo/demo-tools/stop-demo.sh`.

2. Use **one** browser window for the demo (Chrome recommended). Each address keeps its own sample
   world in that browser, so Mode A and Mode B never interfere. A second browser or a private
   window starts its own, empty world.
3. Mode A: open http://localhost:3360/prototype/reset → **Reset demo data** → confirm. The world is
   now at its starting state and everyone is signed out.
4. Mode B: open http://localhost:3361/, open the browser console (Chrome: View → Developer →
   JavaScript Console; if Chrome asks, type `allow pasting` first), paste ONE line and press
   Enter — the page reloads with the prepared world:

   - **Everything done** (published experiment, institution onboarded, the Student has learned,
     been assessed and marked, a device transfer approved):

     ```js
     fetch('http://localhost:3369/complete')
       .then((r) => r.text())
       .then((v) => {
         localStorage.setItem('xr.sample-world', v);
         location.reload();
       });
     ```

   - **Onboarded only** (published, purchased, Institute Admin set up Faculty and Student — the
     Student and Faculty have not started yet):

     ```js
     fetch('http://localhost:3369/onboarded')
       .then((r) => r.text())
       .then((v) => {
         localStorage.setItem('xr.sample-world', v);
         location.reload();
       });
     ```

   The prepared worlds were made by running the real workflows of this build (no seed change, no
   code change); they contain no password or session.

**Signing in (both modes):** http://localhost:336x/sign-in → the sample e-mail → **any non-empty
password** (the local prototype's sample sign-in; an empty password is refused, an e-mail the world
does not hold is refused with “The e-mail or password isn’t right”). Sign out from the account menu
(top right) before the next person. A page reload signs the tab out but keeps the world.

| Role                       | Sample e-mail                   | Exists                            | Lands on              |
| -------------------------- | ------------------------------- | --------------------------------- | --------------------- |
| Super Admin                | `arjun.mehta@wilp.example`      | from the start                    | `/admin` Overview     |
| Vendor                     | `anil.shetty@northline.example` | from the start                    | `/vendor` Overview    |
| Academic Reviewer          | `a.menon@wilp.example`          | from the start                    | `/reviewer` Overview  |
| Content Manager            | `kavya.nair@wilp.example`       | from the start                    | `/content-manager`    |
| Institute Admin (Malnad)   | `v.hegde@malnad.example`        | from the start                    | `/institute` Overview |
| Institute Admin (Godavari) | `meera.iyer@godavari.edu.in`    | after the Super Admin assigns her | `/institute` Overview |
| Faculty                    | `s.ranganathan@godavari.edu.in` | after Meera adds him              | `/faculty` Overview   |
| Student                    | `rahul.verma@godavari.edu.in`   | after Meera adds him              | `/student` Home       |

Two browser tabs make the demo smoother: **Visitor** (the public website, never signed in) and
**Staff** (each person signs in here in turn).

## 2. Full end-to-end walkthrough (Mode A, http://localhost:3360, about 35–45 minutes)

The order follows the business: an experiment is created, reviewed and published; an institution
requests access and pays; the institution sets up its people; Faculty teach; the Student learns.

### Journey A — Public discovery (Visitor tab)

| Do                                                                                     | Expect                                                                                                                                                      |
| -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Open http://localhost:3360/                                                            | The public landing: “Set the conditions. See what follows. Understand why.”, engineering areas, featured experiments, the four formats, “For institutions”. |
| Header **Browse experiments**                                                          | The catalogue of 12 published experiments with area and format filters.                                                                                     |
| Header **Areas** → **Mechanical & Manufacturing** → **Thermodynamics & Heat Transfer** | The area and its course with its experiments.                                                                                                               |
| **Shell-and-Tube Heat Exchanger**                                                      | The experiment page: ME ZG523 · Thermodynamics & Heat Transfer, “Available in” WEB / AR / VR, learning outcomes, formats and device needs.                  |
| Header **For institutions**                                                            | The four steps of institutional access, **Request institutional access**.                                                                                   |
| Header **Sign in**                                                                     | The sign-in page (sample e-mail + any password).                                                                                                            |

### Journey B — The Vendor creates an experiment (Staff tab)

| Do                                                                                                                                                                                                                            | Expect                                                                                                |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Sign in `anil.shetty@northline.example` → **Create experiment**                                                                                                                                                               | The guided editor; the Course list offers only the vendor's authorised course ME ZG523.               |
| Press **Save draft** with nothing filled                                                                                                                                                                                      | “Enter a name to save a draft” (validation).                                                          |
| Course ME ZG523; Experiment name **Conduction Through a Composite Wall**; a summary, a description, version `1.0` → **Save draft**                                                                                            | “Draft saved”; the draft is now in My experiments.                                                    |
| **Continue** → tick **WEB Browser** and **VR Virtual reality**; web link `https://labs.northline.example/composite-wall`; browser need; VR package label, reference, device need, install notes → **Continue** → **Continue** | “Check and submit”. (A web link without `https://` is refused; continuing with no format is refused.) |
| **Submit for academic review** → confirm                                                                                                                                                                                      | “Submitted for academic review”; My experiments shows **With Academic Reviewer**.                     |

### Journey C — Academic review, return and resubmit

| Do                                                                                                                                                                                                                                                                               | Expect                                                                                 |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Sign out; sign in `a.menon@wilp.example` → **Review queue** → **Conduction Through a Composite Wall**                                                                                                                                                                            | The submission with its content, formats and delivery details.                         |
| Choose **Return to vendor**, reason “Please name the VR headsets it runs on.”, tick the VR device need → **Return to vendor**                                                                                                                                                    | “Returned to vendor”.                                                                  |
| Sign in as Anil → **My experiments** → the experiment (“Returned by the Academic Reviewer”) → **Revise** → **Go to …Device need** → change it (e.g. “Meta Quest 3 standalone headset — no PC needed.”) → **Save changes** → **Continue** → **Continue** → **Resubmit** → confirm | “Submitted” (revision 2).                                                              |
| Sign in as Prof. Menon → **Review queue** → the experiment (“Resubmitted, revision 2”) → add three learning outcomes → **Approve** → confirm                                                                                                                                     | The dialog says “Approving does not publish.” → “Approved — with the Content Manager”. |

### Journey D — Publication

| Do                                                                                                                                  | Expect                                                                                                                                                                 |
| ----------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sign in `kavya.nair@wilp.example` → **Ready to publish** → open the publication decision for the experiment → **Publish** → confirm | “Published” and “Publishing gave no one access.” Approval and publication are separate events (the Vendor saw “With Content Manager” after approval, “Published” now). |
| Visitor tab → **Browse experiments**                                                                                                | The catalogue lists **Conduction Through a Composite Wall** with its outcomes.                                                                                         |

### Journey E — Institutional request, approval, payment stand-in, Institute Admin

| Do                                                                                                                                                                                                                                 | Expect                                                                 |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Visitor: the new experiment → tick Browser and Virtual reality → **Add to selection**; **Shell-and-Tube Heat Exchanger** → tick Browser and Virtual reality → **Add to selection** → **Go to selection** → **Continue to request** | “Your selection” with 2 experiments.                                   |
| Godavari Institute of Technology, Meera Iyer, `meera.iyer@godavari.edu.in`, 120 licences, Yearly → **Review request** → **Submit request** → **Check request status**                                                              | “Request sent” with its reference; status “Submitted”.                 |
| Staff: sign in `arjun.mehta@wilp.example` → Overview → **Open the new access request from Godavari Institute of Technology** → Approve, External → **Approve request** → confirm                                                   | “Approved — payment required”; the visitor's status page changes too.  |
| Visitor: **Continue to payment** → **Continue to payment**                                                                                                                                                                         | “Access active” — **the payment is a local stand-in, no money moves.** |
| Arjun → **Institutions** → Godavari → **Assign Institute Admin**: Meera Iyer, her e-mail → **Assign**                                                                                                                              | “Institute Admin: Meera Iyer”.                                         |

### Journey F — Institute Admin setup

| Do                                                                                                                                                                                                               | Expect                                                                                            |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Sign in `meera.iyer@godavari.edu.in`                                                                                                                                                                             | Overview “Access active”.                                                                         |
| **Content access**                                                                                                                                                                                               | Both experiments of the plan, Active; **View plan** shows the access plan (120 licences, yearly). |
| **People** → **Add student**: Rahul Verma, `rahul.verma@godavari.edu.in`, GIT-2026-0418 → **Add student** → **Give this student access** → tick both experiments → **Continue** → **Continue** → **Give access** | “Access given”, both Active. (Only experiments in the plan can be given.)                         |
| **People** → **Faculty** → **Add faculty member**: Dr S. Ranganathan, `s.ranganathan@godavari.edu.in` → **Assign a course** → ME ZG523 → **Assign course**                                                       | “Dr S. Ranganathan now teaches ME ZG523.”                                                         |
| Optional: **People** → **Import students**                                                                                                                                                                       | A three-step CSV import with a template (no invitation or e-mail is sent).                        |

### Journey H (part 1) — The Student learns

| Do                                                                                  | Expect                                                                                        |
| ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Sign in `rahul.verma@godavari.edu.in`                                               | Home “Hello, Rahul”, the experiment to continue.                                              |
| **My courses** → the course → **Open experiment Shell-and-Tube Heat Exchanger**     | The experiment hub (Overview, Resources, Simulation, Assessment, Progress).                   |
| **Simulation** → **Open WEB** → **Launch WEB**                                      | A new tab: “Sample WEB activity — Simulated for this prototype”. The hub reads “In progress”. |
| In the activity: run three trials, answer, **Finish activity**; back to Rahul's tab | “Completed”, “Reported by the simulation at …”.                                               |
| **Give feedback on WEB** → rate the five statements → **Submit feedback**           | “Feedback on WEB sent”.                                                                       |

### Journey G and H (part 2) — Faculty assessment, attempt, marking, result

| Do                                                                                                                                                                                      | Expect                                                                                                                                                                                                                                     |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Sign in `s.ranganathan@godavari.edu.in` → **My courses** → the course → Shell-and-Tube's **Open experiment** → **Create assessment**                                                    | The guided steps. Name “Heat Exchanger — post-lab”, pass mark 50 %, 2 attempts, a deadline, release **Immediately after marking**; **New question** (multiple choice, two options, the right one ticked, 2 marks) → **Create assessment**. |
| **Open assessment** → **Questions** → **New question** (written answer, 10 marks) → **Add this question to the assessment**                                                             | “2 questions · 12 marks”.                                                                                                                                                                                                                  |
| Sign in as Rahul → **Assessments** (“To do, 1”) → the assessment → **Start assessment** → answer → **Submit** → **Submit answers**                                                      | “Answers submitted” → “Submitted — waiting for marking”.                                                                                                                                                                                   |
| Sign in as Dr Ranganathan → **Marking** → **Mark Rahul Verma** → the choice question is marked automatically; give the written answer a mark and feedback → **Confirm marks** → confirm | “Marks confirmed”.                                                                                                                                                                                                                         |
| Sign in as Rahul → **Assessments** → **Results** → **See result**                                                                                                                       | “You passed” with the feedback.                                                                                                                                                                                                            |
| Optional: Dr Ranganathan → **Students** → choose **Shell-and-Tube Heat Exchanger** in the Experiment filter → **Open Rahul Verma**                                                      | Rahul's progress and mark for that experiment.                                                                                                                                                                                             |

Optional device chain (about 3 minutes): Rahul → account menu → **My device** → request a transfer →
Meera → **Requests** → device requests → **Forward to BITS** → Arjun → **Operations** → device
transfers → **Approve** → Rahul's My device shows the new device.

## 3. Executive demonstration (Mode B, http://localhost:3361, about 15 minutes)

Load the **Everything done** world (§1 step 4). Nothing is typed; every screen shows real results of
the workflows above. Sign in and out as listed.

1. **Public website** (not signed in): the landing → **Browse experiments** — the vendor's new
   experiment is listed beside the 12 others → an experiment page (course, formats, outcomes) →
   **For institutions** (how access works).
2. **Vendor** `anil.shetty@northline.example`: Overview and **My experiments** — the new experiment
   **Published**; open its record: the history (submitted, returned with a reason, revised,
   approved, published).
3. **Academic Reviewer** `a.menon@wilp.example`: **Review queue** and **Reviewed by me** — the
   decision and its outcomes; approval is not publication.
4. **Content Manager** `kavya.nair@wilp.example`: Overview, **Library** (Published 13) — the
   publication decision is the Content Manager's.
5. **Super Admin** `arjun.mehta@wilp.example`: Overview, **Requests** (Godavari's approved request),
   **Institutions** → Godavari (plan: 2 experiments, 120 licences; Institute Admin Meera Iyer),
   **Operations** (the approved device transfer).
6. **Institute Admin** `meera.iyer@godavari.edu.in`: Overview, **Content access** (the plan),
   **Student access** (Rahul), **People** (students, faculty, course assignment), **Usage**.
7. **Faculty** `s.ranganathan@godavari.edu.in`: Overview, **My courses**, **Assessments** (the
   post-lab, marked), **Marking**, **Students** (pick Shell-and-Tube in the filter).
8. **Student** `rahul.verma@godavari.edu.in`: Home, the experiment hub, **Progress** (WEB completed,
   feedback sent), **Assessments** → **Results** → “You passed”, account menu → **My device**.

To show one live action without data entry, load the **Onboarded only** world instead and do Journey
H part 1 (the Student launches the sample WEB activity) live.

## 4. Recovery and reset

| Situation                                                                         | What to do                                                                                                                                |
| --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| A page shows you are signed out after a reload                                    | Expected (a reload signs the tab out; the world is kept). Sign in again.                                                                  |
| “The e-mail or password isn’t right” for Meera, Rahul or Dr Ranganathan in Mode A | They do not exist yet: finish Journey E/F first (or use Mode B). Check the e-mail spelling.                                               |
| A step went wrong in Mode A                                                       | Continue from the step where you are (the world keeps everything), or reset: http://localhost:3360/prototype/reset → **Reset demo data**. |
| Mode B world was changed during the demo                                          | Paste the loader line again on http://localhost:3361/ — it replaces the world.                                                            |
| Resource links open “This site can’t be reached”                                  | Expected: the sample resource links are placeholders (`.example` addresses).                                                              |
| A server does not answer                                                          | `stop-demo.sh`, then `start-demo.sh`.                                                                                                     |
| Start over completely                                                             | Mode A: `/prototype/reset`. Mode B: paste the loader line again.                                                                          |

## 5. What to say about the prototype (accurately)

- This is a **local frontend prototype** on sample data in one browser; not deployed, not
  production-ready, no backend.
- **Sign-in** is a sample stand-in (sample e-mail + any password); “Sign in with your institution”
  is shown but not connected; no e-mail is sent anywhere.
- **Payment** is a local stand-in; no money moves.
- **The sample WEB activity** stands in for a real simulation (the same activity for every
  experiment); real simulation content (WEB, AR, VR, MR builds) is an external dependency. The
  illustrative simulation stages of the design prototypes are not product data and are not shown.
- **Resource links** in the sample data are placeholders.
- **The Public Landing:** the demo build (3360/3361) still serves the earlier simplified homepage;
  the approved premium landing with the official WILP logo is integrated and awaiting the owner's
  acceptance on its own review build (http://localhost:3362/). The other pages still show the
  reserved logo slot.
- Some screens show honest “still open” notes for decisions not yet taken (e.g. how licences are
  counted; prototype field sets) — these are intentional.
