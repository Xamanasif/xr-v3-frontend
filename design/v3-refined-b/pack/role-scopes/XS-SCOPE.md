# Entry & shared - exact ownership

| ID | Registered screen | Type | v46 proposed route |
| --- | --- | --- | --- |
| XS-01 | Sign in | page | /sign-in |
| XS-03 | Signed out / session expired | page | /signed-out |
| XS-04 | First-time activation · Forgot password | state | /sign-in (links only — flows OPEN) |
| XS-05 | Account menu: name, role, institution, Help, Sign out | menu | (top bar) account menu |
| XS-06 | Not your workspace | page | /[workspace]/not-allowed |
| XS-07 | Help & support: report a problem + my reports | page | /[workspace]/help |
| XS-08 | Institution paused / account inactive notice | state | (shell) paused / inactive banner |

Already-selected V3 seeds for this role: None in the supplied five-screen V3 source subset. Retain them and complete the role around them.

Excluded: XS-02.

## Source boards
- `05-Workspace-Shell.dc.html`
- `06-Sidebar-Variants.dc.html`
- `07-Help-Support.dc.html`
- `08-System-Messages.dc.html`
- `B1-09-Sign-In.dc.html`
- `B7-04-Pause-Effects.dc.html`
