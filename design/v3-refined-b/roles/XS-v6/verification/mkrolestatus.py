# Writes ROLE-STATUS.json for the XS package. Evidence IDs refer to CHECKS.md §3.
import json, sys
out = sys.argv[1]
NT = "Inside the claude.ai canvas itself; Firefox and Safari; screen readers (see CHECKS.md §5)"
doc = {
 "role": "XS · Entry & shared",
 "foundation": "XR-V3-RB-1.0",
 "delivered": "2026-10-18",
 "owned_designed_ids": 7,
 "designed_in_this_package": 7,
 "excluded": [{"id": "XS-02", "screen": "Choose workspace (person with several roles)", "reason": "designed:false · DEFER by prior decision; not designed, no switcher anywhere"}],
 "overall": {
  "DESIGN COMPLETE": "yes · 7 of 7 owned IDs",
  "CONNECTED PREVIEW COMPLETE": "yes · project/Main.dc.html carries all seven IDs in one role-preview state",
  "ASSEMBLY PENDING": "yes · role packages place the shared components; Claude Code binds them to the app's existing session, Help/support and permission services",
  "OWNER APPROVAL PENDING": "yes · visual acceptance not given yet"
 },
 "live_entry": "project/Main.dc.html (canvas board 'Live role preview · starts at Sign in')",
 "shared_contract": "SHARED-CONTRACT.json v1.0.0 (exported early; still current)",
 "screens": [
  {
   "id": "XS-01", "screen": "Sign in", "kind": "page", "v46_route_proposal": "/sign-in",
   "v46_sources": ["B1-09-Sign-In.dc.html"],
   "v3_source": ["project/XsSignIn.dc.html", "project/Main.dc.html"],
   "boards": ["Main.dc.html", "XS01-SignIn-States.dc.html", "XS01-SignIn-768.dc.html", "XS01-SignIn-Errors-375.dc.html", "XsSignIn.dc.html"],
   "states": ["default (institution sign-in, then e-mail sign-in)", "missing details: summary + field errors", "wrong details: password cleared, e-mail kept, focus to the message", "signing in: busy, announced, a second press is ignored", "institution sign-in unavailable", "institution sign-in starting (inspection only; needs an identity provider, T-10)", "prototype line"],
   "connected": "A sample e-mail with any password lands on the role home, the kept return address, XS-06 or an XS-08 refusal; Back to experiments and Request institutional access open labelled public slots",
   "evidence": {
    "rendered": "1440 · 1024 · 768 · 375 (default and missing details), 320 and 375 with long input; boards XS01-*",
    "logic_tested": ["J1 validation, unknown e-mail, case-insensitive e-mail with a trailing space, busy, landing", "J5 institution sign-in, public links", "K1 tab order, summary links, Show/Hide, Enter submits", "K1b, F2 institution sign-in by keyboard", "L8d alone: every attempt reads isn’t right", "L10b second press ignored", "SW all eight sample sign-ins"],
    "axe": "0 violations (wcag2a/aa/21aa/22aa) at 4 widths, default and missing details",
    "not_tested": NT
   },
   "status": "DESIGN COMPLETE · CONNECTED PREVIEW COMPLETE · OWNER APPROVAL PENDING"
  },
  {
   "id": "XS-03", "screen": "Signed out / session expired", "kind": "page", "v46_route_proposal": "/signed-out",
   "v46_sources": ["B1-09-Sign-In.dc.html"],
   "v3_source": ["project/XsSignIn.dc.html", "project/Main.dc.html"],
   "boards": ["XS03-SignedOut-375.dc.html", "XS03-SessionExpired-1024.dc.html", "XS01-SignIn-States.dc.html"],
   "states": ["signed out: confirmation, focus on the notice", "session ended: the return address is shown and kept (the e-mail is not pre-filled: no stored identity)"],
   "connected": "Account menu › Sign out in every workspace → signed out. Session-ended board: Rahul returns to his experiment, Meera gets XS-06, Sneha the inactive refusal, paused Rahul the paused refusal",
   "evidence": {
    "rendered": "1440 · 1024 · 768 · 375 (signed out and session ended)",
    "logic_tested": ["J1, K3, SW sign out from every workspace", "J2 other workspace → XS-06", "J2b own workspace → kept page", "J3 paused → refusal; the notice stays after signing out and in", "J4 inactive → refusal", "F2 reports kept per person across sign-out"],
    "axe": "0 violations at 4 widths, both states",
    "not_tested": NT
   },
   "status": "DESIGN COMPLETE · CONNECTED PREVIEW COMPLETE · OWNER APPROVAL PENDING"
  },
  {
   "id": "XS-04", "screen": "First-time activation · Forgot password", "kind": "state", "v46_route_proposal": "/sign-in (links only — flows OPEN)",
   "v46_sources": ["B1-09-Sign-In.dc.html"],
   "v3_source": ["project/XsSignIn.dc.html"],
   "boards": ["XS01-SignIn-States.dc.html (Forgot password and first time)", "Main.dc.html", "every sign-in board"],
   "states": ["Forgot your password? open: Contact your institution administrator to reset it.", "First time signing in? open: Contact your institution administrator to find out how to sign in for the first time."],
   "connected": "Both disclosures work on every sign-in surface. Nothing is sent; no reset or invitation flow exists (T-11 / R02 open)",
   "evidence": {
    "rendered": "375 and 1440 with both open (1440 also with institution sign-in unavailable); gallery card",
    "logic_tested": ["J5 open/close, aria-expanded, text", "K1 both reachable by Tab"],
    "axe": "0 violations at 375 and 1440 with both disclosures open (L6, L6b)",
    "not_tested": NT
   },
   "status": "DESIGN COMPLETE (policy-open state) · CONNECTED PREVIEW COMPLETE · OWNER APPROVAL PENDING"
  },
  {
   "id": "XS-05", "screen": "Account menu: name, role, institution, Help, Sign out", "kind": "menu", "v46_route_proposal": "(top bar) account menu",
   "v46_sources": ["05-Workspace-Shell.dc.html", "06-Sidebar-Variants.dc.html"],
   "v3_source": ["project/XsAccountMenu.dc.html", "project/Main.dc.html"],
   "boards": ["XS05-Menus.dc.html", "XS05-Student-1440.dc.html", "XS05-SuperAdmin-1024.dc.html", "XS05-InstituteAdmin-375.dc.html", "XsAccountMenu.dc.html"],
   "states": ["closed", "open · Student with a device (My device)", "open · Student without one, and inactive", "open · Faculty and Institute Admin (institution line)", "open · Vendor (vendor organisation line)", "open · Academic Reviewer, Content Manager, Super Admin (no organisation line)"],
   "connected": "In all seven workspaces: Help & support, My device (Rahul) and Sign out",
   "evidence": {
    "rendered": "1440 · 1024 · 768 · 375 open; long names at 1440 and 375",
    "logic_tested": ["K3 focus entry, ArrowUp/Down, Home, End, Escape returns focus, ArrowDown and Space open, Tab out closes", "K3b click inside keeps it open; outside click closes and returns focus", "L1 My device", "L8 specimen note", "SW items and accessible name for all eight people", "K7 no animation under reduced motion"],
    "axe": "0 violations with the menu open at 4 widths",
    "not_tested": NT
   },
   "status": "DESIGN COMPLETE · CONNECTED PREVIEW COMPLETE · ASSEMBLY PENDING (role shells wire the account button, patch XS-P3) · OWNER APPROVAL PENDING"
  },
  {
   "id": "XS-06", "screen": "Not your workspace", "kind": "page", "v46_route_proposal": "/[workspace]/not-allowed",
   "v46_sources": ["08-System-Messages.dc.html"],
   "v3_source": ["project/XsMessage.dc.html", "project/Main.dc.html"],
   "boards": ["XS06-InstituteAdmin-1440.dc.html", "XS06-Student-375.dc.html", "XS08-Notices.dc.html", "XS03-SessionExpired-1024.dc.html", "XsMessage.dc.html"],
   "states": ["one template for every workspace (rendered for Student, Institute Admin and Super Admin; exercised for Institute Admin and Super Admin)", "Super Admin: no record IDs"],
   "connected": "Session-ended board: a different person signs in → XS-06 inside their own shell → Back to their home, or Help",
   "evidence": {
    "rendered": "1440 · 1024 · 768 · 375",
    "logic_tested": ["J2 no rail item current, H1 focus, Back to Overview", "L2 Help pre-fills Where: Not your workspace", "F2 Super Admin scan: no internal IDs"],
    "axe": "0 violations at 4 widths",
    "not_tested": NT
   },
   "status": "DESIGN COMPLETE · CONNECTED PREVIEW COMPLETE · OWNER APPROVAL PENDING"
  },
  {
   "id": "XS-07", "screen": "Help & support: report a problem + my reports", "kind": "page", "v46_route_proposal": "/[workspace]/help",
   "v46_sources": ["07-Help-Support.dc.html"],
   "v3_source": ["project/XsHelp.dc.html", "project/Main.dc.html"],
   "boards": ["XS07-Help-InstituteAdmin-1440.dc.html", "XS07-Report-Errors-1024.dc.html", "XS07-Sent-768.dc.html", "XS07-Help-Student-375.dc.html", "XS07-Report-375.dc.html", "XS07-Resolved-Faculty-1440.dc.html", "XS07-Reopened-ContentManager-1024.dc.html", "XS07-SuperAdmin-Sent-1024.dc.html", "XS07-Empty-Vendor-768.dc.html", "XS07-Loading-1024.dc.html", "XS07-Failed-768.dc.html", "XsHelp.dc.html"],
   "states": ["My reports: populated (open, reopened, resolved)", "empty", "loading", "failed + Try again", "Report a problem", "missing details", "sending", "Report sent (with reference; without for Super Admin)", "detail: open", "detail: resolved with note", "detail: reopened"],
   "connected": "Report → validation → send → sent → My reports → detail. The new report stays listed after leaving Help and after signing out and in again; lists are per person",
   "evidence": {
    "rendered": "1440 · 1024 · 768 · 375 (list, form errors, sent, detail); long titles and unbroken strings at 1440, 1024 and 375",
    "logic_tested": ["J1 full journey with screenshot name and persistence", "K6, K6b keyboard-only path and error summary", "L4 Try again, row, crumbs, detail Report a problem", "L5 Back to Home", "L7 Cancel, Send, sent crumb", "L7b empty-state action", "L10 Send pressed twice → one report", "J6, F2 Super Admin: no SUP numbers in text, aria-label or title", "F2 lists kept per person"],
    "axe": "0 violations at 4 widths",
    "not_tested": NT
   },
   "status": "DESIGN COMPLETE · CONNECTED PREVIEW COMPLETE · OWNER APPROVAL PENDING"
  },
  {
   "id": "XS-08", "screen": "Institution paused / account inactive notice", "kind": "state", "v46_route_proposal": "(shell) paused / inactive banner",
   "v46_sources": ["05-Workspace-Shell.dc.html", "08-System-Messages.dc.html", "B1-09-Sign-In.dc.html", "B7-04-Pause-Effects.dc.html"],
   "v3_source": ["project/XsAccessNotice.dc.html", "project/XsMessage.dc.html", "project/Main.dc.html"],
   "boards": ["XS08-Paused-InstituteAdmin-1440.dc.html", "XS08-Paused-Faculty-1024.dc.html", "XS08-Paused-Student-768.dc.html", "XS08-Paused-Refusal-375.dc.html", "XS08-Inactive-Student-1440.dc.html", "XS08-Inactive-Refusal-375.dc.html", "XS08-Notices.dc.html", "XsAccessNotice.dc.html"],
   "states": ["paused banner · Institute Admin, Faculty, Student", "paused home notice · Student, Institute Admin (Faculty: banner only, OD-B7-07)", "inactive banner + home notice", "paused refusal page", "inactive refusal page"],
   "connected": "Scenario godavari-paused (Main Tweaks or the XS-08 boards) and Sneha's inactive account; the notice stays after signing out and in; Help reachable from every banner, notice and refusal",
   "evidence": {
    "rendered": "1440 · 1024 · 768 · 375 (Institute Admin paused, Student inactive, paused refusal)",
    "logic_tested": ["J3 notice persists after re-sign-in", "J8, L3, L9, L9b, L9c, L9d every Help link", "L7c, L7d refusal Back to Home keeps the notice", "L9d Faculty: banner only"],
    "axe": "0 violations at 4 widths",
    "not_tested": NT
   },
   "status": "DESIGN COMPLETE · CONNECTED PREVIEW COMPLETE · ASSEMBLY PENDING (role home pages place the page notices) · OWNER APPROVAL PENDING"
  }
 ]
}
json.dump(doc, open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('ok')
