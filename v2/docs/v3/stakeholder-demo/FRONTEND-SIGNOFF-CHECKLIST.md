# V3 frontend — proposed sign-off and freeze checklist (NOT EXECUTED)

**Status: proposal only.** The frontend is not approved and not frozen. This checklist is run only
after the owner says “Frontend approved — proceed to freeze” (or after the approved change list is
implemented and re-reviewed).

## 1. Approval

- [ ] Stakeholder demo held; every comment recorded in `FRONTEND-REVIEW-REGISTER`.
- [ ] Every P1 item approved and implemented, or explicitly deferred by the owner.
- [ ] The approved premium Public Landing integrated (K-01) and the official logo placed (K-02), or
      explicitly deferred.
- [ ] Open product decisions either decided or recorded as post-freeze (requester reference K-03,
      licence counting, sign-in method, prototype field sets …).
- [ ] The owner's written approval: “Frontend approved — proceed to freeze”, with the date and the
      exact commit it applies to.

## 2. Verification of the commit to be frozen

- [ ] Working tree clean on `v3/refined-b-ui`; the commit to freeze named.
- [ ] `pnpm verify` in an isolated copy: format, repository, workspace (typecheck, lint, unit),
      bundle, browser (four widths), parity — all PASS except recorded baseline exceptions, each
      named.
- [ ] The full-UI walkthrough (`e2e/flows/walkthrough.spec.ts`) and the stakeholder-order journey
      pass on a product build.
- [ ] Identifier sweep of every role: no internal reference in user-facing words.
- [ ] Frozen design folders verified (handoff-v46 178, v3-refined-b 46, each role export's beside
      list); the protected original checkout unchanged.
- [ ] Register reconciled: 123 designed ids with their actual status (no inflated count).

## 3. Freeze

- [ ] An annotated tag on the approved commit (name agreed with the owner, e.g.
      `v3-frontend-approved-YYYY-MM-DD`), created only on the owner's instruction.
- [ ] A recovery bundle of the tagged commit + `.sha256`, restore-tested, kept outside the repo.
- [ ] A frozen-baseline record in `docs/v3/` (commit, tag, bundle hash, test evidence, approved
      register, known limitations, what is out of scope).
- [ ] The rule for post-freeze changes written down (each change needs its own approval, commit,
      record and verification).
- [ ] No merge, push or deployment unless separately instructed.

## 4. Hand-over to the next phase (only after the freeze)

- [ ] Backend and integration planning starts from the frozen baseline and its service contracts
      (`packages/contracts`) — the frontend is not changed to suit a backend without approval.
- [ ] External dependencies listed for planning: identity provider / SSO, payment provider, real
      simulation builds and runtime reporting (incl. stage facts), resource hosting, e-mail
      delivery, device registry, the official brand assets.
