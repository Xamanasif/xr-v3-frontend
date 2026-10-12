'use client';

import { useState } from 'react';

import styles from './harness-probe.module.css';

/**
 * The harness's own self-check, not a product component: it proves that a specimen page
 * renders a client component (it hydrates and handles a real click), that container queries
 * resolve against the frame's content width (jsdom cannot do this, Appendix F §7.1), and that
 * the shared browser helpers work here — keyboard walk, wheel reach, axe.
 */
export function HarnessProbe() {
  const [confirmed, setConfirmed] = useState(0);
  return (
    <div className={styles.probe}>
      <h1>Harness probe</h1>
      <div className={styles.layout} data-testid="layout-probe">
        <p>First column</p>
        <p>Second column</p>
      </div>
      <div className={styles.longContent}>Content that pushes the next control below the fold.</div>
      <button type="button" onClick={() => setConfirmed((count) => count + 1)}>
        Confirm
      </button>
      <p role="status">{confirmed === 0 ? 'Not confirmed yet' : `Confirmed ${confirmed}`}</p>
    </div>
  );
}
