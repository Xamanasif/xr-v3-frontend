'use client';

import { Button, IconButton } from '@xr/ui';
import { useState } from 'react';

/**
 * Button and IconButton specimens (Appendix E §3.1; board 03 "Actions", B2-05 busy, board 10
 * dialog Close, B4-05 move up). The press counter is harness state that proves, in a real
 * browser, that a busy button ignores repeat presses.
 */
export function ButtonSpecimen() {
  const [presses, setPresses] = useState(0);
  const busy = presses > 0;
  return (
    <div className="xr-app">
      <main className="xr-page">
        <h1 className="xr-h1">Buttons</h1>
        <div className="xr-phead-actions">
          <Button variant="primary">Give access</Button>
          <Button variant="secondary">Save draft</Button>
          <Button variant="text">View my reports</Button>
          <Button variant="danger">Withdraw access</Button>
          <Button variant="danger-quiet">Deactivate account</Button>
          <Button variant="secondary" size="sm" icon="retry">
            Try again
          </Button>
          <Button variant="primary" disabled>
            Submit feedback
          </Button>
        </div>
        {/* On-dark buttons sit on a navy band (public header, previews); xw-hubhead is one. */}
        <div className="xw-hubhead xr-dark">
          <Button variant="on-dark">Open preview</Button>
        </div>
        <Button
          variant="primary"
          busy={busy}
          busyLabel="Giving access…"
          onClick={() => setPresses((count) => count + 1)}
          data-probe="busy-demo"
        >
          Give access
        </Button>
        <p role="status" data-probe="presses">
          {presses === 0 ? 'Not pressed yet' : `Pressed ${presses}`}
        </p>
      </main>
    </div>
  );
}

export function IconButtonSpecimen() {
  const [moved, setMoved] = useState(0);
  return (
    <div className="xr-app">
      <main className="xr-page">
        <h1 className="xr-h1">Icon buttons</h1>
        <IconButton label="Close" icon="close" />
        <IconButton
          label="Move question 1 up"
          icon="chevronUp"
          disabled
          onClick={() => setMoved((n) => n + 1)}
        />
        <IconButton
          label="Move question 2 up"
          icon="chevronUp"
          onClick={() => setMoved((n) => n + 1)}
        />
        <p role="status" data-probe="moved">{`Moved ${moved}`}</p>
      </main>
    </div>
  );
}
