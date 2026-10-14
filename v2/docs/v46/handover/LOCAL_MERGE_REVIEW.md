# Local merge review — `v2/frontend-v46` → `v2/platform-foundation` (WP-0.16)

Appendix F WP-0.16 asks for a pull request from `v2/frontend-v46` to `v2/platform-foundation`. The
repository has **no git remote** (register P0-01, unresolved), so no PR can be opened. This is the
permitted alternative: a local merge review. **Nothing was merged, pushed, rebased or stashed, no
remote was added, and the original checkout was not touched.**

## 1 · Branches

| Ref | Commit | Note |
|---|---|---|
| `v2/platform-foundation` (PR base) | `1b090c9` | "Establish V2 platform foundation" — also the tip of `v2/connected-frontend-slice1` and `v2/design-system-flagship` |
| `v2/frontend-v46` (head) | the WP-0.16 commit (parent `a6d369d`) | 20 commits ahead of the base, 0 behind; merge base `1b090c9` — a fast-forward is possible |
| `main` | `e8c6a84` | Has no `v2/`; landing on `main` is a separate owner decision (P0-01) |
| Original checkout `/Users/mymac/Desktop/AR-VR` | `v2/connected-frontend-slice1` @ `1b090c9` | 98 uncommitted paths (rejected Slice-1 + the owner's Source Pack), untouched |

## 2 · Commit history (oldest first)

| Commit | Work package | Subject |
|---|---|---|
| `c4860a2` | WP-0.1 | Add frozen XR Learning Platform design handoff v46 |
| `58dfb4a` | WP-0.1 / 0.2 | Isolate the Turbo cache in this worktree |
| `7124c64` | WP-0.2 | Record v46 Phase-0 decisions, amendments and audit references |
| `94d7bcc` | WP-0.3 | Fix foundation conflicts with the v46 frontend |
| `6a14c93` | WP-0.4 | Add the Phase-0 test harness base |
| `0baa51e` | WP-0.5 | Port the v46 stylesheets and add the product layer |
| `7149088` | WP-0.6 | Add the v46 core component library |
| `f64f7ac` | WP-0.7 | Add DataTable sorting and the B1-10 sort fix |
| `a975382` | WP-0.7 | Match the B1-10 sort header look (visual correction) |
| `2794508` | WP-0.8 | Add the role shells and role-aware navigation |
| `76b4abf` | WP-0.8 | Verify PF-11 under B4-12's drawn bar and long titles |
| `0329547` | WP-0.9 | Add the domain models, state machines and policies |
| `76e20e0` | WP-0.10 | Add the draft service contracts, DTO schemas, error model and contract suite |
| `9c81058` | WP-0.11 | Add the connected sample world and mock service adapter |
| `68a7b5c` | WP-0.12 | Add the composition root, query layer and per-tab session |
| `dfb06c2` | WP-0.13 | Add the Phase-0 foundation screens, routes and guards |
| `df25fbd` | WP-0.14 | Add the WP-0.14 cross-role thin vertical proof |
| `8677c5b` | WP-0.15 | Add the WP-0.15 frozen-v46 visual-parity pipeline and Phase-0 baselines |
| `a6d369d` | WP-0.15 | Record the owner's WP-0.15 visual-decision closure |
| (this commit) | WP-0.16 | Phase-0 verification record and handover |

## 3 · What the branch changes relative to the base (at `a6d369d`; WP-0.16 adds §4)

970 paths: 905 added, 58 modified, 7 deleted (268,188 insertions, 465 deletions — most of the
volume is the frozen handoff and vendored files).

| Category | Paths | Kind |
|---|---|---|
| `design/handoff-v46/` — the frozen v46 handoff (G-7), byte-identical to the approved zip, 178/178 | 180 | Frozen reference, never edited |
| `v2/docs/v46/` — audit evidence (36 checksummed files + `SHA256SUMS.txt`) | 37 | Frozen evidence |
| `v2/packages/ui/src/styles/v46/` — 8 stylesheets + 19 SVGs, byte-identical copies (27/27) | 27 | Verbatim copies |
| `v2/tools/board-capture/vendor/` — React 18.3.1, ReactDOM 18.3.1, Babel Standalone 7.29.0 (SRI-checked), Public Sans CSS + 3 woff2 + OFL, `SHA256SUMS.txt` (G-5c, capture tooling only) | 9 | Vendored, test-only |
| Generated: `v2/pnpm-lock.yaml`; `tools/board-capture/src/pinned.json` (`pin.mjs`); `tools/board-capture/DEVIATIONS.md` (`register.mjs`) | 3 | Generated, reviewed |
| Tests and test support (`*.test.*`, `*.spec.*`, `*.parity.ts`, `e2e/**`) | 210 | Hand-written |
| Product and tooling source (`.ts`, `.tsx`, `.mjs`, `.js`, `.css` outside the above) | 429 | Hand-written |
| Docs, configs, package manifests and the rest | remainder | Hand-written |

Modified foundation files (58) are the WP-0.3 conflict fixes and the wiring each later WP needed
(`v2/package.json`, `turbo.json`, ESLint fences in `packages/config`, `apps/web` config, the four
committed docs amended in WP-0.2, `packages/domain` roles / technology / utilisation). Deleted (7):
the foundation `/` and `/system` pages, the API health probe and its test, `FoundationStatusList`
and its test, and `packages/ui/src/tokens.css` (superseded by the verbatim v46 sheets) — WP-0.3 /
WP-0.5, owner O-10 / P1-16 default.

**Not changed:** `v2/apps/api/**` and `v2/packages/database/**` (`git diff v2/platform-foundation
HEAD -- v2/apps/api v2/packages/database` is empty). No production API, database schema or
migration changed.

## 4 · What WP-0.16 adds

| Path | What |
|---|---|
| `v2/docs/v46/PHASE0_FRONTEND_VERIFICATION.md` | The Phase-0 verification record (Appendix F §11.2) |
| `v2/docs/v46/handover/CAPABILITY_LEDGER.md`, `METHOD_LEDGER.md`, `PERMISSION_COVERAGE.md`, `OWNER_DECISIONS_HANDOVER.md`, `LOCAL_MERGE_REVIEW.md` | Handover ledgers and this review |
| `v2/tools/board-capture/src/parity.mjs` | Fingerprint correction: border styles and `accent-color` added to `contentFingerprintOf`; the two fingerprint functions exported for the regression test |
| `v2/tools/board-capture/src/pinned.json` | `productContent` (and its `run`) re-pinned for the 64 registered comparisons; every other field unchanged |
| `v2/apps/specimens/e2e/parity/fingerprint-sensitivity.parity.ts` | Regression test of the two fingerprints on real controls |
| `v2/tools/board-capture/README.md`, `BASELINES.md`, `DEVIATIONS.md` | Recorded outcome; regenerated register |

## 5 · Review checks

| Check | Result | Evidence |
|---|---|---|
| No rejected Slice-1 UI restored | PASS | None of the 60 Slice-1 untracked files or the 11 Slice-1 modified versions appears at HEAD by content (SHA-256 over all 888 `v2/` + `CLAUDE.md` blobs, against the G-1 backup manifest). Two Slice-1 *paths* coincide — `packages/domain/src/access/{model.ts,access.test.ts}` (WP-0.9, domain, not UI) — and share only boilerplate lines (`/**`, `import {`, `});`): independent rewrites. `packages/ui/src/slice1-provenance.test.ts` and the six Slice-1 scan rules pass |
| Original checkout unchanged | PASS | `v2/connected-frontend-slice1` @ `1b090c9`; `git status --porcelain -uall` 98 lines, every one of the 98 paths byte-identical to the backup manifest (98/98 SHA-256); the only textual difference from the backup's status file is git's quote-path escaping of one `·` file name; 0 stashes; no remote; its `v2/.turbo/cache` dates from 7 Oct (pre-worktree) and no root `.turbo` exists |
| External backup intact | PASS | `~/Downloads/XR-AR-VR-Uncommitted-Backup-2026-10-12`: `shasum -a 256 -c SHA256SUMS.txt` 6/6 OK |
| No production API / database change | PASS | §3 |
| No test-only functionality in the product bundle | See the verification record | `pnpm verify` bundle step: sentinel scan of the product `.next` build, with the test-hook build as positive control |
| Frozen handoff | PASS | 178/178 OK in place and from a fresh `git archive HEAD design/handoff-v46` export; only `c4860a2` touches it |
| No remote, no push | PASS | `git remote -v` empty in the worktree and the original checkout |

## 6 · Future pull request — instructions only (do not run until P0-01 is decided)

Prerequisites (owner):

1. Decide P0-01: a private remote, the PR base (`v2/platform-foundation` recommended) and when the
   foundation lands on `main`.
2. Decide what happens to the rejected Slice-1 work and the Source Pack in the original checkout
   (they exist only there and in the G-1 backup); never push `v2/connected-frontend-slice1` with
   them by accident.
3. Decide the CI runner (VD-18) if the PR should be gated by CI rather than by a recorded local
   `pnpm verify`.

Steps (from the worktree `/Users/mymac/Desktop/AR-VR-frontend-v46`, never from the original
checkout):

```bash
git remote add origin <owner-approved private URL>
git push origin v2/platform-foundation
git push origin v2/frontend-v46
gh pr create --base v2/platform-foundation --head v2/frontend-v46 --title "Phase 0 — v46 frontend foundation (WP-0.1 … WP-0.16)" --body-file v2/docs/v46/PHASE0_FRONTEND_VERIFICATION.md
```

Before merging: run `pnpm verify` at `v2/` on the PR head (or on the runner once VD-18 is decided);
re-check `design/handoff-v46` 178/178; keep the 20 work-package commits (a merge commit or a
fast-forward, not a squash, so each WP stays reviewable). A WebKit / Firefox run and a re-pin of the
parity baselines on the runner are separate, owner-gated steps (P0-28, VD-18).
