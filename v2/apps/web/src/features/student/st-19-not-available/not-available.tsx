'use client';

import { type IconName, MessagePage, PageContent } from '@xr/ui';

import { stateWords } from '@/copy/state-copy';
import {
  endedTitle,
  HOME_PAGE,
  NOT_AVAILABLE,
  noLongerLine,
  notGivenLine,
  STUDENT_WORDS,
} from '@/copy/student';
import { MY_COURSES_ADDRESS, STUDENT_HELP_ADDRESS } from '@/nav/student';

import type { NotAvailableKind } from '../shared/student-view';

/** The top bar's title and current crumb on ST-19 (B2-11 f12, B2-12 f4: "My courses / Not available"). */
export const NOT_AVAILABLE_TITLE = NOT_AVAILABLE.title;

/**
 * ST-19 Experiment not available — a state of the experiment hub, not a route (Appendix A §3.6):
 * the Batch-0 message template (board 08) as B2-11 f12, B2-12 f4 and f6 draw it — one icon, the
 * page's only H1, one sentence naming the experiment, "Back to My courses" and Help. The
 * experiment is named from the public catalogue; one it does not name (unknown or unpublished)
 * reads "this experiment", so its existence is not revealed. The icon keeps the boards' neutral
 * tint (`ST-19.tone`; the amber "paused" tone, DEV-16, is owner-deferred).
 */
export function NotAvailable({
  kind,
  name,
}: {
  readonly kind: NotAvailableKind;
  readonly name: string | null;
}) {
  const { icon, title, line } = messageOf(kind, name);
  return (
    <PageContent wrap="read">
      <MessagePage
        icon={icon}
        iconSize={20}
        placement="shell"
        lead
        title={title}
        action={{ href: MY_COURSES_ADDRESS, label: NOT_AVAILABLE.back }}
        secondary={{ href: STUDENT_HELP_ADDRESS, label: STUDENT_WORDS.help }}
        secondaryVariant="text"
      >
        {line}
      </MessagePage>
    </PageContent>
  );
}

function messageOf(
  kind: NotAvailableKind,
  name: string | null,
): { readonly icon: IconName; readonly title: string; readonly line: string } {
  switch (kind) {
    case 'not-given':
      return {
        icon: 'notAvailable',
        title: NOT_AVAILABLE.notGivenTitle,
        line: name ? notGivenLine(name) : stateWords('ST-19.unnamed'),
      };
    case 'no-longer-given':
      return {
        icon: 'notAvailable',
        title: NOT_AVAILABLE.noLongerTitle,
        line: name ? noLongerLine(name) : stateWords('ST-19.no-longer-unnamed'),
      };
    case 'access-ended':
      return {
        icon: 'clock',
        title: name ? endedTitle(name) : stateWords('ST-19.ended-unnamed'),
        line: stateWords('ST-19.ended-line'),
      };
    case 'paused':
      return { icon: 'paused', title: HOME_PAGE.pausedTitle, line: HOME_PAGE.pausedLine };
    case 'inactive':
      return { icon: 'notAvailable', title: HOME_PAGE.inactiveTitle, line: HOME_PAGE.inactiveLine };
    case 'undecided':
      return {
        icon: 'notAvailable',
        title: stateWords('ST-19.undecided'),
        line: stateWords('ST-19.undecided.line'),
      };
  }
}
