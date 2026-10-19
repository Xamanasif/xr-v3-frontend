# Super Admin — V3 Refined B handoff

Foundation `XR-V3-RB-1.0`. 18 owned IDs. Presentation design only: Claude Code keeps the existing routes, services, permissions and shared world, and binds this layout to them.

## Shell and shared behaviour

- Rail destinations: Overview · Requests (count = requests under review) · Institutions · Content (tabs Updates / All content) · Academic structure · Platform roles (tabs Vendors / Reviewers / Content Managers) · Operations (tabs Device transfers / Support / Access ending) · Help & support. Below 1024 px the rail becomes the Menu drawer.
- Account menu, Help & support and the signed-out page are **borrowed XS contracts** (name and e-mail, Help & support, Sign out; GL-03 Report a problem + My reports; XS-03). Replace with the XS deliverables when available. Unknown records use the GL-04 message template.
- Internal references (REQ/ACC/UPD/DTR/SUP/SUB) never appear in visible text, tooltips or accessible names. Plans are named by content and term. Course codes (ME ZG523 …) stay. Student numbers (GIT-2026-0418) and device asset tags are institution data and are kept; confirm with the owner if they should also be hidden.
- Focus rules, dialogs and list states follow the V3 kit (see COMPONENT-EXTENSIONS.md).

## Screens, allowed actions and what Code must bind

| ID | Allowed actions | Must not exist | Bind to (existing contract, names to confirm in the repo) |
|---|---|---|---|
| SA-01 | Filter by category; open each item's destination | Invented KPIs, charts, urgency service rule | Same queries as each destination; count each item once. “Soonest deadline first, then longest wait” is a presentation proposal — use the approved deterministic ordering |
| SA-02 | Search, filter, sort, open | Decline | Request list query; status words per current disclosure rules |
| SA-03 | Approve; Approve a smaller scope (not renewal); Request more information. Internal/external chosen only for a new institution | Decline, Mark paid, first-activation copy on renewals | Decision command with optimistic revision; **read `planEffect`** — when it is policy-open, keep the copy that the plan is not changed here (already used for renewal and additional licences) |
| SA-06 | Search, status filter, open | Create institution | Institution list |
| SA-07 | Assign Institute Admin (active/ending/paused, no admin); Pause / Restore with reason; student status override with reason | Plan amendment, licence arithmetic, payment activation, invitations | Assign command must keep identity-collision protection (shown as a field error); pause/restore commands; history |
| SA-10/11 | Release (confirm); Hold (reason, confirm); Lift hold (confirm) | Release while held, “Publish”, editing the correction, any access change | Release/hold commands; live version changes only on release |
| SA-12/13 | Read; override a **stuck, non-published** record back to the vendor with reason | Edits to published content, Published as a target | Stuck = with reviewer and no reviewer in scope (derive from roles, as in the preview) |
| SA-14/15 | Add area, add course, rename, edit description, move course (blocked while people are filed) | Module layer, retire, artwork upload, editing platform course codes | Structure commands; course codes are read-only (Content Manager owns them) |
| SA-16/17 | Register holder (no invitation); assign scope (all / course / one experiment); withdraw with reason; restore | Identity takeover, new roles, invitations | Holder + scope commands; collision check on e-mail |
| SA-18/19 | Approve a forwarded transfer (confirm) | Decline, shipment/registration wording | Transfer approval command; a not-approved transfer stays Forwarded |
| SA-20/21 | Resolve with a reporter-visible note; Reopen (confirm) | Response-time targets | Support commands; same status words as the reporter side |
| SA-22 | Open the renewal request or the institution | Sending reminders | “Reminder due” is a status, not a message |

Every confirmed command handles a stale or repeated command: the preview shows the refusal “This record changed after you opened it — Nothing was saved” with “Check it again” (new copy, recorded as a proposal). Use the existing conflict wording if the repo has one.

## Out-of-role effects (handoff scenarios, not live here)

Requester sees Continue to payment · paused banner for the institution's people · Content Manager sees hold reason · vendor sees returned submission · reviewer queue changes with scope · student and Institute Admin see an approved transfer · reporter sees the note. Listed in `LINK-MAP.json › outOfRoleEffects`.

## Changes from the v46 visual treatment

Refined B shell and kit throughout; v46 page structure and copy kept. Plans shown as plan bands with the term timeline and the shared format cells (“In the plan / Not in the plan / Not published”). Institution actions moved into a “What you can do” panel; content, roles and operations decisions use the same decision panel as SA-03. Lists use the shared table with its three width layouts.

## Open decisions (not resolved here)

1. Konark, BITS Hyderabad plan and Godavari/Sahyadri sample conflicts — see `SCENARIOS.json › openConflictsNotResolved`.
2. Whether a renewal or additional-licence approval changes the plan (`planEffect` policy-open) — copy deliberately does not claim it.
3. What a hold affects and whether it blocks later corrections (T-28) — stated as open on screen.
4. How registered people and Institute Admins first sign in (T-11) — “nothing is sent”.
5. Licence counting (T-06 / D7) — no used/free counts shown.
6. Priority ordering on SA-01 — presentation proposal, not a service rule.
7. Whether student numbers and device asset tags count as internal IDs for the Super Admin rule.
8. Stale-decision refusal copy — new; confirm against the repo's conflict message.

## Sources

Pack `XR-V3-Super-Admin-Reference-Pack`: common/01–05, ROLE-SCOPE, V3 `SA01.dc.html`, `SA02.dc.html`, `rb-kit.css`, `HANDOFF-original.md`; v46 boards B1-10, B1-11, B3-11, B7-01…B7-13, 05/07/08 shared boards. No React code was touched.
