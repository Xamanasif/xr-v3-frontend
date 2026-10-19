# Builds LINK-MAP.json for the XS package. Evidence IDs refer to CHECKS.md (logs in verification/logs).
import json, sys

out = sys.argv[1]

def L(source, control, kind, dest, route, cls, behaviour, status, evidence, note=None):
    e = {"source": source, "control": control, "kind": kind, "destination": dest, "route_v46_proposal": route,
         "classification": cls, "preview_behaviour": behaviour, "tested": status, "evidence": evidence}
    if note:
        e["note"] = note
    return e

RAIL = {
    "Student": [("Home", "ST-01", "/student"), ("My courses", "ST-02", "/student/courses"), ("Assessments", "ST-11", "/student/assessments"), ("Progress", "ST-15", "/student/progress")],
    "Faculty": [("Overview", "FA-01", "/faculty"), ("My courses", "FA-02", "/faculty/courses"), ("Assessments", "FA-06", "/faculty/assessments"), ("Question bank", "FA-14", "/faculty/question-bank"), ("Marking", "FA-18", "/faculty/marking"), ("Students", "FA-20", "/faculty/students")],
    "Institute Admin": [("Overview", "IA-01", "/institute"), ("Content access", "IA-02", "/institute/content-access"), ("Student access", "IA-04", "/institute/student-access"), ("People", "IA-06", "/institute/people?tab=students"), ("Requests", "IA-17", "/institute/requests"), ("Usage", "IA-20", "/institute/usage")],
    "Vendor": [("Overview", "VE-01", "/vendor"), ("My experiments", "VE-02", "/vendor/experiments")],
    "Academic Reviewer": [("Overview", "RV-01", "/reviewer"), ("Review queue", "RV-02", "/reviewer/queue"), ("Reviewed by me", "RV-05", "/reviewer/reviewed")],
    "Content Manager": [("Overview", "CM-01", "/content-manager"), ("Ready to publish", "CM-02", "/content-manager/ready"), ("Content library", "CM-04", "/content-manager/library"), ("Updates", "CM-08", "/content-manager/updates"), ("Course codes", "CM-09", "/content-manager/course-codes")],
    "Super Admin": [("Overview", "SA-01", "/admin"), ("Requests (count 3)", "SA-02", "/admin/requests"), ("Institutions", "SA-06", "/admin/institutions"), ("Content", "SA-10", "/admin/content/updates"), ("Academic structure", "SA-14", "/admin/structure"), ("Platform roles", "SA-16", "/admin/roles?tab=vendors|reviewers|content-managers"), ("Operations", "SA-18", "/admin/operations/device-transfers")],
}
HOMES = "ST-01 Home (Student) · FA-01 · IA-01 · VE-01 · RV-01 · CM-01 · SA-01 Overview"

links = [
    # XS-01 / XS-03 / XS-04 · XsSignIn
    L("XS-01 Sign in", "Back to experiments", "link", "PU-04 Catalogue", "/experiments", "other-workstream (Public)", "Labelled public slot page; its H1 takes focus", "LOGIC TESTED", ["J5", "K1"]),
    L("XS-01 Sign in", "Sign in with your institution", "button", "XS-01 state: Institution sign-in isn’t available right now", "/sign-in", "policy-open (T-10)", "The notice replaces the button and takes focus; e-mail sign-in stays available", "LOGIC TESTED", ["J5", "F2", "K1b", "L6b"]),
    L("XS-01 Sign in", "Error summary links: Enter your e-mail address · Enter an e-mail address like name@institution.edu · Enter your password", "link", "The named field", "same page", "same-page", "Moves focus to the field", "LOGIC TESTED", ["J1", "K1"]),
    L("XS-01 Sign in", "Show password / Hide password", "button", "Password field shown as text / hidden", "same page", "same-page", "Toggles the field type; name changes with it", "LOGIC TESTED", ["K1"]),
    L("XS-04 Forgot password", "Forgot your password?", "disclosure button (aria-expanded)", "XS-04 contact route: Contact your institution administrator to reset it.", "/sign-in (links only)", "policy-open (T-11 / R02)", "Shows the sentence; nothing is sent", "LOGIC TESTED", ["J5", "L6", "L6b"]),
    L("XS-04 First-time activation", "First time signing in?", "disclosure button (aria-expanded)", "XS-04 contact route: Contact your institution administrator to find out how to sign in for the first time.", "/sign-in (links only)", "policy-open (T-11 / R02)", "Shows the sentence; nothing is sent", "LOGIC TESTED", ["J5", "L6", "L6b"]),
    L("XS-01 Sign in", "Sign in (submit; Enter in a field)", "form submit", "Role home: " + HOMES + " · or the kept return address · or XS-06 · or an XS-08 refusal", "/sign-in → role routes", "shared → role", "Validation, then Signing in… (busy), then the destination's H1 takes focus. Unknown e-mail: wrong-details message, password cleared, e-mail kept", "LOGIC TESTED", ["J1", "J2", "J2b", "J3", "J4", "SW", "K1", "L10b"], "Pressing twice while busy is ignored (L10b)."),
    L("XS-01 Sign in", "Request institutional access", "link", "PU-08 Request institutional access", "/request-access", "other-workstream (Public)", "Labelled public slot page; its H1 takes focus", "LOGIC TESTED", ["J5", "K1"]),
    L("XS-01 public slot (preview only)", "Sign in", "link", "XS-01 Sign in", "/sign-in", "shared", "Back to the sign-in card; its H1 takes focus", "LOGIC TESTED", ["J5"]),
    L("XS-03 Session ended", "Sign in (with a kept return address)", "form submit", "The kept address if it is in the person's workspace · XS-06 if it belongs to another workspace · XS-08 inactive refusal · XS-08 paused refusal for a paused institution's experiment", "/signed-out → kept route", "shared → role", "Rahul → ST-05 experiment slot; Meera → XS-06; Sneha → inactive refusal; paused Rahul → paused refusal", "LOGIC TESTED", ["J2", "J2b", "J3", "J4"], "Design proposal; confirm against the app's redirect."),

    # XS-05 · XsAccountMenu (every workspace)
    L("XS-05 Account menu (every workspace)", "Account menu, {name}, {role}[, {organisation}]", "button (aria-expanded, aria-controls)", "Account menu panel", "(top bar)", "shared", "Opens; focus to the first item. Arrow keys, Home, End; Escape and outside click close and return focus; Tab out closes", "LOGIC TESTED", ["K3", "K3b", "J1", "SW"]),
    L("XS-05 Account menu (Student with AR/VR/MR only)", "My device", "link", "ST-18 My device", "/student/device", "other-workstream (Student)", "Labelled Student slot; no rail item current", "LOGIC TESTED", ["L1", "J1"]),
    L("XS-05 Account menu (every workspace)", "Help & support", "link", "XS-07 Help & support", "/[workspace]/help", "shared", "Help list; its H1 takes focus; Where is pre-filled from the page left", "LOGIC TESTED", ["J1", "SW"]),
    L("XS-05 Account menu (every workspace)", "Sign out", "button", "XS-03 You’re signed out", "/signed-out", "shared", "Ends the preview sign-in; the notice takes focus", "LOGIC TESTED", ["J1", "K3", "SW"]),
    L("XS-05 Account menu (every workspace)", "Close account menu (outside-click layer, not in the tab order)", "button (tabindex -1)", "Closes the panel", "same page", "same-page", "Focus returns to the account button", "LOGIC TESTED", ["K3b"]),

    # Workspace shell
    L("Workspace shell (every workspace)", "Skip to main content", "link", "Main region", "same page", "same-page (shell patch XS-P1)", "Visible only when focused; focuses <main>", "LOGIC TESTED", ["K3"]),
    L("Workspace shell (every workspace)", "Help & support (rail foot and drawer foot)", "link", "XS-07 Help & support", "/[workspace]/help", "shared", "aria-current on Help; H1 takes focus", "LOGIC TESTED", ["SW", "J1"]),
    L("Workspace shell (below 1024 px)", "Menu", "button (aria-expanded)", "Workspace drawer (role=dialog, aria-modal)", "same page", "same-page (V3 pattern)", "Focus to Close; Tab and Shift+Tab stay inside; Escape returns focus to Menu", "LOGIC TESTED", ["J7", "K5"]),
    L("Workspace drawer", "Close menu", "button", "Closes the drawer", "same page", "same-page", "Focus returns to Menu", "LOGIC TESTED", ["J7", "K5"]),
    L("Workspace drawer", "Close menu (scrim, not in the tab order)", "button (tabindex -1)", "Closes the drawer", "same page", "same-page", "Focus returns to Menu", "LOGIC TESTED", ["J7"]),
    L("Workspace drawer", "Rail destinations", "link", "The chosen page", "role routes", "other-workstream (role)", "Drawer closes and the page's H1 takes focus (shell patch XS-P2)", "LOGIC TESTED", ["J7", "K5"]),
    L("ST-05 experiment slot (preview only)", "My courses (breadcrumb)", "link", "ST-02 My courses", "/student/courses", "other-workstream (Student)", "Student slot; aria-current on My courses", "LOGIC TESTED", ["L1"]),

    # XS-06 · XsMessage
    L("XS-06 Not your workspace", "Back to Home / Back to Overview", "link (primary)", "The signed-in person's home", "role home", "shared → role", "Home slot; its H1 takes focus", "LOGIC TESTED", ["J2"]),
    L("XS-06 Not your workspace", "Help", "link", "XS-07 Help & support (Where: Not your workspace)", "/[workspace]/help", "shared", "Help list; Report a problem pre-fills Where", "LOGIC TESTED", ["L2"]),

    # XS-07 · XsHelp
    L("XS-07 My reports", "Report a problem (page head)", "link (primary)", "XS-07 Report a problem", "/[workspace]/help", "shared (same page family)", "Form; its H1 takes focus", "LOGIC TESTED", ["J1", "K6", "L7"]),
    L("XS-07 My reports", "Report row (title, reference, dates, status)", "link", "XS-07 report detail", "/[workspace]/help", "shared (same page family)", "Detail; its H1 takes focus", "LOGIC TESTED", ["J1", "K6", "L4"]),
    L("XS-07 My reports (empty)", "Report a problem (in the empty state)", "link (primary)", "XS-07 Report a problem", "/[workspace]/help", "shared (same page family)", "Form; Where pre-filled", "LOGIC TESTED", ["L7b"]),
    L("XS-07 My reports (failed)", "Try again", "button", "My reports reloaded", "same page", "same-page", "Loading, then the list; focus to My reports", "LOGIC TESTED", ["L4"]),
    L("XS-07 Report a problem", "Help & support (breadcrumb)", "link", "XS-07 My reports", "/[workspace]/help", "shared (same page family)", "List; nothing saved", "LOGIC TESTED", ["L4"]),
    L("XS-07 Report a problem", "Say what happened (error summary)", "link", "What happened? field", "same page", "same-page", "Focus to the field; summary and field error clear when text is typed", "LOGIC TESTED", ["K6", "K6b"]),
    L("XS-07 Report a problem", "Screenshot (optional)", "file input", "Chosen image name kept", "same page", "same-page", "Only the file name is kept; nothing is uploaded", "LOGIC TESTED", ["J1"]),
    L("XS-07 Report a problem", "Send report", "form submit", "XS-07 Report sent", "/[workspace]/help", "shared (same page family)", "Sending… then Report sent with the reference (none for Super Admin); the report is added to My reports and kept for the session", "LOGIC TESTED", ["J1", "K6", "L7", "L10", "F2", "J6"], "Pressing twice while sending creates one report (L10)."),
    L("XS-07 Report a problem", "Cancel", "link", "XS-07 My reports", "/[workspace]/help", "shared (same page family)", "List unchanged; nothing saved", "LOGIC TESTED", ["L7"]),
    L("XS-07 Report sent", "Help & support (breadcrumb)", "link", "XS-07 My reports", "/[workspace]/help", "shared (same page family)", "List with the new report first", "LOGIC TESTED", ["L7"]),
    L("XS-07 Report sent", "View my reports", "link (primary)", "XS-07 My reports", "/[workspace]/help", "shared (same page family)", "List with the new report first", "LOGIC TESTED", ["J1", "K6"]),
    L("XS-07 Report sent", "Back to Home / Back to Overview", "link", "The person's home", "role home", "shared → role", "Home slot; its H1 takes focus", "LOGIC TESTED", ["L5"]),
    L("XS-07 report detail", "Help & support (breadcrumb)", "link", "XS-07 My reports", "/[workspace]/help", "shared (same page family)", "List", "LOGIC TESTED", ["L4"]),
    L("XS-07 report detail", "Report a problem (foot)", "link", "XS-07 Report a problem", "/[workspace]/help", "shared (same page family)", "Form", "LOGIC TESTED", ["L4"]),

    # XS-08 · XsAccessNotice / XsMessage
    L("XS-08 paused banner (every page: Institute Admin, Faculty, Student)", "Help", "link", "XS-07 Help & support", "/[workspace]/help", "shared", "Help list", "LOGIC TESTED", ["L3", "J8", "L9d"]),
    L("XS-08 inactive banner (every page: Student, Faculty)", "Help", "link", "XS-07 Help & support", "/[workspace]/help", "shared", "Help list", "LOGIC TESTED", ["L9"]),
    L("XS-08 home notice (Student paused · Institute Admin paused · inactive)", "Help", "link", "XS-07 Help & support", "/[workspace]/help", "shared", "Help list", "LOGIC TESTED", ["L3", "L9b", "L7c"]),
    L("XS-08 paused refusal", "Back to Home", "link (primary)", "ST-01 Home (with the paused banner and notice)", "/student", "shared → role", "Home slot; notice still shown", "LOGIC TESTED", ["L7d", "J3"]),
    L("XS-08 paused refusal", "Help", "link", "XS-07 Help & support (Where: Access paused)", "/[workspace]/help", "shared", "Help list", "LOGIC TESTED", ["L3b"]),
    L("XS-08 inactive refusal", "Back to Home", "link (primary)", "ST-01 Home (with the inactive banner and notice)", "/student", "shared → role", "Home slot; notice still shown", "LOGIC TESTED", ["L7c"]),
    L("XS-08 inactive refusal", "Help", "link", "XS-07 Help & support (Where: Account inactive)", "/[workspace]/help", "shared", "Help list", "LOGIC TESTED", ["L9c"]),

    # Component artboards alone (specimens) and galleries
    L("XsAccountMenu artboard (specimen)", "My device · Help & support · Sign out", "link / button", "Specimen note naming the destination", "—", "specimen-note", "Closes the menu, returns focus and says where the item leads (no silent no-op)", "LOGIC TESTED", ["L8"]),
    L("XsMessage artboard (specimen)", "Back to Home · Help", "link", "Specimen note", "—", "specimen-note", "Says where the control leads", "LOGIC TESTED", ["L8b"]),
    L("XsAccessNotice artboard (specimen)", "Help", "link", "Specimen note", "—", "specimen-note", "Says where the control leads", "LOGIC TESTED", ["L8c"]),
    L("XsSignIn artboard (specimen)", "Back to experiments · Request institutional access · Sign in", "link / submit", "“Opens outside this preview” notice; Sign in reads “isn’t right” (no host knows any account, as in v46)", "—", "specimen-note", "Notice naming PU-04 / PU-08", "LOGIC TESTED", ["L8d"]),
    L("XsHelp artboard (specimen)", "Back to Overview · View my reports", "link", "Specimen note · its own sample list", "—", "specimen-note", "Keeps its own sample list so the whole family can be tried", "LOGIC TESTED", ["L8e"]),
    L("Galleries (XS01-SignIn-States, XS05-Menus, XS08-Notices)", "Every control on the cards", "various", "Same behaviour as the component artboards", "—", "specimen-note", "Each card is a live instance of the shared component", "RENDERED · SOURCE CHECKED", ["G"], "Interactions on gallery cards were not exercised separately; they run the same component code as the specimens above."),
]

rail_entries = []
for role, items in RAIL.items():
    rail_entries.append({
        "source": "Workspace shell · " + role + " rail (and drawer)",
        "kind": "link (aria-current on the current page)",
        "destinations": [{"label": a, "id": b, "route_v46_proposal": c} for a, b, c in items],
        "classification": "other-workstream (" + role + ")",
        "preview_behaviour": "Labelled slot for the owning workstream; H1 takes focus; aria-current set. IA-01, IA-02, SA-01 and SA-02 note their approved V3 seed.",
        "tested": "LOGIC TESTED",
        "evidence": ["SW"]
    })

doc = {
    "about": "Every control on the XS surfaces and the shared chrome they sit in: where it goes, how it is classified and how it was checked. Route strings are v46 proposals used for identification; the app keeps its own routes. No control is an href=\"#\" placeholder: anchors point at real elements and every handler either navigates, changes state or (on a standalone component artboard) says where it leads.",
    "classification_key": {
        "same-page": "Changes the current page or focus only",
        "shared": "Another XS surface (owned here)",
        "shared (same page family)": "Another view of XS-07 Help & support",
        "shared → role": "Leaves XS for a role workstream's page (role home or kept address)",
        "other-workstream (X)": "A page owned by workstream X, shown in the preview as a labelled slot",
        "policy-open (decision)": "The documented safe treatment for an undecided policy",
        "specimen-note": "Standalone component artboard with no host: explains where the control leads"
    },
    "status_key": {"LOGIC TESTED": "Exercised in a real browser render, result read back (see CHECKS.md)", "RENDERED": "Drawn and inspected, not exercised", "SOURCE CHECKED": "Read in source only", "NOT TESTED": "Not checked"},
    "evidence_key": "See CHECKS.md §3 for J*, K*, L*, F2, SW, G.",
    "links": links,
    "rail_destinations": rail_entries,
    "counts": {"controls": len(links), "rail_destination_links": sum(len(v) for v in RAIL.values()), "not_tested": sum(1 for l in links if l["tested"] == "NOT TESTED")}
}
json.dump(doc, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
print("links", len(links), "rail", sum(len(v) for v in RAIL.values()))
