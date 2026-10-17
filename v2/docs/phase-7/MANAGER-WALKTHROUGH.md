# Manager walkthrough — XR Learning Platform, local prototype (Phase 7)

A 10–15 minute live demonstration of the connected frontend prototype, on this Mac only. Every step
uses the product's own screens. The data is sample data, kept in the browser (TE-6). There is no
backend, real sign-in, payment, XR runtime or device registry. Nothing is deployed.

## 1 · Start it (before the meeting, ~2 minutes)

```bash
cd /Users/mymac/Desktop/AR-VR-frontend-v46/v2
pnpm build
pnpm --filter @xr/web start
```

1. Open `http://localhost:3000/prototype/reset`.
2. Press **Reset demo data** and confirm. Every tab now starts from the beginning, signed out.
3. Open two browser windows side by side, both at `http://localhost:3000`:
   - **Public** (left): the institution contact. Never sign in here.
   - **Staff** (right): each person signs in here in turn, through **Sign in**.
     The windows share one sample world, and each keeps its own sign-in. A change made in one window
     shows in the other the next time that page reads, usually at once.

**Sign-in.** Use the sample e-mail and any non-empty password. These are sample identities of the
local prototype, not real accounts. Sign out from the account menu (top right) before the next
person signs in.

| Person                     | Role              | Sample e-mail                   |
| -------------------------- | ----------------- | ------------------------------- |
| Arjun Mehta                | Super Admin       | `arjun.mehta@wilp.example`      |
| Meera Iyer (assigned in B) | Institute Admin   | `meera.iyer@godavari.edu.in`    |
| Rahul Verma (added in B)   | Student           | `rahul.verma@godavari.edu.in`   |
| Anil Shetty                | Vendor            | `anil.shetty@northline.example` |
| Prof. A. Menon             | Academic Reviewer | `a.menon@wilp.example`          |
| Kavya Nair                 | Content Manager   | `kavya.nair@wilp.example`       |

## 2 · The walkthrough (about 12 minutes)

**1. Flow A — an institution asks for access** (Public window, then Staff)

- **Do (Public):** **Browse experiments** → **Shell-and-Tube Heat Exchanger** → tick Browser and
  Virtual reality → **Add to selection** → **Go to selection**.
  **See:** "Your selection".
- **Do (Public):** **Continue to request**. Enter Godavari Institute of Technology, Meera Iyer,
  `meera.iyer@godavari.edu.in`, 120 licences, Yearly. Then **Review request** → **Submit request** →
  **Check request status**.
  **See:** "Request sent" with REQ-0042, then the status "Submitted".
- **Do (Staff):** sign in as Arjun. Overview → **Open: REQ-0042** → Approve → External →
  **Approve request** → confirm.
  **See:** "Approved — payment required". The Public status page changes to the same words.
- **Do (Public):** **Continue to payment** → **Continue to payment** (the local sample payment
  stand-in; no money moves).
  **See:** "Access active", access plan ACC-0107.

**2. Flow B — the institution gives a Student access** (Staff)

- **Do:** Arjun → **Institutions** → Godavari → **Assign Institute Admin**: Meera Iyer,
  `meera.iyer@godavari.edu.in`. Sign out, then sign in as Meera.
  **See:** Overview "Access active".
- **Do:** **People** → **Add student**: Rahul Verma, `rahul.verma@godavari.edu.in`, GIT-2026-0418 →
  **Give this student access** → tick Shell-and-Tube → **Continue** → **Continue** → **Give access**.
  Then sign out.
  **See:** "Access given": Rahul, Active. Publication alone never gives anyone access.

**3. Flow C — the Student learns** (Staff, plus the tab the activity opens)

- **Do:** sign in as Rahul → **Open Shell-and-Tube Heat Exchanger** → **Simulation** → **Open WEB** →
  **Launch WEB**.
  **See:** a new tab, "Sample WEB activity — Simulated for this prototype". Rahul's page now reads
  "In progress".
- **Do (activity tab):** run three trials at different levels, answer the check question (the
  highest level gives the highest value) → **Finish activity**. Go back to Rahul's tab.
  **See:** WEB "Completed", "Reported by the simulation at …", and **Give feedback on WEB**.
  Launching or opening the activity never completes it.
- **Do:** **Give feedback on WEB** → rate the five statements → **Submit feedback**.
  **See:** "Feedback on WEB sent".

**4. Flow E — new content is published** (Staff)

- **Do:** as Anil → **Create experiment**: course ME ZG523, "Conduction Through a Composite Wall",
  summary, description, version 1.0 → **Save draft** → **Continue** → tick Browser (WEB), give its web link and the browser it needs → **Continue** → **Continue** → **Submit for academic review**.
  **See:** "Submitted for academic review".
- **Do:** as Prof. Menon → **Review queue** → **Review …** → add learning outcomes → **Approve**.
  **See:** "Approved — with the Content Manager".
- **Do:** as Kavya → **Ready to publish** → **Open decision …** → **Publish**.
  **See:** "Published" and "Publishing gave no one access". The Public catalogue lists it; Meera's
  Content access does not.

**5. Flow F — a correction is released** (Staff, then Public)

- **Do:** as Kavya → **Content library** → **Published** → Shell-and-Tube → **Edit catalogue
  details** → change the name → **Save draft** → **Send for academic review**.
- **Do:** as Prof. Menon → **Review queue** → **Review …** → **Approve update**.
  **See:** nothing changes publicly; approval releases nothing.
- **Do:** as Arjun → the Overview names the correction → **Release update**.
  **See:** the Public experiment page and Rahul's experiment show the new name, and his access is
  unchanged. **Hold** with a reason instead keeps the old version live.

**6. Close**

- **Do:** refresh either window.
  **See:** everything is still there and you are signed out (TE-6).

**Optional, if time allows (about 2 minutes each):**

- **Device transfer (P3-03).** Rahul → account menu → **My device**. It shows the pre-authorised
  sample VR headset GIT-VR-03. Choose **Request a device transfer**, enter a new device and **Send
  request** ("With your Institute Admin"). Meera → Overview → **Open requests** → **Review** →
  **Forward to BITS**. Arjun → **Operations** → **Device transfers** → **Review** → **Approve
  transfer**. Rahul's My device then reads "Approved" and shows the new device.
- **Assessment (Flow D).** Meera adds Faculty Dr S. Ranganathan (`s.ranganathan@godavari.edu.in`)
  and assigns ME ZG523. He creates an assessment from the experiment, released "Immediately after
  marking". Rahul attempts and submits it. Ranganathan marks the written answer and confirms. Rahul
  sees "You passed".
- **Returns and holds.** The reviewer can return a submission with a reason; the Vendor then
  revises and resubmits it as revision 2. The Super Admin can hold a correction and lift the hold.

## 3 · What to say about the limits

- This is a local prototype on sample data in one browser; it is not deployed and not
  production-ready.
- The sign-in, the payment confirmation, the WEB activity and the pre-authorised device are
  authorised local stand-ins. A real identity provider, payment provider, XR runtime and device
  registry are not part of it.
- The data stays in this browser until **Reset demo data**. Another browser or computer starts
  its own world.
- A refresh signs that window out. It also closes the requester's status page, because the
  request ticket is deliberately never kept. So during Flow A, do not refresh the Public window
  until the payment step is done. The Super Admin still sees the request.
