'use client';

import { Button, ConfirmDialog, Link, LoadingState, Notice } from '@xr/ui';
import { useEffect, useRef, useState } from 'react';

import { RESET_PAGE } from '@/copy/prototype';
import { useSampleWorldReset } from '@/queries/prototype';

import { DocumentTitle } from '../document-title';
import { PrototypeFrame } from './prototype-frame';

/**
 * TE-6 "Reset demo data" (owner authorisation of Phase 7, 17 Oct 2026; a local prototype build
 * only), at `/prototype/reset`: says what is kept in this browser and what a reset removes, asks
 * once (DL-1, destructive: focus on Cancel), then the platform removes the saved world and this
 * tab's selection and tickets, and the page loads again — the clean world, signed out — with a
 * confirmation. Not a designed v46 screen; it is reached by its address only (the walkthrough
 * names it), never from a designed screen.
 */
export function ResetPage({ done }: { readonly done: boolean }) {
  const { availability, reset } = useSampleWorldReset();
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const noticeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (done || failed) noticeRef.current?.focus();
  }, [done, failed]);

  const confirm = async () => {
    setBusy(true);
    setFailed(false);
    try {
      await reset('/prototype/reset?done=1');
    } catch {
      setBusy(false);
      setAsking(false);
      setFailed(true);
    }
  };

  return (
    <PrototypeFrame>
      <DocumentTitle title={RESET_PAGE.title} />
      <div ref={noticeRef} tabIndex={-1} className="outline-none">
        {done ? (
          <Notice tone="ok" title={RESET_PAGE.doneTitle}>
            {RESET_PAGE.doneLine}
          </Notice>
        ) : null}
        {failed ? (
          <Notice tone="err" title={RESET_PAGE.failedTitle}>
            {RESET_PAGE.failedLine}
          </Notice>
        ) : null}
      </div>
      <h1 className="xp-auth-h">{RESET_PAGE.title}</h1>
      {availability === 'loading' ? (
        <LoadingState label={RESET_PAGE.loading} surface="section" />
      ) : availability === 'not-kept' ? (
        <Notice tone="quiet" title={RESET_PAGE.notKeptTitle}>
          {RESET_PAGE.notKeptLine}
        </Notice>
      ) : (
        <>
          <p className="m-0 text-[15px] leading-[22px] text-ink-2">{RESET_PAGE.intro}</p>
          <p className="m-0 text-[15px] leading-[22px] text-ink-2">{RESET_PAGE.whatHappens}</p>
          <p className="m-0 text-[15px] leading-[22px] text-ink-2">{RESET_PAGE.onlyHere}</p>
          <Button variant="danger" icon="tryAgain" onClick={() => setAsking(true)}>
            {RESET_PAGE.action}
          </Button>
        </>
      )}
      <div className="xp-auth-links">
        <Link href="/">{RESET_PAGE.home}</Link>
        <Link href="/sign-in">{RESET_PAGE.signIn}</Link>
      </div>
      <ConfirmDialog
        open={asking}
        destructive
        title={RESET_PAGE.dialogTitle}
        effects={[RESET_PAGE.dialogLine, ...RESET_PAGE.dialogEffects]}
        confirmLabel={RESET_PAGE.action}
        busy={busy}
        busyLabel={RESET_PAGE.busy}
        cancelLabel={RESET_PAGE.cancel}
        onConfirm={() => void confirm()}
        onCancel={() => {
          if (!busy) setAsking(false);
        }}
      />
    </PrototypeFrame>
  );
}
