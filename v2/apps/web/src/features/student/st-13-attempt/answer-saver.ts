'use client';

import type { AttemptSheet } from '@xr/contracts/draft';
import type { AnswerValue, QuestionId } from '@xr/domain';
import { useCallback, useEffect, useRef, useState } from 'react';

import { useCommand } from '@/queries/use-command';

/** The bar's save state (B4-12 f0 … f3): idle, "Saving…", "All answers saved", the failure. */
export type SaveStatus = 'idle' | 'saving' | 'saved' | 'failed';

/** A written answer saves after this pause in typing, or when its field is left (`ST-13.autosave`). */
export const WRITTEN_SAVE_PAUSE_MS = 800;

export interface AnswerSaver {
  /** The answers as the Student has given them on this page (saved or on their way). */
  readonly answers: Readonly<Record<string, AnswerValue>>;
  readonly status: SaveStatus;
  /** A choice: saved at once. */
  choose(questionId: QuestionId, value: AnswerValue): void;
  /** A written answer as typed: saved after a pause. */
  write(questionId: QuestionId, text: string): void;
  /** The written answer's field was left: save it now. */
  leave(questionId: QuestionId): void;
  /** "Try again" in the bar: send what did not save. */
  retry(): void;
  /** Before submitting: save everything still pending; true when all of it saved. */
  settle(): Promise<boolean>;
  /** The attempt's revision after the last save. */
  revision(): number;
  /** A revision read again elsewhere (a stale Submit): the next save and Submit use it. */
  adopt(rev: number): void;
}

/** A save the service refused for good (not a stale revision, not a failure for now). */
export type SaveRefusal = 'invalid-state' | 'not-found' | 'not-permitted' | 'validation-failed';

/**
 * Autosave of ST-13 (board B4-12 "Every answer saves as it changes"; state-copy `ST-13.autosave`):
 * one `saveAnswer` at a time, each with the attempt's latest revision; the answers stay on the
 * page whatever the save's outcome. A failure for now leaves the answer queued for "Try again";
 * a stale revision is read again first (`reread`). A refusal for good (the attempt was submitted
 * elsewhere, is not this Student's, or no longer has the question) drops that save and tells the
 * page (`onRefused`), so Submit is never held back by a save that can never succeed (Phase 4B
 * review).
 */
export function useAnswerSaver(
  sheet: AttemptSheet,
  reread: () => Promise<number | null>,
  onRefused: (kind: SaveRefusal) => void = () => undefined,
): AnswerSaver {
  const save = useCommand((ports) => ports.assessments.saveAnswer);
  const [answers, setAnswers] = useState<Readonly<Record<string, AnswerValue>>>(() => ({
    ...(sheet.answers as Record<string, AnswerValue>),
  }));
  const [status, setStatus] = useState<SaveStatus>('idle');
  const rev = useRef(sheet.rev);
  const queue = useRef(new Map<QuestionId, AnswerValue>());
  const timers = useRef(new Map<QuestionId, ReturnType<typeof setTimeout>>());
  const typed = useRef(new Map<QuestionId, AnswerValue>());
  const running = useRef<Promise<boolean> | null>(null);
  const live = useRef(true);
  const attemptId = sheet.attemptId;
  // The command and the re-read as of the last render: the saving loop outlives renders.
  const latest = useRef({ run: save.run, reread, onRefused });
  useEffect(() => {
    latest.current = { run: save.run, reread, onRefused };
  });

  const setIfLive = useCallback((next: SaveStatus) => {
    if (live.current) setStatus(next);
  }, []);

  const drain = useCallback(async (): Promise<boolean> => {
    for (;;) {
      const next = queue.current.entries().next();
      if (next.done) return true;
      const [questionId, value] = next.value;
      queue.current.delete(questionId);
      const putBack = () => {
        if (!queue.current.has(questionId)) queue.current.set(questionId, value);
      };
      try {
        const result = await latest.current.run({
          attemptId,
          questionId,
          answer: value,
          expectedRev: rev.current,
        });
        if (result.ok) {
          rev.current = result.value.rev;
          continue;
        }
        const kind = result.error.kind;
        if (kind === 'stale-version') {
          putBack();
          const fresh = await latest.current.reread();
          if (fresh !== null) rev.current = fresh;
          return false;
        }
        if (
          kind === 'invalid-state' ||
          kind === 'not-found' ||
          kind === 'not-permitted' ||
          kind === 'validation-failed'
        ) {
          // Refused for good: dropped, never re-sent; the page decides what it means.
          latest.current.onRefused(kind);
          return false;
        }
        putBack();
        return false;
      } catch {
        putBack();
        return false;
      }
    }
  }, [attemptId]);

  const kick = useCallback((): Promise<boolean> => {
    if (running.current) return running.current;
    setIfLive('saving');
    const sent: Promise<boolean> = drain().then((ok) => {
      running.current = null;
      if (!ok) {
        setIfLive('failed');
        return false;
      }
      if (queue.current.size > 0) return kick();
      setIfLive(timers.current.size > 0 ? 'saving' : 'saved');
      return true;
    });
    running.current = sent;
    return sent;
  }, [drain, setIfLive]);

  const enqueue = useCallback(
    (questionId: QuestionId, value: AnswerValue) => {
      queue.current.set(questionId, value);
      void kick();
    },
    [kick],
  );

  /** The written answers still waiting for their pause join the queue now. */
  const releaseTimers = useCallback(() => {
    for (const [questionId, timer] of timers.current) {
      clearTimeout(timer);
      const value = typed.current.get(questionId);
      if (value) queue.current.set(questionId, value);
    }
    timers.current.clear();
  }, []);

  // Leaving the page sends what is still waiting for its pause (nothing typed is dropped). `kick`
  // and `releaseTimers` keep their identity for the attempt, so this runs on leaving only.
  useEffect(() => {
    live.current = true;
    const pending = timers.current;
    return () => {
      live.current = false;
      if (pending.size > 0) {
        releaseTimers();
        void kick();
      }
    };
  }, [kick, releaseTimers]);

  const choose = (questionId: QuestionId, value: AnswerValue) => {
    setAnswers((current) => ({ ...current, [questionId]: value }));
    enqueue(questionId, value);
  };

  const write = (questionId: QuestionId, text: string) => {
    const value: AnswerValue = { type: 'written', text };
    setAnswers((current) => ({ ...current, [questionId]: value }));
    typed.current.set(questionId, value);
    const waiting = timers.current.get(questionId);
    if (waiting) clearTimeout(waiting);
    setStatus('saving');
    timers.current.set(
      questionId,
      setTimeout(() => {
        timers.current.delete(questionId);
        enqueue(questionId, value);
      }, WRITTEN_SAVE_PAUSE_MS),
    );
  };

  const leave = (questionId: QuestionId) => {
    const waiting = timers.current.get(questionId);
    if (!waiting) return;
    clearTimeout(waiting);
    timers.current.delete(questionId);
    const value = typed.current.get(questionId);
    if (value) enqueue(questionId, value);
  };

  const retry = () => {
    void kick();
  };

  const settle = (): Promise<boolean> => {
    releaseTimers();
    if (queue.current.size === 0 && !running.current) return Promise.resolve(true);
    return kick();
  };

  return {
    answers,
    status,
    choose,
    write,
    leave,
    retry,
    settle,
    revision: () => rev.current,
    adopt: (next) => {
      rev.current = next;
    },
  };
}

/** Answered as the boards count it: a choice made, or a written answer with words in it. */
export function isAnswered(value: AnswerValue | undefined): boolean {
  if (!value) return false;
  return value.type !== 'written' || value.text.trim() !== '';
}
