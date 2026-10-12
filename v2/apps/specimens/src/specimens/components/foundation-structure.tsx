'use client';

import {
  AttentionItem,
  AttentionList,
  Avatar,
  Breadcrumbs,
  Button,
  CountBadge,
  Icon,
  IdChip,
  LogoPlaceholder,
  Num,
  PageHeader,
  Row,
  RowLink,
  Rows,
  Section,
  SectionBody,
  SkipLink,
  Stack,
  TabCount,
  Text,
  VisuallyHidden,
} from '@xr/ui';
import { useRef, useState } from 'react';

/**
 * Foundation structure specimens (Appendix E §3.1: Section / Stack, PageHeader, Breadcrumbs,
 * LogoPlaceholder, Avatar · CountBadge, IdChip, Typography, Rows / AttentionList, SkipLink).
 * Words come from the boards (03, 05, 07, 09a, 11; B2-06). Status chips and button-styled links
 * are drawn as board markup here: their components belong to other groups.
 */

/** Board 05 "My reports" rows (the whole row is one link). */
function MyReportsRows() {
  return (
    <Rows>
      <RowLink
        href="#r1"
        title="VR simulation stopped loading at step 2"
        sub={
          <>
            <IdChip>SUP-0213</IdChip> · sent 3 Oct · Shell-and-Tube Heat Exchanger · VR
          </>
        }
        end={
          <span className="xr-status xr-status--info">
            <Icon name="withAnotherRole" />
            Open
          </span>
        }
      />
      <RowLink
        href="#r2"
        title="Lab brief link opened a blank page"
        sub={
          <>
            <IdChip>SUP-0198</IdChip> · sent 21 Sep · resolved 23 Sep
          </>
        }
        end={
          <span className="xr-status xr-status--ok">
            <Icon name="done" />
            Resolved
          </span>
        }
      />
    </Rows>
  );
}

/**
 * Sections stacked on a record page: titled with rows, titled with a body, a focus-target H2 with a
 * live count (B4-08), an ID in the head (B3-07), labelled, plain, and a plain surface that takes
 * focus after an action (B2-07 "Added", B4-04). The two buttons are harness state: "Add to bank"
 * lowers the count and moves focus to the H2 (B4-08); "Add student" moves focus to the result.
 */
export function SectionSpecimen() {
  const drafts = useRef<HTMLHeadingElement>(null);
  const added = useRef<HTMLDivElement>(null);
  const [left, setLeft] = useState(3);
  return (
    <div className="xr-app" data-probe="app">
      <main className="xr-page">
        <div className="xr-wrap--read xr-content">
          <PageHeader title="Help & support" />
          <Stack>
            <Section title="My reports" meta="2 reports">
              <MyReportsRows />
            </Section>
            <Section title="What you reported">
              <SectionBody>
                <p className="xr-body">
                  The lab brief link on the Resources tab opened a blank page.
                </p>
              </SectionBody>
            </Section>
            <Section
              title="Drafts to review"
              headingFocusTarget
              headingRef={drafts}
              meta={`${left} left to review`}
              metaLive
            >
              <SectionBody>
                <Button
                  variant="secondary"
                  size="sm"
                  data-probe="add-to-bank"
                  onClick={() => {
                    setLeft((count) => Math.max(0, count - 1));
                    drafts.current?.focus();
                  }}
                >
                  Add to bank
                </Button>
              </SectionBody>
            </Section>
            <Section title="Your transfer request" recordId="DTR-0018">
              <SectionBody>
                <span className="xr-status xr-status--info">
                  <Icon name="withAnotherRole" />
                  Forwarded
                </span>
              </SectionBody>
            </Section>
            <Section label="Summary">
              <SectionBody>
                <p className="xr-body">Received 2 Oct 2026, 10:14 · New access</p>
              </SectionBody>
            </Section>
            <Section>
              <div className="xr-empty">
                <p className="xr-h3">No reports yet</p>
                <p className="xr-small">
                  If something isn’t working, report it and follow it here.
                </p>
              </div>
            </Section>
            <Section>
              <SectionBody>
                <Button
                  variant="primary"
                  data-probe="add-student"
                  onClick={() => added.current?.focus()}
                >
                  Add student
                </Button>
              </SectionBody>
            </Section>
            <Section id="Aa-done" focusTarget ref={added}>
              <SectionBody>
                <p className="xr-body">Rahul Verma is in People now, with no experiments yet.</p>
              </SectionBody>
            </Section>
          </Stack>
        </div>
      </main>
    </div>
  );
}

/**
 * A record header (B2-06 / board 03): back link, overline with the ID, the one H1 (a focus
 * target), status in words, one primary. "Save draft" moves focus to the H1, as after an action.
 */
export function PageHeaderSpecimen() {
  const title = useRef<HTMLHeadingElement>(null);
  return (
    <div className="xr-app" data-probe="app">
      <main className="xr-page">
        <div className="xr-wrap--read xr-content">
          <PageHeader
            back={
              <a className="xr-back" href="#students">
                <Icon name="back" />
                Students
              </a>
            }
            overline={
              <>
                Student · <IdChip>GIT-2026-0418</IdChip>
              </>
            }
            title="Rahul Verma"
            titleFocusTarget
            titleRef={title}
            meta={
              <>
                <span className="xr-status xr-status--ok">
                  <Icon name="done" />
                  Account active
                </span>
                <span>Godavari Institute of Technology</span>
              </>
            }
            actions={
              <>
                <Button
                  variant="secondary"
                  onClick={() => title.current?.focus()}
                  data-probe="save"
                >
                  Save draft
                </Button>
                <a className="xr-btn xr-btn--primary" href="#give-access">
                  Give this student access
                </a>
              </>
            }
          />
          <Section title="Experiments given">
            <SectionBody>
              <p className="xr-body">None yet</p>
            </SectionBody>
          </Section>
        </div>
      </main>
    </div>
  );
}

/** The top bar's location: the page title below 1024 px of app width, breadcrumbs from 1024. */
export function BreadcrumbsSpecimen() {
  return (
    <div className="xr-app" data-probe="app">
      <header className="xr-top">
        <div className="xr-top-loc">
          <span className="xr-top-title" data-probe="top-title">
            Rahul Verma
          </span>
          <Breadcrumbs
            trail={[
              { label: 'People', href: '#people' },
              { label: 'Students', href: '#students' },
            ]}
            current="Rahul Verma"
          />
        </div>
      </header>
      <main className="xr-page">
        <PageHeader title="Rahul Verma" />
      </main>
    </div>
  );
}

/** The sidebar head of board 07: the logo placeholder and the product name. */
export function LogoPlaceholderSpecimen() {
  return (
    <div className="xr-app" data-probe="app">
      <aside className="xr-side" aria-label="Student workspace">
        <div className="xr-side-head">
          <LogoPlaceholder />
          <span className="xr-product">XR Learning Platform</span>
        </div>
      </aside>
      <main className="xr-page">
        <PageHeader title="Home" />
      </main>
    </div>
  );
}

/** Avatar in the named account button, a sidebar count in words, tab counts (boards 03, 05). */
export function AvatarCountSpecimen() {
  return (
    <div className="xr-app" data-probe="app">
      <header className="xr-top">
        <div className="xr-top-loc">
          <span className="xr-top-title">People</span>
        </div>
        <div className="xr-acct">
          <button
            type="button"
            className="xr-acct-btn"
            aria-label="Account menu: Meera Iyer, Institute Admin"
          >
            <Avatar initials="MI" />
          </button>
        </div>
      </header>
      <aside className="xr-side" aria-label="Institute Admin workspace">
        <nav aria-label="Institute Admin navigation">
          <ul className="xr-nav">
            <li>
              <a href="#people" aria-current="page">
                <Icon name="studentsPeople" />
                <span className="xr-nav-text">People</span>
              </a>
            </li>
            <li>
              <a href="#requests" data-probe="requests">
                <Icon name="requests" />
                <span className="xr-nav-text">Requests</span>
                <CountBadge count={2} label="2 device requests to forward" />
              </a>
            </li>
          </ul>
        </nav>
      </aside>
      <main className="xr-page">
        <PageHeader title="People" summary="Who is in our institution?" />
        <nav className="xr-tabs" aria-label="People sections">
          <a className="xr-tab" href="#students" aria-current="page">
            Students <TabCount count={214} />
          </a>
          <a className="xr-tab" href="#faculty">
            Faculty <TabCount count={9} />
          </a>
          <a className="xr-tab" href="#groups">
            Groups
          </a>
        </nav>
      </main>
    </div>
  );
}

/** The board-02 workspace type scale, record IDs, tabular figures and screen-reader words. */
export function TypographySpecimen() {
  return (
    <div className="xr-app" data-probe="app">
      <main className="xr-page">
        <div className="xr-wrap--read xr-content">
          <Text variant="overline" id="t-overline">
            Institute Admin
          </Text>
          <Text variant="h1" id="t-h1">
            Give students access
          </Text>
          <Text variant="lead" id="t-lead">
            Choose the experiments to give, then the students.
          </Text>
          <Text variant="display" id="t-display">
            Engineering, made visible
          </Text>
          <Text variant="h2" id="t-h2">
            Needs your attention
          </Text>
          <Text variant="h3" id="t-h3">
            Learning outcomes
          </Text>
          <Text variant="body" id="t-body">
            Your institution’s access to this experiment includes WEB and VR.
          </Text>
          <Text variant="small" id="t-small">
            Sent 3 Oct · reference <IdChip>SUP-0213</IdChip>
          </Text>
          <Text variant="meta" id="t-meta">
            Last changed by Kavya Nair · 2 Oct
          </Text>
          <Text variant="caption" id="t-caption">
            Illustration
          </Text>
          <p className="xr-body">
            <Num>Licences 1,284 of 1,650 · plan ends 30 Jun 2027</Num>
          </p>
          <p className="xr-body">
            Read the{' '}
            <a href="#lab-brief" target="_blank" rel="noopener noreferrer" data-probe="external">
              lab brief<VisuallyHidden> (opens in a new tab)</VisuallyHidden>
            </a>{' '}
            before you start.
          </p>
        </div>
      </main>
    </div>
  );
}

/** Board 03's four attention items with every tone, board 05's row links, board 11's rows. */
export function RowsSpecimen() {
  return (
    <div className="xr-app" data-probe="app">
      <main className="xr-page">
        <div className="xr-wrap--read xr-content">
          <PageHeader overline="Godavari Institute of Technology" title="Overview" />
          <Stack>
            <AttentionList
              title="Needs your attention"
              meta="4 items"
              allClear="Nothing needs you right now"
            >
              <AttentionItem
                icon="attention"
                tone="wait"
                title="Shell-and-Tube Heat Exchanger hasn’t been given to any student"
                sub="ME ZG523 · in access plan ACC-0107"
                action={{ href: '#give-access', label: 'Give access' }}
              />
              <AttentionItem
                icon="studentAccess"
                title="12 students have no access yet"
                sub="Added on 4 Aug by import"
                action={{ href: '#review-students', label: 'Review students' }}
              />
              <AttentionItem
                icon="myDevice"
                tone="info"
                title="2 device requests to forward to BITS"
                sub="Oldest from 29 Sep"
                action={{ href: '#open-requests', label: 'Open requests' }}
              />
              <AttentionItem
                icon="failed"
                tone="err"
                title="1 open problem report from your institution"
                sub="“VR simulation stopped loading” · 3 Oct"
                action={{ href: '#view-report', label: 'View report' }}
              />
            </AttentionList>
            <Section title="My reports" meta="2 reports">
              <MyReportsRows />
            </Section>
            <Section title="What they asked for">
              <Rows>
                <Row title="Shell-and-Tube Heat Exchanger" sub="ME ZG523 · 120 licences · 1 year">
                  <span className="xr-fmt-set">
                    <span className="xr-fmt">WEB</span>
                    <span className="xr-fmt">VR</span>
                  </span>
                </Row>
                <Row title="Forced Convection" sub="ME ZG523 · 120 licences · 1 year">
                  <span className="xr-fmt-set">
                    <span className="xr-fmt">WEB</span>
                  </span>
                </Row>
              </Rows>
            </Section>
          </Stack>
        </div>
      </main>
    </div>
  );
}

/** The attention section with nothing in it (09a AR-1 "nothing needs you"). */
export function AttentionAllClearSpecimen() {
  return (
    <div className="xr-app" data-probe="app">
      <main className="xr-page">
        <div className="xr-wrap--read xr-content">
          <PageHeader overline="Godavari Institute of Technology" title="Overview" />
          <AttentionList
            title="Needs your attention"
            meta="0 items"
            allClear="Nothing needs you right now"
            allClearNote="New items appear here as they come in."
          />
        </div>
      </main>
    </div>
  );
}

/**
 * The skip link first in the shell (boards 05, 12): top-bar controls before `main#main`, which
 * takes `tabIndex={-1}` so focus can move to it. The spacer makes the page scroll.
 */
export function SkipLinkSpecimen() {
  return (
    <div className="xr-app" data-probe="app">
      <SkipLink />
      <header className="xr-top">
        <button type="button" className="xr-menu-btn" aria-label="Open menu">
          <Icon name="menu" />
          <span>Menu</span>
        </button>
        <div className="xr-top-loc">
          <span className="xr-top-title">Help &amp; support</span>
          <Breadcrumbs trail={[]} current="Help & support" />
        </div>
        <div className="xr-acct">
          <button
            type="button"
            className="xr-acct-btn"
            aria-label="Account menu: Meera Iyer, Institute Admin"
          >
            <Avatar initials="MI" />
          </button>
        </div>
      </header>
      <main className="xr-page" id="main" tabIndex={-1}>
        <div className="xr-wrap--read xr-content">
          <PageHeader
            title="Help & support"
            lead="Something isn’t working? Report it here and follow what happens to your report."
            actions={
              <a className="xr-btn xr-btn--primary" href="#report" data-probe="first-in-main">
                Report a problem
              </a>
            }
          />
          <div className="specimen-spacer" />
        </div>
      </main>
    </div>
  );
}
