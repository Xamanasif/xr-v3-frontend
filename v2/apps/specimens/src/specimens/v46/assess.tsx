/**
 * Stylesheet specimen (WP-0.5, PF-11): the focused-task root of B4-12 "Assessment attempt" —
 * `.xr-app > header.xa-bar + main.xr-page > .xr-wrap--form.xr-content` with the answer strip
 * (`nav.xa-strip`, links to the question anchors) and the questions (`ol.xa-qs > li.xa-q[id]
 * [tabindex=-1]`). `.xa-bar` is sticky at the top (xr-assess.css). Board 12: focus is "never
 * hidden under the top bar or a menu"; PF-11 keeps a focused control clear of the bar while the
 * strip's jumps keep landing where v46 puts them (`.xa-q{scroll-margin-top:72px}`).
 *
 * `bar="drawn"` (WP-0.8, the PF-11 long-title / wrapped-bar verification) draws B4-12's bar
 * verbatim instead of the WP-0.5 excerpt: the back link with its chevron, the widest save state
 * ("Your last answer didn’t save" + "Try again", with the board's inline 32 px) and the avatar —
 * the bar whose two rows at 375 px PF-11's 113 px was computed from. The avatar's `aria-label` on a
 * plain span is the board's markup, copied for this excerpt only (never into the product).
 */
const QUESTIONS = [1, 2, 3, 4, 5, 6];

function DrawnBar() {
  return (
    <header className="xa-bar" data-probe="bar">
      <a className="xr-back" href="#assessments" data-probe="bar-title">
        <svg className="xr-ico" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M14.5 6 8.5 12l6 6" />
        </svg>
        Shell-and-Tube Heat Exchanger
      </a>
      <div className="xa-bar-end">
        <span className="xa-save is-err" role="alert">
          <svg className="xr-ico" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7.5v5.5M12 16.5h.01" />
          </svg>
          Your last answer didn’t save
          <button type="button" className="xr-btn xr-btn--text" style={{ minHeight: 32 }}>
            Try again
          </button>
        </span>
        <span className="xr-avatar" aria-label="Rahul Verma, Student">
          RV
        </span>
      </div>
    </header>
  );
}

export function V46FocusedTask({ bar = 'excerpt' }: { readonly bar?: 'excerpt' | 'drawn' }) {
  return (
    <div className="xr-app" data-probe="app">
      {bar === 'drawn' ? (
        <DrawnBar />
      ) : (
        <header className="xa-bar" data-probe="bar">
          <a className="xr-back" href="#assessments">
            Shell-and-Tube Heat Exchanger
          </a>
          <div className="xa-bar-end">
            <span className="xa-save">Answers save automatically</span>
          </div>
        </header>
      )}
      <main className="xr-page" id="main" tabIndex={-1}>
        <div className="xr-wrap--form xr-content">
          <h1 className="xr-h1">Heat Exchanger — post-lab</h1>
          <nav className="xa-strip" aria-label="Your answers">
            <span className="xa-strip-text" role="status">
              0 of 6 answered
            </span>
            <ol>
              {QUESTIONS.map((n) => (
                <li key={n}>
                  <a
                    href={`#q${n}`}
                    aria-label={`Question ${n}, not answered`}
                    data-probe={`strip-${n}`}
                  >
                    {n}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
          <ol className="xa-qs">
            {QUESTIONS.map((n) => (
              <li className="xa-q" id={`q${n}`} tabIndex={-1} key={n} data-probe={`card-${n}`}>
                <div className="xa-q-head">
                  <span className="xa-q-n">Question {n}</span>
                </div>
                <label className="xr-label" htmlFor={`q${n}-a`}>
                  Your answer
                </label>
                <textarea id={`q${n}-a`} className="xr-textarea" data-probe={`answer-${n}`} />
              </li>
            ))}
          </ol>
          <div className="specimen-spacer" aria-hidden="true" />
        </div>
      </main>
    </div>
  );
}
