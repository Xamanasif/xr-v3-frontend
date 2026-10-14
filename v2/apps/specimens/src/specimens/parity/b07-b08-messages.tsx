'use client';

import {
  ErrorSummary,
  HelpReportDetail,
  HelpReportForm,
  HelpSupportHome,
  MessagePage,
  Timeline,
  type IconName,
} from '@xr/ui';

import { ParityItem, ParityPage } from './stage';
import { ParityShell } from './shells';

/**
 * Board 07 states the sample world cannot show on the built screens, with the board's own data
 * (WP-0.15 parity): "1b · Sending" (a command in flight), "2 · My reports" (the Institute Admin's
 * three reports) and "3 · Report detail · resolved with note" (the Faculty member's SUP-0198).
 * Composed as apps/web composes XS-07 (PageContent wrap + the @xr/ui Help templates).
 */
const noop = () => undefined;

export function B07Sending() {
  return (
    <ParityShell
      slug="student"
      banner={null}
      page="help"
      title="Report a problem"
      trail={['Help & support']}
      crumb="Report a problem"
      wrap="form"
    >
      <HelpReportForm
        helpHref="#help"
        what="The VR simulation stopped loading at the second step."
        onWhatChange={noop}
        where="Shell-and-Tube Heat Exchanger · VR"
        onWhereChange={noop}
        sending
        onSend={noop}
      />
    </ParityShell>
  );
}

export function B07InstituteAdminReports() {
  return (
    <ParityShell
      slug="institute-admin"
      banner={null}
      page="help"
      title="Help & support"
      crumb="Help & support"
    >
      <HelpSupportHome
        reportHref="#help"
        countText="3 reports"
        reports={[
          {
            reference: 'SUP-0211',
            title: 'Student import stopped part-way',
            sub: 'sent 1 Oct · reopened 6 Oct',
            href: '#help',
            status: { tone: 'info', label: 'Reopened', icon: 'retry' },
          },
          {
            reference: 'SUP-0209',
            title: 'Usage page took a long time to load',
            sub: 'sent 30 Sep',
            href: '#help',
            status: { tone: 'info', label: 'Open' },
          },
          {
            reference: 'SUP-0189',
            title: 'Group name didn’t save',
            sub: 'sent 15 Sep · resolved 18 Sep',
            href: '#help',
            status: { tone: 'ok', label: 'Resolved' },
          },
        ]}
      />
    </ParityShell>
  );
}

export function B07FacultyDetail() {
  return (
    <ParityShell
      slug="faculty"
      banner={null}
      page="help"
      title="SUP-0198"
      trail={['Help & support']}
      crumb="SUP-0198"
    >
      <HelpReportDetail
        helpHref="#help"
        reportHref="#help"
        reference="SUP-0198"
        title="Lab brief link opened a blank page"
        status={{ tone: 'ok', label: 'Resolved' }}
        sent="21 Sep"
        resolution={{
          date: '23 Sep',
          note: '“The lab brief link was updated. It now opens the brief in a new tab.”',
        }}
        reported={<p data-parity-unused="the facts list is compared on the built screen (s8)" />}
        history={
          <Timeline
            markLatest
            events={[
              { id: 'resolved', what: 'Resolved', when: '23 Sep · resolution note added' },
              { id: 'sent', what: 'Sent', when: '21 Sep' },
            ]}
          />
        }
      />
    </ParityShell>
  );
}

/** Board 08 "The family · same template, different words" (and "In context"). */
export const MESSAGE_FAMILY: readonly {
  readonly id: string;
  readonly icon: IconName;
  readonly tone: 'neutral' | 'ok' | 'warn';
  readonly title: string;
  readonly body: string;
  readonly action: string;
  readonly help: boolean;
}[] = [
  {
    id: 'pu-15-workspace',
    icon: 'search',
    tone: 'neutral',
    title: 'We can’t find that page',
    body: 'The address may be wrong, or the page may have moved.',
    action: 'Back to Home',
    help: true,
  },
  {
    id: 'pu-15-public',
    icon: 'search',
    tone: 'neutral',
    title: 'We can’t find that page',
    body: 'The address may be wrong, or the page may have moved. Published experiments are all in the catalogue.',
    action: 'Browse experiments',
    help: false,
  },
  {
    id: 'xs-06',
    icon: 'readOnly',
    tone: 'neutral',
    title: 'This page isn’t part of your workspace',
    body: 'You’re signed in to the Student workspace. This address belongs to a different workspace.',
    action: 'Back to Home',
    help: true,
  },
  {
    id: 'st-19-not-given',
    icon: 'notAvailable',
    tone: 'neutral',
    title: 'This experiment isn’t available to you',
    body: 'Your institution hasn’t given you access to Forced Convection. Experiments you can open are in My courses.',
    action: 'Back to My courses',
    help: true,
  },
  {
    id: 'st-19-no-longer',
    icon: 'notAvailable',
    tone: 'neutral',
    title: 'You no longer have access to this experiment',
    body: 'Transient Cooling is no longer included in your access.',
    action: 'Back to My courses',
    help: true,
  },
  {
    id: 'access-paused',
    icon: 'paused',
    tone: 'warn',
    title: 'Your institution’s access is paused',
    body: 'Your work is kept.',
    action: 'Back to Home',
    help: true,
  },
  {
    id: 'access-ended',
    icon: 'waiting',
    tone: 'neutral',
    title: 'Your institution’s access to this experiment has ended',
    body: 'Access to Shell-and-Tube Heat Exchanger ended on 30 Jun 2027.',
    action: 'Back to My courses',
    help: true,
  },
  {
    id: 'success',
    icon: 'done',
    tone: 'ok',
    title: 'Feedback sent',
    body: 'Your feedback on VR for Shell-and-Tube Heat Exchanger is saved. It helps improve this experience.',
    action: 'Back to Shell-and-Tube Heat Exchanger',
    help: false,
  },
];

export function B08MessageFamily() {
  return (
    <ParityPage>
      {MESSAGE_FAMILY.map((message) => (
        // Block flow: the board's frame is a plain block, where `.xr-msg{margin:40px auto}` fills
        // the width (in a flex column, auto margins would shrink it to its words).
        <ParityItem key={message.id} id={`msg-${message.id}`} surface="canvas" flow="block">
          <MessagePage
            icon={message.icon}
            iconSize={24}
            // MessagePage has the neutral and success tints only: "Access paused" (amber, board
            // 08) is a Phase-2 screen whose tint the component does not draw yet (DEV-16).
            tone={message.tone === 'ok' ? 'ok' : 'neutral'}
            placement="centered"
            title={message.title}
            action={{ href: '#h-family', label: message.action }}
            {...(message.help ? { secondary: { href: '#h-family', label: 'Help' } } : {})}
          >
            {message.body}
          </MessagePage>
        </ParityItem>
      ))}
    </ParityPage>
  );
}

/** Board 08 "In context · Student workspace · 1312 px": ST-19 in the Student's shell. */
export function B08InContext() {
  return (
    <ParityShell
      slug="student"
      banner={null}
      page="destination"
      current={-1}
      title="Not available"
      trail={['My courses']}
      crumb="Not available"
      wrap="wide"
      helpCurrent={false}
    >
      <MessagePage
        icon="notAvailable"
        iconSize={24}
        placement="shell"
        title="This experiment isn’t available to you"
        action={{ href: '#h-ctx', label: 'Back to My courses' }}
        secondary={{ href: '#h-ctx', label: 'Help' }}
      >
        Your institution hasn’t given you access to Forced Convection. Experiments you can open are
        in My courses.
      </MessagePage>
    </ParityShell>
  );
}

/** B4-04 "Step 2 · validation": the linked ErrorSummary instance (VD-22 baseline). */
export function B404ErrorSummary() {
  return (
    <ParityPage>
      <ParityItem id="errsum" surface="none">
        <ErrorSummary
          title="Check this step"
          items={[
            {
              fieldId: 'Cc2e-pass',
              summaryText: 'Enter a pass mark from 0 to 100, as a whole number',
            },
            {
              fieldId: 'Cc2e-att',
              summaryText: 'Enter how many attempts are allowed, as a whole number',
            },
            { fieldId: 'Cc2e-dl', summaryText: 'Enter the deadline' },
            { fieldId: 'Cc2e-rel', summaryText: 'Choose when students see their result' },
          ]}
        />
      </ParityItem>
    </ParityPage>
  );
}
