'use client';

import type { AssessmentListRow, CreateOption, TeachingExperiment } from '@xr/contracts/draft';
import { type ReactNode, useCallback, useLayoutEffect, useState } from 'react';

import { useCreateOptions, useFacultyAssessments, useTeachingExperiment } from '@/queries/teaching';

/** One experiment the Faculty member teaches, as FA-03 and FA-04 show it. */
export interface TaughtExperiment {
  /** The experiment's id, name and the course code Faculty see (`getCreateOptions`). */
  readonly option: CreateOption;
  /** Its formats, per-format counts, course and the formats its Students used. */
  readonly teaching: TeachingExperiment;
  /** The institution's assessment of it, with readiness and figures; `null` while none. */
  readonly assessment: AssessmentListRow | null;
}

export type TaughtRead =
  | { readonly kind: 'loading' }
  | { readonly kind: 'failed'; readonly retry: () => void }
  | { readonly kind: 'ready'; readonly experiments: readonly TaughtExperiment[] };

/** One experiment's teaching read, as its probe last saw it. */
interface ProbeAnswer {
  /** `gone`: refused meanwhile (out of scope once a mapping was removed, or not found). */
  readonly state: 'loading' | 'failed' | 'gone' | 'ready';
  readonly value: TeachingExperiment | null;
  readonly retry: () => void;
}

/** A read answered by a port: failed when unavailable (thrown) or refused with anything else. */
interface PortRead {
  readonly isError: boolean;
  readonly data?: { readonly ok: boolean };
  readonly refetch: () => unknown;
}

function failedOf(read: PortRead): boolean {
  return read.isError || (read.data !== undefined && !read.data.ok);
}

/**
 * Holds one experiment's `getTeachingExperiment` read and reports it to the page (the hook rules
 * allow no loop of reads, so each taught experiment has its own probe). Renders nothing.
 */
function Probe({
  experimentId,
  onAnswer,
}: {
  readonly experimentId: string;
  readonly onAnswer: (experimentId: string, answer: ProbeAnswer) => void;
}) {
  const read = useTeachingExperiment(experimentId);
  const data = read.data;
  const state: ProbeAnswer['state'] = read.isError
    ? 'failed'
    : data === undefined
      ? 'loading'
      : data.ok
        ? 'ready'
        : data.error.kind === 'not-found' || data.error.kind === 'not-permitted'
          ? 'gone'
          : 'failed';
  const value = data?.ok ? data.value : null;
  const { refetch } = read;
  // Before paint, so the page never shows a frame with the previous answer.
  useLayoutEffect(() => {
    onAnswer(experimentId, { state, value, retry: () => void refetch() });
  }, [experimentId, state, value, refetch, onAnswer]);
  return null;
}

/**
 * The experiments the Faculty member teaches, each with its teaching facts and its assessment:
 * `AssessmentService.getCreateOptions` (the taught experiments — Faculty courses ∩ the
 * institution's plans — with the code Faculty see), `TeachingService.getTeachingExperiment` for
 * each (formats, per-format counts, the formats its Students used, its course) and
 * `AssessmentService.listAssessments` (readiness, submitted, reach, waiting for marking). Every read
 * declares its record kinds, so a Faculty course assigned or removed, an assessment created or a
 * runtime report in the same tab refreshes it.
 *
 * `probes` must be rendered by the page (they draw nothing): one per taught experiment, each
 * holding that experiment's read. An experiment refused meanwhile is left out; any read that
 * fails fails the list, and `retry` reads the failed ones again.
 */
export function useTaughtExperiments(): { readonly read: TaughtRead; readonly probes: ReactNode } {
  const options = useCreateOptions();
  const assessments = useFacultyAssessments();
  const [answers, setAnswers] = useState<ReadonlyMap<string, ProbeAnswer>>(new Map());
  const onAnswer = useCallback((experimentId: string, answer: ProbeAnswer) => {
    setAnswers((previous) => {
      const seen = previous.get(experimentId);
      if (seen && seen.state === answer.state && seen.value === answer.value) return previous;
      return new Map(previous).set(experimentId, answer);
    });
  }, []);

  const list = options.data?.ok ? options.data.value : [];
  const probes = list.map((option) => (
    <Probe key={option.experimentId} experimentId={option.experimentId} onAnswer={onAnswer} />
  ));
  const seen = list.map((option) => answers.get(option.experimentId));

  const failedProbes = seen.filter((answer) => answer?.state === 'failed');
  if (failedOf(options) || failedOf(assessments) || failedProbes.length > 0) {
    const retry = () => {
      if (failedOf(options)) void options.refetch();
      if (failedOf(assessments)) void assessments.refetch();
      for (const answer of failedProbes) answer!.retry();
    };
    return { read: { kind: 'failed', retry }, probes };
  }
  if (
    !options.data?.ok ||
    !assessments.data?.ok ||
    seen.some((answer) => answer === undefined || answer.state === 'loading')
  ) {
    return { read: { kind: 'loading' }, probes };
  }
  const rows = assessments.data.value;
  const experiments = list.flatMap((option, index): TaughtExperiment[] => {
    const answer = seen[index]!;
    if (answer.state !== 'ready' || answer.value === null) return [];
    return [
      {
        option,
        teaching: answer.value,
        assessment: rows.find((row) => row.assessment.experimentId === option.experimentId) ?? null,
      },
    ];
  });
  return { read: { kind: 'ready', experiments }, probes };
}
