import type { Page } from '@playwright/test';
import {
  CANVAS_CLASS_PATTERNS,
  CANVAS_TERMS,
  DEVELOPER_SURFACE_TERMS,
  RECORDED_DOM_TERM_EXCEPTIONS,
} from '@xr/config/policy-terms';

export interface DeveloperSurfaceFinding {
  readonly term: string;
  readonly found: string;
  readonly evidence: string;
}

/** Thrown when a rendered page shows a developer, demo or canvas-only surface. */
export class DeveloperSurfaceError extends Error {
  override readonly name = 'DeveloperSurfaceError';

  constructor(
    message: string,
    readonly findings: readonly DeveloperSurfaceFinding[],
  ) {
    super(message);
  }
}

const COPY_ATTRIBUTES = ['aria-label', 'aria-description', 'title', 'alt', 'placeholder', 'value'];

/**
 * The rendered-DOM half of the owner-constraint scans (Appendix F §7.6): no DEMO banner,
 * "Viewing as", account or role selector, sample-account list, workspace chooser, board
 * control, canvas class or canvas runtime in the page — text, copy attributes, the
 * document title or class names. The term list is shared with the static scans
 * (`@xr/config/policy-terms`).
 *
 * Text that is in the DOM but not displayed counts too (a closed menu, a hidden panel), so a
 * selector built from data cannot hide until opened. Script and style contents are not text.
 */
export async function expectNoDeveloperSurfaces(page: Page): Promise<void> {
  const rendered = await page.evaluate((attributes) => {
    const texts = [document.title];
    if (document.body) {
      // One string, so a phrase split across elements ("Viewing <b>as</b>") still matches.
      const parts: string[] = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        if (node.parentElement?.closest('script, style, noscript, template')) continue;
        parts.push(node.textContent ?? '');
      }
      texts.push(parts.join(' ').replace(/\s+/g, ' ').trim());
    }
    const classes = new Set<string>();
    for (const element of Array.from(document.querySelectorAll('*'))) {
      for (const name of attributes) {
        const value = element.getAttribute(name);
        if (value) texts.push(value);
      }
      for (const token of Array.from(element.classList)) classes.add(token);
    }
    const scripts = Array.from(document.scripts, (script) => script.src).filter(Boolean);
    return { texts, classes: [...classes], scripts };
  }, COPY_ATTRIBUTES);

  const findings: DeveloperSurfaceFinding[] = [];
  for (const term of [...DEVELOPER_SURFACE_TERMS, ...CANVAS_TERMS]) {
    if (!term.scope.includes('dom')) continue;
    // A recorded exception is one exact sentence for one term (`RECORDED_DOM_TERM_EXCEPTIONS`).
    const allowed = RECORDED_DOM_TERM_EXCEPTIONS.filter((exception) => exception.term === term.id);
    for (const text of rendered.texts.map((candidate) =>
      allowed.reduce((rest, exception) => rest.split(exception.text).join(' '), candidate),
    )) {
      const match = term.pattern.exec(text);
      if (match) {
        findings.push({
          term: term.id,
          found: excerpt(text, match.index),
          evidence: term.evidence,
        });
        break;
      }
    }
  }
  for (const token of rendered.classes) {
    if (CANVAS_CLASS_PATTERNS.some((pattern) => pattern.test(token))) {
      findings.push({
        term: 'canvas-class',
        found: `class "${token}"`,
        evidence: 'Appendix F §3.8; Appendix E §10 (canvas-only classes)',
      });
    }
  }
  for (const src of rendered.scripts) {
    if (/support\.js|unpkg\.com\/(?:react|@babel)/.test(src)) {
      findings.push({
        term: 'canvas-runtime',
        found: `script ${src}`,
        evidence: 'CLAUDE.md (runtime/support.js is never copied)',
      });
    }
  }

  if (findings.length > 0) {
    throw new DeveloperSurfaceError(
      `The page shows ${findings.length} developer, demo or canvas-only surface(s):\n${findings
        .map((finding) => `  ${finding.term}: ${finding.found}`)
        .join('\n')}`,
      findings,
    );
  }
}

function excerpt(text: string, index: number): string {
  const start = Math.max(0, index - 20);
  return `"…${text.slice(start, index + 40).replace(/\s+/g, ' ')}…"`;
}
