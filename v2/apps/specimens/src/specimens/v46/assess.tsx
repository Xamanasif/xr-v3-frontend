/**
 * Stylesheet specimen (WP-0.5, PF-11): the focused-task root of B4-12 "Assessment attempt" —
 * `.xr-app > header.xa-bar + main.xr-page > .xr-wrap--form.xr-content` with the answer strip
 * (`nav.xa-strip`, links to the question anchors) and the questions (`ol.xa-qs > li.xa-q[id]
 * [tabindex=-1]`). `.xa-bar` is sticky at the top (xr-assess.css). Board 12: focus is "never
 * hidden under the top bar or a menu"; PF-11 keeps a focused control clear of the bar while the
 * strip's jumps keep landing where v46 puts them (`.xa-q{scroll-margin-top:72px}`).
 */
const QUESTIONS = [1, 2, 3, 4, 5, 6];

export function V46FocusedTask() {
  return (
    <div className="xr-app" data-probe="app">
      <header className="xa-bar" data-probe="bar">
        <a className="xr-back" href="#assessments">
          Shell-and-Tube Heat Exchanger
        </a>
        <div className="xa-bar-end">
          <span className="xa-save">Answers save automatically</span>
        </div>
      </header>
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
