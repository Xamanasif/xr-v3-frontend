'use client';

/*
 * V3 specimens of IA-01 (Overview) and IA-02 (Content access), composed from @xr/ui/v3 with the
 * IA01 / IA02 boards' illustrative scenarios (scenarios.ts). Harness only: the search and status
 * filter below are the specimen's UI state over the board's one experiment. The product binds its
 * existing content-access read model, plan statuses and grants (apps/web features/institute).
 */
import {
  AttentionPanel,
  Banner,
  Button,
  ButtonLink,
  CodeKey,
  ContentStack,
  CourseCode,
  CourseGroup,
  ExperimentCard,
  FilterToolbar,
  FormatCells,
  FormatKey,
  HiddenHeading,
  IdentityBand,
  InstitutionCode,
  LegendBar,
  LinkTabs,
  ListFoot,
  ListState,
  ListSurface,
  LoadingCards,
  MissingTag,
  PageHead,
  PlanBand,
  PlanNote,
  PlanSheet,
  Split,
  StatusPill,
  Surface,
  TermTrack,
  TextLink,
  VisuallyHidden,
  type ToolbarChip,
} from '@xr/ui/v3';
import { useRef, useState } from 'react';

import {
  IA02_EXPERIMENT,
  IA02_SCENARIOS,
  IA_PLAN_STATUS,
  IN_PLAN_WORDS,
  type IaPlanScenario,
} from './scenarios';
import { InstituteAdminShell } from './shells';

const PLAN_CELLS = IA02_EXPERIMENT.formats.map((cell) => ({
  format: cell.format,
  state: cell.state,
  name: cell.name,
  words: IN_PLAN_WORDS[cell.state],
}));

/** IA-01 Overview, ending-soon scenario ("Wednesday 22 September 2027"). */
export function IaOverviewSpecimen() {
  const date = 'Wednesday 22 September 2027';
  return (
    <InstituteAdminShell current="overview" date={date}>
      <IdentityBand
        title="Godavari Institute of Technology"
        titleId="rb-id-h"
        titlePrefix="Overview, "
        date={date}
        status={
          <>
            <StatusPill tone="warn">Ending soon</StatusPill>
            <span>Access plan ACC-0107 ends on 7 October 2027.</span>
          </>
        }
        actions={
          <>
            <ButtonLink href="#" size="lg" icon="add" iconSize={20}>
              Add students
            </ButtonLink>
            <ButtonLink href="#" variant="primary" size="lg">
              Give students access
            </ButtonLink>
          </>
        }
        term={
          <TermTrack
            label="Yearly term"
            remaining="15 days left"
            start="8 Oct 2026"
            end="7 Oct 2027"
            elapsed={0.9588}
            showRest
            showToday
            description="Access term from 8 October 2026 to 7 October 2027. 349 of 364 days have passed; 15 days are left."
          />
        }
        goTo={{
          label: 'Go to',
          links: [
            { href: '#', label: 'Students', icon: 'people' },
            { href: '#', label: 'Faculty', icon: 'faculty' },
            { href: '/v3-ia-02', label: 'Content access', icon: 'contentAccess' },
            { href: '#', label: 'Requests', icon: 'requests' },
            { href: '#', label: 'Usage', icon: 'usage' },
          ],
        }}
      />
      <Split>
        <AttentionPanel
          title="Needs your attention"
          titleId="rb-att-h"
          note="5 items"
          lead={{
            icon: 'calendar',
            title: 'Request a renewal',
            description:
              'Your plan ends on 7 October. The reminder is due; nothing is sent automatically.',
            action: { href: '#', label: 'Request renewal' },
          }}
          items={[
            {
              key: 'waiting',
              count: 2,
              title: 'students are waiting for a licence',
              description: 'Shell-and-Tube Heat Exchanger',
              action: { href: '#', label: 'View students' },
            },
            {
              key: 'device',
              count: 1,
              title: 'device request to forward to BITS',
              description: 'From Imran Shaikh on 18 September. BITS decides after you forward it.',
              action: { href: '#', label: 'Open requests' },
            },
            {
              key: 'no-access',
              count: 3,
              title: 'students have no access yet',
              description: 'Added on 15 September',
              action: { href: '#', label: 'Review students' },
            },
            {
              key: 'report',
              count: 1,
              title: 'open problem report from your institution',
              description: 'SUP-0213, sent on 20 September',
              action: { href: '#', label: 'View report' },
            },
          ]}
        />
        <PlanSheet
          title="Your access plan"
          titleId="rb-plan-h"
          link={{ href: '#', label: 'View plan ACC-0107' }}
          facts={[
            { term: 'Licences', value: '120, as approved by BITS' },
            { term: 'Term', value: 'Yearly' },
          ]}
          experiment={{
            title: IA02_EXPERIMENT.title,
            course: `${IA02_EXPERIMENT.code} ${IA02_EXPERIMENT.course}`,
            code: (
              <>
                Your course code <CourseCode code="MEC-523" variant="group" />
              </>
            ),
          }}
          formats={
            <FormatCells
              variant="plan"
              label={`Formats of ${IA02_EXPERIMENT.title}`}
              cells={PLAN_CELLS}
            />
          }
          foot={{
            text: 'Students open only the formats you give them on Student access.',
            link: { href: '/v3-ia-02', label: 'Open Content access' },
          }}
        />
      </Split>
    </InstituteAdminShell>
  );
}

export type ContentAccessScenario = IaPlanScenario | 'none';
export type ContentAccessMode = 'ok' | 'loading' | 'failed';

/** IA-02 Content access in one of the IA02 board's scenarios and list presets. */
export function IaContentAccessSpecimen({
  scenario,
  mode: initialMode = 'ok',
  query: initialQuery = '',
}: {
  readonly scenario: ContentAccessScenario;
  readonly mode?: ContentAccessMode;
  readonly query?: string;
}) {
  const [mode, setMode] = useState<ContentAccessMode>(initialMode);
  const [query, setQuery] = useState(initialQuery);
  const [status, setStatus] = useState('all');
  const titleRef = useRef<HTMLHeadingElement>(null);
  const plan = scenario === 'none' ? null : IA02_SCENARIOS[scenario];
  const date = plan ? plan.asOf : 'Thursday 8 October 2026';
  const ok = mode === 'ok';
  const canGive = plan !== null && (plan.plan === 'active' || plan.plan === 'ending');

  const experiment = IA02_EXPERIMENT;
  const needle = query.trim().toLowerCase();
  const matches =
    plan !== null &&
    (!needle ||
      `${experiment.title} ${experiment.code} ${experiment.course}`
        .toLowerCase()
        .includes(needle)) &&
    (status === 'all' || plan.plan === status);
  const chips: ToolbarChip[] = [
    ...(needle
      ? [{ key: 'q', label: `Search: “${query.trim()}”`, onRemove: () => setQuery('') }]
      : []),
    ...(status !== 'all'
      ? [
          {
            key: 'st',
            label: `Status: ${IA_PLAN_STATUS[status as keyof typeof IA_PLAN_STATUS].words}`,
            onRemove: () => setStatus('all'),
          },
        ]
      : []),
  ];
  const planStatus = plan ? IA_PLAN_STATUS[plan.plan] : null;
  const given = plan?.given ?? 0;

  return (
    <InstituteAdminShell current="content-access" date={date}>
      {plan?.plan === 'paused' && ok ? (
        <Banner action={<TextLink href="#">Help</TextLink>}>
          Your institution’s access is paused — your work is kept.
        </Banner>
      ) : null}
      <PageHead
        title="Content access"
        titleId="ca-title"
        titleRef={titleRef}
        titleFocusTarget
        date={date}
        lead="What BITS has given your institution to use"
        actions={
          canGive && ok ? (
            <ButtonLink href="#" variant="primary" size="lg">
              Give students access
            </ButtonLink>
          ) : undefined
        }
      />
      <ContentStack>
        <LinkTabs
          label="Content access"
          tabs={[
            { label: 'Experiments', href: '/v3-ia-02', current: true },
            { label: 'Course codes', href: '#' },
          ]}
        />
        {plan && planStatus && ok ? (
          <PlanBand
            kicker="Access plan"
            name={
              <>
                <VisuallyHidden>Access plan </VisuallyHidden>ACC-0107
              </>
            }
            nameId="ca-plan-h"
            status={<StatusPill tone={planStatus.tone}>{planStatus.words}</StatusPill>}
            line="120 licences, as approved by BITS"
            link={{ href: '#', label: 'View plan', accessibleName: 'View access plan ACC-0107' }}
            term={
              <TermTrack
                inPlanBand
                label="Yearly term"
                remaining={plan.term.remaining}
                remainingTone={plan.term.tone}
                start="8 Oct 2026"
                end="7 Oct 2027"
                elapsed={plan.term.elapsed}
                showRest={plan.term.rest}
                showToday={plan.term.today}
                paused={plan.plan === 'paused'}
                full={plan.plan === 'ended'}
                description={plan.term.description}
              />
            }
            note={
              plan.plan === 'ending' ? (
                <PlanNote
                  tone="warn"
                  title="Ends on 7 Oct 2027"
                  action={
                    <ButtonLink href="#" variant="navy">
                      Request renewal
                    </ButtonLink>
                  }
                >
                  Renewal reminder due. Ask BITS for a renewal from Requests.
                </PlanNote>
              ) : plan.plan === 'ended' ? (
                <PlanNote
                  tone="off"
                  title="This plan has ended"
                  action={
                    <ButtonLink href="#" variant="navy">
                      Request renewal
                    </ButtonLink>
                  }
                >
                  Students can’t open its experiments now. You can still see who had access.
                </PlanNote>
              ) : plan.plan === 'paused' ? (
                <PlanNote tone="paused" title="Read-only while your institution’s access is paused">
                  You can’t give or withdraw access until BITS lifts the pause.
                </PlanNote>
              ) : undefined
            }
          />
        ) : null}
        {plan && ok ? (
          <ListSurface labelledBy="ca-list-h" className="rk-listsurface">
            <HiddenHeading id="ca-list-h">Experiments in your access plan</HiddenHeading>
            <FilterToolbar
              variant="ca"
              label="Filter experiments"
              search={{
                id: 'ca-q',
                label: 'Search',
                placeholder: 'Experiment or course',
                value: query,
                onChange: setQuery,
              }}
              filters={[
                {
                  id: 'ca-st',
                  label: 'Status',
                  size: 'status',
                  value: status,
                  onChange: setStatus,
                  options: [
                    { value: 'all', label: 'All statuses' },
                    { value: 'active', label: 'Active' },
                    { value: 'ending', label: 'Ending soon' },
                    { value: 'ended', label: 'Ended' },
                  ],
                },
              ]}
              count={
                chips.length > 0 ? `${matches ? 1 : 0} of 1 experiment` : '1 experiment in 1 course'
              }
              chips={chips}
              onClearFilters={() => {
                setQuery('');
                setStatus('all');
              }}
            />
            <LegendBar
              formatKey={
                <FormatKey
                  label="Format key"
                  items={[
                    { state: 'on', words: IN_PLAN_WORDS.on },
                    { state: 'pub', words: IN_PLAN_WORDS.pub },
                    { state: 'none', words: IN_PLAN_WORDS.none },
                  ]}
                />
              }
              note="Students open only the formats you give them on Student access."
            />
            {matches && planStatus ? (
              <>
                <CourseGroup
                  code={<CourseCode code={experiment.code} variant="group" />}
                  title={experiment.course}
                  titleId="ca-c-MEZG523"
                  codes={
                    plan.own ? (
                      <>
                        <CodeKey>Your course code</CodeKey>
                        <InstitutionCode code={plan.own} />
                      </>
                    ) : (
                      <>
                        <MissingTag>Your course code: not added</MissingTag>
                        <TextLink
                          href="#"
                          aria-label={`Add your course code for ${experiment.code} ${experiment.course}`}
                        >
                          Add code
                        </TextLink>
                      </>
                    )
                  }
                >
                  <ExperimentCard
                    title={experiment.title}
                    titleId="ca-e-ste"
                    status={<StatusPill tone={planStatus.tone}>{planStatus.words}</StatusPill>}
                    formats={
                      <FormatCells
                        variant="experiment"
                        label={`Formats of ${experiment.title}`}
                        cells={PLAN_CELLS}
                      />
                    }
                    given={{
                      label: 'Students given access',
                      none: 'None yet',
                      count:
                        given > 0
                          ? {
                              text: given === 1 ? '1 student' : `${given} students`,
                              href: '#',
                              accessibleName: `${given === 1 ? '1 student' : `${given} students`} given access to ${experiment.title}. Open Student access`,
                            }
                          : undefined,
                    }}
                    action={
                      canGive ? (
                        <ButtonLink
                          href="#"
                          aria-label={`Give students access to ${experiment.title}`}
                        >
                          Give access
                        </ButtonLink>
                      ) : undefined
                    }
                  />
                </CourseGroup>
                <ListFoot>
                  Only experiments in your access plan are listed. Other published experiments show
                  as “Not in your access plan” when you give students access.
                </ListFoot>
              </>
            ) : (
              <ListState
                kind="nomatch"
                title="No experiments match these filters"
                action={
                  <Button
                    onClick={() => {
                      setQuery('');
                      setStatus('all');
                    }}
                  >
                    Clear filters
                  </Button>
                }
              >
                Try fewer filters or a different spelling of the experiment or course.
              </ListState>
            )}
          </ListSurface>
        ) : null}
        {!plan && ok ? (
          <Surface labelledBy="ca-none-t">
            <ListState
              kind="none"
              roomy
              titleAs="h2"
              titleId="ca-none-t"
              title="No content yet"
              action={<ButtonLink href="#">View request status</ButtonLink>}
            >
              Experiments appear here when BITS activates your institution’s access. Request
              REQ-0042 is approved — payment required.
            </ListState>
          </Surface>
        ) : null}
        {mode === 'loading' ? (
          <Surface label="Content access" busy>
            <LoadingCards message="Loading content access…" />
          </Surface>
        ) : null}
        {mode === 'failed' ? (
          <Surface labelledBy="ca-fail-t">
            <ListState
              kind="failed"
              titleAs="h2"
              titleId="ca-fail-t"
              title="We couldn’t load content access"
              action={
                <Button
                  onClick={() => {
                    setMode('ok');
                    titleRef.current?.focus();
                  }}
                >
                  Try again
                </Button>
              }
            >
              Nothing has changed. Try again.
            </ListState>
          </Surface>
        ) : null}
      </ContentStack>
    </InstituteAdminShell>
  );
}
