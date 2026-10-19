'use client';

import { Notice } from '@xr/ui/v3';
import { type RefObject, useEffect, useRef, useState } from 'react';

import { weekdayDate } from '@/copy/dates';
import { useSession } from '@/queries/session';

/** What the last action did (`div.rk-notice--ok#sa-flash`): its line and, at times, a next step. */
export interface FlashWords {
  readonly title: string;
  readonly detail?: string;
}

/** The page title, the flash and any element by id: where focus goes after an action. */
export interface StructureFocus {
  readonly titleRef: RefObject<HTMLHeadingElement | null>;
  readonly flashRef: RefObject<HTMLDivElement | null>;
  /** Moves focus after the commit that shows its target: `title`, `flash` or an element id. */
  readonly focus: (target: string) => void;
}

/**
 * Focus moves after the commit that shows its target (the export's `SA.focus(id)`): the flash
 * after a result, a field after an error, the panel's heading after a refused move. A dialog
 * gives focus back to its trigger in the same commit (a child's effect runs first), so this
 * request wins.
 */
export function useStructureFocus(): StructureFocus {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const [request, setRequest] = useState<{ readonly target: string; readonly n: number }>({
    target: '',
    n: 0,
  });
  useEffect(() => {
    if (request.n === 0) return;
    const element =
      request.target === 'flash'
        ? flashRef.current
        : request.target === 'title'
          ? titleRef.current
          : (document.getElementById(request.target) ?? titleRef.current);
    element?.focus();
  }, [request]);
  return {
    titleRef,
    flashRef,
    focus: (target) => setRequest((current) => ({ target, n: current.n + 1 })),
  };
}

/** The flash (`Notice` ok, the export's `SA.flashHtml`): a status that takes focus. */
export function StructureFlash({
  words,
  flashRef,
}: {
  readonly words: FlashWords | null;
  readonly flashRef: RefObject<HTMLDivElement | null>;
}) {
  if (!words) return null;
  return (
    <Notice tone="ok" icon="okDisc" role="status" ref={flashRef} title={words.title}>
      {words.detail}
    </Notice>
  );
}

/**
 * Today on the sample clock in words (“Friday 23 October 2026”): the page head's date on phones
 * (`p.rb-eyebrow-date`; the shell's top line shows it on wider screens). The session's sign-in
 * instant — the screens have no clock of their own (state-copy `SA-01.today`).
 */
export function useTodayWords(): string | undefined {
  const session = useSession();
  return session.status === 'signed-in' ? weekdayDate(session.signedInAt) : undefined;
}
