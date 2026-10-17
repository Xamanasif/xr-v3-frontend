'use client';

import { Button, Field, LoadingState, Notice, Radio, RadioGroup, Select, StatusPill } from '@xr/ui';
import { useEffect, useId, useRef, useState } from 'react';

import { WEB_ACTIVITY } from '@/copy/prototype';
import { type ActivityReportOutcome, useSampleWebActivity } from '@/queries/prototype';

import { DocumentTitle } from '../document-title';
import { highestLevel, LEVELS, measuredValue, type Trial, TRIALS_NEEDED } from './activity-model';
import { PrototypeFrame } from './prototype-frame';

/**
 * The sample WEB activity (TE-3 / T-12; owner authorisation of Phase 7, 17 Oct 2026; a local
 * prototype build only), at `/prototype/web-activity?launch=…` — the page "Launch WEB" opens in a
 * new tab. It is labelled as simulated and claims no real simulation or XR runtime.
 *
 * It connects to the tab that launched it; opening it reports activity ("In progress"), each trial
 * saves progress, and only finishing — after three trials at different levels and the right answer
 * to the check question — reports the completion. The launching tab's platform records every report
 * through the system runtime-report handler, or refuses it (an unknown launch, a format no longer
 * open to the Student). Visiting, launching or opening never completes WEB.
 */
/** The page before the browser has read its address (the server render): connecting. */
export function WebActivityLoading() {
  return (
    <PrototypeFrame wide>
      <DocumentTitle title={WEB_ACTIVITY.title} />
      <h1 className="xp-auth-h">{WEB_ACTIVITY.title}</h1>
      <LoadingState label={WEB_ACTIVITY.connecting} surface="section" />
    </PrototypeFrame>
  );
}

export function WebActivity({ launch }: { readonly launch: string | null }) {
  const activity = useSampleWebActivity(launch);
  const { connection } = activity;
  return (
    <PrototypeFrame wide>
      <DocumentTitle title={WEB_ACTIVITY.title} />
      <div className="flex flex-wrap items-center gap-3">
        <StatusPill tone="info">{WEB_ACTIVITY.simulated}</StatusPill>
      </div>
      <h1 className="xp-auth-h">{WEB_ACTIVITY.title}</h1>
      <p className="m-0 text-[15px] leading-[22px] text-ink-2">{WEB_ACTIVITY.standsIn}</p>
      {connection.status === 'connecting' ? (
        <LoadingState label={WEB_ACTIVITY.connecting} surface="section" />
      ) : connection.status === 'not-connected' ? (
        <Notice tone="warn" title={WEB_ACTIVITY.notConnectedTitle}>
          <p className="m-0">{WEB_ACTIVITY.notConnectedLine}</p>
          <div className="mt-3">
            <Button variant="secondary" icon="tryAgain" onClick={activity.connect}>
              {WEB_ACTIVITY.tryAgain}
            </Button>
          </div>
        </Notice>
      ) : (
        <Rig experimentName={connection.experimentName} report={activity.report} />
      )}
    </PrototypeFrame>
  );
}

type Stage = 'opening' | 'working' | 'refused';

function Rig({
  experimentName,
  report,
}: {
  readonly experimentName: string;
  readonly report: (kind: 'opened' | 'saved' | 'completed') => Promise<ActivityReportOutcome>;
}) {
  const [stage, setStage] = useState<Stage>('opening');
  const opened = useRef(false);

  // Opening the activity is the runtime's "session started": activity, never completion.
  useEffect(() => {
    if (opened.current) return;
    opened.current = true;
    void report('opened').then((outcome) =>
      setStage(outcome === 'refused' ? 'refused' : 'working'),
    );
  }, [report]);

  if (stage === 'opening')
    return <LoadingState label={WEB_ACTIVITY.connecting} surface="section" />;
  if (stage === 'refused') {
    return (
      <Notice tone="err" title={WEB_ACTIVITY.refusedTitle}>
        {WEB_ACTIVITY.refusedLine}
      </Notice>
    );
  }
  return <Steps experimentName={experimentName} report={report} />;
}

function Steps({
  experimentName,
  report,
}: {
  readonly experimentName: string;
  readonly report: (kind: 'opened' | 'saved' | 'completed') => Promise<ActivityReportOutcome>;
}) {
  const [level, setLevel] = useState('1');
  const [trials, setTrials] = useState<readonly Trial[]>([]);
  const [levelError, setLevelError] = useState(false);
  const [saved, setSaved] = useState(false);
  const [answer, setAnswer] = useState<string | null>(null);
  const [answerError, setAnswerError] = useState<'required' | 'wrong' | null>(null);
  const [checked, setChecked] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [outcome, setOutcome] = useState<ActivityReportOutcome | null>(null);
  const outcomeRef = useRef<HTMLDivElement>(null);
  const headingId = useId();

  useEffect(() => {
    if (outcome) outcomeRef.current?.focus();
  }, [outcome]);

  const enough = trials.length >= TRIALS_NEEDED;
  const done = outcome === 'recorded';

  const run = () => {
    const chosen = Number(level);
    if (trials.some((trial) => trial.level === chosen)) {
      setLevelError(true);
      return;
    }
    setLevelError(false);
    setTrials((current) => [
      ...current,
      { level: chosen, value: measuredValue(experimentName, chosen) },
    ]);
    setSaved(false);
    void report('saved').then((result) => setSaved(result === 'recorded'));
  };

  const check = () => {
    if (answer === null) {
      setAnswerError('required');
      return;
    }
    if (Number(answer) !== highestLevel(trials)) {
      setAnswerError('wrong');
      return;
    }
    setAnswerError(null);
    setChecked(true);
  };

  const finish = async () => {
    setFinishing(true);
    setOutcome(null);
    const result = await report('completed');
    setFinishing(false);
    setOutcome(result);
  };

  return (
    <div className="xw-stack xw-stack--16" aria-labelledby={headingId}>
      <p id={headingId} className="m-0 text-[17px] leading-[24px] font-[700] text-ink">
        {experimentName}
      </p>
      <section className="xr-section" aria-labelledby={`${headingId}-how`}>
        <div className="xr-section-head">
          <h2 id={`${headingId}-how`} className="xr-h2">
            {WEB_ACTIVITY.howTitle}
          </h2>
        </div>
        <div className="xr-section-body">
          <p className="m-0 text-[15px] leading-[22px] text-ink-2">{WEB_ACTIVITY.how}</p>
        </div>
      </section>

      <section className="xr-section" aria-labelledby={`${headingId}-s1`}>
        <div className="xr-section-head">
          <h2 id={`${headingId}-s1`} className="xr-h2">
            {WEB_ACTIVITY.step1}
          </h2>
        </div>
        <div className="xr-section-body xw-stack xw-stack--16">
          {!enough ? (
            <div className="flex flex-wrap items-end gap-3">
              <Field
                label={WEB_ACTIVITY.levelLabel}
                hint={WEB_ACTIVITY.levelHint}
                error={levelError ? WEB_ACTIVITY.sameLevel : undefined}
              >
                <Select
                  value={level}
                  onChange={(event) => {
                    setLevel(event.target.value);
                    setLevelError(false);
                  }}
                  options={LEVELS.map((value) => ({
                    value: String(value),
                    label: WEB_ACTIVITY.levelOption(value),
                  }))}
                />
              </Field>
              <Button variant="primary" icon="play" onClick={run}>
                {WEB_ACTIVITY.run}
              </Button>
            </div>
          ) : (
            <Notice tone="ok" title={WEB_ACTIVITY.trialsDone} />
          )}
          <div className="xr-table-wrap">
            <table className="xr-table">
              <caption className="xr-sr">{WEB_ACTIVITY.trialsCaption}</caption>
              <thead>
                <tr>
                  <th scope="col">{WEB_ACTIVITY.trialColumn}</th>
                  <th scope="col">{WEB_ACTIVITY.levelColumn}</th>
                  <th scope="col">{WEB_ACTIVITY.valueColumn}</th>
                </tr>
              </thead>
              <tbody>
                {trials.length === 0 ? (
                  <tr>
                    <td colSpan={3}>{WEB_ACTIVITY.noTrials}</td>
                  </tr>
                ) : (
                  trials.map((trial, index) => (
                    <tr key={trial.level}>
                      <td className="xr-num" data-label={WEB_ACTIVITY.trialColumn}>
                        {index + 1}
                      </td>
                      <td className="xr-num" data-label={WEB_ACTIVITY.levelColumn}>
                        {trial.level}
                      </td>
                      <td className="xr-num" data-label={WEB_ACTIVITY.valueColumn}>
                        {trial.value.toFixed(1)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <p className="m-0 text-[14px] leading-[20px] text-ink-2" role="status">
            {saved ? WEB_ACTIVITY.saved : ''}
          </p>
        </div>
      </section>

      {enough ? (
        <section className="xr-section" aria-labelledby={`${headingId}-s2`}>
          <div className="xr-section-head">
            <h2 id={`${headingId}-s2`} className="xr-h2">
              {WEB_ACTIVITY.step2}
            </h2>
          </div>
          <div className="xr-section-body xw-stack xw-stack--16">
            {checked ? (
              <Notice tone="ok" title={WEB_ACTIVITY.right} />
            ) : (
              <>
                <RadioGroup
                  legend={WEB_ACTIVITY.question}
                  value={answer}
                  onValueChange={(value) => {
                    setAnswer(value);
                    setAnswerError(null);
                  }}
                  error={
                    answerError === 'required'
                      ? WEB_ACTIVITY.answerRequired
                      : answerError === 'wrong'
                        ? WEB_ACTIVITY.wrong
                        : undefined
                  }
                >
                  {trials.map((trial) => (
                    <Radio key={trial.level} value={String(trial.level)}>
                      {WEB_ACTIVITY.levelOption(trial.level)}
                    </Radio>
                  ))}
                </RadioGroup>
                <div>
                  <Button variant="secondary" onClick={check}>
                    {WEB_ACTIVITY.check}
                  </Button>
                </div>
              </>
            )}
          </div>
        </section>
      ) : null}

      {checked ? (
        <section className="xr-section" aria-labelledby={`${headingId}-s3`}>
          <div className="xr-section-head">
            <h2 id={`${headingId}-s3`} className="xr-h2">
              {WEB_ACTIVITY.step3}
            </h2>
          </div>
          <div className="xr-section-body xw-stack xw-stack--16">
            <div ref={outcomeRef} tabIndex={-1} className="outline-none">
              {outcome === 'recorded' ? (
                <Notice tone="ok" title={WEB_ACTIVITY.doneTitle}>
                  {WEB_ACTIVITY.doneLine}
                </Notice>
              ) : outcome === 'refused' ? (
                <Notice tone="err" title={WEB_ACTIVITY.reportRefusedTitle}>
                  {WEB_ACTIVITY.reportRefusedLine}
                </Notice>
              ) : outcome === 'not-confirmed' ? (
                <Notice tone="err" title={WEB_ACTIVITY.reportFailedTitle}>
                  {WEB_ACTIVITY.reportFailedLine}
                </Notice>
              ) : null}
            </div>
            {done ? (
              <div>
                <Button variant="secondary" icon="close" onClick={() => window.close()}>
                  {WEB_ACTIVITY.close}
                </Button>
              </div>
            ) : (
              <>
                <p className="m-0 text-[15px] leading-[22px] text-ink-2">
                  {WEB_ACTIVITY.finishLine}
                </p>
                <div>
                  <Button
                    variant="primary"
                    icon="done"
                    busy={finishing}
                    busyLabel={WEB_ACTIVITY.finishing}
                    onClick={() => void finish()}
                  >
                    {WEB_ACTIVITY.finish}
                  </Button>
                </div>
              </>
            )}
          </div>
        </section>
      ) : null}
    </div>
  );
}
