# Component extensions · Student · final design · XR-V3-RB-1.0

The final design keeps the Refined B foundation unchanged: `core.css`, `rb.css` and `rb-kit.css` are byte-identical (hashes in `FOUNDATION-LOCK.json`). Everything Student needs on top of it is in **one role stylesheet, `project/v3-student-final.css`**, loaded after the three foundation files by `project/StudentFinal.dc.html` and the 143 `F-*` boards. No other stylesheet is needed, and none of the earlier role stylesheets is loaded.

## What is in the one stylesheet

| Part | Contents | Origin |
| --- | --- | --- |
| A | Preview root and skip link (`st-root`, `st-main`, `st-skip`), review controls (`st-review*`, review tooling, not product UI), focused-task shell (`st-focus`, `st-focusbar*`, `st-exit`, `st-save*`, `st-simtag`, `st-focuspage`), attempt shell (`st-att*`, `st-strip`, `st-qfs`, `st-q-w`), record-head code and link (`st-eyecode`, `st-eyelink`), tab counts (`st-tabn`), setup disclosure (`st-disclose`), feedback row (`st-fbq`), borrowed XS surfaces (`xsb-*`: account menu, Help & support, message pages) | 115 rules of the original `v3-student.css`, **verbatim**; the 244 rules of retired layouts are not carried |
| B | The Student components (`sv-`), listed below | R2, with the final-pass changes |

**No hidden token changes.** No custom properties are defined. No `!important` appears in Part B; Part A carries two on the review-controls toggle, which is review tooling. Every Part B selector contains an `sv-` class and never restyles an `xr-`, `rb-`, `rk-`, `st-` or `xsb-` class on its own. Every literal colour already occurs in the base files. There are no gradients, keyframes or serif faces. The only animation is the borrowed account menu's fade, using a kit keyframe, and it switches off under reduced motion. There is no text below 13 px, except the 12 px uppercase codes in the 56 × 24 format chip and the 12.5 px review-controls tag. All of this is checked by script (`CHECKS.md`).

## Type roles and colour rules

| Role | Size / line | Where |
| --- | --- | --- |
| Page title | 40/46 (phone 32/38), kit `rb-h1` | Home, My courses, Assessments, Progress, My device |
| Record title | 38/44 (phone 30/36), kit `rk-title` | Course, experiment, format page, assessment, result, feedback |
| Message title | 30/36 (phone 26/32), `sv-refuse-t` | Refusals and withheld results |
| Section | 20/28, `sv-sec-t`, `sv-sh` | Headings inside a surface |
| Card / row title | 17/24 (16.5/23 in asides), `sv-li-t`, `sv-h3` | Rows, side sections |
| Body | 16/24 | Descriptions and sentences |
| Meta | 14.5/20 | Kickers, facts, status words |
| Floor | 13 px | Nothing smaller, except the 12 px codes inside the 56 × 24 format chip |

**Colour rules:**

- Gold appears once per view, on the next action.
- Ivory is only for urgency: a deadline within two days, or a warning notice.
- The plan tint is only for institutional access context.
- Indigo marks selection and the current stage.
- Status always carries words; shape and colour never carry meaning alone.

## Surfaces and gutters

- **One main surface per page, and at most one aside.** No card sits inside a card; sections inside a surface are split by hairlines.
- **Gutters:**
  - 24 px inside list cards, card headers, toolbars and progress tables.
  - 28 px inside reading and task surfaces (launch, before you start, question, score, answers, feedback, device).
  - 18 px for all of these when the page is narrower than 768 px.

## Student components (`sv-`)

| Component | Classes | Used on |
| --- | --- | --- |
| Surface and sections | `sv-card`, `sv-sec`, `sv-ov` (main + one aside, one column below 900), `sv-ov-side`, `sv-side-sec`, `sv-side-d` | Most pages |
| Format chip | `xr-fmt.sv-fmt`, 56 × 24, always with words. Variants: `--on` (solid navy ✓, available to you), `xr-fmt--pub` (dashed indigo, published but not in your institution's access), `xr-fmt--none` (grey, not published), `--held` (outlined navy + glyph), `--ended` (grey outline + dash) | Wherever a format is named |
| Next-step strip | `sv-now*`, `sv-step*`, `sv-step--held`, `sv-item` side list, `sv-how` | ST-01 |
| Stage tracker | `sv-steps` (`is-done` navy, `is-now` half indigo), `sv-steps--lg`, `sv-steps-k` / `-s`. Vertical on phones for the device chain; the check glyph is hidden only below a 330 px page | ST-01, ST-07, ST-08, ST-08a, ST-18 |
| List row | `sv-list`, `sv-li` (`-lead`, `-main`, `-end`, `-k`, `-t`, `-d`, `-m`), `sv-clamp2`; variants `sv-xli` (experiment) and `sv-ali` (assessment) | ST-02, ST-03, ST-04, ST-06, ST-11 |
| Course section | `sv-course*` (container `svcourse`) | ST-02 |
| Toolbar | `sv-xpanel`, `sv-toolbar*`, `sv-tfield` | ST-04 |
| Date block | `sv-when` (`--soon` ivory within two days), `sv-when-d` / `-t` | ST-11, ST-05 Assessment tab, ST-12 |
| Key facts | `sv-dl` (`--rows`), `sv-ai-dl` (two columns on phones, one below 330 px), `sv-about-dl` | ST-08, ST-09, ST-12, ST-18 |
| Resource list | `sv-res`, `sv-res-ico`, `sv-res-m`, `sv-res-st`, `sv-res-held` | ST-06 |
| Format chooser | `sv-chooser` (container `svchoose`), `sv-fcards`, `sv-fcard*` (`is-next`), `sv-chooser-off`, `sv-xrow*` | ST-07 |
| Launch surface | `sv-launch` (`-main`, `-d`, `-stages`, `-err`, `-go`, `-hint`, `-sec`, `-dev`, `-devname`, `-foot`, `-help`), `sv-howto*`, `sv-disclose` (hover as text links) | ST-08, ST-09 |
| Focused activity | `sv-focushead`, `sv-act-k`, `sv-focus-sub`, `sv-act-card` (`--done`), `sv-act-d`, `sv-act-go` | ST-08a, ST-13 head |
| Assessment tab | `sv-atab*`. On tablets the action sits under the content at its own width; full width only on phones | ST-05 Assessment tab |
| Rules row | `sv-rules`, `sv-rules-ico` | ST-12 |
| Before you start | `sv-ai`, `sv-ai-state`, `sv-ai-d`, `sv-ai-act` (stretches on phones, so both buttons are full width whatever their labels), `sv-ai-facts`, `sv-ai-when` | ST-12 |
| Question sheet and navigator | `sv-qs`, `sv-q`, `sv-q-n` (`is-done`), `sv-q-body`, `sv-q-h`, `sv-q-k`, `sv-q-m`, `sv-qfs`, `sv-q-w`, `sv-attside`, `sv-attpanel*`, `sv-attcount`, `sv-attnext`, `sv-attnote`, `sv-attsuberr`. Answered numbers darken on hover | ST-13 |
| Score panel | `sv-score*`, `sv-byq` / `sv-byq-i` (`is-full`, with its own hover), `sv-byq-n` / `-m`, `sv-score-retry` | ST-14 |
| Answer review | `sv-review*`, `sv-ans*`, `sv-ans-dl`, `sv-verdict` (`--ok`) | ST-14 |
| Rating sheet | `sv-fb` (container `svfb`), `sv-lk-head`, `sv-lk-scale`, `sv-lk-q`, `sv-lk-opts`, `sv-lk-o`, `sv-lk-n`, `sv-lk-ends`, `sv-lk-sel` | ST-16 |
| Sent feedback | `sv-fbsent*`, `sv-lk-dots`, `sv-lk-dot` (`is-on`), `sv-lk-v` (wraps under the dots when the row is narrow) | ST-17 |
| Device | `sv-devmain`, `sv-devsec`, `sv-devnow*`, `sv-devico`, `sv-devname`, `sv-devuse`, `sv-devlock`, `sv-devform*`, `sv-devfrom`, `sv-devreq-h`, `sv-devst`, `sv-devexp`, `sv-devsteps`, `sv-devnoia`, `sv-devdl`, `sv-devprev`, `sv-devhow`, `sv-devnote` | ST-18 |
| Compact refusal | `sv-refuse`, `sv-refuse-ico` (`--off`), `sv-refuse-k` / `-t` / `-d` / `-act`, `sv-refuse-alt`, `sv-refuse-list`, `sv-refuse-row` | ST-19, every Student refusal, withheld ST-14 |
| Compact message and states | `sv-msg*`, `sv-pstate` (`--row`), `sv-loading`, `sv-skel`, `sv-holdnote`, `sv-facts*` | Empty, loading, failed and held states |
| Tabs | `sv-tabs` (tighter below 480, and again below 330 so three tabs with counts fit), `sv-tabs--chips` (experiment sections wrap as chips below 480) | ST-11, experiment hub (My courses uses the kit's `rk-tabs` as is) |
| Progress | `sv-prog`, `sv-ptools`, `sv-pfield`, `sv-pgroup*`, `sv-pexp` (a flat experiment group, tinted header band `sv-pexp-h`; `--flat` on ST-10), `sv-ptable`, `sv-pc-*`, `sv-poff`, `sv-pas`. The table becomes two-column rows below a 766 px container and one column below 480 | ST-15, ST-10 |
| Small pieces | `sv-tag` (Next step), `sv-link`, `sv-eyebrow`, `sv-sh`, `sv-sh-note`, `sv-subk`, `sv-code-sm` | Throughout |

## Interaction states

Captured on real pages, with each state compared against the default by pixels (`checks/results/states/`, screenshot index):

| Control | Hover | Keyboard focus | Pressed | Other states |
| --- | --- | --- | --- | --- |
| Primary (gold) and secondary buttons | ✓ | ✓ 2 px focus ring (core) | ✓ | busy label and `aria-busy` while sending; disabled while busy |
| Text links (`sv-link`, `rb-link`, breadcrumbs) | ✓ underline | ✓ | ✓ | — |
| Rail items and section tabs | ✓ (the current item stays as it is) | ✓ | ✓ | current = `aria-current="page"` |
| Selects and text fields | ✓ | ✓ | (n/a) | error: red border and an inline message, linked by `aria-describedby` |
| Answer choices and rating cells | ✓ | ✓ | ✓ | selected; error outline (rating) |
| Navigator numbers and marks chips | ✓ (answered and full-mark too) | ✓ | ✓ | answered / full marks |
| Disclosure, account button | ✓ | ✓ | ✓ | expanded = `aria-expanded` |

## Responsive behaviour

Container queries only, on the kit's containers (`rbpage`, `rb`, `stfocus`) and the Student containers (`svcourse`, `svchoose`, `svfb`, `svmain`, `svx`, `svatab`, `svtools`, `svpexp`):

- Main + aside collapse below 900.
- List rows stack, and gutters go from 24 to 18 px, below a 768 px page.
- Progress tables become two-column rows below 766 px, and one column below 480.
- Buttons go full width below 600.
- Below 330 px, the stage tracker drops its check glyph, the facts go to one column and the tabs tighten.
- The attempt's question panel splits below 900: answers on top, Submit after the last question.

## Implementation notes

- The design runtime wraps every text hole in `<span class="sc-interp">`. The stylesheet never styles a descendant `span` generically: child selectors only, and the one `span + span` rule needs sibling spans. A React port has no such wrapper.
- Every class the final templates use is defined. Two prefixes are joined with a tone in code (`sv-refuse-ico--` + `off`, `xsb-msg-ico--` + tone).
- The verbatim `hubVM` still computes two fields that no template reads (`cells`, `note`) and that name retired classes. They are kept only for logic parity with the original, and their CSS is not carried.
- `sv-` and `st-` are design-review prefixes: port the anatomy and the rules, not the prefixes.
